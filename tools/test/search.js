// 现场搜查（第一章取证、第五章勘验）：六种屏幕上，每个标记都要在画面里、没被挡住、真点得到；
// 看不到的标记靠屏幕边上的箭头转过去。点完对白框会收起、再升起，最后画面复原。
// 用法：node tools/test/search.js [ch5,ch1]；需要先在仓库根目录起一个静态服务器，见 docs/DESIGN.md
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const OUT=__dirname+'/out/search';require('fs').mkdirSync(OUT,{recursive:true});
const VPS=[['p390',390,844,true],['p360',360,640,true],['l844',844,390,true],['l740',740,360,true],['l932',932,430,true],['desk',1280,800,false]];
const CHS=(process.argv[2]||'ch5,ch1').split(',');
(async()=>{
  const br=await chromium.launch();let bad=0;
  for(const ch of CHS)for(const [n,w,h,mob] of VPS){
    const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:mob,hasTouch:mob});
    const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto(BASE+'?i='+n+ch+'#ch='+ch,{waitUntil:'domcontentloaded'});
    await pg.evaluate((T)=>{const f=runScript;runScript=function(ops){const k=ops.findIndex(o=>o.t===T);return f(ops.slice(k));};},ch==='ch1'?'invest':'inspect');
    const step=async()=>pg.evaluate(()=>{const v=id=>{const e=byId(id);return e&&e.classList.contains('on');};
        if(v('tipCard')&&byId('tcOk')){byId('tcOk').click();return 'tip';}
        if(v('chapterCard')&&byId('ccGo')){byId('ccGo').click();return 'card';}
        if(byId('theater').classList.contains('th-look'))return 'look';
        if(TH.typing||TH.resolver){dlgTap();return 'dlg';}return 'wait';});
    const untilLook=async()=>{for(let i=0;i<60;i++){const st=await step();if(st==='look')return true;await pg.waitForTimeout(250);}return false;};
    const vis=async()=>pg.evaluate(()=>{const sc=byId('thScene').getBoundingClientRect();return $$('#scSvg .hotspot').map(g=>{const r=g.querySelector('.ring').getBoundingClientRect();const cx=r.x+r.width/2,cy=r.y+r.height/2;const e=document.elementFromPoint(cx,cy);const inView=cx>=sc.left&&cx<=sc.right&&cy>=sc.top&&cy<=sc.bottom;return {x:+g.getAttribute('data-x'),cx:Math.round(cx),cy:Math.round(cy),inView,top:!!(e&&e.closest('.hotspot')===g)};});});
    const res={};let shots=0;
    let ok=await untilLook();res.look=ok;
    await pg.waitForTimeout(500);
    await pg.screenshot({path:OUT+'/'+ch+'-'+n+'-'+(shots++)+'.png'});
    res.bar=await pg.evaluate(()=>byId('srBar').textContent);
    let guard=0;
    while(ok&&guard++<8){
      const v=await vis();if(!v.length)break;
      const tgt=v.find(s=>s.inView&&s.top);
      if(!tgt){
        // use edge arrow
        const arrow=await pg.evaluate(()=>byId('srL').classList.contains('on')?'srL':byId('srR').classList.contains('on')?'srR':null);
        if(!arrow){res.stuck=v;bad++;break;}
        if(mob)await pg.tap('#'+arrow);else await pg.click('#'+arrow);
        await pg.waitForTimeout(600);
        (res.arrows=res.arrows||[]).push(arrow);
        if(shots<3)await pg.screenshot({path:OUT+'/'+ch+'-'+n+'-'+(shots++)+'.png'});
        continue;
      }
      if(mob)await pg.touchscreen.tap(tgt.cx,tgt.cy);else await pg.mouse.click(tgt.cx,tgt.cy);
      (res.taps=res.taps||[]).push(tgt.x);
      await pg.waitForTimeout(300);
      if(shots<4)await pg.screenshot({path:OUT+'/'+ch+'-'+n+'-'+(shots++)+'.png'});
      // advance dialog with real taps on dialog until look again or finished
      for(let i=0;i<30;i++){
        const st=await pg.evaluate(()=>({look:byId('theater').classList.contains('th-look'),srch:byId('theater').classList.contains('th-search'),t:TH.typing,r:!!TH.resolver,tip:byId('tipCard').classList.contains('on')}));
        if(st.look||!st.srch)break;
        if(st.tip){await pg.evaluate(()=>byId('tcOk').click());}
        else if(st.t||st.r){const b=await pg.evaluate(()=>{const r=byId('dlg').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height*.6];});if(mob)await pg.touchscreen.tap(b[0],b[1]);else await pg.mouse.click(b[0],b[1]);}
        await pg.waitForTimeout(250);
      }
      const srch=await pg.evaluate(()=>byId('theater').classList.contains('th-search'));
      if(!srch)break;
      // ch1: return button appears once keys found
      const back=await pg.evaluate(()=>byId('inspectDone').classList.contains('on')&&byId('inspectDone').textContent);
      if(back==='回庭'){res.back=true;}
    }
    // drag test on portrait
    res.end=await pg.evaluate(()=>({srch:byId('theater').classList.contains('th-search'),vb:byId('scSvg').getAttribute('viewBox'),left:$$('#scSvg .hotspot').length,dlgOp:getComputedStyle(byId('dlg')).opacity}));
    if(!res.look||res.end.left||res.end.srch||res.end.vb!=='0 0 1200 600'||errs.length)bad++;
    console.log(ch,n,JSON.stringify(res),errs.length?errs:'');
    await ctx.close();
  }
  await br.close();console.log(bad?'FAIL '+bad:'ok');process.exit(bad?1:0);
})();
