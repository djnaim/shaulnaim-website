// ============================================================
//  Preflight check: accessibility.mjs
//  Runs axe-core (wcag2a + wcag2aa) against THREE states:
//   1. index.html as served
//   2. index.html with a release modal open (openRelease(0))
//   3. accessibility.html
//  Plus static assertions:
//   - every <iframe> has a title
//   - every <img> has alt
//   - accessibility.html exists + index.html footer links to it
//   - skip-link + <main> present
//
//  MECHANISM (no extra deps): vendored axe.min.js + a built-in http static
//  server + system Chrome headless driven over CDP via node's global WebSocket.
// ============================================================
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  const candidates = [
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

function startStaticServer(root) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';
        const filePath = join(root, urlPath);
        if (!filePath.startsWith(root)) {
          res.writeHead(403).end();
          return;
        }
        const buf = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(buf);
      } catch {
        res.writeHead(404).end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// Minimal CDP client over the global WebSocket. Sends commands, awaits the
// matching id, ignores events.
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', (e) => reject(new Error('CDP WebSocket error: ' + (e.message || 'unknown'))));
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    try { this.ws.close(); } catch { /* noop */ }
  }
}

async function evaluate(cdp, expression, awaitPromise = true) {
  const r = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    allowUnsafeEvalBlocklisting: true,
  });
  if (r.exceptionDetails) {
    throw new Error('Eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}

async function navigateAndSettle(cdp, url) {
  await cdp.send('Page.navigate', { url });
  // Wait for load event.
  await new Promise((resolve) => {
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Page.loadEventFired') {
        cdp.ws.removeEventListener('message', handler);
        resolve();
      }
    };
    cdp.ws.addEventListener('message', handler);
    // Safety timeout: resolve after 8s regardless.
    setTimeout(() => { cdp.ws.removeEventListener('message', handler); resolve(); }, 8000);
  });
  // Give the page's JS (renderGrid, etc.) a beat to run.
  await evaluate(cdp, 'new Promise(r=>setTimeout(r,400))');
}

async function runAxe(cdp, axeSource) {
  await evaluate(cdp, axeSource, false);
  const result = await evaluate(
    cdp,
    `axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})
       .then(r => JSON.stringify({
         violations: r.violations.map(v => ({id:v.id, impact:v.impact, nodes:v.nodes.length, help:v.help}))
       }))`,
  );
  return JSON.parse(result);
}

async function getDevtoolsWsUrl(port) {
  // Poll http://127.0.0.1:port/json for the page target.
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

// Static (non-browser) assertions read straight from the source files.
async function staticAssertions(root) {
  const errs = [];
  const index = await readFile(join(root, 'index.html'), 'utf8').catch(() => null);
  const appJs = await readFile(join(root, 'app.js'), 'utf8').catch(() => null);

  if (index == null) {
    errs.push('index.html not found (a11y static checks).');
    return errs;
  }

  // accessibility.html exists.
  try {
    await stat(join(root, 'accessibility.html'));
  } catch {
    errs.push('accessibility.html does not exist (legally-required statement page).');
  }

  // Footer links to accessibility.html.
  if (!/href=["']accessibility\.html["']/.test(index)) {
    errs.push('index.html does not link to accessibility.html.');
  }

  // Skip-link + <main> present.
  if (!/class=["'][^"']*skip-link/.test(index) && !/href=["']#main["']/.test(index)) {
    errs.push('index.html: skip-link is missing.');
  }
  if (!/<main\b/i.test(index)) {
    errs.push('index.html: <main> landmark is missing.');
  }

  // Every <iframe> (in index.html AND app.js) has a title=.
  for (const [label, src] of [['index.html', index], ['app.js', appJs]]) {
    if (src == null) continue;
    const iframes = src.match(/<iframe\b[^>]*>/gi) || [];
    for (const tag of iframes) {
      if (!/\btitle\s*=/.test(tag)) {
        errs.push(`${label}: an <iframe> is missing a title attribute -> ${tag.slice(0, 80)}`);
      }
    }
  }

  // Every <img> (in index.html AND app.js) has an alt=.
  for (const [label, src] of [['index.html', index], ['app.js', appJs]]) {
    if (src == null) continue;
    const imgs = src.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgs) {
      if (!/\balt\s*=/.test(tag)) {
        errs.push(`${label}: an <img> is missing an alt attribute -> ${tag.slice(0, 80)}`);
      }
    }
  }

  return errs;
}

export async function checkAccessibility(root) {
  const errors = [];
  const warnings = [];

  // ---- Static assertions first (no browser needed) ----
  errors.push(...(await staticAssertions(root)));

  // ---- axe-core via Chrome over CDP ----
  const chrome = findChrome();
  if (!chrome) {
    errors.push('axe-core skipped: no Chrome/Chromium found (set CHROME_PATH). Accessibility browser audit is REQUIRED, treating as error.');
    return { name: 'Accessibility (axe-core WCAG 2.0 AA)', errors, warnings };
  }

  let axeSource;
  try {
    axeSource = readFileSync(join(import.meta.dirname, 'vendor', 'axe.min.js'), 'utf8');
  } catch {
    errors.push('axe-core vendor file missing at scripts/preflight/vendor/axe.min.js.');
    return { name: 'Accessibility (axe-core WCAG 2.0 AA)', errors, warnings };
  }

  const { server, port } = await startStaticServer(root);
  const userDataDir = await mkdtemp(join(tmpdir(), 'sn-preflight-chrome-'));
  let chromeProc = null;
  let cdp = null;

  try {
    chromeProc = spawn(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Chrome prints "DevTools listening on ws://..." to stderr; we parse the
    // port from the /json endpoint instead, but we still need the actual port.
    const devtoolsPort = await new Promise((resolve) => {
      let buf = '';
      const onData = (d) => {
        buf += d.toString();
        const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (m) { chromeProc.stderr.off('data', onData); resolve(Number(m[1])); }
      };
      chromeProc.stderr.on('data', onData);
      setTimeout(() => resolve(null), 12000);
    });

    if (!devtoolsPort) {
      errors.push('axe-core: Chrome did not report a DevTools port.');
      return { name: 'Accessibility (axe-core WCAG 2.0 AA)', errors, warnings };
    }

    const wsUrl = await getDevtoolsWsUrl(devtoolsPort);
    if (!wsUrl) {
      errors.push('axe-core: could not obtain a DevTools page target.');
      return { name: 'Accessibility (axe-core WCAG 2.0 AA)', errors, warnings };
    }

    cdp = new CDP(wsUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const base = `http://127.0.0.1:${port}`;

    const report = (label, axeResult) => {
      for (const v of axeResult.violations) {
        errors.push(`axe [${label}] ${v.id} (${v.impact || 'n/a'}, ${v.nodes} node(s)): ${v.help}`);
      }
    };

    // State 1: index.html as served.
    await navigateAndSettle(cdp, `${base}/index.html`);
    report('index.html', await runAxe(cdp, axeSource));

    // State 2: index.html with a release modal open.
    await navigateAndSettle(cdp, `${base}/index.html`);
    const opened = await evaluate(
      cdp,
      `(function(){ try { if (typeof openRelease==='function'){ openRelease(0); }
         else { var c=document.querySelector('#grid .card'); if(c){c.click();} }
         return document.getElementById('modal') && document.getElementById('modal').classList.contains('open');
       } catch(e){ return 'ERR:'+e.message; } })()`,
    );
    if (opened !== true) {
      warnings.push(`a11y modal state: could not confirm modal opened (got ${JSON.stringify(opened)}); axe ran on whatever state resulted.`);
    }
    await evaluate(cdp, 'new Promise(r=>setTimeout(r,200))');
    report('index.html+modal', await runAxe(cdp, axeSource));

    // State 3: accessibility.html.
    await navigateAndSettle(cdp, `${base}/accessibility.html`);
    report('accessibility.html', await runAxe(cdp, axeSource));
  } catch (err) {
    errors.push(`axe-core run failed: ${err.message}`);
  } finally {
    if (cdp) cdp.close();
    if (chromeProc) { try { chromeProc.kill('SIGKILL'); } catch { /* noop */ } }
    server.close();
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }

  return { name: 'Accessibility (axe-core WCAG 2.0 AA)', errors, warnings };
}
