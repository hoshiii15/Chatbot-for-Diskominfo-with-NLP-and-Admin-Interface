import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

type EnvName = string;

async function getEnvsFilePath() {
  const repoRoot = path.resolve(__dirname, '../../../');
  const candidates = [
    path.join(repoRoot, 'python-bot', 'data', 'environments.json'),
    path.join(process.cwd(), 'python-bot', 'data', 'environments.json'),
    path.join(__dirname, '..', '..', '..', 'python-bot', 'data', 'environments.json'),
  ];
  for (const p of candidates) {
    try {
      if (fsSync.existsSync(p)) return p;
    } catch (_e) {
      // ignore
    }
  }
  // fallback
  return path.join(repoRoot, 'python-bot', 'data', 'environments.json');
}

async function readEnvsFile(): Promise<EnvName[]> {
  try {
    const p = await getEnvsFilePath();
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.environments)) return parsed.environments;
    return [];
  } catch (e) {
    logger.debug('readEnvsFile error', e instanceof Error ? e.message : e);
    return [];
  }
}

async function writeEnvsFile(envs: EnvName[]) {
  try {
    const p = await getEnvsFilePath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(envs, null, 2), 'utf-8');
    return true;
  } catch (e) {
    logger.warn('writeEnvsFile error', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function listEnvironments(req: Request, res: Response) {
  try {
    const envs = await readEnvsFile();
    // always include defaults
    const defaults = ['stunting', 'ppid'];
    const merged = Array.from(new Set([...defaults, ...envs]));
    res.json({ success: true, data: merged, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error listing environments:', error);
    res.status(500).json({ success: false, error: 'Failed to list environments', timestamp: new Date().toISOString() });
  }
}

export async function createEnvironment(req: Request, res: Response) {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, error: 'Environment name required', timestamp: new Date().toISOString() });
    const normalized = name.trim().toLowerCase();
    if (!/^[a-z0-9-_]+$/.test(normalized)) return res.status(400).json({ success: false, error: 'Environment name must be alphanumeric, dash or underscore', timestamp: new Date().toISOString() });

    // prevent adding reserved defaults
    if (['stunting', 'ppid'].includes(normalized)) return res.status(409).json({ success: false, error: 'Environment already exists', timestamp: new Date().toISOString() });

    const envs = await readEnvsFile();
    if (envs.map(e => e.toLowerCase()).includes(normalized)) return res.status(409).json({ success: false, error: 'Environment already exists', timestamp: new Date().toISOString() });

    envs.push(normalized);
    const ok = await writeEnvsFile(envs);
    if (!ok) return res.status(500).json({ success: false, error: 'Failed to persist environment', timestamp: new Date().toISOString() });

    res.status(201).json({ success: true, data: envs, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error creating environment:', error);
    res.status(500).json({ success: false, error: 'Failed to create environment', timestamp: new Date().toISOString() });
  }
}

export async function renameEnvironment(req: Request, res: Response) {
  try {
    const { oldName, newName } = req.body as { oldName?: string; newName?: string }
    if (!oldName || !newName) return res.status(400).json({ success: false, error: 'oldName and newName required', timestamp: new Date().toISOString() })
    const oldN = oldName.trim().toLowerCase()
    const newN = newName.trim().toLowerCase()
    if (!/^[a-z0-9-_]+$/.test(newN)) return res.status(400).json({ success: false, error: 'Environment name must be alphanumeric, dash or underscore', timestamp: new Date().toISOString() })

    const defaults = ['stunting', 'ppid']
    // don't allow renaming defaults
    if (defaults.includes(oldN)) return res.status(400).json({ success: false, error: 'Cannot rename default environment', timestamp: new Date().toISOString() })
    if (defaults.includes(newN)) return res.status(409).json({ success: false, error: 'Environment already exists', timestamp: new Date().toISOString() })

    const envs = await readEnvsFile()
    const idx = envs.findIndex(e => e.toLowerCase() === oldN)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Environment not found', timestamp: new Date().toISOString() })
    if (envs.map(e => e.toLowerCase()).includes(newN)) return res.status(409).json({ success: false, error: 'Environment already exists', timestamp: new Date().toISOString() })

    envs[idx] = newN
    const ok = await writeEnvsFile(envs)
    if (!ok) return res.status(500).json({ success: false, error: 'Failed to persist environment', timestamp: new Date().toISOString() })

    res.json({ success: true, data: envs, timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error('Error renaming environment:', error)
    res.status(500).json({ success: false, error: 'Failed to rename environment', timestamp: new Date().toISOString() })
  }
}

export async function deleteEnvironment(req: Request, res: Response) {
  try {
    const nameParam = (req.params && (req.params as any).name) || (req.body && (req.body as any).name)
    if (!nameParam || typeof nameParam !== 'string') return res.status(400).json({ success: false, error: 'Environment name required', timestamp: new Date().toISOString() })
    const normalized = nameParam.trim().toLowerCase()
    const defaults = ['stunting', 'ppid']
    if (defaults.includes(normalized)) return res.status(400).json({ success: false, error: 'Cannot delete default environment', timestamp: new Date().toISOString() })

    const envs = await readEnvsFile()
    if (!envs.map(e => e.toLowerCase()).includes(normalized)) return res.status(404).json({ success: false, error: 'Environment not found', timestamp: new Date().toISOString() })

    const filtered = envs.filter(e => e.toLowerCase() !== normalized)
    const ok = await writeEnvsFile(filtered)
    if (!ok) return res.status(500).json({ success: false, error: 'Failed to persist environment', timestamp: new Date().toISOString() })

    res.json({ success: true, data: filtered, timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error('Error deleting environment:', error)
    res.status(500).json({ success: false, error: 'Failed to delete environment', timestamp: new Date().toISOString() })
  }
}
