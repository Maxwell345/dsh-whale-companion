# 小肥鱼桌宠适配层

当前交付为 **Canvas2D 分层 sprite 动画版**。本环境没有可导出合法 `.moc3` 的 Cubism 工程与 Editor 工作流，因此按需求交付透明立绘、表情差分、分层 PSD 和绑定说明；没有伪造 `.model3.json`。本版不等于已绑定的 Cubism 模型。

## 文件与运行方式

- `avatar.js`：静态脚本，定义 `window.WhaleAvatar`；无需构建或安装依赖。
- `avatar.css`：适配层自行加载的透明画布样式。
- `../assets/live2d/{maid,knit,winter}/`：每套含 `sprite.png`、`rig.json`、`layers/{id}.png`（16层）、`{outfit}-layered.psd`、`layer-preview.png` 和 `expressions/{neutral,happy,shy,pout,sleepy,surprised,eat}.png`。
- [生成记录](../assets/live2d/GENERATION.md)：生成工具、参考用途与提示词。`../assets/live2d/source/build-rigs.mjs` 为离线重打包脚本，引用本机预装 sharp 的固定路径；运行桌宠无需该脚本或 sharp，换机器重打包需调整工具路径。
- [绑定说明](../assets/live2d/BINDING.md)：当前切片结构、Cubism 后续网格与参数建议。
- `models/{maid,knit,winter}/README.md`：正式 Cubism 模型尚未提供的状态记录。

`web/pet.js` 原样动态加载本文件，再调用 `init(#avatar, { outfit })`。所有运行资源来自 `/dsh-whale/static/pet/…`，没有 CDN、字体或模型外网请求。三套服装轮廓分别为长裙围裙、毛线帽短裙和鲸鱼帽棉袄。

`expressions/*.png` 是透明静态差分导出，方便美术检查和后续绑定；当前 runtime 使用分层 PNG 加程序口型/闭眼/脸红，不逐帧加载这些全身预览。

## 接口

`init(container, { outfit: 'maid' })` 创建透明 Canvas，按容器等比缩放并贴底，支持 ResizeObserver 和窗口 resize。桌宠 CSS 为顶部拖动条预留 42px，角色与工具栏间保留间距；画布内部另留动作余量。`init` 返回适配层实例；可选的 `WhaleAvatar.ready` Promise 便于调试等待首套素材。

`play(action)` 立即打断旧动作，重复调用会重新播放；未知输入回到 idle。数组输入取最后一个动作，正常壳已经逐项调用，无需传数组。非 idle 动作结束后恢复 idle。`setExpression(name)` 支持 neutral、happy、shy、pout、sleepy、surprised、eat；动作期间采用该动作的表情，结束后恢复手动表情。

`setOutfit(outfit)` 只加载本地 rig 和 PNG，不调用模型或后端；已加载服装缓存在内存中。切换保留动作时间和表情；并发切换只接受最后一次请求。无效服装忽略。`setSpeaking(true)` 用轻微口型和 CSS 光效表达说话，`false` 恢复 idle；没有音频分析。`destroy()` 取消 RAF、素材请求与相关计时器，清除事件、ResizeObserver、缓存和画布，可再次 init。

| 动作 | 当前 sprite 表现 |
|---|---|
| idle | 呼吸、轻摆、眨眼及头发/尾巴/鳍耳轻动 |
| happy | 小蹦、笑眼、摆尾和星光 |
| shy | 整体轻缩、脸红、鳍耳轻动和小爱心 |
| spin | 横向压缩与侧摆模拟转身，使用正面切片，没有背面帧 |
| spray | 头部轻抬、身形起伏和头顶水滴 |
| tail | 小幅独立摆尾、整体一抖、惊讶表情与强调符号 |
| ear | 鳍耳小幅抖动、整体侧躲与不满口型 |
| pout | 头部轻偏、手臂轻动、不满口型和生气符号 |
| sleepy | 周期闭眼、哈欠、头部轻降和慢呼吸；原壳的 Zzz 仍由壳管理 |
| dance | 整体左右摆和起伏，双臂与尾巴小幅节奏变化 |
| jump | 上跳、伸缩、落地回弹 |
| heart | 双臂轻动、脸红与胸前爱心；没有手指骨骼 |
| eat | 碗与筷子叠加、咀嚼与眼部星光，手臂小幅独立运动 |
| nod / shake | 小幅点头 / 轻摇，配合整体起伏或侧摆 |
| sit | 下蹲伸缩姿态，没有独立弯腿坐姿帧 |
| ignore | 头部轻偏、整体偏身与不满表情 |

局部动作受当前切片接缝限制：手臂/鳍耳约±0.02弧度、头发约±0.002、尾巴约±0.045、头部约±0.015，头部升降最多±3源像素。夸张反应主要通过整身运动与表情/特效表达；不能据此视为大幅关节绑定。眨眼在原始开眼切片与闭眼曲线间切换，不纵向压扁或半透明叠放眼球。

## 回退与故障

浏览器没有 Canvas2D 时，本脚本不定义 `WhaleAvatar`，原壳继续加载 `web/avatar-fallback.js`。删除或改名 `avatar.js` 也沿用原 fallback，原素材未被覆盖。

素材加载/绘制失败时，壳不会等待异步 init，因此适配层内部显示原 `pet/assets` 立绘。换装失败但旧 rig 仍可用时保留旧服装；错误不循环刷屏。Canvas context lost 时显示原立绘，恢复后重取 2D context。此版正常路径没有 WebGL/Pixi 实例，因此不能据此声称完成真实 Cubism WebGL 恢复验收。

当前 sprite 路径不加载 vendor，也不依赖 `window.Live2DCubismCore`。缺 Core 不影响 sprite。这与将来的 Cubism 路径不同。

## 替换为真正的 Cubism 模型

三个 `models/` 目录当前只含状态说明。需先按绑定文档在 Cubism Editor 完成补绘、ArtMesh、变形器、参数、物理和动作，再导出每套真实的 model3/moc3、纹理、motions、expressions、physics。

当前适配层**不会自动加载 model3**。届时替换 `avatar.js` 为真实 Live2D 实现，并保留同一接口；不必改 `web/pet.js`。可以由该入口执行本地 bootstrap，按以下严格顺序加载：

1. `/dsh-whale/static/pet/live2d/vendor/pixi.min.js`（6.5.10）
2. `/dsh-whale/static/pet/live2d/vendor/live2dcubismcore.min.js`
3. `/dsh-whale/static/pet/live2d/vendor/pixi-live2d-display-cubism4.min.js`（0.4.0）
4. 新的 avatar 实现，再调用 `PIXI.live2d.Live2DModel.from(本地模型路径)`

Cubism bootstrap 必须检查 `window.Live2DCubismCore`、PIXI 版本与 Live2DModel；缺失或加载失败时不要注册不可用的全局接口，并让原 fallback 接手。当前 vendor 三个文件不需安装、更新、替换或重新下载。不要升级 PixiJS 7/8，不要发布 Core。

## 调试

在项目根目录执行：

```powershell
node tools/check-live2d.mjs
```

`check-live2d.mjs` 只做结构检查；真正的视觉/动作/换装验收请在 DSH 桌宠窗口里做。`qa/` 目录已经移除，不再提供本地 mock 预览服务器。

在控制台可运行：

```js
WhaleAvatar.play('spray')
await WhaleAvatar.setOutfit('winter')
WhaleAvatar.setExpression('shy')
WhaleAvatar.setSpeaking(true)
WhaleAvatar.setSpeaking(false)
document.getElementById('avatar').dataset
```

`data-avatar-state` 包含 loading、ready、fallback、outfit-unavailable、context-lost-fallback；`data-avatar-outfit/action/expression/replay/fps` 供检查。fps 是适配层画帧统计，不是独立性能保证。默认以 60fps 调度；报告硬件并发数不超过4时自动采用30fps。调试/低配可用 `init(container, { outfit:'maid', fps:30 })`；隐藏页面暂停 RAF，减少动态效果偏好会降低运动幅度。

## 需要主程序补充

原 `web/pet.js` 换装按钮会先 POST `/dsh-whale/api/pet/outfit` 保存状态，再调用 setOutfit，所以“整个换装按钮完全无后端请求”目前不成立。此交付遵守边界未修改它；适配层 setOutfit 本身只读取本地静态素材。若要按钮断开后端后仍可换装，需要主程序维护者调整壳层逻辑。

原 `web/pet.js` 还会将 actions 数组按420ms间隔串行调用，旧回复的定时链不会被新回复取消。适配层的单次 play 已立即打断；若要防止旧回复后续动作覆盖新回复，需要主程序维护者取消旧链或给回复加序号。

真实 DSH 的授权路由、Electron 透明窗口和宿主窗口缩放需在运行中的插件内验收。

## 来源和授权

原画通过内置 imagegen 根据用户提供的造型、配色和比例参考生成，再为本项目拆层。没有安装第三方插件或拷贝其他桌宠实现。用户参考图和角色相关权利仍归权利人；这些素材按本次授权用于此本地项目，未据此取得参考图或角色的公开再分发权。

适配代码沿用项目 MIT 许可；PixiJS 和 pixi-live2d-display 的许可文件保留在 vendor。Cubism Core 受 Live2D 单独许可约束，仅在当前本地项目使用，不提交公共仓库或打入公开发布包。
