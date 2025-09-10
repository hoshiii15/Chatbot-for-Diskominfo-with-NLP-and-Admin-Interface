#!/usr/bin/env ts-node
/* Dev helper: generate test sessions and chat logs quickly
  Usage: npx ts-node scripts/generate-test-data.ts <sessions> <logsPerSession>
*/
/// <reference lib="dom" />

const base = 'http://localhost:3001'

async function main() {
  const args = process.argv.slice(2)
  const sessions = parseInt(args[0] || '5', 10)
  const logsPer = parseInt(args[1] || '3', 10)

  console.log(`Generating ${sessions} sessions with ${logsPer} logs each`)

  for (let i = 0; i < sessions; i++) {
    const start = await fetch(`${base}/api/chatbot/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAgent: 'generator', ipAddress: '127.0.0.1', environment: i % 2 === 0 ? 'stunting' : 'ppid' })
    })
    const s = await start.json()
    const sessionId = s.data.sessionId

    for (let j = 0; j < logsPer; j++) {
      const q = `Generated question ${i}-${j}`
      await fetch(`${base}/api/chatbot/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q, answer: 'gen answer', confidence: Math.random() * 0.5 + 0.5, category: 'auto', environment: i % 2 === 0 ? 'stunting' : 'ppid' })
      })
    }
  }

  console.log('Generation complete')
}

main().catch((e) => { console.error(e); process.exit(1) })
