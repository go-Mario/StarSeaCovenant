"use strict";
/* =====================================================================
   现场搜查：第一章“现场取证”和第五章“现场勘验”共用。
   - 等玩家找标记时，对白框收起来，整块画面露出来、都能点；
     点中一个标记，对白框再升上来说话，说完又收起。
   - 场景按 1200×600 铺满剧场，手机竖屏只看得到中间一窄条：
     这时可以拖动画面看两边，屏幕边上的箭头标出那一侧还有几处没看，点箭头直接转过去。
   做法：改场景 SVG 的 viewBox 来平移，缩放比例不变，所以标记和画面始终对得上。
   ===================================================================== */
const Search=(function(){
  const VB=['scSvg','scBench','scDesk'],FULL='0 0 1200 600';
  let on=false,vx=0,vy=0,vw=1200,vh=600,s=1,drag=null,dragged=false,raf=0,tip='';
  function sc(){return byId('thScene');}
  function spots(){
    return $$('#scSvg .hotspot').map(function(g){return {g:g,x:+g.getAttribute('data-x'),y:+g.getAttribute('data-y')};});
  }
  function pannable(){return vw<1199||vh<599;}
  function apply(){
    const vb=vx.toFixed(1)+' '+vy.toFixed(1)+' '+vw.toFixed(1)+' '+vh.toFixed(1);
    VB.forEach(function(id){const e=byId(id);if(e)e.setAttribute('viewBox',vb);});
    marks();
  }
  function clampV(){vx=clamp(vx,0,1200-vw);vy=clamp(vy,0,600-vh);}
  /* 量一遍画面：keep=true 时保持当前看着的中心点（转屏、改窗口大小） */
  function measure(keep){
    const e=sc(),W=e.clientWidth,H=e.clientHeight;if(!W||!H)return;
    const cx=vx+vw/2,cy=vy+vh/2;
    s=Math.max(W/1200,H/600);vw=Math.min(1200,W/s);vh=Math.min(600,H/s);
    if(keep){vx=cx-vw/2;vy=cy-vh/2;}
    else{
      /* 一开始把镜头对准所有标记的中间 */
      const sp=spots();
      if(sp.length){
        const xs=sp.map(function(p){return p.x;}),ys=sp.map(function(p){return p.y;});
        vx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2-vw/2;
        vy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2-vh/2;
      }else{vx=(1200-vw)/2;vy=(600-vh)/2;}
    }
    clampV();apply();
  }
  /* 屏幕边上的箭头：那一侧还有几处没看 */
  function marks(){
    const L=byId('srL'),R=byId('srR'),bar=byId('srBar');if(!L||!R)return;
    const e=sc(),W=e.clientWidth,H=e.clientHeight,pad=Math.max(18,16*s);
    const left=[],right=[];
    spots().forEach(function(p){
      const x=(p.x-vx)*s,y=(p.y-vy)*s;
      if(x<pad)left.push({p:p,y:y,d:-x});else if(x>W-pad)right.push({p:p,y:y,d:x-W});
    });
    const put=function(btn,list,side){
      if(!list.length){btn.classList.remove('on');btn.onclick=null;return;}
      list.sort(function(a,b){return a.d-b.d;});
      const near=list[0];
      btn.innerHTML=side==='l'?'<i>‹</i><b>'+list.length+'</b>':'<b>'+list.length+'</b><i>›</i>';
      btn.setAttribute('aria-label',(side==='l'?'左边':'右边')+'还有 '+list.length+' 处');
      btn.style.top=clamp(near.y,70,H-40).toFixed(0)+'px';
      btn.classList.add('on');
      btn.onclick=function(ev){ev.stopPropagation();SFX.tap();panTo(near.p.x-vw/2,near.p.y-vh/2);};
    };
    put(L,left,'l');put(R,right,'r');
    if(bar){
      const n=spots().length;
      bar.innerHTML='<span>'+(tip||'点画面上发光的标记')+(n?' · 还有 '+n+' 处':'')+'</span>'+(pannable()&&(left.length||right.length)?'<small>左右拖动画面，看看两边</small>':'');
    }
  }
  function panTo(tx,ty){
    cancelAnimationFrame(raf);
    const x0=vx,y0=vy,t0=performance.now();
    tx=clamp(tx,0,1200-vw);ty=clamp(ty,0,600-vh);
    const step=function(t){
      const k=Math.min(1,(t-t0)/420),q=1-Math.pow(1-k,3);
      vx=x0+(tx-x0)*q;vy=y0+(ty-y0)*q;apply();
      if(k<1&&on)raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
  }
  /* 拖动画面；拖过之后松手的那一下不算点击，免得误点到标记 */
  function down(e){
    if(!on||!pannable()||e.target.closest('.sr-edge'))return;
    cancelAnimationFrame(raf);
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,vx:vx,vy:vy};dragged=false;
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!dragged&&Math.abs(dx)+Math.abs(dy)<8)return;
    dragged=true;byId('theater').classList.add('th-drag');
    vx=drag.vx-dx/s;vy=drag.vy-dy/s;clampV();apply();
  }
  function up(e){
    if(!drag||(e&&e.pointerId!==drag.id))return;
    drag=null;byId('theater').classList.remove('th-drag');
    if(dragged)setTimeout(function(){dragged=false;},0);
  }
  function eatClick(e){if(dragged){e.stopPropagation();e.preventDefault();dragged=false;}}
  function resize(){if(on)measure(true);}
  let bound=false;
  function bind(){
    if(bound)return;bound=true;
    const e=sc();
    e.addEventListener('pointerdown',down);
    addEventListener('pointermove',move);
    addEventListener('pointerup',up);addEventListener('pointercancel',up);
    e.addEventListener('click',eatClick,true);
    addEventListener('resize',resize);
  }
  return {
    /* 标记都摆好以后调用 */
    begin:function(hint){
      bind();on=true;tip=hint||'';
      const th=byId('theater');th.classList.add('th-search');
      th.classList.toggle('th-pan',false);
      measure(false);
      th.classList.toggle('th-pan',pannable());
      this.idle(true);
    },
    /* idle=true：在找标记，收起对白框；false：有人在说话 */
    idle:function(v){
      if(!on)return;
      byId('theater').classList.toggle('th-look',!!v);
      marks();
    },
    marks:marks,
    end:function(){
      if(!on&&!byId('theater').classList.contains('th-search'))return;
      on=false;drag=null;dragged=false;cancelAnimationFrame(raf);
      byId('theater').classList.remove('th-search','th-look','th-pan','th-drag');
      VB.forEach(function(id){const e=byId(id);if(e)e.setAttribute('viewBox',FULL);});
      vx=0;vy=0;vw=1200;vh=600;
      ['srL','srR'].forEach(function(id){const b=byId(id);if(b){b.classList.remove('on');b.onclick=null;}});
    },
    get on(){return on;}
  };
})();
