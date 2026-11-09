# knit LEFT 四帧 v4 候选说明

本轮只交完整人物候选，未安装运行时。使用内置 imagegen；每帧从头到鞋整幅重新绘制，不复用 v3 的人物像素、鞋子补丁或袜口补片。

## 参考与画布

- 唯一身份/服装来源：`pet/assets/live2d/knit/sprite.png`。提供给生成工具的是从该文件缩小得到的身份参考。
- 姿势来源：`knit-climb-left-4-contact-sheet-v3.png`，使用四格缩略图或其单格小尺寸裁剪，仅参考姿势、左墙和近远深度。
- 联系表为 2200×2988 RGBA，2列×2行，左上01、右上02、左下03、右下04；每格1100×1494。
- 最终四张原画实际均为1024×1536，不将提示词要求的1536×2304冒充实际输出尺寸。人物先在不透明中性深灰底完整生成，再抠图。实际背景估计约RGB(90–91,89–91,90)。
- 后处理只等比缩小整幅人物、平移和补透明画布；缩放比依次为0.936849 / 0.937500 / 0.930339 / 0.943359，全部小于1。没有把低分辨率图放大，没有非等比拉伸、肢体局部位移或鞋袜拼贴。

## 四帧姿势与鞋腔

|帧|手臂/腿部节奏|鞋后帮与脚跟检查|
|---|---|---|
|01|近侧手高抓且在前；远侧手低撑在后。近侧支撑腿伸展，远侧膝高抬。|上鞋为屈膝脚，下鞋为支撑脚；两只海军蓝鞋的后侧围帮均从鞋底升到袜脚后方，包住袜脚跟。脚踝通过连续鞋口进入鞋内。|
|02|远侧手抬至胸口并被近侧高手袖子遮挡；远侧膝向下展开，近侧支撑腿伸展。|上鞋的后帮一部分被前方伸展腿自然遮挡；可见侧帮与后鞋底连续，并非后跟缺失。下鞋后帮完整包跟。|
|03|远侧手高抓在后，近侧手低撑在前；远侧腿伸展支撑，近侧膝高抬。|近侧上鞋的后帮清楚包住袜脚后缘；下鞋也有完整侧帮、后帮和鞋底形成鞋腔。|
|04|远侧高手在后，近侧手抬到胸前且腕部在前；近侧膝下伸，远侧腿伸展支撑。|上鞋及下鞋均有围住脚跟的后帮，袜脚跟位于鞋腔内；上鞋自然遮挡后方支撑腿。|

逐只检查了八鞋：前掌/鞋尖小段接近左侧垂直墙面；前掌有弯折与鞋面褶皱，足弓离墙，后半鞋底接近水平，鞋后帮仍包着脚跟。未见v3的袜脚跟露在鞋后或鞋只挂在脚尖的结构。

## 对齐与 wallInset

采用整幅缩小和平移，未旋转人物。头部以可见虹膜中心、腰部以白腰结根作为人工估算对齐点；这些坐标约有±3px测量误差，不是像素级锁定。

`wallInsetPx` 为该格全部可见轮廓在alpha≥128时距左边缘的最小x；`wallInset`=wallInsetPx/1100。前臂/指节可能比鞋尖突出，因此同时列出上、下鞋尖接墙点。

|帧|缩小后整图尺寸|平移(x,y)|眼心约(x,y)|白腰结根约(x,y)|wallInsetPx|wallInset|上/下鞋尖x|
|---|---|---|---|---|---:|---:|---|
|01|959×1439|6, 33|300, 500|372, 945|31|0.02818|31 / 33|
|02|960×1440|10, 29|307, 502|387, 943|33|0.03000|33 / 33|
|03|953×1429|-41, 47|300, 500|373, 946|30|0.02727|34 / 32|
|04|966×1449|2, 15|300, 498|384, 948|26|0.02364|31 / 31|

八只前掌的实际接墙x为31–34px。眼心横向极差约7.1px、竖向约3.5px；白腰结根横向极差约14.6px、竖向约4.9px。没有按双脚底部基线对齐。所有格的人物越界裁切像素为0，四周边界非透明像素为0。

## alpha 处理方式

1. 从深灰底原画的边界连通背景、人物连通组件及内部背景孔种子建立完整前景轮廓；保留整个人物，不对白袜/皮肤单独按颜色硬key。初始分割仍使用灰底颜色相似度作为线索，同时使用连通性、孔洞和轮廓拓扑约束。
2. 在原生尺寸建立trimap：确定前景、确定背景及约2px未知边界。内部确定前景不重新抠色。
3. 未知区取附近确定前景颜色F和局部背景B，以C=alpha F+(1-alpha)B的局部色线投影估计alpha，再用F=(C-(1-alpha)B)/alpha去除灰底混色污染；不是阈值直接变alpha。
4. 原生阶段的白/奶油色确定前景，四帧分别272113 / 269655 / 266061 / 261572像素，RGB和完全不透明alpha均保持，丢失数均为0。此统计只指确定前景，不代表每个极小针织透孔均已人工标注。
5. 原生matte后整幅采用linear核缩小、平移并补透明画布。最后将半透明alpha限制在轮廓内侧贴背景的一层像素；外侧归零，内部深处归完全不透明，RGB不再改写。无Gaussian羽化、无Lanczos宽晕边；这一步后交付素材不再缩放，只原样拼成联系表。
6. 最终四帧的越界半透明、深层半透明和跨alpha128的双侧半透明邻接对计数均为0；AA步骤RGB改动为0。已逐帧查看黑、白、灰底和八鞋局部，未见明显宽白边/灰边或袜口抠蚀。

这是平灰背景上的拓扑分割和局部alpha求解，不是学习式语义抠图或全局closed-form matting。默认内部孔检测面积阈值12px，更小或非平灰孔没有逐个手工标注，需在最终美术验收时继续看最细孔口。黑描边与单像素AA仍有正常的像素栅格边界，未用模糊掩盖。

## 原始生成路径

四张原始深灰底完整人物均保留在工具默认输出位置，未覆盖、未删除：

- 01：[exec-7262fe0b-ed58-4fe7-accd-312cdd86863e.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-7262fe0b-ed58-4fe7-accd-312cdd86863e.png)
- 02：[exec-53045a76-6696-4c1f-9fa1-8404adbf899c.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-53045a76-6696-4c1f-9fa1-8404adbf899c.png)
- 03：[exec-de56f6df-d4b6-483f-8c00-31b7bd5b97d6.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-de56f6df-d4b6-483f-8c00-31b7bd5b97d6.png)
- 04：[exec-2cb9c465-602e-4374-9144-712027cbe046.png](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-2cb9c465-602e-4374-9144-712027cbe046.png)

## 未完成/待复核

- 04的圆形鞋带扣在原始整幅绘画中偏米白/浅金，01/02/03偏深蓝；还没有达到四帧完全同材质，本次没有用局部涂色补丁掩盖。
- 帽沿、呆毛、发束、衣褶和尾巴轮廓有独立重绘差异，尚未达到逐像素形状一致；上述眼心/腰部锚点仅控制整体漂移。
- 仅为候选联系表，未安装、未播放运行时循环，不能宣称游戏内连续性已验收。未改rig、avatar.js、maid、winter或其他运行时文件。未commit、未push。

## 最终提示词与生成方式

使用内置imagegen，非CLI/API回退。实际采用的四组英文提示词也嵌入联系表PNG的XMP描述。下方保留全文以便复现参考分工。

<details>
<summary>Frame 01 prompt</summary>

Use case: identity-preserve.
Create ONE entirely NEW, clean, fully painted full-body KNIT LEFT WALL-CLIMB animation frame. This is a full-figure redraw, NOT a shoe patch, collage, cutout, or contact sheet.
Image 1 is the ONLY authoritative identity and costume reference: exact chibi proportions, face/blue star eyes, indigo-to-cyan long hair, loop ahoge, cream cable-knit bonnet/beanie with whale pin/navy bow/pom-pom, white-blue fin ears, cream cable-knit sweater with navy whale/spout motif, navy plaid pleated skirt/white waist bow, cream-white knitted socks/navy sock bows, navy rounded-toe strapped Mary Jane shoes and whale tail. Do not redesign or add maid/winter clothing.
Image 2 is the cropped FRAME01 from the rejected v3 four-frame contact sheet: use ONLY its full-body pose, left-wall placement, limb depth, head/hip positions, costume arrangement and hair/tail silhouette. Do NOT reuse its fuzzy pixels, white fringe, patch seams or incorrect open-heel shoes. Paint all parts together as one coherent finished raster anime illustration, clean dark outlines, detailed knit fabric and polished cel shading.

BACKGROUND: completely uniform opaque NEUTRAL DARK GRAY #606060 over the whole canvas. Not pure black, no transparency/checkerboard in this raw image. No wall, ground, cast shadow, gradient, border, text, labels, numbers or props. Separate navy shoes/hair outline clearly from gray. Do not paint a white halo around cream socks. Lace/sock eyelet holes must show the SAME gray backdrop.

NATIVE RESOLUTION: generate a high-resolution portrait, preferably 1536x2080 or 2048x2784 native pixels. It must hold a fully detailed character at least 1440px tall, suitable for DOWNSAMPLING into a 1100x1494 final RGBA frame. Do not output a tiny figure for later enlargement. Character nearly fills canvas height, same proportions/framing as chosen reference cell, all hair/hat/hands/shoes/tail inside with safe margins. LEFT contact tips near x=3.2% canvas; head/hip must stay at reference positions. No foot-baseline standing alignment; keep the climbing head/hip anchors.

CRITICAL SHOE ANATOMY, BOTH FEET:
Completely redraw both navy Mary Jane shoes as COMPLETE, CLOSED-BACK SHOES securely worn on the feet. Each navy heel COUNTER/QUARTER must rise from the rear sole, wrap AROUND THE BACK AND SIDES OF THE SOCK-COVERED HEEL, and meet the ankle collar. The socked heel is INSIDE the shoe cavity, fully cradled by the heel cup. Ankle enters naturally through a continuous shoe opening, with the back lip visibly hugging the back of the ankle. Do NOT let the white heel bulge outside/on top of a bare flat sole. Draw a navy back wall behind the heel, connected to BOTH the side upper and rear sole. Complete shoe cavity, stable ankle-to-heel-to-sole connection. No exposed sock heel hanging behind shoe, no mules/slippers, no loose shoe hooked only on the toes, no floating horizontal heel platform.
Only the TOE/FOREFOOT's small sole patch touches the invisible vertical LEFT wall. The sole/vamp bends at the BALL. The ARCH gradually peels rightward away from wall, REAR HALF of sole/heel turns nearly horizontal RIGHT while the HEEL REMAINS ENCLOSED in the navy back cup. Both high bent-knee foot and low straight-leg foot use this bent forefoot anatomy. Natural crease across the ball, modest round toe, original instep strap/buckle and low navy heel, not exaggerated curled/clown toes. Whole shoe must not be rotated as a straight vertical slab. Full sole does not plaster to wall. Socks and shoes must join smoothly without any patch seam, white fringe, doubled outline, disconnected foot or bare ankle gap. Exactly two complete shoes, two legs, two arms/two hands.
Hand anatomy: high gripping hand has back/knuckles toward camera, fingers curl around invisible left vertical wall; low/moving hand palm toward wall, fingers up-left, not a palm facing camera or lying on a table. Both elbows bent and visible. At least one supporting leg near straight, never two crouched knees.
FRAME01 ONLY: match Image2 full-body pose and head/hip placement. Near high gripping arm foreground, far low hand behind. Near leg long and straight supporting, far knee raised about80degrees with its shoe behind. Both shoe toes AND high gripping knuckles meet one invisible vertical left wall, at the same x coordinate, no diagonal contact drift. Do not change the high-knee hold into a down-extending knee transition.
IMPORTANT REFINEMENT TO OUTPUT: TALL native portrait1536x2304, 2:3 aspect ratio. Fully painted figure must be at least1440 native pixels tall, almost fill canvas with safe15–25px margins after natural native rendering. It will ONLY be downsampled onto1100x1494, never enlarged. All hair/tail/shoes remain inside. One entire NEW uniform rendering, NOT any small patch. Full MaryJane heel counters enclose both heels, opaque neutral#606060 background.
FOOTWEAR DESIGN CLARIFICATION: use the exact simple NAVY Mary Jane instep strap from Image1. Fastener is a small dark NAVY round rivet/button with a restrained blue reflection, same navy material as shoes. NO square metal buckle, NO gold or silver rectangle, NO new ornaments. Both shoe back counters fully enclose the sock-covered heels. This requirement applies to BOTH shoes. Maintain the whole chosen pose and framing, fully render all head/body/arms/legs/hair/garments anew as one coherent clean full-body frame on darkgray, not a localized repair.


</details>

<details>
<summary>Frame 02 prompt</summary>

Use case: identity-preserve.
Create ONE entirely NEW, clean, fully painted full-body KNIT LEFT WALL-CLIMB animation frame. This is a full-figure redraw, NOT a shoe patch, collage, cutout, or contact sheet.
Image 1 is the ONLY authoritative identity and costume reference: exact chibi proportions, face/blue star eyes, indigo-to-cyan long hair, loop ahoge, cream cable-knit bonnet/beanie with whale pin/navy bow/pom-pom, white-blue fin ears, cream cable-knit sweater with navy whale/spout motif, navy plaid pleated skirt/white waist bow, cream-white knitted socks/navy sock bows, navy rounded-toe strapped Mary Jane shoes and whale tail. Do not redesign or add maid/winter clothing.
Image 2 is the cropped FRAME02 from the rejected v3 four-frame contact sheet: use ONLY its full-body pose, left-wall placement, limb depth, head/hip positions, costume arrangement and hair/tail silhouette. Do NOT reuse its fuzzy pixels, white fringe, patch seams or incorrect open-heel shoes. Paint all parts together as one coherent finished raster anime illustration, clean dark outlines, detailed knit fabric and polished cel shading.

BACKGROUND: completely uniform opaque NEUTRAL DARK GRAY #606060 over the whole canvas. Not pure black, no transparency/checkerboard in this raw image. No wall, ground, cast shadow, gradient, border, text, labels, numbers or props. Separate navy shoes/hair outline clearly from gray. Do not paint a white halo around cream socks. Lace/sock eyelet holes must show the SAME gray backdrop.

NATIVE RESOLUTION: generate a high-resolution portrait, preferably 1536x2080 or 2048x2784 native pixels. It must hold a fully detailed character at least 1440px tall, suitable for DOWNSAMPLING into a 1100x1494 final RGBA frame. Do not output a tiny figure for later enlargement. Character nearly fills canvas height, same proportions/framing as chosen reference cell, all hair/hat/hands/shoes/tail inside with safe margins. LEFT contact tips near x=3.2% canvas; head/hip must stay at reference positions. No foot-baseline standing alignment; keep the climbing head/hip anchors.

CRITICAL SHOE ANATOMY, BOTH FEET:
Completely redraw both navy Mary Jane shoes as COMPLETE, CLOSED-BACK SHOES securely worn on the feet. Each navy heel COUNTER/QUARTER must rise from the rear sole, wrap AROUND THE BACK AND SIDES OF THE SOCK-COVERED HEEL, and meet the ankle collar. The socked heel is INSIDE the shoe cavity, fully cradled by the heel cup. Ankle enters naturally through a continuous shoe opening, with the back lip visibly hugging the back of the ankle. Do NOT let the white heel bulge outside/on top of a bare flat sole. Draw a navy back wall behind the heel, connected to BOTH the side upper and rear sole. Complete shoe cavity, stable ankle-to-heel-to-sole connection. No exposed sock heel hanging behind shoe, no mules/slippers, no loose shoe hooked only on the toes, no floating horizontal heel platform.
Only the TOE/FOREFOOT's small sole patch touches the invisible vertical LEFT wall. The sole/vamp bends at the BALL. The ARCH gradually peels rightward away from wall, REAR HALF of sole/heel turns nearly horizontal RIGHT while the HEEL REMAINS ENCLOSED in the navy back cup. Both high bent-knee foot and low straight-leg foot use this bent forefoot anatomy. Natural crease across the ball, modest round toe, original instep strap/buckle and low navy heel, not exaggerated curled/clown toes. Whole shoe must not be rotated as a straight vertical slab. Full sole does not plaster to wall. Socks and shoes must join smoothly without any patch seam, white fringe, doubled outline, disconnected foot or bare ankle gap. Exactly two complete shoes, two legs, two arms/two hands.
Hand anatomy: high gripping hand has back/knuckles toward camera, fingers curl around invisible left vertical wall; low/moving hand palm toward wall, fingers up-left, not a palm facing camera or lying on a table. Both elbows bent and visible. At least one supporting leg near straight, never two crouched knees.
FRAME02 ONLY. Match this single Image2 pose, not a general raised-knee pose. NEAR high grip stays fixed, near supporting arm FOREGROUND, elbow acutely folded65degrees. FAR hand has risen from low wall grip to chest; FAR wrist stays BEHIND and partly occluded by the near sleeve. NEAR support leg remains long and STRAIGHT at the same wall foot height as frame01. FAR knee opens to120degrees BELOW hip, far shoe slides DOWN wall and stays BEHIND near straight leg. Exactly2legs/2shoes.
FULL-FIGURE REGISTRATION is important: on a1024x1536 proportion grid, keep visible eye around(314,498), waist white-bow root around(391,974), lowest support-shoe sole aroundy1490, both toe contacts and high grip atx30–33. Keep ordinary chibi leg length, do NOT shrink the torso and lengthen the straight shin. Keep the eye-to-waist vertical distance about475px at this size, like the original pose. Head/hair/hip and shoe placement from Image2, not recentered to the right or a torso bowed diagonally much shorter.
Entire new fully painted high-res figure on uniform opaque darkgray#606060, native TALL1536x2304 portrait2:3. Character at least1440native pixels tall, safe margins. No separate patches, no cropping, no upscaling.
Both MaryJane shoes have full navydark heel COUNTERS enclosing heel up to collar; ankles enter naturally, continuous back and side and sole. Only small forefoot area on left wall, ball flex, arch away, nearly horizontal rear soles. Exact simple navy instep straps with a SMALL NAVY ROUND fastener, restrained blue highlight; NO gold or silver square buckle, NO new decoration.

</details>

<details>
<summary>Frame 03 prompt</summary>

Use case: identity-preserve.
Create ONE entirely NEW, clean, fully painted full-body KNIT LEFT WALL-CLIMB animation frame. This is a full-figure redraw, NOT a shoe patch, collage, cutout, or contact sheet.
Image 1 is the ONLY authoritative identity and costume reference: exact chibi proportions, face/blue star eyes, indigo-to-cyan long hair, loop ahoge, cream cable-knit bonnet/beanie with whale pin/navy bow/pom-pom, white-blue fin ears, cream cable-knit sweater with navy whale/spout motif, navy plaid pleated skirt/white waist bow, cream-white knitted socks/navy sock bows, navy rounded-toe strapped Mary Jane shoes and whale tail. Do not redesign or add maid/winter clothing.
Image 2 is the rejected v3 four-frame contact sheet: use ONLY the chosen cell's full-body pose, left-wall placement, limb depth, head/hip positions, costume arrangement and hair/tail silhouette. Do NOT reuse its fuzzy pixels, white fringe, patch seams or incorrect open-heel shoes. Paint all parts together as one coherent finished raster anime illustration, clean dark outlines, detailed knit fabric and polished cel shading.

BACKGROUND: completely uniform opaque NEUTRAL DARK GRAY #606060 over the whole canvas. Not pure black, no transparency/checkerboard in this raw image. No wall, ground, cast shadow, gradient, border, text, labels, numbers or props. Separate navy shoes/hair outline clearly from gray. Do not paint a white halo around cream socks. Lace/sock eyelet holes must show the SAME gray backdrop.

NATIVE RESOLUTION: generate a high-resolution portrait, preferably 1536x2080 or 2048x2784 native pixels. It must hold a fully detailed character at least 1440px tall, suitable for DOWNSAMPLING into a 1100x1494 final RGBA frame. Do not output a tiny figure for later enlargement. Character nearly fills canvas height, same proportions/framing as chosen reference cell, all hair/hat/hands/shoes/tail inside with safe margins. LEFT contact tips near x=3.2% canvas; head/hip must stay at reference positions. No foot-baseline standing alignment; keep the climbing head/hip anchors.

CRITICAL SHOE ANATOMY, BOTH FEET:
Completely redraw both navy Mary Jane shoes as COMPLETE, CLOSED-BACK SHOES securely worn on the feet. Each navy heel COUNTER/QUARTER must rise from the rear sole, wrap AROUND THE BACK AND SIDES OF THE SOCK-COVERED HEEL, and meet the ankle collar. The socked heel is INSIDE the shoe cavity, fully cradled by the heel cup. Ankle enters naturally through a continuous shoe opening, with the back lip visibly hugging the back of the ankle. Do NOT let the white heel bulge outside/on top of a bare flat sole. Draw a navy back wall behind the heel, connected to BOTH the side upper and rear sole. Complete shoe cavity, stable ankle-to-heel-to-sole connection. No exposed sock heel hanging behind shoe, no mules/slippers, no loose shoe hooked only on the toes, no floating horizontal heel platform.
Only the TOE/FOREFOOT's small sole patch touches the invisible vertical LEFT wall. The sole/vamp bends at the BALL. The ARCH gradually peels rightward away from wall, REAR HALF of sole/heel turns nearly horizontal RIGHT while the HEEL REMAINS ENCLOSED in the navy back cup. Both high bent-knee foot and low straight-leg foot use this bent forefoot anatomy. Natural crease across the ball, modest round toe, original instep strap/buckle and low navy heel, not exaggerated curled/clown toes. Whole shoe must not be rotated as a straight vertical slab. Full sole does not plaster to wall. Socks and shoes must join smoothly without any patch seam, white fringe, doubled outline, disconnected foot or bare ankle gap. Exactly two complete shoes, two legs, two arms/two hands.
Hand anatomy: high gripping hand has back/knuckles toward camera, fingers curl around invisible left vertical wall; low/moving hand palm toward wall, fingers up-left, not a palm facing camera or lying on a table. Both elbows bent and visible. At least one supporting leg near straight, never two crouched knees.

FRAME03 ONLY — use Image2 BOTTOM-LEFT cell:
OPPOSITE half-cycle from01. The FAR hand now grips HIGH, its high sleeve/arm is BEHIND. The NEAR hand is LOW, palm to left wall at chest/waist, IN FRONT of body and the far sleeve. FAR leg is the long STRAIGHT supporting leg with the low shoe; NEAR knee is bent HIGH about80degrees, with the upper lifted sock/shoe IN FRONT of the far straight leg. Do NOT repeat01, do NOT put the near high arm in front. Preserve the lower-left cell's high grip, low palm, head/hip and hair/tail arrangement. The high grip is higher in03 than in01 but head and hip do not change.
Both toes at same invisible vertical LEFT wall. Both Mary Jane heel COUNTERS fully surround and support the sock heels. Especially lifted near foot: continuous navy back cup wraps around the rightmost heel and joins sole and side upper; socked heel is INSIDE, not spilling over the back or perching on a flat exposed platform.
Use a TALL portrait native canvas1536x2304 (2:3 aspect ratio). Fully detailed figure at least1440 native pixels tall, safe minimal margins. It will only be DOWNSAMPLED and padded to final1100x1494, never enlarged. Keep head/hip proportions and all framing consistent with selected reference pose. Whole new figure from hat to enclosed shoes in a single coherent painting, opaque uniform neutral gray#606060. No cropping.

</details>

<details>
<summary>Frame 04 prompt</summary>

Use case: identity-preserve.
Create ONE entirely NEW, clean, fully painted full-body KNIT LEFT WALL-CLIMB animation frame. This is a full-figure redraw, NOT a shoe patch, collage, cutout, or contact sheet.
Image 1 is the ONLY authoritative identity and costume reference: exact chibi proportions, face/blue star eyes, indigo-to-cyan long hair, loop ahoge, cream cable-knit bonnet/beanie with whale pin/navy bow/pom-pom, white-blue fin ears, cream cable-knit sweater with navy whale/spout motif, navy plaid pleated skirt/white waist bow, cream-white knitted socks/navy sock bows, navy rounded-toe strapped Mary Jane shoes and whale tail. Do not redesign or add maid/winter clothing.
Image 2 is the cropped FRAME04 from the rejected v3 four-frame contact sheet: use ONLY its full-body pose, left-wall placement, limb depth, head/hip positions, costume arrangement and hair/tail silhouette. Do NOT reuse its fuzzy pixels, white fringe, patch seams or incorrect open-heel shoes. Paint all parts together as one coherent finished raster anime illustration, clean dark outlines, detailed knit fabric and polished cel shading.

BACKGROUND: completely uniform opaque NEUTRAL DARK GRAY #606060 over the whole canvas. Not pure black, no transparency/checkerboard in this raw image. No wall, ground, cast shadow, gradient, border, text, labels, numbers or props. Separate navy shoes/hair outline clearly from gray. Do not paint a white halo around cream socks. Lace/sock eyelet holes must show the SAME gray backdrop.

NATIVE RESOLUTION: generate a high-resolution portrait, preferably 1536x2080 or 2048x2784 native pixels. It must hold a fully detailed character at least 1440px tall, suitable for DOWNSAMPLING into a 1100x1494 final RGBA frame. Do not output a tiny figure for later enlargement. Character nearly fills canvas height, same proportions/framing as chosen reference cell, all hair/hat/hands/shoes/tail inside with safe margins. LEFT contact tips near x=3.2% canvas; head/hip must stay at reference positions. No foot-baseline standing alignment; keep the climbing head/hip anchors.

CRITICAL SHOE ANATOMY, BOTH FEET:
Completely redraw both navy Mary Jane shoes as COMPLETE, CLOSED-BACK SHOES securely worn on the feet. Each navy heel COUNTER/QUARTER must rise from the rear sole, wrap AROUND THE BACK AND SIDES OF THE SOCK-COVERED HEEL, and meet the ankle collar. The socked heel is INSIDE the shoe cavity, fully cradled by the heel cup. Ankle enters naturally through a continuous shoe opening, with the back lip visibly hugging the back of the ankle. Do NOT let the white heel bulge outside/on top of a bare flat sole. Draw a navy back wall behind the heel, connected to BOTH the side upper and rear sole. Complete shoe cavity, stable ankle-to-heel-to-sole connection. No exposed sock heel hanging behind shoe, no mules/slippers, no loose shoe hooked only on the toes, no floating horizontal heel platform.
Only the TOE/FOREFOOT's small sole patch touches the invisible vertical LEFT wall. The sole/vamp bends at the BALL. The ARCH gradually peels rightward away from wall, REAR HALF of sole/heel turns nearly horizontal RIGHT while the HEEL REMAINS ENCLOSED in the navy back cup. Both high bent-knee foot and low straight-leg foot use this bent forefoot anatomy. Natural crease across the ball, modest round toe, original instep strap/buckle and low navy heel, not exaggerated curled/clown toes. Whole shoe must not be rotated as a straight vertical slab. Full sole does not plaster to wall. Socks and shoes must join smoothly without any patch seam, white fringe, doubled outline, disconnected foot or bare ankle gap. Exactly two complete shoes, two legs, two arms/two hands.
Hand anatomy: high gripping hand has back/knuckles toward camera, fingers curl around invisible left vertical wall; low/moving hand palm toward wall, fingers up-left, not a palm facing camera or lying on a table. Both elbows bent and visible. At least one supporting leg near straight, never two crouched knees.
FRAME04 ONLY, decisive near-hand/near-leg transition. Match Image2, not a high-knee hold.
FAR hand grips HIGH at left wall, FAR supporting sleeve is BEHIND head/torso/near hand. HIGH far elbow bends acutely about65degrees. NEAR moving hand comes UP to CHEST in the FOREGROUND, palm to left wall, fingers up-left, wrist plainly covers the far sleeve at crossings.
FAR leg stays a long STRAIGHT supporting leg down to the LOWEST shoe. NEAR moving leg extends DOWN; its knee has opened to120degrees, knee is BELOW the hip, not up at waist and not tucked at90degrees. On a1100x1494 design coordinate grid: hip≈(350,995), MOVING KNEE≈(150,1060–1110), moving ankle≈(145,1265), high/moving shoe≈y1240–1330. Low supporting ankle≈(145,1410), low shoe≈y1390–1480. THIGH slants DOWN-LEFT from skirt/hip to knee; CALF goes mostly DOWN from knee to ankle. Do NOT draw a horizontal raised thigh or high tightly folded knee; that would be frame03, not04. The two shoes are separated by about150–200px vertically, not300px.
Both round toes and high gripping knuckles align on the SAME invisible left vertical wall aroundx=33/1100. Do not shift upper shoe left of lower shoe; only the forefoot contact patch touches. Both heels enclosed by continuous navy MaryJane back counters rising behind ankle, joining upper AND sole.
Keep head/hip/skirt/hair/tail arrangement of Image2; whole new artwork, NO PATCHES. Uniform darkgray#606060 background, native tall portrait1536x2304 (2:3). Character at least1440pixels tall natively; only reduce onto final1100x1494, do not enlarge. No clipping any part.

</details>
