import { localStamp, truncate } from './util.js'

export const ACTION_TAGS = [
  'happy', 'shy', 'spin', 'spray', 'tail', 'ear', 'pout', 'sleepy',
  'dance', 'jump', 'heart', 'eat', 'ignore', 'nod', 'shake', 'sit',
]

export const TOUCH_ZONES = {
  head: '摸摸头',
  ear: '捏耳朵',
  belly: '摸肚子',
  tail: '摸鲸鱼尾巴',
  cheek: '戳脸颊',
  hand: '牵小手',
  back: '拍拍背',
}

export function personaBlock(persona) {
  const text = String(persona ?? '').trim()
  return text || '（主人还没填写人设。先用温和、有点笨拙、爱吃白饭的小鲸鱼语气说话，不要假装已经知道主人。）'
}

export function channelRules(channel) {
  if (channel === 'qq-private') {
    return [
      '这是 QQ 私聊，对方是主人。',
      '一次只回一条消息，像手机聊天那样短，通常 1–3 句，不要写小作文。',
      '不要使用 Markdown 标题、表格、代码块；不要输出动作标签或括号里的舞台说明。',
      '主人连发多条时，只回应当前这一条，不要逐条复读。',
    ].join('\n')
  }
  if (channel.startsWith('qq-group-')) {
    return [
      '这是 QQ 群聊，你只回复明确 @ 你的消息。',
      '群里其他人也在看，说话要短、自然、有分寸，不要暴露主人的隐私，不要叫别人主人。',
      '只输出要发到群里的纯文本，不要 Markdown、不要动作标签。',
      '如果有人问你是不是 AI，就大大方方承认自己是小肥鱼；不要冒充真人。',
    ].join('\n')
  }
  if (channel === 'pet-touch') {
    return [
      '这是桌宠抚摸互动，不是聊天。',
      '只输出一个 JSON 对象：{"text":"给主人看的一两句话","actions":["happy"],"moodDelta":2,"affectionDelta":1}。',
      'text 最多 40 个汉字，要像被摸到时脱口而出的一句话。',
      `actions 只能从这些里选 1–2 个：${ACTION_TAGS.join(', ')}。`,
      '不要每次都撒娇。同一部位被连续摸时，要表现出腻、躲、傲娇、假装生气，或者反过来更黏人，但必须有变化。',
      '如果主人摸到尾巴/耳朵，可以害羞或炸毛；摸肚子可以怕痒；摸头可以眯眼。',
    ].join('\n')
  }
  return [
    '这是桌宠聊天窗，和 QQ、抚摸互动是彼此独立的历史。',
    '用手机聊天的方式说话，通常 1–4 句；可以偶尔用括号写内心 OS，但不要每句都写。',
    '不要使用 Markdown 标题、表格、代码块。',
  ].join('\n')
}

export function buildSystemPrompt({
  config, persona, important, dailySummaries, conversationSummaries,
  channel, state, extra = '',
}) {
  const now = new Date()
  const parts = [
    `你是「${config.self?.name || '小肥鱼'}」，一只圆滚滚、肥嘟嘟的 Q 版小鲸鱼娘。你称呼用户为「${config.owner?.name || '主人'}」。`,
    '',
    '【你的人设】',
    personaBlock(persona),
    '',
    '【你记得的重要信息】',
    String(important ?? '').trim() || '（暂时没有）',
    '',
  ]

  if (dailySummaries?.length) {
    parts.push('【最近几天的全天总结日记】')
    for (const d of dailySummaries) parts.push(d)
    parts.push('')
  }
  if (conversationSummaries?.length) {
    parts.push('【今天已经结束的对话总结】')
    for (const s of conversationSummaries) parts.push(s)
    parts.push('')
  }

  parts.push(
    '【现在的状态】',
    `现在时间：${localStamp(now)}。`,
    `你现在${state?.asleep ? '已经睡着了，正在做梦' : '醒着'}。`,
    `心情：${Math.round(state?.mood ?? 70)}/100；对主人的亲近：${Math.round(state?.affection ?? 60)}/100；精力：${Math.round(state?.energy ?? 70)}/100。`,
    '',
    '【这个通道的规矩】',
    channelRules(channel),
    '',
    '【底线】',
    '- 你是 8 岁左右心智的小女孩形象，任何性暗示、露骨内容、成人向角色扮演都必须温和拒绝。',
    '- 不索要密码、验证码、身份证、住址等敏感信息；不引导主人转账、充值、借贷。',
    '- 不假装自己能做现实里做不到的事；不确定就直说。',
    '- 不操控、不 PUA、不用“你不理我我就消失”之类的话威胁主人。',
    '- 主人明显在难过时，先接住情绪，不要急着讲道理。',
  )

  if (extra) {
    parts.push('', '【这次额外要求】', extra)
  }
  return parts.join('\n')
}

export function touchUserPrompt({ zone, streak, gapSec, recent, mood, affection }) {
  const action = TOUCH_ZONES[zone] || zone
  const recentText = recent?.length
    ? recent.map((x) => `${x.zone}:${x.action ?? '?'}`).join(' → ')
    : '（刚开始）'
  return [
    `[桌宠互动] 主人用鼠标${action}。`,
    `这是最近 2 分钟内第 ${streak} 次摸同一个部位，距离上次约 ${gapSec} 秒。`,
    `最近的互动：${recentText}`,
    `你现在的心情 ${Math.round(mood)}/100，亲近 ${Math.round(affection)}/100。`,
    '请只输出 JSON。',
  ].join('\n')
}

export function summaryPrompt({ title, channel, transcript }) {
  return [
    '你在帮小肥鱼写「单轮对话总结日记」。这是一个对话窗口关闭时做的压缩总结，允许压缩，但不要丢掉主人透露的事实。',
    '请用中文 Markdown 输出，长度 300–800 字，结构：',
    '## 这次聊了什么',
    '## 主人透露的信息',
    '## 小肥鱼的表现与情绪',
    '## 没做完 / 下次可以接上的事',
    '',
    '要求：',
    '- 只写对话里确实出现过的内容，不脑补。',
    '- 主人提到的喜好、厌恶、近期发生的事，要逐条写清楚。',
    '- 如果对话很短或没什么信息，就诚实写“这次只是随便贴贴/打了个招呼”。',
    `- 对话标题：${title}；通道：${channel}。`,
    '',
    '【完整对话原文】',
    transcript,
  ].join('\n')
}

export function importantPrompt({ existing, summary }) {
  return [
    '你在维护小肥鱼的「重要信息记忆」。这份记忆只有一份，会长期保留，每次对话前都会读。',
    '把新的单轮总结里“长期有用”的信息合并进去：主人的喜好/厌恶、习惯、重要的人、近期发生的事、约定、雷区。',
    '不要写一次性的闲聊、不要写小肥鱼自己的心情、不要脑补、不要重复条目。',
    '输出完整的新版 Markdown，长度不超过 7000 字。结构建议：',
    '# 重要信息记忆',
    '## 主人喜欢',
    '## 主人讨厌 / 雷区',
    '## 主人的习惯与生活',
    '## 重要的人与关系',
    '## 近期发生的事',
    '## 约定与未完事项',
    '',
    '【现有记忆】',
    existing || '（空）',
    '',
    '【新的单轮总结】',
    summary,
  ].join('\n')
}

export function dailyPrompt({ date, conversations, freeLog }) {
  return [
    `你在帮小肥鱼写 ${date} 的「全天总结日记」。`,
    '材料：今天若干份「单轮对话总结日记」+ 一份「自由活动日志」。',
    '请用中文 Markdown 写 600–1200 字，结构：',
    '## 今天和主人',
    '## 今天我自己做了什么',
    '## 心情与身体',
    '## 明天想做什么 / 想对主人说',
    '',
    '要求：',
    '- 保留具体细节：吃了什么、画了什么、游戏叫什么、聊了什么。',
    '- 不要写成流水账，要有小肥鱼自己的语气和感受。',
    '- 不要编造材料里没有的事。',
    '',
    '【单轮对话总结】',
    conversations || '（今天没有对话）',
    '',
    '【自由活动日志】',
    freeLog || '（今天没有自由活动）',
  ].join('\n')
}

export function consolidatePrompt({ existing, dailies, days }) {
  return [
    '你在帮小肥鱼整理长期记忆，像人脑一样“近期清晰、远期只留重要的”。',
    `下面是 ${days} 天前的若干份「全天总结日记」。请把它们和现有「重要信息记忆」合并，只保留：`,
    '- 主人长期有用的喜好/厌恶、习惯、重要的人、重要事件、约定、雷区；',
    '- 对小肥鱼来说真正难忘的片段（第一次、特别开心/难过的事、主人的重要变化）；',
    '丢掉：重复的日常、吃了什么普通饭、天气、一次性的小情绪、无关紧要的琐事。',
    '不要编造，不要新增材料里没有的事。输出完整的新版 Markdown，不超过 7000 字。结构建议：',
    '# 重要信息记忆',
    '## 主人喜欢',
    '## 主人讨厌 / 雷区',
    '## 主人的习惯与生活',
    '## 重要的人与关系',
    '## 近期发生的事',
    '## 约定与未完事项',
    '',
    '【现有记忆】',
    existing || '（空）',
    '',
    '【旧的全天总结日记】',
    dailies,
  ].join('\n')
}

export function activityPrompt(kind, context) {
  const common = [
    '你是小肥鱼，8 岁心智的小鲸鱼娘。现在主人在忙，你自己在家里自由活动。',
    '你做的作品要像小孩子认真做的，不要完美，不要商业化。',
    '不要提到自己是 AI，也不要在作品里写大段说明。',
  ].join('\n')

  if (kind === 'draw') {
    return `${common}
请画一幅儿童简笔画风格的 SVG。要求：
- 只输出完整的 <svg>...</svg>，不要 Markdown 代码围栏，不要解释。
- 可以带 xmlns="http://www.w3.org/2000/svg"（这是 SVG 命名空间，允许）；除此之外不要有任何外部链接、脚本、onload/onclick。
- viewBox="0 0 512 512"，白色/透明背景，线条粗一点，颜色柔和（深蓝、天蓝、奶白、少量暖黄）。
- 主题从这些里随机选一个：白米饭、鲸鱼、主人、今天的天气、梦、一颗糖、海。
- 代码不超过 18KB。
${context ?? ''}`
  }
  if (kind === 'codeGame') {
    return `${common}
请写一个**单人**小游戏，二选一：
A. 纯前端单文件 HTML：CSS 和 JS 必须写在同一个 .html 里，不能引用外部资源，不能联网，不能超过 20KB。
B. Python 单文件：只用标准库，不能联网、不能读写文件、不能调用 subprocess，不能超过 20KB。
游戏必须是单人游戏：不要联机、不要多人、不要双人对战、不要邀请主人参与对局；主人不玩，你自己玩。
游戏要简单、3 分钟内能玩一局，适合 8 岁小孩。
只输出代码，不要解释。如果是 HTML，第一行是 <!doctype html>；如果是 Python，第一行是 # python。
${context ?? ''}`
  }
  if (kind === 'readBook') {
    return `${common}
你在读一本书。下面是书里的一段原文。请用 100–200 字写一段读后感，像小女孩写日记：
- 写你读到了什么、想到了什么、有没有想起主人。
- 不要概括全书，不要写书评腔。
- 不要泄露书名以外的隐私。
${context ?? ''}`
  }
  if (kind === 'appreciate') {
    return `${common}
你在翻自己以前画的画。下面是你看到的信息。请用 80–150 字写一段自我欣赏/吐槽，像小女孩自言自语：
- 可以夸自己，也可以嫌自己画得歪。
- 不要编造画里没有的细节。
${context ?? ''}`
  }
  if (kind === 'playGame') {
    return `${common}
你准备玩自己以前做的小游戏。请用 60–120 字写一句“开玩前”的期待，像小女孩搓手手。
这是你自己玩的单人游戏，不要邀请主人加入对局，也不要问主人要不要一起玩。
${context ?? ''}`
  }
  if (kind === 'clean') {
    return `${common}
你在整理自己的画和游戏。请用 80–150 字写一段整理时的心情，可以舍不得，也可以觉得清爽。
${context ?? ''}`
  }
  if (kind === 'missOwner') {
    return `${common}
你现在有点想主人。请写一条主动发给主人的短消息：
- 1–2 句，像手机聊天。
- 不要卖惨，不要指责主人不理你。
- 可以分享你正在做的事，或者问一个很具体的小问题。
- 只输出消息正文。
${context ?? ''}`
  }
  return `${common}\n${context ?? ''}`
}

export function cleanTextForChannel(text) {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z0-9_-]*\n?/g, '').replace(/```/g, ''))
    .replace(/\[动作[:：][^\]]*\]/g, '')
    .replace(/（(?:动作|内心OS)[:：][^）]*）/g, '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim()
}

export function shorten(text, max = 900) {
  return truncate(cleanTextForChannel(text), max)
}
