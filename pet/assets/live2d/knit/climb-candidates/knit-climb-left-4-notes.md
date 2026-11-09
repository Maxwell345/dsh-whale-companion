# Knit LEFT 四帧候选

日期：2026-11-05。状态：美术候选，等待验收；未安装运行时。

## 交付与排列

- `knit-climb-left-4-contact-sheet.png`：2200×2988，透明RGBA，2列×2行。
- 每格1100×1494；上排01/02，下排03/04；循环01→02→03→04→01。
- 原针织装身份参考：[knit/sprite.png](F:/DeepSeekBot/dsh-whale-companion/pet/assets/live2d/knit/sprite.png)。
- 姿势参考：[maid v3四帧源联系表](F:/DeepSeekBot/dsh-whale-companion/pet/assets/live2d/maid/climb-candidates/maid-climb-left-4-contact-sheet-v3.png)，只参考左墙、姿势、肢体深度及节奏。

服装采用knit原图的奶油色麻花针织帽带、鲸针/藏蓝结/奶油毛球、奶油针织毛衣及鲸鱼喷水图案、格纹百褶裙/白结、奶油针织袜/藏蓝结、藏青Mary Jane鞋；蓝发、鲸鳍耳、鲸尾保留。没有加入maid的围裙、背带、蕾丝帽、女仆裙或winter服装。

## 四帧分工与maid对应

近侧/远侧由画面前后遮挡表达，不按画面左右给肢体命名。

| knit帧 | 上肢与腿的分工 | maid v3源表位置 | 当前maid安装文件的同姿势来源 |
| --- | --- | --- | --- |
| 01 | 近手高抓在前，远手低撑在后；近腿长直支撑、远膝高抬 | 左上 | left/01.png |
| 02 | 近手继续高抓；远手抬至胸高、朝左墙换抓，远膝与脚向下展开；近腿长直 | 右上 | left/03.png |
| 03 | 远手高抓在后，近手低撑在前；远腿长直支撑、近膝高抬 | 左下 | left/02.png |
| 04 | 远手继续高抓；近手在前向左上换抓，近膝与脚向下展开；远腿长直 | 右下 | left/04.png |

帧序以本轮用户给定的01/02/03/04分工为准。只读核对发现，maid安装文件与v3源联系表行序的对应是1/3/2/4；本候选采用源联系表的正常行序1/2/3/4，后续裁切时请按本表读取。本轮没有改maid文件。

高位抓手露手背/弯指节；低位手掌面朝左墙、手指上指或左上指。02活动手位于近高臂后；04活动手位于前景。至少一条腿接近伸直。袜鞋采用完整上色的竖向撑墙形态：鞋尖在上、鞋跟在下，深色鞋底朝左；没有画墙面或地面。

## wallInset与轮廓

wallInset定义为每格alpha≥128的可见轮廓最左x值，包含手指、袖子及鞋等所有可见像素；它不等于单独鞋底的墙线。鞋底接触边近似在x31–35，尚未统一成逐像素刚性直线。

| 帧 | wallInset(px) | 可见包围盒[xMin,yMin,xMax,yMax] | 可见身高(px) |
| --- | ---: | --- | ---: |
| 01 | 35 | [35,19,924,1478] | 1460 |
| 02 | 32 | [32,19,916,1479] | 1461 |
| 03 | 35 | [35,19,917,1477] | 1459 |
| 04 | 29 | [29,19,914,1477] | 1459 |

相同alpha≥128阈值下，原knit正面可见身高为1436px；候选增加23–25px，约1.6–1.7%，主要来自竖向鞋型的向下延伸。四格帽、发、手、尾和鞋均在画布内；没有高alpha像素碰到单格四条边。

## 头/髋对齐

生成稿先等比恢复到每格1100×1494，再用眼部亮青区域作头部配准参考，保留头与髋之间的第一稿身体比例。没有按抬起的脚底拉齐人物。第二次修绘的整体人物被拉长，因此只选其已上色手腕、袜鞋和袖结局部，合回第一稿身体。

每格眼内青色高光质心的实测位置（同一ROI和颜色阈值，受眼型细节影响，不是骨骼数据）：

| 帧 | 头部参考点[x,y] |
| --- | --- |
| 01 | [317.5,518.8] |
| 02 | [310.5,517.6] |
| 03 | [316.5,519.7] |
| 04 | [310.4,519.8] |

横向范围7.1px、纵向范围2.2px；帽顶/呆毛可见上沿约y19。

髋部沿用第一稿的裙腰与腿根关系，人工检查参考约在(390,1000)。宽松毛衣和裙摆遮挡实际关节，四格还有约20px量级的横向体位差；这里没有声称精确骨骼重合，也没有通过拉伸身体强制对齐。高度和头髋比例参照maid源表，衣帽轮廓遵循knit原图。

## 素材来源与处理

使用内置imagegen；工具未返回具体模型版本。

- Image 1：knit原sprite的小参考，768px高，103,930字节。
- Image 2：maid v3源表的小姿势参考，1024px高，190,428字节。
- 修绘时另加1024px高的临时knit位图姿势引导，201,552字节。它只控制手/鞋角度与接缝；粗引导未作为最终人物绘制。
- 未把原始大图上传给imagegen，未调用12帧转圈流程。

实际流程：生成knit四帧首稿 → 清除低alpha背景残点并按头部锚点配准 → 定向生成竖鞋/手腕修绘 → 取完整上色局部合回首稿比例 → 清理旧手/旧鞋残影与袜口透明细缝 → 合成行序联系表。最终人物是完整上色位图，没有把粗guide的几何块作为完成素材。袖中段蝴蝶结采用修绘所得真实上色小结，并补回旧腕部的针织纹理。

原始生成图路径：

1. [首次四帧生成（身体与头部比例来源）](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-915bab30-001f-41ee-8f3e-435776e72848.png)
2. [定向修绘（最终手腕、袜鞋和袖结局部来源）](C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-61ff8191-94f1-4350-b70a-25396635c4cf.png)

第二张的整身比例未采用；仅使用其完成上色的局部。参考素材和原sprite文件均未覆盖。

## 实际验证与待审事项

已验证：

- 4/4格PNG可解码，均为1100×1494 RGBA；联系表2200×2988。
- 四格按行序裁回后与合成前的RGBA完全一致，四帧像素内容各不相同。
- 透明背景、全身完整，画布边界没有高alpha裁切。
- 八只鞋均为朝左的竖向鞋底形态；脚踝连接保留针织袜。
- 01/02的远侧屈腿袜鞋先置后，再回盖近直腿边缘；03/04的近侧屈腿袜鞋置于前。01/03实际交叠区域较小，腿的近远可辨度仍需结合上肢及裙下层次审查。
- 参考sprite、maid/winter素材、rig、avatar.js/CSS及README均未改动；未安装、未启动DSH/QQ、未访问数据目录、未commit/push。

待美术初检：

- 02胸前旧掌移除处、04袖口以及部分袜口有轻微拼接纹理；细看针织方向有变化。
- 鞋底约x31–35，仍有数像素接触边差异；wallInset必须按各格实际轮廓读取。
- 02/04的屈膝已向下展开，沿用首稿约100–110°的估计幅度，弱于maid参考约120°；没有把它写成已达到120°。
- 髋位存在小幅体位差，近/远腿的归属可辨度仍需人工验收。本文件是候选，不代表这些美术细节已经批准。

## 实际提示词

以下是两轮实际提示词，目标数值与最终测量结果请区分；最终以本文测量和候选图为准。

### 1 initial-four-frame

```text
Use case: identity-preserve / animation pose transfer.
Create ONE four-frame LEFT WALL CLIMB candidate contact sheet for the KNIT character.
Image1 is the ONLY authority for character identity, face, hair, proportions, colors and ALL clothing.
Image2 is ONLY a pose, left-wall direction, limb-depth and four-phase rhythm reference. Transfer its poses to Image1's KNIT character. Do NOT copy Image2's maid costume.

OUTPUT: clean 2-column x2-row contact sheet, order01 top-left,02 top-right,03 bottom-left,04 bottom-right. Transparent RGBA. Final design canvas2200x2988, each equal cell1100x1494. No lines, labels or numbers. Full figure fully inside each cell, no cross-cell overlap. Same character height approximately1442 design pixels; same fixed head and hip positions all4 cells, matching Image2's chibi head/body ratio and placement. Head/ahoge top aroundy25, head center about(404,361), hip center about(295,980), per-cell coordinates. Do not bounce the head/hips; do not align by lifted feet.

KNIT OUTFIT ONLY:
Cream cable-knit bonnet band with small blue-and-white whale pin, navy bow and cream pom-pom on the visible side; oversized cream cable-knit roll-neck sweater with ONE navy whale-and-water-spout chest graphic, white shirt collar and small button, small navy sleeve bows; navy plaid pleated miniskirt with small white front bow; cream cable-knit calf socks with navy outer-side bows; glossy navy Mary Jane shoes.
Identity: same blue star-highlight eyes and chibi face, indigo-to-cyan long wavy hair, thick bangs, large curved ahoge, blue fin ears with white inner edges, distinct blue whale tail with white underside. Do not replace the hat ornament or socks with maid lace.

POSES, all facing SCREEN LEFT, invisible VERTICAL wall at LEFT:
01: NEAR arm high grip IN FOREGROUND, far hand low support behind it. NEAR leg long almost straight support, FAR knee sharply bent high with raised foot.
02: first-half transition: SAME NEAR high-grip arm stays foreground, elbow folds more acutely as body pulls. FAR low hand RELEASES and rises to CHEST, palm toward left wall, fingers UP/UP-LEFT, wrist hidden BEHIND near sleeve. FAR knee visibly OPENS downward toward120degrees and far foot moves DOWN. NEAR support leg stays straight. Must differ clearly from01.
03: opposite half-cycle: FAR arm high grip BEHIND, NEAR hand low support IN FRONT. FAR leg long almost straight support, NEAR knee sharply bent high. Actually swap limb identity/occlusion; not a duplicate or mirror of01.
04: reverse transition: FAR high-grip arm behind folds more acutely. NEAR low hand RELEASES and rises to CHEST in foreground, palm toward left wall, fingers UP/UP-LEFT; wrist follows forearm, never a horizontal tray hand. NEAR knee visibly OPENS downward toward120degrees and foot moves DOWN; FAR support leg stays straight. Must differ clearly from03 and flow back to01.

Every frame: both elbows visibly bent, at least one leg almost straight. High gripping hand has back/curled knuckles toward camera, fingertips hook LEFT against invisible wall. No waving palms.
Both shoes are wall-bracing: soles face LEFT and are parallel to the VERTICAL wall, heels/toes stacked vertically, NOT standing on a horizontal floor. Keep both sole contact edges on the same left wall plane, one foot high and one low; the moving foot slides down this plane in02/04.
Near/far ownership must read from actual occlusion and sweater/sock bows, not only darker shading. Do not mirror the character.

Full-color polished raster anime art of Image1 quality, clean outlines, cable-knit texture, plaid folds, shaded hair volume and tail detail.
AVOID maid apron, pinafore, X straps, maid headdress, lace cuffs, petticoat, dark maid bodice, maid skirt, winter hood/coat/scarf. No extra/missing limbs, duplicate frames, two bent support legs, cropped fingers/hair/hat/shoes/tail. No wall, floor, ground shadow, glow, background, checkerboard, text or watermark.
```

### 2 corrected-hands-and-vertical-soles

```text
Use case: precise-object-edit / identity-preserving sprite cleanup.
Create ONE finished KNIT LEFT-climb four-frame contact sheet by EDITING IMAGE3, not by inventing another animation.
IMAGE1: ONLY character identity and clothing authority, the original KNIT sprite.
IMAGE2: ONLY the maid's near/far limb-depth and four-phase rhythm reference. Do not copy any maid clothes.
IMAGE3: the ACTUAL EDIT TARGET. Its four corrected poses, shoe directions, locations, height and head/hip alignment are intentional. Finish the rough bitmap joins into fully painted anime art. Keep Image3's layout and body poses.

2columns x2rows, row-major01/02/03/04. Final2200x2988, equal1100x1494 cells, transparent RGBA. Every complete figure inside its own cell. Same camera, head center and hip location all4, approximately1442px character height. Do not drift, zoom, crop or move head/hips.

MOST IMPORTANT: FOLLOW THE NEW SHOE ORIENTATION IN IMAGE3.
All EIGHT Mary Jane shoes have their TOES POINTING UP, HEELS DOWN, and their dark SOLE EDGE VERTICAL facing LEFT toward an invisible vertical wall. Both sole contact edges share the same LEFT wall plane per cell, approximatelyx35. Do NOT restore normal standing feet with horizontal sole bottoms from Image1/Image2. Foot is dorsiflexed at ankle; calf and knitted sock still follow the leg. Complete the missing sock-to-ankle joins naturally, keep cable knit and navy sock bows. Paint real shoe volume/sole/strap details in this VERTICAL wall-bracing position, not a floating sideways shoe detached from the leg. No wall should be drawn.

Other intentional corrections in Image3:
- Clean all rough skin/sweater patches, hand wrist seams, flat bow placeholders and old shoe outlines.
- Sleeve navy bows belong on OUTER ELBOW/MID-SLEEVE, not on wrist cuffs. Render small real fabric bows there like Image1. Plain cream ribbed sweater cuffs, no maid lace.
-01/03 low hands: palm toward LEFT wall, fingers UP/UP-LEFT, anatomically connected to forearm.02/04 moving hands: clearly reaching LEFT from chest, palm toward wall, fingers UP/UP-LEFT; not clasped in prayer against chest, not horizontal tray hands.

Exact loop and depth:
01 NEAR high-grip arm is foreground; far hand low supports. NEAR leg nearly straight in front, FAR knee high bent behind.
02 SAME near high-grip arm stays foreground and elbow tightens. FAR moving hand rises toward left wall at CHEST behind near sleeve: near sleeve edge must occlude far wrist/lower palm. Do not put far fingers on top of near sleeve, do not give far low sleeve a large foreground shoulder. FAR knee opens down to about120degrees and foot slides DOWN wall; NEAR leg remains long straight.
03 FAR high-grip arm behind, NEAR low support hand in front. FAR long straight support leg behind, NEAR knee high bent in front. Really exchange the limb roles, not mirror/duplicate01.
04 FAR high-grip behind tightens elbow. NEAR moving hand in foreground reaches left/up from chest. NEAR knee opens down to about120degrees and foot slides DOWN wall, FAR leg remains long straight. Flow back to01.

Keep both elbows visibly bent and at least one leg almost straight every frame. High-grip fingers curl LEFT into invisible wall, back/knuckles visible, not fists punching forward or waving palms.

KNIT outfit only: cream cable-knit bonnet band with whale pin/navy bow/cream pom-pom, oversized cream cable-knit roll-neck sweater with navy whale-and-spout chest motif, white shirt collar, navy plaid pleated skirt/white bow, cream cable-knit socks/navy bows, glossy navy Mary Janes. Exact Image1 blue star eyes, indigo-cyan hair/ahoge, blue-white fin ears and whale tail.
Same rich full-color raster anime linework/cel shading as Image1. No geometric patches left in final, no sketch/vector art. No maid apron/straps/lace/headdress/petticoat, no winter coat. No extra/missing/duplicate limbs, no background/floor/shadow/checkerboard/grid/labels/text/watermark. Transparent outside every figure.
```
