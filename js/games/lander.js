"use strict";
/* =====================================================================
   登月着陆（1969）：转向 + 推力，在燃料用完前平稳落到平台上。
   三关：静海（1969）· 月球背面（2019）· 南极（2023 以后）
   ===================================================================== */
GAMES.lander=(function(){
  const LV=[
    {name:'静海',year:1969,fuel:100,pad:84,rough:.5,vx:18,dark:false,
     note:'1969 年 7 月，阿波罗 11 号的登月舱“鹰”号降落在静海。着陆时燃料只剩下几十秒的余量。月面留下的铭牌写着：“我们为全人类的和平而来。”'},
    {name:'月球背面',year:2019,fuel:85,pad:60,rough:.85,vx:-34,dark:false,
     note:'2019 年 1 月，嫦娥四号在月球背面的冯·卡门撞击坑着陆。月球背面看不到地球，通信要靠一颗停在远处的中继卫星转发。'},
    {name:'南极',year:2023,fuel:75,pad:50,rough:1.1,vx:28,dark:true,
     note:'2023 年 8 月，月船 3 号在月球南极附近着陆。南极太阳总是贴着地平线，影子很长，地形看不清，这也是第五章那场官司发生的地方。'}];
  let stopF=null,keys={},btn={};
  function terrain(W,H,L,R){
    const pts=[],n=36,padI=8+Math.floor(R()*(n-18)),padW=Math.ceil(L.pad/(W/n));
    /* 带惯性的随机游走：坡度慢慢变，不会一步一个悬崖 */
    let y=H*.78,sl=0;const mx=H*.045*L.rough;
    for(let i=0;i<=n;i++){
      if(i>padI&&i<=padI+padW){pts.push({x:i*W/n,y:pts[pts.length-1].y,pad:true});continue;}
      sl=clamp(sl*.7+(R()-.5)*mx*1.6,-mx,mx);y+=sl;if(y<H*.6||y>H*.9){sl=-sl*.5;y=clamp(y,H*.6,H*.9);}
      if(i===padI+padW+1)y=pts[pts.length-1].y+sl*.5;
      pts.push({x:i*W/n,y:y});
    }
    /* 磨掉尖刺：月面是几十亿年撞出来、又被月尘盖平的，没有那么多刀锋 */
    for(let it=0;it<2;it++){const ys=pts.map(function(p){return p.y;});for(let i=1;i<pts.length-1;i++){if(pts[i].pad||pts[i+1].pad)continue;pts[i].y=ys[i-1]*.25+ys[i]*.5+ys[i+1]*.25;}}
    return {pts:pts,padX0:(padI)*W/n,padX1:(padI+padW)*W/n,padY:pts[padI+1].y};
  }
  function groundY(T,x){const p=T.pts;for(let i=0;i<p.length-1;i++){if(x>=p[i].x&&x<=p[i+1].x){const k=(x-p[i].x)/(p[i+1].x-p[i].x);return p[i].y+(p[i+1].y-p[i].y)*k;}}return p[p.length-1].y;}
  /* 预渲染远山和月面：远山两层；月面按坡向明暗，带撞击坑、碎石和长影子 */
  function paintScene(W,H,T,L,R){
    const d=Math.min(1.5,DPR());
    const sunL=!L.dark,sunX=L.dark?-1:-.55,sunY=L.dark?.12:.6;  /* 光从左边来；南极的太阳贴着地平线 */
    const far=document.createElement('canvas');far.width=W*d;far.height=H*d;const f=far.getContext('2d');f.scale(d,d);
    [[.5,'#2B2B31','#141418',.07,.6],[.6,'#43434A','#1E1E23',.05,1]].forEach(function(lay,li){
      const ph=[R()*6,R()*6,R()*6],pts=[];
      for(let x=0;x<=W+8;x+=8){const y=H*lay[0]-(Math.sin(x*.006+ph[0])*.5+Math.sin(x*.017+ph[1])*.3+Math.sin(x*.041+ph[2])*.12)*H*lay[3]*1.6;pts.push([x,y]);}
      const q=f.createLinearGradient(0,H*(lay[0]-.1),0,H*.9);q.addColorStop(0,lay[1]);q.addColorStop(1,lay[2]);f.fillStyle=q;
      f.beginPath();f.moveTo(0,H);pts.forEach(function(p){f.lineTo(p[0],p[1]);});f.lineTo(W,H);f.closePath();f.fill();
      /* 亮边：朝着太阳的坡 */
      f.lineWidth=1.2;for(let i=1;i<pts.length;i++){const up=pts[i][1]<pts[i-1][1];if(up!==(sunX>0))continue;
        f.strokeStyle='rgba(235,230,215,'+(L.dark?.28:.18)*lay[4]+')';f.beginPath();f.moveTo(pts[i-1][0],pts[i-1][1]);f.lineTo(pts[i][0],pts[i][1]);f.stroke();}
    });
    const gnd=document.createElement('canvas');gnd.width=W*d;gnd.height=H*d;const g=gnd.getContext('2d');g.scale(d,d);
    const top=Math.min.apply(null,T.pts.map(function(p){return p.y;}));
    g.save();g.beginPath();g.moveTo(0,H);T.pts.forEach(function(p){g.lineTo(p.x,p.y);});g.lineTo(W,H);g.closePath();g.clip();
    let q=g.createLinearGradient(0,top,0,H);q.addColorStop(0,L.dark?'#8F8C85':'#CFCBC1');q.addColorStop(.35,L.dark?'#5E5C57':'#9E9A91');q.addColorStop(1,L.dark?'#26252A':'#4C4A47');
    g.fillStyle=q;g.fillRect(0,top-2,W,H-top+2);
    /* 月壤颗粒 */
    for(let i=0;i<W*H/120;i++){const x=R()*W,y=top+R()*(H-top);g.fillStyle=R()<.5?'rgba(255,255,250,.07)':'rgba(0,0,0,.09)';g.fillRect(x,y,1+R()*1.5,1);}
    /* 撞击坑：远处扁、近处圆；背光的一侧内壁暗，迎光的一侧亮 */
    for(let i=0;i<22;i++){
      const x=R()*W,gy=groundY(T,x),y=gy+8+R()*(H-gy-10),depth=(y-gy)/(H-gy),rx=4+R()*24*(.4+depth),ry=rx*(.22+depth*.25);
      if(x+rx>T.padX0-6&&x-rx<T.padX1+6&&y-gy<16)continue;
      g.fillStyle='rgba(20,20,24,.32)';g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();
      g.strokeStyle='rgba(255,252,240,.32)';g.lineWidth=Math.max(.8,ry*.25);g.beginPath();g.ellipse(x,y,rx,ry,0,sunX<0?-.2:Math.PI-.2,sunX<0?Math.PI*.8:Math.PI*1.8);g.stroke();
      g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+(sunX<0?rx*.18:-rx*.18),y+ry*.12,rx*.8,ry*.7,0,0,7);g.fill();
    }
    /* 碎石 */
    for(let i=0;i<40;i++){const x=R()*W,gy=groundY(T,x);if(x>T.padX0-4&&x<T.padX1+4)continue;const y=gy+2+R()*(H-gy)*.8,r=.8+R()*2.6*(1+(y-gy)/(H-gy));
      g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x+(sunX<0?r*1.4:-r*1.4),y+r*.4,r*1.6,r*.5,0,0,7);g.fill();
      g.fillStyle=L.dark?'#77746E':'#B5B1A8';g.beginPath();g.ellipse(x,y,r,r*.7,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(x-r*.3*(sunX<0?1:-1),y-r*.25,r*.45,r*.3,0,0,7);g.fill();}
    /* 影子：太阳越低，山脊后面的影子拖得越长 */
    const k=L.dark?.1:.55;let line=-1e9;
    /* 影子只压在地表往下一段，再淡出，免得出现一刀切的竖边 */
    const sh=g.createLinearGradient(0,0,0,90);sh.addColorStop(0,'rgba(6,6,10,'+(L.dark?.66:.42)+')');sh.addColorStop(1,'rgba(6,6,10,0)');
    for(let x=0;x<=W;x+=2){const gy=groundY(T,x);line=Math.min(line+k*2,gy);if(line<-1e8)line=gy;const dep=gy-line;if(dep>.5){const a=Math.min(1,dep/14);g.save();g.globalAlpha=a;g.translate(x,gy);g.fillStyle=sh;g.fillRect(0,0,2,90);g.restore();}}
    g.restore();
    /* 坡面的明暗 + 迎光一侧的亮边 */
    for(let i=0;i<T.pts.length-1;i++){
      const p=T.pts[i],n=T.pts[i+1],dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len,lit=nx*sunX+(-ny)*sunY;
      const qq=g.createLinearGradient(0,Math.min(p.y,n.y),0,Math.min(p.y,n.y)+26);
      qq.addColorStop(0,lit>.5?'rgba(255,252,240,.22)':lit<.2?'rgba(0,0,0,.28)':'rgba(0,0,0,0)');qq.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=qq;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(n.x,n.y);g.lineTo(n.x,n.y+26);g.lineTo(p.x,p.y+26);g.closePath();g.fill();
      if(lit>.35){g.strokeStyle='rgba(255,250,232,'+(.25+lit*.4).toFixed(2)+')';g.lineWidth=1.3;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(n.x,n.y);g.stroke();}
    }
    /* 着陆平台：金属板 + 两端警示条 */
    const px=T.padX0,pw=T.padX1-T.padX0,py=T.padY;
    q=g.createLinearGradient(0,py-4,0,py+6);q.addColorStop(0,'#E9E6DC');q.addColorStop(.4,'#A9A69E');q.addColorStop(1,'#56544F');g.fillStyle=q;g.fillRect(px,py-4,pw,8);
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(px,py+4,pw,3);
    g.save();g.beginPath();g.rect(px,py-4,pw,4);g.clip();for(let x=px-8;x<px+pw+8;x+=8){if(x>px+12&&x<px+pw-20)continue;g.fillStyle='#E9B949';g.beginPath();g.moveTo(x,py);g.lineTo(x+4,py-4);g.lineTo(x+8,py-4);g.lineTo(x+4,py);g.fill();}g.restore();
    g.strokeStyle='rgba(246,195,91,.5)';g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.moveTo(px+pw/2,py-3);g.lineTo(px+pw/2,py+3);g.stroke();g.setLineDash([]);
    return {far:far,gnd:gnd,sunX:sunX};
  }
  /* 登月舱：下降级是皱巴巴的金箔，上升级是灰色的多面体，四条腿 */
  function drawLM(ctx,thrust,flick){
    if(thrust){
      const op=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
      GameArt.soft(ctx,0,22,34,'255,170,90',.55);
      const len=26+flick*18,q=ctx.createLinearGradient(0,10,0,10+len);q.addColorStop(0,'rgba(255,255,240,.95)');q.addColorStop(.25,'rgba(255,214,140,.85)');q.addColorStop(1,'rgba(255,120,50,0)');
      ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(-5.5,11);ctx.quadraticCurveTo(-7,10+len*.5,0,10+len);ctx.quadraticCurveTo(7,10+len*.5,5.5,11);ctx.closePath();ctx.fill();
      ctx.globalCompositeOperation=op;
    }
    ctx.lineCap='round';
    /* 后腿 */
    ctx.strokeStyle='#6E6A60';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(-11,16);ctx.moveTo(6,6);ctx.lineTo(11,16);ctx.stroke();
    /* 发动机喷管 */
    ctx.fillStyle='#3A3A40';ctx.beginPath();ctx.moveTo(-4,7);ctx.lineTo(4,7);ctx.lineTo(6,12);ctx.lineTo(-6,12);ctx.closePath();ctx.fill();
    /* 下降级 */
    let q=ctx.createLinearGradient(-13,-1,13,9);q.addColorStop(0,'#FBE3A0');q.addColorStop(.45,'#D9A646');q.addColorStop(1,'#7C5418');
    ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(-10,-1);ctx.lineTo(10,-1);ctx.lineTo(13,3);ctx.lineTo(13,7);ctx.lineTo(10,9);ctx.lineTo(-10,9);ctx.lineTo(-13,7);ctx.lineTo(-13,3);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(90,55,10,.55)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-9,1);ctx.lineTo(-4,4);ctx.lineTo(-7,8);ctx.moveTo(2,0);ctx.lineTo(5,5);ctx.lineTo(1,8);ctx.moveTo(8,2);ctx.lineTo(11,6);ctx.stroke();
    ctx.fillStyle='rgba(20,20,26,.55)';ctx.fillRect(-3,1,6,6);
    /* 前腿和脚垫 */
    ctx.strokeStyle='#C9C3B4';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-11,4);ctx.lineTo(-18,16);ctx.moveTo(11,4);ctx.lineTo(18,16);ctx.moveTo(-12,8);ctx.lineTo(-16,12);ctx.moveTo(12,8);ctx.lineTo(16,12);ctx.stroke();
    ctx.fillStyle='#D8D2C2';ctx.beginPath();ctx.ellipse(-18.5,16.3,3,1.1,0,0,7);ctx.ellipse(18.5,16.3,3,1.1,0,0,7);ctx.fill();
    /* 上升级 */
    q=ctx.createLinearGradient(-9,-14,9,-1);q.addColorStop(0,'#F1F3F6');q.addColorStop(.6,'#AEB4BE');q.addColorStop(1,'#6C727D');
    ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(-9,-1);ctx.lineTo(-10,-7);ctx.lineTo(-6,-13);ctx.lineTo(4,-14);ctx.lineTo(9,-9);ctx.lineTo(9,-1);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.moveTo(4,-14);ctx.lineTo(9,-9);ctx.lineTo(9,-1);ctx.lineTo(3,-1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1A2233';ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-4,-11.5);ctx.lineTo(-2,-8);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(160,210,255,.6)';ctx.fillRect(-5.5,-10,1,1.2);
    /* 舱口、天线、姿控推进器 */
    ctx.fillStyle='#8A909B';ctx.fillRect(-2,-16,4,2);
    ctx.strokeStyle='#C9CED6';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(6,-12);ctx.lineTo(9,-18);ctx.stroke();ctx.fillStyle='#E9ECF0';ctx.beginPath();ctx.ellipse(9.5,-18.5,2.4,1,-.5,0,7);ctx.fill();
    ctx.fillStyle='#5D636E';ctx.fillRect(-12,-8,2.5,2.5);ctx.fillRect(9.5,-8,2.5,2.5);
  }
  function start(host,api,lvArg){
    const rec=SAVE.game('lander');const lvI=clamp(lvArg==null?Math.min(rec.level||0,LV.length-1):lvArg,0,LV.length-1),L=LV[lvI];
    host.innerHTML='<div class="ld-hud"><span>高度<b id="ldAlt">0</b><i>米</i></span><span id="ldVyBox">下降<b id="ldVy">0</b><i>米/秒</i></span><span id="ldVxBox">横移<b id="ldVx">0</b></span><span id="ldAgBox">姿态<b id="ldAg">0°</b></span><span class="ld-fuel"><em>燃料</em><span><i id="ldFuel"></i></span></span></div>'+
      '<div class="ld-ctl"><button class="ld-b" data-k="l" aria-label="向左转">◀</button><button class="ld-b big" data-k="t">推 力</button><button class="ld-b" data-k="r" aria-label="向右转">▶</button></div>';
    const C=stageCanvas(host),ctx=C.ctx,W=C.w(),H=C.h();
    const R=rng(7+lvI*13+((rec.plays||0)%5));
    const T=terrain(W,H,L,R);
    const bg=GameArt.sky(W,H,{seed:11+lvI,tint:['#010207','#05070F'],neb:L.dark?[[.15,.2,.5,'70,60,140',.1]]:[[.8,.15,.45,'50,90,170',.09],[.2,.3,.5,'90,70,160',.07]],band:{x:.5,y:.28,a:-.35,w:.1,al:.1},starH:.7});
    const SC=paintScene(W,H,T,L,R);
    const er=Math.min(W,H)*.065;
    /* 静止的东西合成一张图，每帧只贴一次 */
    const bake=document.createElement('canvas');bake.width=SC.gnd.width;bake.height=SC.gnd.height;(function(){
      const g=bake.getContext('2d'),d=bake.width/W;g.scale(d,d);g.drawImage(bg,0,0,W,H);
      if(!L.dark)GameArt.drawPlanet(g,'earth',W*.8,H*.27,er,5);else GameArt.sun(g,W*.03,H*.55,10);
      g.drawImage(SC.far,0,0,W,H);g.drawImage(SC.gnd,0,0,W,H);})();
    /* 物理量按屏幕高度换算，手机竖屏、电脑横屏手感一致；开局朝着平台方向漂 */
    const sc=clamp(H/700,.55,1.4),pc=(T.padX0+T.padX1)/2,ls=clamp(sc*1.05,.75,1.3);
    const s={x:clamp(pc-Math.sign(L.vx)*Math.min(W*.3,260*sc),30,W-30),y:H*.12,vx:L.vx*sc,vy:0,a:0,fuel:L.fuel,done:false,parts:[],t:0,flash:0};
    keys={};btn={};
    $$('.ld-b',host).forEach(function(b){
      const k=b.getAttribute('data-k');
      const on=function(e){e.preventDefault();btn[k]=true;b.classList.add('on');},off=function(){btn[k]=false;b.classList.remove('on');};
      b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);
    });
    const kd=function(e){keys[e.key]=true;if([' ','ArrowUp','ArrowLeft','ArrowRight'].indexOf(e.key)>=0)e.preventDefault();};
    const ku=function(e){keys[e.key]=false;};
    addEventListener('keydown',kd);addEventListener('keyup',ku);
    const G=24*sc,TH=60*sc,ROT=2.4,VY=44*sc,VX=26*sc;
    const set=function(id,v){const e=byId(id);if(e&&e.textContent!==v)e.textContent=v;};
    const flag=function(id,c,v){const e=byId(id);if(e)e.classList.toggle(c,v);};
    stopF=loop(function(dt){
      s.t+=dt;
      const left=btn.l||keys.ArrowLeft||keys.a,right=btn.r||keys.ArrowRight||keys.d,thrust=(btn.t||keys.ArrowUp||keys[' ']||keys.w)&&s.fuel>0&&!s.done;
      if(!s.done){
        if(left)s.a-=ROT*dt;if(right)s.a+=ROT*dt;s.a=clamp(s.a,-1.4,1.4);
        /* 转向时姿控推进器喷一小口 */
        if((left||right)&&Math.random()<.5){const sd=left?1:-1;s.parts.push({x:s.x+Math.cos(s.a)*12*ls*sd,y:s.y-8*ls,vx:sd*60,vy:-10,life:.25,max:.25,r:3,c:'235,240,255',add:true});}
        s.vy+=G*dt;
        if(thrust){s.vx+=Math.sin(s.a)*TH*dt;s.vy-=Math.cos(s.a)*TH*dt;s.fuel=Math.max(0,s.fuel-14*dt);Thruster.on(.9);
          if(Math.random()<.7)s.parts.push({x:s.x-Math.sin(s.a)*20*ls,y:s.y+Math.cos(s.a)*20*ls,vx:-Math.sin(s.a)*110+(Math.random()-.5)*30,vy:Math.cos(s.a)*110+(Math.random()-.5)*20,life:.35,max:.35,r:5,c:'255,190,110',add:true});}
        else Thruster.off();
        s.x+=s.vx*dt;s.y+=s.vy*dt;
        if(s.x<10){s.x=10;s.vx=Math.abs(s.vx)*.3;}if(s.x>W-10){s.x=W-10;s.vx=-Math.abs(s.vx)*.3;}
        const gy=groundY(T,s.x);
        /* 月面没有空气：扬起的尘土贴着地面直直地飞出去 */
        if(thrust&&gy-s.y<100){const k=1-(gy-s.y)/100;for(let i=0;i<3;i++)if(Math.random()<k){const sd=Math.random()<.5?-1:1;s.parts.push({x:s.x+sd*(4+Math.random()*10),y:gy-1,vx:sd*(120+Math.random()*160),vy:-Math.random()*18,life:.7,max:.7,r:3+Math.random()*3,c:L.dark?'150,146,138':'215,210,198',drag:true});}}
        if(s.y+16>=gy){
          s.y=gy-16;s.done=true;Thruster.off();
          const onPad=s.x-10>=T.padX0&&s.x+10<=T.padX1,ok=onPad&&s.vy<VY&&Math.abs(s.vx)<VX&&Math.abs(s.a)<.22;
          for(let i=0;i<26;i++){const sd=Math.random()<.5?-1:1;s.parts.push({x:s.x+sd*Math.random()*14,y:gy-1,vx:sd*(40+Math.random()*120)*(ok?.6:1.4),vy:-Math.random()*30,life:1,max:1,r:3+Math.random()*4,c:L.dark?'150,146,138':'215,210,198',drag:true});}
          if(ok){SFX.dock();SFX.ok();buzz(30);s.a=0;FX.sparkle(vw()/2,vh()/2,'#F6C35B',20);setTimeout(function(){result(true);},900);}
          else{SFX.lose();buzz([60,40,60]);s.flash=1;for(let i=0;i<46;i++)s.parts.push({x:s.x,y:s.y,vx:(Math.random()-.5)*280,vy:-Math.random()*220,life:1.3,max:1.3,r:2+Math.random()*3,c:i%3?'255,200,110':'232,119,90',g:true,add:true});s.crash=true;
            setTimeout(function(){result(false,!onPad?'没落在平台上。':s.vy>=VY?'下降太快了。':Math.abs(s.vx)>=VX?'横向速度太大，侧翻了。':'着陆时机身太斜。');},1100);}
        }
      }
      /* 画 */
      ctx.drawImage(bake,0,0,W,H);
      /* 平台两端的灯 */
      const bl=(Math.sin(s.t*5)+1)/2;[T.padX0+2,T.padX1-2].forEach(function(x){GameArt.soft(ctx,x,T.padY-6,10,'255,110,80',.25+bl*.5);ctx.fillStyle=bl>.5?'#FF8A6A':'#8A3A2E';ctx.beginPath();ctx.arc(x,T.padY-6,2,0,7);ctx.fill();});
      /* 着陆器的影子：越低越清楚 */
      const gyS=groundY(T,s.x),alt0=gyS-s.y;
      if(!s.crash&&alt0<H*.5){const k=1-alt0/(H*.5),off=SC.sunX<0?alt0*.35:-alt0*.35;ctx.fillStyle='rgba(0,0,0,'+(.45*k).toFixed(2)+')';ctx.beginPath();ctx.ellipse(s.x+off,groundY(T,s.x+off)+1,16*ls*(1.3-k*.3),2.6*ls,0,0,7);ctx.fill();}
      if(thrust&&alt0<120){GameArt.soft(ctx,s.x,gyS,70*(1-alt0/120)+20,'255,190,120',.35*(1-alt0/120));}
      s.parts=s.parts.filter(function(p){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.g)p.vy+=G*3*dt;if(p.drag){p.vx*=1-dt*1.2;}p.life-=dt;return p.life>0;});
      ctx.globalCompositeOperation='lighter';s.parts.forEach(function(p){if(p.add)GameArt.soft(ctx,p.x,p.y,p.r*(1.4-p.life/p.max*.4),p.c,p.life/p.max);});ctx.globalCompositeOperation='source-over';
      s.parts.forEach(function(p){if(!p.add)GameArt.soft(ctx,p.x,p.y,p.r*(1.6-p.life/p.max*.6),p.c,p.life/p.max*.8);});
      if(s.flash>0){s.flash-=dt*1.5;ctx.globalCompositeOperation='lighter';GameArt.soft(ctx,s.x,s.y,90*(1.2-s.flash),'255,190,110',s.flash);ctx.globalCompositeOperation='source-over';}
      if(!s.crash){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.scale(ls,ls);drawLM(ctx,thrust,Math.random());ctx.restore();}
      const alt=Math.max(0,(gyS-s.y-16)/4/sc),vyR=s.vy/20/sc,vxR=s.vx/20/sc,ag=Math.round(s.a*57.3);
      set('ldAlt',alt.toFixed(0));set('ldVy',vyR.toFixed(1));set('ldVx',vxR.toFixed(1));set('ldAg',ag+'°');
      flag('ldVyBox','warn',s.vy>=VY);flag('ldVyBox','good',s.vy<VY&&alt<40);
      flag('ldVxBox','warn',Math.abs(s.vx)>=VX);flag('ldAgBox','warn',Math.abs(s.a)>=.22);flag('ldAgBox','good',Math.abs(s.a)<.22&&alt<40);
      const fb=byId('ldFuel');if(fb){fb.style.width=(s.fuel/L.fuel*100)+'%';fb.parentNode.parentNode.classList.toggle('low',s.fuel<L.fuel*.25);}
    });
    function result(ok,why){
      cleanup();
      const r=SAVE.game('lander');
      if(ok){
        const score=Math.round(s.fuel*10+(lvI+1)*100);
        const first=!r.landed||(r.level||0)<lvI+1;
        r.landed=true;r.level=Math.max(r.level||0,lvI+1);
        api.end({score:score,big:L.name+'　着陆成功',dust:first?25+lvI*10:6,note:L.note,lv:lvI,
          againLabel:lvI<LV.length-1?'下一关：'+LV[lvI+1].name:'再来一次',again:lvI<LV.length-1?function(){Games.start(lvI+1);}:null});
      }else api.end({ok:false,big:'着陆失败',dust:0,note:why+'<br>诀窍：离地面越近，越要提前点推力把速度降下来；落地前把机身摆正。',lv:lvI,againLabel:'再试一次'});
    }
    function cleanup(){removeEventListener('keydown',kd);removeEventListener('keyup',ku);Thruster.off();}
    GAMES.lander._cleanup=function(){cleanup();if(stopF)stopF();};
  }
  return {
    kind:'side',title:'登月着陆',sub:'1969 · 鹰已着陆',year:'1969',music:'retro',
    how:'按住“推力”减速，用左右键把着陆器摆正。<br>落在黄色平台上，下降速度小于 2 米/秒、机身基本竖直，就算成功。<br>键盘：方向键 ← → 转向，↑ 或空格推力。',
    fact:'月球的重力只有地球的六分之一，但没有空气，降落伞没用，只能靠发动机一点点减速。',
    levels:function(){const r=S.games.lander||{};return LV.map(function(l,i){const open=i<=(r.level||0);return '<button class="btn sm '+(open?'ghost':'')+'" data-lv="'+i+'"'+(open?'':' disabled')+'>'+(i+1)+'. '+l.name+' · '+l.year+'</button>';}).join('');},
    badge:function(r){return r.level?('第 '+r.level+'/3 关'):'';},
    start:start,
    stop:function(){if(GAMES.lander._cleanup)GAMES.lander._cleanup();}
  };
})();
