// 帧率测量：CPU 降速 4 倍（近似中端手机），统计各场景的平均帧率、p95 帧时、卡顿帧数
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const RATE=+(process.argv[2]||4);
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  await p.goto((process.env.SS_URL||'http://127.0.0.1:8765/index.html')+'#hub');await p.waitForTimeout(1500);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
  const rec=async(name,fn,ms)=>{
    await p.evaluate(()=>{window.__ft=[];let l=performance.now();window.__on=true;(function f(t){if(!window.__on)return;window.__ft.push(t-l);l=t;requestAnimationFrame(f);})(performance.now());});
    await fn();await p.waitForTimeout(ms);
    const ft=await p.evaluate(()=>{window.__on=false;return window.__ft.slice(2);});
    ft.sort((a,b)=>a-b);const avg=ft.reduce((a,b)=>a+b,0)/ft.length;
    console.log(name.padEnd(22),'fps',(1000/avg).toFixed(1),' p95',ft[Math.floor(ft.length*.95)].toFixed(1)+'ms',' >50ms',ft.filter(x=>x>50).length,'/',ft.length);
  };
  await rec('map idle',async()=>{},2000);
  await rec('map drag',async()=>{(async()=>{await p.mouse.move(200,400);await p.mouse.down();for(let i=0;i<60;i++){await p.mouse.move(200+Math.sin(i/6)*150,400+Math.cos(i/7)*150);await p.waitForTimeout(16);}await p.mouse.up();})();},2200);
  await rec('map fly+zoom',async()=>{await p.evaluate(()=>{StarMap.zoomBy(2.5);setTimeout(()=>StarMap.fit(true),800);});},1800);
  await rec('land theater',async()=>{await p.evaluate(()=>StarMap.land('theater'));},1800);
  await rec('planet view idle',async()=>{},1500);
  await p.evaluate(()=>PlanetView.close());await p.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await p.evaluate(()=>{startChapter('ch1');});await p.waitForTimeout(600);
  await p.evaluate(()=>{const b=document.getElementById('ccGo');if(b)b.click();});await p.waitForTimeout(1500);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
  await rec('theater dialogue',async()=>{},2500);
  await rec('theater tap-through',async()=>{(async()=>{for(let i=0;i<10;i++){await p.evaluate(()=>{if(typeof dlgTap==='function')dlgTap();});await p.waitForTimeout(220);}})();},2500);
  await b.close();
})();
