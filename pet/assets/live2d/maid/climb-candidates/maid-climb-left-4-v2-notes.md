# Maid LEFT 四帧过渡候选 v2

日期：2026-11-04。状态：候选素材，等待美术验收；尚未安装。

## 文件与排列

- 新联系表：`maid-climb-left-4-contact-sheet-v2.png`，2200×2988，RGBA。
- 每格1100×1494；上排01/02，下排03/04；循环顺序01→02→03→04→01。
- 01、03直接复制旧联系表对应格的解码RGBA像素；没有重画或重新生成。
- 02以01为底图、04以03为底图，分别编辑换手、支撑肘和自由屈腿。两个直支撑腿均清楚可见。
- 本轮仅新增本联系表与本说明；旧四帧、旧六帧及其说明原文件未覆盖。

## 逐帧动作与实测

坐标均相对于单格左上角，x向右、y向下。近侧/远侧沿用原01/03的肢体身份。掌心及关节点由图形人工标记；遮挡处的髋点采用同一固定点，角度是图像估算，不是骨骼数据。下列数值是成图复测结果，不是提示词目标。

| 对比 | 自由掌心变化 | 自由膝变化 | 高位支撑肘 | 肩部上提 |
| --- | --- | --- | --- | --- |
| 01→02 | 远手(58,775)→(207,720)：向右149px、向上55px；手指朝左，离开墙 | 约82°→122–126°，增加约40–44°；脚踝(80,1090)→(95,1225)，向下135px | 近肘约98°→65° | 肩点约(305,645)→(260,630)，向左45px、向上15px |
| 03→04 | 近手(50,725)→(228,632)：向右178px、向上93px；手指朝左，离开墙 | 约83°→124°，增加约40°；脚踝(80,1040)→(105,1160)，向下120px | 远肘约99°→59° | 肩点约(265,638)→(235,620)，向左30px、向上18px |

- 01：原版近手高、近腿直，远膝高抬。
- 02：远手抬至胸前并向左伸；近侧支撑臂折成急V；远腿从高抬姿态向下伸展。近侧直腿承担支撑。
- 03：原版远手高、远腿直，近膝高抬，是换手换脚后的半周期。
- 04：近手抬至胸口上沿；远侧支撑臂折成急V；近腿向下伸展。远侧直腿承担支撑。

04最终自由膝复测采用H=(305,980)、K≈(148,1025)、A≈(105,1160)，角约124°。用更保守的K=(140,1018)、A=(110,1170)重算，角约114°，相对同一03基准的增量约31°，也超过25°。02膝点约(115–120,1060–1065)，固定H=(285,980)、A=(95,1225)，角约122–126°。

## 剪影差异

以alpha≥128计算二值剪影；差异率=两格剪影异或像素数/并集像素数。手臂与腿部区域分别计算，避免头发的大面积固定像素掩盖动作变化。

| 对比 | 手臂ROI与差异率 | 自由腿ROI与差异率 | 全身差异率 |
| --- | --- | --- | --- |
| 01→02 | x0–439 / y510–909：21.75%（30,843像素） | x0–239 / y850–1349：49.87%（42,474像素） | 8.63% |
| 03→04 | x0–469 / y470–909：21.25%（38,367像素） | x0–239 / y850–1329：48.53%（40,866像素） | 9.07% |

可见差异来自胸前出现的自由手、向下展开的屈腿、位置更低且更尖的支撑肘；不是仅更换袖褶。01/02、03/04各自的固定头脸检查区域124,106像素中，变化像素均为0。

## 对齐、墙侧与wallInset

墙在画面左侧。没有绘制墙、背景、地面或文字；四格均含透明像素，头发、帽、尾巴、双手双鞋完整。头部位置和髋部画布坐标采用各自底图；没有整体缩放人物。

以下wallInset为alpha≥128的可见轮廓最左x值，供未来安装时参考，**本轮未写入rig或运行时**。自由鞋向左前探会改变轮廓最左点；高抓握手沿用对应底图锚点。

| 帧 | wallInset(px) | 可见轮廓包围盒[xMin,yMin,xMax,yMax] |
| --- | ---: | --- |
| 01 | 35 | [35,25,899,1457] |
| 02 | 15 | [15,25,899,1457] |
| 03 | 20 | [20,25,902,1466] |
| 04 | 6 | [6,25,902,1466] |

## 素材来源与处理

使用内置imagegen编辑；工具未返回具体模型版本。输入为本机01/03的小尺寸副本与局部姿势引导，没有上传原始大联系表；没有调用四格或12格整体再生成。

实际流程：01/03解码原像素锁定 → 02/04分别局部imagegen修绘 → 朝左自由手与急V支撑臂小块修绘 → 自由膝小块修绘 → 遮罩合成回底图 → 复测 → 逐格拼接。

04最后一次膝部小块生成被图像工具拦截，未产生或使用该次结果。最终以此前已生成的完整上色膝部位图作平滑局部关节定位：膝部中心附近向右20px、向下12px，位移场在y=940/1110归零；脚踝及远侧直腿固定区复用原像素。没有整体缩放，也没有用几何形状替代人物。

选用的原始生成图路径：

- 02局部全身修绘：`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-c1241c6e-5656-47f4-a975-18761e0b9e93.png`
- 04局部全身修绘：`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-ac381199-b4a7-45a0-a9ad-cf09bf3b85af.png`
- 02朝左自由手：`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-58fd1d61-225a-4cb0-848c-9f9555177d3f.png`
- 02急V支撑臂：`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-52d3c2ad-3cd8-4c6c-834a-4c0c707669ba.png`
- 04急V支撑臂：`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-175372e1-7984-41db-ad97-e3233d52bc49.png`
- 02膝部：`C:/Users/THUNOEROBOT/.codex/generated_images/01a1a2ba-c879-7bd3-b08a-cea7816c0085/exec-ceab4418-b8a7-46be-803e-cd1c8139a95c.png`
- 04膝部：`C:/Users/THUNOEROBOT/.codex/generated_images/01a1a6c0-4856-7542-8850-0f20ee464dd1/exec-189020a0-006a-4c1e-8be3-a6cee1425d64.png`

## 原格未修改的校验

原始联系表文件SHA-256：
`232125df1f3fce3acd86ef474f2f1ec3f245ecba297bc008bcc1fd1ec029d27d`

新联系表01/03解码RGBA与原联系表对应格逐像素一致。原格与新格各自的RGBA SHA-256相同：

- 01：`a23a7dbbbff4cf9fb3b3ed202e46d4c5477d59fd11f18e4f5de633266e2f4c7a`
- 03：`742c7adeca4e7f94c89103fd3145d724ef23b56cad55e56882207fbd012cb559`

## 验证与待审事项

- 4/4格解码成功、1100×1494 RGBA；透明背景；01/03原格校验通过。
- 手部上移均≥40px；膝角增量均≥25°，支撑肘接近60°；两个直支撑腿可辨。
- 已生成01→02→03→04→01离线循环预览，并逐格核对顺序；预览仅用于候选动作阅读，不代表运行时已安装。
- 角度/肩点为可见图形人工估算；04自由手位于胸口上沿，接近下巴，需美术验收确认位置。
- 不制作RIGHT，不修改avatar.js、CSS、rig、turnaround12、maid/knit/winter运行时；未访问数据目录，未启动DSH/QQ，未commit/push。

## 实际使用的提示词

以下记录用于选用素材的完整提示词；数值目标与最终复测值请区分，以前文成图复测为准。

### 1 maid_t4_cleanup02b_prompt

```text
Use case: precise-object-edit.
Edit Image 1 only. ONE finished full-color anime sprite on transparent RGBA; do not create a contact sheet.
This is a rough bitmap collage of the REQUIRED new climbing transition 02 pose. Refine its patch seams and flat sleeve/leg sections into the same detailed cel-shaded artwork as the rest. DO NOT change the pose or move the hands back down.

The small FREE HAND directly in front of the CHEST MUST stay high at (205,675) on a1100x1494 design canvas. It is almost below the chin, fingers pointing LEFT, released from the wall, NOT at the waist. Remove the prior waist-level hand.
The high fixed gripping hand stays at the upper-left anchor, palm about(60,510). Its arm is an acute folded V: shoulder(245,575), elbow(90,690), wrist(75,575), internal bend60degrees. Upper arm goes down-left from shoulder; forearm goes up-left to grip. DO NOT make a90degree elbow or a broad shallow L.
Exactly two arms/two hands.

The raised free knee is EXTENDING DOWN. Hidden hip(285,980), knee(115,1030), ankle(80,1180); internal knee120degrees. Knee is lower and foot is90pixels lower than the original. One exposed thigh/calf, white sock, navy Mary Jane shoe. The OTHER long straight near support leg and its lower shoe are FIXED, exactly as Image1. Exactly two visible legs and shoes. 
Head, face, blue eyes, hair and hat shape, whale apron, waist bow, embroidered maid dress, tail, character size, head and hip alignment, straight leg and gripping hand positions are all fixed. Do not redraw another pose or redesign the character. Finish only changed limb joins/shading while following the guide silhouette.
Complete body inside canvas, no cropping. Genuine transparent background, no wall/floor/shadow/grid/checkerboard/text/numbers, no added limbs, no ghost old limb contours.
```

### 2 maid_t4_cleanup04_prompt

```text
Use case: precise-object-edit.
Edit Image 1 only. This is a deliberately assembled color bitmap pose draft for a LEFT climbing transition. Produce ONE finished transparent full-color sprite. Keep the exact draft silhouette, arm and leg positions. Only finish the rough painted joins, sleeve folds, skin contours and socks/shoes. DO NOT restore a different idle or earlier climbing pose.

POSE LOCK: the upper-left gripping hand is FIXED at its source anchor. The far supporting arm is the large sharply folded V from shoulder (230,590) to elbow (80,700) to wrist (55,478) in a 1100x1494 coordinate canvas; elbow about60degrees. Do not round this into a right angle.
The other free hand is directly below the chin at CHEST height, palm center (210,620), fingers extend horizontally LEFT, released from the wall. Keep it at this high position, not at waist.
The near free bent leg knee at (130,1015) and ankle (85,1150) is opening to120degrees; foot has moved DOWN. Its shoe is the upper of the TWO shoes.
The FAR STRAIGHT SUPPORT LEG with the lower shoe at y1400 is FIXED: preserve that whole long straight leg, ankle and shoe, do not erase it or merge it with the bent leg. Exactly TWO arms, TWO legs and TWO visible shoes, one bent leg and one straight.

INVARIANTS: same head position, face, blue eyes, long indigo-cyan hair, white maid headdress/blue bow, fin ear, whale apron emblem, navy embroidered maid dress, white petticoat/socks, Mary Jane shoes, whale tail. Do not change body height, hip location, camera, pose silhouette or contact anchors. No geometric flat patches in the final; fully painted folds matching the existing anime art.
Transparent RGBA only, clean alpha, no scenery, floor, wall, shadow, checkerboard, numbers, text, overlays, extra limbs. Full body fits exactly inside portrait canvas.
```

### 3 maid_t4_hand02_prompt

```text
Use case: precise-object-edit. Edit this small CROPPED LEFT-CLIMB CHEST PATCH only. Do NOT generate a whole character or contact sheet.
Change ONLY the small exposed free hand and its white lace cuff orientation. Rotate/repose this hand so its four fingers extend LEFT, almost horizontal, as it reaches toward a wall on the left. Palm center stays in the same chest-level location. Wrist joins the navy sleeve on the RIGHT. Fingers point left/up-left by about10–20 degrees, not straight upward. The hand has just released a low wall grip and is reaching left from chest. Draw natural 5-finger anime anatomy.
Keep the dark navy sleeve, elbow, shoulder white frill, neckline, apron edges and blue hair exactly where they are. Keep camera and crop, size, position, colors, line weight and rich cel-shading. Complete the free hand with clean dark outlines and pale skin. Only ONE free hand in this patch. Do not add any hand or new cuff near the neck. Transparent RGBA gaps, no background, no text or labels. Return same cropped composition.
```

### 4 maid_t4_arm02_prompt

```text
Use case: precise-object-edit.
Edit this SMALL cropped bitmap only; return the same crop, not a full character.
This crop already has the exact required acute V-shaped supporting arm for frame02. The high gripping hand at top-left is fixed. The other free hand pointing LEFT in the middle foreground and its cuff/sleeve are fixed. Keep the face/chin, neckline, shoulder frill and hair exactly.
ONLY clean the rough seam/ink damage in the BACKGROUND supporting navy sleeve at left; paint natural detailed cloth folds in the same anime cel-shading. Preserve its exact outer silhouette and sharp elbow V; DO NOT change elbow bend or hand positions.
Geometric guide on this370x300 crop: supporting wrist(70,55), supporting elbow(140,220), shoulder(240,85), internal elbow60degrees. Outer elbow bottom stays at y260. Upper arm runs diagonally down-left from shoulder to elbow; forearm runs diagonally up-left from elbow to fixed grip. Do not make the upper arm horizontal or the elbow a90degree L. The foreground reaching hand overlaps this support sleeve and must remain fully visible pointing LEFT.
Fully finished raster anime painted cloth, no geometric flat patches, no ghost old arm outlines or double seams, clean transparent RGBA gaps, no background, shadow, text, wall or labels. Keep the crop alignment and all unedited pixels/objects in place.
```

### 5 maid_t4_arm04_prompt

```text
Use case: precise-object-edit.
Edit this small CROPPED upper-body patch only, returning the same composition. No full character and no contact sheet.
The background supporting navy sleeve at LEFT already has the exact required60degree acute V pose. Clean the rough rotated-pixel join and cloth folds, preserving this exact V outline and elbow tip position. Wrist near(55,170), elbow(105,400), shoulder(235,280) in this450x570 crop. Outer elbow bottom abouty440. Forearm slopes down-right from fixed wrist to elbow; upper arm slopes up-right to shoulder. No90degree L, no moving elbow back upward.
The high fixed gripping palm/cuff at top-left is locked. The other free horizontal hand under the chin, foreground arm, face/eye/blue hair, lace shoulder, neckline and apron fragments are locked. Do not add a cuff near the neck or change the hand direction. Preserve body proportions and all positions.
Only refine the support sleeve's dark ink edges and rich anime cel-shaded folds to remove collage remnants. Transparent RGBA gaps, no background/wall/shadow, no labels or text, no extra limbs, no duplicate outline.
```

### 6 02-knee

```text
Use case: precise-object-edit. Asset type: LOCAL sprite knee repair patch, a 320x480 portrait crop, not a full character. Image 1 is the EDIT TARGET: a rough deformation made from the actual sprite pixels, with the requested new knee silhouette already present. Image 2 is the original crop for matching exact painted skin, outlines, shadows, sock/shoe and clothing appearance ONLY; do not restore Image 2's straighter knee. Primary request: repair ONLY the exposed bent BACK leg's thigh/knee/calf skin and outline seams in Image 1 to make the existing new bent-knee silhouette naturally drawn. Preserve the knee location and approximately 120-degree knee opening from Image 1: in native crop coordinates hidden hip reference (285,60), knee center (115,135), fixed ankle (95,305). Match the precise chibi anime sprite rendering and skin shading of Image 2. Keep all other pixels and their positions fixed: navy and gold skirt on upper right, large straight foreground leg on right, white ruffled sock cuff and entire small back shoe on lower left. The back sock, ankle and shoe positions are fixed, and the straight foreground leg must remain straight and unchanged. Remove the rough pixel-warp seam at the knee while keeping the new silhouette. Same crop and framing, transparent background with alpha, no new elements, no labels, no diagrams, no extra limbs, no full person. Do not lengthen the leg, move the foot, redraw the dress, or make the knee straighter.
```

### 7 04-knee

```text
Use case: precise-object-edit. This image is a SMALL CROPPED EDIT TARGET showing only the two legs and lower skirt of the same blue-haired chibi maid. Render this exact crop, same composition and same transparent background, no expansion to a whole character. Smooth only the roughly cut and transformed bare skin of the FOREGROUND BENT FREE LEG. The guide already places this leg at the required pose: hidden hip H=(305,86), bent knee K=(150,121), ankle A=(105,266), all measured on the 400x600 input crop. Keep hidden hip fixed under the existing skirt. Keep the knee clearly farther RIGHT and slightly DOWN than its old pose, and make the internal hip-knee-ankle angle approximately 120 degrees. The foreground thigh extends leftward from the hidden hip to the knee, and the calf slopes DOWN-LEFT from this knee to the existing sock and shoe. Clean the skin seam and restore smooth matching anime line art and shading around the knee while following these exact positions. Keep the existing foreground white frilly sock, navy gold-buckle shoe and its position unchanged. Keep the other long straight supporting leg, its white sock and lower shoe visible and unchanged. Keep the skirt, apron, lace, gold embroidery, bows, skin colors, existing style and all other content unchanged. Exactly TWO legs and TWO shoes, separated silhouettes; the raised foreground shoe remains above the lower supporting shoe. Do not re-pose the long supporting leg. No labels, coordinate marks, text, added objects, framing, new background or whole-body generation. Return a polished local transparent PNG patch of this same crop.
```
