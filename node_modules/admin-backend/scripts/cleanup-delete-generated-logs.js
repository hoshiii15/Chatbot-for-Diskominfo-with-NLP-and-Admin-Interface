const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const dbPath = path.resolve(__dirname, '..', 'database.sqlite')

function run() {
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('Failed to open database:', err.message)
      process.exit(1)
    }
  })

  const likePattern = 'Generated question %'

  db.get(`SELECT COUNT(*) as cnt FROM chat_logs WHERE question LIKE ?`, [likePattern], (err, row) => {
    if (err) {
      console.error('Count query failed:', err.message)
      db.close()
      process.exit(1)
    }

    const toDelete = row?.cnt || 0
    console.log(`Found ${toDelete} generated chat log(s) matching pattern: "${likePattern}"`)

    if (toDelete === 0) {
      console.log('Nothing to delete.')
      db.close()
      return
    }

    db.run(`DELETE FROM chat_logs WHERE question LIKE ?`, [likePattern], function (delErr) {
      if (delErr) {
        console.error('Delete failed:', delErr.message)
        db.close()
        process.exit(1)
      }

      console.log(`Deleted ${this.changes} row(s). Running VACUUM...`)
      db.run('VACUUM', (vacErr) => {
        if (vacErr) console.error('VACUUM failed:', vacErr.message)
        // show remaining count
        db.get(`SELECT COUNT(*) as cnt FROM chat_logs`, (err2, remaining) => {
          if (err2) console.error('Count after delete failed:', err2.message)
          else console.log(`Remaining chat_logs rows: ${remaining?.cnt || 0}`)
          db.close()
        })
      })
    })
  })
}

run()
