// 全章节自动通关：读取当前剧本步骤，按“正确打法”逐一点击；
// 用法：node tools/test/play.js [mode] [vp] [ch1,ch2…]
//   mode = smart（正确打法）| random（掺随机错误）| settle（第四章接受和解）| bad（专挑错的，测输掉的流程）
//   vp = phone | desk；需要先在仓库根目录起一个静态服务器，见 docs/DESIGN.md
let PW;try{PW=require('playwright');}catch(e){PW=require('/opt/node-tools/node_modules/playwright');}
const {chromium}=PW;
const BASE=process.env.SS_URL||'http://127.0.0.1:8765/index.html';
const ROOT=require('path').resolve(__dirname,'../..');
const fs=require('fs');
const MODE=process.argv[2]||'smart';
const VP=process.argv[3]||'phone';
const OUT=__dirname+'/out/play-'+MODE+'-'+VP;
const ONLY=process.argv[4]?process.argv[4].split(','):null;
const URL=BASE+'#ch='+(ONLY?ONLY[0]:'ch1');

const AP_SRC=function(MODE){
  let seed=7;function R(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  const AP=window.__AP={mode:MODE,choose:null,cross:null,chain:null,prec:null,presented:new Set(),postUsed:0,lastKind:'',stats:{choices:0,wrong:0}};
  const wrap=function(name,store){const f=window[name];window[name]=function(){store(arguments);return f.apply(this,arguments);};};
  const _choose=choose;
  choose=function(h,a,o,r){AP.choose={head:h,ask:a,opts:o};return _choose(h,a,o,r).then(function(i){AP.choose=null;return i;});};
  const _shelf=shelf;
  shelf=function(t,items,r,c){AP.shelf={title:t,items:items};return _shelf(t,items,r,c).then(function(i){AP.shelf=null;return i;});};
  wrap('doCross',function(a){AP.cross=a[0];AP.presented=new Set();});
  wrap('doChain',function(a){AP.chain=a[0];});
  wrap('doPrecCite',function(a){AP.prec=a[0];});
  wrap('doHearing',function(a){AP.hearing=a[0];});
  wrap('doAward',function(a){AP.award=a[0];});
  function vis(id){const e=byId(id);return e&&e.classList.contains('on');}
  function txt(s){return stripTags(fill(s)).replace(/\s+/g,'');}
  function pickChoice(){
    const c=AP.choose;if(!c)return 0;const o=c.opts,h=String(c.head||'');AP.stats.choices++;
    const rnd=function(){return Math.floor(R()*o.length);};
    let m=h.match(/第 (\d+)\/\d+ 环/);
    if(MODE==='bad'){
      if(m&&AP.chain){const need=AP.chain.links[+m[1]-1].need;const i=o.findIndex(function(e){return e.id!==need;});return i<0?0:i;}
      if(h==='对方翻出了你说过的话'&&AP.prec)return Math.max(0,AP.prec.opts.findIndex(function(e){return !e.ok;}));
      if(o.some(function(e){return e.legal;}))return Math.max(0,o.findIndex(function(e){return e.legal==='ultra';}),o.findIndex(function(e){return e.legal==='wrong';}));
      if(o.some(function(e){return e.ok!==undefined;}))return Math.max(0,o.findIndex(function(e){return !e.ok;}));
    }
    if(m&&AP.chain){if(MODE==='random'&&R()<.3)return rnd();const need=AP.chain.links[+m[1]-1].need;const i=o.findIndex(function(e){return e.id===need;});return i<0?0:i;}
    if(h==='这一案怎么收场')return MODE==='settle'?1:0;
    if(h==='裁决之后'){const i=AP.postUsed++;return Math.min(i,o.length-1);}
    if(h==='对方翻出了你说过的话'&&AP.prec){if(MODE==='random')return rnd();return Math.max(0,AP.prec.opts.findIndex(function(e){return e.ok;}));}
    if(o.some(function(e){return e.legal;})){if(MODE==='random')return rnd();return Math.max(0,o.findIndex(function(e){return e.legal==='ok';}));}
    if(o.some(function(e){return e.ok!==undefined;})){if(MODE==='random'&&R()<.25)return rnd();const i=o.findIndex(function(e){return e.ok;});return i<0?0:i;}
    return rnd();
  }
  function neededFacts(){
    const s=new Set();const scr=CUR.script;
    (function walk(ops){ops.forEach(function(op){if(op.t==='award')op.d.issues.forEach(function(iss){iss.opts.forEach(function(x){if(x.legal==='ok')(x.need||[]).forEach(function(f){s.add(f);});});});});})(scr);
    return s;
  }
  AP.peeked=new Set();
  function peek(k){if(AP.peeked.has(TH.ch+k))return false;AP.peeked.add(TH.ch+k);return true;}
  AP.step=function(){
    if(byId('fatalbox')&&byId('fatalbox').style.display==='block')return 'fatal:'+byId('fatalbox').textContent;
    if(vis('adModal'))return 'ad';
    if(vis('tipCard')&&byId('tcOk')){byId('tcOk').click();return 'tip';}
    if(vis('chapterCard')){if(byId('crOk')){if(peek('result'))return 'peek:result';byId('crOk').click();return 'done';}if(byId('ccGo')){if(peek('card'))return 'peek:card';byId('ccGo').click();return 'card';}}
    if(vis('ending')&&byId('enOk')){if(peek('ending'))return 'peek:ending';byId('enOk').click();return 'ending';}
    if(vis('verdict')&&byId('vclose')){if(peek('verdict'))return 'peek:verdict';byId('vclose').click();return 'verdict';}
    if(vis('shelf')&&AP.shelf){
      const it=AP.shelf.items;let id;
      if(AP.shelf.title==='引用哪一条'&&MODE==='bad')id=it.find(function(x){return x.id!==CUR.law;}).id;
      else if(AP.shelf.title==='引用哪一条')id=(MODE==='random'&&R()<.3)?it[Math.floor(R()*it.length)].id:CUR.law;
      else id=AP.wantEv||it[0].id;
      let i=it.findIndex(function(x){return x.id===id;});if(i<0)i=0;
      $$('#shelfList .sh-item')[i].click();AP.wantEv=null;return 'shelf';
    }
    if(vis('choices')&&$$('#choices .choice').length){const i=pickChoice();(document.querySelector('#choices .choice[data-i="'+i+'"]')||$$('#choices .choice')[i]).click();return 'choice';}
    if(vis('board')){if(peek($('#board [data-a]')?'award':'hearing'))return 'peek:'+($('#board [data-a]')?'award':'hearing');
      const qs=$$('#board .bd-q:not([disabled])');
      if(qs.length||$('#board [data-q="__end"]')){
        const need=neededFacts();const H=AP.hearing;
        const seen=new Set();CUR.script.forEach(function(op){if(op.t==='inspect')op.d.spots.forEach(function(s){if(s.fact)seen.add(s.fact);});});
        const ok=function(b,pref){const q=H.qs.find(function(x){return x.id===b.getAttribute('data-q');});return q&&q.kind!=='improper'&&q.fact&&need.has(q.fact)&&TH.facts.indexOf(q.fact)<0&&(!pref||!seen.has(q.fact));};
        const good=qs.find(function(b){return ok(b,true);})||qs.find(function(b){return ok(b,false);});
        if(MODE==='random'&&qs.length&&R()<.4){qs[Math.floor(R()*qs.length)].click();return 'hearing';}
        if(good){good.click();return 'hearing';}
        $('#board [data-q="__end"]').click();return 'hearing-end';
      }
      const w=$$('#board [data-a]').find(function(b){return b.textContent==='写这一项';});
      if(w){w.click();return 'award';}
      const s=$('#board [data-a="sign"]');if(s&&!s.disabled){s.click();return 'sign';}
      return 'board?';
    }
    if(TH.typing||TH.resolver){byId('dlg').click();return 'tap';}
    if(vis('crossbar')){
      if(hasMech('law')&&!TH.lawCited&&!byId('btnLaw').classList.contains('hidden')){byId('btnLaw').click();return 'law';}
      const t=byId('dlgText').textContent.replace(/\s+/g,'');
      const all=[];AP.cross.lines.forEach(function(l){all.push(l);if(l.add)all.push(l.add);});
      const ln=all.find(function(l){return txt(l.x)===t;});
      if(!ln)return 'cross-unknown:'+t.slice(0,30);
      if(MODE==='bad'){const w=TH.evs.find(function(e){return e!==ln.weak;});if(w){AP.wantEv=w;byId('btnEv').click();return 'present-bad';}}
      if(ln.weak&&TH.evs.indexOf(ln.weak)>=0&&!AP.presented.has(t)&&!(MODE==='random'&&R()<.3)){AP.presented.add(t);AP.wantEv=ln.weak;byId('btnEv').click();return 'present';}
      if(MODE==='random'&&R()<.15){AP.wantEv=TH.evs[Math.floor(R()*TH.evs.length)];byId('btnEv').click();return 'present-rnd';}
      byId('btnPress').click();return 'press';
    }
    const hs=$('#scSvg .hotspot');
    if(hs&&!TH.busy){hs.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'hotspot';}
    if(vis('inspectDone')&&!TH.busy&&!hs){byId('inspectDone').click();return 'inspect-done';}
    return 'wait';
  };
};

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch();
  const ctx=await b.newContext(VP==='phone'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:760}});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  p.on('dialog',d=>d.accept());
  await p.goto(URL);await p.waitForTimeout(900);
  await p.evaluate('('+AP_SRC.toString()+')('+JSON.stringify(MODE)+')');
  const chs=ONLY||['ch1','ch2','ch3','ch4','ch5','ch6'];
  const report=[];
  for(const ch of chs){
    if(ch!==chs[0]){
      await p.evaluate(c=>{if(TH&&TH.running)return;startChapter(c);},ch);
    }
    const t0=Date.now();let last='',waitSince=Date.now(),shot={},steps=0,res='timeout';
    while(Date.now()-t0<8*60e3){
      const r=await p.evaluate('__AP.step()');steps++;
      const kind=r.split(':')[0];
      if(kind==='peek'){await p.waitForTimeout(700);await p.screenshot({path:OUT+'/'+ch+'-P-'+r.split(':')[1]+'.png'});continue;}
      if(r.startsWith('fatal')||r.startsWith('cross-unknown')||r==='board?'){res=r;break;}
      if(!shot[kind]&&['card','choice','shelf','hearing','award','verdict','present','hotspot','tip','ending','press'].includes(kind)){
        shot[kind]=1;await p.waitForTimeout(450);await p.screenshot({path:OUT+'/'+ch+'-'+kind+'.png'});
      }
      if(r==='done'){res='done';break;}
      if(r==='wait'){if(Date.now()-waitSince>20000){res='stuck';break;}}else waitSince=Date.now();
      // 主线跑完后 TH.running=false 且返回长卷：说明失败退场
      const st=await p.evaluate('({run:TH.running,hub:byId("hub").classList.contains("on"),m:TH.morale,ch:TH.ch})');
      if(!st.run&&st.hub&&r==='wait'&&st.ch===ch){res='left-theater';break;}
      await p.waitForTimeout(r==='wait'?120:30);
    }
    if(res==='done')await p.waitForTimeout(800);
    const info=await p.evaluate(c=>({rec:S.ch[c]&&{grade:S.ch[c].grade,ending:S.ch[c].ending,miss:S.ch[c].picks.filter(x=>!x.ok).map(x=>x.q+'/'+x.tag)},morale:TH.morale,facts:TH.facts,dust:S.dust,rep:S.rep,focus:S.focus,stats:__AP.stats}),ch);
    report.push({ch,res,secs:((Date.now()-t0)/1000).toFixed(0),steps,...info});
    console.log(JSON.stringify(report[report.length-1]));
    if(res!=='done'){await p.screenshot({path:OUT+'/'+ch+'-FAIL.png'});const dbg=await p.evaluate(()=>({dlg:byId('dlgText').textContent.slice(0,120),ch:document.querySelector('#choices.on')?'choices on':'',sh:byId('shelf').className,bd:byId('board').className,cb:byId('crossbar').className,run:TH.running,res:!!TH.resolver,typ:TH.typing,busy:TH.busy}));console.log('DEBUG',JSON.stringify(dbg));if(!ONLY)break;}
    // 补精力，保证下一章能开（模拟去休憩舱）
    await p.evaluate(()=>{S.focus=100;save();});
    await p.waitForTimeout(600);
  }
  await p.screenshot({path:OUT+'/zz-hub.png'});
  console.log('errors:',errs.length?errs:'none');
  await b.close();
})();
