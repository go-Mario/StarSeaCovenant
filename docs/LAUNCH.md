# 上线准备（2026 版）

> 写于 2026 年 10 月。这里是技术路线和手续清单，不构成法律意见。
> 版号、备案、平台审核的口径一直在变，每一步动手前请以国家新闻出版署、工信部、网信办、微信公众平台和应用商店的最新公告为准。

## 一句话结论

- **2026 年内能上线的**：网页版（H5）公测；海外应用商店（Google Play、App Store 中国区以外）。
- **要看版号的**：国内应用商店、App Store 中国区、带内购的微信小游戏。版号通常要几个月以上，2026 年内基本赶不上，按 2027 年规划。
- **微信小游戏（只靠广告、不做内购）**：有没有版号能不能过审，各方说法不一致。建议先做一个最小版本提审，看后台实际要求的材料，再决定。

## 现状（对上线有利的地方）

| 项 | 现状 |
| --- | --- |
| 体积 | 不含开场影像约 0.6 MB；小游戏主包上限约 4 MB，放得下 |
| 网络 | 没有任何外部请求（字体已内置），断网可玩 |
| 素材 | 美术、音乐、音效都由代码生成；开场默认用程序绘制的动画 |
| 个人信息 | 不收集。存档只在本机 |
| 广告 | 激励视频接口已留好（`ECON.rewarded()`），每天有上限，只换提示卡和精力 |

## 开场影像的来源

`assets/intro/` 里的 7 段影像，是上一版 `index.html` 里内嵌的素材，由仓库作者上传。分析结果：

- 编码信息写的是 `encoder=Chrome`、VP9、可变帧率：这是在浏览器里录制或转码得到的文件，不是视频软件直接导出的；
- 画面是写实风格的短镜头（每段约 3.3 秒），细节特征符合 AI 视频生成工具的输出；
- 第一段里的“斯普特尼克”外形和真实的斯普特尼克 1 号不符（真实的是一个抛光金属球，后面拖着四根天线）；
- 文件里没有任何能说明生成工具或作者的元数据。

结论：**从文件本身无法确认来源，需要作者本人确认当时用的是什么工具、账号是否有商用授权。**

另外，《人工智能生成合成内容标识办法》自 2025 年 9 月 1 日起施行，对 AI 生成的视频要求加上用户能看到的标识。所以现在的处理是：

- 默认使用程序绘制的开场动画（`js/ui/film.js`），完全自有；
- 确认授权后，把 `js/ui/intro.js` 里的 `INTRO_CFG.mode` 改成 `'clips'` 即可换回影像，播放时右上角会显示“画面由 AI 生成”；
- 影像版体积约 5.7 MB，做小游戏时必须放 CDN，不能打进包里。

## 哪些必须本人办，哪些可以交给 AI

### 必须本人（或公司）办理

| 事项 | 说明 | 大致周期 |
| --- | --- | --- |
| 确定运营主体 | 个人还是公司。版号只能由企业通过出版单位申请；个人主体的小游戏一般只能做广告变现 | 注册公司约 1–4 周 |
| 开发者账号与实名 | 微信公众平台（小游戏）、苹果开发者（年费 99 美元）、Google Play（一次性 25 美元）、国内安卓商店 | 几天 |
| 备案 | 域名 ICP 备案、小程序/小游戏备案、APP 备案。都要本人身份证件、人脸核验、短信核验 | 每项最长约 20 个工作日 |
| 软件著作权登记 | 向中国版权保护中心提交，申请人须是本人或公司；登记费已免收 | 约 1–2 个月 |
| 版号 | 与有资质的出版单位合作申报，企业主体 | 通常数月以上 |
| 收款与税务 | 流量主开通、结算账户、发票 | 1–2 周 |
| 素材授权确认 | 开场影像、未来引入的任何外部素材 | — |
| 法律文书定稿 | 隐私政策、用户协议的最终审阅与发布 | — |
| 法律内容终审 | 条约条文、案情设计的专业把关（建议另请一位太空法方向的同行复核） | — |
| 真机测试与上线运营 | 不同品牌手机实测、内测招募、客服、版本发布 | 持续 |

### 可以交给 AI（人看过再用）

| 事项 | AI 能做到哪一步 |
| --- | --- |
| 小游戏移植 | 把对白框、选项、面板改成 Canvas 绘制；剧本引擎和小游戏逻辑直接复用 |
| 广告与存档接入 | `wx.createRewardedVideoAd` 激励视频、云存档、Capacitor 套壳 |
| 软著材料 | 源程序文档（前后各 30 页）、操作说明书初稿 |
| 版号申报材料初稿 | 游戏说明、内容简介、防沉迷与未成年人保护说明、自审自查报告 |
| 隐私政策、用户协议、适龄提示 | 初稿；定稿需本人审 |
| 商店素材 | 应用描述、关键词、截图脚本、宣传文案 |
| 内容扩展 | 新章节剧本、术语、史实核对（每条要人工复核出处） |
| 质量保障 | 自动化测试（`tools/test/`）、性能测量、音量检查 |
| AI 生成内容标识 | 显式标识的界面实现；如需隐式标识，在导出文件里写元数据 |

## 时间表建议（从 2026 年 10 月算）

| 时间 | 做什么 |
| --- | --- |
| 10–11 月 | 确定主体；注册账号；申请域名并办 ICP 备案；提交软著；确认开场影像授权 |
| 11 月 | H5 公测上线（国内服务器需备案完成；也可先用海外托管做小范围测试） |
| 11–12 月 | AI 完成小游戏移植与广告接入；本人提审一个只靠广告的最小版本，摸清审核要求 |
| 12 月 | 海外：Google Play 与 App Store（中国区以外）上架 Capacitor 版本 |
| 2027 年起 | 联系出版单位申报版号；拿到后上架国内应用商店、App Store 中国区，再考虑内购 |

## 技术路线

### 网页版（H5）

1. 静态托管：对象存储 + CDN，开启 gzip/brotli。
2. 页面底部展示备案号并链接到工信部备案系统。
3. 隐私政策页面。

### App（Capacitor 套壳）

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
# 只打包游戏本体，不带 docs/、tools/
mkdir -p www && cp -r index.html css js assets www/
npx cap init 星海公约 com.example.starsea --web-dir www
npx cap add android && npx cap add ios
npx cap sync
```

### 微信小游戏

小游戏不支持网页界面（DOM）和 web-view，只能用 Canvas 绘制。

- 星图、开场动画、小游戏本来就是 Canvas，改动小；
- 对白框、选项、面板、裁决书要改成 Canvas 绘制；
- 激励视频示意：

```js
let rv=null;
function wxRewarded(){
  return new Promise(function(res){
    if(!rv){rv=wx.createRewardedVideoAd({adUnitId:'adunit-xxxx'});}
    const onClose=function(r){rv.offClose(onClose);res(!!(r&&r.isEnded));};
    rv.onClose(onClose);
    rv.show().catch(function(){rv.load().then(function(){return rv.show();}).catch(function(){rv.offClose(onClose);res(false);});});
  });
}
```

> 小程序 + web-view 这条路：web-view 不对个人主体开放，域名要备案，而且游戏内容在小程序类目下通常过不了审，不建议。

## 上线前检查清单

- [ ] 开场影像授权确认；若用影像版，确认 AI 标识显示
- [ ] 隐私政策、用户协议、适龄提示
- [ ] 未成年人保护：接入账号或联网功能后，按要求做实名与时长限制（微信小游戏由平台统一管理实名）
- [ ] 广告：只用激励视频，不做强制插屏；每日上限在 `MONETIZE.adDailyCap`
- [ ] 内容复核：`js/data/laws.js`、`js/data/history.js`、六章的“现实原型”
- [ ] 性能：低端安卓机实测星图拖动和降落动画（`node tools/test/perf.js` 可做 CPU 降速模拟）
- [ ] 全部自动化测试通过，截图人工过一遍
- [ ] 云存档（可选）

## 参考来源

- [国家网信办等：《人工智能生成合成内容标识办法》答记者问](https://www.cac.gov.cn/2025-03/14/c_1743654685896173.htm)
- [新华网：标识办法 2025 年 9 月 1 日起施行](https://www.news.cn/tech/20250319/a572ec4366f149c1b0b04a07ebf4931b/c.html)
- [微信开放文档：小游戏版本审核](https://developers.weixin.qq.com/minigame/introduction/guide/bbsh.html)
- [人人都是产品经理：APP / 小程序备案说明](https://www.woshipm.com/it/5922271.html)
- [新西兰外交贸易部：进入中国手游市场的许可与审批](https://www.mfat.govt.nz/cn/trade/mfat-market-reports/entering-chinas-mobile-gaming-market-a-guide-to-licensing-and-regulatory-approval)
- [Singular：iOS 应用上架中国区的要求](https://www.singular.net/blog/ios-apps-china/)
- 第三方整理（口径不一，仅作参考）：[品乐科技：版号申请指南](https://www.pinlekeji.com/wiki/game-version-number-application-guide.html)、[阿里云开发者社区：微信小游戏发布流程](https://developer.aliyun.com/article/1703905)、[小游戏上线检查清单](https://eastondev.com/blog/zh/posts/dev/20260522-cocos-mini-game-launch-checklist/)
