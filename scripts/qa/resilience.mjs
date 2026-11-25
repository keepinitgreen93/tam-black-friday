// Resilience tests: (A) no audio sink -> muted fallback, (B) media blocked -> error panel + retry works, (C) file truly missing -> slot hidden, (D) probe endpoint flakes -> player still shown.
import { launch, sleep, click } from './cdp.mjs';
const BASE = process.argv[2] || 'http://localhost:8791/';
const out = {};
async function session(extra, fn) {
  const b = await launch({ browser: 'chrome', outDir: 'out/qa-res', port: 9300 + Math.floor(Math.random() * 90), extra });
  for (const d of ['Page', 'Runtime', 'Network']) await b.send(d + '.enable');
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  try { await fn(b); } finally { await b.close(); }
}
const st = (b) => b.evalJS(`(()=>{const v=document.querySelector('.bfp__video'),r=document.querySelector('.bfp');if(!v||!r)return JSON.stringify({player:false,slotHidden:document.querySelector('[data-vsl]')?.hidden});return JSON.stringify({player:true,st:r.dataset.state,t:+v.currentTime.toFixed(2),muted:v.muted,paused:v.paused,note:document.querySelector('.bfp__note')?.textContent,noteOn:document.querySelector('.bfp__note')?.dataset.on,err:document.querySelector('[data-errtxt]')?.textContent})})()`).then((x) => JSON.parse(x));
const playerCenter = async (b) => { await b.evalJS(`document.querySelector('.bfp').scrollIntoView({block:'center'})`); await sleep(400); const r = JSON.parse(await b.evalJS(`JSON.stringify(document.querySelector('.bfp').getBoundingClientRect())`)); return [r.x + 40, r.y + 30]; };

// A: no audio sink (NOSINK env removes --disable-audio-output)
if (process.env.NOSINK) {
  await session([], async (b) => {
    await b.send('Page.navigate', { url: BASE }); await sleep(5000);
    const [x, y] = await playerCenter(b); await click(b.send, x, y);
    const samples = []; for (let i = 0; i < 9; i++) { await sleep(1500); samples.push(await st(b)); }
    out.A_noSink = { final: samples[samples.length - 1], timeline: samples.map((s) => `${s.st}/t=${s.t}/muted=${s.muted}`) };
    // user turns sound back on from the speaker button
  });
  console.log(JSON.stringify(out, null, 1)); process.exit(0);
}

// B: block the media file -> error panel -> unblock -> Try again
await session([], async (b) => {
  await b.send('Network.setBlockedURLs', { urls: ['*bf-vsl_web.mp4*'] });
  await b.send('Page.navigate', { url: BASE }); await sleep(5000);
  const [x, y] = await playerCenter(b); await click(b.send, x, y); await sleep(3000);
  const err = await st(b);
  await b.send('Network.setBlockedURLs', { urls: [] });
  const rb = JSON.parse(await b.evalJS(`JSON.stringify(document.querySelector('[data-retry]').getBoundingClientRect())`));
  await click(b.send, rb.x + rb.width / 2, rb.y + rb.height / 2); await sleep(4500);
  out.B_errorRetry = { errorShown: err.st === 'error', errorText: err.err, afterRetry: await st(b) };
});

// C: file truly missing (probe says exists:false) -> slot hidden, no player
await session([], async (b) => {
  await b.send('Fetch.enable', { patterns: [{ urlPattern: '*bf-vsl_web.mp4?probe=1*' }] });
  b.on(async (m) => { if (m.method === 'Fetch.requestPaused') await b.send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"exists":false}').toString('base64') }); });
  await b.send('Page.navigate', { url: BASE }); await sleep(5000);
  out.C_missing = await st(b);
});

// D: probe fails (500) -> player must still show and play
await session([], async (b) => {
  await b.send('Fetch.enable', { patterns: [{ urlPattern: '*bf-vsl_web.mp4?probe=1*' }] });
  b.on(async (m) => { if (m.method === 'Fetch.requestPaused') await b.send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 500, responseHeaders: [], body: '' }); });
  await b.send('Page.navigate', { url: BASE }); await sleep(5000);
  const [x, y] = await playerCenter(b); await click(b.send, x, y); await sleep(3500);
  out.D_probeFlake = await st(b);
});
console.log(JSON.stringify(out, null, 1));
process.exit(0);
