// Real-Chrome/Edge QA harness for the branded video player (see scripts/qa/README in the commit message). Needs Chrome or Edge on Windows.
// Minimal CDP harness: launch real Chrome/Edge, return helpers. Node 22 (global WebSocket/fetch).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CANDIDATES = {
  chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
};

export async function launch({ browser = 'chrome', port = 9444, outDir, headless = true, extra = [] }) {
  const exe = CANDIDATES[browser];
  fs.mkdirSync(outDir, { recursive: true });
  const profile = path.join(path.resolve(outDir), `profile-${Date.now()}`);
  const proc = spawn(exe, [
    headless ? (process.env.HL || '--headless=new') : '',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', ...(process.env.NOSINK ? [] : ['--disable-audio-output']), ...(process.env.POLICY === 'none' ? [] : ['--autoplay-policy=' + (process.env.POLICY || 'document-user-activation-required')]), '--no-default-browser-check', '--disable-extensions',
    ...extra,
    'about:blank',
  ].filter(Boolean), { stdio: 'ignore' });
  let version = null;
  for (let i = 0; i < 80 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); }
  }
  if (!version) throw new Error('no devtools');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const t = targets.find((x) => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    else if (m.method) listeners.forEach((l) => l(m));
  };
  const send = (method, params = {}) => new Promise((r) => {
    const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params }));
  });
  const evalJS = async (expression) => {
    const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (m.result && m.result.exceptionDetails) return { __error: JSON.stringify(m.result.exceptionDetails.exception || m.result.exceptionDetails).slice(0, 300) };
    return m.result && m.result.result ? m.result.result.value : null;
  };
  const on = (fn) => listeners.push(fn);
  const close = async () => {
    try {
      const bws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((r) => { bws.onopen = r; });
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(1200);
    } catch {}
    try { proc.kill(); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  };
  return { send, evalJS, on, close, version: version.Browser };
}

export async function click(send, x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
