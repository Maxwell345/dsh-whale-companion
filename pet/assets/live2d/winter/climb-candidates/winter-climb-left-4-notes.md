# winter LEFT 四帧候选

本轮使用内置imagegen完整重绘4张冬季装人物；仅交候选联系表和说明，不安装运行时。起始工作区干净，实际HEAD为`7fb2888`；未切换或移动HEAD。

## 素材和画布

- 唯一身份/服装来源：`pet/assets/live2d/winter/sprite.png`。工具参考使用从该原图缩小的小图。
- 姿势来源：knit v4四帧联系表及其单格小图，仅参考姿势、左墙、前后肢体深度和节奏；未复制其针织帽、毛衣、格裙或玛丽珍鞋。
- 全部为winter鲸兜帽、两瓣浅蓝白水花、侧鳍、白毛帽口、围巾、藏青冬coat、毛边、鲸/雪花/波纹刺绣、白袜、毛口藏青冬靴、蓝长发和鲸尾；无maid元素。
- 联系表2200×2988 RGBA，2×2；左上01、右上02、左下03、右下04。每格1100×1494透明画布，无墙、地面、阴影、文字或网格。
- 原始4张实际均1024×1536、不透明中性深灰底。提示词请求的1536×2304不是实际返回尺寸，不将其作为交付分辨率。
- 先在原生尺寸抠图，再全部使用同一比例`0.94986979`缩小整幅至973×1459；平移并补透明画布。没有放大、非等比拉伸、旋转、镜像或鞋袜局部拼贴。

## 四帧动作与冬靴后帮

建议候选循环顺序为01→02→03→04→01，尚未安装或进行主机播放验收。

|帧|手和腿分工|冬靴包跟检查|
|---|---|---|
|01|近侧手高抓在前，远侧手低撑在后；近侧腿伸展支撑，远侧膝高抬。|高位远靴和低位近靴均为连续封闭冬靴。后帮围住袜脚跟，靴口自然接入脚踝，没有开后口或挂在脚尖。|
|02|远手抬到胸口并被近侧高手袖遮挡；远膝向下展开，近侧支撑腿伸展。|上靴在近直腿后，下靴为支撑靴；两靴鞋面、靴筒、后帮和后鞋底均连续，后跟在靴内。|
|03|远手高抓在后，近手低撑在前；远侧腿伸展支撑，近侧膝高抬。|近侧高位靴处于前景并遮住远直腿交会位置；两只靴的完整后帮均包住脚跟。|
|04|近手抬至胸前且腕部在前景；近膝向下展开，远侧支撑腿伸展。|近侧移动靴在前，远侧低靴在后；两靴全封闭，白袜仅在毛口上方露出，未见露跟、半脱或分离鞋腔。|

逐只查看了八靴：前掌/鞋尖小段朝左墙接触，前掌弯折和鞋面褶皱保留，足弓离开墙面，后半鞋底接近水平；没有整只靴子旋转成竖板。全部仍为带白毛口、蓝蝴蝶结/白毛球与雪花的冬靴，不是开放脚背的玛丽珍鞋。

## 对齐与 wallInset

不用脚底基线对齐。四帧使用统一缩放率并将可见虹膜眼心高度置于约y=500；横向在头部位置与墙侧接触点间折中。人工眼心估算约±3px，03衣料点约±5px。眼心最终横向跨度约13.2px，纵向跨度小于1px。

髋被长coat遮挡，门襟/下摆交会点只是衣料检查点，随高膝折叠而移动；未把该点当成精确骨盆点驱动不同缩放，也不宣称骨盆逐像素锁定。

`wallInsetPx`为每格alpha≥128的全部可见轮廓最左x；`wallInset`=wallInsetPx/1100。衣袖/指节可比靴尖更突出，因此另列两只靴的实际最左接触x。

|帧|整幅平移(x,y)|眼心约(x,y)|wallInsetPx|wallInset|高手外缘x约值|上/下靴尖x|
|---|---|---|---:|---:|---:|---|
|01|2, 39|303, 500|33|0.03000|42|33 / 38|
|02|0, 16|303, 500|29|0.02636|30|33 / 35|
|03|-9, 33|312, 500|22|0.02000|22|26 / 25|
|04|12, 19|299, 500|32|0.02909|33|32 / 46|

四帧人物越界裁切像素均0；每格四边非透明像素均0，帽顶水花、头发、围巾、手、脚和尾巴完整。

## alpha 处理

1. 原画先绘制在不透明中性深灰底（请求#606060；实际灰底由局部采样估计约RGB90–93）。以边界连通背景、人物连通组件和经原图确认的内部背景孔建立完整前景轮廓，不对白毛/白袜按颜色直接删除。
2. 在原生1024×1536建立确定前景、确定背景和约2px未知边缘trimap。发束、掌根和脸前被围住的真实背景孔另外以局部轮廓mask和背景种子确认；没有把蓝色发束当成灰孔删掉。
3. 未知区取附近内部前景F和背景B，使用C=alpha F+(1-alpha)B局部色线估计alpha，并反解前景RGB去除灰底混色。原生阶段保留完整alpha，最终AA延后到缩小对齐之后。
4. 确定前景逐通道核对如下，包含毛边以外的衣物、袜毛、靴帮及刺绣；原生确定前景RGB改动与不透明丢失均0。该统计不等于每一个未知边缘或极小孔均有语义级保证。

|帧|核对的确定前景像素|RGB改动通道数|非全不透明前景像素|
|---|---:|---:|---:|
|01|733818|0|0|
|02|725470|0|0|
|03|758387|0|0|
|04|731690|0|0|

5. 整幅采用linear核等比缩小和平移后，将半透明限制在轮廓内侧贴背景的一层像素。外侧归零、内部深处归完全不透明；此步骤RGB不变，无Gaussian羽化或Lanczos宽边。之后交付图仅原样拼接成联系表，不再缩放。
6. 四帧最终的越界半透明、深层半透明和跨alpha128双侧半透明邻接对均0；AA的RGB改动为0。已看黑、白、灰底全图及八靴局部；未见明显宽灰晕、白边、露跟或大块切毛。先前脸前、手腕和发尾的内部残灰已清除。

这是完整轮廓/拓扑分割加局部alpha求解，不是仅按颜色硬key，也不是学习式语义matting。局部细发束孔边仍稍硬，最细亚像素孔需美术复核，未用模糊掩盖。

## 原始生成路径

四张深灰底完整原画保留在工具默认目录，未覆盖或删除：

- 01：[exec-f953abc1-826c-42a9-80f1-e0b60e874dc0.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-f953abc1-826c-42a9-80f1-e0b60e874dc0.png)
- 02：[exec-25feda8b-f8a5-4092-9a69-705359f0c1ed.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-25feda8b-f8a5-4092-9a69-705359f0c1ed.png)
- 03：[exec-e3d5d6df-b8d6-401b-bf88-96d49b48ab6e.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-e3d5d6df-b8d6-401b-bf88-96d49b48ab6e.png)
- 04：[exec-182a1fac-8903-4988-a900-a04e4da04420.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-182a1fac-8903-4988-a900-a04e4da04420.png)

## 未完成/待复核

- **接触点未严格统一为同一墙平面。**若以x=33px为参考，03两靴尖在25–26px，偏外7–8px；04下靴尖46px，向内约13px，上靴尖32px、高手约33px。04原生上、下靴尖差约15px；01高手外缘约42px，相对名义墙x33也有约9px内缩。此误差如实保留，未通过移靴补丁或整体变形掩盖。
- 04近膝展开约135–145°，比约120°的过渡更直；四帧节奏和支撑关系已看过，但仍需用户确认步幅。
- 独立整幅绘制的鲸/雪花刺绣、毛球、蓝扣位置和毛边厚度有变化；帽可见鲸眼数量随视角不同，03/04下摆露少量深蓝内衬。整体为同一winter设计，尚非逐像素纹样锁定。
- 本轮只交LEFT候选，未生成RIGHT，未改rig/avatar.js/运行时，未启动DSH或QQ，未访问记忆数据，未commit/push。原有maid、knit和winter已安装素材保持。没有新增npm依赖或模型下载。

## 最终生成提示词

使用内置imagegen，每帧一次整幅生成，未调用12帧流程。完整提示词及原始路径也嵌入PNG的XMP描述。

<details>
<summary>Frame 01 prompt</summary>

Use case: identity-preserve. Create ONE complete full-body WINTER LEFT-WALL-CLIMB animation frame, fully new polished raster anime illustration. No contact sheet, no parts, no pasted shoes.
Image1 is the ONLY authoritative character identity and WINTER outfit reference. Preserve exact chibi proportions, round face, large bright blue star-highlight eyes, long layered indigo-to-cyan hair and blue whale tail.
WINTER CLOTHES ONLY: deep navy whale-shaped hood with white fluffy face-opening trim, black whale eye and pink cheek detail on hood, side fins with pale underside, and the distinctive TWO-LOBED pale-blue/white WATER-SPOUT ornament at its top (not a hair loop). Small blue whale pin on fur rim. Pale icy-blue/white check scarf, navy bow/whale medallion, dangling scarf end with white whale/snowflake motif and white fringes. Navy flared winter coat with plush white fur cuffs, front placket and hem; blue button/bow and white pom-pom closures; white whale/snowflake embroidery and pale blue wave border on lower coat. Plain white socks and NAVY WINTER BOOTS with thick white fur boot cuffs, small blue bows/white pom-poms/snowflake details, rounded toe and dark thick outsole. Exactly the winter design of Image1, not a redesign.
Image2 is a small cropped approved KNIT v4 frame: POSE/LEFT WALL/LIMB DEPTH/RHYTHM reference ONLY. Replace ALL its clothes, cap and shoes with WINTER fromImage1. Never copy knit cable sweater, knit bonnet, plaid skirt, Mary Jane strap/open instep, hair-loop ahoge; never add maid apron, lace dress, X straps or waist apron bow. Image2's body joint positions and left-facing climbing silhouette are the guide, not its costume pixels.

Both WINTER BOOTS must be COMPLETE CLOSED BOOTS, not loose slippers: a continuous navy heel counter wraps fully around the back/sides of the socked heel and meets the boot shaft/upper/sole. The heel is INSIDE the boot cavity. The ankle enters naturally through the fluffy boot cuff. No exposed white heel outside the back, no open instep, no detached heel platform, no half-off boot hanging on toes. Navy boot upper covers the WHOLE foot/ankle.
Only a small TOE/FOREFOOT SOLE patch touches the invisible vertical LEFT wall. Boot bends at its BALL with natural vamp creases; ARCH recedes RIGHT off wall; REAR HALF of sole/heel is almost HORIZONTAL to the RIGHT, while heel stays INSIDE the enclosing navy counter. Do not rotate entire boot into a rigid vertical board, do not plaster whole sole to wall. Both lifted and supporting boots have this anatomy. Both toe contact tips and high gripping knuckles align to ONE vertical left wall plane, around x3.2% of canvas. No painted wall.
Exactly two hands/two arms/two legs/two boots. Both elbows visibly bent. At least one supporting leg near straight in every frame, never both knees folded. High gripping fingers curl into left vertical wall, camera sees knuckles/back of hand; low/moving hand palm faces wall, fingers up-left.

Composition: whole figure nearly fills TALL 2:3 portrait, native1536x2304 requested. It must be rendered natively tall enough to REDUCE onto1100x1494, never enlarged. Small safe margins around hood spout, hair, scarf, hands, shoes, tail. Keep head/hip, coat, scarf and hair/tail placement of reference pose; never align by feet. No clipped part.
Background: entirely opaque, uniform NEUTRAL DARK GRAY #606060, not pure black, no transparency/checkerboard in this RAW image. Gray background visible through actual hair/fabric gaps. No floor, cast shadow, glow, gradient, writing, numbers, frame lines, labels, props or extra character. No white halo around white fur/socks. Detailed fluffy fur and embroidery, same finished rich cel shading and line weight as Image1.
FRAME01 only: match Image2 stance. NEAR hand grips HIGH with NEAR bent supporting arm FOREGROUND. FAR hand LOW at waist, BEHIND. NEAR leg long/STRAIGHT supporting, low boot at wall; FAR knee raised HIGH and bent about80degrees, its lifted boot BEHIND the near straight leg. Keep both foot tips on the same left wall plane. Coat hem follows the raised thigh naturally but remains WINTER coat, no skirt fromImage2. Hood/head and hips fixed in climbing alignment.

</details>

<details>
<summary>Frame 02 prompt</summary>

Use case: identity-preserve. Create ONE complete full-body WINTER LEFT-WALL-CLIMB animation frame, fully new polished raster anime illustration. No contact sheet, no parts, no pasted shoes.
Image1 is the ONLY authoritative character identity and WINTER outfit reference. Preserve exact chibi proportions, round face, large bright blue star-highlight eyes, long layered indigo-to-cyan hair and blue whale tail.
WINTER CLOTHES ONLY: deep navy whale-shaped hood with white fluffy face-opening trim, black whale eye and pink cheek detail on hood, side fins with pale underside, and the distinctive TWO-LOBED pale-blue/white WATER-SPOUT ornament at its top (not a hair loop). Small blue whale pin on fur rim. Pale icy-blue/white check scarf, navy bow/whale medallion, dangling scarf end with white whale/snowflake motif and white fringes. Navy flared winter coat with plush white fur cuffs, front placket and hem; blue button/bow and white pom-pom closures; white whale/snowflake embroidery and pale blue wave border on lower coat. Plain white socks and NAVY WINTER BOOTS with thick white fur boot cuffs, small blue bows/white pom-poms/snowflake details, rounded toe and dark thick outsole. Exactly the winter design of Image1, not a redesign.
Image2 is a small cropped approved KNIT v4 frame: POSE/LEFT WALL/LIMB DEPTH/RHYTHM reference ONLY. Replace ALL its clothes, cap and shoes with WINTER fromImage1. Never copy knit cable sweater, knit bonnet, plaid skirt, Mary Jane strap/open instep, hair-loop ahoge; never add maid apron, lace dress, X straps or waist apron bow. Image2's body joint positions and left-facing climbing silhouette are the guide, not its costume pixels.

Both WINTER BOOTS must be COMPLETE CLOSED BOOTS, not loose slippers: a continuous navy heel counter wraps fully around the back/sides of the socked heel and meets the boot shaft/upper/sole. The heel is INSIDE the boot cavity. The ankle enters naturally through the fluffy boot cuff. No exposed white heel outside the back, no open instep, no detached heel platform, no half-off boot hanging on toes. Navy boot upper covers the WHOLE foot/ankle.
Only a small TOE/FOREFOOT SOLE patch touches the invisible vertical LEFT wall. Boot bends at its BALL with natural vamp creases; ARCH recedes RIGHT off wall; REAR HALF of sole/heel is almost HORIZONTAL to the RIGHT, while heel stays INSIDE the enclosing navy counter. Do not rotate entire boot into a rigid vertical board, do not plaster whole sole to wall. Both lifted and supporting boots have this anatomy. Both toe contact tips and high gripping knuckles align to ONE vertical left wall plane, around x3.2% of canvas. No painted wall.
Exactly two hands/two arms/two legs/two boots. Both elbows visibly bent. At least one supporting leg near straight in every frame, never both knees folded. High gripping fingers curl into left vertical wall, camera sees knuckles/back of hand; low/moving hand palm faces wall, fingers up-left.

Composition: whole figure nearly fills TALL 2:3 portrait, native1536x2304 requested. It must be rendered natively tall enough to REDUCE onto1100x1494, never enlarged. Small safe margins around hood spout, hair, scarf, hands, shoes, tail. Keep head/hip, coat, scarf and hair/tail placement of reference pose; never align by feet. No clipped part.
Background: entirely opaque, uniform NEUTRAL DARK GRAY #606060, not pure black, no transparency/checkerboard in this RAW image. Gray background visible through actual hair/fabric gaps. No floor, cast shadow, glow, gradient, writing, numbers, frame lines, labels, props or extra character. No white halo around white fur/socks. Detailed fluffy fur and embroidery, same finished rich cel shading and line weight as Image1.
FRAME02 only — Image2 is the exchange transition, not the high-knee hold.
NEAR high gripping hand stays fixed at wall, NEAR supporting arm FOREGROUND with acute elbow about65degrees. FAR moving hand has risen to CHEST, wrist BEHIND and partially OCCLUDED by the near high sleeve. This is a distinct far-hand reach, not a foreground hand on the chest.
NEAR leg remains long and STRAIGHT supporting, low boot at same wall; FAR knee OPENS to about120degrees and FAR foot slides DOWN wall from01. The moving knee is BELOW the hip, not tucked high against belly. Thigh slopes DOWN-LEFT from hip, calf goes DOWN to its boot; do NOT repeat01's horizontal raised thigh. Far boot remains BEHIND the near straight leg at overlap.
On a1024x1536 composition grid: eye around(314,490), hip/coat lower-body around(350,990), moving knee around(150,1070), moving ankle/bootcuff around(145,1250); low support boot near y1450. Both toe contact tips at x30–33. Head and hip remain same apparent scale/placement as01, winter coat stays full length. All winter boot heels fully enclosed, no MaryJane or open ankle. Whole new fullbody winter illustration on uniform gray.

</details>

<details>
<summary>Frame 03 prompt</summary>

Use case: identity-preserve. Create ONE complete full-body WINTER LEFT-WALL-CLIMB animation frame, fully new polished raster anime illustration. No contact sheet, no parts, no pasted shoes.
Image1 is the ONLY authoritative character identity and WINTER outfit reference. Preserve exact chibi proportions, round face, large bright blue star-highlight eyes, long layered indigo-to-cyan hair and blue whale tail.
WINTER CLOTHES ONLY: deep navy whale-shaped hood with white fluffy face-opening trim, black whale eye and pink cheek detail on hood, side fins with pale underside, and the distinctive TWO-LOBED pale-blue/white WATER-SPOUT ornament at its top (not a hair loop). Small blue whale pin on fur rim. Pale icy-blue/white check scarf, navy bow/whale medallion, dangling scarf end with white whale/snowflake motif and white fringes. Navy flared winter coat with plush white fur cuffs, front placket and hem; blue button/bow and white pom-pom closures; white whale/snowflake embroidery and pale blue wave border on lower coat. Plain white socks and NAVY WINTER BOOTS with thick white fur boot cuffs, small blue bows/white pom-poms/snowflake details, rounded toe and dark thick outsole. Exactly the winter design of Image1, not a redesign.
Image2 is a small cropped approved KNIT v4 frame: POSE/LEFT WALL/LIMB DEPTH/RHYTHM reference ONLY. Replace ALL its clothes, cap and shoes with WINTER fromImage1. Never copy knit cable sweater, knit bonnet, plaid skirt, Mary Jane strap/open instep, hair-loop ahoge; never add maid apron, lace dress, X straps or waist apron bow. Image2's body joint positions and left-facing climbing silhouette are the guide, not its costume pixels.

Both WINTER BOOTS must be COMPLETE CLOSED BOOTS, not loose slippers: a continuous navy heel counter wraps fully around the back/sides of the socked heel and meets the boot shaft/upper/sole. The heel is INSIDE the boot cavity. The ankle enters naturally through the fluffy boot cuff. No exposed white heel outside the back, no open instep, no detached heel platform, no half-off boot hanging on toes. Navy boot upper covers the WHOLE foot/ankle.
Only a small TOE/FOREFOOT SOLE patch touches the invisible vertical LEFT wall. Boot bends at its BALL with natural vamp creases; ARCH recedes RIGHT off wall; REAR HALF of sole/heel is almost HORIZONTAL to the RIGHT, while heel stays INSIDE the enclosing navy counter. Do not rotate entire boot into a rigid vertical board, do not plaster whole sole to wall. Both lifted and supporting boots have this anatomy. Both toe contact tips and high gripping knuckles align to ONE vertical left wall plane, around x3.2% of canvas. No painted wall.
Exactly two hands/two arms/two legs/two boots. Both elbows visibly bent. At least one supporting leg near straight in every frame, never both knees folded. High gripping fingers curl into left vertical wall, camera sees knuckles/back of hand; low/moving hand palm faces wall, fingers up-left.

Composition: whole figure nearly fills TALL 2:3 portrait, native1536x2304 requested. It must be rendered natively tall enough to REDUCE onto1100x1494, never enlarged. Small safe margins around hood spout, hair, scarf, hands, shoes, tail. Keep head/hip, coat, scarf and hair/tail placement of reference pose; never align by feet. No clipped part.
Background: entirely opaque, uniform NEUTRAL DARK GRAY #606060, not pure black, no transparency/checkerboard in this RAW image. Gray background visible through actual hair/fabric gaps. No floor, cast shadow, glow, gradient, writing, numbers, frame lines, labels, props or extra character. No white halo around white fur/socks. Detailed fluffy fur and embroidery, same finished rich cel shading and line weight as Image1.
FRAME03 only — OPPOSITE half-cycle from01. Match Image2.
FAR hand grips HIGHER on left wall, FAR high supporting sleeve/arm is BEHIND head/body and near lower hand. NEAR hand stays LOW near chest/waist, palm to wall, foreground, with its wrist/forearm clearly in FRONT. Do NOT repeat01's near high arm.
FAR supporting leg is long and STRAIGHT, its low boot BEHIND. NEAR knee raised HIGH about80degrees, its bent thigh/calf and upper winter boot are FOREGROUND and occlude the far straight leg where crossing. This is the opposite near/far leg arrangement to01. Keep head/hip and winter clothing/hair/tail placement as reference.
Both toe contact tips align to same invisible left vertical wall x30–33 on1024-wide composition. Both winter boot heels fully wrapped INSIDE closed navy back counters, plain socks only above fur boot cuff. Keep full boot uppers and fluffy cuffs, no copied MaryJane straps or knit socks. Entire complete new winter figure, native tall2:3, flat gray.

</details>

<details>
<summary>Frame 04 prompt</summary>

Use case: identity-preserve. Create ONE complete full-body WINTER LEFT-WALL-CLIMB animation frame, fully new polished raster anime illustration. No contact sheet, no parts, no pasted shoes.
Image1 is the ONLY authoritative character identity and WINTER outfit reference. Preserve exact chibi proportions, round face, large bright blue star-highlight eyes, long layered indigo-to-cyan hair and blue whale tail.
WINTER CLOTHES ONLY: deep navy whale-shaped hood with white fluffy face-opening trim, black whale eye and pink cheek detail on hood, side fins with pale underside, and the distinctive TWO-LOBED pale-blue/white WATER-SPOUT ornament at its top (not a hair loop). Small blue whale pin on fur rim. Pale icy-blue/white check scarf, navy bow/whale medallion, dangling scarf end with white whale/snowflake motif and white fringes. Navy flared winter coat with plush white fur cuffs, front placket and hem; blue button/bow and white pom-pom closures; white whale/snowflake embroidery and pale blue wave border on lower coat. Plain white socks and NAVY WINTER BOOTS with thick white fur boot cuffs, small blue bows/white pom-poms/snowflake details, rounded toe and dark thick outsole. Exactly the winter design of Image1, not a redesign.
Image2 is a small cropped approved KNIT v4 frame: POSE/LEFT WALL/LIMB DEPTH/RHYTHM reference ONLY. Replace ALL its clothes, cap and shoes with WINTER fromImage1. Never copy knit cable sweater, knit bonnet, plaid skirt, Mary Jane strap/open instep, hair-loop ahoge; never add maid apron, lace dress, X straps or waist apron bow. Image2's body joint positions and left-facing climbing silhouette are the guide, not its costume pixels.

Both WINTER BOOTS must be COMPLETE CLOSED BOOTS, not loose slippers: a continuous navy heel counter wraps fully around the back/sides of the socked heel and meets the boot shaft/upper/sole. The heel is INSIDE the boot cavity. The ankle enters naturally through the fluffy boot cuff. No exposed white heel outside the back, no open instep, no detached heel platform, no half-off boot hanging on toes. Navy boot upper covers the WHOLE foot/ankle.
Only a small TOE/FOREFOOT SOLE patch touches the invisible vertical LEFT wall. Boot bends at its BALL with natural vamp creases; ARCH recedes RIGHT off wall; REAR HALF of sole/heel is almost HORIZONTAL to the RIGHT, while heel stays INSIDE the enclosing navy counter. Do not rotate entire boot into a rigid vertical board, do not plaster whole sole to wall. Both lifted and supporting boots have this anatomy. Both toe contact tips and high gripping knuckles align to ONE vertical left wall plane, around x3.2% of canvas. No painted wall.
Exactly two hands/two arms/two legs/two boots. Both elbows visibly bent. At least one supporting leg near straight in every frame, never both knees folded. High gripping fingers curl into left vertical wall, camera sees knuckles/back of hand; low/moving hand palm faces wall, fingers up-left.

Composition: whole figure nearly fills TALL 2:3 portrait, native1536x2304 requested. It must be rendered natively tall enough to REDUCE onto1100x1494, never enlarged. Small safe margins around hood spout, hair, scarf, hands, shoes, tail. Keep head/hip, coat, scarf and hair/tail placement of reference pose; never align by feet. No clipped part.
Background: entirely opaque, uniform NEUTRAL DARK GRAY #606060, not pure black, no transparency/checkerboard in this RAW image. Gray background visible through actual hair/fabric gaps. No floor, cast shadow, glow, gradient, writing, numbers, frame lines, labels, props or extra character. No white halo around white fur/socks. Detailed fluffy fur and embroidery, same finished rich cel shading and line weight as Image1.
FRAME04 only — the OPPOSITE transition from02. Match Image2, not03's high-knee hold.
FAR hand stays HIGH gripping left wall; FAR high sleeve/arm is BEHIND head/body and near hand, acute elbow about65degrees. NEAR lower hand has risen to CHEST, wrist and palm plainly FOREGROUND in FRONT of the far sleeve. Fingers up-left/palm to wall, not a hand lying flat or hidden behind the high arm. Its foreground wrist contour is uninterrupted at crossing; high far sleeve ends behind it.
FAR supporting leg stays long/STRAIGHT with the LOWER boot BEHIND. NEAR moving knee unfolds DOWN to120degrees, knee BELOW hip; near boot moves DOWN left wall from03 and is FOREGROUND where it overlaps the far straight leg. Do NOT repeat03's raised horizontal thigh or tightly folded90degree knee. One leg remains straight. On1024x1536 proportion grid hip≈(350,995), MOVING knee≈(150,1080), moving boot cuff≈(145,1250); low supporting ankle≈(145,1410), boot at bottom≈1480. Thigh slopes DOWN-LEFT, calf goes DOWN; upper/lower boot heights separated about170–210px.
Both boot toe contacts and high gripping knuckles on SAME invisible left wall x30–33; no upper boot left of lower boot. Every navy winter boot has a complete enclosing heel counter, upper covers foot, fur cuff meets calf, heel remains IN boot while rear sole turns horizontal. No knit clothes/socks/strap shoes, no maid costume.
Head/hip/coat/scarf/hair/tail stay at the same body registration and scale as other frames. One entirely new coherent full-body winter illustration on uniform neutral gray, native TALL2:3, safe margins on top water-spout and all extremities.

</details>
