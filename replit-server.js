// Ultra-simple server for Replit - no build step required
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('frontend/build'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tea Inventory System is running',
    timestamp: new Date().toISOString() 
  });
});

// Mock API endpoints for testing
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple mock authentication
  if (username === 'admin' && password === 'admin123') {
    res.json({
      id: 1,
      username: 'admin',
      role: 'ADMIN'
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Green Tea', sku: 'GT001', stockQuantity: 100 },
    { id: 2, name: 'Black Tea', sku: 'BT001', stockQuantity: 50 }
  ]);
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalProducts: 2,
    totalMaterials: 5,
    pendingRequests: 1,
    lowStockProducts: 0
  });
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'frontend/build/index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <h1>Tea Inventory System</h1>
      <p>Backend is running! Frontend build not found.</p>
      <p>API Health: <a href="/api/health">/api/health</a></p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Visit: ${process.env.REPLIT_URL || `http://localhost:${PORT}`}`);
});