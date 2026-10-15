let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
// 开场动画：七个镜头各截一张
const OUT=process.argv[2]||__dirname+'/out/film';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await PW.chromium.launch();
for(const vp of [{n:'phone',w:390,h:844,m:true},{n:'desk',w:1280,h:720}]){
const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.m?2:1,isMobile:!!vp.m});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto((process.env.SS_URL||'http://127.0.0.1:8765/index.html')+'#hub');await p.waitForTimeout(800);
await p.evaluate(()=>{byId('intro').classList.add('on');Film.start();});
for(let i=0;i<7;i++){await p.evaluate(i=>Film.show(i,5000,true),i);await p.waitForTimeout(2600);await p.screenshot({path:OUT+'/'+vp.n+'-shot'+(i+1)+'.png'});}
console.log(vp.n,errs.length?errs:'no errors');await ctx.close();}
await b.close();})();
