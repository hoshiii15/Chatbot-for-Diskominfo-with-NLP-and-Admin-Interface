"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Admin Backend is running',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        totalQuestions: 42,
        totalFAQs: 15,
        activeUsers: 8,
        systemHealth: 'Healthy'
    });
});
app.get('/api/faqs', (req, res) => {
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
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            token: 'sample-jwt-token',
            user: { username: 'admin', role: 'admin' }
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=simple-app.js.map