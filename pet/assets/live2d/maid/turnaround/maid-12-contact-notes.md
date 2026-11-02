# Maid 后侧五格修正版：120° / 150° / 180° / 210° / 240°

日期：2026-11-02（Asia/Shanghai）。本轮只修正这五格，并保留0°、30°、60°、90°、270°、300°、330°的原始RGBA像素。

## 本轮交付

- maid-rear5-contact-sheet.png：2560×768透明RGBA，单行从左至右为120°、150°、180°、210°、240°，无文字或网格。
- maid-12-contact-sheet.png：2048×2304，仍为四列三行，仅替换第5–9格。
- 本说明：逐角度差异、测量、来源和剩余细节。

## 五格新差异

| 角度 | 新的可见差异 |
|---|---|
| 120° | 明显右后3/4；肩背透视更斜，右侧手臂与鞋形的侧向投影较强，背部X与腰结偏侧；移除了误放在另一侧的蓝头饰。 |
| 150° | 独立生成的右转近背视角；相比120°背部展开更多，X及腰结更接近中心，手臂收近身侧；肩线、发梢、鞋形和尾巴仍明显不同于180°。 |
| 180° | 正背，无偏航；肩背、脊柱和双腿居中，白色腰结结心居中；将旧稿V式读感修正为明确X交叉。 |
| 210° | 刚过正背的轻微左后视角；肩线、鞋形及后发遮挡向左变化，与150°实际朝向相反；不是150°的镜像。 |
| 240° | 明显左后3/4；肩背、侧臂和裙摆透视比210°更侧，发束与尾巴投影继续左转；不再与210°近似重复。 |

五格均有可辨识的白色X交点及四个对角分支，腰部使用同款大白双耳蝴蝶结及双垂尾。未见前围裙鲸图、可辨识眼睛或嘴。侧向后视格只允许极小脸缘/颈部边缘，未画正脸。

120°蓝头饰被遮挡；150°局部露出；180°–240°保持在同一物理侧。尾巴在同人物高度下的绝对投影尺度相近，随转身产生裙身与尾叶的透视差异，未做镜像或单独压窄。

## 对齐与七格保护

- 每个新格仍为512×768；Alpha>16人物高度552px，顶点y=153、脚底零基索引y=704，即从1开始数的第705行。这与原七格完全同一脚底基线。
- 足部中心按最低40个前景行内Alpha>16像素的Alpha加权质心计算，目标x=256。

| 角度 | 人物高度 | 脚底索引 / 行号 | 足部质心x |
|---|---:|---|---:|
| 120° | 552 | y704 / 第705行 | 256.2040 |
| 150° | 552 | y704 / 第705行 | 255.8042 |
| 180° | 552 | y704 / 第705行 | 256.4379 |
| 210° | 552 | y704 / 第705行 | 256.4799 |
| 240° | 552 | y704 / 第705行 | 256.1038 |

原总图解码后直接在RGBA缓冲区中覆盖五个矩形，其余位置不重新合成。写出PNG再解码复查，0°、30°、60°、90°、270°、300°、330°七格逐字节完全一致。五个目标格均发生实质变化，未复制邻格，也未缩矮某一格。每格边界未裁人物，主体、鞋和尾巴完整容纳。

前一版maid-12-contact-alignment.json保留为历史记录，没有修改；本轮五格的新来源与对齐以此说明为准。旧pack-maid12-contact.mjs也未修改，不应拿旧来源覆盖修正版。

## 剩余细节与阶段边界

主朝向递进、统一X、同款腰结及隐藏眼嘴的可见项已复核。仍保留两项连播细节供最终验收：210°偏转相对较轻；120°到150°的呆毛卷曲投影有轻微跳动。没有把主观生成角度当成精确3D角度标定。

本轮未进入knit/winter或12帧运行时安装，未修改avatar.js、CSS、rig、任何运行时代码或其他服装。未启动DSH/QQ，不访问数据目录，不commit/push。除本轮两张PNG与本说明外，开始时已有的其余文件内容保持不变。

## 素材来源与处理

使用内置imagegen；Image1始终为当前maid/sprite.png，Image2为从修改前总图提取的当前180°背面。工具未返回可核验的后端模型版本号，不伪称已确认具体GPT-image版本。

最终选用源稿，均保留于本次Codex generated_images/01a19646-2cb0-7903-b81d-c773339ce540/：

| 最终角度 | 源稿 |
|---|---|
| 120° | exec-7e6dd714-7c90-41cd-a7ed-75e13560cb3e.png，单人定向修正稿 |
| 150° | exec-64dbf10e-743c-40db-8fba-663964b0bd46.png，单独生成近背稿 |
| 180° | exec-9ee650ce-0de1-478b-bc25-6137a802fa47.png，上排右 |
| 210° | 同一五人格稿，上排中，按实际轻微左后朝向选用 |
| 240° | 同一五人格稿，上排左，按实际明显左后朝向选用 |

五人格稿的模型名义顺序存在左右反向，因此按实际姿态选用并重排，而非镜像图片。120°另修正了头饰；150°单独补画，没有复制其他格。

临时打包只做原生Alpha规范、整图连通组件分离、等比重采样和位置对齐。Alpha<=3规范为0，Alpha4–16仅保留强前景附近抗锯齿，Alpha>16主体及饰件保留；不按固定源格线截断跨线鞋底，不用程序绘画或几何拼图。临时脚本和校验报告留在系统临时目录，未新增仓库脚本。

## 最终采用的生成提示词

### 共同结构五人格稿（按实际朝向重排选用）

```text
Edit target: IMAGE 3 (the five-view rear sheet). IMAGE 1 remains the authoritative original character, and IMAGE 2 the original centered rear costume/bow reference.
KEEP the successful common X straps, white bow design, shading, gold/lace dress details, proportions and high-quality raster anime style from Image3. Correct ONLY the direction/angle progression and the asymmetric feature continuity. Do not touch or generate the seven front/profile frames outside this task.

The previous sheet has its rear turns facing the wrong sides. Do NOT simply mirror or copy it. Reconstruct the five viewpoints of ONE SAME physical character rotating in the exact order below.

LAYOUT: 3 columns x 2 rows, exactly FIVE separate full-body figures, top row120/150/180, bottom row210/240/EMPTY transparent. Generous transparent gutters, no labels or grid. Every head/ear/hair/shoe/tail fully inside its cell, same height/soles/axis. Actual transparent alpha, no floor, shadow, glow, color/gradient background.

DIRECTION IS DEFINED BY THE EXISTING PROFILES:
The character is FRONT at0, nose points to SCREEN-RIGHT at90, then turns AWAY through120/150 to back180. It then turns through210/240 toward the nose-pointing-SCREEN-LEFT profile at270.
120: continue 30 degrees AWAY from the SCREEN-RIGHT profile. Any tiny cheek silhouette must be on the image-RIGHT edge of the head, NEVER on its left. Face and eyes remain hidden under back hair. A strong60-degree-off-back rear3/4, clear side thickness, one rear shoulder substantially foreshortened. The center-back X/bow plane projects slightly toward SCREEN-LEFT on the torso. Not the left-looking rear pose of Image3 top-left.
150: just30 degrees before180, mild RIGHT-REAR turn, no face/eyes/mouth. Both rear shoulders mostly readable with only mild overlap, center-back plane only slightly toward SCREEN-LEFT. Head/shoulder/skirt/tail perspective visibly intermediate between120 and180. Do NOT make it straight back.
180: exact centered BACK, no yaw. Balanced rear shoulders, central spine, level waist and centered waist-bow knot, matching Image3's true rear pose and Image2's bow design. Same true X as every other view, not V.
210: just30 degrees AFTER180, mild LEFT-REAR turn, no face/eyes/mouth. Both rear shoulders still mostly readable with only mild overlap, center-back plane only slightly toward SCREEN-RIGHT. Same degree of turn as150 but naturally opposite direction, independently drawn, NOT a horizontal flipped copy.
240: continue toward SCREEN-LEFT profile at270. Any tiny cheek silhouette can only be on image-LEFT edge, NEVER right; no eyes or front-facing face. Strong60-degree-off-back rear3/4, one rear shoulder substantially foreshortened; center-back X/bow plane farther toward SCREEN-RIGHT than210. Clearly MORE turned than210.

FIXED ASYMMETRY:
The cyan temple bow is the SAME one on front image-right in Image1 and back image-left in Image2. Across these rear-sector angles it must stay on the character's same physical side; do NOT switch it to the screen-right side of the rear skull in210/240. It may become partly occluded, but cannot migrate to the opposite temple. Likewise keep a physically coherent tuft and tail root; independently draw hair folds/highlights, sleeves, embroidery and heel perspective rather than mirroring the whole pose.

UNIFIED REAR STRUCTURE IN ALL FIVE:
Two continuous white apron straps form an unmistakable X with a visible crossing and all four diagonal arms in a small opening between back hair locks; each strap connects one shoulder to the opposite waist side. Never V/Y/U/parallel straps, never hide the crossing.
Exactly the same large white waist bow fromImage2 in every cell: same knot shape, loop construction and ribbon tails; perspective changes only, no special new180 bow. No front apron whale emblem. Same rear skirt/ruffles, white socks, shoe heels, indigo-to-cyan curled layered hair, tail and gold floral/shell hem.
No human eyes, mouth or front face in any of the five.
Full detailed colored raster anime; not sketch/SVG/vector/flat simplified art. No horizontal mirroring, duplicated neighboring angles, squashed front view, extra/missing limbs, text, watermark, fringes, cropped tips or overlapping figures.
The review output will be normalized to552px height, soles on row705 of each512x768 cell. Preserve original chibi proportions rather than squashing the figures.
```

### 独立150°近背稿

```text
Create ONE full-body maid sprite, at exactly150 degrees: a mild rear three-quarter turn, just30 degrees BEFORE straight back180. IMAGE1 is the authoritative character/outfit/style. IMAGE2 is the original rear bow design. IMAGE3 shows the existing90-degree pose whose nose points SCREEN-RIGHT. Rotate that SAME physical character60 degrees further AWAY, continuing in that direction, to150. IMAGE4 shows the corrected rear X straps and waist bow that must be shared.

This is predominantly a BACK view, with only mild30-degree foreshortening: both rear shoulders still visible, the right-facing pose not yet completely straight back. Any possible face-side silhouette belongs on image-RIGHT, not left, but hide ALL human face, eyes and mouth behind back hair. The shoes' toe directions subtly indicate SCREEN-RIGHT while the heels/back surfaces remain dominant. The center-back X and waist bow are only slightly offset toward image-LEFT on the torso. Do not show a full60-degree rear3/4 and do not make an exact straight back.

Both WHITE apron straps must cross visibly into one true X with four diagonal branches, as Image4; not a V. Same large white waist bow as Image2/4: same center knot, two loops, long ribbon-tail construction, proportions and waist attachment. Keep navy rear dress with gold floral/shell embroidery, frilled white petticoat, white frilled socks, dark navy Mary Jane shoe heels, rich indigo-to-cyan long curly hair, whale-fin ears and whale tail. Open a small gap between back hair locks so the white X is legible without redesigning the hair length/volume. No front apron whale or front bib.

Keep the cyan temple bow on the SAME physical side as Images1/2/3, generally hidden in this right-facing near-back view or only a tiny edge at the far LEFT silhouette; never a new bow on image-right. The tuft and tail root stay coherent with the same character, not flipped. Draw this150 view independently; no mirror of210, no compressed front, no copied neighboring pose.

Full richly shaded colored raster anime at the reference quality, not simplified or vector. Single complete figure with generous transparent margin, no cropping of tuft/hair/tail/shoes. Same chibi head/body ratio. Actual transparent RGBA, no floor, shadow, glow, colored background, checkerboard, text or labels. No extra limbs or duplicate outlines.
```

### 120°头饰定向修正

```text
Edit target: IMAGE3, the single full-body120-degree rear-right maid sprite. Keep its exact pose, proportions, rich rendering, hair curls, rear navy/gold/white dress, X apron straps, large white waist bow, socks, shoes, tail and direction. Do NOT rotate or mirror the figure and do NOT change the bow at the WAIST.

Make ONLY this correction: REMOVE the incorrectly placed small CYAN TEMPLE HAIR BOW on image-right of the skull, restoring the original surrounding blue hair and white headdress trim naturally. This accessory is on the far side at this viewpoint and is occluded, as in the right-facing90-degree profile in IMAGE4. Do not add a cyan temple bow on the other side. The large white WAIST BOW must remain exactly as it is.

IMAGE1 is authoritative original character/style and IMAGE2 rear construction reference. This120 pose is30 degrees past the right-pointing90 profile and60 degrees before straight back: keep the body facing away toward SCREEN-RIGHT. Tiny cheek-edge silhouette can be on image-right but no human eye, mouth or visible front face. No front apron whale graphic. Preserve the clear white X with four diagonal branches, same knot/loops/ribbons and same detailed skirt.

Output ONLY one complete sprite on genuine transparent RGBA with generous clear margin; retain all hair, tuft, tail and shoes. No labels, floor, shadow, glow, backdrop, extra parts, white/black fringe or double outline. Fully colored detailed raster anime, not a sketch/vector.
```
