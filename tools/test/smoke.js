// 冒烟测试：开机 → 开场动画 → 设定形象 → 星图 → 降落开庭剧场 → 返回（手机、电脑两种尺寸）
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=process.argv[2]||__dirname+'/out/smoke';
(async()=>{
  require('fs').mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch();
  for(const vp of [{n:'phone',w:390,h:844},{n:'desk',w:1280,h:760}]){
    const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:vp.n==='phone'?2:1,isMobile:vp.n==='phone',hasTouch:vp.n==='phone'});
    const p=await ctx.newPage();
    const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
    await p.goto(BASE);await p.waitForTimeout(1200);
    await p.screenshot({path:OUT+'/'+vp.n+'-01-boot.png'});
    await p.click('#bootGo');await p.waitForTimeout(3200);
    await p.screenshot({path:OUT+'/'+vp.n+'-02-intro.png'});
    await p.click('#intro');await p.waitForTimeout(2600);
    await p.screenshot({path:OUT+'/'+vp.n+'-02b-intro.png'});
    await p.click('#introSkip');await p.waitForTimeout(800);
    await p.screenshot({path:OUT+'/'+vp.n+'-03-avatar.png'});
    await p.click('#avatar [data-skin="6"]');await p.click('#avatar [data-hair="coily"]');await p.waitForTimeout(300);
    await p.click('#avOk');await p.waitForTimeout(1500);
    await p.screenshot({path:OUT+'/'+vp.n+'-04-map.png'});
    await p.click('.wl[data-w="theater"] .wl-tag');await p.waitForTimeout(1800);
    await p.screenshot({path:OUT+'/'+vp.n+'-05-theater.png'});
    await p.click('#pvBack');await p.waitForTimeout(1200);
    await p.screenshot({path:OUT+'/'+vp.n+'-06-back.png'});
    await p.click('#btnStories');await p.locator('.ns-title').waitFor();
    await p.screenshot({path:OUT+'/'+vp.n+'-07-stories.png'});
    const fb=await p.$eval('#fatalbox',x=>x.style.display==='block'?x.textContent:'');
    console.log(vp.n,'errors:',errs.length?errs:'none',fb?('FATAL '+fb):'');
    await ctx.close();
  }
  await b.close();
})();
