# pet/assets

这些是 fallback 立绘，由 `tools/make-assets.py` 从项目上一级的 `assets/` 参考图生成（没有参考图时可直接用仓库里已生成的图）：

| 文件 | 来源 | 说明 |
|---|---|---|
| `maid.png` | `assets/2.png` | 经典女仆装正面，去掉白底 |
| `knit.webp` | `assets/dance.gif` | 针织帽日常装，抽帧 + 去背景 + 压缩成动画 WebP |
| `winter.png` | `assets/冬装小肥鱼.png` | 冬装正面，从三视图裁出，去掉白底 |
| `happy.webp` | `assets/爱你哦.png` | 表情贴纸（保留蓝色背景） |
| `pout.webp` | `assets/才不肥.png` | 表情贴纸 |
| `sleepy.webp` | `assets/好困.png` | 表情贴纸 |
| `winter-reference.jpg` | `assets/冬装小肥鱼.png` | 三视图参考，给 Codex 用 |

这些图只用于本地桌宠的 fallback；Live2D 模型请按 `CODEX-PROMPT.md` 重新制作，并确认参考素材的授权。
