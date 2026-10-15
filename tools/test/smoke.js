// 冒烟测试：加载、开机、开场、形象、长卷截图
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const ROOT=require('path').resolve(__dirname,'../..');
const path=require('path');
const OUT=process.argv[2]||__dirname+'/out/smoke';
const URL=BASE;
(async()=>{
  require('fs').mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch();
  for(const vp of [{n:'phone',w:390,h:844},{n:'desk',w:1280,h:760}]){
    const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.n==='phone'?2:1});
    const p=await ctx.newPage();
    const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
    await p.goto(URL);await p.waitForTimeout(1200);
    await p.screenshot({path:OUT+'/'+vp.n+'-01-boot.png'});
    await p.click('#bootGo');await p.waitForTimeout(2500);
    await p.screenshot({path:OUT+'/'+vp.n+'-02-intro.png'});
    await p.click('#introSkip');await p.waitForTimeout(800);
    await p.screenshot({path:OUT+'/'+vp.n+'-03-avatar.png'});
    await p.click('#avatar [data-skin="6"]');await p.click('#avatar [data-hair="coily"]');await p.waitForTimeout(300);
    await p.screenshot({path:OUT+'/'+vp.n+'-03b-avatar.png'});
    await p.click('#avOk');await p.waitForTimeout(1200);
    await p.screenshot({path:OUT+'/'+vp.n+'-04-hub.png'});
    for(const e of ['e1','e2','e3','e4','e5']){
      await p.evaluate(id=>{const s=document.querySelector('[data-era="'+id+'"].era');const v=document.getElementById('hubView');v.scrollLeft=s.offsetLeft+(id==='e1'?0:document.documentElement.clientWidth*.14);},e);
      await p.waitForTimeout(700);
      await p.screenshot({path:OUT+'/'+vp.n+'-05-'+e+'.png'});
    }
    const fb=await p.$eval('#fatalbox',x=>x.style.display==='block'?x.textContent:'');
    console.log(vp.n,'errors:',errs.length?errs:'none',fb?('FATAL '+fb):'');
    await ctx.close();
  }
  await b.close();
})();
