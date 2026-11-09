# winter 爬墙循环

- `left/01.png`–`04.png`：从 `winter-climb-left-4-contact-sheet.png` 裁切，1100×1494 RGBA。
- `right/01.png`–`04.png`：当前为左侧水平镜像的临时版本，用于先把左右爬墙流程跑通；冬季装的不对称毛球/刺绣细节会翻转，不是最终美术。
- 每帧 200ms，`01 → 02 → 03 → 04 → 01` 直接切换，不做 alpha 交叉淡化。
- 只对 winter 生效；maid/knit 使用各自帧组。
- 主进程负责窗口向上移动；窗口贴墙位置由渲染层扫描当前帧的可见轮廓后回传 `wallInset`。
