# 上线路线（小程序 / App）

> 这里写的是技术路线和需要提前准备的手续清单，不构成法律意见。
> 平台规则和监管要求变化很快，每一步动手前请以微信公众平台、应用商店和主管部门的最新公告为准。

## 现状

- 纯静态 H5：HTML + CSS + 原生 JS，无构建、无后端、无外部网络请求。
- 所有美术和声音都是运行时生成，资源只有开场影像（约 5.7 MB）和三个字体文件（约 75 KB）。
- 存档在本地（localStorage）。
- 激励视频是占位实现，统一走 `ECON.rewarded()`。

## 路线建议：先 H5，再 App，小游戏单独评估

### 第一步：H5 公测（最快）

1. 找一个静态托管（国内云厂商的对象存储 + CDN）。在中国大陆面向公众提供服务的网站，需要域名完成 ICP 备案。
2. 把 `assets/intro/` 的影像放到 CDN，开启 gzip/brotli。
3. 加一份隐私政策页面。当前版本不收集个人信息，只用本地存储；以后接入统计、广告或账号时要同步更新。
4. 用这个阶段收集反馈：哪一章卡关、哪一段太长、哪个小游戏玩得最多。

### 第二步：App（Capacitor 套壳）

把现有 H5 原样装进一个原生壳，改动最小：

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
# 只打包游戏本体，不带 docs/、tools/
mkdir -p www && cp -r index.html css js assets www/
npx cap init 星海公约 com.example.starsea --web-dir www
npx cap add android && npx cap add ios
npx cap sync
```

需要补的：

- 把 `ECON.rewarded()` 换成广告 SDK 的激励视频接口；
- 存档换成原生存储或云存档（清理浏览器数据不应丢进度）；
- 应用图标、启动图；
- 国内安卓商店上架通常要求软件著作权登记证书、APP 备案、隐私政策和权限说明；
- 苹果 App Store 中国区上架游戏需要提供版号，App 本身也需要完成备案。

### 第三步：微信

有两条路，差别很大：

**A. 小程序 + web-view**
把 H5 放在小程序里的 web-view 组件中打开。改动最小，但限制多：
- web-view 只对企业等非个人主体的小程序开放，个人主体用不了；
- 要打开的域名必须在小程序后台配置为“业务域名”，需要 HTTPS 和 ICP 备案；
- 小程序本身也需要备案；
- 游戏类内容在小程序类目里通常不被允许，审核可能要求改为小游戏形式上线。这是这条路最大的不确定性，建议先咨询平台或做一次提审试探。

**B. 小游戏（推荐的长期方向）**
微信小游戏不支持 DOM 和 web-view，只能用 Canvas/WebGL 渲染。现在的界面大量用了 HTML/CSS，所以要做一次移植：
- 剧本引擎、存档、经济、小游戏逻辑都是纯数据和纯函数，可以直接复用；
- 对白框、选项、面板、裁决书这些界面要改用 Canvas 绘制，可以借助一个小游戏引擎（如 Cocos Creator、LayaAir）或社区的 DOM 适配层；
- 小游戏的激励视频接口是 `wx.createRewardedVideoAd`，在 `ECON.rewarded()` 里接上即可：

```js
// 小游戏环境下的示意（广告位 ID 在小游戏后台申请）
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

**版号**：按照目前的规定，在中国大陆上线运营的网络游戏一般需要取得出版许可（俗称版号），微信小游戏、各大应用商店在审核时都会要求提供。
单机、无内购、只靠广告的轻量游戏是否以及如何适用，要按提交时的规则确认。版号申请周期长，建议尽早联系有资质的出版单位咨询。

### 海外

如果想先验证玩法，海外渠道门槛低一些：itch.io、Google Play（Capacitor 打包）、自建网页。需要准备英文版本时，剧本和界面文字都在 `js/chapters/` 和 `js/data/` 里，集中替换即可。

## 上线前检查清单

- [ ] 开场影像的来源与授权确认（`assets/intro/`）
- [ ] 隐私政策、用户协议
- [ ] 未成年人保护：明确适龄提示；如果接入账号体系和联网功能，按网络游戏防沉迷要求做实名认证和时长限制
- [ ] 广告：激励视频只用于提示卡和精力，不做强制插屏；每日上限可在 `MONETIZE.adDailyCap` 调整
- [ ] 内容复核：条约条文、史实年份再核对一遍（`js/data/laws.js`、`js/data/history.js`）
- [ ] 性能：低端安卓机上长卷滚动和深空画布的帧率
- [ ] 跑一遍 `tools/test/` 下全部测试，截图人工过一遍
- [ ] 云存档（可选）

## 版本节奏建议

| 版本 | 内容 |
| --- | --- |
| 0.9 H5 公测 | 现有六章 + 八个小游戏，收集数据 |
| 1.0 App | 原生壳、激励视频接入、云存档 |
| 1.1 | 新章节包（例如：太空交通管理、在轨服务的责任、月面考古遗址保护） |
| 1.x 小游戏 | Canvas 重写界面层，上线微信小游戏 |
