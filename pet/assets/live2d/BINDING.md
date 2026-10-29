# 小肥鱼拆层与 Cubism 绑定说明

交付 PSD 是透明原画的**切片动画稿**，不是已完成 ArtMesh、变形器与参数绑定的 Cubism 工程。切片只包含原画可见像素；遮住的皮肤、发根、肩部、尾根等需要补绘后才能做大幅度 Live2D 转头或肢体动作。不要直接将本目录当成可运行 Cubism 模型。

每套包含 `{outfit}-layered.psd`（16真图层）、`layers/{id}.png`、`sprite.png`、`rig.json`、`layer-preview.png` 与7种透明表情差分。图层包括内部接缝底 `joint-fill`；它只在小幅运动时遮盖缝隙，不代表已经补齐被遮挡的人体或服装结构。

## 当前素材坐标和合成

每套目录的 `rig.json` 是坐标依据：`width/height` 为源画布像素，`bounds:[x,y,w,h]` 为角色包围框。不能把固定的 1024×1536 假设用于其他服装。每个图层含 `id/src/x/y/width/height/pivot:[x,y]/z`，pivot 使用整张源画布坐标；按 z 从小到大合成。PNG 的透明通道需要保留，不能加背景、地面或阴影贴图。

`face` 元数据可含 `pivot:[x,y]`、`eyeL/eyeR/mouth:[x,y,w,h]`、`cheekL/cheekR:[cx,cy,rx,ry]`。所有值仍是源画布像素。原点左上，x 向右，y 向下。更换原画后必须同步重测包围框、眼嘴区域和轴心。

Canvas 适配层识别以下图层 ID；实际导出图层以各套 rig 和 PSD 为准：

| ID | 当前运动 / 轴心建议 |
|---|---|
| joint-fill | z=-1 的内部接缝底，不独立运动；只补当前动作的小缝隙 |
| body | 躯干和该套服装；随整身轻微呼吸，主轴在脚底中心 |
| legs | 独立腿袜鞋切片，当前仅随整身运动，没有膝部弯曲 |
| arm-l / arm-r | 左/右手臂绕肩轻转；l/r 使用画面左右 |
| tail | 绕尾根摆动，位于身体之后 |
| hair-back | 后长发绕上部发根轻摆 |
| face | 绕颈部轴心轻摆，脸红叠加在此层后 |
| ear-l / ear-r | 跟随头部，再绕鳍根反向摆动 |
| eye-l / eye-r | 跟随头部；正常开眼保留原片，闭眼替换为曲线，不纵向压扁 |
| mouth | 跟随头部；中性使用原切片，其他表情和说话使用简单口型 |
| hair-front | 跟随头部并轻摆，遮住额头或眼部边缘 |
| accessory / ahoge | 发饰/帽子跟随头部；呆毛另有轻摆 |
| 其他 ID | 按 z 合成，不自动获得专用局部动作 |

这些是刚性小幅变换，不是连续网格变形。当前每只眼是包含眼白、虹膜、瞳孔高光与睫毛（以及少量周边皮肤）的整眼切片，不能独立追踪眼球或变形眼睑。开眼时原片保持原尺寸，闭眼时切换为曲线；sleepy 通过周期闭眼和哈欠表达。闭眼线条、开口、脸红、水滴、碗与爱心由 Canvas 绘制。没有完成虹膜追踪、下眼睑、手指或背面转身绑定。

当前 rig 标记 `articulation:"overlap"`，`maxAngles` 以弧度限制局部动作：arm=0.02、hair=0.002、ear=0.02、tail=0.045、head=0.015，头部纵向位移额外限制为±3源像素。独立部件只做小幅运动，尾巴被摸等夸张反应主要是整体 flinch、表情与特效。脸基底补色和 joint-fill 只适合这套范围；正式 Cubism 或扩大参数前必须补绘遮挡区域，不能把这些底色当成完整原画。

表情差分的 frames.json 使用 rendered-canvas 坐标；把裁片贴回同目录的 base.webp 中性对位底图，不要直接贴回原 sprite.png。base.webp 为无损压缩，已逐像素验证可见颜色与透明度不变。运行时仍独立读取 rig.json 与 layers/，不加载这些交接差分。

## PSD 导入前的必要补绘

1. 以各套 PSD 原尺寸打开，保留透明背景与图层名称。核对所有层合成与 sprite.png 一致。
2. 沿遮挡交界补绘重叠：发根/刘海下的额头，眼嘴下的完整肤色，肩膀到袖子内缘，袖口后的手腕，裙子后的腿，身体后的尾根，帽子下的头发。建议补足可见边界外约 15–30px，实际按网格最大变形量确定。
3. 眼睛继续拆为左右眼白、虹膜、瞳孔高光、上/下眼皮、睫毛和眉；嘴拆上唇、下唇、口腔、舌头。保留一份原图作为对位参考，勿参与最终导出。
4. 将长发按左右外侧、内侧、发尾分组，前发按刘海束拆分；尾柄与左右横向尾鳍分开，鳍耳内外面分开。服装按躯干、裙/围裙、左右袖、装饰、袜/靴与手分别补齐。
5. 做真正 spin 时还需补侧面/背面原画并设计可见性切换；当前正面切片无法可靠推断背面。真正 sit、双手比心和吃饭握持也需要专用手/腿姿态。

## 建议的 Cubism 变形器层级

```text
RootScale（脚底中心，对应窗口整体缩放）
└─ BodyBreath
   ├─ TailRoot → TailBend → TailFinL / TailFinR
   ├─ HairBackRoot → HairBackL / HairBackR / Tips
   ├─ BodyAngle
   │  ├─ CostumeBody → Skirt / Apron / SweaterHem / CoatHem
   │  ├─ ArmL → SleeveL → WristL → HandL
   │  ├─ ArmR → SleeveR → WristR → HandR
   │  └─ LegL / LegR → Sock / Shoe / Boot
   └─ Neck → HeadAngle
      ├─ Face → EyeL / EyeR / Brows / Mouth / Blush
      ├─ EarL / EarR
      ├─ FrontHair → Bangs / Ahoge
      └─ HeadAccessory（蕾丝发箍 / 针织帽 / 鲸鱼帽）
```

这是正式绑定的建议层级，当前 rig 采用绘制顺序与轴心，不是该 Cubism 层级的序列化。三个服装可以各自导出独立模型，保持参数命名和取值一致，便于未来换装时迁移姿态。

## 参数与初始安全范围

下表仅是**完成补绘后正式 Cubism 模型**的建议起点，不是当前 sprite 已实现的参数；当前实际限幅见前文 maxAngles。

| 参数 | 建议范围 / 默认值 | 绑定对象与注意点 |
|---|---|---|
| ParamAngleX / Y / Z | -20…20° / 0 | 头左右、上下、倾斜；切片补绘前先限制到约 ±5° |
| ParamEyeLOpen / ROpen | 0…1 / 1 | 眼皮闭合；眼白、虹膜用裁切遮罩，闭眼不能只压扁眼球 |
| ParamEyeBallX / Y | -1…1 / 0 | 两眼虹膜及高光轻移，保持在眼白裁切范围内 |
| ParamMouthOpenY | 0…1 / 0 | 口腔与唇形；桌宠说话建议只用约0…0.45 |
| ParamMouthForm | -1…1 / 0 | 嘟嘴、普通、笑嘴 |
| ParamBrowLY / RY | -1…1 / 0 | 眉毛上下与角度，避免穿过刘海 |
| ParamBodyAngleX / Y / Z | -8…8° / 0 | 躯干转动、前后、倾斜 |
| ParamBreath | 0…1 / 0 | 胸腹与衣摆轻微伸缩，幅度约1–2% |
| ParamArmL / R | -25…25° / 0 | 肩部及袖子，局部旋转随躯干；大抬手需补绘腋下 |
| ParamHandL / R | -1…1 / 0 | 手腕和姿态差分，不能用缩放代替手指形变 |
| ParamLegL / R | -10…10° / 0 | 短腿和脚；坐姿需另做膝部或差分 |
| ParamTail | -20…20° / 0 | 尾根、尾柄与横向尾鳍的延迟运动 |
| ParamTailCurl | -1…1 / 0 | 害羞收尾、被摸尾巴急缩 |
| ParamEarL / R | -12…12° / 0 | 鳍耳绕根轻摆，受惊时短促抖动 |
| ParamHairFront / Back | -1…1 / 0 | 刘海和后发物理输出，发尾与根部相位不同 |
| ParamCloth | -1…1 / 0 | 围裙、裙摆、毛衣/棉袄下摆 |
| ParamBlush | 0…1 / 0 | 淡粉红晕的不透明度 |
| ParamSpray | 0…1 / 0 | 头顶/鲸鱼帽水花差分与透明度 |

参数范围是起点；必须在四角组合形态检查穿插，不能只检查单参数端点。沿用标准 Cubism 参数名，追加自定义参数时在三套模型中保持一致。

## ArtMesh 与物理建议

脸部轮廓先建稀疏网格，眼角、眼睑、嘴角和下颌处局部加密；眼睛与嘴的网格需能完整闭合。长发沿发束方向布网，根部点固定，卷曲发尾增加横向分段。裙摆与围裙沿外缘细分，褶皱保持连续；鳍耳和鲸鱼尾鳍沿根到尖布网，避免在根部形成锐折。纹理图可从2048×2048开始，边缘留足透明扩展，最终按实际导出体积控制每套小于15MB。

以 AngleX/BodyAngleZ 为轻量输入，分别驱动头发、衣摆、尾巴和鳍耳；先用低摆幅、高稳定性方案，逐步调整延迟与回弹。尾巴不能带动整条腿，鳍耳不能拉伸整张脸。动作负责大姿态，物理只补小幅跟随；说话口型要与 motion 参数有明确混合顺序，结束后回到自然闭合。

## 正式模型导出验收

在 Cubism Editor 预览 neutral、happy、shy、pout、sleepy、surprised、eat，再逐个导出17个动作（idle循环，其他可打断）。导出真实 `.moc3`、`.model3.json`、纹理、motion3、exp3 和 physics3，核对每个 FileReferences 都是本地文件。只做 PSD/JSON 改名不构成模型。

当前 avatar.js 仅消费 sprite rig；接入导出模型需要按 [适配层 README](../../live2d/README.md) 替换为真正的 Cubism 实现，并保持现有 WhaleAvatar 接口。原 vendor 不需要更换或安装。
