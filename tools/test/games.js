// 小游戏与面板冒烟测试：每个游戏开一局、按玩法操作、看是否能出结算卡；面板逐页截图
// 用法：node tools/test/games.js [phone|desk] [sat,lander,…]
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const ROOT=require('path').resolve(__dirname,'../..');
const fs=require('fs');
const VP=process.argv[2]||'phone';
const OUT=__dirname+'/out/games-'+VP;
const IDS=(process.argv[3]||'sat,lander,orbit,sling,station,const,sweep,paint').split(',');
const relaxSrc=fs.readFileSync(ROOT+'/js/games/relax.js','utf8');
const SETS=eval('('+relaxSrc.match(/const SETS=(\[[\s\S]*?\n  \]);/)[1]+')');

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch();
  const ctx=await b.newContext(VP==='phone'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:760}});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  p.on('dialog',d=>d.accept());
  await p.goto(BASE+'#hub');await p.waitForTimeout(900);
  const vs=p.viewportSize();
  const resultOn=()=>p.evaluate(()=>byId('gmResult').classList.contains('on'));
  async function waitResult(ms){const t0=Date.now();while(Date.now()-t0<ms){if(await resultOn())return true;await p.waitForTimeout(200);}return false;}
  async function drag(x0,y0,x1,y1,steps){await p.mouse.move(x0,y0);await p.mouse.down();for(let i=1;i<=steps;i++){await p.mouse.move(x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);await p.waitForTimeout(16);}await p.mouse.up();}
  const out=[];
  for(const id of IDS){
    await p.evaluate(g=>Games.open(g),id);await p.waitForTimeout(600);
    await p.screenshot({path:OUT+'/'+id+'-1-intro.png'});
    await p.click('#gmStart');await p.waitForTimeout(700);
    let note='';
    if(id==='sat'){
      for(let k=0;k<20&&!(await p.$('#rfStamp'));k++){
        const ids=await p.evaluate(()=>$$('#gmStage .part:not(.used)').map(x=>x.getAttribute('data-p')));
        if(!ids.length){await p.waitForTimeout(500);continue;}
        await p.evaluate(i=>{const e=document.querySelector('#gmStage [data-p="'+i+'"]');if(e)e.click();},ids[k%ids.length]);
        await p.waitForTimeout(k===1?50:250);if(k===1)await p.screenshot({path:OUT+'/'+id+'-2b-build.png'});
      }
      await p.waitForTimeout(800);
      await p.screenshot({path:OUT+'/'+id+'-2-play.png'});
      if(await p.$('#rfStamp')){await p.fill('#rfName','曙光-1');await p.click('#rfOrb button >> nth=1');await p.click('#rfStamp');note='registered';}
      else note='no reg form';
      await p.waitForTimeout(1500);await p.screenshot({path:OUT+'/'+id+'-3-launch.png'});
    }else if(id==='lander'){
      // 不做精确驾驶，只看流程：一直点推力会飞走/烧光，然后坠落
      for(let t=0;t<40&&!(await resultOn());t++){await p.keyboard.down('ArrowUp');await p.waitForTimeout(t%3===0?400:150);await p.keyboard.up('ArrowUp');await p.waitForTimeout(250);if(t===6)await p.screenshot({path:OUT+'/'+id+'-2-play.png'});}
    }else if(id==='sling'){
      const cv=await p.$('#gmStage canvas');const bb=await cv.boundingBox();
      /* 竖屏时棋盘是转过来画的：世界里的拖动方向 (dx,dy) 在屏幕上是 (-dy,-dx) */
      const port=bb.height>bb.width*1.15,ah=bb.height-112,k=port?Math.min(ah/1000,bb.width/620):Math.min(bb.width/1000,ah/620);/* 和游戏里一样：上下各留出标题栏和提示的位置 */const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
      const ang=353*Math.PI/180,wx=-Math.cos(ang)*85,wy=-Math.sin(ang)*85,sx=port?-wy*k:wx*k,sy=port?-wx*k:wy*k;
      await drag(cx,cy,cx+sx,cy+sy,10);
      await p.waitForTimeout(500);await p.screenshot({path:OUT+'/'+id+'-2-play.png'});
    }else if(id==='orbit'||id==='station'){
      for(let t=0;t<60&&!(await resultOn());t++){await p.mouse.click(vs.width*(.3+Math.random()*.4),vs.height*(.4+Math.random()*.3));await p.waitForTimeout(id==='station'?900:300);if(t===4)await p.screenshot({path:OUT+'/'+id+'-2-play.png'});}
    }else if(id==='const'){
      const set=SETS[0];const cv=await p.$('#gmStage canvas');const bb=await cv.boundingBox();
      const P=set.stars.map(s=>({x:bb.x+bb.width*.1+s[0]*bb.width*.8,y:bb.y+bb.height*.12+s[1]*bb.height*.66}));
      for(const [a,c] of set.lines){await p.mouse.click(P[a].x,P[a].y);await p.waitForTimeout(120);await p.mouse.click(P[c].x,P[c].y);await p.waitForTimeout(160);}
      await p.screenshot({path:OUT+'/'+id+'-2-play.png'});
    }else if(id==='sweep'){
      const t0=Date.now();let n=0;
      while(Date.now()-t0<64000&&!(await resultOn())){const y=vs.height*(.25+Math.random()*.5);await drag(vs.width*.1,y,vs.width*.9,y+(Math.random()-.5)*120,6);n++;if(n===12)await p.screenshot({path:OUT+'/'+id+'-2-play.png'});await p.waitForTimeout(250);}
    }else if(id==='paint'){
      for(let i=0;i<5;i++){await p.mouse.click(vs.width*(.2+i*.15),vs.height*(.35+(i%2)*.15));await p.waitForTimeout(200);}
      await drag(vs.width*.2,vs.height*.7,vs.width*.5,vs.height*.45,8);
      await p.waitForTimeout(2500);await p.screenshot({path:OUT+'/'+id+'-2-play.png'});
      await p.click('#ptDone');
    }
    const ok=await waitResult(id==='sat'?20000:12000);
    await p.waitForTimeout(400);
    await p.screenshot({path:OUT+'/'+id+'-4-result.png'});
    const rec=await p.evaluate(g=>JSON.stringify(S.games[g]||null),id);
    out.push({id,result:ok,note,rec});console.log(JSON.stringify(out[out.length-1]));
    if(ok)await p.click('#gmDone');else await p.evaluate(()=>Games.close());
    await p.waitForTimeout(500);
  }
  // 面板
  for(const tab of ['me','laws','precs','hist','achs','shop','set']){await p.evaluate(t=>Panels.open('archive',t),tab);await p.waitForTimeout(400);await p.screenshot({path:OUT+'/panel-'+tab+'.png'});}
  await p.evaluate(()=>Panels.close());
  await p.evaluate(()=>Panels.open('bench'));await p.waitForTimeout(400);await p.screenshot({path:OUT+'/panel-bench.png'});
  const bo=await p.$('#panel .bench-opt');if(bo){await bo.click();await p.waitForTimeout(400);await p.screenshot({path:OUT+'/panel-bench2.png'});}
  await p.evaluate(()=>Panels.close());
  await p.evaluate(()=>Panels.open('relax'));await p.waitForTimeout(400);await p.screenshot({path:OUT+'/panel-relax.png'});
  await p.evaluate(()=>Panels.close());
  await p.evaluate(()=>Panels.history(HISTORY[3].id));await p.waitForTimeout(500);await p.screenshot({path:OUT+'/panel-histcard.png'});
  // 激励广告占位
  const adP=p.evaluate(()=>ECON.rewarded('测试'));await p.waitForTimeout(800);await p.screenshot({path:OUT+'/ad.png'});
  console.log('ad result',await adP);
  console.log('errors:',errs.length?errs:'none');
  await b.close();
})();
