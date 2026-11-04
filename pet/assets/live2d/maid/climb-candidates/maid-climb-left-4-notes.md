# maid LEFT 四帧爬墙候选

本轮将被拒绝的六帧方案改为四帧，保留旧六帧文件作历史候选。只生成LEFT，不做RIGHT，不安装、不改rig/avatar.js或其他运行时文件。当前为候选，等待用户美术验收。

## 联系表与查看顺序

文件：`maid-climb-left-4-contact-sheet.png`。

2200×2988透明RGBA，2列×2行，每格1100×1494。左上01、右上02、左下03、右下04。

循环顺序：`01 → 02 → 03 → 04 → 01`。

近侧指面向镜头的前景肢体，远侧指另一侧后景肢体。四帧始终朝画面左侧，没有镜像或改变墙侧。采用本套原始maid/sprite.png作唯一身份/服装参考，未混入knit/winter元素。

## 逐帧分工

| 帧 | 近侧手/臂 | 远侧手/臂 | 近侧腿 | 远侧腿 | 本帧节拍 |
| --- | --- | --- | --- | --- | --- |
| 01 | 高位，在前景；上臂侧抬，前臂向上折向左墙，清楚L形肘 | 低位，在后景；肘部下折再折回墙面 | 伸直支撑，低鞋可见外侧金扣 | 屈膝抬起，高鞋呈内侧/鞋底视图 | 首半周期抓握 |
| 02 | 仍高，肘和肩略收紧 | 仍低，肘保持折角 | 仍伸直支撑 | 仍屈膝，脚略向上调整 | 小幅上拉受力 |
| 03 | 变低，在前景；肘明显折弯 | 变高，在后景；保持可见L形肘 | 变为前景抬膝，高鞋可见外侧金扣 | 变为后景伸直支撑，低鞋外侧扣不显露 | 相反半周期抓握 |
| 04 | 仍低，保持折角 | 仍高，肘和肩略收紧 | 仍屈膝抬脚 | 仍伸直支撑 | 小幅上拉受力，随后回01 |

与旧六帧不同，这次01/02和03/04确实交换了前后肢体：前景袖臂从高位切到低位，前景腿从伸直切到屈膝；不是仅改变腕部位置或明暗。鞋的外侧金扣和遮挡关系也随同一近侧腿移动，供检查腿部身份。

每帧都保留至少一条接近伸直的支撑腿，没有双膝同时弯；每帧双肘均有可见折角。第02/04帧的“上拉”以收肘、肩袖与衣物受力、抬脚微调表现，不用全身向上位移，避免违反头髋固定要求。

## 对齐、透明与 wallInset

人物完整保留头发、头饰、双手、双脚和尾巴，背景无墙线、地面、阴影或文字。归一时先清理透明区域残色/孤立噪点，再对全部四帧使用同一个等比倍率约1.36463；没有逐帧放大缩小、旋转、镜像或程序化改造肢体。

平移依据头部发饰金点对齐，**不按脚底基线排齐**。头部中心用该固定标志估算，统一约(403.67,360.71)；裙下髋部采用人工参考点估算，映射后的横向范围约2.76px、纵向范围约1.68px。这些是候选配准参考，不是精确骨骼坐标。头髋在静态四格中视觉稳定，没有用整体上下漂移伪装上拉；总轮廓高度因脚部位置不同略有变化，仍接近原尺寸。

wallInset=每格alpha>16可见轮廓最小x，即左画布边缘到最靠墙可见像素的距离。全Alpha边距保留抗锯齿余量。

| 帧 | wallSide | wallInset px | 全Alpha左边距 px | 可见总高 px |
| --- | --- | ---: | ---: | ---: |
| 01 | left | 33 | 32 | 1435 |
| 02 | left | 33 | 31 | 1435 |
| 03 | left | 19 | 17 | 1445 |
| 04 | left | 16 | 14 | 1449 |

高低掌和鞋尖在各帧中视觉上位于同一窄的左墙接触带；没有画实际墙面。可见像素切线仍有少量绘画/抗锯齿差，不宣称逐像素刚体接触。各帧wallInset也不是相同数值，未来贴屏幕时需要按实际轮廓处理；本轮没有接入宿主逻辑。

## 检查结果与保留限制

逐帧视觉检查已确认两半周期的近远手脚交换、双肘折角、单腿伸直及LEFT朝向。04→01能回到“近手高、近腿直”的首相位，没有旧六帧同一分工反复不换的错误。头髋参考和原型轮廓未见明显整体上下跳动。

仍需用户检查：

- 第02/04帧收肘幅度较小，上拉受力节拍偏轻。
- 四帧呈A/A/B/B的关键姿势交换，切换较直接，不能称作连续流畅的抓握运动轨迹。
- 袖口、发束、围裙和裙纹存在绘画细节变化；接触点视觉接近同墙面，但不是像素级完全一致。
- 本轮只做候选；没有装入桌宠、测试窗口移动或验证正式宿主播放效果。

小循环仅用于审阅：4帧、每帧180ms、01→02→03→04→01，不是运行时速度配置。

[四帧循环预览](C:/Users/THUNOE~1/AppData/Local/Temp/maid-climb-left4-sevhyj/maid-climb-left-4-loop.gif)

[小联系表](C:/Users/THUNOE~1/AppData/Local/Temp/maid-climb-left4-sevhyj/maid-climb-left-4-small.webp)

## 素材来源与过程

使用内置imagegen，没有可核验的具体后端版本号。身份/服装始终只参考原maid/sprite.png的768px高WebP小副本（129568字节），没有上传原始大图。小型骨架图仅控制姿势/前后遮挡，不提供服装设计，所有引导颜色、文字与骨架都未进入最终联系表。

分两个半周期生成，避免在一张多帧表中反复复用同一组肢体。共四个小范围请求：生成01/02、仅修01/02双肘、生成相反的03/04、仅修03/04低掌接触。没有调用整张12帧转圈流程，也没有生成RIGHT。

最终01/02来源：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-b5acb8eb-aca3-4500-9267-68b23e884692.png`

最终03/04来源：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-5b108915-408e-4928-bc77-b4babea74ec1.png`

过程原稿（未选用其完整结果）：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-2ebd13fe-fe5c-4076-b6e9-7b3c8082ae19.png`

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-5a9efd38-ee1c-4393-a89e-0ffc4b9ae26c.png`

姿势引导、排版脚本和量测报告均只放系统临时目录：

`C:/Users/THUNOE~1/AppData/Local/Temp/maid-climb-left4-sevhyj/`

本轮仓库仅新增四帧联系表与本说明；保留旧六帧和所有现有文件，不改rig、avatar.js/CSS/README、turnaround12、maid/knit/winter运行时、web/lib/electron-app/tests/vendor，不访问数据目录、不启动DSH/QQ，没有新增依赖，没有commit/push。

## 实际提示词

### 首半周期1–2帧

```text
Character animation edit / identity-preserve.
Image1 is the ONLY maid character/costume/style reference (original maid/sprite.png).
Image2 is a POSE+DEPTH guide for ONLY frames1 and2, NOT costume/style. BLUE guide limbs are the CAMERA-NEAR/foreground left arm and leg. ORANGE limbs are the FAR/background right arm and leg. Copy those bone bends and overlap order, then remove every guide color/line/label/wall/circle.

Generate ONLY TWO full-body colored MAID sprites side by side, one horizontal row. Both always face SCREEN-LEFT and hug an invisible LEFT wall. These two frames are the SAME first half-cycle: NEAR HAND HIGH + NEAR LEG STRAIGHT. Do not draw the opposite half-cycle here.

MANDATORY DEPTH/POSE, BOTH FRAMES:
The nearest/foreground arm is the RAISED arm. Show its connected shoulder→upper arm→ELBOW→forearm→wrist clearly in FRONT of the hair. Upper arm rises beside the cheek; elbow forms a sharp approximately80–100degree corner; forearm folds LEFT to the wall. Guide elbow is near(145,280), shoulder(170,405), wrist(65,310), visible BELOW the eye rather than hidden behind head. No detached hand behind crown.
The FAR arm is LOWER with its own visible elbow corner near waist, palm touches same left wall plane. BOTH elbows visibly bent, not a pair of straight reaching sleeves.
The NEAREST/FOREGROUND LEG must be LONG AND STRAIGHT, from near hip diagonally DOWN-LEFT to the LOWEST shoe. Its knee is nearly unbent and plainly visible as a long support leg emerging from the near side of skirt. Bright near thigh/shin/sock and low shoe overlap the far leg at the hip. The near leg is NOT a raised round knee.
The FAR leg is the bent raised leg BEHIND the near support leg: thigh forward/up, knee bent90-ish, shoe HIGHER on wall. Use natural darker far-side shading/occlusion so it cannot be mistaken for the foreground leg. Exactly two legs; never both knees bent.
Near low shoe shows the original OUTER gold buckle; far raised shoe's outer buckle is naturally less visible from this camera. No arbitrary new color/marker on finished limbs.

CONTACTS:
All high/low PALM contact edges and the two SHOE SOLES touch the SAME invisible vertical axis at the LEFT. Palms/soles face LEFT wall, not a horizontal floor. The guide's wrist/ankle is inside the body side of the palm/shoe, not the contact edge. No hand hovering inland or limb through wall. Keep torso and face close to wall. Hair/whale tail sweep behind to SCREEN-RIGHT, leaving the joints readable.

FRAME1 left: near hand HIGH grip with raised bent elbow, far hand LOW brace; near leg STRAIGHT support, far knee BENT and shoe high.
FRAME2 right: SAME exact limb ownership, near hand still HIGH. Show an isometric upward pull through slightly tighter elbow flexion, raised shoulders/cloth tension and a small higher far-foot adjustment. HEAD and HIP centers remain fixed, no global upward movement, no camera zoom. Both elbows bent and near leg still straight. Two distinct drawings, not duplicated frame1.

KEEP Image1's exact huge rounded blue-haired chibi head, small body, star-highlight sapphire eyes, white scalloped maid headdress, original looped ahoge and cyan temple bow/gold center; white/navy fin ears. Navy puff-sleeve maid dress with gold trim/embroidery, navy neck bow and blue-gold brooch, white lace apron with blue whale emblem curving around left-facing body, lace petticoat and original small gold skirt bows, white frilled socks, navy Mary Jane strap shoes/gold buckles, blue whale tail/light underside and indigo-to-cyan long curls.
No winter hood/scarf/fur/boots; no knit beanie/sweater/plaid skirt; no clothing redesign. Keep source face/limb proportions, rounded eyes/pompoms, detailed hair/lace/folds and polished full-color anime cel-shading. Skeleton is pose only, not anatomy or rendering style.

Desired sheet1024x768 with two512x768 cells, full uncropped character in each cell with clear transparent gutters. Head center/hip center same as guide and identical between frames, feet are NOT a baseline. Transparent RGBA, no background, ground, wall/line, ladder, rope, shadows, glow, text, labels, watermark, skeletons, flat vector, sketches, extra limbs or crop. Final must be fully colored RASTER anime character art.
```

### 1–2帧仅修双肘

```text
Precise arm-only edit. Image1 is the authoritative maid identity/outfit. Image2 is the EDIT TARGET, two left-climbing figures with CORRECT legs. Image3 is ONLY the elbow pose guide, not style/costume.

Keep the two existing characters, heads, hips, headdresses, faces, clothes, hair/tails and especially the legs from Image2. The NEAR/front leg is STRAIGHT with visible outer gold shoe buckle at the LOW hold; the FAR leg is BENT behind with the shoe at a HIGH hold. Do not swap or redraw that correct ownership.

CHANGE ONLY THE TWO ARMS AND THEIR LOCAL CLOTH OVERLAP:
Current arms look straight and horizontal. Replace them with the guide's visible sharp bends.
HIGH NEAR ARM: raise the upper arm SIDEWAYS/horizontally to shoulder/chest height, place the ELBOW in open space LEFT of the face and BELOW the chin. From this elbow the FOREARM rises almost VERTICALLY UP beside the wall to the high hand near face/eye height. This forms an unmistakable big L (roughly80–105degrees), not a straight push. The upright forearm must run LEFT of the head silhouette, fully visible, not behind hair/head. The shoulder→elbow and elbow→wrist both need clear sleeve shapes and cloth folds at the corner. No floating high hand.
LOW FAR ARM: upper arm slopes down from shoulder to a LOWER elbow, then forearm folds UP-LEFT to lower palm, a clear V/90-ish bend below the high arm. Keep it behind near arm but visible outside apron/hair. Never leave either arm straight.
Both high and low palms press the SAME LEFT vertical contact plane as the existing shoe soles, fingers/palms facing LEFT. Don't draw a wall.
Frame1 is grip; frame2 is slightly tighter elbow/shoulder pulling tension. Keep head and hips stationary in both, no camera zoom/whole-body rise. SAME near-high/near-straight assignment in BOTH.

Fully finished colored anime raster matching Image1/2: navy gold-trimmed maid sleeves/cuffs, original skin hands, no colored guide limbs, no labels, skeleton lines or diagram head. Preserve original white lace apron/blue whale, navy-gold dress, socks, navy Mary Janes, blue curls and whale tail. No knit/winter design.
Two complete uncropped figures side-by-side, transparent RGBA outside, no background/floor/shadow/text/grid, no extra arms/hands or bent front knee.
```

### 相反半周期3–4帧

```text
Identity-preserve pose edit. Image1 is the ONLY original maid design reference.
Image2 is the successful FIRST HALF-CYCLE: near arm HIGH, near leg STRAIGHT. Use its exact character, style and head/hip placement, but CREATE THE OPPOSITE HALF-CYCLE now.
Image3 is the REQUIRED opposite-limb pose guide. BLUE=NEAR/front limbs, ORANGE=FAR/rear limbs. Remove ALL guide marks/colors/words/lines in final art.

Create ONLY TWO new full-body LEFT-facing climbing frames3 and4 side by side. DO NOT repeat the Image2 pose or mirror anything. Keep the same camera and face pointing SCREEN-LEFT.

FRAME3/4 MUST EXCHANGE ACTUAL LIMBS:
NEAR/camera-facing arm is now the LOW arm, visibly in FRONT across lower chest/waist, elbow bent DOWN into a V, wrist folds UP-LEFT to lower palm. The foremost puff sleeve/cuff must be this LOWER arm, not an upper foreground sleeve.
FAR arm is now HIGH and lies BEHIND the near arm/shoulder. Its upper arm is raised SIDEWAYS toward an exposed elbow LEFT of chin, then forearm turns sharply UP along LEFT wall to the high palm: clear L corner, same strong elbow template as Image2. Do not hide it behind head/hair. BOTH elbows visibly bend80–110degrees; no straight push and no detached high wrist.
NEAR/camera-facing leg is now the BENT RAISED leg in FRONT. The near thigh/knee projects up toward wall and overlaps the far thigh at skirt opening; white sock and HIGH shoe show the original near OUTER GOLD BUCKLE. This prominent lifted knee is now the foreground limb.
FAR leg is the LONG STRAIGHT support BEHIND it, nearly unbent knee and LOWER shoe. Keep far support leg clearly visible from under dress to low wall hold, shaded slightly darker and partially occluded at hip. Its outer buckle is naturally mostly hidden/inner view, not the bright foreground low buckle from Image2.
Exactly two arms/two legs. Never both knees bent. The near-side high-buckle shoe must be the raised one now; the lower straight-leg shoe must be the rear limb. Merely darkening the old pose is not enough: redraw ownership and overlap.

BOTH HANDS and BOTH SHOE SOLES contact the SAME LEFT vertical plane, as guide. Body/face close to wall, feet press vertical wall, not horizontal floor. Do not draw any wall/line/props.
Frame3 grips in this opposite phase. Frame4 contracts the elbows/shoulders slightly and lifts the bent near-foot a little to express upward pulling FORCE. Keep HEAD and HIP centers FIXED between both frames and consistent with Image2; no overall rising, bobbing or zoom. Upper pull is limb/cloth tension, not whole-body translation.

Preserve EXACT MAID: navy-gold puff-sleeve dress, white lace apron/blue whale emblem, gold trim/buttons/skirt bows, white lace petticoat, original navy neck bow/blue-gold brooch, white scalloped maid headband, cyan temple bow/gold center, looped indigo ahoge, navy/white fin ears, glossy indigo-to-cyan long curls, blue whale tail/light underside, white frilled socks and navy Mary Jane gold-buckle shoes. No knit/winter items. Hair/tail behind toward SCREEN-RIGHT, don't hide joint corners.
Keep same round chibi identity and limb proportions, star-highlight blue eyes, fine colored outlines, fully colored polished anime raster. Two distinct drawings, not duplicates. Complete uncropped figures with transparent gutters. Transparent RGBA, no floor/shadow/background/checkerboard/text/labels/guide colors/skeletons/vector/sketch, no extra limbs.
```

### 3–4帧仅修低掌接触

```text
Precise localized edit. Image1 is original maid identity/style. Image2 is the EDIT TARGET: the correct opposite half-cycle frames3/4.

All limb OWNERSHIP, elbow bends, legs, head, hips, face, hair, clothes, headdress and tail in Image2 are already correct. Keep them.

ONLY FIX THE LOWER, NEAR-SIDE PALM CONTACT:
In each figure the LOWER foreground hand is about25–30 native pixels too far to the RIGHT/inland compared with the upper palm and the shoe tips. Move ONLY this lower hand, cuff and the immediately adjoining forearm LEFT by roughly30 native pixels (about18px at the current small two-figure preview), keeping its vertical height and visible V-shaped elbow.
The leftmost contact edge of lower PALM must be on EXACTLY the SAME vertical tangent plane as the leftmost contact edge of upper palm AND both shoe soles/tips. Keep the upper palm and shoes in their existing positions. Do not align to the wrist/cuff: align the PALM contact edge.
Let lower forearm reach a little farther LEFT while retaining the clear elbow corner; don't straighten the whole arm, don't move shoulder/body/head/hip. Do not shift whole figure or rescale. Don't move the near raised knee or far straight leg. This is a tiny reach correction, not a new pose.

Maintain frames3/4: FAR high arm with exposed L elbow behind the near sleeve; NEAR lower arm with V elbow in FRONT; NEAR BENT raised leg with visible outer gold buckle on HIGH shoe; FAR LONG STRAIGHT support leg/shoe LOW with less-visible outer buckle. One leg remains nearly straight, both elbows clearly bent. No mirroring or role swap.
Keep slight pulling difference between the two frames, same stationary head/hips. Character faces SCREEN-LEFT. Invisible left wall, do not draw any wall/line/arrow/text.
Preserve fully colored polished original blue-haired MAID with navy/gold dress, white lace apron/blue whale, white maid band, cyan side bow, frilled socks, navy shoes and whale tail; no knit/winter elements. Transparent RGBA, complete uncropped two figures side by side, no ground/background/shadow/labels/extra limbs or blur.
```

