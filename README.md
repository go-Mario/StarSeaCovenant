<div align="center">

# 星海公约 · Stellar Covenant

**一部关于太空法的叙事游戏。六个虚构案件，全部依据真实条约。**

[在线游玩](https://go-mario.github.io/StarSeaCovenant/) · [下载离线单文件](dist/starsea.html) · [English](#english)

</div>

---

## 这是什么

1957 年，一颗只会"嘀嘀"叫的金属球飞过所有国家的上空。

1978 年，一颗核动力卫星掉在别国的冻土上。

2077 年，一座空间站上的仲裁院，用卷宗重演这些争执。

你是见习仲裁员。每一章，你替当年的律师上场：读证物、质证、引律、写下裁决。
案子是虚构的，**法律是真的**——《外空条约》《责任公约》《登记公约》《营救协定》，
每一条都对应现实中的条文；每章结尾都标出"现实原型"，说明哪些地方做了改动。

## 玩法

- **星图**：六个案件沿 1957—2077 的时间轴展开
- **庭审剧场**：当庭表态、现场取证、质证（追问 / 出示证据 / 引律）、组证据链
- **裁决**：起草裁决书。判错不会立刻输，但会掉"气势"；气势掉光就是举证不能
- **秘书处**：工时、加班、调休——上班本身也是玩法
- **档案馆**：法典、先例、术语表、史实卡
- **五个小游戏**：登月着陆、空间站对接、轨位争夺、引力弹弓、碎片清扫

## 六个案件

| 章 | 年份 | 案件 | 现实原型 |
| --- | --- | --- | --- |
| 一 | 1980 | 天降核雨 | 苏联宇宙-954 号核动力卫星坠落加拿大 |
| 二 | 2009 | 沉默的预警 | 铱星 33 与宇宙-2251 相撞 |
| 三 | 2031 | 无主巨物 | 失联大型卫星的清除之争 |
| 四 | 2043 | 没有登记的采矿站 | 未登记空间物体的处置 |
| 五 | 2052 | 南极的界线 | 月球南极"安全区" |
| 六 | 2077 | 回信 | 收到地外信号之后 |

## 开始游戏

**在线**：<https://go-mario.github.io/StarSeaCovenant/>

**本地**（仓库根目录，需一个静态服务器）：

```bash
python3 -m http.server 8766
# 打开 http://127.0.0.1:8766/
```

**离线单文件**：直接双击 `dist/starsea.html`。视频、字体、音乐全部内嵌，不联网也能玩。

## 操作

| 平台 | 操作 |
| --- | --- |
| 电脑 | 点击 / 回车推进；数字键选选项；`Esc` 返回 |
| 手机 | 点按推进，横竖屏均可，适配刘海屏安全区 |

## 语言

中英文随时切换（设置面板或开机页），切换不丢进度。
术语链接在英文模式下指向英文释义。

## 技术

- **零第三方依赖**：纯 HTML / CSS / JavaScript，无框架、无 CDN、无网络请求
- **音乐与音效全部实时合成**（Web Audio），不使用任何采样素材
- 存档在浏览器本地，可导出 / 导入 JSON；支持从损坏存档恢复

```bash
python3 tools/build.py          # 生成离线单文件
python3 tools/build.py --check  # 校验单文件与源码一致
```

## 说明

游戏引用的条约与史实均为真实；案件中的国家、公司、人物均为虚构，
与任何现实政府、企业或个人无关。本作不含内购，不采集个人信息。

开发笔记见 [`docs/`](docs/)：世界设计、平台计划、前期研究与验证记录。

---

<a id="english"></a>

## English

**A narrative game about space law. Six fictional cases, every one built on real treaties.**

1957: a metal ball that could only beep passes over every country's sky.
1978: a nuclear-powered satellite falls on someone else's frozen ground.
2077: an arbitration court aboard a space station replays these quarrels from the case files.

You are a probationary arbitrator. Each chapter, you take the stand for the lawyer of the day:
read the evidence, cross-examine, cite the treaties, and write the award.
The cases are fiction. **The law is real** — the Outer Space Treaty, the Liability Convention,
the Registration Convention, the Rescue Agreement — and every chapter ends with a note on
what was changed and why.

**Play:** [online](https://go-mario.github.io/StarSeaCovenant/) · or open `dist/starsea.html` offline.

**Features**

- Six cases on a timeline from 1957 to 2077
- Courtroom theatre: opening positions, site inspection, cross-examination, chains of evidence
- Draft your own award; excess of jurisdiction gets that part set aside
- A secretariat where work hours, overtime and time off are part of the game
- Codex, precedents, glossary and history cards
- Five mini-games: moon landing, station docking, orbital slots, gravity slingshot, debris sweep
- Full Chinese / English switch at any time, without losing progress
- No dependencies, no network requests, no microtransactions; all music synthesised at runtime

**Note:** the treaties and historical events are real; the States, companies and people in the
cases are fictional and unrelated to any real government, company or person.
