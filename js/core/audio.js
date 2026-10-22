"use strict";
/* =====================================================================
   声音：全部用 Web Audio 实时合成，没有采样，也就没有版权素材。
   母线：各声部 → 声像 → 干声 + 混响送量 → 高切 → 压缩 → 输出
   ===================================================================== */
let AC=null,acUnlocked=false,silentEl=null;
/* 一段 0.05 秒的静音 WAV：iOS 需要先真的“播”过一次，静音拨片才管不住网页声音 */
const SILENT_WAV='data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
function unlockAudio(){
  if(acUnlocked)return;
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  try{
    if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume().catch(function(){});
    const b=AC.createBuffer(1,1,AC.sampleRate),src=AC.createBufferSource();src.buffer=b;src.connect(AC.destination);src.start(0);
  }catch(e){}
  try{if(!silentEl){silentEl=new Audio(SILENT_WAV);silentEl.loop=true;silentEl.volume=0;silentEl.setAttribute('playsinline','');}
    const p=silentEl.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
  if(AC&&AC.state==='running')acUnlocked=true;
}
['pointerdown','touchstart','touchend','mousedown','keydown'].forEach(function(ev){document.addEventListener(ev,unlockAudio,{capture:true,passive:true});});
function ac(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(AC.state==='suspended'){AC.resume().catch(function(){});}
  return AC;
}
document.addEventListener('visibilitychange',function(){
  if(!AC)return;
  try{if(document.hidden){if(AC.state==='running')AC.suspend();}else if(S.sound||S.bgm){if(AC.state==='suspended')AC.resume();}}catch(e){}
});

let BUS=null;
function makeIR(c,sec,decay){
  /* 暗色混响：白噪先过一阶低通再衰减。
     纯白噪的 IR 会给每一段铺底加一层“沙沙”的高频尾巴，听起来像电流声。 */
  const rate=c.sampleRate,len=Math.max(1,Math.floor(rate*sec)),buf=c.createBuffer(2,len,rate);
  for(let ch=0;ch<2;ch++){
    const d=buf.getChannelData(ch);let lp=0;
    for(let i=0;i<len;i++){
      lp=lp*.82+(Math.random()*2-1)*.18;
      d[i]=lp*Math.pow(1-i/len,decay);
    }
  }
  return buf;
}
function bus(){
  const c=ac();if(!c)return null;
  if(BUS&&BUS.ctx===c)return BUS;
  const master=c.createGain();master.gain.value=.9;
  const tame=c.createBiquadFilter();tame.type='highshelf';tame.frequency.value=7200;tame.gain.value=-4.5;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=26;comp.ratio.value=2.6;comp.attack.value=.006;comp.release.value=.22;
  master.connect(tame);tame.connect(comp);comp.connect(c.destination);
  const conv=c.createConvolver();conv.buffer=makeIR(c,2.0,2.6);
  const pre=c.createDelay(.2);pre.delayTime.value=.022;const wet=c.createGain();wet.gain.value=.6;
  pre.connect(conv);conv.connect(wet);wet.connect(master);
  BUS={ctx:c,master:master,verb:pre};return BUS;
}
function toBus(node,pan,send){
  const B=bus();if(!B){try{node.connect(ac().destination);}catch(e){}return;}
  let out=node;
  if(B.ctx.createStereoPanner&&pan){const p=B.ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);node.connect(p);out=p;}
  out.connect(B.master);
  if(send>0){const g=B.ctx.createGain();g.gain.value=send;out.connect(g);g.connect(B.verb);}
}
let NB=null;
function noiseB(){const c=ac();if(!c)return null;
  if(!NB||NB.sampleRate!==c.sampleRate){NB=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=NB.getChannelData(0);
    let b0=0,b1=0,b2=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.1848)*.42;}}
  return NB;}
function beep(f,d,type,vol,delay,pan,send){
  if(!S.sound)return;if(!isFinite(f)||!isFinite(d))return;const c=ac();if(!c)return;
  const t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.12,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);toBus(g,pan||0,send===undefined?.16:send);o.start(t);o.stop(t+d+.05);
}
function noiseHit(vol,freq,dur,pan,send,ftype,q,delay,sweepTo){
  if(!S.sound)return;const c=ac();if(!c)return;const B=noiseB();if(!B)return;
  const t=c.currentTime+(delay||0),src=c.createBufferSource();src.buffer=B;
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((vol||.2)*2.2,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+(dur||.18));
  const f=c.createBiquadFilter();f.type=ftype||'lowpass';f.frequency.setValueAtTime(freq||900,t);if(q)f.Q.value=q;
  if(sweepTo)f.frequency.exponentialRampToValueAtTime(sweepTo,t+(dur||.18));
  src.connect(f);f.connect(g);toBus(g,pan||0,send===undefined?.2:send);src.start(t,Math.random()*1.5,(dur||.18)+.05);
}
function thump(vol,f0,f1,dur,delay){
  if(!S.sound)return;const c=ac();if(!c)return;const t=c.currentTime+(delay||0);
  const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.7);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);toBus(g,0,.12);o.start(t);o.stop(t+dur+.05);
}
/* 五声音阶：放松小游戏里的每一次连线、每一次清扫都落在这几个音上，怎么按都不难听 */
const PENTA=[0,2,4,7,9];
function pentaNote(i,base){const o=Math.floor(i/5),k=((i%5)+5)%5;return (base||67)+o*12+PENTA[k];}

let lastVoiceT=0;
const SFX={
  tap(){noiseHit(.12,3200,.02,0,.05,'bandpass',1.2);beep(1250,.03,'sine',.07,0,0,.04);},
  card(){noiseHit(.13,1400,.09,-.1,.12,'bandpass',.9,0,3600);},
  page(){noiseHit(.11,900,.22,.1,.16,'bandpass',.7,0,3200);noiseHit(.07,2400,.08,.15,.1,'bandpass',1,.12);},
  voice(who){
    if(!S.sound)return;const c=ac();if(!c)return;if(c.currentTime-lastVoiceT<.045)return;lastVoiceT=c.currentTime;
    const v=(typeof voiceOf==='function'&&voiceOf(who))||[440,'triangle'];
    const t=c.currentTime,f=v[0]*(.94+Math.random()*.12),o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
    o.type=v[1];o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.92,t+.05);
    lp.type='lowpass';lp.frequency.value=v[1]==='square'?1300:2400;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v[1]==='square'?.045:.07,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.06);
    o.connect(lp);lp.connect(g);toBus(g,0,.06);o.start(t);o.stop(t+.08);
  },
  objection(){thump(.42,110,38,.32);noiseHit(.22,1800,.09,0,.25,'bandpass',.8);noiseHit(.08,500,.4,0,.4,'lowpass');MUSIC.stab([50,53,57,62],.06);},
  win(){const c=ac();if(!c)return;[62,66,69,74].forEach(function(n,i){MUSIC.ep(n,c.currentTime+i*.09,.6,.55,(i%2?.25:-.25),true);});},
  lose(){const c=ac();if(!c)return;MUSIC.ep(45,c.currentTime,.9,.5,0,true);MUSIC.ep(46,c.currentTime+.02,.9,.32,0,true);},
  gavel(){[0,.17].forEach(function(d,i){thump(i?.16:.26,240,120,.12,d);noiseHit(i?.08:.14,1900,.05,0,.22,'bandpass',1.4,d);});},
  stamp(){thump(.32,160,55,.2);noiseHit(.18,1200,.07,0,.2,'bandpass',.9);},
  ach(){const c=ac();if(!c)return;MUSIC.bell(83,c.currentTime,.08,true);MUSIC.bell(88,c.currentTime+.14,.07,true);},
  reveal(){SFX.card();const c=ac();if(!c)return;MUSIC.bell(86,c.currentTime+.04,.055,true);},
  coin(){const c=ac();if(!c)return;MUSIC.bell(88,c.currentTime,.05,true);MUSIC.bell(95,c.currentTime+.07,.04,true);},
  whoosh(){noiseHit(.1,300,.6,0,.3,'bandpass',.6,0,2400);},
  chime(i){const c=ac();if(!c||!S.sound)return;MUSIC.bell(pentaNote(i||0,72),c.currentTime,.06,true);},
  pluck(i){const c=ac();if(!c||!S.sound)return;MUSIC.plk(pentaNote(i||0,60),c.currentTime,.5,.6,true);},
  error(){beep(220,.12,'triangle',.09);beep(180,.16,'triangle',.075,.08);},
  ok(){beep(880,.08,'sine',.08);beep(1320,.12,'sine',.07,.06);},
  dock(){thump(.36,90,40,.3);noiseHit(.14,700,.2,0,.25,'bandpass',1.2);noiseHit(.05,3000,.05,0,.1,'bandpass',3,.12);},
  thrust(on){/* 持续推力由 Thruster 控制，见下 */},
  launch(){noiseHit(.11,180,1.6,0,.3,'lowpass',.7,0,900);thump(.17,70,30,1.2);},
  burn(){noiseHit(.1,2400,.35,0,.2,'bandpass',.8,0,600);},
  pop(){beep(660,.06,'sine',.09);noiseHit(.07,2600,.04,0,.05,'bandpass',2);},
  drop(){beep(320,.1,'triangle',.09);noiseHit(.08,900,.08,0,.1,'bandpass',1);},
  radio(){noiseHit(.08,2200,.25,0,.15,'bandpass',2);beep(1020,.25,'square',.03,.02);}
};
/* 着陆器、机械臂之类的持续声：开着就响，关掉就停 */
const Thruster={node:null,g:null,
  on(level){if(!S.sound)return;const c=ac();if(!c)return;const B=noiseB();if(!B)return;
    if(!this.node){const s=c.createBufferSource();s.buffer=B;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;
      const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(g);toBus(g,0,.15);s.start();this.node=s;this.g=g;}
    this.g.gain.setTargetAtTime(.22*(level==null?1:level),c.currentTime,.05);},
  off(){if(!this.node)return;const c=ac();this.g.gain.setTargetAtTime(0,c.currentTime,.06);},
  kill(){if(!this.node)return;try{this.node.stop();}catch(e){}this.node=null;this.g=null;}
};

/* ---------------------------------------------------------------
   配乐：16 分音符网格上的写好的谱子，乐器现场合成
   ep 电钢琴 · str 弦乐垫 · bas 贝斯 · cel 低音弦 · bel 钟片 · plk 拨弦
   --------------------------------------------------------------- */
const SONGS={
  /* 五个时代各一首（星球与小游戏按时代取用），切换时交叉淡化 */
  retro:{bpm:84,bars:4,swing:.12,crackle:true,
    ch:[[41,[57,60,64,69]],[38,[57,60,62,65]],[43,[55,59,62,65]],[36,[55,60,64,67]]],
    arp:{steps:[0,6,8,14],idx:[0,2,1,3],vel:.3,oct:0},
    mel:[[0,0,76,6],[0,8,74,4],[0,12,72,4],[1,0,69,12],[2,0,71,4],[2,4,72,4],[2,8,74,8],[3,0,72,12]],melVel:.36,
    bass:[[0,4],[8,4,7]],bassVol:.05,hat:[4,12]},
  cartoon:{bpm:104,bars:4,
    ch:[[48,[64,67,72]],[45,[64,69,72]],[41,[65,69,72]],[43,[62,67,71]]],
    plk:{steps:[0,3,6,8,11,14],idx:[0,1,2,1,2,0],vel:.3,oct:12},
    mel:[[0,0,79,3],[0,4,76,3],[0,8,72,4],[1,0,81,6],[1,8,79,4],[2,0,77,4],[2,4,76,4],[2,8,74,8],[3,0,74,4],[3,4,76,4],[3,8,79,8]],melVel:.32,
    bass:[[0,3],[6,2],[8,3,7]],bassVol:.055,kick:[0,8],kickVol:.08,shaker:[4,12]},
  tech:{bpm:112,bars:4,
    ch:[[38,[57,62,64,69]],[41,[57,60,65,69]],[36,[55,60,64,67]],[43,[55,59,62,67]]],
    seq:{steps:[0,2,3,5,6,8,10,11,13,14],vel:.22},
    lead:[[0,0,74,4],[0,6,76,2],[0,8,77,8],[1,8,76,8],[2,0,79,6],[2,8,77,4],[3,0,74,12]],leadVol:.02,
    bass:[[0,2],[4,2],[8,2],[12,2]],bassVol:.05,kick:[0,8],kickVol:.1,shaker16:true,str:.012},
  frontier:{bpm:76,bars:4,
    ch:[[40,[56,59,64,68]],[45,[57,61,64,69]],[42,[54,61,64,66]],[47,[54,59,63,66]]],
    plk:{steps:[0,4,6,10,12],idx:[0,2,3,1,2],vel:.26,oct:12},
    mel:[[0,0,76,8],[0,8,78,8],[1,0,81,12],[2,0,78,6],[2,8,76,8],[3,0,75,12]],melVel:.3,
    str:.02,bass:[[0,10],[10,6,7]],bassVol:.05,shaker:[4,12],shakerB:true},
  deep:{bpm:52,bars:4,
    ch:[[36,[48,55,62,67]],[33,[45,52,59,64]],[29,[48,53,57,64]],[31,[50,55,59,62]]],
    str:.03,choir:.016,bass:[[0,16]],bassVol:.04,sparse:[[0,3,12],[8,2,24]],sparseVel:.26,bellTop:true},
  /* 剧场 */
  court:{bpm:70,bars:4,
    ch:[[38,[53,57,60,64]],[46,[50,53,57,62]],[43,[53,57,58,62]],[45,[49,55,58,61]]],
    arp:{steps:[0,2,4,6,8,10,12,14],idx:[0,2,1,3,2,1,3,2],vel:.24,oct:0},
    mel:[[0,0,74,3],[0,3,76,1],[0,4,77,4],[0,8,81,6],[0,14,79,2],[1,0,77,8],[1,8,74,8],[2,0,79,4],[2,4,77,4],[2,8,76,4],[2,12,74,4],[3,0,73,12],[3,12,76,4]],
    melVel:.36,str:.02,bass:[[0,12],[12,4,7]],bassVol:.05,kick:[0],kickVol:.09},
  tension:{bpm:100,bars:4,
    ch:[[38,[50,53,57,62]],[38,[50,53,58,62]],[38,[50,55,58,62]],[37,[49,52,57,61]]],
    ost:[[0,12,0,10,0,7,0,12],[0,12,0,10,0,8,0,12],[0,12,0,10,0,8,0,7],[0,12,0,8,0,4,0,12]],ostVol:.04,
    stab:[0,6],stabVol:.02,pulse:true,
    lead:[[0,0,69,8],[0,8,70,4],[0,12,69,4],[1,0,67,8],[1,8,65,8],[2,0,64,4],[2,4,65,4],[2,8,67,8],[3,0,69,12],[3,12,73,4]],leadVol:.024,
    kick:[0,10],kickVol:.12,shaker16:true,timp:true},
  invest:{bpm:58,bars:4,
    ch:[[38,[50,52,57,64]],[34,[50,53,57,64]],[36,[48,50,55,62]],[38,[50,52,57,62]]],
    sparse:[[0,3,12],[6,2,12],[10,1,12]],sparseVel:.34,str:.022,bass:[[0,16]],bassVol:.05,tick:true,wind:true},
  verdict:{bpm:56,bars:4,
    ch:[[38,[50,53,57,62]],[34,[46,53,58,62]],[31,[43,52,55,58]],[33,[45,52,57,61]]],
    str:.028,bass:[[0,16]],bassVol:.05,bellTop:true,timp:true,choir:.02},
  victory:{bpm:96,bars:4,
    ch:[[38,[50,54,57,62]],[43,[50,55,59,62]],[35,[50,54,57,59]],[45,[49,52,57,61]]],
    arp:{steps:[0,2,4,6,8,10,12,14],idx:[0,1,2,3,2,1,2,3],vel:.28,oct:12},
    mel:[[0,0,78,4],[0,4,81,4],[0,8,86,8],[1,0,83,6],[1,6,81,2],[1,8,79,8],[2,0,78,4],[2,4,79,4],[2,8,81,8],[3,0,76,8],[3,8,73,4],[3,12,76,4]],
    melVel:.42,str:.015,bass:[[0,6],[8,6,7]],bassVol:.055,kick:[0,8],kickVol:.1,shaker:[4,12]},
  intro:{bpm:50,bars:4,
    ch:[[38,[50,52,57]],[34,[46,50,53,60]],[41,[45,53,57,60]],[36,[48,50,55]]],
    str:.03,bass:[[0,16]],bassVol:.045,sparse:[[0,2,12],[8,1,24]],sparseVel:.28},
  /* 小游戏与休憩舱 */
  game:{bpm:118,bars:4,
    ch:[[45,[60,64,69]],[41,[60,65,69]],[48,[60,64,67]],[43,[59,62,67]]],
    plk:{steps:[0,2,4,6,8,10,12,14],idx:[0,1,2,1,0,1,2,1],vel:.24,oct:12},
    bass:[[0,2],[4,2],[8,2],[12,2]],bassVol:.05,kick:[0,8],kickVol:.09,shaker:[2,6,10,14]},
  relax:{bpm:60,bars:4,
    ch:[[41,[57,60,64,67]],[38,[57,62,65,69]],[36,[55,60,64,67]],[43,[55,59,62,67]]],
    str:.022,sparse:[[0,2,12],[6,3,12],[12,1,24]],sparseVel:.22,bass:[[0,16]],bassVol:.035}
};
const MUSIC_VOL=1.35;
const MUSIC={on:false,mode:'retro',step:0,nextT:0,timer:null,bus:null,mg:null,loopN:0,wind:null,crk:null,
  hz(n){return 440*Math.pow(2,(n-69)/12);},
  start(){const c=ac();if(!c||this.on)return;this.on=true;
    this.bus=c.createGain();this.bus.gain.value=S.bgm?MUSIC_VOL:0;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=38;hp.Q.value=.6;
    this.bus.connect(hp);toBus(hp,0,0);
    this.mg=c.createGain();this.mg.gain.value=1;this.mg.connect(this.bus);
    this.step=0;this.loopN=0;this.nextT=c.currentTime+.12;
    this.timer=setInterval(()=>this.loop(),50);
    this.ambFor(SONGS[this.mode]);},
  setBgm(on){const c=ac();if(!c||!this.bus)return;const t=c.currentTime;
    this.bus.gain.cancelScheduledValues(t);this.bus.gain.setValueAtTime(this.bus.gain.value,t);this.bus.gain.linearRampToValueAtTime(on?MUSIC_VOL:0,t+.6);},
  setMode(m){if(!SONGS[m]||this.mode===m)return;this.mode=m;
    const c=ac();if(!c||!this.on||!this.bus){this.step=0;this.loopN=0;return;}
    const t=c.currentTime,old=this.mg;
    if(old){old.gain.cancelScheduledValues(t);old.gain.setValueAtTime(old.gain.value,t);old.gain.linearRampToValueAtTime(0,t+1.3);setTimeout(function(){try{old.disconnect();}catch(e){}},2200);}
    this.mg=c.createGain();this.mg.gain.setValueAtTime(0,t);this.mg.gain.linearRampToValueAtTime(1,t+1.4);this.mg.connect(this.bus);
    this.step=0;this.loopN=0;this.nextT=Math.max(this.nextT,t+.06);
    this.ambFor(SONGS[m]);},
  ambFor(song){if(song&&song.wind)this.windOn();else this.windOff();if(song&&song.crackle)this.crackleOn();else this.crackleOff();},
  loop(){const c=ac();if(!c||!this.mg)return;
    if(this.nextT<c.currentTime-.3)this.nextT=c.currentTime+.05;
    const song=SONGS[this.mode]||SONGS.retro,spb=60/song.bpm/4;
    while(this.nextT<c.currentTime+.2){
      const sw=(song.swing&&this.step%2===1)?spb*song.swing:0;
      this.schedule(song,this.step,this.nextT+sw,spb);this.nextT+=spb;this.step++;
      if(this.step>=song.bars*16){this.step=0;this.loopN++;}}},
  out(node,pan,send){const c=ac();let o=node;
    if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);node.connect(p);o=p;}
    if(this.mg)o.connect(this.mg);
    if(send>0&&BUS){const g=c.createGain();g.gain.value=send;o.connect(g);g.connect(BUS.verb);}},
  sfxOut(node,pan,send){toBus(node,pan||0,send||0);},
  ep(n,t,dur,vel,pan,isSfx){const c=ac();if(!c)return;if(isSfx&&!S.sound)return;const f=this.hz(n);if(!isFinite(f)||!isFinite(t))return;
    vel=clamp(vel||.5,.05,1);
    const car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),tine=c.createOscillator(),tg=c.createGain();
    car.frequency.value=f;mod.frequency.value=f;tine.frequency.value=f*14;
    mg.gain.setValueAtTime(f*(1.1+vel*1.6),t);mg.gain.exponentialRampToValueAtTime(f*.08,t+1.1);
    tg.gain.setValueAtTime(f*.5*vel,t);tg.gain.exponentialRampToValueAtTime(.5,t+.07);
    mod.connect(mg);mg.connect(car.frequency);tine.connect(tg);tg.connect(car.frequency);
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(5000,f*7);
    const g=c.createGain(),pk=.085*vel;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+.005);g.gain.exponentialRampToValueAtTime(pk*.4,t+.3);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.7);
    car.connect(lp);lp.connect(g);
    if(isSfx)this.sfxOut(g,pan,.25);else this.out(g,pan,.28);
    [car,mod,tine].forEach(function(o){o.start(t);o.stop(t+dur+.8);});},
  plk(n,t,dur,vel,isSfx){const c=ac();if(!c)return;if(isSfx&&!S.sound)return;const f=this.hz(n);
    const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();
    o.type='triangle';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2.01;
    lp.type='lowpass';lp.frequency.setValueAtTime(f*8,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+.3);
    const pk=.09*(vel||.3);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.3,dur));
    const g2=c.createGain();g2.gain.value=.3;o.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(g);
    if(isSfx)this.sfxOut(g,.1,.3);else this.out(g,(Math.random()-.5)*.4,.3);
    o.start(t);o2.start(t);o.stop(t+dur+.4);o2.stop(t+dur+.4);},
  str(ch,t,dur,vol,pan){const c=ac();if(!c||!vol)return;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(420,t);lp.frequency.linearRampToValueAtTime(1050,t+dur*.55);lp.Q.value=.5;
    const g=c.createGain(),at=Math.min(1.1,dur*.35);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+at);g.gain.setValueAtTime(vol,t+dur*.8);g.gain.linearRampToValueAtTime(.0001,t+dur+.9);
    lp.connect(g);this.out(g,pan||0,.28);
    const self=this;ch.forEach(function(n){[-7,7].forEach(function(ct){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=self.hz(n);o.detune.value=ct+(Math.random()-.5)*5;
      const og=c.createGain();og.gain.value=1/ch.length;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+1);});});},
  choir(ch,t,dur,vol){const c=ac();if(!c)return;
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+1.4);g.gain.setValueAtTime(vol,t+dur*.8);g.gain.linearRampToValueAtTime(.0001,t+dur+1.2);
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;lp.connect(g);this.out(g,0,.35);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=4.6;lg.gain.value=4;lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+1.3);
    const self=this;ch.forEach(function(n){['sine','triangle'].forEach(function(tp,k){const o=c.createOscillator();o.type=tp;o.frequency.value=self.hz(n+12);o.detune.value=k?6:-6;lg.connect(o.detune);
      const og=c.createGain();og.gain.value=(k?.5:.8)/ch.length;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+1.3);});});},
  bas(n,t,dur,vol){const c=ac();if(!c)return;const f=this.hz(n);
    const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),g2=c.createGain();
    o.type='sine';o2.type='triangle';o.frequency.value=f;o2.frequency.value=f*2;g2.gain.value=.25;o2.connect(g2);
    lp.type='lowpass';lp.frequency.value=600;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(vol*.45,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.3);
    o.connect(lp);g2.connect(lp);lp.connect(g);this.out(g,0,.05);o.start(t);o2.start(t);o.stop(t+dur+.4);o2.stop(t+dur+.4);},
  cel(n,t,dur,vol,pan){const c=ac();if(!c)return;const f=this.hz(n);
    const g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(f*5,t);lp.frequency.exponentialRampToValueAtTime(f*2.2,t+dur);lp.Q.value=1.2;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.018);g.gain.setValueAtTime(vol*.8,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.12);
    lp.connect(g);this.out(g,pan||0,.18);
    [-5,5].forEach(function(ct){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=ct;o.connect(lp);o.start(t);o.stop(t+dur+.2);});},
  sq(n,t,dur,vol,pan){const c=ac();if(!c)return;const f=this.hz(n);
    const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='square';o.frequency.value=f;
    lp.type='lowpass';lp.frequency.setValueAtTime(2600,t);lp.frequency.exponentialRampToValueAtTime(700,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.05);
    o.connect(lp);lp.connect(g);this.out(g,pan||0,.2);o.start(t);o.stop(t+dur+.1);},
  bell(n,t,vol,isSfx){const c=ac();if(!c)return;if(isSfx&&!S.sound)return;const f=this.hz(n);const self=this;
    [[1,1,1.6],[2.76,.32,.7],[5.4,.12,.35]].forEach(function(p){const o=c.createOscillator(),g=c.createGain();o.frequency.value=f*p[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol*p[1],t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+p[2]);
      o.connect(g);if(isSfx)self.sfxOut(g,.15,.3);else self.out(g,.2,.5);o.start(t);o.stop(t+p[2]+.05);});},
  stab(ch,vol){if(!S.sound)return;const c=ac();if(!c)return;const t=c.currentTime+.02;
    const g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(2200,t);lp.frequency.exponentialRampToValueAtTime(500,t+.5);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.7);lp.connect(g);this.sfxOut(g,0,.35);
    const self=this;ch.forEach(function(n){[-8,8].forEach(function(ct){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=self.hz(n);o.detune.value=ct;o.connect(lp);o.start(t);o.stop(t+.75);});});},
  kick(t,vol){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();
    o.frequency.setValueAtTime(78,t);o.frequency.exponentialRampToValueAtTime(40,t+.14);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);this.out(g,0,.04);o.start(t);o.stop(t+.32);},
  timp(n,t,vol){const c=ac();if(!c)return;const f=this.hz(n),o=c.createOscillator(),g=c.createGain();
    o.frequency.setValueAtTime(f*1.12,t);o.frequency.exponentialRampToValueAtTime(f,t+.12);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);this.out(g,0,.35);o.start(t);o.stop(t+1.7);},
  shk(t,vol,pan,hp){const c=ac();if(!c)return;const B=noiseB();if(!B)return;const s=c.createBufferSource();s.buffer=B;
    const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=hp||6500;const g=c.createGain();
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.07);
    s.connect(f);f.connect(g);this.out(g,pan||.2,.12);s.start(t,Math.random()*1.8,.09);},
  tick(t,vol,hi){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=hi?2100:1650;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);this.out(g,hi?.3:-.3,.1);o.start(t);o.stop(t+.04);},
  windOn(){if(this.wind||!this.mg)return;const c=ac();if(!c)return;const B=noiseB();if(!B)return;
    const s=c.createBufferSource();s.buffer=B;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=420;f.Q.value=.8;
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.13;lg.gain.value=220;lfo.connect(lg);lg.connect(f.frequency);
    const g=c.createGain(),t=c.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+2.5);
    s.connect(f);f.connect(g);g.connect(this.bus);s.start(t);lfo.start(t);this.wind={s:s,lfo:lfo,g:g};},
  windOff(){const w=this.wind;if(!w)return;this.wind=null;const c=ac();if(!c)return;const t=c.currentTime;
    try{w.g.gain.cancelScheduledValues(t);w.g.gain.setValueAtTime(w.g.gain.value,t);w.g.gain.linearRampToValueAtTime(0,t+1.5);w.s.stop(t+1.6);w.lfo.stop(t+1.6);}catch(e){}},
  /* 黑胶底噪：只在复古年代出现。
     之前每采样都叠一层白噪、爆点概率 0.0009（48kHz 下每秒约 43 次），
     听起来是持续的沙沙静电声。现在改成：极轻的低频表面噪声 +
     每秒 4–6 个稀疏爆点，并加低通去掉刺耳的高频。 */
  crackleOn(){if(this.crk||!this.bus)return;const c=ac();if(!c)return;
    const len=c.sampleRate*4,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
    let lp=0;
    for(let i=0;i<len;i++){
      /* 表面底噪：平滑过的低频噪声，只留一点点“存在感” */
      lp=lp*.93+(Math.random()*2-1)*.07;
      d[i]=lp*.0016;
      /* 稀疏爆点：带短衰减，彼此不重叠 */
      if(Math.random()<.00011){
        const amp=.28+Math.random()*.3,dec=5+Math.random()*9;
        const n=Math.min(48,len-i-1);
        for(let k=0;k<n;k++)d[i+k]+=(Math.random()*2-1)*amp*Math.exp(-k/dec);
        i+=n;
      }
    }
    const s=c.createBufferSource();s.buffer=buf;s.loop=true;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=180;
    const lpf=c.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=3000;lpf.Q.value=.4;
    const g=c.createGain(),t=c.currentTime;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+2.2);
    s.connect(hp);hp.connect(lpf);lpf.connect(g);g.connect(this.bus);s.start(t);this.crk={s:s,g:g};},
  crackleOff(){const k=this.crk;if(!k)return;this.crk=null;const c=ac();if(!c)return;const t=c.currentTime;
    try{k.g.gain.cancelScheduledValues(t);k.g.gain.setValueAtTime(k.g.gain.value,t);k.g.gain.linearRampToValueAtTime(0,t+1.2);k.s.stop(t+1.3);}catch(e){}},
  schedule(song,st,t,spb){
    if(!S.bgm)return;
    const bar=Math.floor(st/16),pos=st%16,ch=song.ch[bar%song.ch.length],root=ch[0],v=ch[1];
    const B=this.loopN%2===1,tt=t+(Math.random()-.5)*.012,barDur=spb*16,self=this;
    if(pos===0){
      if(song.str)this.str(v,t,barDur*.98,song.str,0);
      if(song.choir)this.choir(v,t,barDur*.98,song.choir);
      if(song.bellTop)this.bell(v[v.length-1]+12,t+.02,.018);
      if(song.timp&&bar===0)this.timp(root+12,t,.11);
    }
    if(song.bass)song.bass.forEach(function(b){if(b[0]===pos)self.bas(root+(b[2]||0),t,b[1]*spb,song.bassVol||.05);});
    if(song.arp&&song.arp.steps.indexOf(pos)>=0){const k=song.arp.steps.indexOf(pos),n=v[song.arp.idx[k]%v.length]+(song.arp.oct||0);
      this.ep(n,tt,spb*3,song.arp.vel*(pos%4===0?1.1:.85)*(.88+Math.random()*.24),(k%2?.22:-.22));}
    if(song.plk&&song.plk.steps.indexOf(pos)>=0){const k=song.plk.steps.indexOf(pos),n=v[song.plk.idx[k]%v.length]+(song.plk.oct||0);this.plk(n,tt,spb*2,song.plk.vel);}
    if(song.seq&&song.seq.steps.indexOf(pos)>=0){const n=v[(pos*3+bar)%v.length]+12;this.sq(n,tt,spb*.9,song.seq.vel*.06,(pos%2?.3:-.3));}
    if(song.sparse)song.sparse.forEach(function(sp){if(sp[0]===pos&&(bar+self.loopN)%2===0)self.ep(v[sp[1]%v.length]+sp[2],tt,spb*8,song.sparseVel,.15);});
    if(song.mel&&B)song.mel.forEach(function(m){if(m[0]===bar&&m[1]===pos)self.ep(m[2],tt,m[3]*spb,song.melVel*(.9+Math.random()*.2),.08);});
    if(song.lead&&B)song.lead.forEach(function(m){if(m[0]===bar&&m[1]===pos)self.cel(m[2],tt,m[3]*spb,song.leadVol,.1);});
    if(song.ost&&pos%2===0){const o=song.ost[bar%song.ost.length][pos/2];this.cel(root+o,tt,spb*1.7,song.ostVol*(pos%8===0?1.15:.9),-.1);}
    if(song.stab&&song.stab.indexOf(pos)>=0)this.str(v,t,spb*2.5,song.stabVol,0);
    if(song.pulse&&pos%4===2)this.ep(v[v.length-1]+12,tt,spb,.14,.3);
    if(song.kick&&song.kick.indexOf(pos)>=0)this.kick(tt,song.kickVol||.1);
    if(song.shaker&&(!song.shakerB||B)&&song.shaker.indexOf(pos)>=0)this.shk(tt,.012);
    if(song.shaker16&&pos%2===1)this.shk(tt,.006,-.2);
    if(song.hat&&song.hat.indexOf(pos)>=0)this.shk(tt,.016,.25,8000);
    if(song.tick&&pos%4===0)this.tick(tt,.016,pos%8===0);
  }
};
function fanfare(){if(!S.sound)return;const c=ac();if(!c)return;const t=c.currentTime+.05;
  [[62,0],[66,.12],[69,.24],[74,.36],[78,.6]].forEach(function(p){MUSIC.ep(p[0],t+p[1],.8,.5,0,true);});}

/* 开场影像的环境声 */
const AMB={
  run(kind,dur){if(!S.sound)return function(){};const c=ac();if(!c)return function(){};
    const t=c.currentTime,nodes=[],out=c.createGain();out.gain.setValueAtTime(0,t);out.gain.linearRampToValueAtTime(1,t+.6);toBus(out,0,.25);
    const B=noiseB();
    if(kind==='sputnik'){
      for(let i=0;i<Math.floor(dur/.6);i++){const o=c.createOscillator(),g=c.createGain(),bp=c.createBiquadFilter();o.type='square';o.frequency.value=1020;
        bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=3;const s=t+.4+i*.6;
        g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(.025,s+.01);g.gain.setValueAtTime(.025,s+.28);g.gain.linearRampToValueAtTime(0,s+.3);
        o.connect(bp);bp.connect(g);g.connect(out);o.start(s);o.stop(s+.32);nodes.push(o);}
    }else if(kind==='rumble'&&B){
      const s=c.createBufferSource();s.buffer=B;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=140;
      const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+dur*.6);g.gain.exponentialRampToValueAtTime(.05,t+dur);
      s.connect(f);f.connect(g);g.connect(out);s.start(t);nodes.push(s);
    }else if(kind==='wind'&&B){
      const s=c.createBufferSource();s.buffer=B;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=500;f.Q.value=.7;
      const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.2;lg.gain.value=260;lfo.connect(lg);lg.connect(f.frequency);
      const g=c.createGain();g.gain.value=.16;s.connect(f);f.connect(g);g.connect(out);s.start(t);lfo.start(t);nodes.push(s,lfo);
    }else if(kind==='radio'&&B){
      for(let i=0;i<6;i++){const s=c.createBufferSource();s.buffer=B;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1200+Math.random()*900;f.Q.value=2;
        const g=c.createGain(),st=t+.5+i*(dur/6)+Math.random()*.4;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.05,st+.03);g.gain.linearRampToValueAtTime(0,st+.25+Math.random()*.3);
        s.connect(f);f.connect(g);g.connect(out);s.start(st,Math.random(),.7);nodes.push(s);}
    }else if(kind==='room'&&B){
      const s=c.createBufferSource();s.buffer=B;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=260;
      const g=c.createGain();g.gain.value=.08;s.connect(f);f.connect(g);g.connect(out);s.start(t);nodes.push(s);
    }else if(kind==='signal'){
      /* 深空信号：一串有规律的脉冲 */
      [0,1,1,0,1,0,0,1,1,1].forEach(function(b,i){const o=c.createOscillator(),g=c.createGain(),s=t+.5+i*.32;o.type='sine';o.frequency.value=b?1480:990;
        g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(.03,s+.01);g.gain.linearRampToValueAtTime(0,s+.2);o.connect(g);g.connect(out);o.start(s);o.stop(s+.22);nodes.push(o);});
    }
    let done=false;
    return function(){if(done)return;done=true;const n=c.currentTime;try{out.gain.cancelScheduledValues(n);out.gain.setValueAtTime(out.gain.value,n);out.gain.linearRampToValueAtTime(0,n+.8);}catch(e){}
      setTimeout(function(){nodes.forEach(function(x){try{x.stop();}catch(e){}});try{out.disconnect();}catch(e){}},1000);};
  }
};
function toggleSound(){S.sound=!S.sound;save();syncAudioBtns();SFX.tap();}
function toggleBgm(){S.bgm=!S.bgm;save();if(!MUSIC.on)MUSIC.start();MUSIC.setBgm(S.bgm);syncAudioBtns();SFX.tap();}
function syncAudioBtns(){
  $$('.btn-snd').forEach(function(b){b.innerHTML=icon(S.sound?'ic-sound':'ic-mute');b.classList.toggle('off',!S.sound);});
  $$('.btn-bgm').forEach(function(b){b.innerHTML=icon(S.bgm?'ic-music':'ic-music-off');b.classList.toggle('off',!S.bgm);});
}
