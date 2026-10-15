"use strict";
/* =====================================================================
   星图：主界面。
   一张可以拖动、缩放的星系图。正中是星海仲裁院，周围六颗星：
   开庭剧场（主线）、近地轨道与月面深空（航天史小游戏）、
   见习裁判席、休憩舱、档案馆。
   外圈一道金色航迹就是人类的太空史：从 1957 年起顺时针走到 2080 年，
   亮着的那一段，是你在主线里已经走到的年份。
   点一颗星，镜头飞过去，降落到星球表面；表面上的节点连成一条路。

   画法：星空、星球、航迹画在一块 canvas 上（星球预先画成贴图）；
   名牌是普通 DOM，文字清楚，也方便点；降落后的星球表面另起一层。
   ===================================================================== */
const STATION={id:'station',name:'星海仲裁院',en:'STELLAR ARBITRATION COURT',x:0,y:40,r:24};
const WORLDS=[
 {id:'theater',name:'开庭剧场',en:'THE TRIBUNAL',x:0,y:-250,r:56,look:'gold',music:'frontier',
  line:'六个案子，从 1980 年一直排到 2077 年。'},
 {id:'leo',name:'近地轨道',en:'LOW EARTH ORBIT',x:-290,y:-40,r:40,look:'earth',music:'tech',
  line:'人类最早走出去的地方，也是现在最挤的地方。',items:['sat','orbit','station']},
 {id:'moon',name:'月面与深空',en:'MOON & BEYOND',x:290,y:-40,r:36,look:'moon',music:'cartoon',
  line:'先在月亮上站稳，再借行星的引力飞出太阳系。',items:['lander','sling']},
 {id:'relax',name:'休憩舱',en:'REST POD',x:-255,y:255,r:30,look:'teal',music:'relax',
  line:'不计输赢。玩一会儿，精力会回来。',items:['const','sweep','paint']},
 {id:'bench',name:'见习裁判席',en:'TRAINING BENCH',x:255,y:255,r:30,look:'violet',music:'court',
  line:'五个小案子，没有标准答案。每天还有一案。'},
 {id:'archive',name:'档案馆',en:'ARCHIVE',x:0,y:440,r:32,look:'amber',music:'retro',
  line:'法典、先例、史实卡，还有你的裁判记录。'}
];
const WORLD_BY={};WORLDS.forEach(function(w){WORLD_BY[w.id]=w;});
/* 航迹：一个椭圆，按年份顺时针走 300° */
const TRAIL={cx:0,cy:70,rx:560,ry:640,y0:1957,y1:2080,a0:-160,a1:140};
function trailPt(y){
  const t=(y-TRAIL.y0)/(TRAIL.y1-TRAIL.y0),a=(TRAIL.a0+(TRAIL.a1-TRAIL.a0)*t)*Math.PI/180;
  return {x:TRAIL.cx+Math.cos(a)*TRAIL.rx,y:TRAIL.cy+Math.sin(a)*TRAIL.ry,a:a};
}
/* 远处的风景（世界坐标） */
const FAR=[
 {k:'sun',x:-1150,y:-900,s:520,n:'恒星系'},
 {k:'spiral',x:1250,y:-880,s:620,n:'旋涡星系'},
 {k:'hole',x:-1200,y:980,s:300,n:'黑洞'},
 {k:'neb',x:1250,y:960,s:760,n:'星云群'},
 {k:'glob',x:-1500,y:60,s:300,n:'球状星团'},
 {k:'nova',x:1520,y:80,s:240,n:'超新星遗迹'},
 {k:'comet',x:-120,y:1240,s:760,n:'彗星'}
];

function nextCh(){return CH_ORDER.find(function(id){return !SAVE.chDone(id);});}
function chState(id){if(SAVE.chDone(id))return 'done';if(chapterUnlocked(id))return 'open';return 'locked';}
function worldHint(w){
  if(w.id==='theater'){const nx=nextCh();return nx?('下一案 · '+CHAPTERS[nx].year+' '+CHAPTERS[nx].title):'六案已结 · 可以重开';}
  if(w.items){const n=w.items.filter(function(id){return S.games[id]&&S.games[id].plays;}).length;return n+'/'+w.items.length+(w.id==='relax'?' · 恢复精力':' · 已玩过');}
  if(w.id==='bench'){return '已裁 '+Object.keys(S.judge||{}).length+'/5';}
  if(w.id==='archive'){return '法典 '+S.laws.length+'/'+LAWS.length+' · 先例 '+S.precs.length;}
  return '';
}

/* ---------------- 贴图：星球、远景 ---------------- */
const MapArt=(function(){
  function cnv(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
  const LOOK={
    gold:{a:'#F6DFA0',b:'#C99A48',c:'#5E3D14',atm:'255,214,140',bands:['rgba(120,70,20,.28)','rgba(255,240,200,.22)','rgba(150,95,35,.22)']},
    earth:{a:'#7FB6FF',b:'#2457C4',c:'#0B1C4A',atm:'120,180,255'},
    moon:{a:'#EDEDE8',b:'#9C9C96',c:'#3A3A38',atm:'220,220,230'},
    teal:{a:'#A8F5E2',b:'#2E9E8E',c:'#0B3438',atm:'120,240,210',bands:['rgba(255,255,255,.10)','rgba(10,60,60,.25)']},
    violet:{a:'#D2C2FF',b:'#6A4BC4',c:'#1E1446',atm:'190,160,255',bands:['rgba(255,255,255,.12)','rgba(40,20,90,.3)','rgba(200,170,255,.18)']},
    amber:{a:'#FBE3B0',b:'#C9813E',c:'#4A240C',atm:'255,190,120',bands:['rgba(90,40,10,.22)','rgba(255,235,200,.16)']}
  };
  /* 画一颗星球到 (0,0)，半径 R。光从左上来 */
  function drawPlanet(g,look,R,seed){
    const L=LOOK[look],rnd=rng(seed||7);
    g.save();
    let gr=g.createRadialGradient(-R*.35,-R*.4,R*.05,0,0,R);gr.addColorStop(0,L.a);gr.addColorStop(.55,L.b);gr.addColorStop(1,L.c);
    g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,7);g.fill();
    g.save();g.beginPath();g.arc(0,0,R,0,7);g.clip();
    if(L.bands){for(let i=0;i<9;i++){const y=-R+R*2*(i+.5)/9+(rnd()-.5)*R*.12;g.fillStyle=L.bands[i%L.bands.length];g.beginPath();g.ellipse(0,y,R*1.2,R*(.05+rnd()*.07),-.08,0,7);g.fill();}}
    if(look==='earth'){
      /* 大陆：平滑的不规则形，颜色压低一点 */
      for(let i=0;i<7;i++){g.fillStyle=i%3?'rgba(62,122,85,.8)':'rgba(140,122,78,.75)';const cx=(rnd()-.5)*R*1.6,cy=(rnd()-.5)*R*1.5,rr=R*(.16+rnd()*.24),n=12,pts=[];
        for(let k=0;k<n;k++){const a=k/n*Math.PI*2,q=rr*(.55+rnd()*.7);pts.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q*.8]);}
        g.beginPath();for(let k=0;k<n;k++){const a=pts[k],b=pts[(k+1)%n],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;k?g.quadraticCurveTo(a[0],a[1],mx,my):g.moveTo(mx,my);}g.closePath();g.fill();}
      g.strokeStyle='rgba(255,255,255,.38)';g.lineCap='round';
      for(let i=0;i<16;i++){g.lineWidth=R*(.015+rnd()*.03);g.beginPath();const y=(rnd()-.5)*R*1.8,x=(rnd()-.5)*R*1.6;g.moveTo(x,y);g.bezierCurveTo(x+R*.15,y-R*.06,x+R*.3,y+R*.05,x+R*(.35+rnd()*.4),y-R*.02);g.stroke();}
    }
    if(look==='moon'){
      for(let i=0;i<16;i++){const cx=(rnd()-.5)*R*1.8,cy=(rnd()-.5)*R*1.8,rr=R*(.05+rnd()*.16);
        g.fillStyle='rgba(60,60,58,.28)';g.beginPath();g.arc(cx,cy,rr,0,7);g.fill();
        g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=Math.max(.6,rr*.12);g.beginPath();g.arc(cx+rr*.1,cy+rr*.1,rr,Math.PI*.9,Math.PI*1.7);g.stroke();}
      g.fillStyle='rgba(70,70,70,.25)';g.beginPath();g.ellipse(-R*.2,-R*.15,R*.45,R*.3,.4,0,7);g.fill();
    }
    if(look==='teal'){g.strokeStyle='rgba(160,255,200,.45)';g.lineWidth=R*.08;g.beginPath();g.ellipse(0,-R*.82,R*.7,R*.2,0,0,Math.PI);g.stroke();}
    if(look==='amber'){g.strokeStyle='rgba(90,40,10,.25)';g.lineWidth=Math.max(.6,R*.02);for(let i=-4;i<=4;i++){g.beginPath();g.ellipse(0,0,R*Math.cos(i/5),R,0,0,7);g.stroke();}}
    /* 背光面 */
    gr=g.createRadialGradient(-R*.45,-R*.5,R*.2,-R*.1,-R*.1,R*1.35);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.6,'rgba(3,5,12,.25)');gr.addColorStop(1,'rgba(3,5,12,.88)');
    g.fillStyle=gr;g.fillRect(-R,-R,R*2,R*2);
    g.restore();
    /* 大气边 */
    gr=g.createRadialGradient(0,0,R*.94,0,0,R*1.22);gr.addColorStop(0,'rgba('+L.atm+',.55)');gr.addColorStop(.35,'rgba('+L.atm+',.18)');gr.addColorStop(1,'rgba('+L.atm+',0)');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,R*1.22,0,7);g.arc(0,0,R*.94,0,7,true);g.fill();
    g.strokeStyle='rgba('+L.atm+',.65)';g.lineWidth=Math.max(.8,R*.025);g.beginPath();g.arc(0,0,R*.995,Math.PI*1.05,Math.PI*1.75);g.stroke();
    g.restore();
  }
  function ring(g,R,front){
    const rx=R*2.05,ry=R*.5,tilt=-.32;
    g.save();g.rotate(tilt);
    const parts=[[1,'rgba(232,196,120,.85)',R*.16],[.86,'rgba(255,228,170,.5)',R*.07],[1.12,'rgba(200,160,90,.45)',R*.08]];
    parts.forEach(function(p){g.strokeStyle=p[1];g.lineWidth=p[2];g.beginPath();
      if(front)g.ellipse(0,0,rx*p[0],ry*p[0],0,0,Math.PI);else g.ellipse(0,0,rx*p[0],ry*p[0],0,Math.PI,Math.PI*2);g.stroke();});
    g.restore();
  }
  /* 一颗星球的贴图（含光环），返回 {c, s:半边长（以 R 为单位）} */
  function planet(look,R,D,seed){
    const pad=look==='gold'?2.4:1.35,S=Math.ceil(R*pad*2*D),c=cnv(S,S),g=c.getContext('2d');
    g.translate(S/2,S/2);g.scale(D,D);
    if(look==='gold')ring(g,R,false);
    drawPlanet(g,look,R,seed);
    if(look==='gold')ring(g,R,true);
    return {c:c,half:R*pad};
  }
  /* 远景贴图 */
  function far(k,size,D){
    const S=Math.ceil(size*D),c=cnv(S,S),g=c.getContext('2d');g.scale(D,D);const h=size/2,R=rng(k.length*31+7);
    g.translate(h,h);
    if(k==='sun'){
      let gr=g.createRadialGradient(0,0,0,0,0,h);gr.addColorStop(0,'rgba(255,220,150,.22)');gr.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=gr;g.fillRect(-h,-h,size,size);
      [.42,.62,.84].forEach(function(f,i){g.strokeStyle='rgba(255,220,160,'+(.22-i*.05)+')';g.lineWidth=1.2;g.beginPath();g.ellipse(0,0,h*f,h*f*.36,-.24,0,7);g.stroke();});
      gr=g.createRadialGradient(0,0,0,0,0,h*.16);gr.addColorStop(0,'#FFF8E2');gr.addColorStop(.4,'#FFD27A');gr.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,h*.16,0,7);g.fill();
      [[.42,2.3,'#9FD8FF',7],[.62,.8,'#E8A76A',10],[.84,4.1,'#C9D6EE',8]].forEach(function(p){const a=p[1];g.save();g.rotate(-.24);g.fillStyle=p[2];g.beginPath();g.arc(Math.cos(a)*h*p[0],Math.sin(a)*h*p[0]*.36,p[3],0,7);g.fill();g.restore();});
    }else if(k==='spiral'){
      let gr=g.createRadialGradient(0,0,0,0,0,h*.9);gr.addColorStop(0,'rgba(200,190,255,.18)');gr.addColorStop(1,'rgba(120,120,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(0,0,h*.95,h*.55,-.3,0,7);g.fill();
      g.save();g.rotate(-.3);g.scale(1,.55);
      for(let i=0;i<2600;i++){const arm=i%2,t=Math.pow(R(),.7),a=t*4.6+arm*Math.PI+(R()-.5)*.55,r=t*h*.92;
        g.fillStyle=R()<.15?'rgba(255,200,230,.7)':'rgba(220,225,255,'+(.25+R()*.55).toFixed(2)+')';g.fillRect(Math.cos(a)*r,Math.sin(a)*r,1.2,1.2);}
      g.restore();
      gr=g.createRadialGradient(0,0,0,0,0,h*.18);gr.addColorStop(0,'rgba(255,246,225,.95)');gr.addColorStop(1,'rgba(255,230,200,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,h*.18,0,7);g.fill();
    }else if(k==='neb'){
      [['rgba(150,90,220,.32)',-.18,-.08,.55],['rgba(70,190,200,.26)',.18,.05,.5],['rgba(230,90,160,.22)',0,.2,.45],['rgba(255,190,120,.12)',-.05,0,.3]].forEach(function(n){
        const gr=g.createRadialGradient(n[1]*size,n[2]*size,0,n[1]*size,n[2]*size,n[3]*h);gr.addColorStop(0,n[0]);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(-h,-h,size,size);});
      for(let i=0;i<220;i++){g.fillStyle='rgba(255,255,255,'+(R()*.7+.1).toFixed(2)+')';const r=R()*h*.8,a=R()*7;g.fillRect(Math.cos(a)*r,Math.sin(a)*r*.7,R()<.1?2:1,R()<.1?2:1);}
    }else if(k==='glob'){
      for(let i=0;i<900;i++){const a=R()*7,r=Math.pow(R(),2.2)*h*.95;g.fillStyle=(i%9?'rgba(240,232,210,':'rgba(255,220,170,')+(.3+R()*.6).toFixed(2)+')';g.fillRect(Math.cos(a)*r,Math.sin(a)*r,1.3,1.3);}
      const gr=g.createRadialGradient(0,0,0,0,0,h*.3);gr.addColorStop(0,'rgba(255,240,210,.35)');gr.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,h*.3,0,7);g.fill();
    }else if(k==='nova'){
      [[.9,'rgba(255,120,120,.32)',1.4,[]],[.66,'rgba(255,150,100,.36)',2.6,[10,16]],[.44,'rgba(255,190,150,.45)',1.6,[4,19]]].forEach(function(p){g.strokeStyle=p[1];g.lineWidth=p[2];g.setLineDash(p[3]);g.beginPath();g.arc(0,0,h*p[0],0,7);g.stroke();});
      g.setLineDash([]);const gr=g.createRadialGradient(0,0,0,0,0,h*.25);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.2,'rgba(255,210,170,.5)');gr.addColorStop(1,'rgba(255,200,160,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,h*.25,0,7);g.fill();
    }else if(k==='comet'){
      g.rotate(-.42);
      let gr=g.createLinearGradient(0,0,h*.95,0);gr.addColorStop(0,'rgba(200,235,255,.38)');gr.addColorStop(1,'rgba(160,220,255,0)');g.fillStyle=gr;
      g.beginPath();g.moveTo(0,-6);g.quadraticCurveTo(h*.5,-h*.08,h*.95,-h*.14);g.lineTo(h*.95,h*.06);g.quadraticCurveTo(h*.5,h*.02,0,6);g.fill();
      gr=g.createLinearGradient(0,0,h*.8,0);gr.addColorStop(0,'rgba(180,200,255,.25)');gr.addColorStop(1,'rgba(180,200,255,0)');g.fillStyle=gr;
      g.beginPath();g.moveTo(0,-3);g.lineTo(h*.8,h*.16);g.lineTo(h*.8,h*.24);g.lineTo(0,4);g.fill();
      gr=g.createRadialGradient(0,0,0,0,0,16);gr.addColorStop(0,'#F2FAFF');gr.addColorStop(1,'rgba(200,235,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,16,0,7);g.fill();
    }
    return c;
  }
  /* 写实感黑洞：后半盘面 → 引力弯折的光环与黑影 → 前半盘面 */
  function blackHole(g,x,y,r,t){
    let gr=g.createRadialGradient(x,y,r*.8,x,y,r*5);gr.addColorStop(0,'rgba(255,190,120,.30)');gr.addColorStop(1,'rgba(255,150,80,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*5,0,7);g.fill();
    function disk(back){
      g.save();g.translate(x,y);g.rotate(-.12);
      const rx=r*3.4,ry=r*.55;
      for(let k=0;k<3;k++){
        const rr=rx*(1-k*.12),ryy=ry*(1-k*.1),gd=g.createLinearGradient(-rr,0,rr,0);
        gd.addColorStop(0,'rgba(255,214,150,0)');gd.addColorStop(.2,'rgba(255,236,190,'+(.85-k*.15)+')');gd.addColorStop(.5,'rgba(255,190,110,'+(.9-k*.2)+')');gd.addColorStop(.8,'rgba(255,140,70,'+(.6-k*.15)+')');gd.addColorStop(1,'rgba(255,120,60,0)');
        g.strokeStyle=gd;g.lineWidth=r*(.55-k*.14);g.beginPath();
        if(back)g.ellipse(0,0,rr,ryy,0,Math.PI,Math.PI*2);else g.ellipse(0,0,rr,ryy,0,0,Math.PI);g.stroke();
      }
      g.setLineDash([r*.4,r*.25]);g.lineDashOffset=-t*.02*r/20;g.strokeStyle='rgba(255,245,220,.35)';g.lineWidth=r*.06;g.beginPath();
      if(back)g.ellipse(0,0,rx*.92,ry*.92,0,Math.PI,Math.PI*2);else g.ellipse(0,0,rx*.92,ry*.92,0,0,Math.PI);g.stroke();g.setLineDash([]);
      g.restore();
    }
    disk(true);
    g.save();g.translate(x,y);
    const halo=g.createRadialGradient(0,0,r*1.02,0,0,r*1.75);halo.addColorStop(0,'rgba(255,240,205,.95)');halo.addColorStop(.25,'rgba(255,200,130,.7)');halo.addColorStop(1,'rgba(255,150,80,0)');
    g.fillStyle=halo;g.beginPath();g.ellipse(0,0,r*1.75,r*1.6,0,0,7);g.fill();
    g.fillStyle='#000';g.beginPath();g.arc(0,0,r,0,7);g.fill();
    g.strokeStyle='rgba(255,246,225,.9)';g.lineWidth=Math.max(1,r*.04);g.beginPath();g.arc(0,0,r*1.04,0,7);g.stroke();
    g.restore();
    disk(false);
  }
  /* 星点贴片：三层，越远越暗越密 */
  function starTile(seed,n,bright,D){
    const S=512,c=cnv(S*D,S*D),g=c.getContext('2d'),R=rng(seed);g.scale(D,D);
    for(let i=0;i<n;i++){const a=R(),x=R()*S,y=R()*S,r=(R()<.04?1.5:R()*.8+.35)*bright;
      g.fillStyle='rgba('+(a<.08?'255,226,196':a<.18?'196,214,255':'240,244,255')+','+(R()*.6+.25).toFixed(2)+')';g.beginPath();g.arc(x,y,r,0,7);g.fill();}
    return c;
  }
  /* 大尺度的雾：银河带与各星域的微光，低分辨率，拉伸着画 */
  function deepFog(){
    const W=1024,H=768,c=cnv(W,H),g=c.getContext('2d'),R=rng(41);
    /* 映射：世界 x∈[-2400,2400] → [0,W]，y∈[-1800,1800] → [0,H] */
    const X=function(x){return (x+2400)/4800*W;},Y=function(y){return (y+1800)/3600*H;},S=function(s){return s/4800*W;};
    g.save();g.translate(X(0),Y(-200));g.rotate(-.5);
    const band=g.createLinearGradient(0,-S(700),0,S(700));band.addColorStop(0,'rgba(120,130,200,0)');band.addColorStop(.5,'rgba(170,165,215,.16)');band.addColorStop(1,'rgba(120,130,200,0)');
    g.fillStyle=band;g.fillRect(-W,-S(700),W*2,S(1400));
    for(let i=0;i<3200;i++){const x=(R()-.5)*W*1.8,y=(R()+R()+R()-1.5)*S(420);g.fillStyle='rgba(225,225,255,'+(R()*.35+.05).toFixed(2)+')';g.fillRect(x,y,1,1);}
    g.strokeStyle='rgba(3,4,10,.45)';g.lineWidth=S(110);try{g.filter='blur(6px)';}catch(e){}g.beginPath();g.moveTo(-W,S(20));g.bezierCurveTo(-W*.3,-S(80),W*.2,S(90),W,-S(20));g.stroke();try{g.filter='none';}catch(e){}
    g.restore();
    [[0,-250,520,'rgba(230,180,90,.10)'],[-290,-40,420,'rgba(70,130,255,.10)'],[290,-40,380,'rgba(170,170,200,.07)'],[-255,255,330,'rgba(60,200,180,.09)'],[255,255,330,'rgba(150,110,240,.09)'],[0,440,340,'rgba(230,150,80,.08)'],[0,40,620,'rgba(60,90,180,.10)']].forEach(function(n){
      const gr=g.createRadialGradient(X(n[0]),Y(n[1]),0,X(n[0]),Y(n[1]),S(n[2]));gr.addColorStop(0,n[3]);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});
    return {c:c,x0:-2400,y0:-1800,w:4800,h:3600};
  }
  return {planet:planet,far:far,blackHole:blackHole,starTile:starTile,deepFog:deepFog,drawPlanet:drawPlanet,LOOK:LOOK};
})();

/* ---------------- 星图本体 ---------------- */
const StarMap=(function(){
  /* 三块画布：雾（低分辨率）、场景（镜头动了才重画）、动效（每帧清空重画，只画会动的小东西） */
  let stage,cvF,gF,cv,g,cvA,gA,labels,W=0,H=0,D=1,DF=.5,built=false,on=false,raf=0,last=0,idleT=0,lastAnim=0;
  const cam={x:0,y:90,z:.6};let minZ=.22,maxZ=2.6;
  let sprites={},farSp={},starLayers=[],fog=null,twinkles=[],markers=[];
  let anim=null,inertia=null,ptrs=new Map(),drag=null,pinch=null,moved=false,suppressClick=false,lastTap=null,dirty=true;
  const BOUND={x0:-1700,x1:1700,y0:-1250,y1:1450};

  function toScreen(x,y){return {x:W/2+(x-cam.x)*cam.z,y:H/2+(y-cam.y)*cam.z};}
  function toWorld(sx,sy){return {x:(sx-W/2)/cam.z+cam.x,y:(sy-H/2)/cam.z+cam.y};}
  function clampCam(){cam.z=clamp(cam.z,minZ,maxZ);cam.x=clamp(cam.x,BOUND.x0,BOUND.x1);cam.y=clamp(cam.y,BOUND.y0,BOUND.y1);}

  function build(){
    stage=byId('mapStage');labels=byId('mapLabels');
    cvF=byId('mapFog');gF=cvF.getContext('2d');cv=byId('mapCv');g=cv.getContext('2d');cvA=byId('mapFx');gA=cvA.getContext('2d');
    resize();
    /* 名牌 */
    let h='';
    [STATION].concat(WORLDS).forEach(function(w){
      h+='<div class="wl'+(w.id==='station'?' wl-station':'')+'" data-w="'+w.id+'"><i class="wl-hit"></i><div class="wl-tag"><b>'+w.name+'</b><span>'+w.en+'</span><em></em></div></div>';
    });
    h+='<div class="wl-cue" id="mapCue">主线从这里开始</div><div class="map-peek" id="mapPeek"></div>';
    labels.innerHTML=h;
    /* 航迹上的标记 */
    markers=HISTORY.map(function(it,i){const p=trailPt(it.y+(it.m?(it.m-.5)/12:.5));const off=(i%2?1:-1)*(it.kind==='fact'?0:14);
      return {id:it.id,kind:it.kind,y:it.y,t:it.t,x:p.x+Math.cos(p.a)*off,yy:p.y+Math.sin(p.a)*off};});
    CH_ORDER.forEach(function(id){const C=CHAPTERS[id],p=trailPt(+C.year+.5);markers.push({id:id,kind:'ch',y:+C.year,t:C.num+' · '+C.title,x:p.x+Math.cos(p.a)*26,yy:p.y+Math.sin(p.a)*26});});
    const R=rng(5);twinkles=[];for(let i=0;i<46;i++)twinkles.push({x:(R()-.5)*3000,y:(R()-.5)*2400,p:R()*7,s:R()*1.2+.6});
    bind();
    built=true;
  }
  function resize(){
    /* 场景层最多按 1.5 倍像素画：星空本来就柔和，省下的像素换流畅 */
    D=Math.min(window.devicePixelRatio||1,1.5);
    W=stage.clientWidth||innerWidth;H=stage.clientHeight||innerHeight;
    cvF.width=Math.max(1,Math.round(W*DF));cvF.height=Math.max(1,Math.round(H*DF));
    cv.width=cvA.width=Math.round(W*D);cv.height=cvA.height=Math.round(H*D);
    /* 贴图按倍率重做 */
    const pd=Math.min(D*2.4,4.5);
    sprites={};WORLDS.forEach(function(w,i){sprites[w.id]=MapArt.planet(w.look,w.r,pd,11+i*7);});
    farSp={};FAR.forEach(function(f){if(f.k!=='hole')farSp[f.k]=MapArt.far(f.k,f.s,Math.min(D,1.5));});
    if(!starLayers.length)starLayers=[mkStars(3,240,.8,.18,.55),mkStars(9,120,1,.42,.8),mkStars(17,46,1.3,.75,1)];
    if(!fog)fog=MapArt.deepFog();
    minZ=Math.min(.5,Math.min(W/3600,H/2900)*2.2);
    dirty=true;
  }
  /* 星点：每层一块 1024 见方的重复图案，按颜色分组，一组一次填充 */
  function mkStars(seed,n,size,depth,alpha){
    const R=rng(seed),groups={};
    for(let i=0;i<n;i++){const a=R(),col=a<.08?'255,226,196':a<.18?'196,214,255':'240,244,255',al=(Math.round((R()*.6+.25)*4)/4).toFixed(2),k=col+','+al;
      (groups[k]=groups[k]||[]).push(R()*1024,R()*1024,(R()<.05?1.6:R()*.8+.5)*size);}
    return {d:depth,a:alpha,g:groups};
  }
  /* 全貌：把六颗星和名牌都框进屏幕（上留 HUD，下留底栏） */
  function fitView(){
    const top=80,bot=110,x0=-380,x1=380,y0=-340,y1=540;
    const z=clamp(Math.min((W-24)/(x1-x0),(H-top-bot)/(y1-y0)),minZ,1.25);
    return {x:(x0+x1)/2,y:(y0+y1)/2-((top-bot)/2)/z,z:z};
  }
  function setCam(v){cam.x=v.x;cam.y=v.y;cam.z=v.z;clampCam();dirty=true;}

  /* ---------------- 动画：飞行与惯性 ---------------- */
  function flyTo(x,y,z,dur,cb){
    inertia=null;
    anim={fx:cam.x,fy:cam.y,fz:cam.z,tx:x,ty:y,tz:clamp(z,minZ,maxZ),t0:performance.now(),dur:dur||700,cb:cb};
    wake();
  }
  function ease(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
  function step(now,dt){
    if(anim){
      const p=Math.min(1,(now-anim.t0)/anim.dur),e=ease(p);
      cam.z=Math.exp(Math.log(anim.fz)+(Math.log(anim.tz)-Math.log(anim.fz))*e);
      cam.x=anim.fx+(anim.tx-anim.fx)*e;cam.y=anim.fy+(anim.ty-anim.fy)*e;dirty=true;
      if(p>=1){const cb=anim.cb;anim=null;if(cb)cb();}
    }else if(inertia){
      cam.x-=inertia.vx*dt/cam.z;cam.y-=inertia.vy*dt/cam.z;clampCam();
      const k=Math.exp(-dt*4.2);inertia.vx*=k;inertia.vy*=k;dirty=true;
      if(Math.hypot(inertia.vx,inertia.vy)<12)inertia=null;
    }
  }

  /* ---------------- 绘制 ---------------- */
  function drawFog(){
    gF.setTransform(DF,0,0,DF,0,0);gF.clearRect(0,0,W,H);
    const f0=toScreen(fog.x0,fog.y0);gF.drawImage(fog.c,f0.x,f0.y,fog.w*cam.z,fog.h*cam.z);
  }
  function drawScene(){
    const z=cam.z;
    g.setTransform(D,0,0,D,0,0);g.clearRect(0,0,W,H);
    /* 星点：三层视差 */
    starLayers.forEach(function(L){
      const S=1024,ox=((-cam.x*z*L.d)%S+S)%S-S,oy=((-cam.y*z*L.d)%S+S)%S-S;
      Object.keys(L.g).forEach(function(k){
        const pts=L.g[k];g.fillStyle='rgba('+k+')';g.globalAlpha=L.a;g.beginPath();
        for(let tx=ox;tx<W;tx+=S)for(let ty=oy;ty<H;ty+=S)for(let i=0;i<pts.length;i+=3){const x=pts[i]+tx,y=pts[i+1]+ty;if(x<-2||y<-2||x>W+2||y>H+2)continue;g.rect(x,y,pts[i+2],pts[i+2]);}
        g.fill();});
    });
    g.globalAlpha=1;
    /* 远景（黑洞会动，放到动效层） */
    FAR.forEach(function(f){
      const p=toScreen(f.x,f.y),s=f.s*z;if(p.x+s<0||p.x-s>W||p.y+s<0||p.y-s>H)return;
      if(f.k!=='hole')g.drawImage(farSp[f.k],p.x-s/2,p.y-s/2,s,s);
      if(z<.9){g.fillStyle='rgba(139,163,204,.6)';g.font='11px '+FONT_UI;g.textAlign='center';g.textBaseline='alphabetic';g.fillText(spaced(f.n),p.x,p.y+(f.k==='hole'?95*z:s*.32)+16);}
    });
    /* 题字 */
    const tp=toScreen(0,-820);
    if(tp.y>-40&&tp.y<H+40){g.fillStyle='rgba(200,178,115,.85)';g.font=Math.round(clamp(46*z,14,60))+'px '+FONT_SERIF;g.textAlign='center';g.textBaseline='alphabetic';g.fillText('宇宙无垠　万物有法',tp.x,tp.y);
      g.strokeStyle='rgba(200,178,115,.25)';g.lineWidth=1;g.beginPath();g.moveTo(tp.x-300*z,tp.y+22*z);g.lineTo(tp.x+300*z,tp.y+22*z);g.stroke();}
    drawTrail();
    /* 连线：中央到各星 */
    g.setLineDash([2,6]);g.lineWidth=1;g.strokeStyle='rgba(200,178,115,.18)';
    WORLDS.forEach(function(w){const a=toScreen(STATION.x,STATION.y),b=toScreen(w.x,w.y);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();});
    g.setLineDash([]);
    /* 星球 */
    WORLDS.forEach(function(w){
      const p=toScreen(w.x,w.y),sp=sprites[w.id],s=sp.half*2*z;
      if(p.x+s<0||p.x-s>W||p.y+s<0||p.y-s>H)return;
      if(w.id==='leo'||w.id==='moon'){g.strokeStyle='rgba(180,210,255,.12)';g.lineWidth=1;(w.id==='leo'?ORB:[[2.1,.29]]).forEach(function(o){g.beginPath();g.ellipse(p.x,p.y,w.r*z*o[0],w.r*z*o[0]*o[1],0,0,7);g.stroke();});}
      g.drawImage(sp.c,p.x-s/2,p.y-s/2,s,s);
    });
    /* 仲裁院：光晕、环、主体（会转的灯放到动效层） */
    const p=toScreen(STATION.x,STATION.y),r=STATION.r*z;
    let gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.6);gr.addColorStop(0,'rgba(230,179,77,.28)');gr.addColorStop(1,'rgba(230,179,77,0)');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,r*2.6,0,7);g.fill();
    g.strokeStyle='rgba(234,214,160,.75)';g.lineWidth=Math.max(1,r*.12);g.beginPath();g.ellipse(p.x,p.y,r*1.9,r*.72,0,0,7);g.stroke();
    gr=g.createRadialGradient(p.x-r*.3,p.y-r*.3,1,p.x,p.y,r*.7);gr.addColorStop(0,'#FFF3D6');gr.addColorStop(.5,'#E6B34D');gr.addColorStop(1,'#5C3E10');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,r*.62,0,7);g.fill();
  }
  const ORB=[[1.55,.42,.00055,0,'#DDE8FF'],[1.8,.3,-.0004,2,'#FFD27A'],[1.35,.55,.0008,4,'#BFFFE5']];
  function drawAnim(t){
    const z=cam.z;
    gA.setTransform(D,0,0,D,0,0);gA.clearRect(0,0,W,H);
    twinkles.forEach(function(s){const p=toScreen(s.x,s.y);if(p.x<-10||p.y<-10||p.x>W+10||p.y>H+10)return;const a=.35+.35*Math.sin(t*.0016+s.p);
      gA.fillStyle='rgba(255,246,230,'+a.toFixed(2)+')';gA.fillRect(p.x-s.s/2,p.y-s.s/2,s.s,s.s);});
    const hole=FAR.find(function(f){return f.k==='hole';}),hp=toScreen(hole.x,hole.y),hs=hole.s*z;
    if(!(hp.x+hs<0||hp.x-hs>W||hp.y+hs<0||hp.y-hs>H))MapArt.blackHole(gA,hp.x,hp.y,Math.max(4,30*z),t);
    const nx=nextCh(),th=WORLD_BY.theater,tp=toScreen(th.x,th.y);
    if(nx){const k=(t%2400)/2400;gA.strokeStyle='rgba(230,179,77,'+(.45*(1-k)).toFixed(2)+')';gA.lineWidth=1.5;gA.beginPath();gA.arc(tp.x,tp.y,th.r*z*(1.25+k*.9),0,7);gA.stroke();}
    const le=WORLD_BY.leo,lp=toScreen(le.x,le.y),lr=le.r*z;
    ORB.forEach(function(o){const a=t*o[2]+o[3],x=lp.x+Math.cos(a)*lr*o[0],y=lp.y+Math.sin(a)*lr*o[0]*o[1];
      if(Math.sin(a)<0&&Math.abs(x-lp.x)<lr*.95)return;gA.fillStyle=o[4];gA.fillRect(x-1.5,y-1.5,3,3);});
    const mo=WORLD_BY.moon,mp=toScreen(mo.x,mo.y),mr=mo.r*z,ma=t*.00025;
    if(!(Math.sin(ma)<0&&Math.abs(Math.cos(ma)*mr*2.1)<mr*.95)){gA.fillStyle='rgba(255,226,170,.9)';gA.beginPath();gA.arc(mp.x+Math.cos(ma)*mr*2.1,mp.y+Math.sin(ma)*mr*.6,Math.max(1.4,mr*.07),0,7);gA.fill();}
    const p=toScreen(STATION.x,STATION.y),r=STATION.r*z;
    gA.strokeStyle='rgba(234,214,160,.35)';gA.lineWidth=Math.max(.6,r*.05);gA.beginPath();
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+t*.0003;gA.moveTo(p.x+Math.cos(a)*r*.62,p.y+Math.sin(a)*r*.62*.38);gA.lineTo(p.x+Math.cos(a)*r*1.9,p.y+Math.sin(a)*r*.72);}gA.stroke();
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2+t*.0003,x=p.x+Math.cos(a)*r*1.9,y=p.y+Math.sin(a)*r*.72;gA.fillStyle=Math.sin(a)>0?'rgba(255,236,190,.95)':'rgba(255,236,190,.45)';gA.fillRect(x-1,y-1,2,2);}
    /* 没读过的史实：一圈淡淡的涟漪 */
    const k=(t*.0005)%1;gA.strokeStyle='rgba(255,240,205,'+(.4*(1-k)).toFixed(2)+')';gA.lineWidth=1;
    markers.forEach(function(m){if(m.kind!=='fact'||S.hist.indexOf(m.id)>=0)return;const s=toScreen(m.x,m.yy);if(s.x<-10||s.y<-10||s.x>W+10||s.y>H+10)return;
      gA.beginPath();gA.arc(s.x,s.y,Math.max(1.8,2.6*Math.min(1.3,z*1.4))+k*6,0,7);gA.stroke();});
  }
  function drawTrail(){
    const z=cam.z,N=180;
    /* 已走到的年份：最后一个结案章节 */
    let reach=TRAIL.y0;CH_ORDER.forEach(function(id){if(SAVE.chDone(id))reach=Math.max(reach,+CHAPTERS[id].year+1);});
    g.lineWidth=Math.max(1,1.4*Math.min(1,z*1.6));
    g.setLineDash([3,7]);g.strokeStyle='rgba(200,178,115,.32)';g.beginPath();
    for(let i=0;i<=N;i++){const y=TRAIL.y0+(TRAIL.y1-TRAIL.y0)*i/N,p=trailPt(y),s=toScreen(p.x,p.y);i?g.lineTo(s.x,s.y):g.moveTo(s.x,s.y);}g.stroke();g.setLineDash([]);
    if(reach>TRAIL.y0){
      const n=Math.ceil(N*(reach-TRAIL.y0)/(TRAIL.y1-TRAIL.y0)),path=function(){g.beginPath();for(let i=0;i<=n;i++){const y=Math.min(reach,TRAIL.y0+(TRAIL.y1-TRAIL.y0)*i/N),p=trailPt(y),s=toScreen(p.x,p.y);i?g.lineTo(s.x,s.y):g.moveTo(s.x,s.y);}};
      path();g.strokeStyle='rgba(255,200,110,.18)';g.lineWidth=7;g.stroke();
      path();g.strokeStyle='rgba(230,190,100,.85)';g.lineWidth=Math.max(1.5,2.2*Math.min(1,z*1.6));g.stroke();}
    /* 年代刻度 */
    g.font='10px '+FONT_MONO;g.textAlign='center';g.textBaseline='middle';
    for(let y=1960;y<=2080;y+=10){const p=trailPt(y),s=toScreen(p.x+Math.cos(p.a)*44,p.y+Math.sin(p.a)*44),q=toScreen(p.x,p.y),q2=toScreen(p.x+Math.cos(p.a)*10,p.y+Math.sin(p.a)*10);
      g.strokeStyle='rgba(200,178,115,.5)';g.lineWidth=1;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q2.x,q2.y);g.stroke();
      if(z>.32){g.fillStyle='rgba(200,178,115,'+(y%50===0||y===1960?.85:.55)+')';g.fillText(String(y),s.x,s.y);}}
    const st=toScreen(trailPt(TRAIL.y0).x-30,trailPt(TRAIL.y0).y-20);g.fillStyle='rgba(234,214,160,.9)';g.font='11px '+FONT_MONO;g.fillText('1957 · 人类航迹',st.x,st.y-6);
    /* 标记 */
    markers.forEach(function(m){
      const s=toScreen(m.x,m.yy);if(s.x<-20||s.y<-20||s.x>W+20||s.y>H+20)return;
      if(m.kind==='ch'){const r=Math.max(4,6*Math.min(1.4,z*1.4)),st=chState(m.id);
        g.save();g.translate(s.x,s.y);g.rotate(Math.PI/4);g.fillStyle=st==='done'?'#E6B34D':st==='open'?'rgba(230,179,77,.55)':'rgba(120,120,140,.5)';g.fillRect(-r/2,-r/2,r,r);
        g.strokeStyle='rgba(255,236,190,.9)';g.lineWidth=1;g.strokeRect(-r/2,-r/2,r,r);g.restore();
        if(z>.55){g.fillStyle='rgba(234,214,160,.9)';g.font='11px '+FONT_UI;g.fillText(m.t.split(' · ')[0],s.x,s.y-r-8);g.font='10px '+FONT_MONO;}
        return;}
      const seen=S.hist.indexOf(m.id)>=0,r=Math.max(1.8,2.6*Math.min(1.3,z*1.4));
      g.beginPath();g.arc(s.x,s.y,r,0,7);
      if(m.kind==='fact'){g.fillStyle=seen?'rgba(234,214,160,.55)':'rgba(255,240,205,.95)';g.fill();}
      else if(m.kind==='story'){g.fillStyle='rgba(232,110,90,.9)';g.fill();}
      else{g.strokeStyle='rgba(234,214,160,.8)';g.lineWidth=1;if(m.kind==='spec')g.setLineDash([2,2]);g.stroke();g.setLineDash([]);}
    });
  }

  /* ---------------- 名牌 ---------------- */
  function placeLabels(){
    const z=cam.z;labels.classList.toggle('far',z<.42);labels.classList.toggle('near',z>1.2);labels.classList.toggle('narrow',W<520&&z<.75);
    $$('.wl',labels).forEach(function(el){
      const id=el.getAttribute('data-w'),w=id==='station'?STATION:WORLD_BY[id],p=toScreen(w.x,w.y);
      const rz=Math.max(10,w.r*z);
      el.style.transform='translate3d('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px,0)';el.style.setProperty('--rz',rz.toFixed(1)+'px');
    });
    const cue=byId('mapCue');if(cue&&cue.classList.contains('on')){const w=WORLD_BY.theater,p=toScreen(w.x,w.y);cue.style.transform='translate3d('+p.x.toFixed(1)+'px,'+(p.y-w.r*z*1.6-30).toFixed(1)+'px,0) translateX(-50%)';}
  }
  function refreshLabels(){
    if(!built)return;
    const nx=nextCh();
    [STATION].concat(WORLDS).forEach(function(w){
      const el=$('.wl[data-w="'+w.id+'"]',labels);if(!el)return;
      el.querySelector('em').textContent=w.id==='station'?(S.profile.name+' · '+rankOf(S.rep)):worldHint(w);
      el.classList.toggle('next',w.id==='theater'&&!!nx);
    });
    dirty=true;
  }

  /* ---------------- 输入 ---------------- */
  function bind(){
    stage.addEventListener('pointerdown',function(e){
      if(e.button>0)return;
      ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()});
      anim=null;inertia=null;wake();
      if(ptrs.size===1){drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,vx:0,vy:0,lt:performance.now(),lx:e.clientX,ly:e.clientY};moved=false;}
      else if(ptrs.size===2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;
        pinch={d:d,z:cam.z,w:toWorld(mx,my)};drag=null;moved=true;}
      hidePeek();
    });
    addEventListener('pointermove',function(e){
      if(!ptrs.has(e.pointerId))return;
      ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch&&ptrs.size>=2){const a=[...ptrs.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;
        cam.z=clamp(pinch.z*d/Math.max(1,pinch.d),minZ,maxZ);cam.x=pinch.w.x-(mx-W/2)/cam.z;cam.y=pinch.w.y-(my-H/2)/cam.z;clampCam();dirty=true;wake();return;}
      if(!drag)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!moved&&Math.abs(dx)+Math.abs(dy)>7){moved=true;stage.classList.add('dragging');}
      if(!moved)return;
      cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();
      const now=performance.now(),dt=Math.max(1,now-drag.lt)/1000;
      drag.vx=drag.vx*.6+((e.clientX-drag.lx)/dt)*.4;drag.vy=drag.vy*.6+((e.clientY-drag.ly)/dt)*.4;drag.lt=now;drag.lx=e.clientX;drag.ly=e.clientY;
      dirty=true;wake();
    });
    const up=function(e){
      if(!ptrs.has(e.pointerId))return;
      ptrs.delete(e.pointerId);
      if(pinch){if(ptrs.size<2){pinch=null;const r=[...ptrs.values()][0];if(r)drag={x:r.x,y:r.y,cx:cam.x,cy:cam.y,vx:0,vy:0,lt:performance.now(),lx:r.x,ly:r.y};}suppress();return;}
      if(!drag)return;
      stage.classList.remove('dragging');
      if(moved){
        const fresh=performance.now()-drag.lt<90;
        if(fresh&&Math.hypot(drag.vx,drag.vy)>140)inertia={vx:clamp(drag.vx,-2600,2600),vy:clamp(drag.vy,-2600,2600)};
        suppress();
      }else if(e.target===cv)tapCanvas(e.clientX,e.clientY);
      drag=null;
    };
    addEventListener('pointerup',up);addEventListener('pointercancel',up);
    stage.addEventListener('wheel',function(e){
      e.preventDefault();anim=null;inertia=null;
      const k=Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016));zoomAt(cam.z*k,e.clientX,e.clientY);
    },{passive:false});
    labels.addEventListener('click',function(e){
      if(suppressClick)return;
      const el=e.target.closest('.wl');if(!el)return;
      const id=el.getAttribute('data-w');SFX.tap();
      if(id==='station'){Panels.open('archive','me');return;}
      land(id);
    });
  }
  function suppress(){suppressClick=true;setTimeout(function(){suppressClick=false;},40);}
  function zoomAt(z,sx,sy){const w=toWorld(sx,sy);cam.z=clamp(z,minZ,maxZ);cam.x=w.x-(sx-W/2)/cam.z;cam.y=w.y-(sy-H/2)/cam.z;clampCam();dirty=true;wake();}
  function tapCanvas(sx,sy){
    const now=performance.now();
    if(lastTap&&now-lastTap.t<320&&Math.hypot(sx-lastTap.x,sy-lastTap.y)<30){lastTap=null;const w=toWorld(sx,sy);flyTo(w.x,w.y,cam.z*1.7,420);return;}
    lastTap={t:now,x:sx,y:sy};
    let best=null,bd=20;
    markers.forEach(function(m){const s=toScreen(m.x,m.yy),d=Math.hypot(s.x-sx,s.y-sy);if(d<bd){bd=d;best=m;}});
    if(!best)return;
    SFX.page();
    if(best.kind==='ch'){land('theater',best.id);return;}
    showPeek(best,sx,sy);
  }
  /* 航迹标记：先冒一个小签，再点一次打开史实卡 */
  let peekId='';
  function showPeek(m,sx,sy){
    const el=byId('mapPeek');
    if(peekId===m.id&&el.classList.contains('on')){hidePeek();Panels.history(m.id);return;}
    peekId=m.id;
    el.innerHTML='<b>'+m.y+'</b>'+esc(m.t)+'<small>'+({fact:'史实',plan:'计划',spec:'推演',story:'故事'}[m.kind]||'')+' · 再点一次看卡片</small>';
    el.style.left=clamp(sx,90,W-90)+'px';el.style.top=Math.max(90,sy-18)+'px';el.classList.add('on');
    el.onclick=function(){hidePeek();Panels.history(m.id);};
  }
  function hidePeek(){const el=byId('mapPeek');if(el)el.classList.remove('on');peekId='';}

  /* ---------------- 循环 ---------------- */
  function frame(now){
    if(!on){raf=0;return;}
    raf=requestAnimationFrame(frame);
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    const busy=!!(anim||inertia||ptrs.size);
    if(busy)idleT=0;else idleT+=dt;
    step(now,dt);
    if(dirty){drawFog();drawScene();placeLabels();dirty=false;}
    /* 动效层：镜头在动时每帧画；静止时约 30 帧；静止 3 秒后约 20 帧 */
    const gap=busy?0:(idleT>3?48:30);
    if(now-lastAnim>=gap){lastAnim=now;drawAnim(now);}
  }
  function wake(){if(on&&!raf){last=0;raf=requestAnimationFrame(frame);}}
  function start(){if(!built)return;on=true;dirty=true;wake();}
  function stop(){on=false;if(raf){cancelAnimationFrame(raf);raf=0;}}

  /* ---------------- 降落 ---------------- */
  let restore=null;
  function land(id,focus){
    const w=WORLD_BY[id];if(!w)return;
    hidePeek();restore={x:cam.x,y:cam.y,z:cam.z};
    byId('hub').classList.add('landing');SFX.whoosh();
    flyTo(w.x,w.y+w.r*.2,Math.min(maxZ,Math.max(cam.z*2.2,2.3)),620,function(){PlanetView.open(id,focus);byId('hub').classList.remove('landing');});
  }
  function takeoff(){
    byId('hub').classList.add('taking-off');
    const w=WORLD_BY[PlanetView.current()];
    if(w){cam.x=w.x;cam.y=w.y;cam.z=Math.max(cam.z,2.2);dirty=true;}
    const to=restore||fitView();restore=null;
    flyTo(to.x,to.y,to.z,620,function(){byId('hub').classList.remove('taking-off');});
  }

  return {
    build:build,start:start,stop:stop,resize:function(){if(built){resize();placeLabels();}},
    refresh:refreshLabels,land:land,takeoff:takeoff,
    fit:function(smooth){const v=fitView();if(smooth)flyTo(v.x,v.y,v.z,650);else setCam(v);},
    zoomBy:function(k){flyTo(cam.x,cam.y,cam.z*k,320);},
    pan:function(dx,dy){flyTo(cam.x+dx/cam.z,cam.y+dy/cam.z,cam.z,260);},
    focusWorld:function(id,z){const w=WORLD_BY[id];if(w)flyTo(w.x,w.y+60,z||1,900);},
    cue:function(onOff){const c=byId('mapCue');if(c)c.classList.toggle('on',!!onOff);dirty=true;},
    cam:cam,isBuilt:function(){return built;},
    /* 调试：各层绘制耗时 */
    _prof:function(n){n=n||20;const r={};[['fog',drawFog],['scene',drawScene],['anim',function(){drawAnim(performance.now());}],['labels',placeLabels]].forEach(function(f){const t=performance.now();for(let i=0;i<n;i++){cam.x+=.5;f[1]();}r[f[0]]=((performance.now()-t)/n).toFixed(2);});return r;}
  };
})();
const FONT_UI='"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
const FONT_MONO='"IBM Plex Mono",ui-monospace,Menlo,monospace';
const FONT_SERIF='"Songti SC","STSong","Noto Serif SC","SimSun",serif';
function spaced(t){return String(t).split('').join(' ');}

/* ---------------- 降落后的星球表面 ---------------- */
const PlanetView=(function(){
  let cur='',focusId='',cv,g,W=0,H=0,D=1;
  function nodesOf(w){
    if(w.id==='theater')return CH_ORDER.map(function(id){const C=CHAPTERS[id],st=chState(id),r=S.ch[id];
      return {k:'ch',id:id,ic:'ic-scale',y:C.year,t:C.num+' · '+C.title,s:C.sub,st:st,tag:st==='done'?r.grade:(st==='locked'?'未开启':''),arb:!!C.arbiter};});
    if(w.items)return w.items.map(function(id){const G=GAMES[id],r=S.games[id];
      return {k:'game',id:id,ic:GAME_IC[id]||'ic-star',y:G.year||'',t:G.title,s:G.sub||'',st:r&&r.plays?'done':'open',tag:(r&&G.badge)?G.badge(r):''};});
    if(w.id==='bench'){const n=Object.keys(S.judge||{}).length;return [
      {k:'panel',id:'bench',ic:'ic-gavel',y:'今日',t:'每日一案',s:'每天换一个，答完有星尘',st:S.daily&&S.daily.last===todayKey()?'done':'open',tag:''},
      {k:'panel',id:'bench',ic:'ic-scale',y:n+'/5',t:'五个小案子',s:'抢轨位、沙漠里的返回舱、火星上的旗子……',st:n>=5?'done':'open',tag:''}];}
    if(w.id==='archive')return [
      {k:'arch',id:'me',ic:'ic-file',y:'',t:'我的档案',s:'结案记录与裁判偏向',st:'open'},
      {k:'arch',id:'laws',ic:'ic-law',y:S.laws.length+'/'+LAWS.length,t:'法典',s:'办一个案子，记一条法',st:'open'},
      {k:'arch',id:'precs',ic:'ic-book',y:String(S.precs.length),t:'先例',s:'以裁决结案才会留下',st:'open'},
      {k:'arch',id:'hist',ic:'ic-star',y:S.hist.length+'/'+HISTORY.length,t:'史实卡',s:'航迹上的每个标记',st:'open'},
      {k:'arch',id:'achs',ic:'ic-star',y:S.achs.length+'/'+ACHS.length,t:'成就',s:'',st:'open'},
      {k:'arch',id:'shop',ic:'ic-dust',y:String(S.dust),t:'小卖部',s:'只卖方便和好看',st:'open'}];
    return [];
  }
  const GAME_IC={sat:'ic-sat',orbit:'ic-orbit',station:'ic-station',lander:'ic-moon',sling:'ic-sling',const:'ic-star',sweep:'ic-broom',paint:'ic-orbit'};
  function layout(n){
    const portrait=W/H<.95,top=portrait?205:175,bot=portrait?H*.2+40:H*.24+30,pts=[];
    for(let i=0;i<n;i++){
      if(portrait){const y=n===1?(top+H-bot)/2:H-bot-(H-bot-top)*i/(n-1);const x=n<=2?W*(i%2?.66:.34):W*(i%2?.7:.3);pts.push({x:x,y:y});}
      else{const x=n===1?W/2:W*.13+(W*.74)*i/(n-1);const y=H-bot-(H-bot-top)*(i%2?.78:.32);pts.push({x:x,y:y});}
    }
    return pts;
  }
  function render(){
    const w=WORLD_BY[cur];if(!w)return;
    const head=byId('pvHead');
    head.innerHTML='<button class="pv-back" id="pvBack">'+icon('ic-back')+'<span>星图</span></button>'+
      '<div class="pv-t"><b>'+w.name+'</b><span>'+w.en+'</span><em>'+w.line+'</em></div>';
    byId('pvBack').onclick=function(){SFX.tap();close();};
    const nodes=nodesOf(w),pts=layout(nodes.length),nx=nextCh();
    let h='',path='';
    nodes.forEach(function(n,i){
      const p=pts[i],isNext=(n.k==='ch'&&n.id===nx)||(n.k==='game'&&n.st==='open'&&!nodes.slice(0,i).some(function(m){return m.st==='open';}));
      h+='<button class="pn k-'+n.k+' st-'+n.st+(isNext?' next':'')+(n.id===focusId?' focus':'')+'" data-k="'+n.k+'" data-id="'+n.id+'" style="left:'+p.x.toFixed(0)+'px;top:'+p.y.toFixed(0)+'px;animation-delay:'+(.12+i*.07).toFixed(2)+'s">'+
        '<span class="pn-orb">'+icon(n.st==='locked'?'ic-lock':n.ic)+'</span>'+
        (n.y?'<span class="pn-y">'+n.y+'</span>':'')+'<span class="pn-t">'+n.t+'</span>'+(n.s?'<span class="pn-s">'+n.s+'</span>':'')+
        (n.tag?'<span class="pn-tag">'+esc(n.tag)+'</span>':'')+(n.arb?'<span class="pn-arb">仲裁员</span>':'')+'</button>';
      if(i){const a=pts[i-1],mx=(a.x+p.x)/2,my=(a.y+p.y)/2-30,done=nodes[i-1].st==='done';
        path+='<path class="'+(done?'solid':'')+'" d="M'+a.x.toFixed(0)+' '+a.y.toFixed(0)+' Q'+mx.toFixed(0)+' '+my.toFixed(0)+' '+p.x.toFixed(0)+' '+p.y.toFixed(0)+'"/>';}
    });
    byId('pvPath').setAttribute('viewBox','0 0 '+W+' '+H);byId('pvPath').innerHTML=path;
    byId('pvNodes').innerHTML=h;
    byId('pvNodes').classList.toggle('dense',W/H<.95&&nodes.length>=5);
    $$('#pvNodes .pn').forEach(function(b){b.onclick=function(){go(b.getAttribute('data-k'),b.getAttribute('data-id'));};});
  }
  function go(k,id){
    SFX.tap();
    if(k==='ch'){if(chState(id)==='locked'){SFX.error();toast('先完成上一章。');return;}startChapter(id);return;}
    if(k==='game'){Games.open(id);return;}
    if(k==='panel'){Panels.open('bench');return;}
    if(k==='arch'){Panels.open('archive',id);return;}
  }
  /* 背景：星空画一次；星球弧面单独一块画布，降落时用 CSS 从下往上升起（不占每帧绘制） */
  function paint(){
    const w=WORLD_BY[cur];if(!w)return;
    D=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=Math.round(W*D);cv.height=Math.round(H*D);g.setTransform(D,0,0,D,0,0);
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#03050B');bg.addColorStop(1,'#0A1024');g.fillStyle=bg;g.fillRect(0,0,W,H);
    const R0=rng(cur.length*17+3);
    for(let i=0;i<Math.round(W*H/2400);i++){g.fillStyle='rgba(235,240,255,'+(R0()*.6+.15).toFixed(2)+')';const r=R0()<.05?1.4:R0()*.7+.3;g.fillRect(R0()*W,R0()*H*.88,r*1.4,r*1.4);}
    const L=MapArt.LOOK[w.look],gc=byId('pvGround'),gg=gc.getContext('2d');
    const vis=H*(W/H<.95?.17:.22),R=Math.max(W,H)*1.7,Hg=Math.round(vis+R*.075+12),cx=W*.5,cy=Hg+R-vis,top=cy-R;
    gc.width=Math.round(W*D);gc.height=Math.round(Hg*D);gc.style.height=Hg+'px';gg.setTransform(D,0,0,D,0,0);gg.clearRect(0,0,W,Hg);
    const gl=gg.createRadialGradient(cx,cy,R*.985,cx,cy,R*1.06);gl.addColorStop(0,'rgba('+L.atm+',.55)');gl.addColorStop(.3,'rgba('+L.atm+',.18)');gl.addColorStop(1,'rgba('+L.atm+',0)');
    gg.fillStyle=gl;gg.beginPath();gg.arc(cx,cy,R*1.06,0,7);gg.arc(cx,cy,R*.985,0,7,true);gg.fill();
    gg.save();gg.translate(cx,cy);MapArt.drawPlanet(gg,w.look,R,23);gg.restore();
    const dk=gg.createLinearGradient(0,top,0,top+vis*.9);dk.addColorStop(0,'rgba(3,5,11,.25)');dk.addColorStop(1,'rgba(3,5,11,.86)');
    gg.fillStyle=dk;gg.beginPath();gg.arc(cx,cy,R,0,7);gg.fill();
    gg.strokeStyle='rgba('+L.atm+',.8)';gg.lineWidth=1.5;gg.beginPath();gg.arc(cx,cy,R,Math.PI*1.2,Math.PI*1.8);gg.stroke();
  }
  function open(id,focus){
    cur=id;focusId=focus||'';
    const v=byId('planetView');cv=byId('pvCv');g=cv.getContext('2d');
    paint();render();
    const gc=byId('pvGround');gc.style.animation='none';void gc.offsetWidth;gc.style.animation='';
    v.classList.add('on');byId('hub').classList.add('in-planet');
    StarMap.stop();
    MUSIC.setMode(WORLD_BY[id].music);setTimeout(function(){SFX.chime(4);},380);
    if(focus){const b=$('#pvNodes .pn[data-id="'+focus+'"]');if(b)setTimeout(function(){b.classList.add('flash');},700);}
  }
  function close(){
    if(!cur)return;
    const v=byId('planetView');v.classList.add('out');
    StarMap.start();StarMap.takeoff();SFX.whoosh();
    setTimeout(function(){v.classList.remove('on','out');byId('hub').classList.remove('in-planet');cur='';},320);
    MUSIC.setMode('deep');
  }
  return {
    open:open,close:close,current:function(){return cur;},isOpen:function(){return !!cur;},
    refresh:function(){if(cur){render();}},
    resize:function(){if(cur){paint();render();}},
    pause:function(){},resume:function(){}
  };
})();

/* ---------------- 对外：HUD 与 Hub（沿用旧接口名） ---------------- */
const HUD={
  refresh(){
    const p=S.profile;
    const nm=byId('hudName');if(nm)nm.textContent=p.name;
    const rk=byId('hudRank');if(rk)rk.textContent=rankOf(S.rep)+' · 声望 '+S.rep;
    const dd=byId('hudDust');if(dd)dd.textContent=S.dust;
    const hh=byId('hudHints');if(hh)hh.textContent=S.hints;
    const ff=byId('hudFocusBar');if(ff){ff.style.width=clamp(S.focus,0,100)+'%';ff.parentNode.parentNode.classList.toggle('low',S.focus<70);}
    const fv=byId('hudFocusV');if(fv)fv.textContent=S.focus;
    const av=byId('hudAv');if(av)av.innerHTML=avatarSVG('me');
    const nx=nextCh(),ct=byId('ctaT');
    if(ct){ct.textContent=nx?(CHAPTERS[nx].year+' · '+CHAPTERS[nx].title):'六案已结 · 重温任一案';}
  },
  hideHub(){byId('hub').classList.remove('on');StarMap.stop();PlanetView.pause();},
  showHub(){
    byId('hub').classList.add('on');HUD.refresh();
    if(PlanetView.isOpen())PlanetView.resume();else StarMap.start();
    Hub.refresh();
  }
};
const Hub=(function(){
  let built=false;
  return {
    init(){
      if(built)return;built=true;StarMap.build();StarMap.fit(false);StarMap.refresh();
      let rz=0;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){StarMap.resize();PlanetView.resize();},160);});
    },
    refresh(justDone){
      if(!built)return;StarMap.refresh();PlanetView.refresh();HUD.refresh();
      if(justDone&&PlanetView.current()==='theater'){const nx=nextCh();if(nx)setTimeout(function(){const b=$('#pvNodes .pn[data-id="'+nx+'"]');if(b){b.classList.add('flash');SFX.chime(3);}},500);}
    },
    /* 进入主界面：第一次来，先看全貌，再把镜头推向开庭剧场 */
    focusNext(){
      StarMap.fit(false);
      if(!Object.keys(S.ch).length){
        StarMap.cue(true);
        if(!S.profile.hubSeen){S.profile.hubSeen=true;save();}
      }else StarMap.cue(false);
    },
    goNext(){const nx=nextCh();StarMap.land('theater',nx||'ch6');},
    musicHere(){return PlanetView.isOpen()?WORLD_BY[PlanetView.current()].music:'deep';},
    onScroll(){},scrollToEra(){},
    current(){return PlanetView.current()||'map';}
  };
})();
