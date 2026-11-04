# maid 左侧爬墙六帧候选：未通过姿势验收

本轮只交付 LEFT 候选，不安装、不更新 rig 或 avatar.js。左侧尚未通过，因此没有生成 RIGHT，也没有用左侧水平镜像冒充右侧。

**未完成的核心项：六帧没有真正交换高低手和伸直/屈膝腿；高位上臂/前臂折角仍偏弱。不能把这张联系表视作已完成的交替攀爬循环。**

## 文件与帧编号

文件：`maid-climb-left-6-contact-sheet.png`。

3300×2988 RGBA，3列×2行，每格1100×1494。左上到右下编号01、02、03、04、05、06。透明背景，没有墙线、地面、阴影、文字或网格。完整保留帽子、发梢、手脚与鲸鱼尾巴，最终格子边界没有裁断人物。

墙侧均为画面左侧，角色始终朝左。拟议查看顺序为：

`01 → 02 → 03 → 04 → 05 → 06 → 01`

该顺序仅供检查，**不是已批准循环**。当前六格属于同一攀爬阶段的不同手部位置，没有达到相反半周期的肢体交替。

## 逐帧实际姿势和 wallInset

near指面向镜头的一侧肢体，far指另一侧。以下是实际生成结果，不是提示词要求的理想姿势。

wallInset采用每格 alpha > 16 可见轮廓的最小x值，即左侧画布边缘到最靠墙可见像素的距离。完整非零Alpha轮廓的边距另列；不使用脚底基线计算。

| 帧 | 实际手臂姿势 | 实际腿部姿势 | wallSide | wallInset px | 全Alpha边距 px | 可见总高 px |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 01 | far手高、near手低；高肘弯弱 | near膝抬起弯曲、far腿伸展 | left | 24 | 23 | 1367 |
| 02 | 同一分工；低手略向前伸 | near膝仍弯、far腿仍伸展 | left | 20 | 18 | 1396 |
| 03 | near低手抬至胸前，未超过far高手 | near膝仍弯、far腿仍伸展 | left | 20 | 18 | 1452 |
| 04 | near手下移近腰；far手仍高 | near膝仍弯、far腿仍伸展 | left | 15 | 12 | 1404 |
| 05 | near低手再次向前伸 | near膝仍弯、far腿仍伸展 | left | 27 | 23 | 1402 |
| 06 | near手再次抬至胸前 | near膝仍弯、far腿仍伸展 | left | 19 | 17 | 1434 |

wallInset只是轮廓测量，不表示双手/双脚都已正确接触同一墙平面。低手在多帧中比高掌更向画布内缩，接触关系也尚未通过。

## 头部/髋部对齐方式

没有按脚底排齐。为使候选可检查，先检测固定服装标记，再估算两个人体参考点：

- 头部参考：发饰金色中心相对偏移(-45,-25)个原始像素，估算头部中心。
- 髋部参考：围裙蓝鲸图案中心相对偏移(+25,+38)个原始像素，估算髋部。
- 对六格做等比例相似配准（等比缩放、约−1.1°到−3.6°的小角度旋转和平移），将头部参考统一到约(380.86,314)，髋部参考统一到约(350.86,924)。
- 没有旋转、拼接或程序化补画手臂/腿来伪造换位，也没有镜像任何格子。处理仅作用于完整位图的归一和排版。
- 脚部位置自由变化，因此总轮廓高度1367–1452px，接近本轮要求的约1439px；没有逐帧用脚底拉伸到同一高度。

这些锚点是服装标志推算的候选参考，不是精确骨骼中心。源图头身和裙摆也有细微变化，归一后仍有少量尺寸/轮廓变化；不能保证完整循环已达到无跳动的运行时标准。当前主要动作失败不会被对齐处理修复。

## 未通过项与已保留部分

1. **手脚角色交换未完成。** 六帧都是far手高/near手低、near腿屈膝/far腿伸展；第3、6帧只是低手上移。
2. **高位手的抬臂折角不足。** 第二版比首版显示了更多上臂轮廓，但肩→肘→腕仍浅折、接近伸直，尤其1/2/4/5帧；低位肘部折角较清楚。
3. **贴墙接触与闭环仍需修正。** 高低掌不始终落在同一垂直平面；6→1也不是完成换手换脚后的回环。没有进行桌宠宿主或动画循环验收。
4. 蓝发、女仆帽、侧边青色蝴蝶结、围裙蓝鲸、navy/白/金色女仆裙、白袜、Mary Jane鞋、鳍耳和鲸尾基本保留；金色裙纹与围裙细节较原图简化。没有混入knit/winter服装。
5. 各帧左向、可见一伸一屈腿、背景真实透明等部分可以验证，但不能代替动作合格结论。

RIGHT暂未开始。只有LEFT姿势获得批准后，才另画独立右侧，不能直接翻转这套候选。

## 来源与原始生成路径

唯一服装/身份参考为`pet/assets/live2d/maid/sprite.png`。上传的是768px高WebP副本，129568字节，没有上传原始大图。

使用内置imagegen两次，均只请求LEFT六帧，没有调用十二格转圈流程：

- 首轮：高位上臂被头发遮住，而且手脚未交替，未采用其图作为最终联系表。
- 第二轮：新增68142字节的小型火柴人姿势引导。它只提供骨架位置和near/far肢体颜色，不是服装/身份参考；最终仍是完整上色位图，没有把骨架或线条画当角色素材。第二轮有所改善，但仍未达到关键姿势要求，已明确标注不通过。

工具未返回可核验的具体后端模型版本，来源记录为内置imagegen。

原始生成：

首轮（1254×1254 RGBA）：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-e8c5edfb-bb95-47e1-8231-7bad8feaab88.png`

第二轮、当前候选来源（1024×1536 RGBA）：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-771d6f08-096e-41dd-871c-84f9118d2424.png`

姿势引导与归一数据仅在系统临时目录：

`C:/Users/THUNOE~1/AppData/Local/Temp/maid-climb-left6-4Jug50/left-climb-pose-guide.png`

`C:/Users/THUNOE~1/AppData/Local/Temp/maid-climb-left6-4Jug50/maid-climb-left6-layout-report.json`

开工HEAD为2daa36b，git status为空。仓库只新增本联系表和本说明，不改maid/knit/winter的rig、turnaround12、avatar.js/CSS/README或web/lib/electron-app等路径，不访问数据目录，不启动DSH/QQ，没有新增依赖，没有commit/push。

## 实际提示词

### 首轮

```text
Edit target / identity-preserve.
Image1 is the ONLY authoritative character and costume reference, maid/sprite.png. Preserve exact chibi identity, huge rounded blue-haired head, tiny body, original face/eye style, indigo-to-cyan curled hair, fine colored outlines and polished full-color anime shading. Do NOT redesign the outfit.
Create ONLY ONE six-frame LEFT-WALL CLIMB LOOP contact sheet, not a turnaround and not a right-wall set. Exactly THREE columns by TWO rows, left-to-right top-to-bottom. Desired1536x1536, cells512x768. No labels/numbers/grid.

INVISIBLE WALL AND BODY POSITION:
The vertical wall is at the LEFT of EVERY cell. Character always faces SCREEN-LEFT toward the wall, true left-facing profile or very slight left three-quarter, one main visible eye and nose points LEFT. Body hugs the wall, chest/hips close to it, not a person standing far away while reaching sideways.
Palms and shoe soles meet ONE common invisible vertical contact line aboutlocalx32; do NOT draw any wall, line, floor, ladder, rope, ledge or props. Nose/forehead/chest remain just behind that line, no large empty gap. Hair, skirt and whale tail fall BEHIND the body toward SCREEN-RIGHT, never through the wall or farther left than touching hands/feet. Keep wall-side hands, elbows and legs readable in front of the hair, do not bury the action under the hair/skirt.

POSE ESSENTIALS IN EVERY FRAME:
Exactly two arms/hands and two legs/shoes.
ONE HAND HIGH beside the upper head and ONE HAND LOWER near chest/waist, both at the wall contact line. High upper arm is raised, elbow visibly bent, forearm folds LEFT toward wall. Low arm also has a readable elbow corner. Neither a T-pose nor two straight reaching arms. Show the bent upper-arm/forearm connection, not floating hands.
At least ONE LEG IS LONG AND NEARLY STRAIGHT from hip toward a lower wall foothold, knee nearly unbent, a clear support/push leg. The OTHER thigh/knee is lifted and bent distinctly, foot higher on wall. Never two knees bent simultaneously, never a seated/crouched/frog pose with both heels tucked under skirt. Keep the long support leg visible despite the skirt and hair. Shoe soles press against the wall; feet are not on a horizontal floor.
Preserve short chibi limb proportions; climbing hand can reach beside upper head, it need not extend far above the tall head. Keep modest original dress/petticoat covering hips.

LIMB IDENTIFIERS for description only, NOT letters to draw:
A=near-side/camera-facing arm and leg; B=far-side arm and leg. Keep these actual limbs consistent, do not swap costume details by reflection.
FRAME1 top-left: A hand HIGH grip with elbow raised/bent, B hand LOW brace. B leg long NEARLY STRAIGHT to low wall foothold; A knee lifted/bent and A foot higher on wall.
FRAME2 top-middle: A hand maintains HIGH grip, B hand starts reaching upward from low brace but stays LOWER than A, elbows bent. B leg remains clearly STRAIGHT supporting; A knee stays raised/bent and foot advances slightly higher.
FRAME3 top-right: B hand now takes HIGH grip, A hand releases to a LOWER chest-level grip, both elbows bent. A leg has extended to become clearly STRAIGHT support; B knee now raised/bent, B foot higher. A different handoff pose, no duplicate of1/2.
FRAME4 bottom-left: B hand HIGH secure grip, A hand LOW near waist, upper-arm/forearm corners obvious. A leg long STRAIGHT support to low contact, B leg distinctly BENT with high knee. This is the opposite limb phase toFRAME1.
FRAME5 bottom-middle: B hand stays HIGH, A hand begins reaching up from low position but remains LOWER than B; bent elbows. A leg stays STRAIGHT support, B knee stays lifted/bent and foot adjusts higher.
FRAME6 bottom-right: A hand regains HIGH grip, B hand moves down to a LOWER middle/chest grip. B leg has become STRAIGHT support again, A knee lifted/bent. A transitional version leading naturally back toFRAME1, not a copied1.
All six must look like alternating CLIMBING, not six standing side views or six identical one-knee poses. Hand/leg roles visibly exchange. No frame may have both knees bent or both arms straight.

ANCHOR / SCALE CONSISTENCY:
Head and hips stay in the SAME position in every cell; limbs cycle around a stationary head/torso/hip, no whole-body rising/bobbing. Host will move the window upward separately. Use a fixed head/skull center aroundcell(x220,y230) and hip center around(x170,y530), matched skull size and head-to-hip distance across all six. Feet can move and are NOT an alignment baseline. Crown/ahoge near y35 and extended support shoe near y735; fit the FULL character inside each cell with transparent margin, no cropped hair/headdress/fingers/tail/shoes. No camera zoom between cells. The whole outline is around690–705px high; local packaging will place the six on individual1100x1494 transparent canvases with stable head/hip anchors and original-like scale.

MAID OUTFIT EXACTLY Image1:
White scalloped frilled maid headband, original looped indigo ahoge, small cyan temple bow with gold center on same physical side, navy/white fin ears; huge glossy layered indigo-to-cyan wavy long hair. Navy puff-sleeve maid dress with gold trim/embroidery, navy neck bow and blue-gold brooch, white lace-trimmed apron with blue WHALE front emblem and original small gold fastenings, layered white lace petticoat with navy/gold hem and little gold skirt bows. White frilled socks and navy Mary Jane strap shoes with gold buckles; blue whale tail with light underside from lower-back root. At left profile the apron curves around torso and may be partly occluded, not a flat front apron pasted onto a side body. Hair bow fixed physical temple, not duplicated. No knit beanie/sweater/plaid skirt; no winter whale hood, scarf, fur coat or boots. Original whale-fin ears/tail stay distinct.

Fully finished COLORED RASTER anime illustration matching Image1, detailed glossy curls, fabric folds/lace/gold embroidery and shoe shapes. Not SVG/vector, stick figures, sketches, line art or simple geometry placeholders. Genuine transparent RGBA outside figures and inside gaps. No background, floor, shadow, glow, opaque white/black, checkerboard, text, watermark, extra limbs, limb duplication, cropped tips, white/black fringe or double outline.
```

### 第二轮：仅LEFT六帧，加入骨架姿势引导

```text
Identity-preserve character animation, LEFT CLIMB only.
Image1 = ONLY authoritative character/costume/style reference: maid/sprite.png.
Image2 = ONLY a skeletal POSE GUIDE for the six phases. Its blue limbs mean NEAR/camera-facing limbs; orange means FAR limbs. Gray is head/torso and the LEFT invisible wall. Follow the joint positions and near/far role changes, but remove ALL guide colors, lines, circles, numbers, lettering and wall in the final art. Do not borrow any design from the skeleton.

Create ONE fully colored six-frame MAID climbing sheet, THREE columns by TWO rows, phases1–6 matching Image2 left-to-right top-to-bottom. NOT a right-climb set, not a turnaround. Transparent RGBA, complete figures inside separate cells with generous gutters; no actual wall, floor, shadows, labels, text or grid.

MOST IMPORTANT FIXES:
Draw a COMPLETE connected upper arm→ELBOW→forearm→wrist for the HIGH arm. The high upper arm is lifted, and the forearm bends LEFT toward wall, creating a distinct right-angle-ish elbow. Keep this chain VISIBLE in foreground/negative space along wall side, in front of back hair. The high forearm can pass beside/lower cheek BELOW the eye; do not hide it behind the head and leave only a detached hand at the crown. High grip near lower/side of face is fine for short chibi limbs, as long as the high elbow is raised and readable. Other hand is lower. BOTH elbows have visible bends, never both arms straight.

Phases1–3 = NEAR/camera-facing arm HIGH with visible sleeve/upper arm and bent elbow; FAR arm LOW then starts reaching higher. NEAR leg LONG STRAIGHT supporting against wall; FAR knee lifted BENT.
Phases4–6 = FAR arm HIGH, visible complete bent elbow chain along left silhouette; NEAR arm LOW then starts reaching higher. FAR leg LONG STRAIGHT support; NEAR knee lifted BENT.
The limbs must exchange actual near/far roles, as colored in Image2, not six drawings with the same near knee raised and same low near arm. Show the camera-facing raised sleeve in1–3 and the camera-facing low sleeve in4–6. Show straight near shin/foot in1–3 versus bent near knee/foot in4–6; far counterpart stays visible with correct overlap.
Exactly two arms and two legs. In EVERY phase at least one knee is NEARLY UNBENT, a clear long hip-to-shoe support diagonal; never both knees tucked/bent. Other thigh is lifted, knee sharply bent and shoe higher. Both hands/soles touch the same LEFT contact axis, body hugs wall, no standing away from wall.

KEEP anchors stable across all six: SAME head/skull center and hip center as guide, no whole-body rising or bobbing, same skull size/head-to-hip distance, no per-frame camera zoom. Feet are moving pose elements, NOT a ground baseline. One supporting leg and one raised knee, modest skirt/petticoat still covers hips, no lifted-up underwear display.
Face and torso ALWAYS face SCREEN-LEFT, nose at left, one main visible blue eye. Do not flip/mirror any cells. Hair flows BEHIND toward SCREEN-RIGHT, swept away from wall-side elbows and knees. Whale tail roots at lower back, curls behind to right and remains complete without spreading beyond cell.

Exact MAID design Image1: glossy indigo-to-cyan long curls and looped ahoge; white scalloped frilled headdress; small cyan side bow/gold center on original physical temple; white/navy fin ears. Navy puff-sleeve dress with gold trim/embroidery, navy neck bow and blue-gold brooch, white lace apron with blue whale front emblem (curved/partly occluded in profile), original gold buttons and skirt bows, white lace petticoat with gold-edged navy hem, white frilled socks, navy Mary Jane strap shoes with gold buckles, blue whale tail/light underside. No winter hood/scarf/fur/boots, no knit sweater/beanie/plaid skirt, no new costume. Keep original round chibi face/eyes/proportions, detailed shaded curls, lace and cloth folds, fine colored anime outlines and polished full-color rendering.

Desired1536x1536 contact sheet, each512x768 cell; exact native dimensions are less important than complete separate figures, coherent bones, fixed head/hips and same scale. Local packaging will fit each pose on1100x1494 canvas at original-like size using HEAD/HIP alignment rather than feet. No crop of headdress, fingers, shoes, hair or tail. Genuine alpha outside characters/in gaps; no white/black/checkerboard backdrop. Final is full-color raster character art, NOT skeletons, vector art, SVG line art, sketches or geometry placeholders.
```

