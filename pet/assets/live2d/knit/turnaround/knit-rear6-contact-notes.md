# knit 六格后侧/侧面修正版（候选，未安装）

只交付 120°、150°、180°、210°、240°、270° 六格联系表与本说明。方向错误已修正；角度精度和帽沿细节仍有下述问题，不能视为全部美术验收通过。

未安装 12 帧，没有改 rig、avatar.js、CSS 或运行时。原 `knit-12-contact-sheet.png` 和原说明均保留不动，0°、30°、60°、90°、300°、330° 六格没有重画或替换。

## 文件与排列

文件：`knit-rear6-contact-sheet.png`

| 第一行左 | 第一行中 | 第一行右 |
| --- | --- | --- |
| 120° | 150° | 180° |

| 第二行左 | 第二行中 | 第二行右 |
| --- | --- | --- |
| 210° | 240° | 270° |

整张 1536×1536 RGBA；每格 512×768，没有网格线或标签。按 alpha > 16 的可见轮廓测量：

- 六格均为 552px 身高，局部 y=154 至 y=705，含首尾像素；脚底坐标确实为 y=705。
- 完整轮廓的水平包围盒中心为 x=256 或 256.5；半像素差来自整数像素居中取整。
- 六格边界均无可见像素触边，头发、呆毛、尾巴、鞋没有被格子边缘裁掉。
- 背景为真实透明通道；不保留生成图透明区域中的残色、孤立噪点或模糊背景。
- 本轮只做审阅联系表，未输出 1100×1494 生产帧，也没有在播放时做缩放补偿。

## 六格的新差异与检查

| 角度 | 新差异与当前判断 |
| --- | --- |
| 120° | 朝画面右后侧，身体明显比 150°窄，近侧袖臂突出、双腿重叠，头和身体都转离镜头；脸、眼、嘴被后发遮住。原来出现在近侧的鲸鱼别针、蝴蝶结和毛球已被远侧帽/头遮挡。 |
| 150° | 比 120°更接近正背，后腰、裙背更宽，双肩/双鞋跟同时可见；仍有右后偏转。不是直接复制 180°，但肩线和双脚仍偏正背，严格 30°偏转证据较弱。 |
| 180° | 正背面，后脑与躯干朝向居中，双肩/胯部/脚跟基本平衡；没有人脸、眼、嘴和胸前鲸鱼图案。尾巴、帽饰保留角色非对称性，因此轮廓不要求左右完全镜像。 |
| 210° | 向画面左后侧轻偏，左侧袖臂更突出，后背面仍较宽，帽饰在画面左后缘少量露出；与 150°转向相反，未进行水平镜像。肩线和鞋跟也仍较接近正背。 |
| 240° | 比 210°更侧向画面左，头、肩、近侧袖臂和躯干侧面更明显，裙背更窄；后发遮住脸眼，方向不再与旋转递进相反。 |
| 270° | 真正朝画面左侧：鼻尖在左，只露近侧一只眼，后脑和后发在脸的右方，头/身体同向且有厚度；不再是右侧面。 |

所有背面格保持奶油色麻花针织毛衣背面、深蓝格纹百褶裙、针织帽、蓝色长发、鲸鱼尾巴、浅色针织袜及藏青鞋。没有增加 maid 围裙、X 背带、大腰蝴蝶结；没有把正面鲸鱼图案放到毛衣背后。

## 尚未解决的美术问题

1. **150°/210°偏转精度**：与 120°/240°的侧向程度已拉开，但双脚跟和肩线仍较接近正背，不能声称精确均分为每步 30°。
2. **帽沿织法不一致**：120°/150°/210°的局部补修出现较宽的罗纹折边，180°/240°/270°更接近圆卷边。混排时有可见变化，需要人工检查是否可接受。
3. **其他跨帧细节**：发束形状、毛衣露出面积、尾巴投影仍有变化；当前没有运行时播放验证，不能承诺转圈时无细节跳变。
4. 当前只保留候选，不把有缺陷的六格拼进原十二格，不以镜像、压窄正面或复制相邻格冒充修正。

## 生成与本机处理记录

使用内置 imagegen，不使用 CLI/API 额外调用；工具未返回可核实的具体模型版本。

唯一上传参考均为从本套 `knit/sprite.png` 派生的 768px 高透明 WebP，120302 字节。没有上传原始大图，没有使用 maid/winter 图片。

本轮两次请求：先生成六格；检查发现 120°/150°的帽饰侧别和角度间隔问题后，仅补修 120°/150°/210°三格。没有重复重做整张十二格，也没有重画原来保留的六格。

最终选择来源：

- 120°、150°、210°：三格局部补修（原生 1774×887）。
- 180°、240°、270°：本轮首次六格生成（原生 1024×1536）。

原始工具结果保留在：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-9870b6b2-2583-40df-b709-599c945ce1dc.png`

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-15912d70-7e65-45d8-be9e-c59c959c03fc.png`

本机处理仅做透明轮廓提取、孤立噪点清理、透明残色清理、等比缩放至审阅身高及排版。没有镜像、水平压缩、几何拼画或重画服装。脚本和核对报告只放系统临时目录，没有增加仓库脚本或依赖。

已核对原 sprite、原十二格联系表及原说明的 SHA-256，处理前后完全一致。仅新增本六格 PNG 和本说明；maid/winter、rig、运行时以及禁止路径均未修改。未启动 DSH/QQ，没有访问数据目录，没有 commit/push。

## 实际提示词

### 请求一：六格候选

```text
Edit target. Use case: identity-preserve.
Image 1 is the ONLY authoritative character/outfit reference, a small local copy derived from knit/sprite.png. Create ONLY SIX new full-body rotation views of this same character, in a clean THREE-column by TWO-row contact sheet. Do not draw the six approved front views. Do not redesign the character. Preserve exact chibi proportions, round face/large sapphire star-highlight eyes where visible, indigo-to-cyan long curls, fin ears, blue whale tail, colored fine outlines and polished full-color anime rendering.

Requested canvas1536x1536, each cell512x768, arranged LEFT TO RIGHT:
TOP ROW = 120 degrees,150 degrees,180 degrees.
BOTTOM ROW = 210 degrees,240 degrees,270 degrees.
Each figure same552px full silhouette height, shoes on y705 within its cell, centered at cellx256, complete hair tuft, tail, ears and shoes, generous transparent gutters. Actual transparent RGBA. No labels, text, numbers, drawn grid, scenery, floor or shadows. A local alignment pass will normalize the figures; prioritize correct perspective and full uncropped silhouettes.

ROTATION CONVENTION: 0 is facing the viewer;90 is a true profile whose NOSE POINTS TO SCREEN-RIGHT. Continue rotating AWAY from the viewer to180 back, then continue to270 whose NOSE POINTS TO SCREEN-LEFT. Screen-right/left refer to the viewer's picture, never the character's anatomical side.

CELL1 120: true rear-right three-quarter,30 degrees AFTER the right-facing90 profile. The head AND torso turn away from camera toward SCREEN-RIGHT. Show the back as the dominant plane, a distinctly foreshortened side of head/torso and overlapped shoulders; the right-edge near shoulder/arm presents a side plane. If any tiny cheek/nose edge remains it is on the RIGHT edge, hidden almost entirely by hair. NO eye, mouth, frontal bangs/face or chest whale visible. This is not a left-facing rear view.
CELL2 150:30 degrees BEFORE pure back. Only a mild rear-right angle, halfway between120 and180. Rear shoulder/hip line still clearly angled: right-edge near shoulder projects slightly closer/wider, far shoulder slightly occluded, unequal visible shoe-heel side planes. Back of head and knit cap clearly mildly turned toward SCREEN-RIGHT; no face. Must be visibly closer to pure back than120, and visibly less symmetric than180. Do not repeat180.
CELL3 180: exact straight back. Centered rear skull/cap and rear knit sweater, balanced shoulder/hip widths, both heels in balanced rear view; central body plane straight away. Long layered back curls, knit texture and rear plaid pleats. Absolutely no human face/eye/nose/mouth or front whale chest emblem. Garment structure matches all other cells.
CELL4 210:30 degrees AFTER pure back. Mild rear-left angle, naturally opposite in perspective from150, independently drawn. Left-edge near shoulder projects slightly closer/wider, opposite shoulder partly occluded, heel/knit side planes turn toward SCREEN-LEFT. Mostly back, with no human face. Clearly less turned than240 and less symmetric than180. Do not mirror150 or repeat180.
CELL5 240: true rear-left three-quarter,60 degrees AFTER pure back, approaching left-facing270. Head AND torso strongly turned toward SCREEN-LEFT; back still dominates, left-edge near shoulder/arm shows a broader side plane and overlaps far shoulder more than at210. Any tiny cheek/nose edge only at LEFT edge, hidden by hair; NO eyes/mouth/front face. Clearly more turned than210. Do not face screen-right.
CELL6 270: TRUE FULL PROFILE FACING SCREEN-LEFT. Nose tip on LEFT edge of face, exactly ONE visible eye looking LEFT, back of skull and long back hair on RIGHT of face. Visible nose/cheek profile and real head/torso thickness, overlapping near/far arms and legs. The head and body BOTH face LEFT. Must be the OPPOSITE facing direction to a right-facing90 profile. Not a front view squeezed narrow, not a rear view, not a horizontally mirrored bitmap.

KNIT OUTFIT from Image1: cream cable-knit cap/headband with small blue/white whale pin, navy bow and cream pompom; indigo loop tuft; navy/white fin ears; very long shaded blue-to-cyan curls; oversized cream cable-knit sweater, thick roll neck and ribbed cuffs/hem, small navy sleeve bows; navy-gray plaid pleated skirt; cream/white cable-knit socks or legwarmers with small navy bows; navy Mary Jane shoes and visible heel/sole detail; blue whale tail/light underside from same lower back root.
All five back-sector views show the SAME plain cream cable-knit sweater BACK with consistent stitching/folds and the SAME rear plaid skirt construction. Long hair may overlap but keep garment hem and back construction legible. NO maid apron, NO X straps/suspenders, NO large waist bow. Front whale motif NEVER appears on the back.
Keep cap whale pin/bow/pompom on the same PHYSICAL side: viewer-right in the original front becomes viewer-left in straight back, occluded naturally on far side. Do not place it on the same screen edge in every view. Do not mirror drawings. Preserve asymmetric tuft and tail.

Full-color highly finished raster anime illustration matching Image1 quality: volumetric layered shiny hair, detailed knit stitches, soft cel shading, plaid pleat depth, sock and shoe details. No SVG/vector, line art, sketch, simplified flat placeholders, copied neighboring poses, repeated angles, paper-thin profiles, extra limbs, crop, white/black fringe, double outlines, checkerboard or background. Distinguish the six actual yaw angles through HEAD AND TORSO geometry, not only tail position.
```

### 请求二：仅补修 120°、150°、210°

```text
Edit target. Identity-preserve. Image1 is the sole authoritative knit/sprite.png character reference. Create only THREE full-colored full-body rear-angle replacement sprites, not a full turnaround and not any front pose. Arrange one horizontal row of THREE equal cells, desired1536x768, transparent RGBA, complete552px-tall figures with shoe baseline705 inside512x768 cells. No text/grid/background/shadow. Same proportions and identity as Image1; navy-to-cyan long curly hair, cream cable-knit outfit and cap, plaid skirt, cream socks, navy Mary Janes, whale fin ears and whale tail.

All three show the back of the same character. Convention:90 is profile with nose pointing SCREEN-RIGHT,180 straight back,270 profile with nose pointing SCREEN-LEFT.
LEFT CELL=120 degrees: strong rear-right three-quarter, facing diagonally AWAY toward SCREEN-RIGHT. Body back plane is foreshortened, only back and right side, right-edge near sleeve clearly overlaps/occludes the far sleeve, hips/hem and heels clearly project diagonally to the right. Face and eyes entirely hidden by back hair. This is the more side-on of the first two cells. 
CENTER CELL=150 degrees: mild rear-right,30 before exact back. Crucially MUCH MORE STRAIGHT-BACK than the120 cell: show BOTH rear shoulders and BOTH heels, back/waist/skirt rear plane broad and almost full-width; right-edge near shoulder only slightly larger than left, clearly angled but nearly straight back. Reduce the visible torso side plane greatly compared to120. Back hair mass almost bilaterally balanced, with subtle rightward turn. NO eye/nose/mouth/face/chest graphic. Do NOT copy120.
RIGHT CELL=210 degrees: mild rear-left,30 after exact back. Like150 in degree of mild turn but the opposite shoulder is closer: BOTH rear shoulders and heels, broad almost full-width rear waist, LEFT-edge near shoulder slightly closer/larger, far right shoulder recedes slightly, heel and hem planes subtly turn SCREEN-LEFT. Much more straight-back than a strong240 rear-left angle. No face. Independently drawn, NOT a mirrored150.

Critical asymmetry correction: In the original FRONT image the cap's whale pin/navy bow/cream pompom are on VIEWER-RIGHT. They belong to ONE physical temple. During120 and150 that temple is on the FAR SIDE of the head, so the whale pin,bow and pompom MUST BE OCCLUDED BY THE HEAD/CAP. They must NOT appear visibly on the right rim of the120 or150 cap. Render simple uninterrupted cream knitting on the visible cap side in those first TWO cells; no whale pin,bow or pompom on either visible side. At210 the original temple starts coming into view at the SCREEN-LEFT rear cap edge, with only a small partial original pin/bow/pompom visible there. Do not relocate the accessory to the other temple. The cap itself, looped indigo tuft and fin ears remain.

Same knit clothing construction in all cells: plain cream cable-knit BACK with raised cable stitches and ribbed hem/cuffs, navy-gray plaid pleated skirt rear, cream knit socks with small navy bows, navy shoe soles/heels. Hair is layered glossy indigo-to-cyan wavy locks, not a flat block. Whale tail from same lower-back root with light underside. No maid apron, X straps, suspenders or big waist bow; no chest whale on back.
Keep full-color raster anime quality matching Image1, fine colored outlines and soft cel shading, natural cloth/knit folds, original short chibi legs and large head. Three genuinely distinct yaw poses with head AND body turning together; no copy, no reflection, no squashing, no front face visible. Actual alpha outside every character, clean fine edges, no floor, scenery, gradient, text, shadow, checkerboard, extra limbs or crop.
```

