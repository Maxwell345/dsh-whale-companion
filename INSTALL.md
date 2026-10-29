# 安装 / 第一次运行

> 适用：DeepSeek Harness Desktop（Windows），DSH `0.2.1-rc.3` 左右。
> 插件目录：`F:\DeepSeekBot\dsh-whale-companion`

---

## 0. 先确认

- 已安装 DeepSeek Harness Desktop，且能打开 Web GUI。
- 需要 Electron 运行时（透明单窗口）；脚本默认下载到 `F:\DeepSeekBot\whale-companion\pet-shell`，没有 F 盘时回退到 `%USERPROFILE%\.dsh\whale-companion\pet-shell`。没有 Electron 时会回退 Edge，但透明效果不可靠。
- 想用 QQ：先装好 [NapCatQQ](https://napcat.napcatqq.com/)，单独登录小肥鱼的 QQ 号，开启 OneBot 11 的 WebSocket 服务。

---

## 1. 把插件挂进 DSH

### 方式 A：便携安装到 F 盘（推荐）

把仓库放到 F 盘，然后在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools\install-portable.ps1
```

它会做三件事：

1. 把 `dsh-whale-companion` 加进 desktop profile 的 dependencies；
2. 把它加进 `dsh.profile.bundles`；
3. 在 `%USERPROFILE%\.dsh\profiles\desktop\node_modules` 建一个指向 F 盘插件目录的 junction。

C 盘只留这个 junction 和 DSH 自己的小配置；插件代码、数据、Electron 运行时都在 F 盘。

### 方式 B：插件管理器

在 DSH 的插件管理器里选「安装本地插件 / 从目录安装」，目标填：

```text
F:\DeepSeekBot\dsh-whale-companion
```

安装后启用 `dsh-whale-companion`。

> 插件管理器会把插件文件放到 DSH profile 自己的目录（通常在 C 盘）。如果想完全不占 C 盘，用方式 A。

### 方式 C：手工 link

```powershell
# 1) 建目录链接
mklink /J "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-whale-companion" "F:\DeepSeekBot\dsh-whale-companion"

# 2) 编辑 profile 的 package.json，把 dsh-whale-companion 加进 dsh.profile.bundles
notepad "%USERPROFILE%\.dsh\profiles\desktop\package.json"
```

`package.json` 至少要有：

```json
{
  "dependencies": {
    "dsh-whale-companion": "link:F:/DeepSeekBot/dsh-whale-companion"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-whale-companion"
      ]
    }
  }
}
```

再确认 `%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` 末尾有：

```yaml
- insert:
    - id: dsh-whale-companion
      name: dsh-whale-companion
```

### 3. 重启 DSH

宿主半（`lib/index.js`）是 Node 模块，DSH 的 Loader 会按包名缓存，必须重启才会加载。
重启后打开 **设置 → 小肥鱼**，能看到页面就说明挂上了。

---

## 2. 第一次配置

### 2.1 人格

1. 打开「设置 → 小肥鱼 → 人格」。
2. 可以直接写，也可以点「载入模板」把 `persona-template.md` 载入，再改成你自己的。
3. 第一次保存不弹警告；之后再改会连续弹三次确认。
4. 保存后 QQ / 桌宠 / 聊天窗都会用这份人设。

### 2.2 模型 Key

「高级 → 模型」：

- Base URL：`https://api.deepseek.com`
- 模型：`deepseek-chat`
- API Key：
  - 留空：插件会尝试读 `~/.dsh/.credentials.yaml` 里的 `sk-...`，或环境变量 `DEEPSEEK_API_KEY`；
  - 也可以自己填一个 DeepSeek 开放平台的 key。
- 上下文窗口：默认 `64000`；如果你用的模型只有 32k，改成 `32000`。
- 点「测试连接」，看到模型回复就 OK。

### 2.3 作息

「作息」：

- 醒来 `07:30`，睡觉 `22:30`（按你自己的作息改）；
- 想先测试，可以把醒来时间改成 2 分钟后，保存，等她醒；
- 手动「现在唤醒 / 现在睡觉」会压住生物钟 10 分钟，避免立刻被切回去。

### 2.4 QQ（可选）

1. 启动 NapCat，登录小肥鱼的 QQ。
2. 打开 NapCat 的 OneBot 11 WebSocket 服务，记下地址（如 `ws://127.0.0.1:3001`）和 token。
3. 设置页「QQ」：
   - 启用；
   - WebSocket 地址；
   - Access Token；
   - 小肥鱼 QQ 号；
   - 主人 QQ 号；
   - 最多三个群号。
4. 保存后点「连接 / 重连」，状态变成「已连接」。
5. 用主人的 QQ 私聊小肥鱼，或在群里 @ 她。

> 睡觉时 QQ 会自动断开；醒来重连，醒来前的旧消息不看。

### 2.5 桌宠

「桌宠」：

- 「打开桌宠」会启动 Electron 透明单窗口；第一次先运行：
  ```powershell
  powershell -ExecutionPolicy Bypass -File tools/install-electron.ps1
  ```
- 窗口无边框、透明、置顶；左键摸、右键菜单；聊天在同一个窗口右侧展开。
- 聊天右上角是「折叠」，不是关闭：折叠会写单轮总结并清空；再次展开是新的对话。
- 如果 Electron 不存在，会回退 Edge + 洋红抠色；那条路可能看到矩形窗口/洋红底。
- 拖动：在桌宠上**按住左键不放**或直接拖动；**快速单击**才是抚摸。底部工具栏：💬 聊天、👗 换装、🌙 哄睡、✕ 关闭。

### 2.6 书

把 `.txt` 放进数据目录的 `书\`（默认 `F:\DeepSeekBot\whale-companion\书\`；没有 F 盘时是 `%USERPROFILE%\.dsh\whale-companion\书\`），或在设置里改「书目录」。
她只会读，不会删这里的任何书。

---

## 3. Live2D（交给 Codex）

> **当前 Codex 交付的是 Canvas2D 分层 sprite 版，不是 Cubism model3。** 它能直接用，三套服装、17 种动作、表情差分和透明画布都已在桌宠窗口里验收过。`check-live2d.mjs` 里三条 `models/* 没有 .model3.json` 是 sprite 版的预期提示，不是损坏。
>
> 要真正的 Live2D，需要按 `pet/assets/live2d/BINDING.md` 在 Cubism Editor 里绑定、导出 model3/moc3，再替换 `avatar.js`；这一步不是纯文本 Codex 能完成的。

当前已带 fallback 立绘（`pet/assets/maid.png`、`knit.webp`、`winter.png`），不装 Live2D 也能用。

想升级：

1. 打开 [CODEX-PROMPT.md](CODEX-PROMPT.md)。
2. 把「=== 提示词开始 ===」到「=== 提示词结束 ===」之间的内容复制给 Codex。
3. 工作目录填 `F:\DeepSeekBot\dsh-whale-companion`。
4. Codex 会把成果放到 `pet/live2d/`。
5. **PixiJS 不用装**。`pet/live2d/vendor/` 已经带了 PixiJS 6.5.10、Live2D Cubism Core（官方 Latest）和 pixi-live2d-display 0.4.0 的浏览器构建；Codex 用相对路径加载即可。Core 受 Live2D 单独授权约束，只在本机使用，发布时不要打进公共包。
6. 跑一遍结构检查：

```powershell
& "$env:USERPROFILE\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe" tools/check-live2d.mjs
```

7. 刷新桌宠窗口（静态文件不需要重启 DSH）。`web/pet.js` 会优先加载 `pet/live2d/avatar.js`，失败自动回退到立绘。

> 当前交付是 Canvas2D sprite 版；要真正 Live2D，先按 [CUBISM-TUTORIAL.md](CUBISM-TUTORIAL.md) 在 Cubism Editor 绑定导出，再替换 `avatar.js`。
> Codex 只做美术、Live2D、桌宠主题；不要让它改 `lib/`、QQ、记忆和设置页。
> 如果 `check-live2d.mjs` 报错，把 ✗ 那几行发回给 Codex，让它只改 `pet/live2d/**`。

---

## 4. 第一次验收清单

- [ ] 设置页能打开，状态显示「模型已配置」。
- [ ] 「测试连接」返回一句模型回复。
- [ ] 点「打开桌宠」，出现小肥鱼；按住左键能拖，快速单击能摸；底部按钮能点。
- [ ] 点头/耳朵/肚子/尾巴，有不同的话和动作。
- [ ] 点 💬 展开聊天抽屉，发一句，能流式回复。
- [ ] 点聊天右上角「折叠」，`记忆卡/单轮对话总结日记/` 里出现一份总结；再次展开历史为空。
- [ ] 右键桌宠有菜单；按住左键能移动；窗口透明、无标题栏。
- [ ] 点「哄睡」，聊天折叠、QQ 断开；`记忆卡/全天总结日记/` 出现当天总结。
- [ ] 设置里「记忆」可以把超过 14 天的旧日记压缩进重要信息。
- [ ] （可选）QQ 私聊 / 群 @ 能收到回复。

---

## 5. 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 设置页 404 | 插件没挂进 profile 的 bundle 列表；或没重启 DSH |
| 设置页 403 | 从 DSH「设置 → 小肥鱼」进入；不要直接用浏览器打开 `/dsh-whale/settings` |
| 桌宠窗口没出现 | 先跑 `tools/install-electron.ps1`；看 `日志/whale.log`；没有 Electron 才回退 Edge |
| 桌宠有洋红边/矩形底 | 当前是 Edge fallback；安装 Electron 后重启 DSH，改用透明单窗口 |
| 桌宠不能拖动 | 确认用的是 Electron 壳；如果是旧缓存，关掉桌宠窗口重开。拖动是按住/移动，快速单击是抚摸，不要混用 |
| QQ 连不上 | NapCat 没启动 / 端口不对 / token 不对 / 不是 OneBot 11 WebSocket |
| QQ 不回私聊 | 只回主人 QQ；检查「主人 QQ 号」；机器人号不能是自己 |
| QQ 群不回 | 只有 @ 她才回；群号是否在三个群里；她是否醒着 |
| 回复很慢 | DeepSeek 网络；`llm.timeoutMs` 默认 120s |
| 记忆里没有新总结 | 聊天要点「折叠」，不是关窗口；折叠会写总结并清空。直接杀进程可能来不及写；可在「记忆」里点「整理今天」 |
| 修改人设没弹三次 | 只有已有非空人设再改才弹；第一次保存不弹 |
| 改了 `lib/` 没生效 | 宿主半需要重启 DSH |
| 游戏打不开 | 游戏 HTML 必须在 `自由活动/游戏` 下；检查 CSP 是否拦了外部资源 |

---

## 6. 数据备份

把整个 `F:\DeepSeekBot\whale-companion\` 拷走即可，包含：

- 人设人格卡
- 重要信息记忆
- 全天总结日记 / 单轮总结 / 自由活动日志
- 对话历史
- 自由活动作品
- 书
- 状态

配置本身在 `F:\DeepSeekBot\whale-companion\config.json`（`%USERPROFILE%\.dsh\whale-companion` 现在是指向它的 junction；旧数据在 `%USERPROFILE%\.dsh\whale-companion.old`，确认正常后可删）。

换机器时，把目录拷到新机器的同一位置，再重新挂插件即可。
