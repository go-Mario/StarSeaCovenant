"use strict";
/* =====================================================================
   场景：1200×600 宽画幅。
   · 六个年代的庭：1978 木墙暖光 → 2009 玻璃与大屏 → 2031 轨道站 →
     2043 月球门户站 → 2052 月面穹顶 → 2077 星海仲裁院大厅
   · 户外：冻土荒原、月球南极、高原射电站、重演室
   户外用扁平分层的插画画法（远山逐层变淡，不描边）。
   ===================================================================== */
const SCENES=(function(){
  const VX=600,VY=232;
  function stars(seed,n,x0,y0,x1,y1,maxr,col){
    const r=rng(seed);let s='';
    for(let i=0;i<n;i++){const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0),rr=(r()*(maxr||1.2)+.25).toFixed(2),o=(r()*.6+.25).toFixed(2);
      s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr+'" fill="'+(col||'#E6EEFF')+'" opacity="'+o+'"'+(i%9===0?' class="twinkle" style="animation-delay:'+(r()*3).toFixed(2)+'s"':'')+'/>';}
    return s;
  }
  /* 写实感银河带：一条斜向的光带 + 尘埃暗带 + 密集小星 */
  function milkyWay(seed,x0,y0,x1,y1,ang){
    const r=rng(seed);let s='<g transform="rotate('+(ang||-18)+' '+((x0+x1)/2)+' '+((y0+y1)/2)+')">';
    const cx=(x0+x1)/2,cy=(y0+y1)/2,w=(x1-x0)*1.3;
    s+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(w/2)+'" ry="70" fill="url(#mwG)" opacity=".75"/>';
    s+='<ellipse cx="'+(cx+40)+'" cy="'+(cy-10)+'" rx="'+(w*.28)+'" ry="40" fill="url(#mwCore)" opacity=".7"/>';
    for(let i=0;i<260;i++){const x=cx+(r()-.5)*w,y=cy+(r()+r()+r()-1.5)*60;s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r()*.9+.2).toFixed(2)+'" fill="#fff" opacity="'+(r()*.7+.2).toFixed(2)+'"/>';}
    s+='<path d="M'+(cx-w/2)+' '+(cy+6)+' C'+(cx-w/4)+' '+(cy-16)+' '+(cx)+' '+(cy+18)+' '+(cx+w/2)+' '+(cy-4)+'" stroke="#05060C" stroke-width="16" fill="none" opacity=".55" filter="url(#softBlur)"/>';
    return s+'</g>';
  }
  function defs(){
    return '<defs>'+
      '<linearGradient id="spaceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040A"/><stop offset="1" stop-color="#0B1630"/></linearGradient>'+
      '<radialGradient id="earthDayG" cx=".42" cy=".08" r=".9"><stop offset="0" stop-color="#8CC4F2"/><stop offset=".25" stop-color="#3F86CF"/><stop offset=".6" stop-color="#1D4F8E"/><stop offset="1" stop-color="#0A1A33"/></radialGradient>'+
      '<radialGradient id="moonG" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#E8E6E0"/><stop offset=".6" stop-color="#B5B2AA"/><stop offset="1" stop-color="#5E5C58"/></radialGradient>'+
      '<radialGradient id="sunG"><stop offset="0" stop-color="#FFF6E0"/><stop offset=".18" stop-color="#FFE2A8" stop-opacity=".85"/><stop offset="1" stop-color="#FFB060" stop-opacity="0"/></radialGradient>'+
      '<linearGradient id="mwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AA8FF" stop-opacity="0"/><stop offset=".5" stop-color="#D9D2F0" stop-opacity=".35"/><stop offset="1" stop-color="#9AA8FF" stop-opacity="0"/></linearGradient>'+
      '<radialGradient id="mwCore"><stop offset="0" stop-color="#FFE9C8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9C8" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="nebV"><stop offset="0" stop-color="#8A5BE0" stop-opacity=".45"/><stop offset="1" stop-color="#8A5BE0" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="nebT"><stop offset="0" stop-color="#2AB7AE" stop-opacity=".35"/><stop offset="1" stop-color="#2AB7AE" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="lampG"><stop offset="0" stop-color="#FFD59A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD59A" stop-opacity="0"/></radialGradient>'+
      '<linearGradient id="beamG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3AE" stop-opacity=".42"/><stop offset="1" stop-color="#FFC977" stop-opacity="0"/></linearGradient>'+
      '<linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".56" stop-color="#fff" stop-opacity="0"/></linearGradient>'+
      '<filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>'+
      '<clipPath id="winClip"><path d="M390 330 L390 150 C390 96 486 74 600 74 C714 74 810 96 810 150 L810 330 Z"/></clipPath>'+
      '<clipPath id="rectClip"><rect x="380" y="86" width="440" height="244" rx="6"/></clipPath>'+
      '<clipPath id="roundClip"><circle cx="600" cy="210" r="168"/></clipPath>'+
    '</defs>';
  }
  /* ---------------- 窗外：每个年代一景 ---------------- */
  const VIEW={
    city1978:function(){ /* 湖城，傍晚的低太阳 */
      let s='<rect x="380" y="70" width="440" height="300" fill="#F0D7A2"/>';
      s+='<rect x="380" y="70" width="440" height="300" fill="url(#sky78)"/>';
      s+='<circle cx="700" cy="250" r="44" fill="#FFE7B0"/><circle cx="700" cy="250" r="90" fill="#FFD48A" opacity=".25"/>';
      s+='<path d="M380 262 L420 262 L420 236 L446 236 L446 252 L470 252 L470 218 L498 218 L498 258 L540 258 L540 230 L566 230 L566 262 L612 262 L612 244 L640 244 L640 266 L820 266 L820 330 L380 330 Z" fill="#7C8BA6" opacity=".85"/>';
      s+='<path d="M380 272 L820 272 L820 330 L380 330 Z" fill="#A9B7C8"/>';
      s+='<path d="M600 274 L720 274 M630 284 L760 284 M660 296 L740 296" stroke="#FFE7B0" stroke-width="2" opacity=".7"/>';
      return s;},
    screen2009:function(){ /* 2009：没有窗，一块大屏 */
      let s='<rect x="380" y="86" width="440" height="244" fill="#0A1E3A"/>';
      for(let i=0;i<12;i++)s+='<path d="M'+(380+i*40)+' 86 L'+(380+i*40)+' 330" stroke="#1D4A7A" stroke-width=".8" opacity=".6"/>';
      for(let i=0;i<7;i++)s+='<path d="M380 '+(86+i*40)+' L820 '+(86+i*40)+'" stroke="#1D4A7A" stroke-width=".8" opacity=".6"/>';
      s+='<circle cx="600" cy="214" r="54" fill="#1E5DA8"/><circle cx="600" cy="214" r="54" fill="none" stroke="#5FA9FF" stroke-width="2"/>';
      s+='<ellipse cx="600" cy="214" rx="150" ry="60" fill="none" stroke="#3CC7E6" stroke-width="1.6" transform="rotate(-14 600 214)"/>';
      s+='<ellipse cx="600" cy="214" rx="132" ry="78" fill="none" stroke="#F6C35B" stroke-width="1.6" transform="rotate(32 600 214)"/>';
      s+='<g transform="translate(724 166)"><circle r="9" fill="none" stroke="#FF6A52" stroke-width="2" class="blink"/><path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#FF6A52" stroke-width="2"/></g>';
      s+='<text x="396" y="110" font-family="monospace" font-size="12" fill="#5FA9FF" letter-spacing="1">CONJUNCTION ANALYSIS</text><text x="396" y="318" font-family="monospace" font-size="11" fill="#3CC7E6" opacity=".8">MISS DIST 0.0 KM  ·  T+00:00:00</text>';
      return s;},
    earth:function(){
      let s='<rect x="380" y="70" width="440" height="300" fill="url(#spaceG)"/>'+stars(11,70,380,70,820,250,1.1);
      s+='<circle cx="640" cy="620" r="400" fill="url(#earthDayG)"/>';
      s+='<circle cx="640" cy="620" r="400" fill="none" stroke="#9FD3FF" stroke-width="5" opacity=".7"/><circle cx="640" cy="620" r="408" fill="none" stroke="#9FD3FF" stroke-width="14" opacity=".12"/>';
      s+='<path d="M420 300 C470 270 520 268 560 280 C600 290 650 270 700 262" stroke="#fff" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>';
      s+='<path d="M480 330 C540 312 600 318 660 300" stroke="#fff" stroke-width="8" fill="none" opacity=".25" stroke-linecap="round"/>';
      s+='<g transform="translate(520 150) rotate(-12)"><rect x="-6" y="-4" width="12" height="8" fill="#B9C2CF"/><rect x="-24" y="-3" width="16" height="6" fill="#2D5FA8"/><rect x="8" y="-3" width="16" height="6" fill="#2D5FA8"/></g>';
      return s;},
    moonClose:function(){
      let s='<rect x="380" y="70" width="440" height="300" fill="url(#spaceG)"/>'+stars(21,80,380,70,820,330,1.1);
      s+='<circle cx="560" cy="300" r="190" fill="url(#moonG)"/>';
      const r=rng(4);for(let i=0;i<14;i++){const a=r()*6.28,rr=r()*150,x=560+Math.cos(a)*rr,y=300+Math.sin(a)*rr;if(y<120)continue;s+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+(r()*14+4).toFixed(0)+'" fill="#8C8A84" opacity=".45"/>';}
      s+='<circle cx="770" cy="118" r="22" fill="url(#earthDayG)"/><circle cx="770" cy="118" r="22" fill="none" stroke="#9FD3FF" stroke-width="1.5" opacity=".7"/>';
      return s;},
    lunarSouth:function(){ /* 月球南极：黑天、低太阳、极长的影子，地球贴着地平线 */
      let s='<rect x="380" y="70" width="440" height="300" fill="#020308"/>'+stars(31,60,380,70,820,220,1);
      s+='<circle cx="470" cy="224" r="26" fill="url(#earthDayG)"/><path d="M444 224 A26 26 0 0 0 496 224 Z" fill="#020308" opacity=".55"/>';
      s+='<path d="M380 250 L450 236 L520 248 L600 228 L680 244 L760 232 L820 242 L820 330 L380 330 Z" fill="#9A988F"/>';
      s+='<path d="M380 262 L470 256 L560 266 L650 252 L740 262 L820 256 L820 330 L380 330 Z" fill="#C9C6BD"/>';
      s+='<path d="M380 290 L820 280 L820 330 L380 330 Z" fill="#E2DFD6"/>';
      s+='<path d="M600 228 L680 244 L820 300 L820 330 L700 330 Z" fill="#2A2A2E" opacity=".75"/>';
      s+='<path d="M380 270 L460 330 L380 330 Z" fill="#2A2A2E" opacity=".6"/>';
      s+='<g transform="translate(700 262)"><rect x="-8" y="-12" width="16" height="12" fill="#E9C46A"/><path d="M-12 0 L12 0" stroke="#555" stroke-width="2"/><path d="M0 -12 L0 -24" stroke="#999" stroke-width="1.4"/><circle cx="0" cy="-24" r="2" fill="#FF6A52" class="blink"/></g>';
      return s;},
    deep2077:function(){
      let s='<rect x="380" y="40" width="440" height="340" fill="#03040B"/>';
      s+='<ellipse cx="520" cy="150" rx="160" ry="90" fill="url(#nebV)"/><ellipse cx="700" cy="250" rx="150" ry="80" fill="url(#nebT)"/>';
      s+=milkyWay(77,380,120,820,260,-24)+stars(41,90,380,40,820,380,1.2);
      s+='<g transform="translate(690 120)"><circle r="3" fill="#FFE2B0"/><circle r="10" fill="#FFB45E" opacity=".25" class="twinkle"/><circle r="22" fill="none" stroke="#FFB45E" stroke-width=".8" opacity=".4"/></g>';
      return s;}
  };
  /* 年代配色 */
  const PAL={
    c1978:{wallT:'#2A1D15',wallM:'#5A3E2A',wallB:'#2E2016',side:'#24180F',side2:'#3E2A1C',ceil:'#170F0A',panel:'#5E4128',pline:'#38261A',floorT:'#4A3423',floorB:'#1A120C',aisle:'#6E2433',aisleL:'#C9962E',lamp:'#FFD9A0',trim:'#C9962E',chair:'#3A1F18',plinth:'#22170F',view:'city1978',win:'arch',beam:true,
           benchT:'#8A5E3A',bench:'#4A3020',deskT:'#6A4A30',desk:'#3E2A1C',rim:'#FFD9A0'},
    c2009:{wallT:'#0E1520',wallM:'#203046',wallB:'#121B28',side:'#0D141E',side2:'#1A2A3E',ceil:'#080C14',panel:'#1A283A',pline:'#2B4A6A',floorT:'#22344A',floorB:'#0A1018',aisle:'#16243A',aisleL:'#3CC7E6',lamp:'#BFE6FF',trim:'#5FA9FF',chair:'#1A2433',plinth:'#0E1520',view:'screen2009',win:'rect',strip:true,
           benchT:'#C9D2DC',bench:'#2E3B4E',deskT:'#B9C4D0',desk:'#26344A',rim:'#9EC2FF'},
    c2031:{wallT:'#101A2E',wallM:'#2A3D5C',wallB:'#141F34',side:'#0E1628',side2:'#22314E',ceil:'#0A101C',panel:'#24365A',pline:'#16223A',floorT:'#22324E',floorB:'#0A1020',aisle:'#2A2236',aisleL:'#D8A84E',lamp:'#FFE2B0',trim:'#D8A84E',chair:'#2A1E28',plinth:'#101828',view:'earth',win:'arch',
           benchT:'#6A4A38',bench:'#3A2820',deskT:'#3A4A66',desk:'#1E2A40',rim:'#9EC2FF'},
    c2043:{wallT:'#141522',wallM:'#30334A',wallB:'#181A28',side:'#11121E',side2:'#262840',ceil:'#0B0C14',panel:'#2E3150',pline:'#1A1C30',floorT:'#2A2C42',floorB:'#0C0D16',aisle:'#3A2A22',aisleL:'#E9C46A',lamp:'#FFE9C0',trim:'#E9C46A',chair:'#2A2030',plinth:'#141522',view:'moonClose',win:'arch',
           benchT:'#7A6A58',bench:'#3E3428',deskT:'#4A4E6A',desk:'#242640',rim:'#FFE2B0'},
    c2052:{wallT:'#7E8796',wallM:'#C9CED6',wallB:'#8E97A6',side:'#6C7584',side2:'#A9B1BE',ceil:'#4E5664',panel:'#B9C0CA',pline:'#9AA3B2',floorT:'#A9B0BC',floorB:'#4A5260',aisle:'#E8775A',aisleL:'#FFF',lamp:'#FFFFFF',trim:'#E8775A',chair:'#5A6474',plinth:'#7A8494',view:'lunarSouth',win:'rect',
           benchT:'#E9ECF0',bench:'#7A8494',deskT:'#D6DBE2',desk:'#6A7484',rim:'#FFFFFF'},
    c2077:{wallT:'#070A16',wallM:'#151C36',wallB:'#0A0F20',side:'#060914',side2:'#141A32',ceil:'#04060E',panel:'#121A34',pline:'#2A2A5A',floorT:'#141B34',floorB:'#05070F',aisle:'#2A1E4A',aisleL:'#B99CFF',lamp:'#D9CCFF',trim:'#D8A84E',chair:'#1A1630',plinth:'#0A0E1E',view:'deep2077',win:'round',
           benchT:'#2A2A4A',bench:'#14142A',deskT:'#22264A',desk:'#12152C',rim:'#B9A6FF'}
  };
  function chamber(P){
    let s='<rect width="1200" height="600" fill="'+P.wallM+'"/>';
    s+='<defs><linearGradient id="wall_'+P.view+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+P.wallT+'"/><stop offset=".55" stop-color="'+P.wallM+'"/><stop offset="1" stop-color="'+P.wallB+'"/></linearGradient>'+
      '<linearGradient id="floor_'+P.view+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+P.floorT+'"/><stop offset="1" stop-color="'+P.floorB+'"/></linearGradient>'+
      '<linearGradient id="sky78" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB7D6"/><stop offset=".6" stop-color="#F3D9A4"/><stop offset="1" stop-color="#E9A35B"/></linearGradient></defs>';
    s+='<rect width="1200" height="600" fill="url(#wall_'+P.view+')"/>';
    s+='<path d="M0 0 L1200 0 L900 60 L300 60 Z" fill="'+P.ceil+'"/>';
    for(let i=0;i<7;i++){const x=330+i*90;s+='<ellipse cx="'+x+'" cy="58" rx="9" ry="2.2" fill="'+P.lamp+'" opacity=".7"/><ellipse cx="'+x+'" cy="70" rx="34" ry="12" fill="url(#lampG)" opacity=".35"/>';}
    s+='<path d="M0 0 L300 60 L300 372 L0 600 Z" fill="'+P.side+'"/><path d="M1200 0 L900 60 L900 372 L1200 600 Z" fill="'+P.side+'"/>';
    s+='<path d="M60 40 L240 74 L240 360 L60 470 Z M1140 40 L960 74 L960 360 L1140 470 Z" fill="'+P.side2+'" opacity=".55"/>';
    if(P.strip){s+='<path d="M20 110 L280 120 M20 300 L280 290 M1180 110 L920 120 M1180 300 L920 290" stroke="#3CC7E6" stroke-width="3" opacity=".7"/>';}
    s+='<rect x="300" y="60" width="600" height="312" fill="'+P.panel+'"/>';
    for(let i=0;i<=10;i++){const x=300+i*60;s+='<path d="M'+x+' 60 L'+x+' 372" stroke="'+P.pline+'" stroke-width="2"/>';}
    s+='<path d="M300 300 L900 300" stroke="'+P.pline+'" stroke-width="2"/>';
    /* 窗 / 屏 */
    if(P.win==='arch'){
      s+='<g clip-path="url(#winClip)">'+VIEW[P.view]()+'<rect x="380" y="70" width="440" height="300" fill="url(#glassG)"/></g>';
      s+='<path d="M390 330 L390 150 C390 96 486 74 600 74 C714 74 810 96 810 150 L810 330" fill="none" stroke="'+P.ceil+'" stroke-width="12"/>';
      s+='<path d="M530 80 L530 330 M670 80 L670 330 M390 214 L810 214" stroke="'+P.ceil+'" stroke-width="6"/>';
    }else if(P.win==='rect'){
      s+='<g clip-path="url(#rectClip)">'+VIEW[P.view]()+'</g><rect x="380" y="86" width="440" height="244" rx="6" fill="none" stroke="'+P.ceil+'" stroke-width="10"/>';
    }else{
      s+='<g clip-path="url(#roundClip)">'+VIEW[P.view]()+'</g><circle cx="600" cy="210" r="168" fill="none" stroke="'+P.ceil+'" stroke-width="12"/><circle cx="600" cy="210" r="178" fill="none" stroke="'+P.trim+'" stroke-width="1.4" opacity=".5"/>';
      for(let i=0;i<12;i++){const a=i/12*6.283;s+='<circle cx="'+(600+Math.cos(a)*178).toFixed(1)+'" cy="'+(210+Math.sin(a)*178).toFixed(1)+'" r="2.4" fill="'+P.trim+'" opacity=".7"/>';}
    }
    /* 1978：低太阳从侧窗斜照进来，墙上一条条暖光和影子 */
    if(P.beam){
      s+='<g opacity=".9"><path d="M0 120 L300 60 L620 380 L180 600 Z" fill="url(#beamG)"/><path d="M1200 160 L900 120 L760 372 L1040 600 Z" fill="url(#beamG)" opacity=".5"/></g>';
      s+='<path d="M120 200 L330 150 L330 170 L120 226 Z M140 300 L330 252 L330 272 L140 330 Z" fill="#000" opacity=".18"/>';
    }
    /* 庭徽 */
    s+='<g transform="translate(600 46)" opacity=".95"><circle r="15" fill="'+P.ceil+'" stroke="'+P.trim+'" stroke-width="1.4"/><path d="M0 -8 L0 8 M-9 -4 L9 -4 M-5 9 L5 9 M-12 -4 L-9 3 L-6 -4 M6 -4 L9 3 L12 -4" stroke="'+P.trim+'" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>';
    /* 地面 */
    s+='<path d="M300 372 L900 372 L1200 600 L0 600 Z" fill="url(#floor_'+P.view+')"/>';
    for(let i=-6;i<=6;i++){const x=600+i*55,bx=600+i*170;s+='<path d="M'+x+' 372 L'+bx+' 600" stroke="'+P.pline+'" stroke-width="1" opacity=".55"/>';}
    s+='<path d="M546 372 L654 372 L760 600 L440 600 Z" fill="'+P.aisle+'" opacity=".85"/><path d="M546 372 L440 600 M654 372 L760 600" stroke="'+P.aisleL+'" stroke-width="1.2" opacity=".6"/>';
    /* 两位边裁（剪影）与首席的高背椅 */
    [[468],[732]].forEach(function(p){
      s+='<path d="M'+(p[0]-34)+' 352 L'+(p[0]-34)+' 262 C'+(p[0]-34)+' 236 '+(p[0]+34)+' 236 '+(p[0]+34)+' 262 L'+(p[0]+34)+' 352 Z" fill="'+P.chair+'"/>';
      s+='<use href="#pt-silhouette" x="'+(p[0]-55)+'" y="232" width="110" height="156" opacity=".8"/>';
    });
    s+='<path d="M560 352 L560 236 C560 204 640 204 640 236 L640 352 Z" fill="'+P.chair+'"/>';
    s+='<path d="M318 372 L882 372 L902 404 L298 404 Z" fill="'+P.plinth+'"/><path d="M298 404 L902 404" stroke="'+P.trim+'" stroke-width="1" opacity=".45"/>';
    return s;
  }
  function benchFront(P){
    let s='<path d="M352 344 L848 344 L866 360 L334 360 Z" fill="'+P.benchT+'"/><path d="M334 360 L866 360 L866 430 L334 430 Z" fill="'+P.bench+'"/>';
    s+='<path d="M334 362 L866 362" stroke="'+P.trim+'" stroke-width="1.6" opacity=".7"/>';
    for(let i=0;i<9;i++){const x=352+i*62;s+='<rect x="'+x+'" y="372" width="48" height="48" rx="1.5" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>';}
    s+='<g transform="translate(600 396)"><circle r="17" fill="'+P.plinth+'" stroke="'+P.trim+'" stroke-width="1.4"/><path d="M0 -9 L0 9 M-10 -4 L10 -4 M-5 10 L5 10 M-13 -4 L-10 3 L-7 -4 M7 -4 L10 3 L13 -4" stroke="'+P.trim+'" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>';
    [468,600,732].forEach(function(x,i){
      s+='<path d="M'+(x-22)+' 352 L'+(x+22)+' 352 L'+(x+19)+' 342 L'+(x-19)+' 342 Z" fill="#E6DCC4" opacity=".9"/>';
      s+='<path d="M'+(x+30)+' 350 C'+(x+32)+' 330 '+(x+22)+' 322 '+(x+14)+' 320" stroke="#20242C" stroke-width="1.6" fill="none"/><circle cx="'+(x+14)+'" cy="320" r="2.2" fill="#30343C"/><circle cx="'+(x+14)+'" cy="320" r=".8" fill="#FF5A4A" opacity="'+(i===1?'.9':'.25')+'"/>';
    });
    if(P.view==='city1978'){[420,780].forEach(function(x){s+='<path d="M'+(x-14)+' 344 L'+(x+14)+' 344 L'+(x+8)+' 330 L'+(x-8)+' 330 Z" fill="#2F6B3F"/><path d="M'+x+' 344 L'+x+' 330" stroke="#C9962E" stroke-width="2"/><ellipse cx="'+x+'" cy="344" rx="40" ry="10" fill="#FFE9A0" opacity=".25"/>';});}
    s+='<path d="M380 350 L430 346 L436 352 L384 356 Z" fill="#EFE7D4" opacity=".85"/>';
    return s;
  }
  function desks(P){
    let s='';
    s+='<path d="M-20 498 L318 476 L346 500 L-20 528 Z" fill="'+P.deskT+'"/><path d="M-20 528 L346 500 L346 600 L-20 600 Z" fill="'+P.desk+'"/><path d="M-20 529 L346 501" stroke="'+P.trim+'" stroke-width="1.2" opacity=".5"/>';
    s+='<path d="M1220 498 L882 476 L854 500 L1220 528 Z" fill="'+P.deskT+'"/><path d="M1220 528 L854 500 L854 600 L1220 600 Z" fill="'+P.desk+'"/><path d="M1220 529 L854 501" stroke="'+P.trim+'" stroke-width="1.2" opacity=".5"/>';
    s+='<path d="M60 500 L140 494 L150 504 L68 511 Z" fill="#EFE7D4"/><path d="M1060 500 L1140 494 L1150 504 L1068 511 Z" fill="#E6DECA"/>';
    if(P.view!=='city1978'){s+='<path d="M196 488 L262 483 L268 491 L200 496 Z" fill="#1A1F29"/><path d="M200 488 L262 483 L258 470 L204 474 Z" fill="#273041"/><path d="M207 476 L256 472 L258 481 L209 485 Z" fill="'+P.rim+'" opacity=".35"/>';}
    else{s+='<path d="M200 490 L250 486 L252 492 L202 496 Z" fill="#4A3A2A"/><rect x="214" y="472" width="22" height="16" rx="2" fill="#5A4A3A"/>';}
    return s;
  }
  /* ---------------- 户外：冻土荒原（1978 现场勘查） ---------------- */
  function tundra(){
    let s='<defs><linearGradient id="skyT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2A52"/><stop offset=".45" stop-color="#3D4F86"/><stop offset=".72" stop-color="#C46A5A"/><stop offset=".86" stop-color="#F2A65A"/></linearGradient>'+
      '<linearGradient id="snowT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3E6F2"/><stop offset="1" stop-color="#9CA6C2"/></linearGradient>'+
      '<radialGradient id="emberT"><stop offset="0" stop-color="#FF9A52" stop-opacity=".6"/><stop offset="1" stop-color="#FF6A3A" stop-opacity="0"/></radialGradient>'+
      '<linearGradient id="auroraT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DE0C4" stop-opacity="0"/><stop offset=".6" stop-color="#7DE0C4" stop-opacity=".28"/><stop offset="1" stop-color="#7DE0C4" stop-opacity="0"/></linearGradient></defs>';
    s+='<rect width="1200" height="600" fill="url(#skyT)"/>'+stars(77,110,0,0,1200,200,1.1);
    s+='<path class="aurora" d="M0 110 C200 50 380 140 600 80 C820 20 1000 110 1200 60 L1200 190 C1000 230 820 150 600 210 C380 270 200 180 0 240 Z" fill="url(#auroraT)"/>';
    s+='<circle cx="840" cy="318" r="70" fill="#FFD38A"/><circle cx="840" cy="318" r="140" fill="#FFD38A" opacity=".18"/>';
    s+='<path d="M0 300 L120 250 L210 280 L330 230 L430 270 L540 236 L640 268 L760 228 L880 262 L1000 238 L1100 268 L1200 246 L1200 400 L0 400 Z" fill="#7A6A9A"/>';
    s+='<path d="M0 330 L150 296 L280 318 L420 286 L560 314 L700 290 L860 316 L1000 292 L1200 312 L1200 420 L0 420 Z" fill="#5A4E7E"/>';
    s+='<path d="M0 360 L180 334 L360 352 L520 330 L700 350 L880 332 L1060 350 L1200 338 L1200 430 L0 430 Z" fill="#3E3762"/>';
    s+='<path d="M0 372 C300 358 900 358 1200 370 L1200 600 L0 600 Z" fill="url(#snowT)"/>';
    s+='<path d="M0 420 C200 404 360 414 520 406 M680 404 C840 410 1000 398 1200 410 M0 500 C260 486 420 496 560 490 M720 492 C900 498 1060 484 1200 494" stroke="#B9C1D8" stroke-width="2.4" fill="none" opacity=".7"/>';
    s+='<path d="M300 382 C400 394 480 410 560 430" stroke="#5A607A" stroke-width="12" fill="none" stroke-linecap="round" opacity=".55"/>';
    s+='<ellipse cx="604" cy="452" rx="150" ry="38" fill="#4A4E66"/><ellipse cx="604" cy="448" rx="116" ry="27" fill="#2C2F42"/><ellipse cx="604" cy="446" rx="150" ry="70" fill="url(#emberT)"/>';
    s+='<g transform="translate(590 440) rotate(-14)"><rect x="-34" y="-12" width="60" height="24" rx="10" fill="#6A707C"/><rect x="-34" y="-12" width="60" height="8" rx="4" fill="#8A909C"/><g transform="translate(-6 1)"><circle r="6.4" fill="#F6C35B"/><circle r="1.4" fill="#141824"/><path d="M0 -1.8 L-3 -5.6 A6 6 0 0 1 3 -5.6 Z M1.6 .9 L5.6 2.4 A6 6 0 0 1 2.6 5.6 Z M-1.6 .9 L-2.6 5.6 A6 6 0 0 1 -5.6 2.4 Z" fill="#141824"/></g></g>';
    s+='<path d="M520 444 L556 430 L566 446 L528 458 Z" fill="#2D5FA8"/><path d="M640 440 L676 452 L670 462 L636 450 Z" fill="#6A707C"/>';
    s+='<g class="smoke"><ellipse cx="610" cy="420" rx="30" ry="10" fill="#D9DEEA" opacity=".25"/><ellipse cx="630" cy="400" rx="22" ry="8" fill="#D9DEEA" opacity=".18"/></g>';
    s+='<g transform="translate(684 474) rotate(8)"><rect x="-12" y="-8" width="24" height="16" rx="2" fill="#E8772E"/><circle cx="7" cy="3" r="1.4" fill="#FFF3C0" class="blink"/></g>';
    [[492,468],[508,478],[478,482]].forEach(function(p){s+='<path d="M'+p[0]+' '+p[1]+' L'+p[0]+' '+(p[1]-22)+'" stroke="#2A2A2A" stroke-width="1.4"/><path d="M'+p[0]+' '+(p[1]-22)+' L'+(p[0]+11)+' '+(p[1]-18)+' L'+p[0]+' '+(p[1]-14)+' Z" fill="#E8772E"/>';});
    for(let i=0;i<7;i++){const x=430+i*58,y=414+(i%2?6:0);s+='<path d="M'+x+' '+(y+30)+' L'+x+' '+y+'" stroke="#2A2A30" stroke-width="2"/><circle cx="'+x+'" cy="'+(y-2)+'" r="2.2" fill="#FF4A3A" class="blink" style="animation-delay:'+(i*.27).toFixed(2)+'s"/>';}
    s+='<path d="M430 420 L488 426 L546 418 L604 426 L662 418 L720 426 L778 420" stroke="#F6C35B" stroke-width="1.4" fill="none" stroke-dasharray="6 4"/>';
    s+='<g transform="translate(742 400)"><path d="M0 0 L0 -96" stroke="#2A2D33" stroke-width="2.6"/><g class="spin" style="transform-origin:0px -104px"><path d="M-10 -104 L10 -104 M0 -114 L0 -94" stroke="#3A3E46" stroke-width="1.6"/></g></g>';
    s+='<g transform="translate(452 366)"><path d="M-24 10 L0 -16 L24 10 Z" fill="#B8503A"/><path d="M-3 10 L0 -2 L3 10 Z" fill="#FFCF7A"/><ellipse cx="0" cy="4" rx="22" ry="12" fill="#FFCF7A" opacity=".18"/></g>';
    s+='<g transform="translate(266 436)"><rect x="-44" y="-22" width="64" height="24" rx="5" fill="#2F6B8F"/><path d="M-30 -22 L-24 -36 L4 -36 L12 -22 Z" fill="#245676"/><path d="M-22 -33 L0 -33 L6 -24 L-26 -24 Z" fill="#A4CCF2" opacity=".5"/><circle cx="-28" cy="4" r="8" fill="#1A1D24"/><circle cx="8" cy="4" r="8" fill="#1A1D24"/><rect x="18" y="-16" width="6" height="5" fill="#FFF4D6"/></g>';
    s+='<path d="M300 432 L560 404 L560 470 L300 452 Z" fill="#FFF4D6" opacity=".12"/>';
    return s;
  }
  /* ---------------- 户外：月球南极现场（2052 现场勘验） ---------------- */
  function moonsite(){
    let s='<rect width="1200" height="600" fill="#020308"/>'+stars(91,160,0,0,1200,300,1.2);
    s+='<circle cx="980" cy="150" r="46" fill="url(#earthDayG)"/><path d="M934 150 A46 46 0 0 0 1026 150 Z" fill="#020308" opacity=".5"/>';
    s+='<path d="M0 320 L140 290 L260 312 L400 270 L520 300 L640 262 L780 296 L920 270 L1060 300 L1200 280 L1200 420 L0 420 Z" fill="#6E6C66"/>';
    s+='<path d="M0 360 L200 340 L380 358 L560 330 L760 352 L960 334 L1200 352 L1200 460 L0 460 Z" fill="#A9A69E"/>';
    s+='<path d="M0 400 C300 386 900 386 1200 398 L1200 600 L0 600 Z" fill="#D9D6CD"/>';
    s+='<path d="M640 262 L780 296 L1200 470 L1200 600 L900 600 Z" fill="#1C1C20" opacity=".7"/>';
    s+='<ellipse cx="300" cy="500" rx="120" ry="26" fill="#B9B6AD"/><ellipse cx="300" cy="496" rx="96" ry="18" fill="#8E8B83"/>';
    /* 南极光的开采站 */
    s+='<g transform="translate(560 420)"><rect x="-80" y="-60" width="160" height="60" rx="8" fill="#E9ECF0"/><rect x="-80" y="-60" width="160" height="14" fill="#E8772E"/><path d="M-60 0 L-60 30 M60 0 L60 30" stroke="#5A6474" stroke-width="4"/>'+
      '<rect x="-100" y="-110" width="10" height="60" fill="#9AA3B2"/><path d="M-95 -110 L-40 -140 L20 -120" stroke="#9AA3B2" stroke-width="6" fill="none"/><circle cx="20" cy="-120" r="6" fill="#E8772E"/></g>';
    s+='<g opacity=".6"><ellipse cx="660" cy="470" rx="140" ry="30" fill="#CFCAC0" class="smoke"/></g>';
    /* 共同体的月震仪 */
    [[860,500],[960,470],[1060,520]].forEach(function(p){s+='<g transform="translate('+p[0]+' '+p[1]+')"><path d="M-10 0 L10 0 L6 -14 L-6 -14 Z" fill="#B9A6E8"/><path d="M0 -14 L0 -30" stroke="#ccc" stroke-width="1.4"/><circle cx="0" cy="-30" r="2" fill="#5FA9FF" class="blink"/></g>';});
    /* 安全区边界的信标 */
    for(let i=0;i<6;i++){const x=380+i*90;s+='<g transform="translate('+x+' '+(540-i*4)+')"><path d="M0 0 L0 -26" stroke="#555" stroke-width="2"/><circle cx="0" cy="-28" r="3" fill="#E8772E" class="blink" style="animation-delay:'+(i*.2)+'s"/></g>';}
    /* 着陆器遗址 */
    s+='<g transform="translate(220 470)"><path d="M-24 0 L-14 -18 L14 -18 L24 0" stroke="#C9962E" stroke-width="3" fill="none"/><rect x="-14" y="-34" width="28" height="18" fill="#D8B23C"/><path d="M-14 -34 L14 -34" stroke="#fff" stroke-width="1"/></g>';
    return s;
  }
  /* ---------------- 户外：高原射电站（2077 信号） ---------------- */
  function observatory(){
    let s='<rect width="1200" height="600" fill="#04050C"/>';
    s+='<ellipse cx="300" cy="140" rx="300" ry="160" fill="url(#nebV)"/><ellipse cx="900" cy="220" rx="260" ry="140" fill="url(#nebT)"/>';
    s+=milkyWay(55,0,60,1200,300,-30)+stars(66,200,0,0,1200,380,1.3);
    s+='<path d="M0 420 L160 380 L300 402 L460 360 L600 390 L760 350 L920 384 L1060 360 L1200 380 L1200 600 L0 600 Z" fill="#1A1424"/>';
    s+='<path d="M0 470 C300 452 900 452 1200 466 L1200 600 L0 600 Z" fill="#2A1E2A"/>';
    [[260,470,1],[520,452,1.25],[820,462,1.1],[1040,476,.9]].forEach(function(p){
      s+='<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')"><path d="M-6 0 L-14 40 L14 40 L6 0 Z" fill="#3A3048"/><path d="M-50 -30 Q0 30 50 -30 Z" fill="#D9D6E8"/><path d="M-50 -30 Q0 30 50 -30" stroke="#8A84A8" stroke-width="1.2" fill="none"/><path d="M0 0 L0 -40" stroke="#8A84A8" stroke-width="2"/><circle cx="0" cy="-42" r="3" fill="#5FD3E6" class="twinkle"/></g>';});
    s+='<g transform="translate(600 120)"><circle r="2.4" fill="#FFE2B0"/><circle r="12" fill="#FFB45E" opacity=".3" class="twinkle"/></g>';
    return s;
  }
  /* ---------------- 重演室 ---------------- */
  function archive(){
    let s='<rect width="1200" height="600" fill="#05070F"/><ellipse cx="600" cy="330" rx="520" ry="250" fill="url(#nebV)" opacity=".5"/>';
    for(let row=0;row<5;row++)for(let i=0;i<14;i++){const x=40+i*84,y=60+row*70;if(x>380&&x<820&&row<4)continue;
      s+='<rect x="'+x+'" y="'+y+'" width="70" height="52" rx="4" fill="#121A30" stroke="#2A3A66" stroke-width="1"/><rect x="'+(x+26)+'" y="'+(y+22)+'" width="18" height="4" rx="2" fill="#5FA9FF" opacity="'+(.3+((i+row)%3)*.2)+'"/>';}
    s+='<ellipse cx="600" cy="470" rx="300" ry="54" fill="none" stroke="#5FA9FF" stroke-width="2" opacity=".6"/><ellipse cx="600" cy="470" rx="250" ry="42" fill="none" stroke="#D8A84E" stroke-width="1.4" opacity=".5"/>';
    s+='<path d="M600 470 L600 120" stroke="#5FA9FF" stroke-width="1" opacity=".3"/>';
    ['1978','2009','2031','2043','2052','2077'].forEach(function(y,i){const a=-2.6+i*.42,x=600+Math.cos(a)*230,yy=250+Math.sin(a)*120;
      s+='<g transform="translate('+x.toFixed(0)+' '+yy.toFixed(0)+')"><rect x="-34" y="-14" width="68" height="28" rx="14" fill="#0E1730" stroke="#5FA9FF" stroke-width="1" opacity=".9"/><text y="5" text-anchor="middle" font-family="monospace" font-size="13" fill="#BFDBFF">'+y+'</text></g>';});
    s+='<circle cx="600" cy="300" r="60" fill="none" stroke="#D8A84E" stroke-width="1.4" opacity=".6" class="spin" style="transform-origin:600px 300px"/>';
    return s;
  }
  function register(){
    const host=byId('artDefs');if(!host)return;
    function add(id,inner){const old=byId(id);if(old)old.remove();const sym=document.createElementNS('http://www.w3.org/2000/svg','symbol');sym.setAttribute('id',id);sym.setAttribute('viewBox','0 0 1200 600');sym.setAttribute('preserveAspectRatio','xMidYMid slice');sym.innerHTML=inner;host.appendChild(sym);}
    const D=defs();
    Object.keys(PAL).forEach(function(k){const P=PAL[k];add('sc-'+k,D+chamber(P));add('fg-bench-'+k,D+benchFront(P));add('fg-desks-'+k,D+desks(P));});
    add('sc-tundra',D+tundra());add('sc-moonsite',D+moonsite());add('sc-observatory',D+observatory());add('sc-archive',D+archive());
  }
  return {register:register,isChamber:function(n){return !!PAL[n];},rim:function(n){return PAL[n]?PAL[n].rim:'#9EC2FF';}};
})();
