import test from 'node:test'
import assert from 'node:assert/strict'
import { emotionGuidance } from '../lib/prompts.js'

test('emotion guidance uses mood, affection and energy together', () => {
  const tiredLow = emotionGuidance({ mood: 20, affection: 50, energy: 20 })
  assert.match(tiredLow, /很累|困/)
  assert.match(tiredLow, /低落|安静/)
  assert.match(tiredLow, /想被安静陪着/)

  const happyClose = emotionGuidance({ mood: 90, affection: 90, energy: 85 })
  assert.match(happyClose, /心情很好/)
  assert.match(happyClose, /很亲近/)
  assert.match(happyClose, /精力很足/)
  assert.doesNotMatch(happyClose, /低精力/)
})
