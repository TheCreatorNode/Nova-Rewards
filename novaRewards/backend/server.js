const express = require('express');
const cors = require('cors');
const { pool, getPoolStatus } = require('./db');
const campaignRoutes = require('./routes/campaignRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const healthCheck = require('./health/healthCheck');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheck.runAllChecks();
    
    // Return 200 if all critical services are ok, 503 otherwise
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('[Health] Error running checks:', error);
    res.status(503).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Pool status endpoint (for monitoring)
app.get('/pool-status', (req, res) => {
  try {
    const status = getPoolStatus();
    res.json({
      ...status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pool status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Pool status: http://localhost:${PORT}/pool-status`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing pool...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
