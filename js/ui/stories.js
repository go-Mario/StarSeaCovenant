"use strict";
const Stories=(function(){
  let role=null,opened=false,documentId=null,feedback='',returnFocus=null;
  const D=NIGHT_SHIFT;
  const L=function(pair){return I18N.t(pair[0],pair[1]);};
  const E=function(pair){return esc(L(pair));};
  function world(){
    if(!S.stories)S.stories={};
    if(!S.stories[D.id])S.stories[D.id]={routes:{},shared:[],log:[]};
    return S.stories[D.id];
  }
  function route(id){
    const w=world(),r=D.roles[id];
    if(!w.routes[id])w.routes[id]={phase:0,seen:[],sequence:[],choice:null,energy:r.energy,ot:r.ot,minutes:0,solved:false,received:[]};
    return w.routes[id];
  }
  function announce(zh,en){feedback=I18N.t(zh,en);const out=byId('nsStatus');if(out)out.textContent=feedback;}
  function top(){return '<div class="ns-top"><button id="nsBack">← '+I18N.t(role?'人物与事件':'返回星图',role?'People & event':'Back to star map')+'</button>'+I18N.selector('storyLanguage')+'</div>';}
  function stationMap(){return '<svg class="ns-map" viewBox="0 0 1000 180" role="img" aria-label="'+I18N.t('同一座空间站的三个工作地点','Three workplaces on one station')+'">'+
    '<g fill="none" stroke="#3c5b69"><path d="M100 90H900M270 40V140M500 25V155M730 40V140"/><ellipse cx="500" cy="90" rx="425" ry="65"/><ellipse cx="500" cy="90" rx="450" ry="80" stroke-dasharray="3 8"/></g>'+
    '<g fill="#b6d3d5"><circle cx="270" cy="90" r="8"/><circle cx="500" cy="90" r="8"/><circle cx="730" cy="90" r="8"/></g>'+
    '<g fill="#a2bdc6" font-size="16" text-anchor="middle"><text x="270" y="124">'+I18N.t('中继机房','Relay')+'</text><text x="500" y="57">'+I18N.t('观测资料室','Archive')+'</text><text x="730" y="124">'+I18N.t('听证准备室','Hearing room')+'</text></g></svg>';}
  function portrait(r){
    if(r.portrait)return portraitSVG(r.portrait);
    return '<svg viewBox="0 0 120 170" aria-hidden="true"><path fill="#315d65" d="M14 170v-36q3-32 46-32t46 32v36"/><rect x="51" y="89" width="18" height="26" rx="6" fill="#b78b6a"/><ellipse cx="60" cy="61" rx="27" ry="36" fill="#c79d78"/><path d="M32 55q-2-37 29-37 30 0 28 40l-8-15-46 3z" fill="#202728"/><path d="M43 62h9m17 0h9M53 83q7 4 14 0" stroke="#4d3f35" stroke-width="2" fill="none"/><path d="M29 131h16v10H29m46-10h16v10H75" fill="#d3a45b"/><path d="M60 116v54" stroke="#1a3d49" stroke-width="3"/></svg>';
  }
  function lobby(){
    const w=world();
    let h=top()+'<div class="ns-eyebrow">2077 · '+I18N.t('星海仲裁院 · 共同事件 01','STELLAR ARBITRATION COURT · SHARED EVENT 01')+'</div>'+
      '<h1 class="ns-title" tabindex="-1">'+E(D.title)+'</h1><p class="ns-lead">'+E(D.premise)+'</p>'+stationMap()+'<div class="ns-roles">';
    Object.keys(D.roles).forEach(function(id){const r=D.roles[id],s=w.routes[id];
      h+='<button class="ns-role" data-role="'+id+'"><span class="ns-pill">'+E(r.job)+'</span><div class="ns-role-art">'+portrait(r)+'</div><h2>'+E(r.name)+'</h2><p>'+E(r.goal)+'</p><span class="ns-enter">'+
        (s&&s.phase===3?I18N.t('查看这一天留下的记录','Revisit the day’s record'):s?I18N.t('继续这一段人生','Continue this life'):I18N.t('从这里开始 · 约 3–5 分钟','Begin here · about 3–5 minutes'))+' →</span></button>';
    });
    h+='</div><div class="ns-ledger"><h2>'+I18N.t('公共交接簿','Shared handover log')+'</h2>';
    if(w.log.length)h+='<ol>'+w.log.map(function(x){return '<li><b>'+E(D.roles[x.role].name)+'</b> · '+E(D.roles[x.role].choices.find(function(c){return c.id===x.choice;}).label)+'</li>';}).join('')+'</ol>';
    else h+='<p class="ns-footer">'+I18N.t('今晚还没有人交接。私人念头不会自动出现在这里，完成的人物行动才会留下公共记录。','No handovers yet tonight. Private thoughts do not appear here automatically. Completed actions leave the public record.')+'</p>';
    if(w.log.length===3)h+='<p class="ns-lead">'+I18N.t('你走过了三个普通人的晚上。世界没有因此变得简单，但每一份记录都有了一个人的重量。','You have lived through three ordinary evenings. The world is no simpler. But every record now carries the weight of a person.')+'</p>';
    h+='<button class="btn ghost sm" id="nsReset">'+I18N.t('重新开始这个事件','Start this event over')+'</button></div><p class="ns-footer">'+E(D.frame)+'<br>'+I18N.t('三条人物线全部提供中英文。每个人的精力与调休分别记录；原有六章、星图与小游戏仍可从星图进入。','All three stories are available in Chinese and English. Energy and time off belong to each individual. The original six cases, star map and mini-games remain available from the map.')+'</p>';
    return h;
  }
  function handover(){
    const w=world();
    if(!w.shared.length)return I18N.t('暂无公共交接。请用你目前能查到的材料判断。','No public handover yet. Work with the records currently available to you.');
    return w.shared.map(function(k){return L(D.facts[k]);}).join('\n\n');
  }
  function crossContext(id,facts){
    const has=function(k){return facts.includes(k);};
    if(id==='li')return has('logs')?
      I18N.t('林渡已把原始记录交进公共档案。你这次发布的材料可以附上原件索引，让别人沿着同一条记录复核。','Lin Du has deposited the originals. Your release can now include their archive references, so others can check the same record.'):
      I18N.t('公共档案还没有收到机房的原始记录。你会注明这一缺口，并随说明发出调阅请求；时标说明本身不能替代原件。','The relay originals have not reached the shared archive. Your release will identify that gap and request them; a timing note cannot replace the originals.');
    if(id==='chen')return has('openData')?
      I18N.t('李星澜已开放观测包。你把独立复算意见列入下一轮议程，并给补充材料留出提交时间。','Li Xinglan has opened the observation package. You add independent analyses to the next agenda and allow time for supplementary submissions.'):
      has('summary')?I18N.t('目前公开的只有方法摘要。你在议程里加入完整材料调阅安排，避免只有复核组能够检查关键数据。','Only the method summary is public. You add a process for access to the full materials so that scrutiny is not confined to the review team.'):
      I18N.t('科学组尚未提交公共说明。你把“技术材料待补”写在议程首页，不把尚未收到的论证当作既定结论。','No public scientific note has arrived. You mark the technical record as incomplete instead of treating an unseen argument as settled.');
    return has('notice')?I18N.t('听证已经延期。额外核对不再是今晚必须完成的事；若你留下，那是一次自愿的补充检查。','The hearing has been postponed. An additional check is no longer required tonight; staying would be a voluntary further check.'):
      has('hearing')?I18N.t('听证范围已经缩小。交接表会直接送入技术材料核对环节，你无需为是否发信作出判断。','The hearing’s scope is now limited. Your handover goes to the technical review; deciding whether to transmit is not your responsibility.'):
      I18N.t('听证安排尚未确认。你的记录将先交给接班员与资料室；检查完成，不等于你要替所有人决定是否回信。','The hearing arrangements are still open. Your record goes first to the relief technician and archive. Completing a check does not make the decision to reply yours.');
  }
  function aside(r,s){return '<aside class="ns-aside"><h3>'+E(r.name)+' · '+E(r.job)+'</h3><p>'+E(r.personal)+'</p><div class="ns-meter"><span>'+I18N.t('精力','Energy')+'</span><b>'+s.energy+' / 100</b></div><div class="ns-meter"><span>'+I18N.t('本人物调休','Personal time off in lieu')+'</span><b>'+(s.ot/60).toFixed(1)+' '+I18N.t('小时','h')+'</b></div><div class="ns-meter"><span>'+I18N.t('已查看的材料','Records read')+'</span><b>'+s.seen.length+' / '+r.docs.length+'</b></div><h3 style="margin-top:24px">'+I18N.t('收到的公共交接','Public handovers received')+'</h3><p style="white-space:pre-line">'+esc(handover())+'</p></aside>';}
  function glossary(){return '<div class="ns-glossary">'+D.glossary.map(function(g){return '<details><summary>'+E(g.term)+'</summary><p class="ns-note">'+E(g.plain)+'</p></details>';}).join('')+'</div>';}
  function scene(){
    const r=D.roles[role],s=route(role),t=r.task;
    let h=top()+'<div class="ns-eyebrow">2077 · '+I18N.t('当晚 · 交接进行中','THAT EVENING · HANDOVERS IN PROGRESS')+' · '+E(r.room)+'</div><h1 class="ns-title" tabindex="-1">'+E(r.name)+'</h1><div class="ns-grid"><section class="ns-paper">';
    if(s.phase===0){
      h+='<div class="ns-eyebrow">01 / 03 · '+I18N.t('只从这里能看见的事','WHAT YOU CAN SEE FROM HERE')+'</div><h2>'+E(r.goal)+'</h2><p>'+E(r.opening)+'</p><blockquote>'+E(r.quote)+'</blockquote>'+
        '<label for="nsSearch" class="ns-note">'+I18N.t('查阅本站资料（中文或英文关键词）','Search station records (Chinese or English keywords)')+'</label><input id="nsSearch" class="ns-search" type="search" placeholder="'+I18N.t('试试：记录、时标、clock…','Try: record, clock, mandate…')+'" autocomplete="off"><div class="ns-docs" id="nsDocs">';
      r.docs.forEach(function(d){h+='<button class="ns-doc'+(s.seen.includes(d.id)?' is-read':'')+'" data-doc="'+d.id+'"><b>'+E(d.title)+'</b><span>'+E(d.tag)+(s.seen.includes(d.id)?' · '+I18N.t('已读','Read'):'')+'</span></button>';});
      h+='</div><div id="nsDocument" class="ns-document"'+(documentId?'':' hidden')+'>'+esc(documentId?L(r.docs.find(function(d){return d.id===documentId;}).body):'')+'</div><p id="nsSearchEmpty" class="ns-note" hidden>'+I18N.t('没有匹配的资料。换一个关键词，或清空搜索查看全部。','No matching records. Try another keyword, or clear the search to see everything.')+'</p><button class="btn" id="nsProceed"'+(s.seen.length<2?' disabled':'')+'>'+I18N.t('整理发现，继续','Review your findings')+'</button><p class="ns-note">'+I18N.t('至少读两份材料再继续；没有倒计时。','Read at least two records to continue. There is no timer.')+'</p>';
    }else if(s.phase===1){
      h+='<div class="ns-eyebrow">02 / 03 · '+I18N.t('把线索变成判断','FROM CLUES TO JUDGMENT')+'</div><h2>'+E(t.title)+'</h2><p>'+E(t.prompt)+'</p>';
      if(s.solved)h+='<p>'+E(t.success)+'</p><button class="btn" id="nsProceed">'+I18N.t('继续','Continue')+'</button>';
      else{
        if(t.kind==='sequence')h+='<p class="ns-note">'+I18N.t('已排步骤：','Steps so far: ')+s.sequence.map(function(i){return L(t.items[i]);}).join(' → ')+'</p>';
        h+='<div class="ns-choices">'+t.items.map(function(item,i){return '<button class="ns-choice" data-answer="'+i+'"'+(s.sequence.includes(i)?' disabled':'')+'><b>'+E(item)+'</b></button>';}).join('')+'</div>';
        if(t.kind==='sequence')h+='<button class="btn ghost sm" id="nsRetry">'+I18N.t('重新排列','Start the sequence again')+'</button>';
      }
      h+='<button class="btn ghost sm" id="nsReview">'+I18N.t('回看材料','Review the records')+'</button>';
    }else if(s.phase===2){
      h+='<div class="ns-eyebrow">03 / 03 · '+I18N.t('工作以外，还有生活','A LIFE BEYOND THE TASK')+'</div><h2>'+E(r.decision)+'</h2><p>'+E(r.personal)+'</p><div class="ns-document" id="nsCross">'+esc(crossContext(role,world().shared))+'</div><div class="ns-choices">'+r.choices.map(function(c){return '<button class="ns-choice" data-choice="'+c.id+'"><b>'+E(c.label)+'</b><span>'+E(c.cost)+'</span></button>';}).join('')+'</div><p class="ns-note">'+I18N.t('这一页没有标准答案。完成后将保留你选择的行动，供其他人物接续。','There is no single correct answer here. Your completed action becomes part of the event that other characters encounter.')+'</p>';
    }else{
      const c=r.choices.find(function(x){return x.id===s.choice;});
      h+='<div class="ns-eyebrow">'+I18N.t('人物线 · 暂告一段落','A LIFE · FOR TONIGHT')+'</div><h2>'+E(c.label)+'</h2><p>'+E(c.result)+'</p><div class="ns-document" id="nsCross">'+esc(crossContext(role,s.received||[]))+'</div><h3>'+I18N.t('你留给其他人的记录','What you leave for others')+'</h3><ul class="ns-note">'+c.facts.map(function(k){return '<li>'+E(D.facts[k])+'</li>';}).join('')+'</ul><button class="btn" id="nsOthers">'+I18N.t('去看另一个人的这一天','Live this day through someone else')+'</button><p class="ns-note">'+I18N.t('这次行动已经记入交接簿。重看不会重复增加精力或调休。','This action is recorded. Revisiting it does not add more energy or time off.')+'</p>';
    }
    h+='<div class="ns-status" id="nsStatus" role="status" aria-live="polite">'+esc(feedback)+'</div>'+glossary()+'</section>'+aside(r,s)+'</div>';
    return h;
  }
  function render(focus){
    const host=byId('stories'),scroll=host.scrollTop;
    host.innerHTML='<div class="ns-wrap">'+(role?scene():lobby())+'</div>';
    host.querySelectorAll('.language-select').forEach(function(el){el.value=I18N.language;});
    byId('nsBack').onclick=back;
    host.querySelectorAll('[data-role]').forEach(function(b){b.onclick=function(){chooseRole(b.dataset.role);};});
    const reset=byId('nsReset');if(reset)reset.onclick=function(){if(confirm(I18N.t('只清除“回信前夜”的三条人物记录，原有六章和其他玩法不受影响。继续？','Reset only the three Night Shift stories? Original cases and other activities are unaffected.'))){delete S.stories[D.id];save();render(true);}};
    host.querySelectorAll('[data-doc]').forEach(function(b){b.onclick=function(){readDoc(b.dataset.doc);};});
    const search=byId('nsSearch');if(search)search.oninput=function(){
      const q=this.value.trim().toLowerCase();let hits=0;
      host.querySelectorAll('[data-doc]').forEach(function(b){const d=D.roles[role].docs.find(function(d){return d.id===b.dataset.doc;});b.hidden=!(d.title.concat(d.body,d.tag).join(' ').toLowerCase().includes(q));if(!b.hidden)hits++;});
      byId('nsSearchEmpty').hidden=hits>0;
    };
    const proceed=byId('nsProceed');if(proceed)proceed.onclick=advance;
    const review=byId('nsReview');if(review)review.onclick=function(){route(role).phase=0;documentId=null;feedback='';save();render(true);};
    const retry=byId('nsRetry');if(retry)retry.onclick=function(){route(role).sequence=[];feedback='';save();render();};
    host.querySelectorAll('[data-answer]').forEach(function(b){b.onclick=function(){answer(+b.dataset.answer);};});
    host.querySelectorAll('[data-choice]').forEach(function(b){b.onclick=function(){complete(b.dataset.choice);};});
    const others=byId('nsOthers');if(others)others.onclick=back;
    host.scrollTop=focus?0:scroll;
    if(focus){const title=host.querySelector('h1');if(title)title.focus({preventScroll:true});}
  }
  function chooseRole(id){if(!D.roles[id])return;role=id;route(id);documentId=null;feedback='';save();render(true);}
  function readDoc(id){
    if(!role)return;const s=route(role);if(s.phase!==0||!D.roles[role].docs.some(function(d){return d.id===id;}))return;
    documentId=id;
    if(!s.seen.includes(id)){s.seen.push(id);s.minutes+=5;save();}
    const q=byId('nsSearch').value;render();byId('nsSearch').value=q;byId('nsSearch').dispatchEvent(new Event('input'));
    byId('nsDocument').scrollIntoView({block:'nearest'});
  }
  function advance(){const s=route(role);if(s.phase===0&&s.seen.length>=2)s.phase=1;else if(s.phase===1&&s.solved)s.phase=2;else return;feedback='';save();render(true);}
  function answer(i){
    const s=route(role),task=D.roles[role].task;if(s.phase!==1||s.solved||i<0||i>=task.items.length)return;
    if(task.kind==='sequence'){
      if(s.sequence.includes(i))return;
      if(task.answer[s.sequence.length]!==i){announce('再看看交班便签：要先防止覆盖，再留下原件，最后核对。','Check the handover note: prevent overwriting, preserve the originals, then verify.');return;}
      s.sequence.push(i);s.solved=s.sequence.length===task.answer.length;
    }else if(i===task.answer)s.solved=true;
    else{announce('这句话跨过了材料能支持的边界。可以回看材料，再试一次。','That conclusion goes beyond the evidence. Review the records and try again.');return;}
    feedback='';save();render();
  }
  function complete(id){
    const s=route(role),r=D.roles[role],c=r.choices.find(function(c){return c.id===id;});
    if(!c||s.phase!==2||!s.solved||s.choice!==null)return false;
    s.received=world().shared.slice();s.choice=id;s.phase=3;s.energy=clamp(s.energy+c.energy,0,100);s.ot+=c.ot;
    const w=world();c.facts.forEach(function(k){if(!w.shared.includes(k))w.shared.push(k);});w.log.push({role:role,choice:id});
    save();render(true);return true;
  }
  function open(){
    if(opened)return;returnFocus=document.activeElement;opened=true;role=null;feedback='';world();
    HUD.hideHub();byId('stories').classList.add('on');render(true);MUSIC.setMode('intro');
  }
  function close(){opened=false;byId('stories').classList.remove('on');HUD.showHub();MUSIC.setMode(Hub.musicHere());if(returnFocus&&returnFocus.isConnected)returnFocus.focus();}
  function back(){if(role){role=null;documentId=null;feedback='';render(true);}else close();}
  document.addEventListener('languagechange',function(){if(opened){feedback='';render();}});
  return {open,close,back,isOpen:function(){return opened;},chooseRole,readDoc,advance,answer,complete};
})();
