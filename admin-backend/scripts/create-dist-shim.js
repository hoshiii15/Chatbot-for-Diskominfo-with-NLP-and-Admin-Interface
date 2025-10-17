const fs = require('fs');
const path = require('path');

const distRoot = path.resolve(__dirname, '..', 'dist');
const target = path.join(distRoot, 'admin-backend', 'src', 'app.js');
const shim = path.join(distRoot, 'app.js');

// Ensure dist exists
if (!fs.existsSync(distRoot)) {
    fs.mkdirSync(distRoot, { recursive: true });
}

// Create shim that requires the real entry if it exists
const content = `#!/usr/bin/env node
const path = require('path');
try {
  require('./admin-backend/src/app.js');
} catch (e) {
  // fallback: try resolving relative to this file
  try {
    require(path.join(__dirname, 'admin-backend', 'src', 'app.js'));
  } catch (err) {
    console.error('Failed to load compiled app at dist/admin-backend/src/app.js', err);
    process.exit(1);
  }
}
`;

// Write shim
fs.writeFileSync(shim, content, { encoding: 'utf8' });
fs.chmodSync(shim, 0o755);
console.log('Created shim at', shim);
