import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { prisma } from './utils/prisma';

// Import routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import productsRoutes from './routes/products.routes';
import rawMaterialsRoutes from './routes/raw-materials.routes';
import bomRoutes from './routes/bom.routes';
import productionRequestsRoutes from './routes/production-requests.routes';
import dashboardRoutes from './routes/dashboard.routes';
import shopifyRoutes from './routes/shopify.routes';
import inventoryAdjustmentsRoutes from './routes/inventory-adjustments.routes';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Replit compatibility
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow configured origin
    if (origin === config.cors.origin) return callback(null, true);
    
    // Allow Replit preview URLs
    if (origin.includes('.repl.co') || origin.includes('.replit.dev')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Health check (with CORS enabled)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  name: 'tea-inventory-session', // Custom session name
  cookie: {
    // On Replit, we need secure cookies because sameSite='none' requires secure=true
    secure: config.nodeEnv === 'production', // Always use secure in production
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: process.env.REPL_SLUG ? 'none' : 'lax', // Use 'none' for Replit cross-origin
  },
  rolling: true, // Reset expiration on activity
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/raw-materials', rawMaterialsRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/production-requests', productionRequestsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/inventory-adjustments', inventoryAdjustmentsRoutes);

// Serve frontend in production (for Replit)
if (config.nodeEnv === 'production') {
  const path = require('path');
  // Use process.cwd() for more reliable path resolution in production
  const frontendPath = path.resolve(process.cwd(), '../frontend/build');
  
  console.log('Serving static files from:', frontendPath);
  app.use(express.static(frontendPath));
  
  // Handle React routing, return index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(frontendPath, 'index.html');
      console.log('Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    }
  });
}

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Import backup scheduler and activity logger
import { scheduleBackups } from './utils/backup';
import { initActivityLogs } from './utils/activity-logger';

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Initialize activity logs
    await initActivityLogs();
    
    // Start automatic backups
    scheduleBackups();
    
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log('🔄 Automatic backups scheduled');
      console.log('📊 Activity logging enabled');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();