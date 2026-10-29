#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_CONFIG, DSH_HOME, dataPaths, ensureDataDirs, loadConfig, resolveApiKey } from '../lib/config.js'
import { findBrowser, findElectron } from '../lib/window-shell.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const checks = []
function ok(name, detail = '') { checks.push({ ok: true, name, detail }) }
function bad(name, detail = '') { checks.push({ ok: false, name, detail }) }
function info(name, detail = '') { checks.push({ ok: true, name, detail, info: true }) }

function file(rel, minBytes = 1) {
  const p = path.join(ROOT, rel)
  try {
    const st = fs.statSync(p)
    if (st.isFile() && st.size >= minBytes) ok(rel, `${st.size} B`)
    else bad(rel, `文件太小：${st.size} B`)
  } catch { bad(rel, '不存在') }
}

info('Node', process.version)
info('插件目录', ROOT)
info('DSH_HOME', DSH_HOME)

for (const f of [
  'package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'lib/memory.js',
  'lib/llm.js', 'lib/qq.js', 'lib/schedule.js', 'lib/activities.js', 'lib/window-shell.js',
  'web/settings.html', 'web/settings.js', 'web/pet.html', 'web/pet.js', 'web/pet.css',
  'web/chat.html', 'web/chat.js', 'web/chat.css', 'web/activity.html', 'web/activity.js',
  'web/avatar-fallback.js', 'tools/pet-window.ps1', 'CODEX-PROMPT.md', 'persona-template.md',
]) file(f, 50)

for (const f of [
  ['pet/assets/maid.png', 10000],
  ['pet/assets/knit.webp', 100000],
  ['pet/assets/winter.png', 10000],
  ['pet/assets/happy.webp', 1000],
  ['pet/assets/pout.webp', 1000],
  ['pet/assets/sleepy.webp', 1000],
]) file(f[0], f[1])

const cfg = loadConfig()
try {
  const p = ensureDataDirs(cfg)
  ok('数据目录', p.root)
  ok('人设人格卡', p.persona)
  ok('重要信息记忆', p.important)
} catch (err) { bad('数据目录', err.message) }

if (cfg.persona?.locked) ok('人设已锁定', '再改需要三次确认')
else info('人设尚未锁定', '第一次填写不会弹警告')

const key = resolveApiKey(cfg)
if (key) ok('DeepSeek Key', `已找到（${key.slice(0, 5)}…，不显示完整）`)
else bad('DeepSeek Key', '设置里没填，DSH 凭据和环境变量也没有')

const electron = findElectron(dataPaths(cfg).root)
if (electron) ok('Electron 桌宠壳', electron)
else info('Electron 桌宠壳', '没找到；先跑 tools/install-electron.ps1。没有它只能回退 Edge')

const browser = findBrowser()
if (browser) info('Edge fallback', browser)
else info('Edge fallback', '没找到；Electron 可用就不影响')

const py = [
  path.join(DSH_HOME, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'python.exe'),
  'python', 'py',
].find((x) => x === 'python' || x === 'py' || fs.existsSync(x))
if (py) info('Python（可选）', py)
else info('Python（可选）', '没找到；只影响 Python 小游戏')

const live2d = path.join(ROOT, 'pet', 'live2d', 'avatar.js')
if (fs.existsSync(live2d)) ok('Live2D 适配层', live2d)
else info('Live2D 适配层', '还没放；当前用 pet/assets 立绘回退。把 CODEX-PROMPT.md 发给 Codex。')

const profile = path.join(os.homedir(), '.dsh', 'profiles', 'desktop')
const linked = path.join(profile, 'node_modules', 'dsh-whale-companion')
if (fs.existsSync(linked)) ok('已 link 到 desktop profile', linked)
else info('未 link 到 desktop profile', '用插件管理器安装，或按 INSTALL.md 手工 link')

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(profile, 'package.json'), 'utf8'))
  const bundles = pkg?.dsh?.profile?.bundles ?? []
  if (bundles.includes('dsh-whale-companion')) ok('已加入 profile bundle 列表')
  else info('未加入 profile bundle 列表', '安装后需要加入 bundles 并重启 DSH')
  const patch = fs.readFileSync(path.join(profile, 'cordis.patch.yml'), 'utf8')
  if (patch.includes('dsh-whale-companion')) ok('cordis.patch.yml 已包含插件')
} catch {}

const failed = checks.filter((c) => !c.ok)
for (const c of checks) {
  const mark = c.ok ? (c.info ? '·' : '✓') : '✗'
  console.log(`${mark} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
}
console.log('')
if (failed.length) {
  console.log(`有 ${failed.length} 项需要处理。`)
  process.exitCode = 1
} else {
  console.log('基础自检通过。打开 DSH → 设置 → 小肥鱼，点「测试连接」和「打开桌宠」做最终验收。')
}
