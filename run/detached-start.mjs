import { openSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = '/Users/chen/Documents/trae_projects/local_projects/may-89144';
const node = process.execPath;

start({
  name: 'frontend',
  args: [join(root, 'scripts/serve-frontend.mjs')],
  env: {
    HOST: '127.0.0.1',
    FRONTEND_PORT: '49144',
    BACKEND_PORT: '59144',
    NODE_ENV: 'development',
  },
});

start({
  name: 'backend',
  args: [join(root, 'scripts/serve-backend.mjs')],
  env: {
    HOST: '127.0.0.1',
    FRONTEND_PORT: '49144',
    BACKEND_PORT: '59144',
    NODE_ENV: 'development',
  },
});

function start({ name, args, env }) {
  const log = openSync(join(root, `${name}.log`), 'a');
  const child = spawn(node, args, {
    cwd: root,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, ...env },
  });
  child.unref();
  writeFileSync(join(root, `${name}.pid`), `${child.pid}\n`);
}
