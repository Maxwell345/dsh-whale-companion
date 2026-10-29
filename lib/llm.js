import { estimateMessages, sleep } from './util.js'

export class LLMError extends Error {
  constructor(message, code = 'LLM_ERROR', status = 0, detail = '') {
    super(message)
    this.name = 'LLMError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

function endpoint(baseUrl) {
  const base = String(baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '')
  if (base.endsWith('/chat/completions')) return base
  if (base.endsWith('/v1')) return `${base}/chat/completions`
  return `${base}/chat/completions`
}

export class LLMClient {
  constructor(getConfig, getApiKey, log = () => {}) {
    this.getConfig = getConfig
    this.getApiKey = getApiKey
    this.log = log
  }

  settings() {
    const cfg = this.getConfig()
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new LLMError(
        '还没有可用的 DeepSeek API Key。请在「小肥鱼 → 高级」里填写，或设置 DEEPSEEK_API_KEY 环境变量。',
        'MISSING_KEY',
      )
    }
    return { cfg, apiKey, url: endpoint(cfg.llm.baseUrl) }
  }

  body(messages, { stream = false, temperature, maxTokens } = {}) {
    const cfg = this.getConfig()
    return {
      model: cfg.llm.model || 'deepseek-chat',
      messages,
      stream,
      temperature: temperature ?? cfg.llm.temperature ?? 1.15,
      max_tokens: maxTokens ?? cfg.llm.maxTokens ?? 1000,
    }
  }

  async call(messages, { signal, temperature, maxTokens, timeoutMs } = {}) {
    const { cfg, apiKey, url } = this.settings()
    const timeout = timeoutMs ?? cfg.llm.timeoutMs ?? 120000
    const own = new AbortController()
    const onAbort = () => own.abort(signal?.reason)
    if (signal) {
      if (signal.aborted) throw new LLMError('已取消', 'ABORTED')
      signal.addEventListener('abort', onAbort, { once: true })
    }
    const timer = setTimeout(() => own.abort(new Error('timeout')), timeout)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(this.body(messages, { stream: false, temperature, maxTokens })),
        signal: own.signal,
      })
      const text = await res.text()
      if (!res.ok) {
        throw new LLMError(`DeepSeek 请求失败（HTTP ${res.status}）`, 'HTTP', res.status, text.slice(0, 800))
      }
      let json
      try { json = JSON.parse(text) } catch {
        throw new LLMError('DeepSeek 返回的不是 JSON', 'BAD_JSON', res.status, text.slice(0, 800))
      }
      const content = json?.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        throw new LLMError('DeepSeek 返回里没有内容', 'EMPTY', res.status, text.slice(0, 800))
      }
      return { text: content, usage: json.usage ?? null, raw: json }
    } catch (err) {
      if (err instanceof LLMError) throw err
      if (own.signal.aborted) {
        throw new LLMError(signal?.aborted ? '已取消' : '请求超时', signal?.aborted ? 'ABORTED' : 'TIMEOUT')
      }
      throw new LLMError(`无法连接 DeepSeek：${err?.message ?? err}`, 'NETWORK')
    } finally {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
    }
  }

  /** Async generator: yields {type:'delta', text} and finally {type:'done', text, usage}. */
  async *stream(messages, { signal, temperature, maxTokens, timeoutMs } = {}) {
    const { cfg, apiKey, url } = this.settings()
    const timeout = timeoutMs ?? cfg.llm.timeoutMs ?? 120000
    const own = new AbortController()
    const onAbort = () => own.abort(signal?.reason)
    if (signal) {
      if (signal.aborted) throw new LLMError('已取消', 'ABORTED')
      signal.addEventListener('abort', onAbort, { once: true })
    }
    const timer = setTimeout(() => own.abort(new Error('timeout')), timeout)
    let full = ''
    let usage = null
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(this.body(messages, { stream: true, temperature, maxTokens })),
        signal: own.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new LLMError(`DeepSeek 请求失败（HTTP ${res.status}）`, 'HTTP', res.status, text.slice(0, 800))
      }
      if (!res.body) throw new LLMError('DeepSeek 没有返回流', 'NO_BODY')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (readerDone) break
        buffer += decoder.decode(value, { stream: true })
        let match
        while ((match = buffer.match(/\r?\n\r?\n/)) !== null) {
          const idx = match.index
          const chunk = buffer.slice(0, idx)
          buffer = buffer.slice(idx + match[0].length)
          for (const line of chunk.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (!data) continue
            if (data === '[DONE]') { done = true; break }
            let json
            try { json = JSON.parse(data) } catch { continue }
            if (json.usage) usage = json.usage
            const delta = json?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta.length) {
              full += delta
              yield { type: 'delta', text: delta }
            }
            const finish = json?.choices?.[0]?.finish_reason
            if (finish) {
              // Keep reading until [DONE] for usage, but most providers send usage before finish.
            }
          }
          if (done) break
        }
      }
      yield { type: 'done', text: full, usage }
    } catch (err) {
      if (err instanceof LLMError) throw err
      if (own.signal.aborted) {
        throw new LLMError(signal?.aborted ? '已取消' : '请求超时', signal?.aborted ? 'ABORTED' : 'TIMEOUT')
      }
      throw new LLMError(`无法连接 DeepSeek：${err?.message ?? err}`, 'NETWORK')
    } finally {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
    }
  }
}

export function makeMessages(system, history, userText) {
  return [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    ...(userText ? [{ role: 'user', content: userText }] : []),
  ]
}

export function contextPressure(messages, contextLimit, reserve = 1200) {
  const used = estimateMessages(messages)
  return { used, limit: contextLimit, reserve, ratio: used / Math.max(1, contextLimit - reserve) }
}

export { sleep }
