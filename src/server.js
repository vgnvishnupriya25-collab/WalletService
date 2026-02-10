const express = require('express');
const walletRoutes = require('./routes/walletRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/wallet', walletRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wallet service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
