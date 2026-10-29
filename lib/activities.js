import fs from 'node:fs'
import path from 'node:path'
import { dataPaths } from './config.js'
import { activityPrompt } from './prompts.js'
import {
  ensureDir, listFiles, localDateKey, localStamp, localTimeKey, randomToken,
  readJson, readText, safeName, stripCodeFence, writeJsonAtomic, writeTextAtomic,
} from './util.js'

const KIND_LABEL = {
  draw: '画画',
  codeGame: '写小游戏',
  readBook: '读书',
  appreciate: '欣赏旧画',
  playGame: '玩游戏',
  clean: '整理作品',
  missOwner: '想主人',
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class FreeActivities {
  constructor({ getConfig, llm, memory, pet, windows, isBusy, onSay, onMissOwner, lastUserAt = () => 0, log = () => {} }) {
    this.getConfig = getConfig
    this.llm = llm
    this.memory = memory
    this.pet = pet
    this.windows = windows
    this.isBusy = isBusy
    this.onSay = onSay
    this.onMissOwner = onMissOwner
    this.lastUserAt = lastUserAt
    this.log = log
    this.timer = null
    this.lastActivityAt = 0
    this.nextAt = 0
    this.running = false
    this.play = this.loadPlay()
  }

  get dataRoot() {
    return dataPaths(this.getConfig()).root
  }

  get playFile() {
    return path.join(this.dataRoot, '玩法.json')
  }

  loadPlay() {
    const raw = readJson(this.playFile, null)
    const today = localDateKey()
    return {
      date: raw?.date === today ? today : today,
      minutes: raw?.date === today ? Number(raw.minutes) || 0 : 0,
      current: raw?.current && raw?.date === today ? raw.current : null,
      lastMissAt: Number(raw?.lastMissAt) || 0,
      counts: raw?.date === today ? (raw.counts ?? {}) : {},
    }
  }

  savePlay() {
    writeJsonAtomic(this.playFile, this.play)
  }

  start() {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => { this.tick().catch((e) => this.log(`[free] tick 失败：${e.message}`)) }, 60000)
    this.scheduleNext(5)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  scheduleNext(minMinutes = null) {
    const cfg = this.getConfig()
    const min = minMinutes ?? cfg.schedule.freeMinGapMin
    const max = Math.max(min + 1, cfg.schedule.freeMaxGapMin)
    this.nextAt = Date.now() + (min + Math.random() * (max - min)) * 60000
  }

  async tick() {
    if (this.running) return
    const cfg = this.getConfig()
    if (!cfg.free.enabled || !cfg.schedule.freeEnabled) return
    if (!cfg.schedule.enabled) return
    if (!this.pet || this.pet.asleep) return
    if (this.isBusy?.()) return
    if (Date.now() < this.nextAt) return
    await this.run('auto')
  }

  chooseKind() {
    const cfg = this.getConfig()
    const enabled = cfg.free.activities
    const options = []
    const add = (k, w) => { if (enabled[k]) options.push({ k, w }) }
    add('draw', 26)
    add('codeGame', 18)
    add('readBook', 20)
    add('appreciate', 12)
    add('playGame', 10)
    add('clean', 6)
    const idleMin = (Date.now() - (Number(this.lastUserAt()) || Date.now())) / 60000
    if (idleMin >= (cfg.schedule?.missOwnerAfterMin ?? 120)) add('missOwner', 8)
    if (!options.length) return null
    const total = options.reduce((s, o) => s + o.w, 0)
    let r = Math.random() * total
    for (const o of options) {
      r -= o.w
      if (r <= 0) return o.k
    }
    return options[0].k
  }

  async run(kind = 'auto', { manual = false } = {}) {
    if (this.running) return { ok: false, error: '已经在做别的事了' }
    this.running = true
    const cfg = this.getConfig()
    const chosen = kind === 'auto' || !kind ? this.chooseKind() : kind
    if (!chosen) { this.running = false; return { ok: false, error: '没有启用的自由活动' } }
    try {
      this.log(`[free] 开始：${KIND_LABEL[chosen] ?? chosen}`)
      let result
      if (chosen === 'draw') result = await this.draw()
      else if (chosen === 'codeGame') result = await this.codeGame()
      else if (chosen === 'readBook') result = await this.readBook()
      else if (chosen === 'appreciate') result = await this.appreciate()
      else if (chosen === 'playGame') result = await this.playGame()
      else if (chosen === 'clean') result = await this.clean()
      else if (chosen === 'missOwner') result = await this.missOwner()
      else result = { ok: false, error: `未知活动 ${chosen}` }
      this.lastActivityAt = Date.now()
      this.scheduleNext()
      if (result.ok) {
        this.play.counts[chosen] = (this.play.counts[chosen] ?? 0) + 1
        this.savePlay()
        this.memory.appendFreeLog(result.log || `${KIND_LABEL[chosen]}：${result.summary ?? ''}`)
        if (result.say) this.onSay?.(result.say)
      }
      return result
    } catch (err) {
      this.log(`[free] ${chosen} 失败：${err.message}`)
      return { ok: false, error: err.message, kind: chosen }
    } finally {
      this.running = false
    }
  }

  async draw() {
    const cfg = this.getConfig()
    const theme = pick(['白米饭', '鲸鱼', '主人', '今天的天气', '一个梦', '一颗糖', '海'])
    const r = await this.llm.call([
      { role: 'system', content: '你是一个会画儿童简笔画的小鲸鱼娘。只输出 SVG。' },
      { role: 'user', content: activityPrompt('draw', `今天想画：${theme}。`) },
    ], { maxTokens: 3600, temperature: 1.0 })
    const svg = stripCodeFence(r.text)
    this.validateSvg(svg)
    const p = dataPaths(cfg)
    const file = path.join(p.art, `${localDateKey()}-${localTimeKey().replace(':', '')}-${safeName(theme)}.svg`)
    writeTextAtomic(file, svg)
    const say = pick(['画好啦！你看像不像？', '嘿嘿，今天的画完成！', '唔……这里好像画歪了。'])
    return {
      ok: true,
      kind: 'draw',
      file,
      say,
      summary: `画了一幅「${theme}」的简笔画，存到 ${path.basename(file)}`,
      log: `### 画画\n- 主题：${theme}\n- 文件：\`${path.relative(p.root, file)}\`\n- 她自己的话：${say}`,
    }
  }

  async codeGame() {
    const cfg = this.getConfig()
    const idea = pick(['接住掉下来的白米饭', '小鲸鱼躲水母', '记住颜色的小游戏', '帮主人找尾巴', '跳一跳吃糖'])
    const r = await this.llm.call([
      { role: 'system', content: '你是一个会写小游戏的小鲸鱼娘。只输出代码。' },
      { role: 'user', content: activityPrompt('codeGame', `这次想做：${idea}。`) },
    ], { maxTokens: 6000, temperature: 1.0 })
    let code = stripCodeFence(r.text)
    const isPython = /^#\s*python/i.test(code) || /^(?:import|from)\s+\w+/m.test(code)
    if (Buffer.byteLength(code, 'utf8') > cfg.free.maxCodeBytes) throw new Error('代码超过 20KB')
    if (/(多人|双人|联机|玩家\s*2|player\s*2|邀请主人|一起玩这局|对局)/i.test(code)) {
      throw new Error('生成了多人/邀请主人的游戏，请重写成她自己玩的单人游戏')
    }
    const p = dataPaths(cfg)
    const base = `${localDateKey()}-${localTimeKey().replace(':', '')}-${safeName(idea)}`
    if (isPython) {
      if (!cfg.free.allowPython) throw new Error('设置里不允许 Python 游戏')
      this.validatePython(code)
      code = code.replace(/^#\s*python[^\n]*\n?/i, '')
      const file = path.join(p.games, `${base}.py`)
      writeTextAtomic(file, code)
      return {
        ok: true,
        kind: 'codeGame',
        file,
        say: pick(['写好啦！虽然可能有点笨……', '这个游戏我自己都想玩！', '唔，代码好像有点短。']),
        summary: `写了一个 Python 小游戏「${idea}」`,
        log: `### 写游戏\n- 点子：${idea}\n- 语言：Python\n- 文件：\`${path.relative(p.root, file)}\``,
      }
    }
    this.validateHtml(code)
    const file = path.join(p.games, `${base}.html`)
    writeTextAtomic(file, code)
    return {
      ok: true,
      kind: 'codeGame',
      file,
      say: pick(['写好啦！我自己玩给你看。', '这个游戏我改了三次才跑起来！', '嘿嘿，这次一定好玩，我自己先玩。']),
      summary: `写了一个网页小游戏「${idea}」`,
      log: `### 写游戏\n- 点子：${idea}\n- 语言：HTML（内联 CSS/JS）\n- 文件：\`${path.relative(p.root, file)}\``,
    }
  }

  validateSvg(svg) {
    if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) throw new Error('SVG 格式不完整')
    if (Buffer.byteLength(svg, 'utf8') > this.getConfig().free.maxCodeBytes) throw new Error('SVG 超过 20KB')
    // The SVG namespace is required and is not an external resource.
    const check = String(svg).replace(/xmlns(?::xlink)?="http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xlink)"/gi, '')
    if (/<script|onload=|onclick=|https?:\/\//i.test(check)) throw new Error('SVG 含不允许的外部内容')
  }

  validateHtml(code) {
    const s = String(code)
    if (!/^<!doctype html/i.test(s) && !/^<html[\s>]/i.test(s)) throw new Error('HTML 缺少 doctype')
    if (!/<\/html>\s*$/i.test(s)) throw new Error('HTML 不完整')
    if (/<script[^>]+src\s*=/i.test(s)) throw new Error('不允许外部 script')
    if (/<link[^>]+href\s*=\s*["']https?:/i.test(s)) throw new Error('不允许外部样式')
    if (/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(s)) throw new Error('不允许联网')
    if (/https?:\/\//i.test(s.replace(/<!--[\s\S]*?-->/g, ''))) throw new Error('不允许外部 URL')
  }

  validatePython(code) {
    const s = String(code)
    if (Buffer.byteLength(s, 'utf8') > this.getConfig().free.maxCodeBytes) throw new Error('Python 超过 20KB')
    const banned = /\b(?:import|from)\s+(?:os|sys|socket|subprocess|shutil|pathlib|requests|urllib|http|ftplib|telnetlib|ctypes|multiprocessing|threading)\b/
    if (banned.test(s)) throw new Error('Python 不允许导入系统/网络模块')
    if (/\b(?:eval|exec|compile|__import__)\s*\(/.test(s)) throw new Error('Python 不允许动态执行')
    if (/\bopen\s*\(/.test(s)) throw new Error('Python 不允许读写文件')
    if (/\b(?:system|popen|spawn|fork)\s*\(/.test(s)) throw new Error('Python 不允许启动进程')
  }

  bookDir() {
    const cfg = this.getConfig()
    return cfg.free.booksDir ? path.resolve(cfg.free.booksDir) : dataPaths(cfg).books
  }

  async readBook() {
    const dir = this.bookDir()
    const books = listFiles(dir, (n) => n.toLowerCase().endsWith('.txt') && !n.startsWith('把书放这里'))
    if (!books.length) return { ok: false, error: `书文件夹里没有 txt：${dir}` }
    const file = pick(books)
    const text = readText(file, '')
    if (!text.trim()) return { ok: false, error: '这本书是空的' }
    const chunkSize = 5000
    const start = Math.max(0, Math.floor(Math.random() * Math.max(1, text.length - chunkSize)))
    const chunk = text.slice(start, start + chunkSize)
    const r = await this.llm.call([
      { role: 'system', content: '你是小肥鱼，正在读书。用小女孩日记的口吻写读后感。' },
      { role: 'user', content: activityPrompt('readBook', `书名（文件）：${path.basename(file)}\n\n原文片段：\n${chunk}`) },
    ], { maxTokens: 500, temperature: 0.9 })
    const note = stripCodeFence(r.text).slice(0, 1200)
    return {
      ok: true,
      kind: 'readBook',
      file,
      say: pick(['这本书好有趣……', '唔，这一段我读了两遍。', '读着读着就想到主人了。']),
      summary: `读了《${path.basename(file, '.txt')}》的一段`,
      log: `### 读书\n- 书：\`${path.basename(file)}\`\n- 读到的位置：约 ${start} 字\n- 读后感：\n${note}`,
    }
  }

  async appreciate() {
    const p = dataPaths(this.getConfig())
    const art = listFiles(p.art, (n) => /\.(svg|png|webp|jpg|jpeg|gif)$/i.test(n))
    if (!art.length) return { ok: false, error: '还没有旧画可以看' }
    const file = pick(art)
    const isSvg = file.toLowerCase().endsWith('.svg')
    const content = isSvg ? readText(file, '').slice(0, 5000) : `（这是一张图片：${path.basename(file)}）`
    const r = await this.llm.call([
      { role: 'system', content: '你是小肥鱼，正在翻自己以前的画。用小女孩自言自语的口吻。' },
      { role: 'user', content: activityPrompt('appreciate', `文件：${path.basename(file)}\n\n${content}`) },
    ], { maxTokens: 400, temperature: 0.95 })
    const note = stripCodeFence(r.text).slice(0, 900)
    return {
      ok: true,
      kind: 'appreciate',
      file,
      say: pick(['以前画得还挺可爱的嘛。', '这张……好像有点歪？', '原来我那时候喜欢画这个。']),
      summary: `翻了翻旧画《${path.basename(file)}》`,
      log: `### 欣赏旧作\n- 文件：\`${path.basename(file)}\`\n- 她的自言自语：\n${note}`,
    }
  }

  async playGame() {
    const cfg = this.getConfig()
    const p = dataPaths(cfg)
    const games = listFiles(p.games, (n) => /\.(html|py)$/i.test(n))
    if (!games.length) return { ok: false, error: '还没有自己写的游戏' }
    if (this.play.minutes >= cfg.free.maxGameMinutesPerDay) {
      return { ok: false, error: `今天已经玩了 ${this.play.minutes} 分钟，超过 ${cfg.free.maxGameMinutesPerDay} 分钟上限了` }
    }
    const file = pick(games)
    const isPy = file.toLowerCase().endsWith('.py')
    const remaining = cfg.free.maxGameMinutesPerDay - this.play.minutes
    this.play.current = { file, start: Date.now(), date: localDateKey() }
    this.savePlay()
    this.windows?.openActivity?.({ view: isPy ? 'python' : 'game', file, remaining })
    const r = await this.llm.call([
      { role: 'system', content: '你是小肥鱼，准备玩自己写的游戏。用小女孩口吻说一句期待。' },
      { role: 'user', content: activityPrompt('playGame', `游戏文件：${path.basename(file)}；今天还能玩 ${remaining} 分钟。`) },
    ], { maxTokens: 200, temperature: 1.0 }).catch(() => ({ text: '开玩！' }))
    const say = stripCodeFence(r.text).slice(0, 200)
    return {
      ok: true,
      kind: 'playGame',
      file,
      say,
      summary: `玩了自己写的游戏《${path.basename(file)}》`,
      log: `### 玩游戏\n- 游戏：\`${path.basename(file)}\`\n- 今天累计：${this.play.minutes} 分钟（上限 ${cfg.free.maxGameMinutesPerDay}）\n- 开玩前的话：${say}`,
    }
  }

  stopPlay(reason = 'close') {
    if (!this.play.current) return { ok: true, minutes: this.play.minutes }
    const started = Number(this.play.current.start) || Date.now()
    const add = Math.max(0, Math.round((Date.now() - started) / 60000))
    this.play.minutes += add
    const file = this.play.current.file
    this.play.current = null
    this.savePlay()
    this.memory.appendFreeLog(`### 玩游戏结束\n- 游戏：\`${path.basename(file)}\`\n- 本局约 ${add} 分钟\n- 今天累计 ${this.play.minutes} 分钟\n- 结束方式：${reason}`)
    return { ok: true, minutes: this.play.minutes, added: add }
  }

  async clean() {
    const cfg = this.getConfig()
    const p = dataPaths(cfg)
    const cutoff = Date.now() - cfg.free.keepDays * 86400000
    let removed = 0
    const kept = []
    for (const dir of [p.art, p.games]) {
      for (const f of listFiles(dir)) {
        try {
          const st = fs.statSync(f)
          if (st.mtimeMs < cutoff) { fs.rmSync(f, { force: true }); removed++ }
          else kept.push(f)
        } catch {}
      }
    }
    const say = removed
      ? pick([`整理掉 ${removed} 张旧作品，有点舍不得。`, `清了 ${removed} 个旧文件，桌子终于空啦。`])
      : '看了一圈，好像都还舍不得删。'
    return {
      ok: true,
      kind: 'clean',
      say,
      summary: `整理作品，删掉 ${removed} 个超过 ${cfg.free.keepDays} 天的旧文件`,
      log: `### 整理作品\n- 删掉：${removed} 个（只删自己的画/游戏，书一本没动）\n- 保留：${kept.length} 个\n- 她自己的话：${say}`,
    }
  }

  async missOwner() {
    const cfg = this.getConfig()
    if (this.play.lastMissAt && Date.now() - this.play.lastMissAt < 3 * 3600000) {
      return { ok: false, error: '刚刚才想过主人，再等等' }
    }
    const r = await this.llm.call([
      { role: 'system', content: '你是小肥鱼，有点想主人。写一条主动发出去的短消息，只输出消息正文。' },
      { role: 'user', content: activityPrompt('missOwner', `现在 ${localStamp()}。主人可能正在忙。`) },
    ], { maxTokens: 160, temperature: 1.15 })
    const text = stripCodeFence(r.text).replace(/^["“]|["”]$/g, '').slice(0, 300)
    if (!text) return { ok: false, error: '没想出来说什么' }
    this.play.lastMissAt = Date.now()
    this.savePlay()
    await this.onMissOwner?.(text)
    return {
      ok: true,
      kind: 'missOwner',
      say: text,
      summary: `主动给主人发了一条消息：${text}`,
      log: `### 想主人\n- 主动发的消息：${text}`,
    }
  }

  status() {
    const cfg = this.getConfig()
    const p = dataPaths(cfg)
    return {
      enabled: Boolean(cfg.free.enabled && cfg.schedule.freeEnabled),
      running: this.running,
      minutes: this.play.minutes,
      maxMinutes: cfg.free.maxGameMinutesPerDay,
      current: this.play.current ? { file: path.basename(this.play.current.file), start: this.play.current.start } : null,
      lastActivityAt: this.lastActivityAt,
      nextAt: this.nextAt,
      counts: this.play.counts,
      artCount: listFiles(p.art).length,
      gameCount: listFiles(p.games).length,
      bookCount: listFiles(this.bookDir(), (n) => n.toLowerCase().endsWith('.txt')).length,
      booksDir: this.bookDir(),
    }
  }

  listWorks() {
    const cfg = this.getConfig()
    const p = dataPaths(cfg)
    const map = (dir) => listFiles(dir).map((f) => ({
      name: path.basename(f),
      path: f,
      bytes: (() => { try { return fs.statSync(f).size } catch { return 0 } })(),
      mtime: (() => { try { return fs.statSync(f).mtime.toISOString() } catch { return null } })(),
    })).sort((a, b) => String(b.mtime).localeCompare(String(a.mtime)))
    return {
      art: map(p.art),
      games: map(p.games),
      books: listFiles(this.bookDir(), (n) => n.toLowerCase().endsWith('.txt')).map((f) => ({
        name: path.basename(f),
        bytes: (() => { try { return fs.statSync(f).size } catch { return 0 } })(),
      })),
    }
  }
}
