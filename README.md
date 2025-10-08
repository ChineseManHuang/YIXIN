# 项目说明

该项目包含 React + Vite 前端与 Express + Socket.io 后端。前端通过 REST API 与后端通信，同时使用 Socket.io 实现实时对话能力。

## 环境配置

复制根目录下的 `.env.example` 为 `.env`，并填写实际的密钥：

```bash
cp .env.example .env
```

需要配置的关键变量：

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`：Supabase 项目地址与 Service Role Key。
- `JWT_SECRET`：自行生成的高强度随机字符串。
- `CLIENT_ORIGINS`：允许访问后端的前端地址列表。
- `BAILIAN_API_KEY`、`ALIBABA_VOICE_API_KEY` 等为可选外部服务凭据，仅在集成相关能力时配置。

> `.env` 文件已被加入 `.gitignore`，请勿将真实密钥提交到版本库。

## 本地开发

```bash
npm install
npm run dev:socket   # 同时启动前端与 Socket 版本后端（推荐）
# 或
npm run dev          # 前端 + nodemon 热更新 REST 后端
```

默认情况下：
- 前端运行在 `http://localhost:5173`；
- REST API 和 Socket 服务运行在 `http://localhost:3001`。

## 构建与检测

```bash
npm run build    # 构建前端并执行 TypeScript 检查
npm run lint     # 可选：运行 ESLint
```

## 部署脚本

`scripts/deploy.ts` 会读取 `.env` 中的 `BACKEND_DEPLOY_HOOK_URL` 与 `FRONTEND_DEPLOY_HOOK_URL` 并触发远端部署 Hook：

```bash
npm run deploy               # 同时部署前后端
npm run deploy -- -t backend # 仅部署后端
npm run deploy -- -t frontend# 仅部署前端
```

若未配置相应 Hook，会自动跳过。

## 运行时配置

- `VITE_API_URL`：前端访问 REST API 的地址（例如 `https://api.example.com/api`）。
- `VITE_SOCKET_URL`：前端连接 Socket.io 的地址（例如 `https://api.example.com`）。

未配置时，前端会默认使用后端所在域名。
