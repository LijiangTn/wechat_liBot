# wechat_liBot

这是一个面向开发者的基础架构示例工程，基于 Wechaty 实现。项目演示了微信账号的登录、接收好友私聊消息以及发送回复的完整消息链路，适合用于验证消息流、快速搭建原型并在此基础上扩展更多功能（例如 AI 回复、命令解析、外部存储等）。

功能概述
- 登录微信并维持会话（基于所选 Puppet 的能力）。  
- 接收好友（私聊）消息并发送回复（当前为固定文本回复，便于验证）。  
- 简单的消息分类与持久化：检测到的链接会保存到 `<BOT_NAME>-links.txt`；非文本消息会写入 `<BOT_NAME>-raw-*.log` 以便离线分析。

快速开始
1. （可选）在仓库根目录创建 `.env` 用于覆盖环境变量。  
2. 安装依赖：

```bash
npm install
```

3. 启动程序：

```bash
npm start
```

配置说明（环境变量）
- `PUPPET`：要使用的 puppet 包名（默认 `wechaty-puppet-wechat4u`）。可按需替换以测试不同接入方式。  
- `CHROME_BIN`：当使用基于 Puppeteer 的 puppet 时，可以设置 Chromium endpoint。  
- `BOT_NAME`：用于生成 memory-card 与日志文件的名称（默认 `WechatLiBot`）。  
- `FIXED_REPLY`：收到好友消息后发送的固定回复文本（默认 `这是自动回复：我现在有事，稍后回复你。`）。

实现与扩展建议
- 职责分离：事件路由逻辑位于 `src/bot.js`，消息解析与发送封装于 `src/messageService.js`，便于单元测试与后续替换（例如将固定回复替换为 AI 回复）。  
- I/O 策略：当前为了实现简单使用了同步文件写入；生产环境应考虑异步写入或后台队列以避免阻塞消息处理。  
- Puppet 选择：不同 Puppet 对微信新功能（例如视频号/Channels）的支持不同。若需处理视频号，建议评估 `puppet-padlocal`（有试用）或其他社区 puppet。使用第三方协议可能存在账号风控风险，生产环境优先考虑官方渠道（如企业微信 WeCom）。
- 日志与监控：建议将 `console.log` 替换为结构化日志并接入监控系统以便运维。

贡献与许可
- 本仓库采用 MIT 许可证，详见 `LICENSE` 文件。欢迎提交 Issue 与 PR 以改进功能或增强健壮性。

参考项目
- Wechaty（核心 SDK 与生态）：https://github.com/wechaty/wechaty  
- Wechaty 官方文档：https://wechaty.js.org