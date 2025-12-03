import { WechatyBuilder, ScanStatus } from 'wechaty'
import qrTerminal from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import util from 'util'

/**
 * wechat_liBot - 一个最小化的模块化 Wechaty 机器人，监听所有好友私聊消息
 * 并回复一个固定的、可配置的文本。该模块刻意不包含任何 AI 集成，专注于稳定
 * 的消息接收/发送逻辑，默认使用与主项目相同的 puppet（wechaty-puppet-wechat4u）。
 *
 * 导出:
 * - startBot(): Promise<void>  启动机器人并注册生命周期回调。
 *
 * 配置（通过环境变量）:
 * - PUPPET: puppet 包名（默认: 'wechaty-puppet-wechat4u'）
 * - CHROME_BIN: 可选的 puppeteer Chromium endpoint
 * - BOT_NAME: memory-card 和日志使用的名称（默认: 'WechatLiBot'）
 * - FIXED_REPLY: 当好友发送消息时回复的固定文本（有默认值）
 */

const DEFAULT_REPLY = '这是自动回复：我现在有事，稍后回复你。'

function getEnvOrDefault(name, fallback) {
  return process.env[name] && process.env[name].length ? process.env[name] : fallback
}

export async function startBot() {
  const puppet = getEnvOrDefault('PUPPET', 'wechaty-puppet-wechat4u')
  const chromeBin = getEnvOrDefault('CHROME_BIN', '')
  const botName = getEnvOrDefault('BOT_NAME', 'WechatLiBot')
  const fixedReply = getEnvOrDefault('FIXED_REPLY', DEFAULT_REPLY)

  const CHROME_BIN = chromeBin ? { endpoint: chromeBin } : {}

  // 确保 memory-card 文件与当前工作目录同级持久化（可选）
  const memoryCardFile = path.resolve(process.cwd(), `${botName}.memory-card.json`)
  // 说明：当使用 name 字段时，Wechaty 会自动创建/读取 memory-card

  // 使用指定的 puppet 和选项构建 Wechaty 实例
  const bot = WechatyBuilder.build({
    name: botName,
    puppet,
    puppetOptions: {
      uos: true,
      ...CHROME_BIN,
    },
  })

  // 二维码处理函数 - 在控制台输出二维码供扫码登录
  function onScan(qrcode, status) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      qrTerminal.generate(qrcode, { small: true })
      const qrcodeImageUrl = ['https://api.qrserver.com/v1/create-qr-code/?data=', encodeURIComponent(qrcode)].join('')
      console.log('扫码二维码链接：', qrcodeImageUrl, ScanStatus[status], status)
    } else {
      console.log('扫码状态：', ScanStatus[status], status)
    }
  }

  // 登录处理函数
  function onLogin(user) {
    console.log(`${user} 已登录 - memory-card 文件：${memoryCardFile}`)
  }

  // 登出处理函数
  function onLogout(user) {
    console.log(`${user} 已登出`)
  }

  // 错误处理函数 - 记录错误，必要时可以做优雅退出或重连
  bot.on('error', (e) => {
    console.error('机器人发生错误：', e)
  })

  // 消息处理函数 - 监听好友（私聊）消息并回复固定文本
  // 同时尝试从消息中提取链接（例如视频号分享），并保存到本地文件以便后续处理
  bot.on('message', async (msg) => {
    try {
      const talker = msg.talker()
      // 忽略自己发送的消息或系统消息
      if (talker.self()) return

      const room = msg.room()
      // 仅响应私聊（好友）消息；忽略群消息
      if (room) return

      const contact = talker

      // 获取消息的文本表现（优先 text()，若无则尝试 toString()）
      let text = ''
      try {
        text = msg.text() || ''
      } catch (e) {
        text = ''
      }
      if (!text) {
        try {
          // 某些非文本类型在 toString() 中可能包含可读信息或链接
          text = String(msg) || ''
        } catch (e) {
          text = ''
        }
      }

      // 记录收到的消息与类型，便于排查
      console.log(`收到来自 ${contact.name()} 的消息（类型 ${msg.type()}）：${text || '[无文本]'}`)

      // 尝试从消息中提取 https 链接（通用正则）
      const urlMatch = (text || '').match(/https?:\/\/[^\s'"]+/)
      if (urlMatch) {
        const url = urlMatch[0]
        const linksFile = path.resolve(process.cwd(), `${botName}-links.txt`)
        try {
          fs.appendFileSync(linksFile, `${new Date().toISOString()} ${contact.name()}: ${url}\n`)
          console.log(`已检测到链接并保存：${url} -> ${linksFile}`)
        } catch (e) {
          console.error('保存链接失败：', e)
        }
        } else {
          // 如果没有链接，但消息类型不是纯文本，保存并打印原始 msg 以便后续分析
          if (msg.type() !== bot.Message.Type.Text) {
            try {
              // 将原始 msg 以可读形式写入文件，方便离线分析（避免循环引用问题）
              const rawDump = util.inspect(msg, { depth: null, getters: true, showHidden: false })
              const rawFile = path.resolve(process.cwd(), `${botName}-raw-${msg.id || Date.now()}.log`)
              fs.appendFileSync(rawFile, `\n=== RAW MSG ${new Date().toISOString()} ===\n`)
              fs.appendFileSync(rawFile, rawDump + '\n')
              console.log('已保存原始消息调试信息：', rawFile)
              // 仍然在控制台打印一份简短 JSON（payload）以便快速查看
              try {
                console.log('非文本消息载荷（payload）：', JSON.stringify(msg.payload || {}, null, 2))
              } catch (e) {
                console.log('无法序列化 payload')
              }
            } catch (e) {
              console.log('保存或打印原始消息时出错：', e)
            }
          }
        }

      // 无论是否包含链接，都发送固定回复以保持行为一致
      await contact.say(fixedReply)
      console.log(`已回复 ${contact.name()}`)
    } catch (err) {
      console.error('消息处理出错：', err)
    }
  })

  // 注册生命周期回调
  bot.on('scan', onScan)
  bot.on('login', onLogin)
  bot.on('logout', onLogout)

  // 启动机器人
  try {
    await bot.start()
    console.log('wechat_liBot 已启动，等待好友消息...')
    } catch (e) {
    console.error('启动机器人失败：', e)
    throw e
  }
}


