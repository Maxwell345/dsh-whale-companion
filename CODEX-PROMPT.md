# 给 Codex 的提示词：小肥鱼 Live2D 桌宠形象 / 动作 / 独立聊天窗皮肤

> 用法：把下面 **“=== 提示词开始 ===” 到 “=== 提示词结束 ===”** 之间的全部内容复制给 Codex。
> 工作目录填：`<你的插件目录>`（例如 `F:\DeepSeekBot\dsh-whale-companion`）
> Codex 只做美术、Live2D 和桌宠前端主题；不要让它改后端、QQ、记忆、设置页，也不要让它去安装别人的插件。

---

=== 提示词开始 ===

你是一个擅长 Live2D Cubism、PixiJS 和二次元 Q 版角色动效的前端/美术工程师。请在一个已经存在的 DSH 插件项目里，为「小肥鱼」制作 Live2D 桌宠形象、动作和桌宠前端主题。

工作目录：`<你的插件目录>`（下文路径都相对这个目录）

## 0. 重要：浏览器依赖已经就位，不要安装 PixiJS

这台电脑没有安装 PixiJS，也**不需要安装**。项目里已经放好：

```text
pet/live2d/vendor/
  pixi.min.js                            # PixiJS 6.5.10（MIT）
  live2dcubismcore.min.js                # Live2D Cubism Core（用户已同意官方许可，仅本地使用）
  pixi-live2d-display-cubism4.min.js     # pixi-live2d-display 0.4.0（MIT）
```

- **不要** `npm install pixi.js` 或任何前端依赖；
- **不要**用 CDN / 外网加载；
- **不要**升级 PixiJS 7/8；
- 加载顺序：`pixi.min.js → live2dcubismcore.min.js → pixi-live2d-display-cubism4.min.js → avatar.js`；
- 直接用相对路径 `/dsh-whale/static/pet/live2d/vendor/...`。

## 0.1 先读懂项目，不要重写整个项目

这是一个已经能运行的 DSH 插件，后端、QQ、记忆、设置页、桌宠窗口壳、聊天窗都已经写好。你**只负责**桌宠的视觉层和 Live2D 适配层。请先读这些文件：

- `README.md`（如果有）
- `web/pet.html`、`web/pet.css`、`web/pet.js`
- `web/chat.html`、`web/chat.css`、`web/chat.js`
- `web/avatar-fallback.js`
- `pet/assets/` 下已有的立绘
- 如果你有参考图，放在项目上一级的 `assets/`；仓库里已有的 `pet/assets/` 是当前 fallback 素材
- `lib/window-shell.js`（只读，理解窗口尺寸与透明背景，不要改）

### 硬性边界

1. **不要改** `lib/` 下的任何后端文件。
2. **不要改** `lib/index.js`、`lib/memory.js`、`lib/qq.js`、`lib/pet.js`、`lib/activities.js`、`lib/config.js`。
3. **不要改** `web/settings.html`、`web/settings.js`、`web/ui.css`、`web/ui.js`。
4. **不要加** B 站、私信、评论、视频相关功能。这个插件和已有的「养鱼」插件是分开的。
5. **不要安装**任何 GitHub 上的现成插件，也不要照抄别人的插件代码。可以参考 Live2D 的通用接入方式，但代码要自己写。
6. **不要引入构建步骤**（不要 Webpack/Vite/npm build）。运行时必须是静态文件，直接由插件的静态路由提供。
7. **不要依赖 CDN 或任何外网**。所有 JS/CSS/模型/纹理必须放在项目目录里，运行时不发外部请求。
8. **不要伪造 Live2D 模型**。如果无法产出真正可用的 Cubism 模型，就产出「分层 PSD + 绑定说明 + 高质量 sprite 立绘」，并在 `pet/live2d/README.md` 里说明，而不是放一个假的 `model3.json`。

## 1. 角色设定

「小肥鱼」是一只圆滚滚、肥嘟嘟的 Q 版小鲸鱼娘，8 岁左右小女孩心智，2.5 头身，整体要可爱、软、圆，不要成熟性感。

- 头发：深蓝色到浅蓝色的渐变长发，发量多，发尾微卷；有一根呆毛（ahoge）。
- 耳朵：不是人耳，是两片小鲸鱼鳍耳，鳍耳内侧是白色/浅蓝色。
- 尾巴：身后有一条短短的鲸鱼尾巴，尾鳍是横向的（像鲸鱼），深蓝到浅蓝渐变。
- 眼睛：大大的蓝色眼睛，眼白干净，瞳孔有高光；害羞时脸颊有明显红晕。
- 肤色：白皙偏暖，脸颊有淡粉红晕。
- 体型：2.5 头身，短手短腿，肚子有一点点软软的圆。
- 表情：呆萌、认真、饿、困、害羞、傲娇、开心、被摸尾巴炸毛。

### 三套服装（必须都做）

**A. 经典女仆装（maid）**
- 深蓝色长袖女仆长裙，白色荷叶边领口、袖口、裙摆。
- 白色荷叶边围裙，围裙正中绣一只蓝色小鲸鱼。
- 白色蕾丝发箍，发箍上有小蓝蝴蝶结；左侧头发有蓝色蝴蝶结。
- 白色花边袜，深蓝色玛丽珍鞋（带小搭扣）。
- 参考：`../assets/2.png`（正面全身）、`1.png`（表情/姿势参考）、`三视图.png`（正面/侧面/背面/比例）；没有就用 `pet/assets/` 现有图。

**B. 针织帽日常装（knit）**
- 米白色针织帽，帽檐软软的；帽子上有一只小鲸鱼装饰。
- 米白色针织毛衣，毛衣正面有蓝色小鲸鱼图案；里面是白色衬衫领。
- 深蓝色格纹百褶短裙。
- 米白色堆堆袜，袜口有蓝色蝴蝶结；深蓝色小皮鞋。
- 参考：`../assets/dance.gif`（动作和服装参考，注意它是 GIF，不要直接把 GIF 当 Live2D 模型）。

**C. 冬装（winter）**
- 鲸鱼造型的连帽/帽子：帽子是深蓝色鲸鱼头，头顶会喷小水花，帽檐有白色绒毛；帽子侧边有小鲸鱼发卡。
- 深蓝色棉袄，衣服上有鲸鱼和雪花图案，白色绒毛滚边。
- 深蓝色雪地靴，白色绒毛边，鞋侧有小鲸鱼/雪花装饰。
- 参考：`../assets/冬装小肥鱼.png`（三视图：正面/侧面/背面，注意裁出正面即可）。

> 参考图只用于造型、配色和比例。不要照抄图上的文字气泡（比如“你看，又急”“才不肥”），也不要把参考图的背景带进模型。

## 2. 技术目标

### 2.1 运行时结构

请把成果放在这些路径：

```text
pet/
  live2d/
    avatar.js          # 必须定义 window.WhaleAvatar；桌宠壳会动态加载它
    avatar.css         # 可选，avatar.js 自己注入也可以
    models/
      maid/            # Cubism 模型：maid.model3.json + 纹理 + motions + expressions + physics
      knit/
      winter/
    vendor/            # pixi.js、pixi-live2d-display、Cubism Core 等本地依赖
    README.md          # 模型来源、授权、如何替换、如何调试
  assets/
    live2d/            # 你生成的分层 PSD / 纹理 / 预览图（可选）
```

`web/pet.js` 会按以下顺序加载：

1. 动态 `<script src="/dsh-whale/static/pet/live2d/avatar.js">`
2. 如果加载后 `window.WhaleAvatar` 存在，就用它
3. 否则回退到 `web/avatar-fallback.js`

所以**不要改 `web/pet.js` 的加载逻辑**。你只需要保证 `avatar.js` 在成功时定义 `window.WhaleAvatar`，失败时不要定义（让 fallback 接手）。

### 2.2 `window.WhaleAvatar` 接口（必须严格实现）

```js
window.WhaleAvatar = {
  /**
   * @param {HTMLElement} container  #avatar 容器，尺寸由窗口决定（约 360x560，可能缩放）
   * @param {{ outfit?: 'maid'|'knit'|'winter' }} opts
   */
  init(container, opts) {},

  /** 播放一个动作。动作名见下。重复调用同一个动作要能重新播放。 */
  play(action) {},

  /** 切换服装；不经过大模型，纯前端。切换时保持当前动作/表情尽量连续。 */
  setOutfit(outfit) {},

  /** 可选：设置表情（happy/shy/pout/sleepy/neutral 等）。 */
  setExpression(name) {},

  /** 说话时轻微张嘴/点头/光效；false 时恢复 idle。 */
  setSpeaking(on) {},

  /** 清理 WebGL、Pixi、事件监听、ResizeObserver。 */
  destroy() {},
}
```

动作名（`play(action)`）至少支持：

`idle`（循环）、`happy`、`shy`、`spin`、`spray`（鲸鱼喷水）、`tail`（尾巴被摸）、`ear`（耳朵被捏）、`pout`、`sleepy`、`dance`、`jump`、`heart`、`eat`、`nod`、`shake`、`sit`、`ignore`。

未知动作要安全回退到 `idle` 或 `happy`，不能抛错。

### 2.3 加载与依赖（PixiJS 已经预置）

**这台电脑没有装 PixiJS，也不需要装。** PixiJS 是浏览器库，不是系统级软件。项目里已经放好了浏览器构建：

```text
pet/live2d/vendor/
  pixi.min.js                            # PixiJS 6.5.10（MIT）
  live2dcubismcore.min.js                # Live2D Cubism Core（用户已同意官方许可，仅本地使用）
  pixi-live2d-display-cubism4.min.js     # pixi-live2d-display 0.4.0（MIT）
  PIXI-LICENSE.txt
  PIXI-LIVE2D-DISPLAY-LICENSE.txt
```

请**直接**用相对路径加载它们，不要在运行时执行 `npm install`，不要用 CDN：

```html
<script src="/dsh-whale/static/pet/live2d/vendor/pixi.min.js"></script>
<script src="/dsh-whale/static/pet/live2d/vendor/live2dcubismcore.min.js"></script>
<script src="/dsh-whale/static/pet/live2d/vendor/pixi-live2d-display-cubism4.min.js"></script>
```

`pixi-live2d-display-cubism4.min.js` 会把 Cubism 4 的 `Live2DModel` 挂到 `PIXI.live2d` 上（`PIXI.live2d.Live2DModel.from(...)`）。

**版本已固定：PixiJS 6.5.10 + pixi-live2d-display 0.4.0。** 不要升级到 PixiJS 7/8，也不要把两个库换成别的版本；它们的 peer dependency 是 PixiJS 6。`pixi.min.js` 必须先于 `pixi-live2d-display-cubism4.min.js` 加载。

- Cubism Core（`live2dcubismcore.min.js`）**已经放好**，加载顺序必须是：
  ```text
  pixi.min.js → live2dcubismcore.min.js → pixi-live2d-display-cubism4.min.js → avatar.js
  ```
  `avatar.js` 仍要检测 `window.Live2DCubismCore`；缺失时安全回退，不要报错刷屏。Core 有单独的 Live2D 授权，**只在这个本地项目里用，不要提交到公共仓库或再分发**。
- 所有依赖放 `pet/live2d/vendor/`，用相对路径加载，禁止 CDN。Core 已经在里面，不要再下载一份。
- 如果 Codex 发现 vendor 里的 PixiJS 版本不够/不兼容，**不要重新 npm install**；把需要的浏览器构建版本说明写进 `pet/live2d/README.md`，由用户替换 vendor 文件。
- 纹理建议 2048×2048，模型整体控制在合理大小（单套 < 15MB，三套合计尽量 < 40MB）。
- 支持窗口缩放：用 `ResizeObserver` 或 `window.resize` 让模型按容器高度自适应，保持底部对齐。
- 透明背景：canvas 必须透明，不要画背景色。
- 性能：桌面端 60fps 为目标；移动/低配可降到 30fps。不要每帧创建对象。
- 处理 WebGL context lost/restored：至少不要让整个桌宠白屏。

### 2.4 模型与动作建议

三套服装可以做成三个独立 model3.json（共享同一套骨骼/参数命名），也可以做一个模型用换装参数/纹理切换。**推荐三个独立模型**，实现简单、风险低；`avatar.js` 里用 `setOutfit` 切换。

每套模型至少需要：

- 参数：`ParamAngleX/Y/Z`、`ParamEyeLOpen/ROpen`、`ParamEyeBallX/Y`、`ParamMouthOpenY`、`ParamMouthForm`、`ParamBrowLY/RY`、`ParamBodyAngleX/Y/Z`、`ParamBreath`、手臂/腿/尾巴/鳍耳参数。
- 物理：头发、裙子、尾巴、鳍耳、围裙/毛衣下摆有轻微摇摆。
- 表情：neutral、happy、shy、pout、sleepy、surprised、eat。
- 动作（motion3.json）：
  - `idle`：呼吸 + 轻微摇摆 + 眨眼，循环。
  - `happy`：蹦一下、眯眼、尾巴摇。
  - `shy`：缩肩、脸红、鳍耳抖、尾巴卷。
  - `spin`：原地转一圈（注意裙摆/头发跟随）。
  - `spray`：头顶/鲸鱼帽喷水，身体前倾或仰头。
  - `tail`：被摸尾巴，尾巴猛地一缩、身体一抖、回头。
  - `ear`：被捏耳朵，鳍耳抖、躲一下。
  - `pout`：鼓脸、扭头、抱臂。
  - `sleepy`：打哈欠、揉眼睛、低头、Zzz。
  - `dance`：小幅左右摆 + 手部动作。
  - `jump`：跳起、落地回弹。
  - `heart`：双手比心/捧心，脸红。
  - `eat`：捧碗、扒饭、鼓脸。
- 动作之间要能打断：`play` 新动作时停止旧动作，不要排队卡死。
- 口型：可选。如果实现了 `setSpeaking(true)`，就用 `ParamMouthOpenY` 做轻微开合；false 时回到自然闭合。没有音频分析，不需要真实语音驱动。

### 2.5 桌宠壳的交互（已存在，不要改）

`web/pet.html` 已经有这些透明热区（绝对定位，覆盖在模型上）：

- 头 `data-zone="head"`
- 耳朵 `data-zone="ear"`
- 脸颊 `data-zone="cheek"`
- 肚子 `data-zone="belly"`
- 尾巴 `data-zone="tail"`
- 手 `data-zone="hand"`

点击热区会请求后端，拿到 `{text, actions}`，然后调用 `WhaleAvatar.play(actions)`。你不需要自己处理鼠标命中，只要保证模型的头/耳/肚子/尾巴大致落在这些热区下面，视觉上对得上。

桌宠窗口是 360×560（可按设置缩放），顶部 42px 是拖动条，底部是工具栏。模型不要挡住顶部拖动条和底部工具栏；建议角色脚底离底部约 8–12px。

### 2.6 聊天窗皮肤（可选，但加分）

`web/chat.html` 和 `web/chat.css` 已经有完整聊天 UI。你可以在**不改变 DOM id/class 契约**的前提下，把头像、气泡的视觉调得更贴合小肥鱼：

- 头像用 `pet/assets/maid.png` 或你生成的透明头像。
- 不要改 `web/chat.js` 的逻辑，不要改按钮 id。

如果时间不够，优先做桌宠 Live2D，聊天窗皮肤可以只换头像和配色。

## 3. 美术要求

- 2.5 头身，圆润，软，干净；不要细长腿、不要成熟身材、不要露骨。
- 线条：深蓝色描边，粗细略有变化；上色是赛璐璐 + 少量柔和渐变。
- 配色：
  - 主色：深蓝 `#22345c` / `#2f4a7a`
  - 亮蓝：`#5aa8ff` / `#8fd0ff`
  - 奶白：`#fff7ec` / `#f3ead9`
  - 点缀：浅粉 `#ffb7cf`、暖黄 `#ffd479`
- 表情要夸张一点，Q 版才有灵魂：饿的时候眼睛发光、困的时候眼皮打架、被摸尾巴时炸毛。
- 三套服装的剪影要能一眼区分：女仆装是长裙 + 围裙；针织是短裙 + 毛线帽；冬装是棉袄 + 鲸鱼帽。
- 不要给角色加文字气泡、对话框、背景、阴影贴图；透明背景，阴影由壳的 CSS 做。

## 4. 交付物

请交付：

1. `pet/live2d/avatar.js`：完整可运行的 Live2D 适配层，定义 `window.WhaleAvatar`。
2. `pet/live2d/models/maid|knit|winter/`：三套 Cubism 模型（或说明为什么只能交付分层 PSD）。
3. `pet/live2d/vendor/`：**已经就位**（PixiJS 6.5.10 + Cubism Core + pixi-live2d-display 0.4.0），不要再下载或替换。
4. `pet/live2d/README.md`：模型结构、授权、如何替换、如何调试、如何回退。
5. `pet/assets/live2d/`：预览图、分层 PSD（如果有）。
6. 在 README 或交付说明里写清楚你实际验证过的项目（加载、动作、换装、缩放、透明、性能、无外网），不要再新增 `SELFTEST.md`。

## 5. 验收标准

- 打开桌宠窗口，3 秒内出现模型，透明背景，无白底/黑底。
- idle 循环自然，眨眼、呼吸、头发/尾巴轻微摆动。
- 连续点击头/耳/肚子/尾巴/手，动作能打断并切换，不卡死。
- `happy/shy/spin/spray/tail/ear/pout/sleepy/dance/jump/heart/eat` 都能看出来。
- 换装按钮切换三套服装，不刷新页面，不经过网络请求（除了加载模型文件）。
- 窗口缩放到 0.6× 和 1.8× 时，模型仍然完整、底部对齐、不变形。
- 断网时仍然能加载（所有资源本地）。
- 删除/改名 `pet/live2d/avatar.js` 后，`web/avatar-fallback.js` 仍然能正常显示立绘（回退不被破坏）。
- 浏览器控制台无报错；WebGL context lost 后能恢复或至少显示提示。

## 6. 工作方式

- 先列出你打算创建/修改的文件，再动手。
- 不要一次生成所有文件后再检查；每完成一个模型/一个动作，就在本地打开 `web/pet.html` 验证（可以通过插件的 `/dsh-whale/pet?token=...` 打开，或临时起一个静态服务器）。
- 如果 Cubism 模型无法在当前环境生成，**停下来**，先交付：
  - 分层 PSD（头发/脸/眼睛/身体/三套服装/尾巴/鳍耳分开）
  - 每个部件的绑定说明（参数、网格、父子关系）
  - 高质量透明 sprite 立绘（至少三套 + 表情差分）
  - `avatar.js` 的 sprite 版本（仍实现同一 `window.WhaleAvatar` 接口）
  并在 README 里写清楚缺口。不要用假模型糊弄。
- 不要修改后端、设置页、QQ、记忆逻辑；如果发现接口不够用，在 `pet/live2d/README.md` 里写“需要主程序补充”，不要自己改 `lib/`。
- 交付前运行 `node tools/check-live2d.mjs`，把输出贴出来；如果报 ✗，先修到通过再交付。

=== 提示词结束 ===

---

## 给主人的备注（不用发给 Codex）

- Codex 交付后，把 `pet/live2d/` 整个目录放好，关掉桌宠再打开即可（只改静态文件，不需要重启 DSH；改了 `lib/` 才需要重启）。`web/pet.js` 会自动优先加载 Live2D，失败则回退到现在的立绘。
- 如果 Codex 只能给 PSD/分层图，也可以先让 `avatar.js` 用 sprite 差分 + CSS 动效，后续再补 Cubism 绑定。
- 现在的 fallback 立绘已经能用：`pet/assets/maid.png`、`knit.webp`、`winter.png`，以及 `happy/pout/sleepy.webp` 表情贴纸。
- 三套服装的换装按钮在桌宠底部工具栏的 👗，以及设置页「桌宠 → 换装」。
