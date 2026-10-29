# pet/live2d/vendor

这里放的是运行时浏览器构建，**不需要在这台电脑上安装 PixiJS，也不需要 `npm install`**。

| 文件 | 版本 | 许可 | 用途 |
|---|---|---|---|
| `pixi.min.js` | PixiJS 6.5.10 | MIT | 渲染器 |
| `live2dcubismcore.min.js` | Live2D Cubism Core（Latest） | Live2D 官方许可 | Cubism 运行时 |
| `pixi-live2d-display-cubism4.min.js` | pixi-live2d-display 0.4.0 | MIT | 把 Cubism 4 的 `Live2DModel` 挂到 `PIXI.live2d` |
| `PIXI-LICENSE.txt` | — | MIT | PixiJS 许可 |
| `PIXI-LIVE2D-DISPLAY-LICENSE.txt` | — | MIT | pixi-live2d-display 许可 |

## Cubism Core 已放好

`live2dcubismcore.min.js` 已经从 Live2D 官方 **Cubism Core for Web → Latest** 下载到本目录（228 KB）。它受 Live2D 单独的授权约束，**只在本机项目里使用，不要提交到公共仓库或再分发**。

`avatar.js` 仍然要检测 `window.Live2DCubismCore`；缺失时放弃定义 `window.WhaleAvatar`，让 `web/avatar-fallback.js` 接手。

如果换机器或重装：到 Live2D 官方 Cubism SDK for Web 页面，勾选同意许可，选择 **Individual**，然后在 **Cubism Core for Web** 下点 **Latest**，把得到的 `live2dcubismcore.min.js` 放回本目录即可。不需要下载整个 SDK zip。

如果 Codex 产出的模型加载时报 MOC3 / Core 版本不兼容，可以在同一页面的 **Cubism Core for Web** 下改用 **Cubism 5.3** 或 **Cubism 5.2** 的 Core，替换本目录这一个文件再试（同一时间只保留一个 `live2dcubismcore.min.js`）。

## 加载顺序

```html
<script src="/dsh-whale/static/pet/live2d/vendor/pixi.min.js"></script>
<script src="/dsh-whale/static/pet/live2d/vendor/live2dcubismcore.min.js"></script>
<script src="/dsh-whale/static/pet/live2d/vendor/pixi-live2d-display-cubism4.min.js"></script>
<script src="/dsh-whale/static/pet/live2d/avatar.js"></script>
```

`pixi-live2d-display-cubism4.min.js` 必须排在 `pixi.min.js` 之后；Core 要在 `avatar.js` 读取模型之前加载。
