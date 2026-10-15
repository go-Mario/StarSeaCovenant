"use strict";
/* =====================================================================
   开机页与开场影像。
   开场七个镜头，字幕念完即走，约 30 秒。默认用程序绘制的动画（js/ui/film.js），
   也可以切换成 assets/intro/ 的影像；影像读取失败时自动回落到动画。
   ===================================================================== */
const INTRO_SHOTS=[
 {clip:'01-sputnik',fb:'sc-c2031',cam:'camIn',amb:'sputnik',tx:'1957 年 10 月，一颗金属球飞过了所有国家的上空。<br>它只会发出“嘀，嘀”的声音。'},
 {clip:'02-crowded',fb:'sc-c2009',cam:'camOut',amb:'radio',tx:'六十多年后，天上已经挤满了卫星。<br>好用的轨道只有那么几条，频率只有那么几段。'},
 {clip:'03-scarcity',fb:'sc-moonsite',cam:'camR',amb:'radio',dip:true,tx:'人们开始去月球上挖冰，去小行星上找矿。<br>地方不够分，就会起争执。'},
 {clip:'04-reentry',fb:'sc-tundra',cam:'camIn',amb:'rumble',tx:'有时候，天上的东西会掉下来。'},
 {clip:'05-snowfield',fb:'sc-tundra',cam:'camL',amb:'wind',grade:'brightness(.8) saturate(.85)',tx:'掉在谁的土地上，谁来赔？'},
 {clip:'06-nolaw',fb:'sc-c2077',cam:'camUp',amb:'room',dip:true,tx:'太空里没有警察，也没有法院。<br>能用的，只有各国签下的条约，和一次次坐下来讲道理。'},
 {clip:'07-tribunal',fb:'sc-c2077',cam:'camIn',amb:'room',tx:'2077 年，星海仲裁院。<br>这里存着人类在太空里吵过的每一架，也存着每一次是怎么吵完的。'}];
/* 开场用哪一版画面：
   drawn = 程序绘制的动画（默认，素材全部自有，体积小）；
   clips = assets/intro/ 里的 7 段影像（经分析判断为 AI 生成，播放时角落会标注“画面由 AI 生成”）。
   确认影像来源和授权后，把下面改成 'clips' 即可；调试时也可以在地址后加 ?intro=clips */
const INTRO_CFG={mode:/[?&]intro=clips/.test(location.search)?'clips':'drawn'};
const Intro=(function(){
  let on=false,pause=false,skipShot=false,clipsOK=null,resolver=null,timer=null;
  function wait(ms){return new Promise(function(res){let el=0;clearInterval(timer);timer=setInterval(function(){if(!on||skipShot){clearInterval(timer);res();return;}if(!pause)el+=100;if(el>=ms){clearInterval(timer);res();}},100);});}
  function tryClip(v,src){return new Promise(function(res){
    if(!v||!src){res(false);return;}let done=false;const ok=function(){if(done)return;done=true;cl();res(true);},bad=function(){if(done)return;done=true;cl();res(false);};
    function cl(){v.removeEventListener('loadeddata',ok);v.removeEventListener('error',bad);clearTimeout(tm);}
    const tm=setTimeout(bad,2500);v.addEventListener('loadeddata',ok);v.addEventListener('error',bad);try{v.src=src;v.load();}catch(e){bad();}});}
  async function shot(sh,i){
    const layers=[byId('shotA'),byId('shotB')],L=layers[i%2],P=layers[(i+1)%2];
    skipShot=false;
    const sub=byId('introSub');
    if(sh.dip&&i>0){sub.style.opacity='0';byId('introDip').classList.add('on');await sleep(500);}
    L.className='ishot';
    const v=L.querySelector('video');
    const ms=Math.max(3200,stripTags(sh.tx).length*120+1600);
    let useV=false;
    if(INTRO_CFG.mode==='clips'&&clipsOK!==false){useV=await tryClip(v,'assets/intro/'+sh.clip+'.webm');if(i===0)clipsOK=useV;}
    byId('introAI').classList.toggle('on',useV);
    if(useV){L.classList.add('hasvid');v.style.filter=sh.grade||'';const want=Math.max(4200,stripTags(sh.tx).length*130+1800);
      const rate=isFinite(v.duration)&&v.duration>0?clamp(v.duration*1000/want,.45,.85):.6;
      try{v.playbackRate=rate;v.currentTime=0;const p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
      void L.offsetWidth;L.classList.add('on',sh.cam);if(P)P.classList.remove('on');}
    else{Film.show(i,ms+900,!!sh.dip);if(P)P.classList.remove('on');}
    if(sh.dip&&i>0){byId('introDip').classList.remove('on');sub.style.opacity='';}
    const tx=byId('introTx');tx.classList.add('hide');tx.innerHTML=sh.tx;
    const stop=AMB.run(sh.amb,9);
    await wait(350);tx.classList.remove('hide');
    const t0=Date.now(),bar=setInterval(function(){if(!pause)fillBar(i,Math.min(1,(Date.now()-t0)/ms));},200);
    await wait(ms);clearInterval(bar);fillBar(i,1);tx.classList.add('hide');stop();
  }
  function fillBar(i,r){const f=byId('introBarFill');if(f)f.style.width=((i+r)/INTRO_SHOTS.length*100).toFixed(1)+'%';}
  async function title(){
    byId('introSub').style.opacity='0';byId('introDip').classList.add('on');await sleep(450);
    const t=byId('introTitle');t.classList.add('on');byId('introDip').classList.remove('on');MUSIC.setMode('verdict');
    await wait(3000);t.classList.remove('on');byId('introSub').style.opacity='';
  }
  function finish(){
    if(!on)return;on=false;clearInterval(timer);Film.stop();byId('introAI').classList.remove('on');
    byId('intro').classList.remove('on');byId('introTitle').classList.remove('on');byId('introDip').classList.remove('on');
    $$('#intro video').forEach(function(v){try{v.pause();v.removeAttribute('src');v.load();}catch(e){}});
    S.profile.introSeen=true;save();
    if(resolver){const r=resolver;resolver=null;r();}
  }
  return {
    play(replay){
      return new Promise(async function(res){
        resolver=res;on=true;pause=false;
        byId('intro').classList.add('on');byId('introBarFill').style.width='0%';
        const h=byId('introHint');h.classList.add('on');setTimeout(function(){h.classList.remove('on');},5000);
        MUSIC.start();MUSIC.setMode('intro');Film.start();
        for(let i=0;i<INTRO_SHOTS.length&&on;i++)await shot(INTRO_SHOTS[i],i);
        if(on)await title();
        finish();
        if(replay)HUD.showHub();
      });
    },
    tap(){if(!on||pause)return;skipShot=true;},
    skip(){SFX.tap();finish();},
    pause(){if(!on)return;pause=!pause;Film.pause(pause);byId('introPause').innerHTML=pause?icon('ic-play')+'继续':icon('ic-pause')+'暂停';
      $$('#intro video').forEach(function(v){try{if(pause)v.pause();else{const p=v.play();if(p&&p.catch)p.catch(function(){});}}catch(e){}});SFX.tap();},
    isOn(){return on;}
  };
})();

/* ---------------- 开机 ---------------- */
async function enterGame(){
  const boot=byId('boot');if(boot.classList.contains('off'))return;
  unlockAudio();
  try{ac();MUSIC.start();}catch(e){}
  SFX.tap();boot.classList.add('off');
  if(!S.profile.introSeen){await Intro.play();}
  if(!S.profile.created){await new Promise(function(r){Avatar.open(true,r);});}
  HUD.showHub();Hub.init();
  setTimeout(function(){Hub.focusNext(false);},60);
  MUSIC.setMode(Hub.musicHere());
  if(S.migrated){S.migrated=false;save();setTimeout(function(){toast('旧存档已搬到新版本：已完成的章节、法典和先例都还在，另外送你一些星尘。',3800);},800);}
  S.lastPlay=todayKey();save();
}
