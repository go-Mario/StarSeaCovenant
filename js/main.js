"use strict";
/* =====================================================================
   启动与全局输入
   ===================================================================== */
(function boot(){
  try{
    registerPortraits();SCENES.register();FX.init();
    Hub.init();HUD.refresh();syncAudioBtns();
    byId('hub').classList.remove('on');
  }catch(e){showFatal('初始化失败：'+(e&&e.message||e));}

  /* 剧场按钮 */
  byId('dlg').addEventListener('click',function(e){if(e.target.closest('.term'))return;dlgTap();});
  byId('scSvg').addEventListener('click',function(){if(TH.running&&(TH.typing||TH.resolver))dlgTap();});
  byId('btnPress').onclick=function(){SFX.tap();crossAct('press');};
  byId('btnEv').onclick=function(){SFX.tap();crossAct('ev');};
  byId('btnLaw').onclick=function(){SFX.tap();crossAct('law');};
  byId('hintBtn').onclick=function(){SFX.tap();useHint();};
  byId('thExit').onclick=function(){SFX.tap();exitTheater();};
  const sk=byId('thSkip');
  sk.addEventListener('pointerdown',function(){skipHold(true);});
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){sk.addEventListener(ev,function(){skipHold(false);});});
  /* 开场影像 */
  byId('intro').addEventListener('click',function(){Intro.tap();});
  byId('introSkip').onclick=function(e){e.stopPropagation();Intro.skip();};
  byId('introPause').onclick=function(e){e.stopPropagation();Intro.pause();};
  /* 小游戏 */
  byId('gmBack').onclick=function(){SFX.tap();Games.close();};
  /* 星图底栏 */
  byId('btnNext').onclick=function(){SFX.tap();Hub.goNext();};
  byId('mapIn').onclick=function(){SFX.tap();StarMap.zoomBy(1.5);};
  byId('mapOut').onclick=function(){SFX.tap();StarMap.zoomBy(1/1.5);};
  byId('mapFit').onclick=function(){SFX.tap();StarMap.fit(true);};
  byId('hudDustBtn').onclick=function(){Panels.open('archive','shop');};
  byId('hudMe').onclick=function(){Panels.open('archive','me');};
  $$('.btn-snd').forEach(function(b){b.onclick=toggleSound;});
  $$('.btn-bgm').forEach(function(b){b.onclick=toggleBgm;});
  byId('bootGo').onclick=enterGame;

  /* 按压反馈 */
  const SEL='.btn,.iconbtn,.choice,.sh-item,.cta,.bd-q,.row-item,.rx-item,.part,.bench-opt,.cbtn';
  let pressed=null;
  document.addEventListener('pointerdown',function(e){const t=e.target.closest&&e.target.closest(SEL);if(t&&!t.disabled){pressed=t;t.classList.add('press-fx');}},{passive:true});
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){document.addEventListener(ev,function(){if(pressed){pressed.classList.remove('press-fx');pressed=null;}},{passive:true});});

  /* 键盘 */
  function nth(sel,k,e){if(!/^[1-9]$/.test(k))return false;const t=$$(sel)[+k-1];if(t&&!t.disabled){e.preventDefault();t.click();}return true;}
  document.addEventListener('keydown',function(e){
    const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;
    const k=e.key;
    if(k==='Control'&&TH.running){skipHold(true);return;}
    if(e.repeat&&k!==' '&&k!=='Enter')return;
    const boot=byId('boot');
    if(!boot.classList.contains('off')){if(k==='Enter'||k===' '){e.preventDefault();enterGame();}return;}
    if(Intro.isOn()){if(k===' '||k==='Enter'){e.preventDefault();Intro.tap();}else if(k==='Escape')Intro.skip();else if(k==='p')Intro.pause();return;}
    if(byId('tipCard').classList.contains('on')){if(k===' '||k==='Enter'){e.preventDefault();byId('tcOk').click();}return;}
    if(byId('verdict').classList.contains('on')){if(k===' '||k==='Enter'||k==='Escape'){e.preventDefault();byId('vclose').click();}return;}
    if(byId('histCard').classList.contains('on')){if(k===' '||k==='Enter'||k==='Escape'){e.preventDefault();byId('hcOk').click();}return;}
    if(byId('chapterCard').classList.contains('on')){const b=byId('ccGo')||byId('crOk');if((k===' '||k==='Enter')&&b){e.preventDefault();b.click();}return;}
    if(TH.running&&byId('theater').classList.contains('on')){
      if(byId('shelf').classList.contains('on')){if(k==='Escape'){byId('shelfCancel').click();return;}nth('#shelfList .sh-item',k,e);return;}
      if(byId('choices').classList.contains('on')){nth('#choices .choice',k,e);return;}
      if(byId('board').classList.contains('on')){return;}
      if(byId('crossbar').classList.contains('on')){if(k==='ArrowRight'||k==='ArrowDown'){e.preventDefault();crossAct('next');return;}const m={q:'press',w:'ev',e:'law',h:'hint'}[k.toLowerCase()];if(m){e.preventDefault();if(m==='hint')useHint();else if(m!=='law'||!byId('btnLaw').classList.contains('hidden')){SFX.tap();crossAct(m);}return;}}
      if(k===' '||k==='Enter'){e.preventDefault();dlgTap();}
      return;
    }
    if(byId('pen').classList.contains('on')){if(k==='Escape')Pen.back();return;}
    if(byId('game').classList.contains('on')){if(k==='Escape')Games.close();return;}
    if(byId('panel').classList.contains('on')){if(k==='Escape')Panels.close();return;}
    if(byId('hub').classList.contains('on')){
      if(PlanetView.isOpen()){
        if(k==='Escape'||k==='Backspace'){e.preventDefault();PlanetView.close();return;}
        if(nth('#pvNodes .pn',k,e))return;
      }else{
        const pan={ArrowRight:[160,0],ArrowLeft:[-160,0],ArrowUp:[0,-160],ArrowDown:[0,160]}[k];
        if(pan){e.preventDefault();StarMap.pan(pan[0],pan[1]);return;}
        if(k==='+'||k==='='){StarMap.zoomBy(1.4);return;}
        if(k==='-'||k==='_'){StarMap.zoomBy(1/1.4);return;}
        if(k==='0'){StarMap.fit(true);return;}
        if(/^[1-6]$/.test(k)){StarMap.land((WORLDS[+k-1]||STATION).id);return;}
        if(k==='Enter'){Hub.goNext();return;}
      }
    }
    if(k==='m'||k==='M')toggleBgm();
  });
  document.addEventListener('keyup',function(e){if(e.key==='Control')skipHold(false);});
  addEventListener('blur',function(){if(TH.skipHold)skipHold(false);});

  /* 调试入口：index.html#ch=ch3 直接进入某章（会跳过开机与开场） */
  const m=location.hash.match(/ch=(ch\d)/);
  if(m){byId('boot').classList.add('off');S.profile.introSeen=true;S.profile.created=true;
    CH_ORDER.slice(0,CH_ORDER.indexOf(m[1])).forEach(function(id){if(!S.ch[id])S.ch[id]={done:true,grade:'调试',picks:[]};});
    HUD.showHub();setTimeout(function(){startChapter(m[1]);},200);}
  const g=location.hash.match(/game=(\w+)/);
  if(g){byId('boot').classList.add('off');S.profile.introSeen=true;S.profile.created=true;HUD.showHub();setTimeout(function(){Games.open(g[1]);},200);}
  if(location.hash==='#hub'){byId('boot').classList.add('off');S.profile.introSeen=true;S.profile.created=true;HUD.showHub();setTimeout(function(){Hub.focusNext(false);},100);}
})();
