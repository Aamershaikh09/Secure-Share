import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import multer from 'multer';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import prisma from './src/db/prisma';
import {
  generateVerificationTokenPair,
  hashVerificationToken,
  sendVerificationEmail,
} from './src/services/emailService';
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  verifyEmailQuerySchema,
  createFolderSchema,
  updateFolderSchema,
  updateFileSchema,
  createShareSchema,
  verifySharePasswordSchema,
} from './src/validation/schemas';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.set("trust proxy", 1);

const SHARE_ACCESS_TTL_SECONDS = 15 * 60;
const SHARE_ACCESS_SECRET = process.env.SHARE_ACCESS_SECRET || crypto.randomBytes(32).toString('hex');

// ==========================================
// 1. SECURITY MIDDLEWARE & HEADERS
// ==========================================

// Helmet HTTP Security Headers (relaxed CSP for dev/SPA inline scripts & assets)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(
  cors({
    origin: process.env.APP_BASE_URL || `http://localhost:${PORT}`,
    credentials: true,
  })
);

// Disable X-Powered-By
app.disable('x-powered-by');

// Rate Limiters
// Auth endpoints: 20 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

// Resend verification: Strict 5 requests per hour (per user/IP)
export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification email requests. Please wait an hour before trying again.' },
});

// Email verification token submission: 30 requests per 15 minutes
export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

// Share link password brute-force defense: 10 attempts per 15 minutes
export const sharePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many incorrect passphrase attempts. Please wait 15 minutes.' },
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Storage configuration
const STORAGE_DIR = path.resolve(process.cwd(), process.env.STORAGE_DIR || './storage/uploads');
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Allowed file types allowlist
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'csv', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip', 'sql', 'json', 'md', 'tar', 'gz'
]);

const ALLOWED_MIME_TYPES: Record<string, Set<string>> = {
  pdf: new Set(['application/pdf']),
  txt: new Set(['text/plain']),
  doc: new Set(['application/msword']),
  docx: new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  xls: new Set(['application/vnd.ms-excel']),
  xlsx: new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ppt: new Set(['application/vnd.ms-powerpoint']),
  pptx: new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  csv: new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']),
  jpg: new Set(['image/jpeg']),
  jpeg: new Set(['image/jpeg']),
  png: new Set(['image/png']),
  gif: new Set(['image/gif']),
  webp: new Set(['image/webp']),
  zip: new Set(['application/zip', 'application/x-zip-compressed', 'application/octet-stream']),
  sql: new Set(['application/sql', 'text/plain', 'application/octet-stream']),
  json: new Set(['application/json', 'text/json', 'text/plain']),
  md: new Set(['text/markdown', 'text/plain']),
  tar: new Set(['application/x-tar', 'application/octet-stream']),
  gz: new Set(['application/gzip', 'application/x-gzip', 'application/octet-stream']),
};

// Helper: Safely resolve and jail file paths to STORAGE_DIR (Path Traversal Protection)
function resolveUploadPath(storedName: string): string {
  const basename = path.basename(storedName);
  const resolved = path.resolve(STORAGE_DIR, basename);
  const relative = path.relative(STORAGE_DIR, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

// Multer Storage Configuration (Filesystem persistence with secure UUID names)
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const extMatch = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
    const sanitizedExt = extMatch.replace(/[^a-z0-9]/g, '') || 'bin';
    const uniqueStoredName = `${crypto.randomUUID()}.${sanitizedExt}`;
    cb(null, uniqueStoredName);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extMatch = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
    const ext = extMatch.replace(/[^a-z0-9]/g, '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          `File type .${ext || 'unknown'} is not supported. Supported extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
        )
      );
    }
    const allowedMimes = ALLOWED_MIME_TYPES[ext];
    if (allowedMimes && !allowedMimes.has(file.mimetype)) {
      return cb(new Error(`MIME type ${file.mimetype || 'unknown'} does not match the .${ext} file type.`));
    }
    cb(null, true);
  },
});

// --- Cryptographic Helper Functions ---
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = hashPassword(password, salt);
  const bufA = Buffer.from(calculatedHash, 'hex');
  const bufB = Buffer.from(hash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function createShareAccessToken(shareToken: string): string {
  const payload = { shareToken, exp: Math.floor(Date.now() / 1000) + SHARE_ACCESS_TTL_SECONDS };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', SHARE_ACCESS_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyShareAccessToken(value: string | undefined, expectedShareToken: string): boolean {
  if (!value) return false;
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature) return false;
  try {
    const expectedSignature = crypto.createHmac('sha256', SHARE_ACCESS_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { shareToken?: string; exp?: number };
    return payload.shareToken === expectedShareToken && typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function shareAccessCookieName(shareToken: string): string {
  return `ss_share_access_${crypto.createHash('sha256').update(shareToken).digest('hex').slice(0, 16)}`;
}

function getCookie(req: express.Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

// --- Authentication Middleware ---
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: number;
    storageLimitBytes: bigint;
  };
  token?: string;
}

async function authenticate(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt.getTime(),
      storageLimitBytes: session.user.storageLimitBytes,
    };
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication verification failure.' });
  }
}

// ==========================================
// 2. AUTHENTICATION & EMAIL VERIFICATION
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Validation error in registration data.',
      });
    }

    const { name, email, password } = parsed.data;

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    // Create unverified user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        salt,
        emailVerified: false,
      },
    });

    // Generate cryptographic verification token (raw token is emailed; only SHA-256 hash stored)
    const { rawToken, tokenHash } = generateVerificationTokenPair();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email via SMTP
    await sendVerificationEmail(user.email, user.name, rawToken);

    return res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      email: user.email,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid email or password format.',
      });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const genericAuthError = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({ error: genericAuthError });
    }

    const isMatch = verifyPassword(password, user.passwordHash, user.salt);
    if (!isMatch) {
      return res.status(401).json({ error: genericAuthError });
    }

    // Email verification check: Unverified users CANNOT create a session
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in.',
        unverified: true,
        email: user.email,
      });
    }

    // Create session (valid 30 days)
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.getTime(),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

// GET & POST /api/auth/verify-email
async function handleVerifyEmail(req: express.Request, res: express.Response) {
  try {
    const tokenParam = (req.method === 'GET' ? req.query.token : req.body.token) as string;
    const parsed = verifyEmailQuerySchema.safeParse({ token: tokenParam });

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid or missing verification token.',
      });
    }

    const { token: rawToken } = parsed.data;
    const tokenHash = hashVerificationToken(rawToken);

    // Look up verification token by its SHA-256 hash
    const record = await prisma.verificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      return res.status(400).json({
        error: 'Invalid or unrecognized verification token. Please request a new one.',
      });
    }

    if (record.usedAt) {
      return res.status(400).json({
        error: 'This verification link has already been used. You can proceed directly to login.',
      });
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        error: 'This verification link has expired. Please request a new verification email.',
      });
    }

    // Transactionally mark user as verified and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other pending tokens for this user
      prisma.verificationToken.deleteMany({
        where: {
          userId: record.userId,
          id: { not: record.id },
          usedAt: null,
        },
      }),
    ]);

    return res.json({
      message: 'Email verified successfully. You may now log in to your account.',
      verified: true,
    });
  } catch (err: any) {
    console.error('Email verification error:', err);
    return res.status(500).json({ error: 'Failed to verify email address.' });
  }
}

app.get('/api/auth/verify-email', verifyEmailLimiter, handleVerifyEmail);
app.post('/api/auth/verify-email', verifyEmailLimiter, handleVerifyEmail);

// POST /api/auth/resend-verification
app.post('/api/auth/resend-verification', resendVerificationLimiter, async (req, res) => {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please provide a valid email address.',
      });
    }

    const { email } = parsed.data;

    // Generic safe message (Account Enumeration Defense)
    const genericResponse = {
      message: 'If an unverified account exists for this email address, a verification link has been sent.',
    };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user does not exist or is already verified, return generic response without leaking state
    if (!user || user.emailVerified) {
      return res.json(genericResponse);
    }

    // Invalidate existing unused tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate new token pair
    const { rawToken, tokenHash } = generateVerificationTokenPair();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // Dispatch email
    await sendVerificationEmail(user.email, user.name, rawToken);

    return res.json(genericResponse);
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Failed to process verification resend request.' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.token) {
      await prisma.session.deleteMany({ where: { token: req.token } });
    }
    return res.json({ message: 'Successfully logged out.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error processing logout.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, async (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// ==========================================
// 3. DASHBOARD & STATS
// ==========================================

// GET /api/stats
app.get('/api/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const [sizeAggregate, filesCount, foldersCount, activeSharesCount, recentFiles] =
      await Promise.all([
        prisma.file.aggregate({
          where: { userId },
          _sum: { size: true },
        }),
        prisma.file.count({ where: { userId } }),
        prisma.folder.count({ where: { userId } }),
        prisma.shareLink.count({
          where: {
            userId,
            isRevoked: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }),
        prisma.file.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

    const storageUsedBytes = sizeAggregate._sum.size || 0;
    const storageLimitBytes = Number(req.user!.storageLimitBytes || 10737418240n);

    return res.json({
      storageUsedBytes,
      storageLimitBytes,
      filesCount,
      foldersCount,
      sharesCount: activeSharesCount,
      activeSharesCount,
      recentFiles: recentFiles.map((f) => ({
        id: f.id,
        name: f.originalName,
        originalName: f.originalName,
        size: f.size,
        type: f.mimeType,
        folderId: f.folderId,
        updatedAt: f.updatedAt.getTime(),
      })),
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

// ==========================================
// 4. FOLDERS ENDPOINTS (AUTHORIZATION SECURED)
// ==========================================

// GET /api/folders
app.get('/api/folders', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        files: {
          select: { size: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = folders.map((folder) => {
      const fileCount = folder.files.length;
      const totalSize = folder.files.reduce((acc, curr) => acc + curr.size, 0);
      return {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt.getTime(),
        updatedAt: folder.updatedAt.getTime(),
        fileCount,
        totalSize,
      };
    });

    return res.json(formatted);
  } catch (err: any) {
    console.error('Get folders error:', err);
    return res.status(500).json({ error: 'Failed to retrieve folders.' });
  }
});

// POST /api/folders
app.post('/api/folders', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid folder data.',
      });
    }

    const { name, color } = parsed.data;

    const folder = await prisma.folder.create({
      data: {
        userId: req.user!.id,
        name,
        color: color || '#3b82f6',
      },
    });

    return res.status(201).json({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      createdAt: folder.createdAt.getTime(),
      updatedAt: folder.updatedAt.getTime(),
      fileCount: 0,
      totalSize: 0,
    });
  } catch (err: any) {
    console.error('Create folder error:', err);
    return res.status(500).json({ error: 'Failed to create folder.' });
  }
});

// PATCH /api/folders/:id
app.patch('/api/folders/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid folder name.',
      });
    }

    const { name } = parsed.data;

    // Strict ownership verification: where: { id, userId }
    const updateResult = await prisma.folder.updateMany({
      where: { id, userId: req.user!.id },
      data: { name },
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Folder not found or unauthorized.' });
    }

    const updated = await prisma.folder.findUnique({ where: { id } });
    return res.json({
      id: updated!.id,
      name: updated!.name,
      color: updated!.color,
      createdAt: updated!.createdAt.getTime(),
      updatedAt: updated!.updatedAt.getTime(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update folder.' });
  }
});

// DELETE /api/folders/:id
app.delete('/api/folders/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify folder ownership
    const folder = await prisma.folder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or unauthorized.' });
    }

    // Move child files to root (folderId = null)
    await prisma.file.updateMany({
      where: { folderId: id, userId },
      data: { folderId: null },
    });

    await prisma.folder.delete({
      where: { id },
    });

    return res.json({ message: 'Folder deleted; child files preserved at root.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

// ==========================================
// 5. FILES ENDPOINTS (METADATA + FILESYSTEM)
// ==========================================

// GET /api/files
app.get('/api/files', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { folderId, search } = req.query;

    const whereClause: any = { userId };

    if (folderId === 'root') {
      whereClause.folderId = null;
    } else if (folderId && typeof folderId === 'string' && folderId !== 'all') {
      whereClause.folderId = folderId;
    }

    if (search && typeof search === 'string') {
      whereClause.originalName = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        folder: true,
        shares: {
          where: { isRevoked: false },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = files.map((file) => {
      const activeShares = file.shares.filter(
        (s) => !s.isRevoked && (!s.expiresAt || s.expiresAt.getTime() > Date.now())
      );
      return {
        id: file.id,
        name: file.originalName,
        originalName: file.originalName,
        size: file.size,
        type: file.mimeType,
        mimeType: file.mimeType,
        extension: file.extension,
        folderId: file.folderId,
        folderName: file.folder?.name || 'Root',
        folderColor: file.folder?.color || null,
        createdAt: file.createdAt.getTime(),
        updatedAt: file.updatedAt.getTime(),
        isShared: activeShares.length > 0,
      };
    });

    return res.json(formatted);
  } catch (err: any) {
    console.error('Get files error:', err);
    return res.status(500).json({ error: 'Failed to retrieve files.' });
  }
});

// POST /api/files & POST /api/files/upload (Multipart/form-data upload)
app.post(['/api/files', '/api/files/upload'], authenticate, (req: AuthenticatedRequest, res: express.Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `File exceeds maximum allowed upload size of ${MAX_FILE_SIZE_MB}MB.`,
        });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in multipart request.' });
    }

    const userId = req.user!.id;
    const folderId =
      req.body.folderId && req.body.folderId !== 'root' && req.body.folderId !== 'null'
        ? req.body.folderId
        : null;

    try {
      // Validate folder ownership if provided
      if (folderId) {
        const folder = await prisma.folder.findFirst({
          where: { id: folderId, userId },
        });
        if (!folder) {
          await fs.promises.unlink(req.file.path).catch(() => {});
          return res.status(400).json({ error: 'Target folder does not exist or unauthorized.' });
        }
      }

      // Validate storage quota
      const sizeAgg = await prisma.file.aggregate({
        where: { userId },
        _sum: { size: true },
      });
      const currentUsage = sizeAgg._sum.size || 0;
      const newFileSize = req.file.size;
      const storageLimit = Number(req.user!.storageLimitBytes || 10737418240n);

      if (currentUsage + newFileSize > storageLimit) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(413).json({
          error: `Storage quota exceeded. Used: ${currentUsage} bytes, Limit: ${storageLimit} bytes, File size: ${newFileSize} bytes.`,
        });
      }

      const extMatch = path.extname(req.file.originalname).toLowerCase().replace(/^\./, '');
      const extension = extMatch.replace(/[^a-z0-9]/g, '') || 'bin';
      const storagePath = path.join('storage', 'uploads', req.file.filename);

      // Create PostgreSQL metadata record (Safe metadata only, no raw binary)
      const created = await prisma.file.create({
        data: {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          storagePath,
          mimeType: req.file.mimetype || 'application/octet-stream',
          extension,
          size: req.file.size,
          userId,
          folderId,
        },
        include: { folder: true },
      });

      return res.status(201).json({
        id: created.id,
        name: created.originalName,
        originalName: created.originalName,
        size: created.size,
        type: created.mimeType,
        mimeType: created.mimeType,
        extension: created.extension,
        folderId: created.folderId,
        folderName: created.folder?.name || 'Root',
        folderColor: created.folder?.color || null,
        createdAt: created.createdAt.getTime(),
        updatedAt: created.updatedAt.getTime(),
        isShared: false,
      });
    } catch (dbErr: any) {
      console.error('Database metadata insertion error:', dbErr);
      // Clean up newly created physical file to avoid orphaned storage
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      return res.status(500).json({ error: 'Failed to record file metadata in database.' });
    }
  });
});

// GET /api/files/:id/download (Physical file streaming)
app.get('/api/files/:id/download', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Strict ownership verification: where: { id, userId }
    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }

    let filePath: string;
    try {
      filePath = resolveUploadPath(file.storedName);
    } catch {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical file is missing from storage.' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );
    res.setHeader('Content-Length', file.size);

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file from disk.' });
      }
    });
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve download stream.' });
  }
});

// PATCH /api/files/:id (Rename display name or Move folder)
app.patch('/api/files/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateFileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid file update parameters.',
      });
    }

    const { name, folderId } = parsed.data;
    const userId = req.user!.id;

    // Strict ownership verification
    const existing = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }

    const updateData: any = {};
    if (name !== undefined) {
      updateData.originalName = name;
    }

    if (folderId !== undefined) {
      if (folderId !== null && folderId !== 'null') {
        const folder = await prisma.folder.findFirst({
          where: { id: folderId, userId },
        });
        if (!folder) {
          return res.status(400).json({ error: 'Destination folder does not exist or unauthorized.' });
        }
        updateData.folderId = folderId;
      } else {
        updateData.folderId = null;
      }
    }

    // Physical storedName and storagePath remain untouched!
    const updated = await prisma.file.update({
      where: { id },
      data: updateData,
      include: { folder: true },
    });

    return res.json({
      id: updated.id,
      name: updated.originalName,
      originalName: updated.originalName,
      size: updated.size,
      type: updated.mimeType,
      mimeType: updated.mimeType,
      extension: updated.extension,
      folderId: updated.folderId,
      folderName: updated.folder?.name || 'Root',
      folderColor: updated.folder?.color || null,
      updatedAt: updated.updatedAt.getTime(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update file.' });
  }
});

// DELETE /api/files/:id (Delete DB metadata + Physical file)
app.delete('/api/files/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Strict ownership verification: where: { id, userId }
    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }

    // Remove the physical object first so a successful API response never knowingly
    // leaves an accessible orphaned file behind. If deletion fails, retain metadata
    // so the operation can be retried safely.
    const filePath = resolveUploadPath(file.storedName);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (fsErr) {
      console.error('Physical file deletion error:', fsErr);
      return res.status(500).json({ error: 'Unable to remove the physical file from storage.' });
    }

    await prisma.file.delete({ where: { id: file.id } });

    return res.json({ success: true, message: 'File and associated shares deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete file.' });
  }
});

// ==========================================
// 6. FILE SHARING MANAGEMENT
// ==========================================

// GET /api/shares
app.get('/api/shares', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const shares = await prisma.shareLink.findMany({
      where: { userId },
      include: { file: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const formatted = shares.map((share) => {
      let status: 'active' | 'expired' | 'revoked' = 'active';
      if (share.isRevoked) {
        status = 'revoked';
      } else if (share.expiresAt && share.expiresAt.getTime() <= now) {
        status = 'expired';
      }

      return {
        id: share.id,
        token: share.token,
        fileId: share.fileId,
        fileName: share.file?.originalName || 'Deleted File',
        fileSize: share.file?.size || 0,
        fileType: share.file?.mimeType || 'application/octet-stream',
        hasPassword: share.hasPassword,
        expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
        isRevoked: share.isRevoked,
        viewsCount: share.viewsCount,
        downloadsCount: share.downloadsCount,
        createdAt: share.createdAt.getTime(),
        status,
      };
    });

    return res.json(formatted);
  } catch (err: any) {
    console.error('Get shares error:', err);
    return res.status(500).json({ error: 'Failed to retrieve shared links.' });
  }
});

// POST /api/shares (Generate Share Link)
app.post('/api/shares', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = createShareSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid share parameters.',
      });
    }

    const { fileId, password, expiresInHours } = parsed.data;
    const userId = req.user!.id;

    // Strict ownership verification: file must belong to authenticated user
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }

    const token = generateShareToken();
    let passwordHash: string | null = null;
    let salt: string | null = null;
    let hasPassword = false;

    if (password && password.trim()) {
      hasPassword = true;
      salt = crypto.randomBytes(16).toString('hex');
      passwordHash = hashPassword(password.trim(), salt);
    }

    let expiresAt: Date | null = null;
    if (expiresInHours && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const share = await prisma.shareLink.create({
      data: {
        token,
        fileId,
        userId,
        hasPassword,
        passwordHash,
        salt,
        expiresAt,
      },
      include: { file: true },
    });

    return res.status(201).json({
      id: share.id,
      token: share.token,
      fileId: share.fileId,
      fileName: share.file.originalName,
      fileSize: share.file.size,
      fileType: share.file.mimeType,
      hasPassword: share.hasPassword,
      expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
      isRevoked: share.isRevoked,
      viewsCount: 0,
      downloadsCount: 0,
      createdAt: share.createdAt.getTime(),
      status: 'active',
    });
  } catch (err: any) {
    console.error('Create share error:', err);
    return res.status(500).json({ error: 'Failed to create share link.' });
  }
});

// DELETE /api/shares/:token (Revoke Share Link)
app.delete('/api/shares/:token', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    // Strict ownership verification: where: { token, userId }
    const updateResult = await prisma.shareLink.updateMany({
      where: { token, userId },
      data: { isRevoked: true },
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ error: 'Share link not found or unauthorized.' });
    }

    return res.json({ success: true, message: 'Share link revoked successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to revoke share link.' });
  }
});

// ==========================================
// 7. PUBLIC SHARE RECIPIENT ACCESS (STREAMED)
// ==========================================

// GET /api/public/share/:token (Public share info inspection)
app.get('/api/public/share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true },
    });

    if (!share) {
      return res.status(404).json({ status: 'not_found', message: 'Share link not found.' });
    }

    if (share.isRevoked) {
      return res.status(403).json({
        status: 'revoked',
        message: 'This share link has been revoked by the owner.',
      });
    }

    if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({
        status: 'expired',
        message: 'This share link has expired.',
        expiresAt: share.expiresAt.getTime(),
      });
    }

    if (!share.file) {
      return res.status(404).json({ status: 'file_missing', message: 'Target file no longer exists.' });
    }

    // Atomically increment views count
    await prisma.shareLink.update({
      where: { token },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    // Password protected
    if (share.hasPassword) {
      return res.json({
        status: 'password_required',
        fileName: share.file.originalName,
        fileSize: share.file.size,
        fileType: share.file.mimeType,
        hasPassword: true,
        expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
      });
    }

    // Unrestricted share info (Safe metadata only)
    return res.json({
      status: 'active',
      fileName: share.file.originalName,
      fileSize: share.file.size,
      fileType: share.file.mimeType,
      hasPassword: false,
      expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
      file: {
        name: share.file.originalName,
        size: share.file.size,
        type: share.file.mimeType,
      },
    });
  } catch (err: any) {
    console.error('Public share get error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

// POST /api/public/share/:token/verify-password
app.post(
  ['/api/public/share/:token/verify-password', '/api/public/share/:token/verify'],
  sharePasswordLimiter,
  async (req, res) => {
    try {
      const { token } = req.params;
      const parsed = verifySharePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Passphrase is required.',
        });
      }

      const { password } = parsed.data;

      const share = await prisma.shareLink.findUnique({
        where: { token },
        include: { file: true },
      });

      if (!share) {
        return res.status(404).json({ error: 'Share link not found.' });
      }

      if (share.isRevoked) {
        return res.status(403).json({ error: 'This share link has been revoked.' });
      }

      if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
        return res.status(410).json({ error: 'This share link has expired.' });
      }

      if (!share.file) {
        return res.status(404).json({ error: 'Target file no longer exists.' });
      }

      if (!share.hasPassword || !share.passwordHash || !share.salt) {
        return res.json({
          message: 'Access granted.',
          file: {
            name: share.file.originalName,
            size: share.file.size,
            type: share.file.mimeType,
          },
        });
      }

      const isMatch = verifyPassword(password, share.passwordHash, share.salt);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect passphrase.' });
      }

      const accessToken = createShareAccessToken(token);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader(
        'Set-Cookie',
        `${shareAccessCookieName(token)}=${encodeURIComponent(accessToken)}; Max-Age=${SHARE_ACCESS_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`
      );

      return res.json({
        message: 'Access granted.',
        file: {
          name: share.file.originalName,
          size: share.file.size,
          type: share.file.mimeType,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Verification failure.' });
    }
  }
);

// GET /api/public/share/:token/download (Direct binary streaming from filesystem)
app.get('/api/public/share/:token/download', async (req, res) => {
  try {
    const { token } = req.params;
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true },
    });

    if (!share || !share.file) {
      return res.status(404).send('Share link or file not found.');
    }

    if (share.isRevoked) {
      return res.status(403).send('This share link has been revoked by the owner.');
    }

    if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
      return res.status(410).send('This share link has expired.');
    }

    if (share.hasPassword) {
      const accessCookie = getCookie(req, shareAccessCookieName(token));
      if (!verifyShareAccessToken(accessCookie, token)) {
        return res.status(401).send('Password verification is required before downloading this file.');
      }
    }

    let filePath: string;
    try {
      filePath = resolveUploadPath(share.file.storedName);
    } catch {
      return res.status(400).send('Invalid file path.');
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Physical file is missing from storage.');
    }

    // Increment download counter atomically
    await prisma.shareLink.update({
      where: { token },
      data: { downloadsCount: { increment: 1 } },
    }).catch(() => {});

    res.setHeader('Content-Type', share.file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(share.file.originalName)}"`
    );
    res.setHeader('Content-Length', share.file.size);

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Public download stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Streaming error.');
      }
    });
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).send('Download stream failed.');
  }
});

// Centralized Safe Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || 'Validation error.' });
  }
  return res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// ==========================================
// 8. VITE SSR / STATIC CLIENT INTEGRATION
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SecureShare server running on port ${PORT} with filesystem storage at: ${STORAGE_DIR}`);
  });
}

startServer();
