# 小肥鱼 Canvas2D 桌宠动画

运行时仍是透明 PNG + Canvas2D sprite，定义 window.WhaleAvatar。无需 npm 安装、构建、CDN、Pixi 或 Cubism Core；运行资源全部来自当前站点的本地静态路径。

## Knit 12帧运行时（2026-11-03）

knit现使用已通过的六格修正版与原候选中的六格合并安装。[最终联系表及安装说明](../assets/live2d/knit/turnaround/knit-12-contact-final-notes.md)记录逐格来源；最终图为knit/turnaround/knit-12-contact-sheet-final.png。原十二格、六格及其说明均保留作历史记录。本轮没有重画或调用imagegen。

knit/turnaround12/新增00-front至11-330共12张1100×1494透明RGBA，均保持本套原身高1437px、顶点y25、脚底y1461（Alpha>16）。00用原sprite扩透明画布，其余帧由联系表等比恢复原身高，头发、尾巴、鞋完整，不做额外缩小或播放时放大补偿。可见轮廓在帧内中心x550/550.5，renderOffsetX为3/2.5，与通用−24px帧宽偏移一起保持原绘制中心x529。

仅在knit/rig.json增加turnaround12配置，复用现有通用JS，不修改maid或winter。顺序00→01→…→11→00，总1100ms、每段约91.6667ms、段末40ms线性淡化，没有220ms停留。90°朝右、180°为完整背面、270°朝左；奶油针织毛衣背部和格裙保持原设计，没有maid围裙、X背带或大腰结。

旧turnaround四帧与其配置完整保留，12帧任一缺失或无效即回退旧四帧。jump、climb及其他动作代码不变。帽沿织法和后侧角度细节按已接受原型保留；短淡化仍可能有短时叠影。下文maid阶段记录与旧四帧说明保留供回退参考。

本次离线Chrome验收：knit12/12加载，110个渲染采样无空图/裁切，240×320下全程人物高293px，与idle相同；1100个1ms姿态采样无整体缩放或镜头位移。模拟缺07-210.png时回旧四帧，三个旧spin采样与基线一致。其余168个动作采样逐像素不变（含maid12），jump/climb与快切正常，外部请求及脚本异常均为0。node --check通过，浏览器/本地服务已关闭。实际播放没有220ms停顿；150→180和210→240的40ms混合仍可见短双帽沿/呆毛及衣腿轮廓，按已接受原型保留。

## Maid 12帧运行时（2026-11-02）

maid现优先使用已通过美术初检的本机12格联系表裁出的turnaround12资源。本轮没有调用imagegen、上传大图或重画联系表；knit/winter及所有旧四帧保持原样。下文四帧说明仍适用于旧路径和回退。

新增文件位于 ../assets/live2d/maid/turnaround12/：00-front.png、01-030.png、02-060.png、03-090.png、04-120.png、05-150.png、06-180.png、07-210.png、08-240.png、09-270.png、10-300.png、11-330.png。

12张全部为1100×1494透明RGBA，Alpha>16人物高度均为1431px、顶点y26、脚底y1456，与现有turnaround/front.png相同。采用等比重采样，完整保留头发、尾巴和鞋；完整轮廓中心对齐x550，保留不同方向自然的脚形投影。240°全Alpha宽1075px，有效左右透明余量各约12.5px。没有把角色缩到1395px，也没有播放时再放大补偿。

新尺寸字段置于rig.turnaround12（保留rig.turnaround旧四帧定义）：frames包含00–11的本地路径，frameOrder明确顺序，frameCount为12，frameWidth为1100、frameHeight为1494，durationMs为1100，crossfadeMs为40。renderOffsetX仅为0或−0.5像素的取整补偿，没有renderScale或renderAnchor。

运行时按每组实际frameWidth/frameHeight加载和分析；每个帧缓存实际宽高，绘制和轮廓行扫描均使用实际1100宽度。自动居中偏移为(rig.width−frame.width)/2=−24，再叠加renderOffsetX；不把图片截成旧1052宽。旧四帧默认仍为1052×1494，偏移为0。

spin按00→01→…→11→00均匀推进，总1100ms，每段约91.6667ms；每段末40ms线性淡化到下一帧，没有220ms停留，也没有每边界smooth缓入缓出。275/550/825ms分别为纯90°/180°/270°。12帧路径保留细微发梢、鳍耳、裙摆和尾巴纹理随动，禁用旧四帧的25ms头部特殊交接、整体取景拉远、整体旋转/平移和尺寸补偿，首尾不突然缩放。播放结束回idle，play接口和立即打断保持不变。

12帧任一缺失、为空、尺寸错误或分析失败时，整套回退现有turnaround四帧；不删除旧文件，不影响初始化。新12未生效时，旧四帧及其他动作保持原行为。

最终本地Chrome检查（240×320、DPR1）：12/12加载，110个10ms渲染采样身高均为293px，与idle相同，无空图或画布边缘裁切；1100个1ms姿态采样sx/sy恒为1，camera/x/y/r/head/headY恒为0。其余168个动作采样与本轮修改前逐像素一致（knit/winter114个、maid非spin54个）；缺帧回退四帧的三个采样也逐像素一致。快切动作/换装通过，无脚本异常、外部网络或白名单外资源请求。测试未启动DSH/QQ或真实Electron宿主。

实际观感：90°/270°为独立侧廓，180°为完整背面，已经没有旧220ms停顿或整体拉远。120°→150°呆毛拱向变化在局部放大时仍可见，40ms短混合有短时双轮廓，正常240宽播放属轻微；210°仍较接近背面，但头饰、腰结和尾位有变化。本轮未扩展重画或修改这两处已初检通过的美术，保留供用户实际播放复核。

## 旧四帧转圈素材与回退

maid、knit、winter 均新增 turnaround/front.png、right.png、back.png、left.png，以及各套目录下的 turnaround-preview.png 四视拼图。每张帧为1052×1494透明 PNG；front直接复制本套sprite.png，保持字节一致。侧面和背面由本次内置imagegen参考原画生成完整上色位图，没有使用程序化线条、SVG、正面镜像或前图压窄替代。

先生成并检查maid，再沿用其渲染质量与布局生成knit/winter。保留卷发的渐变与层次、裙摆/衣褶、鞋袜、尾巴和不对称帽饰；背面无脸、眼、嘴。选用的三套联系表都带原生Alpha，未采用绿色候选去背。透明像素残留RGB已清理，抗锯齿仍保留。

素材来源、选用原稿和提示词分别见：

- [maid/turnaround/GENERATION.md](../assets/live2d/maid/turnaround/GENERATION.md)
- [knit/turnaround/GENERATION.md](../assets/live2d/knit/turnaround/GENERATION.md)
- [winter/turnaround/GENERATION.md](../assets/live2d/winter/turnaround/GENERATION.md)

工具未返回可核验的后端模型版本号，因此来源记录为builtin-imagegen。原画参考和角色权利保持原归属，适配代码沿用项目MIT许可。

## Spin的帧顺序与过渡

play('spin') 播放约1100ms：front → right → back → left → front；每方向段220ms，结束回idle。四次100ms交叉淡化分别位于170–270、390–490、610–710、830–930ms；490–610ms只绘完整背面。使用新turnaround帧，不再为spin绘制上一版简化的背面/侧面层。

完整帧保留轻微水平位移、正比例缩放及由原姿态相位驱动的发梢、裙摆、鳍耳、尾巴纹理随动。加载时一次性读取Alpha轮廓，转场按共同轮廓配准以减轻双边；复用离屏画布，不逐帧创建Image或读取像素。横向比例始终为正，不使用scaleX(-1)或rotateY。

为缩短重复眼睛持续时间，头部内部采用25ms连续交接，外围发丝和衣裙仍为100ms。这个局部时间短于整帧淡化要求，属于当前折中。精确过渡中点仍可能出现短时叠影，衣裙内部装饰也会混合；没有宣称完全消除所有双轮廓。

## 对齐与已知瑕疵

裁切时按连通组件保留完整发梢和尾巴，等比缩放并对齐鞋底。rig.turnaround.renderOffsetX记录为了容纳宽轮廓而加入的横向余量，运行时反向补偿共同转轴；spin另根据实际轮廓平滑留出安全余量，脚底锚点固定。

- maid / knit：四帧总身高和鞋底基线已对齐；侧面脚形/发束与正面存在自然透视差异。
- winter（有瑕疵候选）：背面轮廓较宽，等比适配画布后身高约比其他方向小4.7%，鞋底仍对齐。背面顶部约y92，其他方向约y23–24；400px高测试中约低14px。完整上色和服装细节已完成，但比例一致性没有完全通过。
- 四方向关键帧没有额外3/4方向插画；目前靠短时变形与混合过渡，转场精确中点仍有细节混叠风险。

## Rig、打包与回退

rig.turnaround包含frames的四个本地相对路径、source、frameHoldMs:220、crossfadeMs:100和renderOffsetX。frames的尺寸必须与rig.width/height相同且四张齐备；空图、无效路径、加载失败或像素分析失败只禁用本套新spin，初始化和其他动作继续可用。缺帧时spin回退正面轻摆，避免加载旧简化背面冒充完成；修复素材后重新init或刷新以清缓存。

诊断字段：data-avatar-spin-source为turnaround或front-fallback；data-avatar-view记录turnaround-front/right/back/left等当前方向。data-avatar-capabilities只列出素材完整支持的动作。

[source/pack-turnaround.mjs](../assets/live2d/source/pack-turnaround.mjs) 仅做Alpha清理、组件裁切、等比重采样、对齐与安装，不绘画。需要本机已有sharp；可用WHALE_ASSET_PACKAGE指向已有安装。示例：

    node pet/assets/live2d/source/pack-turnaround.mjs --outfit maid --sheet ORIGINAL_CONTACT_SHEET.png --install

--install默认直接写本套允许的正式素材目录，避免依赖C盘临时空间；不带--install则写系统临时目录，也可用--output指定预览输出。原联系表保留在Codex生成目录，不参与运行时。旧build-rigs.mjs和build-turnarounds.mjs属于上一版资源流程，不能直接重跑覆盖本次成果。

## 原接口与动作

init(container,{outfit})、play(action)、setOutfit(outfit)、setExpression(name)、setSpeaking(bool)、destroy()接口保持不变；ready可等待加载，maid/knit/winter均可换装。play立即打断旧动作，不排队；未知动作回idle，有限动作结束回idle。climb-left/right继续循环，直到其他play打断；不移动窗口或检测屏幕边缘。

idle、happy、shy、spray、tail、ear、pout、sleepy、dance、jump、heart、eat、nod、shake、sit、ignore继续使用原增强分层；jump仍约900ms，包含蓄力、离地、滞空、落地回弹。climb仍使用上一版独立左右分层侧姿和交替手脚，本阶段没有替换该路径。旧layers、表情差分和PSD保留。

默认60fps，hardwareConcurrency不超过4时自动30fps；可用init(...,{fps:30})指定。持续检测到慢帧也降到30fps，页面隐藏暂停RAF。较少动态效果偏好降低运动幅度。正面必需素材失败、context lost/恢复和换装失败的回退沿用原实现。

## 验证范围

本次使用独立本地静态测试页，不加载web/pet.js、不启动DSH或QQ、不调用插件API，也不访问数据目录。实际检查包括透明边缘/尺寸/脚底、spin帧顺序与中段背面、原动作回归、打断与缺帧回退；具体结果以本次测试报告为准。node --check pet/live2d/avatar.js通过。

最终集中检查（2026-11-01，Chrome headless，280×400、DPR1）：三套均ready，19动作各21个采样均非空，无脚本异常及外部请求。spin三个服装均无边缘裁切，550ms为纯背面，1100ms后回idle；spin/jump/climb/eat均可立即被happy打断，攀爬超过3个循环仍持续，play('idle')终止。分别模拟背面帧404仍ready并回退正面轻摆。12帧均为真实Alpha，鞋底分别maid1456、knit1461、winter1462，front均与原sprite字节相同。

本次保留原动作代码路径；集中扫描发现winter旧ear动作仍有6–8像素脚底触边，未扩大本阶段范围修改。新spin的边缘扫描通过；精确中点叠影和winter背面比例差异仍是已知问题。

真实Electron透明窗口、宿主热区点击和不同设备的表现仍需维护者验收；运行时无外部联网依赖或新增npm包。
