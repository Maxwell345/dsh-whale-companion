import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDrawPlan, planToSvg } from '../lib/draw-plan.js'
import { applyIncoming, DEFAULT_CONFIG } from '../lib/config.js'

const VALID = {
  viewBox: '0 0 512 512',
  steps: [
    { type: 'stroke', d: 'M 40 40 C 80 10 120 10 160 40', color: '#253b66', width: 3, duration: 0.3 },
    { type: 'stroke', d: 'M 40 40 L 40 120', color: '#253b66', width: 2.5, duration: 0.2 },
    { type: 'fill', d: 'M 45 45 L 155 45 L 155 115 Z', fill: '#f7ead2', duration: 0.7, seed: [90, 70] },
  ],
}

test('draw plans preserve stroke/fill order and produce an SVG still', () => {
  const plan = parseDrawPlan(JSON.stringify(VALID))
  assert.equal(plan.steps.length, 3)
  assert.equal(plan.steps[0].type, 'stroke')
  assert.equal(plan.steps[2].type, 'fill')
  const svg = planToSvg(plan)
  assert.match(svg, /^<svg /)
  assert.match(svg, /data-step="0"/)
  assert.match(svg, /fill="#f7ead2"/)
  assert.match(svg, /stroke="#253b66"/)
})

test('draw plans reject scripts, external references and invalid colors', () => {
  assert.throws(() => parseDrawPlan(JSON.stringify({
    steps: [{ type: 'stroke', d: 'M 0 0 L 10 10 url(#x)', color: '#fff' }],
  })))
  assert.throws(() => parseDrawPlan(JSON.stringify({
    steps: [{ type: 'stroke', d: 'M 0 0 L 10 10', color: 'red' }],
  })))
  assert.throws(() => parseDrawPlan(JSON.stringify({ steps: [] })))
})

test('deepseek-flash is the fixed model even for old saved configs', () => {
  const old = {
    ...DEFAULT_CONFIG,
    llm: { ...DEFAULT_CONFIG.llm, model: 'deepseek-chat' },
  }
  const next = applyIncoming(old, { llm: { model: 'deepseek-chat' } })
  assert.equal(DEFAULT_CONFIG.llm.model, 'deepseek-flash')
  assert.equal(next.llm.model, 'deepseek-flash')
})
