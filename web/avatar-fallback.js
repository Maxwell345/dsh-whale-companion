(function () {
  const ASSETS = '/dsh-whale/static/pet/assets'
  const OUTFIT_SRC = {
    maid: `${ASSETS}/maid.png`,
    knit: `${ASSETS}/knit.webp`,
    winter: `${ASSETS}/winter.png`,
  }

  class FallbackAvatar {
    constructor() {
      this.container = null
      this.img = null
      this.fx = null
      this.outfit = 'maid'
      this.timers = new Set()
      this.ready = false
    }

    init(container, opts = {}) {
      this.container = container
      container.innerHTML = ''
      const shadow = document.createElement('div')
      shadow.className = 'wa-shadow'
      const img = document.createElement('img')
      img.alt = '小肥鱼'
      img.draggable = false
      const blush = document.createElement('div')
      blush.className = 'wa-blush'
      const fx = document.createElement('div')
      fx.className = 'particles'
      fx.style.position = 'absolute'
      fx.style.inset = '0'
      fx.style.pointerEvents = 'none'
      container.appendChild(shadow)
      container.appendChild(img)
      container.appendChild(blush)
      container.appendChild(fx)
      this.img = img
      this.fx = fx
      this.outfit = opts.outfit || 'maid'
      this.setOutfit(this.outfit)
      img.addEventListener('load', () => { this.ready = true })
      return this
    }

    setOutfit(outfit) {
      if (!OUTFIT_SRC[outfit]) return
      this.outfit = outfit
      if (this.img) this.img.src = OUTFIT_SRC[outfit]
    }

    setExpression(name) {
      if (!this.container) return
      const map = { happy: 'wa-happy', sad: 'wa-sleepy', shy: 'wa-shy', pout: 'wa-pout', sleepy: 'wa-sleepy' }
      if (map[name]) this.play(map[name].replace('wa-', ''))
    }

    setSpeaking(on) {
      this.container?.classList.toggle('wa-speaking', Boolean(on))
    }

    clear() {
      if (!this.container) return
      for (const cls of [...this.container.classList]) {
        if (cls.startsWith('wa-') && cls !== 'wa-speaking') this.container.classList.remove(cls)
      }
    }

    play(action) {
      if (!this.container) return
      const cls = `wa-${action}`
      this.clear()
      // Force a reflow so the same action can replay immediately.
      void this.container.offsetWidth
      this.container.classList.add(cls)
      const t = setTimeout(() => this.container.classList.remove(cls), action === 'sleepy' ? 6000 : 1100)
      this.timers.add(t)
      this.effects(action)
    }

    effects(action) {
      if (!this.fx) return
      if (action === 'spray') {
        for (let i = 0; i < 12; i++) {
          const d = document.createElement('i')
          d.className = 'drop'
          d.style.left = `${38 + Math.random() * 28}%`
          d.style.top = `${20 + Math.random() * 12}%`
          d.style.setProperty('--dx', `${-30 - Math.random() * 70}px`)
          d.style.setProperty('--dy', `${20 + Math.random() * 70}px`)
          d.style.animationDelay = `${i * 25}ms`
          this.fx.appendChild(d)
          setTimeout(() => d.remove(), 1400)
        }
      } else if (action === 'heart') {
        this.float(['💙', '💗', '♡'], 5)
      } else if (action === 'happy' || action === 'dance' || action === 'jump') {
        this.float(['✨', '♪', '✦'], 4)
      } else if (action === 'pout') {
        this.float(['💢', '…'], 2)
      } else if (action === 'ear') {
        this.float(['!', '？'], 2)
      } else if (action === 'tail') {
        this.float(['💧', '…'], 2)
      } else if (action === 'shy') {
        this.float(['♡', '…'], 2)
      }
    }

    float(chars, count) {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span')
        el.className = 'particle'
        el.textContent = chars[i % chars.length]
        el.style.left = `${20 + Math.random() * 60}%`
        el.style.top = `${28 + Math.random() * 30}%`
        el.style.animationDelay = `${i * 90}ms`
        this.fx.appendChild(el)
        setTimeout(() => el.remove(), 1600)
      }
    }

    destroy() {
      for (const t of this.timers) clearTimeout(t)
      this.timers.clear()
      if (this.container) this.container.innerHTML = ''
    }
  }

  if (!window.WhaleAvatar) window.WhaleAvatar = new FallbackAvatar()
})()
