#!/usr/bin/env ts-node
/*
  Dev seeder: creates synthetic Sessions, ChatLogs, and Analytics rows
  Usage: npx ts-node scripts/seed-analytics.ts [count]
*/
import { initializeDatabase } from '../src/models';
import { ChatLog, Session, Analytics } from '../src/models';

const sampleQuestions = [
  'Apa itu PPID?',
  'Bagaimana cara mengajukan permohonan informasi publik?',
  'Apa penyebab stunting?',
  'Bagaimana mencegah stunting?',
  'Apa layanan yang tersedia di website PPID?'
];

const sampleAnswers = [
  'Ini adalah jawaban contoh A.',
  'Silakan kunjungi situs resmi untuk informasi lebih lanjut.',
  'Perbaiki gizi ibu hamil dan MPASI yang tepat.',
  'Hubungi kantor PPID atau gunakan aplikasi SIPIPI.'
];

const categories = ['umum', 'prosedur', 'informasi', 'definisi', 'pencegahan'];
const envs: Array<'stunting' | 'ppid'> = ['stunting', 'ppid'];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const count = Number(process.argv[2] || '100');
  console.log(`Seeding approx ${count} chat logs...`);
  await initializeDatabase();

  // create some sessions
  const sessionCount = Math.max(5, Math.min(20, Math.floor(count / 6)));
  const sessions = [] as any[];
  for (let i = 0; i < sessionCount; i++) {
    const s = await Session.create({
      isActive: Math.random() > 0.3,
      startTime: new Date(Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 5)),
      environment: envs[randInt(0, envs.length - 1)],
      userAgent: 'seeder',
      ipAddress: `127.0.0.${randInt(1, 250)}`,
      totalQuestions: 0
    });
    sessions.push(s);
  }

  let created = 0;
  for (let i = 0; i < count; i++) {
    const session = sessions[randInt(0, sessions.length - 1)];
    const q = sampleQuestions[randInt(0, sampleQuestions.length - 1)];
    const a = sampleAnswers[randInt(0, sampleAnswers.length - 1)];
    const conf = Math.round((0.4 + Math.random() * 0.6) * 100) / 100;
    const env = session.environment as 'stunting' | 'ppid';
    const category = categories[randInt(0, categories.length - 1)];

    await ChatLog.create({
      sessionId: session.id,
      question: q + ` (${i})`,
      answer: a,
      confidence: conf,
      category,
      environment: env,
      status: 'success',
      responseTime: randInt(80, 1200)
    });

    // update session counter
    session.totalQuestions = (session.totalQuestions || 0) + 1;
    await session.save();

    created++;
  }

  console.log(`Created ${created} ChatLog rows across ${sessions.length} sessions.`);

  // Build simple Analytics rows for last 7 days
  for (let d = 0; d < 7; d++) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    const dateStr = day.toISOString().split('T')[0];
    for (const env of envs) {
      const totalQuestions = randInt(5, 30);
      const totalSessions = randInt(2, 10);
      const averageConfidence = Math.round((0.5 + Math.random() * 0.45) * 100) / 100;

      const [rec, createdRec] = await Analytics.findOrCreate({
        where: { environment: env, date: dateStr },
        defaults: {
          environment: env,
          date: dateStr,
          totalQuestions,
          totalSessions,
          averageConfidence,
          averageResponseTime: randInt(100, 800),
          uniqueUsers: randInt(1, totalSessions),
          popularQuestions: [],
          categoryDistribution: [],
          confidenceDistribution: [],
          hourlyDistribution: [],
          metadata: {}
        }
      });

      if (!createdRec) {
        await rec.update({ totalQuestions, totalSessions, averageConfidence });
      }
    }
  }

  console.log('Seed complete. Restart or refresh analytics page to see data.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
