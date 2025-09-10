import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Admin Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  res.json({
    totalQuestions: 42,
    totalFAQs: 15,
    activeUsers: 8,
    systemHealth: 'Healthy'
  });
});

app.get('/api/faqs', (req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      question: 'Sample FAQ Question',
      answer: 'Sample FAQ Answer',
      category: 'general',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);
});

// Auth endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      token: 'sample-jwt-token',
      user: { username: 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
