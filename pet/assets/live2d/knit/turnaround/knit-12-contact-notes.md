# knit 12 格转圈联系表：候选，方向检查未通过

本轮仅交付美术候选，不安装 12 帧运行时。当前联系表不能作为已验收的 360° 转圈素材。

## 素材来源与服装约定

- 唯一视觉参考：本套服装的 `pet/assets/live2d/knit/sprite.png`。没有使用 maid 或 winter 图片作为生成参考。
- 按用户确认，保持针织装：后背为奶油色针织毛衣、深蓝格裙；不增加 maid 的 X 背带、围裙或大腰蝴蝶结。正面的鲸鱼图案不移到后背。
- 使用内置 imagegen，仅调用一次；工具未返回可核实的模型版本，因此不声称已确认 GPT-image-2.5 版本。
- 输入为原 sprite 的 768px 高透明 WebP 派生参考，120302 字节；未上传原始大图，也未重复发起生成请求。
- 原始生成结果为 1182×1330 RGBA。下面的 2048×2304 联系表是本机裁切、透明边缘整理和统一排版的结果，增大排版尺寸不等于增加原生绘画细节。
- 0°格直接采用原 sprite 的等比审阅版本；其余 11 格来自此次生成。没有镜像、压窄正面、复制相邻格或程序化补画来代替错误角度。

原始生成文件保留于工具输出目录：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-2f176dc0-0137-4c79-bfa6-bec4f48495ae.png`

## 联系表规格与检查结果

文件：`knit-12-contact-sheet.png`，2048×2304，RGBA，4 列×3 行，每格 512×768。

按 alpha > 16 的可见轮廓检查，12 格均从 y=153 到 y=704（含端点），身高 552px，脚底对齐第 705 行；每格按完整轮廓包围盒水平居中。各格四边均无可见轮廓触边，头发、尾巴、鞋没有被网格裁断。

本机整理时按独立角色的连通轮廓提取，保留边缘抗锯齿、清理孤立背景碎点及透明像素残色，不以固定格子切线截断跨线的发梢。12 格像素哈希互不相同，但这不代表 12 个角度都合格。

| 顺序 | 目标角度 | 本轮检查 |
| --- | --- | --- |
| 00 | 0° | 使用现有 sprite，身份与正面服装基准保留。 |
| 01 | 30° | 朝画面右转的前侧候选；脸和毛衣细节仍需与原图复核。 |
| 02 | 60° | 朝画面右侧的前 3/4 候选，有头部和身体厚度。 |
| 03 | 90° | 朝画面右侧的侧面，非正面压窄；可辨认单眼和侧面轮廓。 |
| 04 | 120° | 后侧视角存在，但方向与 90°→180° 的预期递进相反。未通过。 |
| 05 | 150° | 过于接近正背，与 180°的 30°差异不够明确。未通过。 |
| 06 | 180° | 完整后脑、针织毛衣背部、格裙和鞋跟，没有人脸、眼、嘴或胸前鲸鱼图案；与相邻格的连续性仍未通过。 |
| 07 | 210° | 接近背面，肩线和躯干偏转不够清楚，与 150°/180°的差异不足。未通过。 |
| 08 | 240° | 后侧视角存在，但方向与 180°→270° 的预期递进相反。未通过。 |
| 09 | 270° | 错误：仍朝画面右侧，不能充当朝画面左侧的真侧面。未通过。 |
| 10 | 300° | 朝画面左侧的前 3/4 候选；与错误 270°尚不能连贯衔接。 |
| 11 | 330° | 朝画面左转、接近正面的候选。 |

针织纹理、格裙、渐变长发、鲸鱼尾巴、鞋袜均为完整上色位图。当前主要缺陷是转向和后侧角度递进；不能靠交换标签或水平镜像视为通过。帽饰、发梢、尾巴及衣褶的跨帧细节也仍有变化，不能承诺播放时无跳动。

## 后续生产帧与安装门槛

本轮没有生成或安装 1100×1494 的生产帧，没有改 rig、avatar.js 或运行时。联系表里的 552px 身高只用于美术检查，不是缩小后的生产角色。

原 knit sprite 为 1052×1494；alpha > 16 的原角色身高为 1437px，脚底 y=1461。后续通过美术验收后，生产帧应保持这一角色身高和基线，使用 1100×1494 透明画布，完整容纳头发、尾巴、鞋，不使用播放时缩小补偿。按目前候选的比例估算，最宽格恢复原身高后约 1070px，可放入 1100px；仍须在实际裁切时逐帧重新验证。

需要先修正 270°朝向、120°/240°后侧方向及 150°/180°/210°递进，再检查一致性。没有为凑齐角度而继续重复生成。maid、winter、现有 knit 四帧及运行时均未修改。

## 本次实际生成提示词

下面保留原请求全文；其中的目标角度和分辨率是要求，并不表示生成器已经全部满足。

```text
Edit target. IMAGE 1 is the ONLY reference, derived directly from the current knit/sprite.png. Preserve this exact character identity, round chibi face, enormous sapphire eyes with star highlights, big round head/short body proportions, fine colored line weight, polished anime cel shading and outfit. Do not borrow any maid design.

Create ONE full-body 12-view 360-degree turnaround CONTACT SHEET: exactly FOUR columns × THREE rows, left-to-right top-to-bottom. Desired canvas2048×2304, cells512×768. Exactly12 unique poses, no labels or drawn grid. Every figure fully inside its own cell with wide transparent gutters and complete tuft, hair, fin ears, tail and shoes. Same total body height, shoe baseline and rotation axis across all cells. Leave clear margin on all outer edges. Keep source proportions and tail size; do not spread rear hair/tail extra-wide or compress a front image to fit.

EXACT SEQUENCE:
row1 col1 0° exact front;
row1 col2 30° front turned slightly toward SCREEN-RIGHT;
row1 col3 60° front-right three-quarter, nose distinctly points SCREEN-RIGHT;
row1 col4 90° true profile, nose at image-RIGHT edge, one eye, real skull/torso thickness.
row2 col1 120° rear-right three-quarter: continue30° AWAY from the screen-right profile; rear head/back dominate, any tiny facial edge only on image-RIGHT and hidden by hair, NO human eyes/mouth/front face;
row2 col2 150° mild rear-right,30° before straight back: visibly less side-on than120 but not identical to180, rear shoulders mostly visible and only mildly foreshortened;
row2 col3 180° exact BACK, shoulders/hips balanced, rear knit sweater and rear plaid skirt, shoe heels, absolutely NO human face/eyes/mouth/front chest whale;
row2 col4 210° mild rear-left,30° after back: same mild amount as150 but naturally opposite direction, independently drawn, not a flip;
row3 col1 240° strong rear-left three-quarter: clearly more turned than210, continuing toward screen-left profile; rear head/back clear, NO human eyes/mouth/front face;
row3 col2 270° true profile with nose at image-LEFT edge and one eye;
row3 col3 300° front-left three-quarter, nose distinctly SCREEN-LEFT;
row3 col4 330° front slightly toward SCREEN-LEFT, nearly back to0.
The face may show in0/30/60/90/270/300/330 only. 120/150/180/210/240 are rear-sector views, never front portraits. For30/60, RIGHT means the viewer's screen-right, not the character's anatomical right. Strong rear3/4 at120/240 versus mild near-back at150/210 must be unmistakable through shoulder overlap, torso plane, hair occlusion, pleat depth, heels and tail projection. Avoid150≈180 or210≈240.

KNIT OUTFIT EXACTLY IMAGE1:
Cream cable-knit cap/headband with a small blue/white whale pin, navy side bow and cream pompom, with original indigo looped tuft visible; original very long voluminous indigo-to-cyan curls in individually shaded layered locks; navy whale-fin ears with white undersides. Cream chunky cable-knit oversized sweater, thick roll neck with white shirt-collar tips, ribbed cuffs/hem, navy whale graphic ONLY on front chest, small navy sleeve bows. Navy/gray plaid pleated short skirt, small white bow at the front side as reference. Bare upper legs, cream cable-knit legwarmers/socks with small navy bows and navy Mary Jane shoes with original straps/heel/sole details. Original blue/cyan whale tail with light underside grows from the same lower-back attachment.
BACK COSTUME: plain richly textured cream cable-knit back with consistent stitching, ribbing and folds; rear plaid pleats and rear socks/shoes. NO apron, NO X straps, NO suspenders, NO large waist bow, NO maid headdress, NO maid lace apron, NO gold maid embroidery. Do not place the front whale graphic on the back. All five rear views use exactly the same rear sweater/skirt construction, changing perspective only. The tiny skirt bow remains a front-side detail, not a new large back bow.

ASYMMETRY: bind the whale pin/navy bow/pompom to the SAME physical temple: front image-RIGHT, back image-LEFT, occluded when naturally on the far side. Do not fix it to the same screen side in every view, and do not mirror the whole figure. Likewise keep the same tuft, unequal fin-ear design, sleeve/leg bows and tail root, independently drawn with coherent perspective. Preserve hair volume and glossy gradient, not one flat back-hair block.

Full detailed colored RASTER anime, matching Image1: knit stitch texture, cloth folds, plaid pleats, glossy hair highlights, nuanced soft shading and clean fine colored outlines. Not SVG, vector, sketch, line art, simplified flat shapes or 3D.
Actual transparent RGBA outside figures and in hair/leg gaps. No floor, contact/cast shadow, glow, colored/gradient background, checkerboard transparency, text, numbers, labels, watermark, extra limbs, repeated identical angles, cropped tips, white/black fringe or double contours.
```

