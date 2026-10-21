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

保留整个仓库目录时，直接双击 `index.html` 也能玩。若只想复制一个文件，使用下面的离线构建。

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


## 本地文件与 GitHub 同步

GitHub 上的 `index.html` 保留模块化入口，网页按需加载资源；本地两份 HTML 从这些源码生成，字体和可选过场视频内嵌，离线也可使用。两种形式内容同源，不再手工维护旧版大文件。

```bash
python3 tools/build.py
# 输出 dist/starsea.html，可单独双击或复制到其他文件夹
python3 tools/build.py --check
# 明确指定本机存放两份文件的文件夹；覆盖前自动备份
python3 tools/sync_local.py /path/to/local/folder
```

`sync_local.py` 同步 `index.html` 与 `星海公约-仲裁庭-v3-法庭剧场.html` 两个文件名。版本更新请修改仓库源码，再生成；不要把生成的大文件反向覆盖仓库的模块化入口。GitHub 上传／推送应包含改动的 CSS、JS 等文件，不只是 `index.html`。

存档位于「档案馆 → 设置」，支持导出、导入及自动备份恢复。不同浏览器、网址和本地文件的进度不保证共享，可用 JSON 文件迁移。自动备份也在同一浏览器内，不能代替导出文件；清理网站数据会一并删除它。

存档回归检查无需安装依赖：`node tools/test/save.js`。浏览器回归检查仍见 `tools/test/`。

## 人物主线与双语预览

星图中的「人物主线 · 共同事件」进入原创事件 **回信前夜**：维修员林渡、天文学家李星澜、律师陈岚，从各自材料与生活处境经历同一晚。三条线各有两种选择，公共交接会影响后来者的行动说明；个人精力与调休分开保存。

启动页、设置和人物故事页可以切换中文／英文。新事件完整双语；原有六章及部分旧玩法暂保留中文，英文仍为预览。详见 [作品研究与 2D → 3D 多人路线图](docs/WORLD_ROADMAP.md) 和 [平台上线计划](docs/LAUNCH.md)。

新增验证：`node tools/test/save.js`；本地服务器启动后设置 `SS_URL`，运行 `node tools/test/stories.js`、`node tools/test/portable-save.js`（后两项需要 Playwright）。人物测试覆盖六种顺序与八种结局组合，浏览器测试不替代手机真机验收。
