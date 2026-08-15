require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { isSupabaseConfigured } = require('./src/config/supabase');
const productsRouter = require('./src/routes/products');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'FarmFresh backend API is running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      products: 'GET /api/products',
      productDetail: 'GET /api/products/:id',
      createProduct: 'POST /api/products',
      updateProduct: 'PUT /api/products/:id',
      deleteProduct: 'DELETE /api/products/:id'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    supabaseConnected: isSupabaseConfigured(),
    timestamp: new Date().toISOString()
  });
});

// API Routers
app.use('/api/products', productsRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`FarmFresh backend running on http://localhost:${PORT}`);
  console.log(`Allowed CORS Origin: ${CLIENT_ORIGIN}`);
});