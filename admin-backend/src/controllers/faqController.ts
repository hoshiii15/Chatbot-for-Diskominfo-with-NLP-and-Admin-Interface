import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { FAQ } from '../models';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';

interface FileFAQ {
  id?: number | string;
  fileId?: number | string;
  questions?: string[];
  question?: string;
  answer?: string;
  category?: string | null | undefined;
  links?: any;
  environment?: 'stunting' | 'ppid';
}

function getFilePathForEnv(env: 'stunting' | 'ppid') {
  const repoRoot = path.resolve(__dirname, '../../../');
  const candidates = [
    path.join(repoRoot, 'python-bot', 'data'),
    path.join(process.cwd(), 'python-bot', 'data'),
    path.join(__dirname, '..', '..', '..', 'python-bot', 'data'),
    path.join('/srv', 'admin-backend', 'dist', 'python-bot', 'data'),
    path.join('/app', 'python-bot', 'data'),
  ];
  for (const d of candidates) {
    const p = path.join(d, env === 'stunting' ? 'faq_stunting.json' : 'faq_ppid.json');
    try {
      const s = fsSync.statSync(p);
      if (s) return p;
    } catch (_e) {
      // try next
    }
  }
  // fallback
  if (env === 'stunting') return path.join(repoRoot, 'python-bot', 'data', 'faq_stunting.json');
  return path.join(repoRoot, 'python-bot', 'data', 'faq_ppid.json');
}

export async function loadFaqsFromFiles(): Promise<FileFAQ[]> {
  try {
    const repoRoot = path.resolve(__dirname, '../../../');
    // Candidate paths to account for running from source, compiled dist, or container layout
    const candidates = [
      path.join(repoRoot, 'python-bot', 'data'),
      path.join(process.cwd(), 'python-bot', 'data'),
      path.join(__dirname, '..', '..', '..', 'python-bot', 'data'),
      path.join(__dirname, '..', '..', '..', '..', 'python-bot', 'data'),
      // Container/runtime locations where the build copies python-bot data
      path.join('/srv', 'admin-backend', 'dist', 'python-bot', 'data'),
      path.join('/app', 'python-bot', 'data'),
    ];
    const stuntingPathCandidates = candidates.map(d => path.join(d, 'faq_stunting.json'));
    const ppidPathCandidates = candidates.map(d => path.join(d, 'faq_ppid.json'));

    const results: any[] = [];

    // Stunting file has shape { faqs: [...] }
    try {
      let stuntingRaw: string | null = null;
      for (const p of stuntingPathCandidates) {
        try {
          stuntingRaw = await fs.readFile(p, 'utf-8');
          break;
        } catch (_) {
          // try next candidate
        }
      }
      if (stuntingRaw) {
        const stuntingJson = JSON.parse(stuntingRaw);
        if (stuntingJson && Array.isArray(stuntingJson.faqs)) {
        for (let i = 0; i < stuntingJson.faqs.length; i++) {
          const f = stuntingJson.faqs[i];
          const now = new Date().toISOString();
          const metadata = Array.isArray(f.links)
            ? f.links.map((l: any) => {
                const text = typeof l === 'string' ? l : (l && (l.text ?? l.title ?? l.name)) ?? '';
                const url = (l && (l.url ?? l.href)) ?? '';
                const questionRef = l && (l.question ?? null);
                const questionIndex = l && (typeof l.questionIndex !== 'undefined' ? Number(l.questionIndex) : undefined);
                const question = typeof questionIndex === 'number' && Array.isArray(f.questions)
                  ? f.questions[questionIndex] ?? questionRef
                  : questionRef ?? null;
                return { text, url, question };
              })
            : null;

          results.push({
            id: f.id != null ? `stunting-${String(f.id)}` : `stunting-${i + 1}`,
            question: Array.isArray(f.questions) ? f.questions[0] : (f.question || ''),
            questions: f.questions || (f.question ? [f.question] : []),
            answer: f.answer || '',
            category: f.category || null,
            environment: 'stunting',
            isActive: f.isActive !== undefined ? f.isActive : true,
            priority: f.priority || 0,
            views: f.views || 0,
            metadata,
            createdAt: f.createdAt || now,
            updatedAt: f.updatedAt || now,
          });
        }
        }
      }
    } catch (e) {
      logger.debug('No stunting FAQ file or parse error', e instanceof Error ? e.message : e);
    }

    // PPID file is an array of faq objects
    try {
      let ppidRaw: string | null = null;
      for (const p of ppidPathCandidates) {
        try {
          ppidRaw = await fs.readFile(p, 'utf-8');
          break;
        } catch (_) {
          // try next candidate
        }
      }
      if (ppidRaw) {
        const ppidJson = JSON.parse(ppidRaw);
        if (Array.isArray(ppidJson)) {
        for (let i = 0; i < ppidJson.length; i++) {
          const f = ppidJson[i];
          const now = new Date().toISOString();
          const metadata = Array.isArray(f.links)
            ? f.links.map((l: any) => {
                const text = typeof l === 'string' ? l : (l && (l.text ?? l.title ?? l.name)) ?? '';
                const url = (l && (l.url ?? l.href)) ?? '';
                const questionRef = l && (l.question ?? null);
                const questionIndex = l && (typeof l.questionIndex !== 'undefined' ? Number(l.questionIndex) : undefined);
                const question = typeof questionIndex === 'number' && Array.isArray(f.questions)
                  ? f.questions[questionIndex] ?? questionRef
                  : questionRef ?? null;
                return { text, url, question };
              })
            : null;

          results.push({
            id: f.id != null ? `ppid-${String(f.id)}` : `ppid-${i + 1}`,
            question: Array.isArray(f.questions) ? f.questions[0] : (f.question || ''),
            questions: f.questions || (f.question ? [f.question] : []),
            answer: f.answer || '',
            category: f.category || null,
            environment: 'ppid',
            isActive: f.isActive !== undefined ? f.isActive : true,
            priority: f.priority || 0,
            views: f.views || 0,
            metadata,
            createdAt: f.createdAt || now,
            updatedAt: f.updatedAt || now,
          });
        }
        }
      }
    } catch (e) {
      logger.debug('No ppid FAQ file or parse error', e instanceof Error ? e.message : e);
    }

    return results;
  } catch (error) {
    logger.error('Failed to load FAQ files:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function readFileFaqs(env: 'stunting' | 'ppid'): Promise<FileFAQ[]> {
  try {
    const p = getFilePathForEnv(env);
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (env === 'stunting') return Array.isArray(parsed.faqs) ? parsed.faqs : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.warn('readFileFaqs error', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function writeFileFaqs(env: 'stunting' | 'ppid', faqs: FileFAQ[]): Promise<boolean> {
  try {
    const p = getFilePathForEnv(env);
    if (env === 'stunting') {
      const payload = { faqs };
      await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf-8');
    } else {
      await fs.writeFile(p, JSON.stringify(faqs, null, 2), 'utf-8');
    }
    return true;
  } catch (error) {
    logger.error('writeFileFaqs error', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getFaqsByEnv(req: Request, res: Response) {
  try {
    const env = req.params.env as 'stunting' | 'ppid';
    if (!['stunting', 'ppid'].includes(env)) {
      return res.status(400).json({ success: false, error: 'Invalid environment. Must be "stunting" or "ppid"', timestamp: new Date().toISOString() });
    }

    let faqs: any[] = [];
    const fileFaqsAll = await loadFaqsFromFiles();
    const fileFaqsEnv = fileFaqsAll.filter(f => f.environment === env);
    if (fileFaqsEnv.length > 0) {
      faqs = fileFaqsEnv;
    } else {
      try {
        faqs = await FAQ.findAll({ where: { environment: env }, order: [['priority', 'DESC'], ['createdAt', 'DESC']] });
      } catch (e) {
        logger.warn('Database error fetching FAQs and no file data present', e instanceof Error ? e.message : e);
      }
    }

    res.json({ success: true, data: faqs, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error getting FAQs by env:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get FAQs', timestamp: new Date().toISOString() });
  }
}

export async function getFaqs(req: Request, res: Response) {
  try {
    const { environment, category, active } = req.query as any;
    const whereClause: any = {};
    if (environment && environment !== 'all') whereClause.environment = environment;
    if (category) whereClause.category = category;
    if (active !== undefined) whereClause.isActive = active === 'true';

    let faqs: any[] = [];
    const fileFaqs = await loadFaqsFromFiles();
    if (fileFaqs.length > 0) {
      faqs = fileFaqs;
      if (environment && environment !== 'all') faqs = faqs.filter(f => f.environment === environment);
      if (category) faqs = faqs.filter(f => f.category === category);
      if (active !== undefined) faqs = faqs.filter(f => Boolean(f.isActive) === (active === 'true'));
    } else {
      try {
        faqs = await FAQ.findAll({ where: whereClause, order: [['priority', 'DESC'], ['createdAt', 'DESC']] });
      } catch (e) {
        logger.warn('Database error fetching FAQs and no file data present', e instanceof Error ? e.message : e);
      }
    }

    res.json({ success: true, data: faqs, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error getting FAQs:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get FAQs', timestamp: new Date().toISOString() });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const { question, answer, environment, category, priority, isActive } = req.body;
    if (!question || !answer || !environment) {
      return res.status(400).json({ success: false, error: 'Question, answer, and environment are required', timestamp: new Date().toISOString() });
    }
    if (!['stunting', 'ppid'].includes(environment)) {
      return res.status(400).json({ success: false, error: 'Environment must be either "stunting" or "ppid"', timestamp: new Date().toISOString() });
    }

    let createdInDb: any = null;
    try {
      createdInDb = await FAQ.create({ question, answer, environment, category: category || 'general', priority: priority || 1, isActive: isActive !== undefined ? isActive : true, views: 0 });
    } catch (e) {
      logger.warn('DB create failed, continuing to write to file', e instanceof Error ? e.message : e);
    }

    const rawFileFaqs = await readFileFaqs(environment);
    const maxId = rawFileFaqs.reduce((m: number, f: FileFAQ) => {
      const idn = typeof f.id === 'number' ? f.id : (typeof f.id === 'string' && !isNaN(Number(f.id)) ? Number(f.id) : 0);
      return Math.max(m, idn as number);
    }, 0);
    const newId = (maxId || 0) + 1;
    const rawFileObject: any = { id: newId, questions: Array.isArray(req.body.questions) ? req.body.questions : [question], answer, category: category || null, links: Array.isArray(req.body.links) ? req.body.links : undefined };
    rawFileFaqs.push(rawFileObject);
    const ok = await writeFileFaqs(environment, rawFileFaqs);

    const publicId = `${environment}-${newId}`;
    const responseItem = createdInDb || { id: publicId, fileId: newId, questions: rawFileObject.questions, question: rawFileObject.questions && rawFileObject.questions[0], answer: rawFileObject.answer, category: rawFileObject.category, environment, isActive: true, priority: rawFileObject.priority || 0, views: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    if (!ok) logger.warn('Failed to write FAQ to file');

    res.status(201).json({ success: true, data: responseItem, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create FAQ', timestamp: new Date().toISOString() });
  }
}

export async function updateFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { question, answer, environment, category, priority, isActive } = req.body;

    let updatedItem: any = null;
    try {
      const faq = await FAQ.findByPk(id);
      if (faq) {
        await faq.update({ question: question || faq.question, answer: answer || faq.answer, environment: environment || faq.environment, category: category || faq.category, priority: priority !== undefined ? priority : faq.priority, isActive: isActive !== undefined ? isActive : faq.isActive, updatedAt: new Date() });
        updatedItem = faq;
      }
    } catch (e) {
      logger.debug('DB update skipped or failed', e instanceof Error ? e.message : e);
    }

    let targetEnv: 'stunting' | 'ppid' | undefined = undefined;
    let rawId: string | number = id;
    if (typeof id === 'string' && id.includes('-')) {
      const parts = id.split('-');
      if (parts.length >= 2 && (parts[0] === 'stunting' || parts[0] === 'ppid')) {
        targetEnv = parts[0] as 'stunting' | 'ppid';
        rawId = parts.slice(1).join('-');
      }
    }

    if (!targetEnv && environment && (environment === 'stunting' || environment === 'ppid')) targetEnv = environment;

    if (!targetEnv && !updatedItem) {
      return res.status(404).json({ success: false, error: 'FAQ not found and environment not specified', timestamp: new Date().toISOString() });
    }

    if (targetEnv) {
      const fileFaqs = await readFileFaqs(targetEnv);
      const idToFind = !isNaN(Number(rawId)) ? String(Number(rawId)) : String(rawId);
      const idx = fileFaqs.findIndex((f: FileFAQ) => String((f.id ?? f.fileId) as any) === idToFind);
      if (idx !== -1) {
        const existing = fileFaqs[idx] as any;
        existing.questions = Array.isArray(req.body.questions) ? req.body.questions : (question ? [question] : existing.questions);
        existing.answer = answer || existing.answer;
        existing.category = category || existing.category;
        if (Array.isArray(req.body.links)) existing.links = req.body.links;
        fileFaqs[idx] = existing;
        await writeFileFaqs(targetEnv, fileFaqs);
        updatedItem = updatedItem || { id: `${targetEnv}-${existing.id}`, fileId: existing.id, questions: existing.questions, question: existing.questions && existing.questions[0], answer: existing.answer, category: existing.category, environment: targetEnv, isActive: existing.isActive !== undefined ? existing.isActive : true, priority: existing.priority || 0, views: existing.views || 0, createdAt: existing.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      } else if (!updatedItem) {
        return res.status(404).json({ success: false, error: 'FAQ not found', timestamp: new Date().toISOString() });
      }
    }

    res.json({ success: true, data: updatedItem, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to update FAQ', timestamp: new Date().toISOString() });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let deletedInDb = false;
    try {
      const faq = await FAQ.findByPk(id);
      if (faq) {
        await faq.destroy();
        deletedInDb = true;
      }
    } catch (e) {
      logger.debug('DB delete skipped or failed', e instanceof Error ? e.message : e);
    }

    let deletedInFile = false;
    if (typeof id === 'string' && id.includes('-')) {
      const parts = id.split('-');
      if (parts.length >= 2 && (parts[0] === 'stunting' || parts[0] === 'ppid')) {
        const env = parts[0] as 'stunting' | 'ppid';
        const rawId = parts.slice(1).join('-');
        const fileFaqs = await readFileFaqs(env);
        const filtered = fileFaqs.filter((f: FileFAQ) => String(f.id) !== String(rawId));
        if (filtered.length !== fileFaqs.length) {
          await writeFileFaqs(env, filtered);
          deletedInFile = true;
        }
      }
    } else {
      for (const env of ['stunting', 'ppid'] as const) {
        const fileFaqs = await readFileFaqs(env);
        const filtered = fileFaqs.filter((f: FileFAQ) => String(f.id) !== String(id));
        if (filtered.length !== fileFaqs.length) {
          await writeFileFaqs(env, filtered);
          deletedInFile = true;
        }
      }
    }

    if (!deletedInDb && !deletedInFile) return res.status(404).json({ success: false, error: 'FAQ not found', timestamp: new Date().toISOString() });

    res.json({ success: true, message: 'FAQ deleted successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete FAQ', timestamp: new Date().toISOString() });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const env = req.params.env as 'stunting' | 'ppid';
    if (!['stunting', 'ppid'].includes(env)) return res.status(400).json({ success: false, error: 'Invalid environment. Must be "stunting" or "ppid"', timestamp: new Date().toISOString() });

    let categories: any[] = [];
    try {
      categories = await FAQ.findAll({ where: { environment: env }, attributes: ['category'], group: ['category'], order: [['category', 'ASC']] });
    } catch (e) {
      logger.warn('DB error fetching categories, will fallback to files', e instanceof Error ? e.message : e);
    }

    let categoryNames: (string | null)[] = [];
    if (categories && categories.length > 0) {
      categoryNames = categories.map(cat => cat.category);
    } else {
      const fileFaqs = await loadFaqsFromFiles();
      categoryNames = Array.from(new Set(fileFaqs.filter(f => f.environment === env).map(f => f.category).filter(c => c !== undefined))) as (string | null)[];
    }

    res.json({ success: true, data: categoryNames, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get categories', timestamp: new Date().toISOString() });
  }
}

export async function debugFiles(req: Request, res: Response) {
  try {
    const fileFaqs = await loadFaqsFromFiles();
    res.json({ success: true, data: fileFaqs, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error returning file FAQs:', error);
    res.status(500).json({ success: false, error: 'Failed to load file FAQs', timestamp: new Date().toISOString() });
  }
}

export async function fileFaqsDebug(req: Request, res: Response) {
  try {
    const fileFaqs = await loadFaqsFromFiles();
    res.json({ success: true, data: fileFaqs, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error returning file FAQs:', error);
    res.status(500).json({ success: false, error: 'Failed to load file FAQs', timestamp: new Date().toISOString() });
  }
}
