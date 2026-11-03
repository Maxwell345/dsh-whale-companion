# winter 12 格候选联系表

本轮只交付候选图与本说明。没有安装 12 帧，没有改 rig、avatar.js、CSS 或其他服装。联系表尚待用户美术验收。

## 来源与生成次数

- 唯一参考是本套 `pet/assets/live2d/winter/sprite.png`。Image 1 为该文件等比缩至 768px 高的透明 WebP，114024 字节；没有上传原始大图，没有使用 maid/knit 图片。
- 使用内置 imagegen，本轮恰好一次请求，没有追加生成、返修请求或 CLI/API 调用。工具没有返回可核实的具体后端模型版本。
- 原始生成结果为 836×1881 RGBA，共 12 个独立人物轮廓。最终联系表由本机提取、对齐和排版，2048×2304 不代表生成器原生提供了相同分辨率的绘画细节。
- 0°格采用原 winter sprite 的等比审阅版本，以保留准确正面基准；其余 11 格来自这一次生成。没有水平镜像、压窄正面、复制相邻格或程序化补画。
- 原始生成在透明区域带有低 alpha 蓝/白残色及碎点，已按人物连通轮廓提取并清理透明残色。处理只涉及 alpha 清理、等比重采样和排版，没有修画或改变生成角度。

原始工具结果保留在：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-a60f6d64-f15b-4886-a564-158d8c5f1437.png`

## 文件规格

文件：`winter-12-contact-sheet.png`。

- 2048×2304 RGBA，4 列×3 行，每格 512×768。
- 按 alpha > 16 的可见轮廓检查，全部 12 格身高为 552px，局部 y=154..705，脚底坐标 y=705。
- 水平轮廓中心 x=256 或 256.5；半像素差来自整数像素取整。
- 低 alpha 抗锯齿可能在可见边界外多出数像素，已保留；全 alpha 轮廓也位于各自格子内。头饰、帽鳍、头发、尾巴和靴子没有被格子边缘裁断。
- 背景真实透明，没有地面、阴影、文字、标签或网格。透明像素残留 RGB 数量为 0。
- 12 格像素内容各不相同；这只是重复像素检查，不等于精确角度验收。

## 帧顺序与逐格检查

| 编号 | 目标角度 | 候选检查 |
| --- | --- | --- |
| 00 | 0° | 原 winter sprite 正面基准。 |
| 01 | 30° | 向画面右侧轻转的前侧候选。 |
| 02 | 60° | 向画面右侧的前 3/4 候选。 |
| 03 | 90° | 朝画面右侧，单只近侧人眼、鼻尖朝右，有头部/身体侧面厚度。 |
| 04 | 120° | 右后侧，头和躯干转离镜头；帽口白毛边位于画面右侧，无正脸。与 150°差异仍偏弱。 |
| 05 | 150° | 右后、接近背面，仍见右侧帽口边；比 180°偏侧，但与 120°较接近。 |
| 06 | 180° | 完整正背面，深蓝帽壳、后发、绕颈围巾、衣后毛边及靴跟；没有人脸、眼、嘴或误贴的胸前门襟扣饰。 |
| 07 | 210° | 左后、接近背面，帽口白毛边移至画面左侧；与 240°仍较接近。 |
| 08 | 240° | 左后侧，侧向略强、腿部重叠较多，但相对 210°的 30°差异还不够鲜明。 |
| 09 | 270° | 朝画面左侧，单只近侧人眼、鼻尖在左，后脑和后发在右；不是朝右的重复侧面。 |
| 10 | 300° | 朝画面左侧的前 3/4 候选。 |
| 11 | 330° | 朝画面左侧、接近正面的候选。 |

四列三行阅读顺序：

`0 → 30 → 60 → 90 / 120 → 150 → 180 → 210 / 240 → 270 → 300 → 330`。

基本转向成立，五个后侧格从右后经正背转至左后；不声称生成角度已精确均分。

## 冬装与背面结构

鲸鱼帽保留深蓝帽壳、白毛帽口、侧鳍及顶部浅蓝白色饰物；帽前的眼睛和粉腮没有复制到帽后。后发从帽下露出，围巾在后颈保持绕颈带状结构，没有增加第二条长垂片。外套保留藏青衣身、白毛袖口/下摆，配浅色袜口、藏青靴及鲸鱼尾巴。

没有 maid 围裙、X 背带、大腰蝴蝶结，也没有 knit 毛衣或格裙。后背没有照贴前襟扣饰和正面鲸鱼衣图。小鲸帽饰在左侧面近边可见，前/近正面保留原侧别；小尺寸检查未发现明显反向复制，但未声称逐角所有微小附件已通过像素级核验。

## 仍需重点验收的问题

1. **后侧角度间隔**：120°/150°、210°/240°仍比较接近，尤其后一组。与 180°的基本转向能区分，但不能保证清楚、严格的每步 30°。本轮按要求不重复触发 imagegen。
2. **比例与细节变化**：原 0°正面轮廓较宽、细节更密；生成格整体较收窄，发束、衣扣和尾巴细节有简化。统一身高和基线无法消除这类绘画差异，需要检查 0°→30°及 330°→0°的衔接是否可接受。
3. **遮挡与背部细节**：长发遮住部分冬装背部；围巾后颈圈和毛边整体一致，但细小绒球、刺绣及附件的跨帧连续性仍需人工检查。

本轮未生成 1100×1494 生产帧，未更新 rig 或运行时，也未进行 spin 播放测试。通过美术检查后，再进入生产帧裁切和安装阶段。原 winter sprite 的 alpha > 16 身高为 1439px，脚底 y=1462，供后续恢复原比例时参考。

临时裁切脚本、参考小图和测量报告均只存系统临时目录；仓库只新增本 PNG 与本说明。工作前 HEAD 为 7333d60，git status --short 为空。没有访问数据目录，没有启动 DSH/QQ，没有新增依赖，没有 commit/push。

## 本轮实际提示词

以下记录目标规格，不表示生成器已全部满足。

```text
Edit target. Use case: identity-preserve.
Image1 is the ONLY authoritative reference, derived from winter/sprite.png. Preserve this exact character identity, chibi proportions, head/body ratio, face shape, huge sapphire star-highlight eyes where visible, indigo-to-cyan hair gradient, fine colored line weight, polished anime cel-shading and WINTER outfit. Do not redesign or borrow any other outfit.

Create ONE 12-frame full-body360-degree WINTER character turnaround CONTACT SHEET. Exactly FOUR columns by THREE rows, reading left-to-right top-to-bottom. Desired canvas2048x2304, each cell512x768. Every character fully inside its own cell: same552px full-silhouette height, shoes baseline at localy705, centered at localx256. Complete top ornament, hat fins, curls, whale tail and boots, with transparent gutters. No drawn grid/labels/numbers. A local alignment pass may normalize placement; prioritize full uncropped figures and correct body perspective.

EXACT ROTATION, in SCREEN coordinates, not the character's anatomical right:
row1col1 0: exact FRONT matching Image1.
row1col2 30: front slightly turning toward SCREEN-RIGHT.
row1col3 60: front-right3/4, nose points SCREEN-RIGHT, head AND torso turned.
row1col4 90: TRUE PROFILE facing SCREEN-RIGHT, nose tip at RIGHT edge of face, exactly one human eye, real head/torso thickness and overlapping arms/legs.
row2col1 120: strong REAR-RIGHT3/4, continue30degrees AWAY from that right-facing90 profile. Head AND torso face diagonally AWAY toward SCREEN-RIGHT, rear dominates with a strongly foreshortened side plane; RIGHT-edge near shoulder/arm overlaps far shoulder, hips/heels oblique. NO visible human eye/mouth/front face. Any facial sliver only at RIGHT edge hidden by hair. Do not turn toward screen-left.
row2col2 150: mild REAR-RIGHT,30degrees BEFORE straight back. MUCH MORE back-facing than120: both rear shoulders/heels and broad rear coat plane visible, right-edge near shoulder slightly closer/larger, other shoulder recedes. Hood dome/hem/heels subtly angled RIGHT, not perfectly symmetric. NO human face. Visibly distinct from120 and180.
row2col3 180: EXACT STRAIGHT BACK. Rear hood/skull centered, shoulders/hips and two rear boot heels balanced. Back of winter coat, continuous rear fur hem, back hair and same scarf construction. NO human face/eyes/nose/mouth, no coat front fastening or front graphics pasted onto back.
row2col4 210: mild REAR-LEFT,30degrees AFTER back. Independently draw opposite turn to150, NOT reflection: LEFT-edge near shoulder slightly closer/larger, other shoulder recedes, broad rear coat and both heels. Clearly less side-on than240, less symmetric than180. NO human face.
row3col1 240: strong REAR-LEFT3/4, continue toward screen-left270 profile. Head AND torso face diagonally AWAY toward SCREEN-LEFT, LEFT-edge near shoulder/arm dominates and overlaps far shoulder, narrower rear body plane than210, side/heel planes distinctly oblique. NO human face/eye/mouth. Any facial sliver only at LEFT edge hidden by hair. NOT a right-facing rear view.
row3col2 270: TRUE PROFILE FACING SCREEN-LEFT. Human NOSE TIP on LEFT edge, exactly ONE human eye looking LEFT; back of skull and back hair on RIGHT side of face. Head AND body both face LEFT with real thickness, near/far arms and legs overlap. Must face OPPOSITE to90, not another right-facing profile.
row3col3 300: front-left3/4, nose points SCREEN-LEFT, naturally continue from270 toward front.
row3col4 330: near-front slightly turning SCREEN-LEFT,30degrees before0.

FIRST ROW turns toward RIGHT; MIDDLE ROW rotates from rear-RIGHT through symmetric BACK to rear-LEFT; THIRD ROW continues from rear-LEFT through LEFT PROFILE toward FRONT. Each head AND torso must rotate together, not only hair/tail. Strong120/240 versus mild150/210 versus straight180 must be unmistakable through shoulder overlap, hood projection, coat plane/hem and heel depth, not just accessory position. Avoid150=180 or210=240.

WINTER COSTUME, exactly Image1:
Dark navy/light-blue WHALE HOOD integrated with winter coat, thick fluffy white fur around front hood opening, side whale fins, glossy pale-blue/white two-lobed top ornament, front whale eyes and pink cheeks. Small blue whale pin at the original front viewer-RIGHT hood edge. Indigo-to-cyan very long wavy layered hair comes out BELOW hood and over shoulders/coat. White/pale-blue striped scarf wraps neck, principal long end at original viewer-RIGHT with blue panel, white whale/snowflake and white fringe. Navy winter A-line coat with white furry front placket, cuffs and continuous hem, small snowflake/wave embroidery, original front navy bows and paired white pompoms, neck bow with blue-white center pin. Light socks and navy winter BOOTS with white fur cuffs, small navy bows/white pompoms and soles. Blue whale tail/light underside from same lower-back root, separate from hat fins.

BACK CONSTRUCTION, identical across120/150/180/210/240:
Hood back is the same curved navy whale hood with coherent seam, top ornament and side fins; front hood opening and its white fur rim recede to far side, not a second face opening on back. NEVER add the hood's front black whale eyes or pink cheeks to the back dome. Long layered back curls emerge below hood and partially cover scarf and coat. Scarf wraps continuously around neck; show its back band/occlusion naturally, do NOT invent a second long scarf or move front printed long end to spine. Rear coat is navy, consistent plain back panel with subtle folds, restrained snowflake detail and same continuous furry lower hem/cuffs; NO front neck bow, paired front buttons/placket or front whale chest graphic copied onto back. Front details may hide by occlusion. Do not force all ornaments visible in every view.
ASYMMETRY: pin and principal scarf end stay on ONE physical side: front viewer-RIGHT becomes back viewer-LEFT. At90/120/150 the pin is on FAR side and should be hidden by hood/head, not placed brightly on right near rim. At210/240/270 it becomes visible at left-side rim naturally. At180 only original-side edge may peek out. Do not switch temples or mirror the whole figure. Hood cords each retain original blue bow/white pompom, with correct occlusion.
No maid apron, X-back straps, suspenders or large waist bow. No knit beanie, cream sweater or plaid skirt. No new costume design. Preserve original huge hood and short chibi legs.

Full detailed colored RASTER anime illustration, same finish as Image1: dimensional layered hair highlights, soft cel shading, fur volume, coat folds/embroidery, scarf stripes, socks and boots. Not SVG/vector, line art, sketch, flat placeholders, paper-thin profiles or squashed front views. No identical/copied neighbors or horizontal reflections.
Genuine transparent RGBA outside all characters and inside gaps. No background scenery, opaque white/black, checkerboard, gradient, floor/shadow/glow, grid, text/numbers/labels, watermark, extra limbs, crop, white/black fringe or double outlines.
```

