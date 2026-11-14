import test from 'node:test'
import assert from 'node:assert/strict'
import { extractDatedCommitments, parseDeadline } from '../lib/reminders.js'

const NOW = new Date(2026, 10, 11, 10, 0, 0) // 2026-11-11 10:00 local, Wednesday

test('deadline parser handles Chinese dates, relative days and weekends', () => {
  assert.equal(new Date(parseDeadline('11月20日晚上8点一起吃饭', NOW).dueAt).getDate(), 20)
  assert.equal(new Date(parseDeadline('明天提醒主人交作业', NOW).dueAt).getDate(), 12)
  const weekend = new Date(parseDeadline('周末陪主人去吃饭', NOW).dueAt)
  assert.equal(weekend.getDay(), 6)
  assert.equal(weekend.getHours(), 20)
  assert.equal(parseDeadline('没有时间的事项', NOW), null)
})

test('only dated commitments in the agreement section become reminders', () => {
  const markdown = [
    '# 重要信息记忆',
    '## 约定与未完事项',
    '- 周末陪主人去吃饭',
    '- 明天提醒主人交作业',
    '- 下周五一起看电影',
    '- 没有时间的事项',
    '## 近期发生的事',
    '- 12月1日不是约定事项',
  ].join('\n')
  const rows = extractDatedCommitments(markdown, NOW)
  assert.equal(rows.length, 3)
  assert.ok(rows.every((r) => r.id && r.dueAt > NOW.getTime()))
  assert.ok(rows.some((r) => r.text.includes('周末')))
  assert.ok(rows.some((r) => r.text.includes('明天')))
  assert.ok(rows.some((r) => r.text.includes('下周五')))
  assert.ok(!rows.some((r) => r.text.includes('不是约定事项')))
})
