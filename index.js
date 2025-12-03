import dotenv from 'dotenv'
import { startBot } from './src/bot.js'

// 从 .env 加载环境变量（如果存在）
dotenv.config()

// 启动机器人；模块化实现位于 src/bot.js 并导出 startBot
startBot().catch((e) => {
  console.error('启动 wechat_liBot 失败：', e)
  process.exit(1)
})


