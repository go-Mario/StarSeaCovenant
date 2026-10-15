// 法庭画面：每章开庭后推进几句对白，截图（手机竖屏、电脑、手机横屏；VP=land 只跑横屏）
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/theater';require('fs').mkdirSync(OUT,{recursive:true});
const CHS=(process.argv[3]||'ch1,ch2,ch3,ch4,ch5,ch6').split(',');const TAPS=+(process.env.TAPS||6);
(async()=>{const b=await PW.chromium.launch();
const VPS=[{n:'phone',w:390,h:844,m:true},{n:'desk',w:1280,h:760},{n:'land',w:844,h:390,m:true}].filter(v=>!process.env.VP||process.env.VP.split(',').includes(v.n));
for(const vp of VPS){
  for(const ch of CHS){
    const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.m?2:1,isMobile:!!vp.m,hasTouch:!!vp.m});const p=await ctx.newPage();
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+'#ch='+ch);await p.waitForTimeout(900);
    await p.evaluate(()=>{const b=document.getElementById('ccGo');if(b)b.click();});await p.waitForTimeout(1400);
    for(let i=0;i<TAPS;i++){await p.evaluate(()=>{if(byId('tipCard').classList.contains('on')){byId('tcOk').click();return;}if(TH.typing||TH.resolver)byId('dlg').click();});await p.waitForTimeout(i%2?500:150);}
    await p.waitForTimeout(700);await p.screenshot({path:OUT+'/'+vp.n+'-'+ch+'.png'});
    if(errs.length)console.log(vp.n,ch,errs);await ctx.close();
  }}
console.log('done');await b.close();})();
