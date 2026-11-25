// Real-Chrome playback test for the branded player. Usage: node playtest.mjs <pageUrl> <outDir> <name> <width> [mobile]
import fs from 'node:fs';
import { launch, sleep, click } from './cdp.mjs';
const [PAGE, OUT, NAME, WIDTH = '1440', MOBILE = ''] = process.argv.slice(2);
const mobile = MOBILE === 'mobile';
const W = Number(WIDTH), H = mobile ? 844 : 900;
fs.mkdirSync(OUT, { recursive: true });
const b = await launch({ browser: process.env.BROWSER || 'chrome', outDir: OUT + '/_p', port: 9800 + Math.floor(Math.random() * 150) });
const res = { page: PAGE, name: NAME, width: W, mobile, checks: {}, net: [], consoleErrors: [], failedReqs: [] };
b.on((m) => {
  if (m.method === 'Network.responseReceived') {
    const r = m.params.response;
    if (r.url.includes('/v/') && !r.url.includes('probe=1')) res.net.push({ f: r.url.split('/v/')[1], s: r.status, range: (r.requestHeaders || {}).Range || (r.requestHeaders || {}).range || null, cr: r.headers['Content-Range'] || r.headers['content-range'] || null });
  }
  if (m.method === 'Network.loadingFailed' && m.params.errorText !== 'net::ERR_ABORTED') res.failedReqs.push(m.params.errorText + ' ' + (m.params.type || ''));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) res.consoleErrors.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  if (m.method === 'Runtime.exceptionThrown') res.consoleErrors.push('EXC: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) res.consoleErrors.push('LOG ' + m.params.entry.level + ': ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
for (const d of ['Network', 'Page', 'Runtime', 'Log']) await b.send(d + '.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
if (mobile) {
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await b.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
}
const shot = async (file) => { const s = await b.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${NAME}-${file}.png`, Buffer.from(s.result.data, 'base64')); return `${OUT}/${NAME}-${file}.png`; };
const J = async (e) => { const v = await b.evalJS(e); return typeof v === 'string' && (v[0] === '{' || v[0] === '[') ? JSON.parse(v) : v; };
const state = () => J(`(()=>{const v=document.querySelector('.bfp__video');const r=document.querySelector('.bfp');if(!v)return JSON.stringify({noPlayer:true});return JSON.stringify({st:r.dataset.state,ctl:r.dataset.controls,busy:r.dataset.busy,t:+v.currentTime.toFixed(2),paused:v.paused,muted:v.muted,rs:v.readyState,dur:+v.duration.toFixed(1),err:v.error&&v.error.code,rate:v.playbackRate,tracksOn:[...v.textTracks].filter(t=>t.mode!=='disabled').length,controlsAttr:v.hasAttribute('controls')})})()`);
const rectOf = (sel) => J(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'null';const r=e.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height})})()`);
const tap = async (x, y) => {
  if (mobile) {
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await sleep(60);
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else await click(b.send, x, y);
};
await b.send('Page.navigate', { url: PAGE });
for (let i = 0; i < 40; i++) { if (await J(`!!document.querySelector('.bfp')`)) break; await sleep(250); }
await sleep(1200);
res.checks.playerMounted = await J(`!!document.querySelector('.bfp')`);
res.checks.docOverflowX = await J(`document.documentElement.scrollWidth - window.innerWidth`);
res.checks.nativeControlsAttr = await J(`document.querySelector('.bfp__video')?.hasAttribute('controls')`);
res.checks.captionsOffAtLoad = (await state()).tracksOn === 0;
// Above-the-fold CTA (first .btn in the hero)
res.checks.ctaRect = await rectOf('.hero .btn, header .btn, .btn');
res.checks.ctaBottomWithinViewport = res.checks.ctaRect ? res.checks.ctaRect.y + res.checks.ctaRect.h <= H : null;
res.screens = {};
res.screens.top = await shot('poster-top');
await b.evalJS(`(()=>{const e=document.querySelector('.bfp');const r=e.getBoundingClientRect();window.scrollTo(0, window.scrollY + r.top - ${mobile ? 80 : 140});})()`);
await sleep(700);
res.checks.posterState = await state();
res.checks.playBtnRect = await rectOf('.bfp__playbtn');
res.checks.labelText = await J(`document.querySelector('.bfp__label')?.textContent`);
res.checks.durationLabelsInBar = await J(`document.querySelector('[data-dur]')?.textContent`);
res.screens.poster = await shot('poster');
// ---- click anywhere on the player surface (not the button itself) to prove "click anywhere"
const pr = await rectOf('.bfp');
await tap(pr.x + 40, pr.y + 30);
await sleep(1500);
res.checks.afterClick1_5s = await state();
await sleep(3500);
res.checks.afterClick5s = await state();
res.checks.playsWithSound = res.checks.afterClick5s.muted === false && res.checks.afterClick5s.t > 2;
// ---- seek to the middle via the progress bar
if (!mobile) { await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 }); await sleep(500); }
else if ((await state()).ctl === 'hide') { await tap(pr.x + pr.w / 2, pr.y + pr.h * 0.4); await sleep(500); }
const sk = await rectOf('[data-seek]');
const before = (await state()).t;
await tap(sk.x + sk.w * 0.5, sk.y + sk.h / 2);
await sleep(3500);
const mid = await state();
res.checks.seekMid = { before, after: mid.t, expected: +(mid.dur * 0.5).toFixed(1), resumedPlaying: !mid.paused, busy: mid.busy };
await sleep(1500);
res.checks.seekMidAdvancing = (await state()).t > mid.t + 0.8;
// controls visible screenshot
if (!mobile) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pr.x + pr.w / 2, y: pr.y + pr.h * 0.5 });
else if ((await state()).ctl === 'hide') await tap(pr.x + pr.w / 2, pr.y + pr.h * 0.4);
await sleep(500);
res.checks.controlsShown = (await state()).ctl;
res.screens.playing = await shot('playing');
{ const r = await rectOf('.bfp'); const z = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x + (await J('window.scrollX')), y: r.y + (await J('window.scrollY')), width: r.w, height: r.h, scale: 2 } }); fs.writeFileSync(`${OUT}/${NAME}-playing-zoom.png`, Buffer.from(z.result.data, 'base64')); res.screens.playingZoom = `${OUT}/${NAME}-playing-zoom.png`; }
// ---- keyboard (desktop only)
if (!mobile) {
  await b.evalJS(`document.querySelector('.bfp').focus()`);
  const key = async (k, code) => { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: code || k, text: k.length === 1 ? k : undefined }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: code || k }); await sleep(350); };
  await key(' ', 'Space'); const paused = await state();
  await key(' ', 'Space'); const resumed = await state();
  const t0 = (await state()).t; await key('ArrowRight', 'ArrowRight'); const fwd = (await state()).t;
  await key('ArrowLeft', 'ArrowLeft'); const back = (await state()).t;
  await key('m'); const m1 = await state(); await key('m'); const m2 = await state();
  await key('k'); const kp = await state(); await key('k'); const kr = await state();
  res.checks.keyboard = { spacePauses: paused.paused === true, spaceResumes: resumed.paused === false, arrowRightSeeks: +(fwd - t0).toFixed(1), arrowLeftSeeks: +(back - fwd).toFixed(1), mToggles: m1.muted === true && m2.muted === false, kToggles: kp.paused === true && kr.paused === false };
  // speed button
  await b.evalJS(`document.querySelector('[data-act="speed"]').click()`); const sp1 = (await state()).rate;
  await b.evalJS(`document.querySelector('[data-act="speed"]').click()`); const sp2 = (await state()).rate;
  await b.evalJS(`document.querySelector('[data-act="speed"]').click()`); const sp3 = (await state()).rate;
  res.checks.speedCycle = [sp1, sp2, sp3];
}
// ---- tap targets
res.checks.minTapTarget = await J(`(()=>{const out=[];document.querySelectorAll('.bfp__bar button, .bfp__seek, .bfp__big').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0)out.push([e.getAttribute('aria-label')||e.className,Math.round(r.width),Math.round(r.height)])});return JSON.stringify(out)})()`);
res.checks.hoverNone = await J(`matchMedia('(hover: none)').matches`);
// ---- mockup images on page (sales page)
res.checks.images = await J(`(async()=>{ const imgs=[...document.images]; imgs.forEach(i=>{i.loading='eager'}); await Promise.all(imgs.map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,4000)}))); return JSON.stringify({total:imgs.length, broken:imgs.filter(i=>!i.naturalWidth).map(i=>i.currentSrc||i.src), mockups:imgs.filter(i=>/mockup|offer|stack/i.test(i.src)).map(i=>[i.src.split('/').pop(), i.naturalWidth])}) })()`);
res.checks.finalState = await state();
await b.close();
res.net = res.net.slice(0, 12);
fs.writeFileSync(`${OUT}/${NAME}.json`, JSON.stringify(res, null, 2));
console.log(JSON.stringify(res, null, 1));
process.exit(0);
