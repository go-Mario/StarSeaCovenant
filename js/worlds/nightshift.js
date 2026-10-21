"use strict";
/* Original shared-event fiction. Every narrative field has reviewed Chinese and English copy. */
const NIGHT_SHIFT={
  id:'nightshift',year:2077,
  title:['回信前夜','The Night Before We Answer'],
  subtitle:['同一座空间站，三个人尚未结束的一天。','One station. Three lives. A day that is not quite over.'],
  premise:['来自天鹅座的信号已经进入公共记录。今晚，仲裁院准备讨论人类是否应当回信。19:40，中继站的一份接收记录出现了两个时间。没有爆炸，警报也没有响。只有三个人的下班时间，被同一个问题悄悄推迟。','The signal from Cygnus is already on the public record. Tonight, the Court will discuss whether humanity should answer. At 19:40, a relay log arrives with two different timestamps. There is no explosion. No alarm. Just three people whose working day is quietly extended by the same unanswered question.'],
  frame:['这是第六章之前的一则原创共同事件。以下“站务规程”为虚构制度；人物线的选择不改写原有六章的结局。','An original shared event set before Chapter Six. The station procedures below are fictional. Choices in these stories do not rewrite the endings of the six original case files.'],
  roles:{
    lin:{name:['林渡','Lin Du'],job:['夜班维修员','Night-shift technician'],portrait:null,color:'#72b4b0',room:['中继机房','Relay room'],
      goal:['把记录原样交出去，也把今晚的自己交还给生活。','Hand over a trustworthy record—and keep a little of the evening for yourself.'],
      personal:['妹妹的毕业直播在二十分钟后开始。她说“不来也没关系”，你听出了那句没说出口的话。','Your sister’s graduation stream begins in twenty minutes. She said it was fine if you missed it. You heard the part she left unsaid.'],
      opening:['你在检修口旁跪了太久，膝盖已经麻了。屏幕上，两份完全相同的接收记录相差 84 秒。白班同事留下半杯冷茶和一句“应该只是时钟”。你知道，“应该”从来不是能签进交班表的词。','You have been kneeling beside the access hatch long enough to lose feeling in your knees. Two otherwise identical reception logs disagree by 84 seconds. The day shift left half a cup of cold tea and a note: “Probably just the clock.” You know that “probably” is not something you can sign off on a handover.'],
      quote:['“天上的星星不会等我下班。家里的人会。”','“The stars won’t wait for my shift to end. Someone back home will.”'],
      energy:54,ot:450,
      docs:[
        {id:'raw',title:['原始接收记录','Original reception log'],tag:['系统记录 · 19:40','System record · 19:40'],body:['主接收器时标：19:40:12。\n中继缓存时标：19:41:36。\n数据包内容与校验值一致。\n备注：尚未执行任何覆盖写入。','Primary receiver: 19:40:12.\nRelay cache: 19:41:36.\nPacket contents and checksums match.\nNote: no records have been overwritten.']},
        {id:'repair',title:['被夹在工单里的便签','A note tucked inside the work order'],tag:['白班交接 · 未签字','Day-shift handover · unsigned'],body:['“下午换过备用时钟。没有动接收器。别直接同步缓存，旧时标会被覆盖。先隔离自动同步，再封存原始记录，最后核对独立时钟。”\n最后一行字被茶渍晕开了。','“Changed the backup clock this afternoon. Receiver untouched. Don’t resync the cache: it will overwrite the old timestamps. Isolate automatic sync first. Preserve the original logs. Then check against an independent clock.”\nTea has blurred the final line.']},
        {id:'roster',title:['今晚的交班表','Tonight’s duty roster'],tag:['人事记录 · 个人可见','Staff record · private'],body:['值班延时 30 分钟可计入调休。你已有 7 小时 30 分钟。\n代班员乔安已通过机房操作考核，可在交接清单签字后接班。\n私人提醒：妹妹的毕业直播，20:00。','Thirty minutes of additional duty can be credited as time off in lieu. You already have seven hours and thirty minutes.\nRelief technician Jo An is qualified to take over after signing the handover checklist.\nPersonal reminder: your sister’s graduation, 20:00.']}
      ],
      task:{kind:'sequence',title:['先做哪一步？','What comes first?'],prompt:['让记录保持可复核，比尽快把两个时间改成一样更重要。按便签的顺序完成交接前检查。','A record that can be checked matters more than two clocks that merely agree. Follow the note’s sequence before handing over.'],items:[['核对独立时钟','Check the independent clock'],['隔离自动同步','Isolate automatic sync'],['封存原始记录','Preserve the original logs']],answer:[1,2,0],success:['两份原始记录已经封存。你找到了 84 秒的时钟偏移；信号内容没有因此被证明是假。','Both originals are preserved. You have identified an 84-second clock offset. That discrepancy does not, by itself, show that the signal is false.']},
      decision:['签字之后，你打算怎么过今晚？','Once you have signed, what will you do with the rest of the night?'],
      choices:[
        {id:'handover',label:['完整交接，去看毕业直播','Make a full handover. Watch the graduation.'],cost:['精力 +10 · 本次延时计入调休 30 分钟','Energy +10 · 30 minutes credited as time off in lieu'],energy:10,ot:30,facts:['logs','relief'],result:['乔安逐项复述检查单，在最后一格签下名字。你打开直播时，妹妹正走上讲台。她没有看向镜头，但你知道自己赶上了。明天，这份记录依然有人能够说明白。','Jo An reads the checklist back to you and signs the last box. When the stream opens, your sister is walking onto the stage. She does not look at the camera. You made it anyway. Tomorrow, someone will still be able to explain exactly what happened to this record.']},
        {id:'stay',label:['留下，再做一轮独立核对','Stay for another independent check.'],cost:['精力 −12 · 调休累计增加 60 分钟','Energy −12 · 60 minutes added to time off in lieu'],energy:-12,ot:60,facts:['logs','doublecheck'],result:['第二轮核对没有发现新的偏差。你在报告上补了一行，也错过了直播。妹妹发来一张模糊的合照：“给你留了录播。”你把它设成终端背景。可靠有时来自多做一步；那一步也确实占用了一个人的晚上。','The second check finds nothing new. You add a line to the report and miss the stream. Your sister sends a blurred group photo: “Saved the recording for you.” You make it your terminal background. Reliability sometimes comes from one more check. That check still takes someone’s evening.']}
      ]
    },
    li:{name:['李星澜','Li Xinglan'],job:['射电天文学家','Radio astronomer'],portrait:'li',color:'#85b4d5',room:['观测资料室','Observation archive'],
      goal:['说明自己知道什么，也承认自己还不知道什么。','Say what the evidence supports—and where it ends.'],
      personal:['你已经两夜没睡好。信号里那段重复的间隔，像父亲从前敲门时的节奏。你没有把这个念头写进报告。','You have barely slept for two nights. One repeated interval in the signal reminds you of the way your father used to knock. You have kept that thought out of the report.'],
      opening:['观测资料室很安静，只有冷却风扇在转。你收到一封询问：“两个时间不一样，是否意味着有人伪造了信号？”这句话已经比你的正式报告传得更远。你必须在听证开始前，把观察、推断和愿望重新分开。','The observation archive is quiet except for its cooling fans. A message arrives: “If the timestamps differ, does that mean someone fabricated the signal?” The question has travelled farther than your report. Before the hearing, you need to separate what you observed, what you inferred, and what you hoped.'],
      quote:['“宇宙没有义务说我们听得懂的话。”','“The universe owes us no words we can understand.”'],energy:46,ot:0,
      docs:[
        {id:'clock',title:['独立时标说明','Independent timing note'],tag:['技术附件 · 可检索','Technical attachment · searchable'],body:['备用时钟的偏移为 +84 秒。修正时标不需要改变数据包内容。\n该说明只解释两个记录时间不同的原因，不说明信号是谁发出的。','The backup clock is offset by +84 seconds. Correcting a timestamp does not require changing the packet contents.\nThis explains a discrepancy between recorded times. It does not establish who sent the signal.']},
        {id:'spectrum',title:['频谱比对摘要','Spectrum comparison'],tag:['观测结果 · 未作身份判断','Observation · no attribution'],body:['不同接收时段出现了相似的窄带结构。常见设备噪声模型尚不能完整解释。\n“尚不能解释”不是“已经证明来自某个文明”。\n附件中的身份栏仍为空白。','Similar narrow-band structures appear in separate reception windows. Common equipment-noise models do not yet explain them fully.\n“Not yet explained” does not mean “proven to come from a particular civilization.”\nThe attribution field remains blank.']},
        {id:'protocol',title:['对外发布草稿','Draft public statement'],tag:['待审文件 · 没有发送','Draft for review · not sent'],body:['方案一：仅发布已核对的时标说明、校验方法与不确定性。\n方案二：同时开放完整观测包供独立复核；需先去除人员信息，并说明材料不代表任何人的回应授权。\n两种方案都不能代替听证会决定是否发信。','Option one: publish the checked timing note, verification method and uncertainties.\nOption two: also release the full observation package for independent review, after removing staff information and making clear that the materials authorize no reply.\nNeither option decides whether a message should be sent.']}
      ],
      task:{kind:'inference',title:['报告里可以写下哪一句？','Which sentence belongs in the report?'],prompt:['在资料室内搜索“时标”或“clock”，读完再选择。','Search the archive for “clock” or “timestamp”, then choose.'],items:[['时间不同，已经证明信号是伪造的','The different timestamps prove fabrication.'],['时间偏移可以解释记录差异；信号来源仍待核实','Clock offset explains the discrepancy; the source remains unverified.'],['信号结构重复，所以我们有权代表所有人回信','The repeating pattern authorizes us to answer for everyone.']],answer:1,success:['你把“确信”改成了“现有材料支持”。句子短了一点，边界清楚了一点。','You replace “we are certain” with “the available evidence supports”. The sentence is less triumphant. It is also more precise.']},
      decision:['如何让研究接受别人检查？','How will you let others scrutinize the work?'],
      choices:[
        {id:'note',label:['先公开方法与不确定性说明','Publish the method and uncertainties first.'],cost:['精力 −4 · 原始观测包暂留复核组','Energy −4 · full package retained by the review team'],energy:-4,ot:0,facts:['timing','summary'],result:['你把说明写成了三段：观测到什么，能够推出什么，还缺什么。有人嫌它不够震撼，也有人第一次看懂了争议。完整材料仍由复核组保管，外界的复算需要等下一次开放。','You write three short paragraphs: what was observed, what follows, and what is missing. Some readers find it underwhelming. Others finally understand the dispute. The review team retains the full materials; wider replication will have to wait.']},
        {id:'open',label:['去除人员信息，开放观测包','Remove staff information and open the observation package.'],cost:['精力 −9 · 独立复核者可以重新计算','Energy −9 · independent reviewers can repeat the analysis'],energy:-9,ot:0,facts:['timing','openData'],result:['你删去人员信息，保留方法和原始测量。几分钟后，第一封纠错邮件进来了。你读完，松了一口气：有人认真检查了。公开没有替你赢得争论，却让争论有了共同的起点。','You remove staff information and retain the measurements and methods. The first correction arrives minutes later. You read it, then breathe out: someone has actually checked. Disclosure has not won the argument for you. It has given the argument a shared starting point.']}
      ]
    },
    chen:{name:['陈岚','Chen Lan'],job:['带教律师','Supervising counsel'],portrait:'chen',color:'#d5af77',room:['听证准备室','Hearing preparation room'],
      goal:['让每一个发言都站得住，也给沉默的人留一个位置。','Make room for a sound argument—and for the people not yet in the room.'],
      personal:['一张批准的调休单夹在你的笔记本里。你答应过自己，明天不带卷宗去海边。','An approved leave slip is tucked into your notebook. You promised yourself you would go to the coast tomorrow without a case file.'],
      opening:['你刚收好钢笔，书记员又送来一份议程。“听证可以提前吗？外面都在等。”三十年前，你也以为把事情做快一点就是负责。现在，你先数了数议程上那些没有名字的人。','You have just put away your pen when the clerk brings a revised agenda. “Can we bring the hearing forward? Everyone is waiting.” Thirty years ago, you also thought that moving faster was always the responsible thing. Now you count the people the agenda has not named.'],
      quote:['“一份写得漂亮的授权书，也可能少了一整个世界。”','“Even an elegant mandate can leave a whole world out.”'],energy:62,ot:480,
      docs:[
        {id:'agenda',title:['紧急听证议程','Urgent hearing agenda'],tag:['书记处文件 · 草案','Registry document · draft'],body:['拟讨论：是否发送确认收到信号的短消息。\n尚未列明：由谁代表哪些群体作出决定；异议如何记录；是否允许技术材料补正。\n秘书处备注：短消息也属于一项行动，不是“什么都没做”。','Proposed question: should a short acknowledgment of receipt be sent?\nNot yet specified: who represents which communities; how objections will be recorded; whether technical materials may be supplemented.\nRegistry note: even a short acknowledgment is an action, not the absence of one.']},
        {id:'mandate',title:['授权与缺席名单','Mandates and missing voices'],tag:['程序资料 · 未完成核对','Procedural record · checks incomplete'],body:['现有授权覆盖了参与机构，但不当然覆盖所有受影响的人。\n本轮尚未安排偏远接收站的翻译席位。\n一名值班员提交了请求：请把他转交的检查记录按原件保存，不要只留下律师写的摘要。','The mandates cover participating organizations, not automatically everyone affected.\nInterpreting seats for remote receiving stations have not yet been arranged.\nA technician has asked that his handed-over checks be preserved as originals, rather than surviving only in a lawyer’s summary.']},
        {id:'stationrule',title:['站务规程第 7 节（虚构）','Station Procedure §7 (fictional)'],tag:['本故事内规则 · 不是真实法条','Story rule · not a real legal provision'],body:['听证前可采取记录保全、补充通知与安排翻译等准备措施。\n采取准备措施，不等于已经决定谁有权代表全人类。\n争议事项应列出理由，并给受影响者一个回应机会。','Preparatory measures may include preserving records, sending further notice and arranging interpretation.\nTaking those steps does not decide who may speak for humanity.\nContested matters should be accompanied by reasons and an opportunity for affected people to respond.']}
      ],
      task:{kind:'inference',title:['先处理什么？','What should be addressed first?'],prompt:['依据本故事的站务规程，为听证选择一个起点。','Choose a starting point under this story’s station procedure.'],items:[['先保全记录、补充通知；代表资格仍需论证','Preserve the record and complete notice; authority to represent remains open.'],['谁先收到信号，谁就自动有权代表全人类','Whoever receives the signal first automatically speaks for humanity.'],['没有一致意见，所以连原始记录也不必保存','Without unanimity, there is no reason to keep the originals.']],answer:0,success:['你划掉了议程上的“当然”。准备程序可以先走，代表资格仍然是需要说明的问题。','You cross out “automatically”. Preparatory work can proceed. The claim to represent others still requires an explanation.']},
      decision:['明天的听证，留下什么边界？','What boundary will you set for tomorrow’s hearing?'],
      choices:[
        {id:'limited',label:['举行有限听证，暂不决定发信','Hold a limited hearing without deciding on transmission.'],cost:['精力 −6 · 先听技术与程序意见','Energy −6 · hear technical and procedural submissions first'],energy:-6,ot:0,facts:['hearing','noTransmission'],result:['议程缩短了，但没有一个问题被偷偷写成答案。听证将先核对技术材料和发言资格，是否发信另行讨论。你把卷宗留在桌上，拿走了调休单。程序也可以给人留出一个明天。','The agenda is shorter, but no question has quietly become an answer. The hearing will first examine the technical record and speaking authority; transmission remains for later consideration. You leave the files on the desk and take the leave slip. A procedure can leave people a tomorrow, too.']},
        {id:'postpone',label:['延期补齐翻译和通知','Postpone to complete interpretation and notice.'],cost:['精力 −3 · 更多人能进入下一轮讨论','Energy −3 · more people can participate in the next round'],energy:-3,ot:0,facts:['notice','noTransmission'],result:['有人说你让人类在宇宙面前显得犹豫。你给尚未收到邀请的接收站发去新议程。第二天，一个陌生口音在会议里说：“我们听到了。”你一时分不清，他说的是信号，还是这一次邀请。','Someone says you are making humanity look hesitant before the universe. You send the revised agenda to stations that had not been invited. The next day, an unfamiliar accent says, “We heard you.” For a moment, you cannot tell whether he means the signal or the invitation.']}
      ]
    }
  },
  facts:{
    logs:['两份原始接收记录已封存，可按交接清单查阅。','Both original reception logs are preserved and available through the handover record.'],
    relief:['合格代班员已签收记录；林渡按交接安排离岗。','A qualified relief technician has signed for the records; Lin Du has handed over.'],
    doublecheck:['维修组完成了额外一轮独立核对。','The maintenance team has completed an additional independent check.'],
    timing:['84 秒时标偏移已说明；发信者身份仍未确定。','The 84-second clock offset is explained; the sender’s identity remains unresolved.'],
    summary:['方法与不确定性说明已公开；完整包暂留复核组。','The method and uncertainties are public; the full package remains with the review team.'],
    openData:['去除人员信息的观测包已开放，支持独立复核。','The observation package is open for independent review, with staff information removed.'],
    hearing:['听证先讨论材料与程序，不预先决定发信。','The hearing will examine evidence and procedure without predetermining transmission.'],
    notice:['听证延期，补充通知与翻译席位。','The hearing is postponed to complete notice and arrange interpretation.'],
    noTransmission:['本轮尚未授权发送任何对外消息。','No external message has been authorized in this round.']
  },
  glossary:[
    {term:['证据保全','Evidence preservation'],plain:['先把原始记录可靠地留住，再谈它能证明什么。保存了一份材料，不等于认可了它的结论。','Keep the original record reliably before deciding what it proves. Preserving material does not endorse a conclusion drawn from it.']},
    {term:['时标与信号内容','Timestamp and signal content'],plain:['记录“什么时候收到”与记录“收到了什么”是两件事。修正前者，不应偷偷改变后者。','When something was received and what was received are different questions. Correcting the first should not quietly change the second.']},
    {term:['代表资格','Authority to represent'],plain:['“我可以发言”与“我能替所有人作决定”不是同一件事。在这个故事里，后者必须单独说明。','Being allowed to speak is different from being entitled to decide for everyone. In this story, the latter needs its own justification.']},
    {term:['调休','Time off in lieu'],plain:['本故事中的站务安排：把已记录的额外工作时间换成以后可以休息的时间。不是所有现实劳动制度都采取同一规则。','Under this fictional station’s arrangements, recorded extra work can be taken as time off later. Real employment systems do not all follow the same rules.']}
  ]
};
