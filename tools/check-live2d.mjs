#!/usr/bin/env node
/**
 * Post-Codex checklist for the Live2D drop-in.
 * Run: node tools/check-live2d.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const LIVE = path.join(ROOT, 'pet', 'live2d')
const errors = []
const warns = []
const ok = []

function exists(p) { try { return fs.existsSync(p) } catch { return false } }
function read(p) { try { return fs.readFileSync(p, 'utf8') } catch { return '' } }

const avatar = path.join(LIVE, 'avatar.js')
let spriteMode = false
if (!exists(avatar)) {
  errors.push(`缺少 ${path.relative(ROOT, avatar)}（Codex 还没产出，或放错目录）`)
} else {
  const text = read(avatar)
  spriteMode = /SpriteAvatar|canvas2d-sprite|Canvas2D/i.test(text)
  if (!/window\.WhaleAvatar\s*=/.test(text)) errors.push('avatar.js 没有定义 window.WhaleAvatar')
  else ok.push('avatar.js 定义了 window.WhaleAvatar')
  if (/https?:\/\//.test(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))) {
    errors.push('avatar.js 里出现了 http(s)://；运行时不允许外网/CDN')
  }
  if (!/setOutfit/.test(text)) warns.push('avatar.js 里没看到 setOutfit；换装可能没接')
  if (!/play\s*\(/.test(text)) warns.push('avatar.js 里没看到 play；动作可能没接')
  if (spriteMode) ok.push('avatar.js 是 Canvas2D 分层 sprite 版（不是 Cubism model3）')
}

const modelsRoot = path.join(LIVE, 'models')
const wanted = ['maid', 'knit', 'winter']
const foundModels = []
if (!exists(modelsRoot)) {
  errors.push('缺少 pet/live2d/models/')
} else {
  for (const name of wanted) {
    const dir = path.join(modelsRoot, name)
    const files = exists(dir) ? fs.readdirSync(dir) : []
    const model3 = files.find((f) => f.endsWith('.model3.json'))
    if (!model3) {
      if (spriteMode) warns.push(`models/${name}/ 里没有 .model3.json（sprite 版的预期状态）`)
      else errors.push(`models/${name}/ 里没有 .model3.json（avatar.js 看起来不是 sprite 版）`)
      continue
    }
    const modelPath = path.join(dir, model3)
    foundModels.push(modelPath)
    let json
    try { json = JSON.parse(read(modelPath)) } catch (e) {
      errors.push(`${path.relative(ROOT, modelPath)} 不是合法 JSON：${e.message}`)
      continue
    }
    const fr = json?.FileReferences
    if (!fr?.Moc) errors.push(`${name}: model3.json 缺少 FileReferences.Moc`)
    if (!Array.isArray(fr?.Textures) || !fr.Textures.length) errors.push(`${name}: model3.json 缺少 Textures`)
    for (const tex of fr?.Textures ?? []) {
      const p = path.resolve(path.dirname(modelPath), tex)
      if (!exists(p)) errors.push(`${name}: 纹理不存在 ${tex}`)
    }
    const moc = fr?.Moc ? path.resolve(path.dirname(modelPath), fr.Moc) : ''
    if (moc && !exists(moc)) errors.push(`${name}: moc 不存在 ${fr.Moc}`)
  }
}
if (foundModels.length) ok.push(`找到 ${foundModels.length} 个 model3.json`)

const vendor = path.join(LIVE, 'vendor')
const vendorFiles = exists(vendor) ? fs.readdirSync(vendor).filter((f) => /\.(js|mjs)$/.test(f)) : []
for (const f of ['pixi.min.js', 'pixi-live2d-display-cubism4.min.js']) {
  if (!vendorFiles.includes(f)) errors.push(`vendor 缺少 ${f}（PixiJS 已预置，不应删掉）`)
}
if (vendorFiles.includes('pixi.min.js') && vendorFiles.includes('pixi-live2d-display-cubism4.min.js')) {
  ok.push('PixiJS + pixi-live2d-display 浏览器构建在 vendor（不需要 npm install）')
}
if (!vendorFiles.includes('live2dcubismcore.min.js')) {
  warns.push('还缺 live2dcubismcore.min.js：从 Live2D 官方 SDK 下载后放进 vendor（授权原因，插件不代发）')
} else {
  ok.push('Cubism Core 已放入 vendor')
}

const petJs = read(path.join(ROOT, 'web', 'pet.js'))
if (!petJs.includes("live2d/avatar.js")) errors.push('web/pet.js 的 Live2D 加载入口被改掉了；请恢复原文件')
else ok.push('web/pet.js 仍会加载 pet/live2d/avatar.js')

const readme = path.join(LIVE, 'README.md')
if (!exists(readme)) warns.push('缺少 pet/live2d/README.md（模型来源、授权、Core 路径、调试方法）')

for (const line of ok) console.log(`✓ ${line}`)
for (const line of warns) console.log(`· ${line}`)
for (const line of errors) console.log(`✗ ${line}`)
console.log('')
if (errors.length) {
  console.log(`有 ${errors.length} 个问题需要修。把上面的 ✗ 发给 Codex，让它只改 pet/live2d/**。`)
  process.exitCode = 1
} else if (spriteMode) {
  console.log('Canvas2D sprite 版结构通过。没有 model3 是预期，不是损坏。')
  console.log('打开桌宠窗口做视觉验收：三套服装、idle、17 种动作、缩放、透明、断网。')
  console.log('要真正的 Live2D：需要在 Cubism Editor 里按 BINDING.md 绑定并导出 model3/moc3，')
  console.log('然后把 avatar.js 换成 Live2D 实现；PixiJS/Core 已经在 vendor 里。')
} else {
  console.log('Live2D 结构检查通过。打开桌宠窗口做视觉验收：模型加载、idle、动作、三套换装、缩放、断网。')
}
