# winter 30° / 60° / 330° 宽轮廓修正候选

只交付三格候选联系表与本说明，等待美术审阅。没有替换生产帧、改 rig 或修改运行时，也没有撤销此前未提交的安装结果。

## 联系表

文件：`winter-front3-contact-sheet.png`。

从左到右：**30°朝画面右、60°朝画面右、330°朝画面左且接近正面**。

整张 3300×1494 RGBA，3 列×1 行，每格 1100×1494。三个人物按原 winter sprite 对齐：可见身高均 1439px，顶点 y=24，脚底 y=1462；完整帽饰、头发、围巾、尾巴和靴子均位于各自画布内，没有裁断。背景透明，无地面、阴影、文字或网格。

这里交付的是一张联系表，不是已经写入 turnaround12 的三个生产文件。1100px 是独立候选格的宽度，没有改运行时 frameWidth。

## 宽度实测

0°原 sprite 是唯一宽度与服装轮廓基准，原图未重画或缩小。在同一 1439px 身高下，其 alpha > 16 可见宽度为 1024px。

| 格子 | 实测可见宽度 | 占 0°宽度 | 以 0°=208px 换算 | 用户门槛 | 数值检查 |
| --- | ---: | ---: | ---: | ---: | --- |
| 30° | 996px | 97.27% | 202.31px | ≥约90% / 187px | 通过 |
| 60° | 903px | 88.18% | 183.42px | ≥约84% / 175px | 通过 |
| 330° | 1003px | 97.95% | 203.73px | ≥约94% / 195px | 通过 |

换算列为按参考 208px 的比例估算，**不是替换运行时之后的实际播放测量**。当前生产帧尚未变更，也没有宣称转场观感已通过。

测量以 alpha > 16 的可见轮廓为准。全部非零 alpha 宽度依次为 999/905/1007px；低 alpha 抗锯齿在可见边缘外多出少量像素，均保留。三格可见中心为 x=550 或 550.5，半像素差为整数像素取整。

## 生成与定向修正

使用内置 imagegen，共两次请求：

1. 只生成 30°/60°/330°三格。以原 winter/sprite.png 的 768px 高透明 WebP 为 Image 1，114024 字节；没有上传原始大图或引用其他服装。
2. 首轮 60°宽度为 851px（83.11%，折算172.86px），低于门槛。保留已达标的 30°和330°，只对 60°做定向编辑。Image 1仍是原 sprite 小参考；Image 2是首轮60°的90644字节小编辑目标，非额外服装设计参考。

第二次只扩展真实衣摆、袖臂和主发束体积，保持右转视角。最终30°/330°候选格与首轮对应格逐像素相同。没有重复生成整张十二格，没有镜像或复制0°。

本机处理只做连通轮廓提取、透明残色/孤立噪点清理、按统一原身高等比归一和排版。没有通过整体放大人物来提高相对宽度，没有横向拉伸或改变原0°尺寸。宽度比在相同身高下测量，来自新绘画的服装/手臂/发束轮廓。

工具没有返回可核实的具体后端模型版本，不声称已确认某个GPT-image版本。原始生成文件保留于：

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-fa796f23-f232-48e2-8efc-8087f38f88cc.png`

`C:/Users/THUNOEROBOT/.codex/generated_images/01a19646-2cb0-7903-b81d-c773339ce540/exec-a329d76a-0d1e-4696-a719-f27bec5b5fa6.png`

## 视觉检查与保留问题

- 30°和60°的头与躯干朝画面右，330°为朝画面左的近正面；脸中线、眼颊透视、衣服门襟和袖臂遮挡各有变化，不是0°复制或两侧镜像。
- 轮廓拓宽主要来自外套下摆、袖臂和主发束，不靠一根远伸发丝或只放大尾巴凑数。
- 脸眼、帽壳、绒球与靴子仍保持圆润，未见整图横向拉伸的观感。
- 冬季鲸鱼帽、蓝白围巾、白毛边、雪花/鲸鱼刺绣、白袜、藏青靴、渐蓝长发和鲸鱼尾巴均保留，没有 maid 围裙/背带或 knit 毛衣/格裙。
- 新60°近侧手臂比0°/30°稍张开，手掌更明显；头部转向比双靴更明显。三格仍是近似角度和姿态，不声称精确同站姿30°均分。帽饰、刺绣和局部发束细节仍需人工判断是否可接受。

数值门槛通过不替代美术验收。尚未进行替换后的 spin 播放检查。

[同身高小图对照：0°原图 / 30° / 60° / 330°](C:/Users/THUNOE~1/AppData/Local/Temp/winter-front3-g6EKtN/winter-front3-vs-front.webp)

参考小图、编辑目标、排版脚本、测量报告与小对照只放系统临时目录。当前生产帧、rig、avatar.js、CSS、README及原联系表均保留原状态；未改maid/knit、web、lib、electron-app、tests或vendor，没有访问数据目录，没有启动DSH/QQ，没有新增依赖，没有commit/push。

## 实际提示词

### 请求一：三格候选

```text
Edit target. Identity-preserve. Image1 is the ONLY authoritative reference: the original winter/sprite.png character. Create ONLY THREE new independent full-color full-body views, arranged ONE HORIZONTAL ROW of THREE cells. Do not redraw an entire12-view sheet. Left=30 degrees toward SCREEN-RIGHT, middle=60 degrees toward SCREEN-RIGHT, right=330 degrees (near-front turned slightly toward SCREEN-LEFT). No0-degree copy, no mirroring. Same character, outfit, pose family and quality as Image1.

CRITICAL CORRECTION: previous near-front drawings became far too narrow. Image1 has a deliberately BROAD, round chibi silhouette: huge rounded whale hood, full flared winter coat and furry hem, open relaxed arms/hands, broad layered hair and a substantial whale tail. Keep that real 3D volume while rotating; do NOT slim the character into a narrow upright doll.
At IDENTICAL character height, the30 view's visible silhouette must be at least90% of Image1 front width,60 at least84%,330 at least94%. Aim with margin:30 about95%,60 about89%,330 about98% of Image1 width. If character is552px tall, front reference width is approximately393px; target30 around375px wide,60 around350px wide,330 around385px wide. Same head-to-body ratio and height, no magnification trick.
These widths must come from the MAIN hood, hair mass, coat hem and relaxed arm envelope, NOT one thin outlier hair/tail spike. The spherical hood must retain its depth and roundness instead of being compressed into a thin cap; coat/hem/arms and hair should remain broad as in Image1. Keep the coat flared, hands held gently away from torso, fur cuffs and broad back curls visible. Retain original tail size, not a tiny substituted tail.
Use matching orthographic or weak-perspective camera distance/framing for all three. Do not zoom one character bigger or smaller. Do NOT horizontally stretch the whole bitmap, widen the eyes into ovals, distort round fur pompoms, flatten the nose or widen the face arbitrarily. Draw new perspective and natural cloth/arm/hair volume, preserving the original anatomy and costume. No T-pose or new elaborate gesture.

VIEW1,30: near-front but clearly turns RIGHT; head and torso together, nose points mildly RIGHT, far eye/cheek mildly foreshortened, coat front center curves/offsets with turn, near sleeve in front of far sleeve. Both eyes may show. Rounded hood rear/side volume and flared coat preserve near-front breadth. Not exact0.
VIEW2,60: clear front-right three-quarter, nose points distinctly RIGHT, farther eye much more foreshortened, side of round head/hood and torso visible, near/far shoulders and boots overlap appropriately. This is more turned than30 but not a paper-thin90 profile. Preserve true head depth and substantial coat/arm/hair silhouette. Not30 copied twice, not front compressed narrower.
VIEW3,330: slightly LEFT near-front,30 degrees before returning to0. Nose and head/torso gently LEFT, opposite perspective from30 but independently drawn, asymmetric cap pin/scarf/tuft/whale tail remain on the same physical side. Nearly original front breadth, still a real slight turn, not copied0 or mirrored30.

OUTFIT EXACTLY Image1: navy/light-blue WHALE HOOD integrated with winter coat, front glossy black whale eyes/pink cheeks, thick white fluffy opening rim, side whale fins and pale-blue/white two-lobed top ornament. Blue whale pin originally at front viewer-RIGHT hood edge, fixed physical temple. White/pale-blue striped scarf wrapping neck, its principal long end at original front viewer-RIGHT with blue end panel, white whale/snowflake and white fringe. Navy A-line winter coat with white fur front placket/cuffs/continuous broad hem, front whale/snowflake/wave embroidery, navy bows with paired white pompoms, neck bow/blue-white center pin. White socks and navy winter BOOTS with fur cuffs, small blue bows and white pompoms/soles. Long voluminous indigo-to-cyan wavy curls extending over coat sides, original blue whale tail with light underside from lower-back root.
Keep original character face shape, huge round sapphire star-highlight eyes, chibi anatomy, glossy gradient hair, fine colored outlines, polished soft cel shading, detailed fur and cloth embroidery. No maid apron, X straps, suspenders or waist bow. No knit beanie/sweater/plaid skirt. No costume redesign.

Desired contact canvas1536x768, three512x768 cells. Each figure fully inside its own cell, same552px silhouette height and shoe baseline localy705, centerlocalx256. Leave wide transparent gutters and complete hood ornament/fins, hair, scarf, tail, hands and boots. Local processing will restore the exact original1439px body height/baseline without distorting proportions.
Actual transparent RGBA outside every figure and in gaps. Full colored raster anime matching Image1, not vector/SVG/line art/sketch/placeholder. No background/floor/shadow/glow/grid/labels/numbers/text/watermarks, no crop, no extra limbs, no double contours, no white/black fringe, no identical copies or reflections.
```

### 请求二：仅修60°

```text
Precise-object-edit / identity-preserve.
Image1 = authoritative ORIGINAL winter sprite, the only character/outfit design reference.
Image2 = EDIT TARGET, the current60-degree view generated from Image1. Edit ONLY this single60-degree sprite, not a contact sheet and not other angles.

Keep the60-degree head and body facing SCREEN-RIGHT, same round whale hood, facial perspective, near blue eye with tiny/occluded far eye, head size, original chibi anatomy, body HEIGHT, shoe baseline, stance and polished full-color anime quality. Keep the actual60-degree pose, not a near-front0/30 copy.

TARGETED CHANGE: Image2's coat/arms/lower-body silhouette is slightly too narrow. Naturally draw the winter COAT+SLEEVES broader while keeping same face, skull and boots:
- relax the near upper arm a little farther outward, with the small hand gently away from coat as in Image1;
- let the far sleeve/white fur cuff contribute a small visible outward silhouette where perspective allows;
- give the A-line coat more volume and a fuller wide fur hem, matching Image1, with believable curved seams/folds, not stretched embroidery;
- retain substantial main curls around the coat, not tiny outlier wisps.
Do not meet the width by only enlarging the whale tail or a hair spike. MAIN coat/sleeve/hem envelope must remain broad. Do not change head size or eye proportions.

At the SAME visible body height, target total visible width about88–90% of Image1 front (minimum84%). Original reference is1024px wide at1439px tall; target this60 view around910px wide at1439px tall. At552px height this is about349px width. Image2 was only851px wide at1439px height, so achieve a modest7% physically broader coat/arm silhouette.
No whole-character magnification, no camera zoom, no body-height increase, no horizontal bitmap stretch, no oval eyes/flattened pompoms, no thin front image compression. Redraw real cloth volume, arm spacing and perspective.

Keep original navy whale hood/white fur rim/side fins/pale-blue white top ornament, small whale pin on same temple, white light-blue striped scarf with whale end/fringe, navy winter coat and white fur placket/cuffs/hem, original blue bows/white pompoms/snowflake+wave+whale embroidery, white socks, navy fur-cuff winter boots, indigo-to-cyan long curls and same whale tail root. No maid apron/straps/big waist bow, no knit sweater/plaid skirt. Preserve existing palette, round star-highlight eyes and fine colored outlines.

ONE complete full-body transparent RGBA sprite, uncropped all hair/hood/scarf/tail/hands/boots, generous transparent margin, centered, no floor/shadow/background/checkerboard/glow/text/labels. Fully colored raster anime, not SVG/vector/sketch. Do not add extra limbs or duplicate the near hand.
```

