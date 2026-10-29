# 经典女仆装 · Cubism 交付状态

本目录目前没有 Cubism 模型。当前可运行交付为 Canvas2D 分层 sprite，素材在 [pet/assets/live2d/maid](../../../assets/live2d/maid/)。未生成或伪造 `.model3.json`、`.moc3`、motion3、exp3 或 physics3。

原画 PSD 是可见区域的切片动画稿；正式绑定前还需补绘遮挡区域、拆分眼白/虹膜/眼皮/眉及嘴部、建立网格/变形器/参数/物理，再从 Cubism Editor 导出真实模型。详见 [绑定说明](../../../assets/live2d/BINDING.md)。

未来可在此放入 `maid.model3.json`、其引用的 `.moc3`、纹理与动作/表情/物理文件，并使用三套一致的参数名。当前 `avatar.js` 不自动加载 model3；需按 [适配层说明](../../README.md) 替换入口实现。所有文件应为本地相对引用，保留原 vendor 版本与 Core 的本地使用限制。
