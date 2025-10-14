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
  environment?: string;
  isActive?: boolean;
  priority?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

function getFilePathForEnv(env: string) {
  const repoRoot = path.resolve(__dirname, '../../../');
  const candidates = [
    path.join(repoRoot, 'python-bot', 'data'),
    path.join(process.cwd(), 'python-bot', 'data'),
    path.join(__dirname, '..', '..', '..', 'python-bot', 'data'),
    path.join('/srv', 'admin-backend', 'dist', 'python-bot', 'data'),
    path.join('/app', 'python-bot', 'data'),
  ];
  const filename = `faq_${env}.json`;
  for (const d of candidates) {
    const p = path.join(d, filename);
    try {
      const s = fsSync.statSync(p);
      if (s) return p;
    } catch (_e) {
      // try next
    }
  }
  // fallback to repo-root data
  return path.join(repoRoot, 'python-bot', 'data', filename);
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

export async function readFileFaqs(env: string): Promise<FileFAQ[]> {
  try {
    const p = getFilePathForEnv(env as any);
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.faqs)) return parsed.faqs as FileFAQ[];
    if (Array.isArray(parsed)) return parsed as FileFAQ[];
    return [];
  } catch (error) {
    logger.warn('readFileFaqs error', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function writeFileFaqs(env: string, faqs: FileFAQ[]): Promise<boolean> {
  try {
    const p = getFilePathForEnv(env as any);
    // For backward compatibility, keep stunting file as object with { faqs }
    if (env === 'stunting') {
      const payload = { faqs };
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf-8');
    } else {
      await fs.mkdir(path.dirname(p), { recursive: true });
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
    const env = String(req.params.env || '');

    let faqs: any[] = [];
    // Prefer reading file-backed faqs for this specific env first
    try {
      const fileFaqsEnv = await readFileFaqs(env);
      if (fileFaqsEnv && fileFaqsEnv.length > 0) {
        // Map to public shape where needed (readFileFaqs returns raw file entries)
        faqs = fileFaqsEnv.map((f: FileFAQ, idx: number) => ({
          id: f.id != null ? `${env}-${String(f.id)}` : `${env}-${idx + 1}`,
          question: Array.isArray(f.questions) ? f.questions[0] : (f.question || ''),
          questions: f.questions || (f.question ? [f.question] : []),
          answer: f.answer || '',
          category: f.category || null,
          environment: env,
          isActive: f.isActive !== undefined ? f.isActive : true,
          priority: f.priority || 0,
          views: f.views || 0,
          metadata: f.links || null,
          createdAt: f.createdAt || new Date().toISOString(),
          updatedAt: f.updatedAt || new Date().toISOString(),
        }));
      } else {
        // Fallback to database if no file data for this env
        try {
          faqs = await FAQ.findAll({ where: { environment: env }, order: [['priority', 'DESC'], ['createdAt', 'DESC']] });
        } catch (e) {
          logger.warn('Database error fetching FAQs for env', e instanceof Error ? e.message : e);
        }
      }
    } catch (e) {
      logger.warn('Error reading file faqs for env', e instanceof Error ? e.message : e);
      try {
        faqs = await FAQ.findAll({ where: { environment: env }, order: [['priority', 'DESC'], ['createdAt', 'DESC']] });
      } catch (e2) {
        logger.warn('Database error fetching FAQs and no file data present', e2 instanceof Error ? e2.message : e2);
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
    // allow any environment string; file-backed handlers will determine availability

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
      // attempt to read dynamic environments list from python-bot/data/environments.json
      const repoRoot = path.resolve(__dirname, '../../../');
      const candidates = [
        path.join(repoRoot, 'python-bot', 'data'),
        path.join(process.cwd(), 'python-bot', 'data'),
        path.join(__dirname, '..', '..', '..', 'python-bot', 'data'),
        path.join('/srv', 'admin-backend', 'dist', 'python-bot', 'data'),
        path.join('/app', 'python-bot', 'data'),
      ];
      let envsToCheck: string[] = [];
      for (const d of candidates) {
        try {
          const p = path.join(d, 'environments.json');
          if (fsSync.existsSync(p)) {
            const raw = await fs.readFile(p, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              envsToCheck = parsed.map(String);
              break;
            }
          }
        } catch (_e) {
          // ignore and try next
        }
      }
      if (envsToCheck.length === 0) envsToCheck = ['stunting', 'ppid'];

      for (const env of envsToCheck) {
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

    // Also include categories present in the persistent categories file (categories_{env}.json)
    try {
      const fileCategories = await readCategoriesFile(env);
      if (Array.isArray(fileCategories) && fileCategories.length > 0) {
        // merge and dedupe
  const merged = Array.from(new Set([...(categoryNames || []).filter((c: any) => c != null), ...fileCategories.filter((c: any) => c != null)])).map(String).filter(s => s.trim().length > 0);
  // normalize to string[] and sort alphabetically
  const mergedStrings: string[] = merged.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  mergedStrings.sort((a: string, b: string) => a.localeCompare(b));
  categoryNames = mergedStrings as any;
      } else {
        // normalize categoryNames: remove nulls and sort
  const normalized: string[] = (categoryNames || []).filter((c: any) => c != null).map(String).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  normalized.sort((a: string, b: string) => a.localeCompare(b));
  categoryNames = normalized as any;
      }
    } catch (e) {
      logger.debug('Could not read categories file, returning derived categories', e instanceof Error ? e.message : e);
  const normalizedCatch: string[] = (categoryNames || []).filter((c: any) => c != null).map(String).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  normalizedCatch.sort((a: string, b: string) => a.localeCompare(b));
  categoryNames = normalizedCatch as any;
    }

    res.json({ success: true, data: categoryNames, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get categories', timestamp: new Date().toISOString() });
  }
}

// --- category file helpers and CRUD ---
async function getCategoriesFilePath(env: 'stunting' | 'ppid') {
  const repoRoot = path.resolve(__dirname, '../../../');
  const candidates = [
    path.join(repoRoot, 'python-bot', 'data'),
    path.join(process.cwd(), 'python-bot', 'data'),
    path.join(__dirname, '..', '..', '..', 'python-bot', 'data'),
    path.join(__dirname, '..', '..', '..', '..', 'python-bot', 'data'),
  ];
  for (const d of candidates) {
    try {
      const p = path.join(d, `categories_${env}.json`);
      if (fsSync.existsSync(p)) return p;
    } catch (_e) {
      // ignore
    }
  }
  // fallback to repo location
  return path.join(repoRoot, 'python-bot', 'data', `categories_${env}.json`);
}

async function readCategoriesFile(env: 'stunting' | 'ppid') {
  try {
    const p = await getCategoriesFilePath(env);
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    if (parsed && Array.isArray(parsed.categories)) return parsed.categories as string[];
    return [];
  } catch (e) {
    return [];
  }
}

async function writeCategoriesFile(env: 'stunting' | 'ppid', categories: string[]) {
  try {
    const p = await getCategoriesFilePath(env);
    // ensure directory exists
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(categories, null, 2), 'utf-8');
    return true;
  } catch (e) {
    logger.warn('writeCategoriesFile error', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const env = req.params.env as 'stunting' | 'ppid';
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, error: 'Category name required', timestamp: new Date().toISOString() });
    if (!['stunting', 'ppid'].includes(env)) return res.status(400).json({ success: false, error: 'Invalid environment', timestamp: new Date().toISOString() });

    const cats = await readCategoriesFile(env);
    if (cats.includes(name)) return res.status(409).json({ success: false, error: 'Category already exists', timestamp: new Date().toISOString() });
    cats.push(name);
    await writeCategoriesFile(env, cats);
    res.status(201).json({ success: true, data: cats, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create category', timestamp: new Date().toISOString() });
  }
}

export async function renameCategory(req: Request, res: Response) {
  try {
    const env = req.params.env as 'stunting' | 'ppid';
    const { oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ success: false, error: 'oldName and newName required', timestamp: new Date().toISOString() });
    if (!['stunting', 'ppid'].includes(env)) return res.status(400).json({ success: false, error: 'Invalid environment', timestamp: new Date().toISOString() });

    // update DB FAQs
    try {
      await FAQ.update({ category: newName }, { where: { category: oldName, environment: env } });
    } catch (e) {
      logger.debug('DB update categories failed', e instanceof Error ? e.message : e);
    }

    // update file FAQs
    try {
      const fileFaqs = await readFileFaqs(env);
      for (const f of fileFaqs as any[]) {
        if (f.category === oldName) f.category = newName;
      }
      await writeFileFaqs(env, fileFaqs as any[]);
    } catch (e) {
      logger.debug('File FAQ rename category failed', e instanceof Error ? e.message : e);
    }

    // update categories file
    const cats = await readCategoriesFile(env);
    const idx = cats.indexOf(oldName);
    if (idx !== -1) {
      cats[idx] = newName;
      await writeCategoriesFile(env, cats);
    }

    res.json({ success: true, data: { oldName, newName }, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error renaming category:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to rename category', timestamp: new Date().toISOString() });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const env = req.params.env as 'stunting' | 'ppid';
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name required', timestamp: new Date().toISOString() });
    if (!['stunting', 'ppid'].includes(env)) return res.status(400).json({ success: false, error: 'Invalid environment', timestamp: new Date().toISOString() });

    // remove from DB (set to null)
    try {
      // cast null to any to satisfy Sequelize typings for nullable string update
      await FAQ.update({ category: null as any }, { where: { category: name, environment: env } });
    } catch (e) {
      logger.debug('DB nullify category failed', e instanceof Error ? e.message : e);
    }

    // update file FAQs
    try {
      const fileFaqs = await readFileFaqs(env);
      for (const f of fileFaqs as any[]) {
        if (f.category === name) f.category = null;
      }
      await writeFileFaqs(env, fileFaqs as any[]);
    } catch (e) {
      logger.debug('File FAQ delete category failed', e instanceof Error ? e.message : e);
    }

    // remove from categories file
    const cats = (await readCategoriesFile(env)).filter(c => c !== name);
    await writeCategoriesFile(env, cats);

    res.json({ success: true, data: cats, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete category', timestamp: new Date().toISOString() });
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
