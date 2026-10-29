# pet/electron-app

这是桌宠的 **Electron 透明单窗口壳**。它由 `lib/window-shell.js` 自动启动：

- 一个透明、无边框、置顶的 `BrowserWindow`；
- 里面同时放桌宠和聊天抽屉；
- 左键摸、右键菜单、拖动都在这一个窗口里；
- 没有原生标题栏，所以没有第二个叉号。

## 运行时

需要 Electron 的 Windows 构建。安装到：

```text
F:\DeepSeekBot\whale-companion\pet-shell\electron\electron.exe
```

可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/install-electron.ps1
```

脚本会从 npmmirror 下载 Electron 44.7.0 并解压到 `whale-companion/pet-shell/electron`。这个目录在数据目录里，不随插件源码打包。

## 环境变量

宿主启动时传入：

- `WHALE_URL`：桌宠页面 URL（带 token）；
- `WHALE_WIDTH` / `WHALE_HEIGHT`：初始尺寸；
- 必须删掉 `ELECTRON_RUN_AS_NODE`，否则 Electron 会以 Node 模式运行，`require('electron')` 失败。

## 为什么不用 Edge

Edge/Chrome 的 `--app` 窗口 + 洋红色键在 Chromium 的 DirectComposition 下经常失效，会留下矩形窗口和洋红底。Electron 的 `transparent:true` 是真正的 per-pixel alpha，才能满足“透明桌面宠物”。
