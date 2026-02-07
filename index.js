import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();



// Enable CORS for all origins without credentials
app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database connection test
app.get('/_db-test', async (req, res) => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ db: 'failed' });
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    console.log('Signup hit', req.body);
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    
    const { email, password, name, orgName } = req.body;
    
    // For MVP - just create a user with basic validation
    const user = await prisma.user.create({
      data: {
        email: email,
        password: password, // TODO: bcrypt hash
        name: name || 'User'
      }
    });
    
    return res.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Signup error', err);
    return res.status(500).json({ error: 'Signup failed', message: err.message });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✅ Backend server started`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   GET /health endpoint ready\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
