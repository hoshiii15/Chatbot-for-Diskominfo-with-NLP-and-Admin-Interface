import bcrypt from 'bcryptjs';
import { User, FAQ, Website, Analytics } from './index';
import { logger } from '../utils/logger';

export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Seed default admin user
    await seedUsers();

    // Seed sample FAQs
    await seedFAQs();

    // Seed sample websites
    await seedWebsites();

    // Seed sample analytics data
    await seedAnalytics();

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

const seedUsers = async (): Promise<void> => {
  const existingUser = await User.findOne({ where: { username: 'admin' } });
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await User.create({
      username: 'admin',
      email: 'admin@diskominfo.go.id',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      isActive: true,
    });

    logger.info('Default admin user created');
  } else {
    logger.info('Admin user already exists');
  }
};

const seedFAQs = async (): Promise<void> => {
  const faqCount = await FAQ.count();
  
  if (faqCount === 0) {
    const sampleFAQs = [
      // Stunting FAQs
      {
        question: 'Apa itu stunting?',
        answer: 'Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis sehingga anak terlalu pendek untuk usianya.',
        category: 'definisi',
        environment: 'stunting' as const,
        keywords: ['stunting', 'definisi', 'gagal tumbuh', 'balita'],
        isActive: true,
        priority: 10,
        views: 0,
      },
      {
        question: 'Bagaimana cara mencegah stunting?',
        answer: 'Pencegahan stunting dapat dilakukan dengan memberikan nutrisi yang baik selama 1000 hari pertama kehidupan, mulai dari masa kehamilan hingga anak berusia 2 tahun.',
        category: 'pencegahan',
        environment: 'stunting' as const,
        keywords: ['pencegahan', 'nutrisi', '1000 hari pertama'],
        isActive: true,
        priority: 9,
        views: 0,
      },
      {
        question: 'Apa saja tanda-tanda stunting?',
        answer: 'Tanda-tanda stunting meliputi tinggi badan anak lebih pendek dari standar usianya, berat badan rendah, dan perkembangan otak terhambat.',
        category: 'gejala',
        environment: 'stunting' as const,
        keywords: ['tanda', 'gejala', 'tinggi badan', 'berat badan'],
        isActive: true,
        priority: 8,
        views: 0,
      },
      // PPID FAQs
      {
        question: 'Apa itu PPID?',
        answer: 'PPID (Pejabat Pengelola Informasi dan Dokumentasi) adalah pejabat yang bertanggung jawab dalam penyimpanan, pendokumentasian, penyediaan, dan/atau pelayanan informasi di badan publik.',
        category: 'definisi',
        environment: 'ppid' as const,
        keywords: ['PPID', 'definisi', 'informasi', 'dokumentasi'],
        isActive: true,
        priority: 10,
        views: 0,
      },
      {
        question: 'Bagaimana cara mengajukan permohonan informasi?',
        answer: 'Permohonan informasi dapat diajukan secara tertulis atau lisan kepada PPID dengan mengisi formulir yang tersedia dan melampirkan identitas diri.',
        category: 'prosedur',
        environment: 'ppid' as const,
        keywords: ['permohonan', 'informasi', 'prosedur', 'formulir'],
        isActive: true,
        priority: 9,
        views: 0,
      },
    ];

    await FAQ.bulkCreate(sampleFAQs);
    logger.info('Sample FAQs created');
  } else {
    logger.info('FAQs already exist');
  }
};

const seedWebsites = async (): Promise<void> => {
  const websiteCount = await Website.count();
  
  if (websiteCount === 0) {
    const sampleWebsites = [
      {
        name: 'Portal Stunting Diskominfo',
        url: 'https://stunting.diskominfo.go.id',
        environment: 'stunting' as const,
        description: 'Portal informasi stunting resmi Diskominfo',
        isActive: true,
        settings: {
          chatWidget: true,
          analytics: true,
          theme: 'blue',
        },
        status: 'online' as const,
      },
      {
        name: 'Portal PPID Diskominfo',
        url: 'https://ppid.diskominfo.go.id',
        environment: 'ppid' as const,
        description: 'Portal PPID resmi Diskominfo',
        isActive: true,
        settings: {
          chatWidget: true,
          analytics: true,
          theme: 'green',
        },
        status: 'online' as const,
      },
    ];

    await Website.bulkCreate(sampleWebsites);
    logger.info('Sample websites created');
  } else {
    logger.info('Websites already exist');
  }
};

const seedAnalytics = async (): Promise<void> => {
  const analyticsCount = await Analytics.count();
  
  if (analyticsCount === 0) {
    const today = new Date();
    const sampleAnalytics = [];
    
    // Create sample analytics for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Stunting analytics
      sampleAnalytics.push({
        date: dateString,
        environment: 'stunting' as const,
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
      
      // PPID analytics
      sampleAnalytics.push({
        date: dateString,
        environment: 'ppid' as const,
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

    await Analytics.bulkCreate(sampleAnalytics);
    logger.info('Sample analytics created');
  } else {
    logger.info('Analytics already exist');
  }
};
