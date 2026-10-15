# 星海公约 · Stellar Covenant

一个讲太空法的叙事游戏。主界面是一张星图，外圈的金色航迹从 1957 年第一颗卫星升空开始，一直走到未来：
前四章当代理律师，在仲裁庭上替当事人打官司；第五章起坐到中间，自己当仲裁员；
第六章是 2077 年，人类第一次收到地外信号，合议庭要回答“谁有资格回信”。

星图上还有跟着航天史走的小游戏（造卫星、登月、引力弹弓、空间站对接、轨位争夺），
以及三个不费脑子的休憩小游戏。

案子里的国家、公司、人物都是虚构的；用到的条约条文都是真的。

## 直接运行

纯静态页面，不需要构建：

```bash
# 在仓库根目录
python3 -m http.server 8765
# 浏览器打开 http://127.0.0.1:8765/
```

直接双击 `index.html` 也能玩。

调试入口：

| 地址 | 作用 |
| --- | --- |
| `index.html#hub` | 跳过开机和开场，直接进星图 |
| `index.html?intro=clips` | 开场改用 `assets/intro/` 的影像（会标注 AI 生成） |
| `index.html?intro=2d` | 开场改用手绘版（不用 WebGL） |
| `index.html#ch=ch3` | 直接进第三章（前面的章节记为已完成） |
| `index.html#game=sling` | 直接打开某个小游戏 |

## 目录

```
index.html          页面骨架与图标
css/                base（配色与通用组件）· map · theater · games · panels · intro
js/core/            工具函数、存档、程序生成的音乐与音效、特效、星尘经济
js/art/             程序绘制的人像与法庭场景（SVG）
js/data/            术语表、法条、航天史、角色、裁判练习
js/theater/         剧本引擎：对白、质证、证据链、仲裁员模式、裁决书
js/chapters/        六章剧本（纯数据）
js/hub/             星图（主界面）与降落后的星球表面
js/games/           小游戏
js/ui/              档案馆等面板、开场动画、开机页
assets/intro/       开场影像（7 段 webm，默认不用，见 docs/LAUNCH.md）
assets/fonts/       内置字体与许可证
tools/test/         自动化测试（见 docs/DESIGN.md）
docs/               设计说明、上线路线
```

更多说明：[设计说明](docs/DESIGN.md) · [上线准备](docs/LAUNCH.md)
