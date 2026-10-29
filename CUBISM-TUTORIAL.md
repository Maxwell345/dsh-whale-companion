# 小肥鱼 · Cubism Editor 绑定教程

> 目标：把 Codex 已经拆好的 `pet/assets/live2d/{maid,knit,winter}/*-layered.psd` 变成真正的 Cubism 模型，导出 `model3.json + moc3 + 纹理 + motion3 + physics3 + expressions`，然后替换现在的 Canvas2D sprite 版。
>
> 这一步必须在 **Live2D Cubism Editor** 里手工完成。`.moc3` 是 Editor 编译出来的二进制，Codex/脚本不能可靠生成；Codex 能写的是驱动层、motion3/physics/expressions JSON 和文件整理。

---

## 0. 准备

- 安装 **Live2D Cubism Editor 5.x**（免费版即可开始；导出/保存注意免费版限制）。
- 确认这些文件在：

```text
pet/assets/live2d/maid/maid-layered.psd
pet/assets/live2d/knit/knit-layered.psd
pet/assets/live2d/winter/winter-layered.psd
pet/assets/live2d/BINDING.md
```

- 先复制一份 PSD 到别处做备份；绑定过程会改图层/网格。
- 三套服装建议分别建三个 `.cmo3` 工程，共用同一套参数命名。这样 `avatar.js` 只需要按 outfit 切 `model3.json`。

---

## 1. 新建工程并导入 PSD

1. 打开 Cubism Editor → **New Project / 新建模型**。
2. 选择 **Import PSD**，导入 `maid-layered.psd`。
3. 画布尺寸按 PSD 原尺寸（当前约 `1052×1494`，以 BINDING.md 为准）。
4. 在图层列表确认 16 个图层都在：`hair-back`、`body`、`legs`、`arm-l`、`arm-r`、`face`、`eye-l`、`eye-r`、`hair-front`、`ear-l`、`ear-r`、`tail`、`accessory`、`ahoge`、`joint-fill` 等。
5. 如果 PSD 有隐藏图层/多余白底，先删掉白底，保留透明。

---

## 2. 画 ArtMesh（网格）

对每个需要动的图层：

1. 选中图层 → 右键 **Create ArtMesh**（或工具栏 ArtMesh）。
2. 自动网格后，手动加线：
   - 脸/眼睛：密一点；
   - 头发：沿发丝走向；
   - 裙子/围裙：横向多几段，方便摆动；
   - 尾巴/鳍耳：沿弯曲方向。
3. 画好一个就锁一个，避免误移动。
4. 调整 **Draw Order**（绘制顺序），建议从后到前：

```text
hair-back
tail
legs
body
arm-l / arm-r
face
eye-l / eye-r
hair-front
ear-l / ear-r
accessory
ahoge
joint-fill（需要时）
```

> 眼睛不要用整张脸一起变形；`eye-l` / `eye-r` 单独做 ArtMesh，后面才能眨眼/转眼。

---

## 3. 建变形器（Deformer）

按 BINDING.md 的父子关系建，最简结构：

```text
Root
├─ Body
│  ├─ Head
│  │  ├─ Face
│  │  ├─ HairFront
│  │  ├─ EarL / EarR
│  │  └─ Ahoge
│  ├─ ArmL / ArmR
│  ├─ Skirt
│  └─ Tail
└─ HairBack
```

- `Head` 负责 `ParamAngleX/Y/Z`；
- `Body` 负责 `ParamBodyAngleX/Y/Z` 和呼吸；
- `ArmL/ArmR` 负责手臂；
- `Tail` 负责尾巴；
- `EarL/EarR` 负责鳍耳；
- `HairBack/HairFront` 负责头发摆动。

每建一个变形器，就把对应 ArtMesh 拖进去；用变形器做 3 个基础姿势（neutral / happy / shy）检查网格是否撕裂。

---

## 4. 参数（Parameters）

至少建这些参数（ID 要完全一致，方便 `avatar.js` 和动作复用）：

```text
ParamAngleX / ParamAngleY / ParamAngleZ
ParamEyeLOpen / ParamEyeROpen
ParamEyeBallX / ParamEyeBallY
ParamMouthOpenY / ParamMouthForm
ParamBrowLY / ParamBrowRY
ParamBodyAngleX / ParamBodyAngleY / ParamBodyAngleZ
ParamBreath
ParamArmLA / ParamArmLB / ParamArmRA / ParamRB
ParamTail
ParamEarL / ParamEarR
ParamHair
```

- 范围一般 `-1..1`，角度用 `-30..30`；
- 给每个参数做 2–3 个关键点（最小/中间/最大），不要只做一个姿势；
- 先做 `neutral`，再做 `happy`、`shy`，最后加 `pout`、`sleepy`、`surprised`、`eat`。

---

## 5. 物理（Physics）

给这些部件加物理：

- 头发（后发/前发/呆毛）
- 尾巴
- 鳍耳
- 裙子/围裙下摆
- 围裙/毛衣下摆（轻微）

Physics 预设可以先用 Editor 自带模板，再手调：

- 头发：摆幅小、回弹慢；
- 尾巴：摆幅中等、频率低；
- 鳍耳：摆幅小、回弹快；
- 裙子：摆幅中等、阻尼大。

物理不要过强，否则 idle 会一直抖。

---

## 6. 表情（Expressions）

建 7 个表情文件：

```text
neutral
happy
shy
pout
sleepy
surprised
eat
```

每个表情至少控制：

- 眼睛开合/眼珠位置；
- 眉毛；
- 嘴型；
- 脸红（如果用了脸红图层/参数）。

导出时放在：

```text
pet/live2d/models/maid/expressions/*.exp3.json
```

三套服装使用同一套表情名，`avatar.js` 才能统一调用 `setExpression(name)`。

---

## 7. 动作（Motions）

至少做这些 motion3：

```text
idle        循环
happy       蹦一下 + 笑眼
shy         缩肩 + 脸红 + 鳍耳抖
spin        原地转一圈
spray       头顶/鲸鱼帽喷水
tail        被摸尾巴：尾巴缩、身体抖、回头
ear         被捏耳朵：鳍耳抖、躲一下
pout        鼓脸、扭头
sleepy      打哈欠、揉眼、低头
dance       左右摆 + 手臂
jump        跳起、落地回弹
heart       双手比心/捧心
eat         捧碗、扒饭
nod / shake / sit / ignore
```

- `idle` 必须循环；
- 每个动作 1–3 秒；
- 动作之间可打断，不要做“必须播完”的强制队列；
- `play(action)` 映射到 motion 组名，组名和动作名一致最省事。

---

## 8. 导出

1. **File → Export → For Web**（或 Export → model3.json）。
2. 导出到：

```text
pet/live2d/models/maid/
  maid.model3.json
  maid.moc3
  maid.physics3.json
  maid.pose3.json（可选）
  textures/texture_00.png
  motions/*.motion3.json
  expressions/*.exp3.json
```

3. 检查 `maid.model3.json` 的 `FileReferences`：
   - `Moc` 指向 `.moc3`；
   - `Textures` 指向纹理；
   - `Physics`、`Motions`、`Expressions` 路径都存在；
   - 全部是相对路径，不要出现 `F:\...`。
4. 纹理 ≤ 2048×2048，PNG 透明。
5. 用 Cubism Viewer 先看一遍；确认没问题后再放进 DSH 桌宠验收。

---

## 9. 三套服装

- `knit-layered.psd` → `knit.model3.json`
- `winter-layered.psd` → `winter.model3.json`
- 共用同一套参数名/表情名/动作名；
- 每套单独导出，`avatar.js` 里按 `outfit` 切模型路径。

---

## 10. 导出后交给我

把 `pet/live2d/models/{maid,knit,winter}/` 放好，然后告诉我。我会：

1. 写 `pet/live2d/avatar-live2d.js`：按 vendor 顺序加载 Pixi/Core/display，`Live2DModel.from(...)`，实现同一个 `window.WhaleAvatar`；
2. 映射 `play(action)` / `setOutfit` / `setExpression` / `setSpeaking`；
3. 保留 sprite fallback；
4. 用 `tools/check-live2d.mjs` 和桌宠窗口验收。

Codex 也可以写这个适配层；但 `.moc3` 必须由 Editor 导出，不要让它伪造。

---

## 11. 常见坑

| 现象 | 原因 |
|---|---|
| 模型加载报 MOC3 版本错误 | Core 与 Editor 版本不匹配；换 `vendor/live2dcubismcore.min.js` 为对应版本 |
| 纹理 404 | `model3.json` 里的纹理路径没跟着导出目录走 |
| 眼睛不眨 | `ParamEyeLOpen/ROpen` 没绑到眼睛 ArtMesh |
| 头发穿模 | 头发网格/变形器父级不对，或物理过强 |
| 换装后动作丢失 | 三套 model3 的 motion 组名不一致 |
| 模型过大 | 纹理太大/层太多；压到 2048，去掉不可见层 |

---

## 12. 参考

- `pet/assets/live2d/BINDING.md`：Codex 已写的图层/参数/父子关系建议
- `pet/live2d/README.md`：当前 sprite 交付说明和替换路径
- `pet/live2d/vendor/README.md`：PixiJS/Core 版本与加载顺序
