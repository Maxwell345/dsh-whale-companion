# 小肥鱼 Canvas2D 桌宠动画

本目录继续使用透明 PNG 分层 sprite；运行接口为 `window.WhaleAvatar`，无需构建、npm 包、CDN、Pixi 或 Cubism Core。所有加载均来自当前站点的本地静态路径。

## 本次交付状态

三套服装 maid / knit / winter 均有正面增强、独立左右侧面和无脸背面，支持跳跃、360° 转圈和左右循环攀爬。新增视角属于**离线补绘验证版**：后脑、后衣/裙、后腿鞋、尾背均单独绘制，没有以镜像正面冒充背面。左右侧面分别绘制，保留右侧发饰等不对称细节。

**未完成：新视角达到原立绘同等细节精度的美术精修。** 侧面与背面采用较简化的渐变线稿，转圈时可看出与原正面细节密度的差异；目前只有五个方向关键姿势，缺少3/4方向的过渡帧，相邻方向约32ms短过渡仍可能出现轮廓重影，连续转身的美术精修尚未完成。旧 PSD 和 expressions 导出保持原样，尚未把新增图层合入 PSD；当前动画以 rig.json 引用的 PNG 为准。

## 接口与动作

`init(container, {outfit: 'maid', fps: 60})` 创建透明画布，`ready` 可等待加载。`setOutfit(outfit)` 支持 maid / knit / winter，缓存已经加载的资源，并保留当前动作。`setExpression(name)` 支持 neutral、happy、shy、pout、sleepy、surprised、eat；`setSpeaking(bool)` 控制口型，停止说话时恢复 idle，正在攀爬则继续攀爬。`destroy()` 释放 RAF、图片请求、监听器、缓存与复用画布。

`play(action)` 立即打断并重启动作；数组仍取最后一项，未知动作回到 idle。所有有限动作结束回 idle；climb-left / climb-right 持续循环，可被任何其他 play 调用打断，play('idle') 立即退出。适配层不移动窗口，也不检测屏幕边缘。

| 动作 | 表现 |
|---|---|
| idle | 呼吸、轻摆、眨眼、发梢/双耳/尾巴跟随；幅度仍保持轻微 |
| happy | 更明显的小蹦、笑眼、双臂与摆尾、星光 |
| shy | 缩身、偏头、脸红、两耳抖动和爱心 |
| spin | 1050ms：正面 → 右侧面 → 无脸背面 → 左侧面 → 正面，一次360°后回 idle |
| spray | 抬头、耳动、身形起伏与水滴 |
| tail | 独立摆尾、身体一抖和强调符号 |
| ear | 左右耳有不同相位/幅度，偏头侧躲 |
| pout | 偏头、双臂内收、不满口型与符号 |
| sleepy | 慢呼吸、点头、周期闭眼与哈欠 |
| dance | 左右节奏摆动、起伏、双臂与尾巴运动 |
| jump | 900ms：前162ms蓄力下蹲，随后起跳/滞空，约684ms接地后压缩回弹，回 idle |
| heart | 双臂内收、脸红与胸前爱心 |
| eat | 独立手臂、咀嚼、碗筷与眼部星光 |
| nod / shake | 加大点头 / 摇头，配合发梢和双耳 |
| sit | 加深蹲身压缩；未补独立弯膝坐姿帧 |
| ignore | 更明显偏头、偏身、收臂和不满表情 |
| climb-left / climb-right | 面向对应墙的独立侧姿，约1180ms一循环，手脚交替攀爬，耳/尾/发跟随 |

一般动作姿态增益为旧版的1.5倍。实际关节角仍由 rig 限幅：手臂从0.02提高到0.05弧度，耳从0.02到0.05，尾从0.045到0.09，头从0.015到0.0205，发梢从0.002到0.0027，头部升降从3到4.2源像素。增幅通过关节覆盖补绘后实现；脸、眼、嘴、前发、帽饰和耳保持同组头部变换。

跳跃峰值离地150源像素，旧版约66；蓄力与落地分别有独立压缩曲线。idle沿用原画布比例与锚点，以保持既有热区几何；有限反应动作围绕固定脚底轻微拉远以免发梢触边，跳跃使用完整取景余量。较少动态效果偏好会降低所有运动幅度，但仍可看到转圈的背面。

## 新增素材与 rig 兼容

每套 layers 内新增正面补偿层：

- joint-overlap.png / body-overlap.png：接缝与肩部覆盖；覆盖带扩至约32源像素。
- arm-l-overlap.png / arm-r-overlap.png：手臂根部重叠。
- ear-l-overlap.png / ear-r-overlap.png：独立鳍耳及耳根重叠；冬装耳和肩使用修正后的旋转中心。
- tail-overlap.png：尾根重叠。
- leg-l.png / leg-r.png：从原双腿层拆出的独立左右腿鞋。

旧 PNG 保留，rig.layers 指向增强切片。原有 version:1、layers、bounds、face、maxAngles 保持兼容，新 runtime 也接受没有 views 的旧 rig。新增 headTravel 为头部升降限幅，seamCoverage 记录补偿信息。

rig.views.back / left / right 各自包含 layers，结构仍为 id、src、x、y、width、height、pivot、z；可选 motion 指定 hair、tail、ear-l/r、arm-l/r、leg-l/r、skirt，group:head 指定头部跟随，视角可有独立 maxAngles。

每套新增 layers/{back,left,right}-*.png：hair-back 为长发轮廓，hair-front 为对应方向头部（back-hair-front 是无脸后脑），body / skirt 为衣服和裙摆，leg-l/r 为腿鞋，arm-l/r 为袖手，tail 为尾巴，ear-l/r 为鳍耳，accessory / ahoge 为帽饰及头顶特征。共108张方向图层；侧面只保留可见的一只耳，冬装头顶水花合在帽饰层。后发外围复用原画的蓝色卷发纹理，中央后脑为独立补绘。maid / knit 背面发饰位于屏幕左侧，与正面右侧发饰的空间位置对应。

每套 turnaround-preview.png 是透明三视图预览。[source/build-turnarounds.mjs](../assets/live2d/source/build-turnarounds.mjs) 可离线重绘方向图层和预览，并合并 rig.views；需要本机已有 sharp，WHALE_ASSET_PACKAGE 可指定已有安装的位置。脚本不参与运行时，也不会安装依赖；旧 build-rigs.mjs 会重新生成原正面 rig，不能在本次成果上直接运行，否则会覆盖增强绑定。

转圈中段只绘制背面层，不绘制正面的脸、眼、嘴或脸部特效。所有变换的横向比例均为正，不使用负 scaleX 或 CSS rotateY。相邻方向过渡先把完整分层姿势绘到复用离屏画布，再整体混合，避免关节半透明叠色。正常绘制不逐帧创建 DOM 或 Image。

## 回退和性能

新增视角是可选资源。单个 back / left / right 视角加载失败只禁用该方向；正面动作和服装初始化继续可用。spin 需要三个新视角齐备，否则回退到正面轻摆，不再使用纸片翻转。缺某一侧时对应 climb 保持正面手脚轻摆循环。data-avatar-capabilities 只列出完整素材支持的动作；data-avatar-view 为当前方向，缺图时为 front-fallback。修复素材后需重新 init 或刷新以清除缓存。

正面必要图层/rig 失败时仍使用原静态立绘回退，换装失败时保留上一套可用服装。页面隐藏暂停 RAF，context lost/恢复沿用原适配层行为。

默认60fps；hardwareConcurrency不超过4时自动30fps，也可 init(...,{fps:30})。连续检测到20个超过14ms的绘制慢帧后降到30fps；高配无需重复探测切回。可通过 data-avatar-fps 观察实际绘制频率。帧率受宿主和设备影响，离线浏览器结果不代表所有低配机器。

## 验证与仍需宿主验收

本次不启动 DSH、QQ，不加载宿主 web/pet.js，不调用插件API；测试页面只提供 avatar.js/css、rig和透明素材的本地静态白名单。测试产物放系统临时目录。

2026-11-01 实测：node --check pet/live2d/avatar.js 通过；本机 Chrome headless、280×400、DPR1，三套各19个动作每动作41个时间点全部非空、无脚本异常，最终舞蹈/左右攀爬另以81点复查均无画布边缘裁切。跳跃脚底上移约35px（旧版约17px）；转圈525ms为纯背面；攀爬超过3个循环仍持续，所有新动作可立即打断。分别模拟背面/左侧PNG返回404，仍为ready并正确回退。外部请求0。

正面头、双耳、双手、脚的语义图层与原百分比热区均有像素交集。fps:60实测约60fps，模拟2核默认30fps，注入持续慢帧后也自动降30fps；这些只是在本机离线浏览器的观察。

真实 Electron 窗口、边缘检测调用、热区点击事件和不同 DPI 下的宿主布局仍需维护者验收。这里只验证独立适配层动作、轮廓与固定热区坐标的关系，不宣称已验证真实宿主事件。

## 来源

原立绘的来源与授权沿用 [GENERATION.md](../assets/live2d/GENERATION.md)。本次新增视角按现有比例、衣装配色与鲸鱼特征离线补绘；原参考和角色权利保持原归属。适配代码沿用项目 MIT 许可。没有下载模型、修改 vendor 或生成 moc3。
