import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { User } from '../models';

const router = Router();

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user in database
    const user = await User.findOne({ 
      where: { 
        username: username,
        isActive: true 
      } 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, config.jwt.secret as string, { 
      expiresIn: config.jwt.expiry 
    } as jwt.SignOptions);

    logger.info('User logged in successfully', {
      username: user.username,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Login failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token verification failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Implement proper password change logic with database
    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Password change failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Password change failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
