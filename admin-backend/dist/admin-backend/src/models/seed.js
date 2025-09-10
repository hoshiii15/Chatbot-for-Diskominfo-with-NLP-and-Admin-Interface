"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("./index");
const logger_1 = require("../utils/logger");
const seedDatabase = async () => {
    try {
        logger_1.logger.info('Starting database seeding...');
        await seedUsers();
        await seedFAQs();
        await seedWebsites();
        await seedAnalytics();
        logger_1.logger.info('Database seeding completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Database seeding failed:', error);
        throw error;
    }
};
exports.seedDatabase = seedDatabase;
const seedUsers = async () => {
    const existingUser = await index_1.User.findOne({ where: { username: 'admin' } });
    if (!existingUser) {
        const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
        await index_1.User.create({
            username: 'admin',
            email: 'admin@diskominfo.go.id',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'System',
            role: 'admin',
            isActive: true,
        });
        logger_1.logger.info('Default admin user created');
    }
    else {
        logger_1.logger.info('Admin user already exists');
    }
};
const seedFAQs = async () => {
    const faqCount = await index_1.FAQ.count();
    if (faqCount === 0) {
        const sampleFAQs = [
            {
                question: 'Apa itu stunting?',
                answer: 'Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis sehingga anak terlalu pendek untuk usianya.',
                category: 'definisi',
                environment: 'stunting',
                keywords: ['stunting', 'definisi', 'gagal tumbuh', 'balita'],
                isActive: true,
                priority: 10,
                views: 0,
            },
            {
                question: 'Bagaimana cara mencegah stunting?',
                answer: 'Pencegahan stunting dapat dilakukan dengan memberikan nutrisi yang baik selama 1000 hari pertama kehidupan, mulai dari masa kehamilan hingga anak berusia 2 tahun.',
                category: 'pencegahan',
                environment: 'stunting',
                keywords: ['pencegahan', 'nutrisi', '1000 hari pertama'],
                isActive: true,
                priority: 9,
                views: 0,
            },
            {
                question: 'Apa saja tanda-tanda stunting?',
                answer: 'Tanda-tanda stunting meliputi tinggi badan anak lebih pendek dari standar usianya, berat badan rendah, dan perkembangan otak terhambat.',
                category: 'gejala',
                environment: 'stunting',
                keywords: ['tanda', 'gejala', 'tinggi badan', 'berat badan'],
                isActive: true,
                priority: 8,
                views: 0,
            },
            {
                question: 'Apa itu PPID?',
                answer: 'PPID (Pejabat Pengelola Informasi dan Dokumentasi) adalah pejabat yang bertanggung jawab dalam penyimpanan, pendokumentasian, penyediaan, dan/atau pelayanan informasi di badan publik.',
                category: 'definisi',
                environment: 'ppid',
                keywords: ['PPID', 'definisi', 'informasi', 'dokumentasi'],
                isActive: true,
                priority: 10,
                views: 0,
            },
            {
                question: 'Bagaimana cara mengajukan permohonan informasi?',
                answer: 'Permohonan informasi dapat diajukan secara tertulis atau lisan kepada PPID dengan mengisi formulir yang tersedia dan melampirkan identitas diri.',
                category: 'prosedur',
                environment: 'ppid',
                keywords: ['permohonan', 'informasi', 'prosedur', 'formulir'],
                isActive: true,
                priority: 9,
                views: 0,
            },
        ];
        await index_1.FAQ.bulkCreate(sampleFAQs);
        logger_1.logger.info('Sample FAQs created');
    }
    else {
        logger_1.logger.info('FAQs already exist');
    }
};
const seedWebsites = async () => {
    const websiteCount = await index_1.Website.count();
    if (websiteCount === 0) {
        const sampleWebsites = [
            {
                name: 'Portal Stunting Diskominfo',
                url: 'https://stunting.diskominfo.go.id',
                environment: 'stunting',
                description: 'Portal informasi stunting resmi Diskominfo',
                isActive: true,
                settings: {
                    chatWidget: true,
                    analytics: true,
                    theme: 'blue',
                },
                status: 'online',
            },
            {
                name: 'Portal PPID Diskominfo',
                url: 'https://ppid.diskominfo.go.id',
                environment: 'ppid',
                description: 'Portal PPID resmi Diskominfo',
                isActive: true,
                settings: {
                    chatWidget: true,
                    analytics: true,
                    theme: 'green',
                },
                status: 'online',
            },
        ];
        await index_1.Website.bulkCreate(sampleWebsites);
        logger_1.logger.info('Sample websites created');
    }
    else {
        logger_1.logger.info('Websites already exist');
    }
};
const seedAnalytics = async () => {
    const analyticsCount = await index_1.Analytics.count();
    if (analyticsCount === 0) {
        const today = new Date();
        const sampleAnalytics = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            sampleAnalytics.push({
                date: dateString,
                environment: 'stunting',
                totalQuestions: Math.floor(Math.random() * 100) + 50,
                totalSessions: Math.floor(Math.random() * 50) + 20,
                averageConfidence: 0.8 + Math.random() * 0.15,
                averageResponseTime: 150 + Math.random() * 100,
                uniqueUsers: Math.floor(Math.random() * 30) + 15,
                popularQuestions: [
                    { question: 'Apa itu stunting?', count: Math.floor(Math.random() * 20) + 10 },
                    { question: 'Cara mencegah stunting', count: Math.floor(Math.random() * 15) + 8 },
                ],
                categoryDistribution: [
                    { category: 'definisi', count: Math.floor(Math.random() * 30) + 15 },
                    { category: 'pencegahan', count: Math.floor(Math.random() * 25) + 10 },
                ],
                confidenceDistribution: [
                    { range: '0.9-1.0', count: Math.floor(Math.random() * 40) + 20 },
                    { range: '0.7-0.9', count: Math.floor(Math.random() * 20) + 10 },
                ],
                hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
                    hour,
                    count: Math.floor(Math.random() * 10),
                })),
            });
            sampleAnalytics.push({
                date: dateString,
                environment: 'ppid',
                totalQuestions: Math.floor(Math.random() * 60) + 30,
                totalSessions: Math.floor(Math.random() * 30) + 15,
                averageConfidence: 0.75 + Math.random() * 0.2,
                averageResponseTime: 180 + Math.random() * 120,
                uniqueUsers: Math.floor(Math.random() * 20) + 10,
                popularQuestions: [
                    { question: 'Apa itu PPID?', count: Math.floor(Math.random() * 15) + 8 },
                    { question: 'Cara mengajukan permohonan informasi', count: Math.floor(Math.random() * 12) + 6 },
                ],
                categoryDistribution: [
                    { category: 'definisi', count: Math.floor(Math.random() * 20) + 10 },
                    { category: 'prosedur', count: Math.floor(Math.random() * 15) + 8 },
                ],
                confidenceDistribution: [
                    { range: '0.9-1.0', count: Math.floor(Math.random() * 25) + 15 },
                    { range: '0.7-0.9', count: Math.floor(Math.random() * 15) + 8 },
                ],
                hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
                    hour,
                    count: Math.floor(Math.random() * 8),
                })),
            });
        }
        await index_1.Analytics.bulkCreate(sampleAnalytics);
        logger_1.logger.info('Sample analytics created');
    }
    else {
        logger_1.logger.info('Analytics already exist');
    }
};
//# sourceMappingURL=seed.js.map