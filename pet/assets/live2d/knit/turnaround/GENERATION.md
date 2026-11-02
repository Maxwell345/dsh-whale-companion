# Knit 转圈帧来源

2026-11-01，使用内置 `image_gen`，以本套 `sprite.png` 为角色、服装和画风参考，以已检查的 maid 联系表为布局参考生成完整上色四视图。工具没有返回可核验的后端模型版本号。

- 正面直接复制本套 `sprite.png`，保持字节一致。
- 侧/背面来自原生 Alpha 修正版 `exec-81037efd-98fe-4107-8eb8-c696207f3deb.png`；原稿保留于本次 Codex `generated_images/01a19646-2cb0-7903-b81d-c773339ce540/`。
- 首稿的右侧面遗漏鲸鱼帽饰，已通过 imagegen 修正。绿色首稿没有用于最终透明素材。
- 裁切/等比对齐使用 `source/pack-turnaround.mjs`，不使用镜像或程序绘画；每帧 1052×1494，鞋底基线与本套原图一致。

最终编辑提示词（原文；输入1为针织装四视首稿，输入2为原 `sprite.png`）：

> Edit target Image1: four-view KNIT outfit turnaround sheet. Supporting Image2 is authoritative original outfit. Keep ALL FOUR existing complete painted characters in image1, their exact poses/directions, proportions, cable-knit stitch detail, voluminous indigo-to-cyan curled hair and original anime finish. Only make two corrections: (1) REMOVE the entire PURE GREEN BACKGROUND and output true transparent alpha outside every figure, also in all hair/leg gaps, no matte fringe, no shadows, no glow, no colored backdrop. (2) The top-right RIGHT PROFILE is missing the asymmetrical hat accessory: add the same small blue/white whale pin with navy bow and cream pompom seen on front screen-right and back screen-left, attached to the cream knit cap/headband on the back-of-head side of the RIGHT PROFILE (image-left/back part of that profile's crown). This accessory belongs to character-left side and is visible on right-facing profile, absent on bottom-right left-facing profile. Keep back no-face; no front sweater whale on back. Make no other redesign. Keep four characters fully inside the 2x2 sheet with clean transparent gutters and complete shoe/hair tips; front top-left, right top-right, back bottom-left, left bottom-right. No text, no labels, no frame. Not a vector or SVG, maintain rich shaded full-color fine anime detail. Output actual transparent PNG.
