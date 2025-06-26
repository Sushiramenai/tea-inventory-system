const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// No rate limiting in this simplified version for better development experience

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'replit-default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const bcrypt = require('bcryptjs');
    
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.productInventory.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await prisma.productInventory.create({
      data: req.body
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Raw materials routes
app.get('/api/raw-materials', async (req, res) => {
  try {
    const materials = await prisma.rawMaterial.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw materials' });
  }
});

app.post('/api/raw-materials', async (req, res) => {
  try {
    const material = await prisma.rawMaterial.create({
      data: req.body
    });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create raw material' });
  }
});

// BOM routes
app.get('/api/bom', async (req, res) => {
  try {
    const bom = await prisma.billOfMaterials.findMany({
      include: {
        product: true,
        rawMaterial: true
      }
    });
    res.json(bom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch BOM' });
  }
});

app.post('/api/bom', async (req, res) => {
  try {
    const bom = await prisma.billOfMaterials.create({
      data: req.body,
      include: {
        product: true,
        rawMaterial: true
      }
    });
    res.json(bom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create BOM entry' });
  }
});

// Production requests routes
app.get('/api/production-requests', async (req, res) => {
  try {
    const requests = await prisma.productionRequest.findMany({
      where: { isDeleted: false },
      include: {
        product: true,
        requestedBy: true,
        completedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production requests' });
  }
});

app.post('/api/production-requests', async (req, res) => {
  try {
    const request = await prisma.productionRequest.create({
      data: {
        ...req.body,
        requestedById: req.session.userId
      },
      include: {
        product: true,
        requestedBy: true
      }
    });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create production request' });
  }
});

// Dashboard route
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [totalProducts, totalMaterials, pendingRequests, lowStockProducts] = await Promise.all([
      prisma.productInventory.count({ where: { isDeleted: false } }),
      prisma.rawMaterial.count({ where: { isDeleted: false } }),
      prisma.productionRequest.count({ 
        where: { 
          status: 'PENDING',
          isDeleted: false 
        } 
      }),
      prisma.productInventory.count({
        where: {
          stockQuantity: { lte: 10 },
          isDeleted: false
        }
      })
    ]);

    res.json({
      totalProducts,
      totalMaterials,
      pendingRequests,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/build');
  
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
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

start();