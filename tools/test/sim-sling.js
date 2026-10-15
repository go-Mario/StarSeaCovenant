// 离线验证引力弹弓各关是否可解：扫描发射角与力度
const src=require('fs').readFileSync(require('path').resolve(__dirname,'../../js/games')+'/sling.js','utf8');
const LV=eval('('+src.match(/const LV=(\[[\s\S]*?\]);\n/)[1]+')');
LV.forEach((L,i)=>{
  let ok=0,tot=0,sols=[];
  for(let ang=0;ang<360;ang+=1)for(let pw=20;pw<=160;pw+=5){
    tot++;const p={x:L.start[0],y:L.start[1]},v={x:Math.cos(ang*Math.PI/180)*pw*2.6,y:Math.sin(ang*Math.PI/180)*pw*2.6};
    let t=0,res='';
    while(!res){const dt=1/60;
      for(let s=0;s<4;s++){let ax=0,ay=0;L.pl.forEach(pl=>{const dx=pl.x-p.x,dy=pl.y-p.y,d2=dx*dx+dy*dy+400,d=Math.sqrt(d2),f=pl.m*42000/d2;ax+=f*dx/d;ay+=f*dy/d;});v.x+=ax*dt/4;v.y+=ay*dt/4;p.x+=v.x*dt/4;p.y+=v.y*dt/4;}
      t+=dt;const tg=L.target;
      if(Math.hypot(p.x-tg[0],p.y-tg[1])<tg[2])res='win';
      else if(L.pl.some(pl=>Math.hypot(p.x-pl.x,p.y-pl.y)<pl.r)||(L.wall||[]).some(w=>p.x>w[0]&&p.x<w[0]+w[2]&&p.y>w[1]&&p.y<w[1]+w[3]))res='crash';
      else if(p.x<-60||p.x>1060||p.y<-60||p.y>680||t>14)res='lost';
    }
    if(res==='win'){ok++;sols.push(ang+'°/'+pw);}
  }
  console.log(i,L.name,'solutions',ok+'/'+tot,(ok/tot*100).toFixed(2)+'%',sols.filter((_,k)=>k%Math.max(1,Math.floor(sols.length/8))===0).join(' '));
});
