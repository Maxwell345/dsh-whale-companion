(function () {
  'use strict'
  if (window.WhaleAvatar) return
  var probe = document.createElement('canvas')
  try { if (!probe.getContext('2d')) return } catch (_) { return }
  var ROOT = '/dsh-whale/static/pet/assets/live2d/'
  var OUTFITS = ['maid', 'knit', 'winter']
  var FALLBACK = { maid: 'maid.png', knit: 'knit.webp', winter: 'winter.png' }

  var DURATIONS = { idle: Infinity, happy: 1600, shy: 2400, spin: 1500, spray: 2200, tail: 1700, ear: 1600, pout: 2600, sleepy: 6200, dance: 4200, jump: 1400, heart: 2800, eat: 3800, nod: 1400, shake: 1500, sit: 4200, ignore: 3200 }
  var ACTION_EXPRESSION = { happy: 'happy', shy: 'shy', spray: 'surprised', tail: 'surprised', ear: 'pout', pout: 'pout', sleepy: 'sleepy', dance: 'happy', jump: 'happy', heart: 'shy', eat: 'eat', ignore: 'pout' }
  var POSE_KEYS = ['x', 'y', 'r', 'sx', 'sy', 'head', 'headY', 'tail', 'ears', 'hair', 'armL', 'armR']
  var PI = Math.PI
  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }

  function imageFile(src, signal) {
    return new Promise(function (resolve, reject) {
      if (signal.aborted) { reject(new Error('cancelled')); return }
      var image = new Image()
      var timer = setTimeout(function () { finish(new Error('image timeout')) }, 6000)
      function finish(error) {
        clearTimeout(timer)
        image.onload = image.onerror = null
        signal.removeEventListener('abort', abort)
        if (error) { image.src = ''; reject(error) } else resolve(image)
      }
      function abort() { finish(new Error('cancelled')) }
      image.onload = function () { finish() }
      image.onerror = function () { finish(new Error('image unavailable')) }
      signal.addEventListener('abort', abort, { once: true })
      image.src = src
    })
  }

  class SpriteAvatar {
    constructor() {
      this.container = null
      this.canvas = null
      this.ctx = null
      this.rig = null
      this.outfit = 'maid'
      this.action = 'idle'
      this.expression = 'neutral'
      this.speaking = false
      this._serial = 0
      this._outfitSerial = 0
      this._raf = 0
      this._cache = new Map()
      this._controllers = new Set()
      this._listeners = []
      this._pose = { x: 0, y: 0, r: 0, sx: 1, sy: 1, head: 0, headY: 0, tail: 0, ears: 0, hair: 0, armL: 0, armR: 0, eye: 1, mouth: 0 }
      this._from = Object.assign({}, this._pose)
      this._tick = this._tick.bind(this)
      this._resize = this._resize.bind(this)
    }

    init(container, opts) {
      this.destroy()
      if (!container || !container.appendChild) return this
      opts = opts || {}
      this.container = container
      this._serial++
      this._started = performance.now()
      this._actionAt = this._started
      this._lastFrame = 0
      this._frames = 0
      this._statsAt = this._started
      this._fps = opts.fps === 60 ? 60 : opts.fps === 30 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 30 : 60
      this._blendAt = 0
      this._expressionAt = this._started
      this.action = 'idle'
      this.expression = 'neutral'
      this.speaking = false
      container.replaceChildren()
      container.classList.add('whale-sprite-host')
      container.dataset.avatarRenderer = 'canvas2d-sprite'
      container.dataset.avatarState = 'loading'
      container.dataset.avatarAction = 'idle'
      var canvas = document.createElement('canvas')
      canvas.className = 'whale-sprite-canvas'
      canvas.setAttribute('role', 'img')
      canvas.setAttribute('aria-label', '小肥鱼，经典女仆装')
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
      container.appendChild(canvas)
      this.canvas = canvas
      try { this.ctx = canvas.getContext('2d', { alpha: true }) } catch (_) { this.ctx = null }
      if (!document.getElementById('whale-avatar-css')) {
        var link = document.createElement('link')
        link.id = 'whale-avatar-css'
        link.rel = 'stylesheet'
        link.href = '/dsh-whale/static/pet/live2d/avatar.css'
        document.head.appendChild(link)
      }
      this._motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
      this._reduced = Boolean(this._motionQuery && this._motionQuery.matches)
      this._listen(document, 'visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(this._raf); this._raf = 0 }
        else { this._lastFrame = 0; this._schedule() }
      })
      this._listen(window, 'resize', this._resize)
      this._listen(window, 'pagehide', () => this.destroy())
      if (this._motionQuery && this._motionQuery.addEventListener) this._listen(this._motionQuery, 'change', (event) => { this._reduced = event.matches })
      this._listen(canvas, 'contextlost', (event) => this._lost(event))
      this._listen(canvas, 'contextrestored', () => this._restored())
      this._listen(canvas, 'webglcontextlost', (event) => this._lost(event))
      this._listen(canvas, 'webglcontextrestored', () => this._restored())
      if (window.ResizeObserver) {
        this._observer = new ResizeObserver(this._resize)
        this._observer.observe(container)
      }
      this._resize()
      if (!this.ctx) {
        this.outfit = OUTFITS.includes(opts.outfit) ? opts.outfit : 'maid'
        this._contextLost = true
        this._fallback(this.outfit)
        this.container.dataset.avatarState = 'context-unavailable-fallback'
        this.ready = Promise.resolve(false)
        return this
      }
      this.ready = this.setOutfit(OUTFITS.includes(opts.outfit) ? opts.outfit : 'maid')
      this._schedule()
      return this
    }

    _listen(target, name, fn) {
      target.addEventListener(name, fn)
      this._listeners.push([target, name, fn])
    }

    async _load(outfit) {
      if (this._cache.has(outfit)) return this._cache.get(outfit)
      var controller = new AbortController()
      this._controllers.add(controller)
      var timeout = setTimeout(() => controller.abort(), 6500)
      var promise = (async () => {
        var folder = ROOT + outfit + '/'
        var response = await fetch(folder + 'rig.json', { signal: controller.signal, credentials: 'same-origin' })
        if (!response.ok) throw new Error('rig unavailable')
        var data = await response.json()
        if (!(data.width > 0 && data.width <= 4096 && data.height > 0 && data.height <= 4096) || !Array.isArray(data.layers) || !data.layers.length || data.layers.length > 64) throw new Error('invalid sprite rig')
        var layers = await Promise.all(data.layers.map(async function (layer, index) {
          if (typeof layer.src !== 'string' || !/^[a-zA-Z0-9_./-]+\.(png|webp)$/.test(layer.src) || layer.src.includes('..') || layer.src.startsWith('/')) throw new Error('invalid local texture path')
          var image = await imageFile(folder + layer.src, controller.signal)
          var pivot = layer.pivot || [data.width / 2, data.height / 2]
          return { id: String(layer.id || 'body'), image: image, x: Number(layer.x) || 0, y: Number(layer.y) || 0, w: Number(layer.width) || image.naturalWidth, h: Number(layer.height) || image.naturalHeight, px: Number(pivot[0]) || 0, py: Number(pivot[1]) || 0, z: Number.isFinite(layer.z) ? layer.z : index }
        }))
        layers.sort(function (a, b) { return a.z - b.z })
        return { width: data.width, height: data.height, bounds: data.bounds || [0, 0, data.width, data.height], layers: layers, face: data.face || null, maxAngles: data.maxAngles || {}, articulated: data.articulation === 'overlap' }
      })()
      this._cache.set(outfit, promise)
      try { return await promise }
      catch (error) {
        controller.abort()
        if (this._cache.get(outfit) === promise) this._cache.delete(outfit)
        throw error
      }
      finally { clearTimeout(timeout); this._controllers.delete(controller) }
    }

    async setOutfit(outfit) {
      if (!OUTFITS.includes(outfit) || !this.container) return false
      if (this.outfit === outfit && this.rig && this.container.dataset.avatarState === 'ready') return true
      this.outfit = outfit
      var serial = this._serial
      var request = ++this._outfitSerial
      try {
        var rig = await this._load(outfit)
        if (serial !== this._serial || request !== this._outfitSerial || !this.container) return false
        if (this.rig && this.rig !== rig && this.canvas && !this._contextLost) {
          if (this._snapshot) { this._snapshot.width = 1; this._snapshot.height = 1 }
          this._snapshot = document.createElement('canvas')
          this._snapshot.width = this.canvas.width
          this._snapshot.height = this.canvas.height
          this._snapshot.getContext('2d').drawImage(this.canvas, 0, 0)
          this._fadeAt = performance.now()
        }
        this.rig = rig
        this.container.dataset.avatarOutfit = outfit
        this.container.dataset.avatarState = 'ready'
        this.canvas.setAttribute('aria-label', '小肥鱼，' + ({ maid: '经典女仆装', knit: '针织帽日常装', winter: '鲸鱼冬装' })[outfit])
        if (this._contextLost) {
          this._fallback(outfit)
          this.container.dataset.avatarState = 'context-lost-fallback'
          return true
        }
        this._removeFallback()
        this._resize()
        this._schedule()
        return true
      } catch (_) {
        if (serial !== this._serial || request !== this._outfitSerial || !this.container) return false
        if (!this.rig) this._fallback(outfit)
        else this.container.dataset.avatarState = 'outfit-unavailable'
        return false
      }
    }

    play(action) {
      if (!this.container) return
      if (Array.isArray(action)) action = action.length ? action[action.length - 1] : 'idle'
      action = typeof action === 'string' && Object.prototype.hasOwnProperty.call(DURATIONS, action) ? action : 'idle'
      for (var i = 0; i < POSE_KEYS.length; i++) this._from[POSE_KEYS[i]] = this._pose[POSE_KEYS[i]]
      this.action = action
      this._actionAt = performance.now()
      this._blendAt = this._actionAt
      this.container.dataset.avatarAction = action
      this.container.dataset.avatarReplay = String((Number(this.container.dataset.avatarReplay) || 0) + 1)
      this._schedule()
    }

    setExpression(name) {
      this.expression = ['neutral', 'happy', 'shy', 'pout', 'sleepy', 'surprised', 'eat'].includes(name) ? name : 'neutral'
      if (this.container) this.container.dataset.avatarExpression = this.expression
    }

    setSpeaking(on) {
      var wasSpeaking = this.speaking
      this.speaking = Boolean(on)
      if (wasSpeaking && !this.speaking) this.play('idle')
      if (this.container) this.container.classList.toggle('whale-speaking', this.speaking)
    }

    _resize() {
      if (!this.container || !this.canvas) return
      var box = this.container.getBoundingClientRect()
      this._width = Math.max(1, box.width)
      this._height = Math.max(1, box.height)
      this._dpr = Math.min(window.devicePixelRatio || 1, 2)
      var width = Math.round(this._width * this._dpr)
      var height = Math.round(this._height * this._dpr)
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width
        this.canvas.height = height
      }
      if (this.rig) {
        var bounds = this.rig.bounds
        this._scale = Math.max(0.01, Math.min((this._width - 18) / bounds[2], (this._height - 27) / bounds[3]))
        this._originX = (this._width - bounds[2] * this._scale) / 2 - bounds[0] * this._scale
        this._originY = this._height - 2 - (bounds[1] + bounds[3]) * this._scale
      }
      this._schedule()
    }

    _schedule() {
      if (this.container && !document.hidden && !this._raf && !this._contextLost && !this._fallbackImage) this._raf = requestAnimationFrame(this._tick)
    }

    _tick(now) {
      this._raf = 0
      if (!this.container || this._contextLost || document.hidden) return
      var interval = 1000 / this._fps
      var elapsed = now - this._lastFrame
      if (elapsed >= interval) {
        this._lastFrame = now - (elapsed % interval)
        if (this.rig && this.ctx) {
          try { this._draw(now) }
          catch (_) { this._fallback(this.outfit); this._contextLost = true; return }
          this._frames++
          if (now - this._statsAt >= 1000) {
            this.container.dataset.avatarFps = String(Math.round(this._frames * 1000 / (now - this._statsAt)))
            this._frames = 0
            this._statsAt = now
          }
        }
      }
      this._schedule()
    }

    _sample(now) {
      var p = this._pose
      var t = (now - this._started) / 1000
      var elapsed = now - this._actionAt
      var duration = DURATIONS[this.action]
      if (this.action !== 'idle' && elapsed >= duration) {
        this.action = 'idle'
        this.container.dataset.avatarAction = 'idle'
        this._actionAt = now
        elapsed = 0
      }
      var u = duration === Infinity ? 0 : Math.min(1, elapsed / duration)
      var wave = Math.sin(u * PI)
      var amount = this._reduced ? 0.18 : 1
      p.x = 0; p.y = 0; p.r = Math.sin(t * 0.95) * 0.008
      p.sx = 1 + Math.sin(t * 2.2) * 0.002
      p.sy = 1 + Math.sin(t * 2.2) * 0.003
      p.head = Math.sin(t * 1.05 + 0.3) * 0.009
      p.headY = Math.sin(t * 2.2) * 1.5
      p.tail = Math.sin(t * 2.1 + 0.5) * 0.035
      p.ears = Math.sin(t * 1.8 + 1) * 0.018
      p.hair = Math.sin(t * 1.6) * 0.009
      p.armL = Math.sin(t * 1.6 + 1) * 0.008
      p.armR = -p.armL
      p.progress = u
      p.emotion = ACTION_EXPRESSION[this.action] || this.expression
      var swing = Math.sin(u * PI * 6)
      switch (this.action) {
        case 'happy':
          p.y = -Math.max(0, Math.sin(u * PI * 2)) * 42
          p.sy += wave * 0.014; p.tail += swing * 0.15
          p.armL -= wave * 0.16; p.armR += wave * 0.16
          break
        case 'shy':
          p.sy -= wave * 0.035; p.head += wave * 0.045
          p.ears += swing * 0.055; p.armL += wave * 0.18; p.armR -= wave * 0.18
          p.tail -= wave * 0.13
          break
        case 'spin':
          p.sx *= 0.16 + Math.abs(Math.cos(u * PI * 2)) * 0.84
          p.x = Math.sin(u * PI * 2) * 15; p.y = -wave * 16
          p.r += Math.sin(u * PI * 2) * 0.035; p.hair += swing * 0.035
          p.armL -= wave * 0.12; p.armR += wave * 0.12
          break
        case 'spray':
          p.head -= wave * 0.055; p.headY -= wave * 10
          p.sy -= Math.max(0, Math.sin(u * PI * 2)) * 0.025
          p.ears += Math.sin(u * PI * 10) * 0.04 * wave
          break
        case 'tail':
          p.tail += Math.sin(u * PI * 10) * (1 - u) * 0.5
          p.r += Math.sin(u * PI * 12) * (1 - u) * 0.025
          p.y -= Math.max(0, Math.sin(u * PI * 3)) * 24
          p.head += wave * 0.07; p.hair += swing * 0.025
          break
        case 'ear':
          p.ears += Math.sin(u * PI * 12) * (1 - u) * 0.3
          p.x += wave * 22; p.head += wave * 0.09; p.r += wave * 0.025
          p.armL -= wave * 0.18
          break
        case 'pout':
          p.head -= wave * 0.065; p.headY += wave * 6
          p.armL += wave * 0.21; p.armR -= wave * 0.21
          p.tail += Math.sin(u * PI * 8) * wave * 0.07
          break
        case 'sleepy':
          p.head += wave * 0.04; p.headY += wave * (10 + Math.sin(u * PI * 5) * 7)
          p.sy -= wave * 0.03; p.armL -= wave * 0.07; p.ears -= wave * 0.08
          break
        case 'dance':
          p.r += swing * 0.035; p.x += swing * 15
          p.y -= Math.abs(Math.sin(u * PI * 6)) * 14
          p.armL += swing * 0.2; p.armR += swing * 0.2
          p.tail += Math.sin(u * PI * 12) * 0.15; p.hair -= swing * 0.018
          break
        case 'jump':
          p.y -= Math.pow(Math.sin(u * PI), 1.7) * 66
          p.sy += Math.sin(u * PI * 3) * 0.045
          p.sx -= Math.sin(u * PI * 3) * 0.018
          p.armL -= wave * 0.22; p.armR += wave * 0.22
          break
        case 'heart':
          p.armL += wave * 0.35; p.armR -= wave * 0.35
          p.head += wave * 0.025; p.sy -= wave * 0.015
          p.tail += swing * 0.07
          break
        case 'eat':
          p.armL += wave * 0.25; p.armR -= wave * 0.27
          p.headY += Math.abs(Math.sin(u * PI * 10)) * 7 * wave
          p.head += Math.sin(u * PI * 10) * 0.015 * wave
          p.tail += Math.sin(u * PI * 8) * 0.08 * wave
          break
        case 'nod':
          p.headY += Math.sin(u * PI * 6) * 15 * wave
          p.sy -= Math.max(0, Math.sin(u * PI * 6)) * 0.013
          break
        case 'shake':
          p.head += Math.sin(u * PI * 6) * 0.08 * wave
          p.x += Math.sin(u * PI * 6) * 7 * wave
          p.hair -= swing * 0.025; p.ears += swing * 0.07
          break
        case 'sit':
          p.sy -= wave * 0.1; p.sx += wave * 0.035
          p.headY += wave * 9; p.armL -= wave * 0.1; p.armR += wave * 0.1
          p.tail += wave * 0.14
          break
        case 'ignore':
          p.x -= wave * 15; p.head -= wave * 0.095
          p.r -= wave * 0.018; p.armL += wave * 0.14; p.armR -= wave * 0.14
          p.ears -= wave * 0.05
          break
      }
      for (var i = 0; i < POSE_KEYS.length; i++) {
        var key = POSE_KEYS[i]
        if (key === 'sx' || key === 'sy') p[key] = 1 + (p[key] - 1) * amount
        else p[key] *= amount
        if (this._blendAt && now - this._blendAt < 130) p[key] = this._from[key] + (p[key] - this._from[key]) * smooth((now - this._blendAt) / 130)
      }
      var blink = (now - this._started) % 4700
      p.eye = blink > 4230 && blink < 4390 ? Math.abs(blink - 4310) / 80 : 1
      if (p.emotion === 'happy') p.eye = 0
      if (p.emotion === 'sleepy') p.eye *= 0.35 + Math.sin(t * 2.4) * 0.18
      if (p.emotion === 'pout') p.eye *= 0.74
      if (p.emotion === 'shy') p.eye *= 0.9
      p.mouth = this.speaking ? 0.22 + (Math.sin(t * 15) * 0.5 + 0.5) * 0.43 : 0
      if (p.emotion === 'surprised') p.mouth = Math.max(p.mouth, 0.48)
      if (this.action === 'eat') p.mouth = Math.abs(Math.sin(u * PI * 10)) * 0.55
      if (this.action === 'sleepy') p.mouth = Math.max(p.mouth, Math.max(0, Math.sin((u - 0.12) * PI * 2.4)) * 0.62)
    }

    _draw(now) {
      var ctx = this.ctx
      var t = (now - this._started) / 1000
      this._sample(now)
      var p = this._pose
      var bounds = this.rig.bounds
      var cx = this.rig.width / 2
      var cy = bounds[1] + bounds[3]
      ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0)
      ctx.clearRect(0, 0, this._width, this._height)
      var fade = this._snapshot ? smooth((now - this._fadeAt) / 180) : 1
      if (this._snapshot) {
        ctx.globalAlpha = 1 - fade
        ctx.drawImage(this._snapshot, 0, 0, this._width, this._height)
        if (fade === 1) { this._snapshot.width = 1; this._snapshot.height = 1; this._snapshot = null }
      }
      ctx.globalAlpha = fade
      ctx.translate(this._originX, this._originY)
      ctx.scale(this._scale, this._scale)
      ctx.translate(cx + p.x, cy + p.y + (this.rig.articulated ? 0 : p.headY * 0.3))
      ctx.rotate(p.r + (this.rig.articulated ? 0 : p.head * 0.25))
      ctx.scale(p.sx, p.sy)
      ctx.translate(-cx, -cy)
      for (var i = 0; i < this.rig.layers.length; i++) this._drawLayer(this.rig.layers[i])
      this._effects(t)
      ctx.globalAlpha = 1
    }

    _headTransform(ctx) {
      if (!this.rig.articulated) return
      var face = this.rig.face
      var x = face && face.pivot ? face.pivot[0] : this.rig.width * 0.5
      var y = face && face.pivot ? face.pivot[1] : this.rig.height * 0.42
      var headLimit = Number(this.rig.maxAngles.head) || 0.08
      var headAngle = Math.max(-headLimit, Math.min(headLimit, this._pose.head))
      var headY = Math.max(-3, Math.min(3, this._pose.headY))
      ctx.translate(x, y + headY)
      ctx.rotate(headAngle)
      ctx.translate(-x, -y)
    }

    _drawLayer(layer) {
      var ctx = this.ctx
      var p = this._pose
      var id = layer.id
      var eye = id === 'eye-l' ? this.rig.face && this.rig.face.eyeL : id === 'eye-r' ? this.rig.face && this.rig.face.eyeR : null
      ctx.save()
      if (id === 'face' || id === 'mouth' || id.startsWith('eye') || id === 'hair-front' || id.startsWith('ear') || id === 'accessory' || id === 'ahoge') this._headTransform(ctx)
      var angle = 0
      if (id === 'tail') angle = p.tail
      else if (id.startsWith('hair') || id === 'ahoge') angle = p.hair
      else if (id === 'ear-l') angle = p.ears
      else if (id === 'ear-r') angle = -p.ears
      else if (id === 'arm-l') angle = p.armL
      else if (id === 'arm-r') angle = p.armR
      var limit = this.rig.articulated ? (id.startsWith('arm') ? (Number(this.rig.maxAngles.arm) || 0.08) : id.startsWith('hair') || id === 'ahoge' ? (Number(this.rig.maxAngles.hair) || 0.009) : id.startsWith('ear') ? (Number(this.rig.maxAngles.ear) || 0.14) : (Number(this.rig.maxAngles.tail) || 0.55)) : (id === 'tail' ? 0.008 : id.startsWith('ear') ? 0.005 : 0)
      angle = Math.max(-limit, Math.min(limit, angle))
      ctx.translate(layer.px, layer.py)
      ctx.rotate(angle)
      ctx.translate(-layer.px, -layer.py)
      if (eye) {
        var open = Math.max(0, Math.min(1, p.eye))
        // The eye cutout includes surrounding skin and lashes; rescaling that
        // raster creates a visible second edge. Blink by switching to the clean
        // closed-eye drawing, and keep the open raster at its original size.
        if (open < 0.55) this._closedEye(eye, p.emotion === 'happy')
        else ctx.drawImage(layer.image, layer.x, layer.y, layer.w, layer.h)
      } else if (id === 'mouth' && this.rig.face && this.rig.face.mouth) this._mouth(layer)
      else ctx.drawImage(layer.image, layer.x, layer.y, layer.w, layer.h)
      if (id === 'face') this._blush()
      ctx.restore()
    }

    _closedEye(eye, happy) {
      var ctx = this.ctx
      var x = eye[0], y = eye[1], w = eye[2], h = eye[3]
      ctx.strokeStyle = '#22345c'
      ctx.lineWidth = Math.max(3, w * 0.055)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x + w * 0.12, y + h * 0.58)
      ctx.quadraticCurveTo(x + w * 0.5, y + h * (happy ? 0.2 : 0.83), x + w * 0.88, y + h * 0.58)
      ctx.stroke()
    }

    _mouth(layer) {
      var ctx = this.ctx
      var p = this._pose
      var mouth = this.rig.face.mouth
      var x = mouth[0] + mouth[2] / 2, y = mouth[1] + mouth[3] / 2
      var w = mouth[2], h = mouth[3]
      if (p.mouth > 0.05) {
        ctx.fillStyle = '#8b4f62'
        ctx.strokeStyle = '#633f53'
        ctx.lineWidth = Math.max(2, w * 0.06)
        ctx.beginPath()
        ctx.ellipse(x, y, w * (p.emotion === 'surprised' ? 0.24 : 0.36), h * (0.2 + p.mouth * 0.55), 0, 0, PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#ffb7cf'
        ctx.beginPath(); ctx.ellipse(x, y + h * p.mouth * 0.25, w * 0.19, h * p.mouth * 0.17, 0, 0, PI * 2); ctx.fill()
      } else if (p.emotion === 'pout') {
        ctx.strokeStyle = '#754859'; ctx.lineWidth = Math.max(2.5, w * 0.07); ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(x - w * 0.22, y + h * 0.12); ctx.quadraticCurveTo(x, y - h * 0.16, x + w * 0.22, y + h * 0.12); ctx.stroke()
      } else if (p.emotion === 'happy' || p.emotion === 'shy' || p.emotion === 'eat') {
        ctx.strokeStyle = '#754859'; ctx.lineWidth = Math.max(2.5, w * 0.07); ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(x - w * 0.28, y); ctx.quadraticCurveTo(x, y + h * 0.34, x + w * 0.28, y); ctx.stroke()
      } else ctx.drawImage(layer.image, layer.x, layer.y, layer.w, layer.h)
    }

    _blush() {
      var face = this.rig.face
      if (!face || !face.cheekL || !face.cheekR) return
      var strength = this._pose.emotion === 'shy' ? 0.3 : this._pose.emotion === 'pout' ? 0.18 : 0
      if (!strength) return
      var ctx = this.ctx
      ctx.fillStyle = strength === 0.3 ? 'rgba(255,135,177,.3)' : 'rgba(255,135,177,.18)'
      var left = face.cheekL, right = face.cheekR
      ctx.beginPath(); ctx.ellipse(left[0], left[1], left[2], left[3], 0, 0, PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(right[0], right[1], right[2], right[3], 0, 0, PI * 2); ctx.fill()
    }

    _star(x, y, size, rotation) {
      var ctx = this.ctx
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation)
      ctx.beginPath(); ctx.moveTo(0, -size); ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0); ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size); ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0); ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size); ctx.fill()
      ctx.restore()
    }

    _heart(x, y, size) {
      var ctx = this.ctx
      ctx.beginPath(); ctx.moveTo(x, y + size * 0.7)
      ctx.bezierCurveTo(x - size * 1.6, y - size * 0.3, x - size * 0.6, y - size * 1.4, x, y - size * 0.5)
      ctx.bezierCurveTo(x + size * 0.6, y - size * 1.4, x + size * 1.6, y - size * 0.3, x, y + size * 0.7)
      ctx.fill()
    }

    _effects(t) {
      var ctx = this.ctx
      var p = this._pose
      var bounds = this.rig.bounds
      var x = this.rig.width / 2
      var y = bounds[1]
      var h = bounds[3]
      var w = bounds[2]
      var u = p.progress
      var wave = Math.sin(u * PI)
      ctx.save()
      if (this.action === 'spray') {
        ctx.fillStyle = '#8fd0ff'; ctx.strokeStyle = '#5aa8ff'; ctx.lineWidth = 3
        for (var i = 0; i < 14; i++) {
          var phase = Math.max(0, Math.min(1, (u - i * 0.018) * 1.8))
          if (phase <= 0 || phase >= 1) continue
          var side = i % 2 ? 1 : -1
          var dx = side * (22 + (i % 4) * 22) * phase
          var dy = -Math.sin(phase * PI) * (55 + i % 3 * 17) + phase * 32
          ctx.globalAlpha = Math.sin(phase * PI)
          ctx.beginPath(); ctx.ellipse(x + dx, y + 17 + dy, 5 + i % 3, 9 + i % 3, side * 0.4, 0, PI * 2); ctx.fill(); ctx.stroke()
        }
      }
      if (this.action === 'heart' || this.action === 'shy') {
        ctx.fillStyle = '#ffb7cf'
        for (var i = 0; i < 4; i++) {
          var phase = (u * 1.3 + i * 0.22) % 1
          ctx.globalAlpha = Math.sin(phase * PI) * wave
          this._heart(x + Math.sin(i * 2.4) * w * 0.35, y + h * (0.6 - phase * 0.3), 12 + i * 2)
        }
        if (this.action === 'heart') { ctx.globalAlpha = wave; this._heart(x, y + h * 0.64, 28 + Math.sin(t * 7) * 3) }
      }
      if (this.action === 'happy' || this.action === 'jump' || this.action === 'dance' || this.action === 'tail') {
        ctx.fillStyle = this.action === 'tail' ? '#8fd0ff' : '#ffd479'
        for (var i = 0; i < 5; i++) {
          ctx.globalAlpha = wave * (0.5 + Math.sin(t * 4 + i) * 0.3)
          this._star(x + Math.sin(i * 2.3) * w * 0.43, y + h * (0.3 + (i % 3) * 0.16), 9 + (i % 2) * 5, t * 0.6)
        }
      }
      if (p.emotion === 'eat' && this.action !== 'eat' && this.rig.face) {
        ctx.save()
        this._headTransform(ctx)
        ctx.fillStyle = '#ffd479'
        var hungryLeft = this.rig.face.eyeL
        var hungryRight = this.rig.face.eyeR
        if (hungryLeft) this._star(hungryLeft[0] + hungryLeft[2] * 0.72, hungryLeft[1] + hungryLeft[3] * 0.45, 10, t * 0.3)
        if (hungryRight) this._star(hungryRight[0] + hungryRight[2] * 0.4, hungryRight[1] + hungryRight[3] * 0.45, 10, -t * 0.3)
        ctx.restore()
      }
      if (this.action === 'eat') {
        ctx.globalAlpha = wave
        var by = y + h * 0.69
        ctx.fillStyle = '#fff7ec'; ctx.strokeStyle = '#2f4a7a'; ctx.lineWidth = 5
        ctx.beginPath(); ctx.ellipse(x, by - 8, 59, 17, 0, PI, PI * 2); ctx.fill()
        ctx.fillStyle = '#8fd0ff'
        ctx.beginPath(); ctx.moveTo(x - 65, by); ctx.quadraticCurveTo(x - 54, by + 59, x, by + 57); ctx.quadraticCurveTo(x + 54, by + 59, x + 65, by); ctx.closePath(); ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#fff7ec'; ctx.beginPath(); ctx.ellipse(x, by, 65, 14, 0, 0, PI * 2); ctx.fill(); ctx.stroke()
        ctx.strokeStyle = '#b58d64'; ctx.lineWidth = 6; ctx.lineCap = 'round'
        var lift = Math.abs(Math.sin(u * PI * 10)) * 32
        ctx.beginPath(); ctx.moveTo(x + 41, by - 13 - lift); ctx.lineTo(x + 108, by - 48 - lift); ctx.moveTo(x + 43, by - 2 - lift); ctx.lineTo(x + 115, by - 37 - lift); ctx.stroke()
        ctx.fillStyle = '#ffd479'
        if (this.rig.face && this.rig.face.eyeL) { var eye = this.rig.face.eyeL; this._star(eye[0] + eye[2] * 0.72, eye[1] + eye[3] * 0.45, 12, t * 0.3) }
        if (this.rig.face && this.rig.face.eyeR) { var rightEye = this.rig.face.eyeR; this._star(rightEye[0] + rightEye[2] * 0.4, rightEye[1] + rightEye[3] * 0.45, 12, -t * 0.3) }
      }
      if (this.action === 'pout' || this.action === 'ear' || this.action === 'tail') {
        ctx.globalAlpha = wave * 0.9; ctx.strokeStyle = this.action === 'tail' ? '#ffd479' : '#ff91b4'; ctx.lineWidth = 5; ctx.lineCap = 'round'
        var ax = x + w * 0.31, ay = y + h * 0.23
        ctx.beginPath(); ctx.moveTo(ax - 17, ay - 9); ctx.lineTo(ax - 7, ay - 7); ctx.lineTo(ax - 5, ay - 19); ctx.moveTo(ax + 4, ay - 18); ctx.lineTo(ax + 7, ay - 6); ctx.lineTo(ax + 18, ay - 8); ctx.moveTo(ax - 17, ay + 4); ctx.lineTo(ax - 5, ay + 5); ctx.lineTo(ax - 7, ay + 17); ctx.moveTo(ax + 6, ay + 18); ctx.lineTo(ax + 5, ay + 5); ctx.lineTo(ax + 18, ay + 6); ctx.stroke()
      }
      ctx.restore()
    }

    _fallback(outfit) {
      if (!this.container) return
      this.container.dataset.avatarState = 'fallback'
      this.container.dataset.avatarOutfit = outfit
      if (this.canvas) this.canvas.style.visibility = 'hidden'
      if (!this._fallbackImage) {
        this._fallbackImage = document.createElement('img')
        this._fallbackImage.className = 'whale-recovery-image'
        this._fallbackImage.alt = '小肥鱼立绘（分层素材暂不可用）'
        this.container.appendChild(this._fallbackImage)
      }
      this._fallbackImage.src = '/dsh-whale/static/pet/assets/' + FALLBACK[outfit]
    }

    _removeFallback() {
      if (this._fallbackImage) { this._fallbackImage.remove(); this._fallbackImage = null }
      if (this.canvas) this.canvas.style.visibility = ''
    }

    _lost(event) {
      event.preventDefault()
      this._contextLost = true
      cancelAnimationFrame(this._raf)
      this._raf = 0
      this._fallback(this.outfit)
      if (this.container) this.container.dataset.avatarState = 'context-lost-fallback'
    }

    _restored() {
      if (!this.canvas || !this.container) return
      try { this.ctx = this.canvas.getContext('2d', { alpha: true }) } catch (_) { this.ctx = null }
      this._contextLost = !this.ctx
      if (this.ctx && this.rig) {
        this._removeFallback()
        this.container.dataset.avatarState = 'ready'
        this._lastFrame = 0
        this._schedule()
      } else if (this.ctx && !this.rig) this.ready = this.setOutfit(this.outfit)
    }

    destroy() {
      this._serial++
      this._outfitSerial++
      cancelAnimationFrame(this._raf)
      this._raf = 0
      for (var controller of this._controllers) controller.abort()
      this._controllers.clear()
      this._cache.clear()
      if (this._observer) { this._observer.disconnect(); this._observer = null }
      for (var listener of this._listeners) listener[0].removeEventListener(listener[1], listener[2])
      this._listeners.length = 0
      if (this.container) {
        this.container.replaceChildren()
        this.container.classList.remove('whale-sprite-host', 'whale-speaking')
        for (var key of Object.keys(this.container.dataset)) if (key.startsWith('avatar')) delete this.container.dataset[key]
      }
      if (this.canvas) { this.canvas.width = 1; this.canvas.height = 1 }
      if (this._snapshot) { this._snapshot.width = 1; this._snapshot.height = 1; this._snapshot = null }
      this.container = this.canvas = this.ctx = this.rig = this._fallbackImage = null
      this._contextLost = false
    }
  }
  window.WhaleAvatar = new SpriteAvatar()
})()
