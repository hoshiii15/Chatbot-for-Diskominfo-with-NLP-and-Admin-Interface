
import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'

const router = Router()

function ensureTmpDir() {
  const tmpDir = path.join(__dirname, '../../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  return tmpDir
}

/**
 * POST /api/system/restart
 * Safe request-file implementation: append a JSONL record to tmp/restart-requests.jsonl
 * so a separate privileged helper can perform the actual restart. This keeps the
 * web process unprivileged and provides an auditable request record.
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
  const caller = ((req as any).ip as string) || (req.headers['x-forwarded-for'] as string) || 'unknown'
    const target = (req.body && req.body.target) || 'all'
    const user = (req as any).user?.username || null

    const entry = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      caller,
      user,
      target,
      headers: {
        'user-agent': String(req.headers['user-agent'] || ''),
        origin: String(req.headers.origin || '')
      }
    }

    logger.info(`System restart requested by ${caller} for target=${target}`)

    // Append to JSONL in tmp directory for an external helper to pick up
    try {
      const tmpDir = ensureTmpDir()
      const outPath = path.join(tmpDir, 'restart-requests.jsonl')
      fs.appendFileSync(outPath, JSON.stringify(entry) + '\n', { encoding: 'utf8' })
      logger.info(`Restart request written to ${outPath}`)
    } catch (e) {
      logger.warn('Failed to write restart request file', e)
    }

    return res.status(202).json({ success: true, message: 'Restart requested', target })
  } catch (error) {
    logger.error('Error handling restart request:', error)
    return res.status(500).json({ success: false, error: 'Failed to process restart request' })
  }
})

export default router
