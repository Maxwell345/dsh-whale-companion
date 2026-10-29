import test from 'node:test'
import assert from 'node:assert/strict'
import { QQClient, atSelf, textFromSegments } from '../lib/qq.js'

function cfg(overrides = {}) {
  return {
    owner: { qq: '10001' },
    self: { qq: '20002' },
    qq: {
      enabled: true, wsUrl: 'ws://127.0.0.1:1', token: '', groups: ['30003', '', ''],
      reconnect: false, replyAt: true, maxReplyChars: 900,
    },
    ...overrides,
  }
}

test('QQ parses text and @ segments, including CQ strings', () => {
  assert.equal(textFromSegments([{ type: 'at', data: { qq: '20002' } }, { type: 'text', data: { text: ' 在吗' } }]), '在吗')
  assert.equal(textFromSegments('[CQ:at,qq=20002] 在吗'), '在吗')
  assert.equal(atSelf([{ type: 'at', data: { qq: '20002' } }], '20002'), true)
  assert.equal(atSelf('[CQ:at,qq=20002] 在吗', '20002'), true)
  assert.equal(atSelf([{ type: 'at', data: { qq: '99999' } }], '20002'), false)
})

test('QQ delivers only owner private messages and @-mentions in configured groups', async () => {
  const got = []
  const client = new QQClient({
    getConfig: () => cfg(),
    isAwake: () => true,
    onMessage: async (m) => { got.push(m) },
    log: () => {},
  })
  client.awakeAt = 0

  client.handle({
    post_type: 'message', message_type: 'private', time: Math.floor(Date.now() / 1000),
    user_id: 10001, self_id: 20002, sender: { nickname: '主人' },
    message: [{ type: 'text', data: { text: '在吗' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(got.length, 1)
  assert.equal(got[0].text, '在吗')

  client.handle({
    post_type: 'message', message_type: 'private', time: Math.floor(Date.now() / 1000),
    user_id: 99999, self_id: 20002, sender: { nickname: '陌生人' },
    message: [{ type: 'text', data: { text: '你好' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(got.length, 1, 'non-owner private messages are ignored')

  client.handle({
    post_type: 'message', message_type: 'group', time: Math.floor(Date.now() / 1000),
    group_id: 30003, user_id: 10001, self_id: 20002, sender: { card: '主人' },
    message: [{ type: 'at', data: { qq: '20002' } }, { type: 'text', data: { text: ' 在吗' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(got.length, 2)
  assert.equal(got[1].type, 'group')

  client.handle({
    post_type: 'message', message_type: 'group', time: Math.floor(Date.now() / 1000),
    group_id: 30003, user_id: 10001, self_id: 20002, sender: { card: '主人' },
    message: [{ type: 'text', data: { text: '没 @ 你' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(got.length, 2, 'group messages without @ are ignored')

  client.handle({
    post_type: 'message', message_type: 'group', time: Math.floor(Date.now() / 1000),
    group_id: 99999, user_id: 10001, self_id: 20002, sender: { card: '主人' },
    message: [{ type: 'at', data: { qq: '20002' } }, { type: 'text', data: { text: ' 在吗' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(got.length, 2, 'groups outside the configured list are ignored')
})

test('QQ ignores messages from before wake-up', async () => {
  let called = 0
  const client = new QQClient({
    getConfig: () => cfg(),
    isAwake: () => true,
    onMessage: async () => { called++ },
    log: () => {},
  })
  client.awakeAt = Date.now()
  client.handle({
    post_type: 'message', message_type: 'private', time: Math.floor((Date.now() - 60000) / 1000),
    user_id: 10001, self_id: 20002, message: [{ type: 'text', data: { text: '旧消息' } }],
  })
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(called, 0)
})
