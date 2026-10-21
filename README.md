# 星海公约 · Stellar Covenant

GitHub 根目录和本地两份 HTML 已恢复为你认可的上一版星际法庭游戏。它保留星图、庭审剧场、动画、合成音乐与音效、航天小游戏和原有章节。开机页新增了进入双语新故事的入口。

## 两个可玩的版本

| 入口 | 玩法与状态 |
| --- | --- |
| `index.html` | 上一版完整星图／庭审游戏，也是仓库和本地文件的默认版本 |
| `lives.html` | 《人间星海》2D 人生悬疑版：四位人物、六个共同事件、中文与英文、生活结局和休闲副线；仍是待继续打磨的实验版 |
| `archive.html` | 上一版未加新故事入口前的原始页面，保留回看 |

两个版本都留在 GitHub，可从开机页和新版顶栏互相切换。新版的页面、故事和线索调查不等于已经超过《邺山彼处》；达到这个目标需要进一步做出可操作的调查、环境氛围和有辨识度的谜题，再请玩家盲测比较。

## 运行与打包

```bash
python3 -m http.server 8766
# 打开 http://127.0.0.1:8766/
```

模块化的上一版构建为离线单文件：

```bash
python3 tools/build.py
python3 tools/build.py --check
python3 tools/sync_local.py /path/to/AutoClaw
```

`sync_local.py` 在目标目录自动建立覆盖前备份，再把上一版写入 `index.html` 与 `星海公约-仲裁庭-v3-法庭剧场.html`。新版本单文件另行构建：

```bash
python3 tools/build.py --entry lives.html
python3 tools/build.py --entry lives.html --check
```

在仓库根目录直接运行时两个入口都需要保留其 CSS 与 JavaScript 文件。离线单文件则可单独打开。

## 人间星海版本

四个人的生活随同一条星际时间线展开；玩家每轮只体验一个角色有限的视角。旧版六案被改编为另一条主线；四种休闲活动不影响主线推进。新版另含可开关的程序合成环境声与选择音效、场景入场动画、线索轻微呼吸提示，并尊重系统减少动态效果的偏好。它的动画与声音仍比上一版简单，不能把它描述成已达到上一版的演出水准。

路线与边界：[世界设计](docs/WORLD_ROADMAP.md) · [平台计划](docs/LAUNCH.md) · [前期作品研究](docs/RESEARCH-2026-10-20.md) · [验证记录](docs/VERIFICATION-2026-10-21.md)
