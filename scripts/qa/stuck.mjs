// Simulates a device that accepts no audio: currentTime frozen while unmuted (muted playback still advances).
import { launch, sleep, click } from './cdp.mjs';
const mode = process.argv[2] || 'unmuted-stuck';
const b = await launch({ browser: 'chrome', outDir: 'out/qa-stuck', port: 9250 + Math.floor(Math.random() * 90) });
for (const d of ['Page','Runtime']) await b.send(d+'.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await b.send('Page.navigate', { url: 'http://localhost:8791/' }); await sleep(5000);
await b.evalJS(`(()=>{const v=document.querySelector('.bfp__video');const real=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'currentTime');Object.defineProperty(v,'currentTime',{get(){return ${mode==='always-stuck'?'0':'(v.muted?real.get.call(v):0)'}},set(x){real.set.call(v,x)}});document.querySelector('.bfp').scrollIntoView({block:'center'})})()`);
await sleep(400);
const r = JSON.parse(await b.evalJS(`JSON.stringify(document.querySelector('.bfp').getBoundingClientRect())`));
await click(b.send, r.x+40, r.y+30);
for (let i=0;i<5;i++){ await sleep(1500); console.log(mode, await b.evalJS(`(()=>{const v=document.querySelector('.bfp__video');const r=document.querySelector('.bfp');return r.dataset.state+' muted='+v.muted+' paused='+v.paused+' | note('+document.querySelector('.bfp__note').dataset.on+'): '+document.querySelector('.bfp__note').textContent.slice(0,60)+' | err: '+document.querySelector('[data-errtxt]').textContent})()`)); }
await b.close(); process.exit(0);
