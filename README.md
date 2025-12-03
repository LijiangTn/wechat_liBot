# wechat_liBot

一个基于 Wechaty 的最小化个人机器人示例，监听好友（私聊）消息并回复固定文本。

本示例刻意不包含任何 AI 集成，仅演示与主项目相同的登录、接收和发送流程，方便验证消息链路。

使用方法
- 可选：在本目录创建 `.env` 文件，包含下述环境变量（也可以直接在环境中设置）
- 安装依赖：

```bash
npm install
```

- 启动程序：

```bash
npm start
```

环境变量说明
- `PUPPET`：要使用的 puppet 包名（默认 `wechaty-puppet-wechat4u`）
- `CHROME_BIN`：使用基于 puppeteer 的 puppet 时可选的 Chromium endpoint
- `BOT_NAME`：memory-card 文件与日志使用的名称（默认 `WechatLiBot`）
- `FIXED_REPLY`：收到好友消息时回复的固定文本（默认：`这是自动回复：我现在有事，稍后回复你。`）

注意事项
- 如果在容器中运行，请确保 `node_modules` 与生成的 memory-card（如 `WechatLiBot.memory-card.json`）在重启后能够持久化（例如挂载卷）。  
- 本示例使用与主项目相同的 puppet，因此同样受限于会话持久化和账号风控的风险。生产环境建议优先使用企业微信（WeCom）等官方 API 以降低封号风险。

如需我帮你：
- 将 README 中的示例 `.env` 文件添加到仓库；或
- 添加自动重连/守护逻辑示例；或
- 提供容器部署时的持久化挂载示例（docker run/compose）。