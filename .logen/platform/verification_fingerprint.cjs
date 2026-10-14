// Read-only proof identity. Hash source AND local dependencies/build outputs.
// Unknown/special files, escaping links, concurrent writes or a large tree
// disable reuse; they never turn an unavailable measurement into a pass.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = fs.realpathSync(process.cwd());
const hashes = { source: crypto.createHash('sha256'), artifacts: crypto.createHash('sha256') };
let files = 0;
let bytes = 0;
const started = Date.now();
const artifacts = /^(_build|\.bin|frontend\/dist|priv\/static)(\/|$)/;

function visit(relative) {
  if (++files > 100000 || Date.now() - started > 2000) throw new Error('budget');
  const filename = path.join(root, relative);
  const before = fs.lstatSync(filename);
  const hash = hashes[artifacts.test(relative) ? 'artifacts' : 'source'];
  hash.update(JSON.stringify([relative, before.mode]));
  if (before.isDirectory()) {
    for (const name of fs.readdirSync(filename).sort()) {
      if (name !== '.git') visit(path.join(relative, name));
    }
  } else if (before.isFile() || before.isSymbolicLink()) {
    const resolved = fs.realpathSync(filename);
    if (!resolved.startsWith(root + path.sep)) throw new Error('external link');
    if (before.isSymbolicLink()) hash.update(fs.readlinkSync(filename));
    if (!fs.statSync(resolved).isFile()) throw new Error('directory link');
    const target = fs.statSync(resolved);
    bytes += target.size;
    if (bytes > 512 * 1024 * 1024) throw new Error('budget');
    const data = fs.readFileSync(filename);
    hash.update(JSON.stringify(data.length));
    hash.update(data);
    const targetAfter = fs.statSync(resolved);
    if (target.mtimeMs !== targetAfter.mtimeMs || target.ctimeMs !== targetAfter.ctimeMs || target.size !== targetAfter.size) {
      throw new Error('concurrent write');
    }
  } else {
    throw new Error('special file');
  }
  const after = fs.lstatSync(filename);
  if (before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || before.size !== after.size) {
    throw new Error('concurrent write');
  }
}

try {
  visit('');
  process.stdout.write(JSON.stringify({ source: hashes.source.digest('hex'), artifacts: hashes.artifacts.digest('hex') }));
} catch (_) {
  process.exitCode = 2;
}
