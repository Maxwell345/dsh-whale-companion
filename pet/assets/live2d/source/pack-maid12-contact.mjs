/** Pack two native-alpha imagegen six-view sheets for review; no painting or runtime installation. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(process.env.WHALE_ASSET_PACKAGE || path.resolve(path.dirname(process.execPath), '../package.json'))
const sharp = require('sharp')
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [first, second] = process.argv.slice(2)
if (!first || !second) throw new Error('Usage: node pack-maid12-contact.mjs FIRST_SIX.png SECOND_SIX.png')
const output = path.join(root, 'maid/turnaround/maid-12-contact-sheet.png')
const metadata = path.join(root, 'maid/turnaround/maid-12-contact-alignment.json')
for (const file of [output, metadata]) {
  try { await fs.access(file) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
  throw new Error('Refusing to overwrite an existing review artifact: ' + file)
}

function box(raw, width, height) {
  let x0 = width, x1 = -1, y0 = height, y1 = -1
  for (let p = 0; p < width * height; p++) if (raw[p * 4 + 3] > 16) {
    const x = p % width, y = Math.floor(p / width)
    x0 = Math.min(x0, x); x1 = Math.max(x1, x)
    y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  if (x1 < x0) throw new Error('Empty sprite')
  return { x0, x1, y0, y1 }
}

function axis(raw, width, bounds) {
  let sum = 0, mass = 0
  const height = bounds.y1 - bounds.y0 + 1
  for (let y = Math.round(bounds.y1 - height * 0.07); y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const alpha = raw[(y * width + x) * 4 + 3]
      if (alpha > 16) { sum += x * alpha; mass += alpha }
    }
  }
  return sum / mass
}

async function split(file) {
  const input = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = input.info, raw = input.data
  const labels = new Int32Array(width * height), queue = new Int32Array(labels.length)
  const figures = []
  let label = 0
  for (let p = 0; p < labels.length; p++) {
    if (labels[p] || raw[p * 4 + 3] < 100) continue
    label++
    let head = 0, tail = 1, count = 0, x0 = width, x1 = -1, y0 = height, y1 = -1
    labels[p] = label; queue[0] = p
    while (head < tail) {
      const k = queue[head++], x = k % width, y = Math.floor(k / width)
      count++; x0 = Math.min(x0, x); x1 = Math.max(x1, x)
      y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      for (const d of [-1, 1, -width, width]) {
        const n = k + d
        if (n < 0 || n >= labels.length || labels[n] || raw[n * 4 + 3] < 100 || Math.abs(n % width - x) > 1) continue
        labels[n] = label; queue[tail++] = n
      }
    }
    if (count > width * height * 0.025) figures.push({ label, count, x0, x1, y0, y1 })
  }
  if (figures.length !== 6) throw new Error('Expected six separated figures in ' + file + ', got ' + figures.length)
  figures.sort((a, b) => Number(a.y0 >= height / 2) - Number(b.y0 >= height / 2) || a.x0 - b.x0)
  return figures.map(figure => {
    const expanded = new Uint8Array(labels.length)
    for (let p = 0; p < labels.length; p++) if (labels[p] === figure.label) {
      const x = p % width, y = Math.floor(p / width)
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) expanded[(y + dy) * width + x + dx] = 1
      }
    }
    const data = Buffer.from(raw)
    for (let p = 0; p < labels.length; p++) {
      const keep = expanded[p] && (!labels[p] || labels[p] === figure.label)
      const alpha = keep ? Math.round(Math.max(0, Math.min(1, (data[p * 4 + 3] - 3) / 250)) * 255) : 0
      data[p * 4 + 3] = alpha
      if (!alpha) data.fill(0, p * 4, p * 4 + 4)
    }
    return { data, width, height, source: path.resolve(file) }
  })
}

const figures = [...await split(first), ...await split(second)]
// The first facing is the authoritative original, with no regenerated face.
const front = await sharp(path.join(root, 'maid/sprite.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
figures[0] = { data: front.data, width: front.info.width, height: front.info.height, source: 'maid/sprite.png' }
const cellWidth = 512, cellHeight = 768, baseline = 704
// Reserve the same axis in all cells, including profiles with a long tail on
// one side. Fit the whole set uniformly instead of shrinking a single back.
let bodyHeight = 620
for (const figure of figures) {
  const b = box(figure.data, figure.width, figure.height)
  const center = axis(figure.data, figure.width, b)
  const reach = Math.max(center - b.x0, b.x1 - center)
  bodyHeight = Math.min(bodyHeight, (cellWidth / 2 - 24) / reach * (b.y1 - b.y0 + 1))
}
bodyHeight = Math.floor(bodyHeight) - 2
const layers = [], measurements = []
for (let index = 0; index < figures.length; index++) {
  const figure = figures[index], b = box(figure.data, figure.width, figure.height)
  const factor = bodyHeight / (b.y1 - b.y0 + 1)
  const cropped = await sharp(figure.data, { raw: { width: figure.width, height: figure.height, channels: 4 } })
    .extract({ left: b.x0, top: b.y0, width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1 })
    .resize({ height: bodyHeight, kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const cb = box(cropped.data, cropped.info.width, cropped.info.height)
  const center = axis(cropped.data, cropped.info.width, cb)
  const x = Math.round(cellWidth / 2 - center), y = baseline - cb.y1
  if (x + cb.x0 < 12 || x + cb.x1 >= cellWidth - 12) throw new Error('Figure does not fit cell without axis drift at angle ' + index * 30)
  const png = await sharp(cropped.data, { raw: cropped.info }).png().toBuffer()
  layers.push({ input: png, left: index % 4 * cellWidth + x, top: Math.floor(index / 4) * cellHeight + y })
  measurements.push({ angle: index * 30, source: figure.source, scale: factor,
    cellBounds: [x + cb.x0, y + cb.y0, x + cb.x1, y + cb.y1], footBaseline: y + cb.y1,
    footCenterX: Math.round((x + center) * 100) / 100 })
}
await fs.mkdir(path.dirname(output), { recursive: true })
await sharp({ create: { width: cellWidth * 4, height: cellHeight * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(layers).png().toFile(output)
await fs.writeFile(metadata, JSON.stringify({ reviewOnly: true, width: 2048, height: 2304,
  cell: [cellWidth, cellHeight], bodyHeight, footBaseline: baseline, measurements }, null, 2) + '\n')
console.log(JSON.stringify({ output, metadata, measurements }, null, 2))
