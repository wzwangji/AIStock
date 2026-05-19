# AI Stock Analysis Dashboard

一个全栈 AI 股票分析面板：用户输入股票代码 → 获取实时行情 → 调用 LLM 生成结构化分析 → 持久化到 Supabase，并提供历史记录与监控页面。

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS + React Router
- **后端**：Node.js + Express
- **数据库**：Supabase (PostgreSQL)
- **AI**：DeepSeek API (OpenAI 兼容)
- **股票数据**：Finnhub API
- **部署**：Vercel

## 功能列表

1. 输入股票代码（AAPL / TSLA / NVDA 等）获取实时行情
2. 一键 AI 分析，LLM 返回严格 JSON：summary / sentiment / risk_level / key_factors / suggestion
3. 行情 + 分析结果自动持久化到 Supabase
4. 历史分析记录页面
5. Monitor 页面：请求总数、成功率、失败率、平均响应时间
6. 三类日志：请求日志、LLM 调用日志、异常日志
7. 异常监控：行情 API 异常、LLM 异常、JSON 解析异常、Supabase 写入异常
8. 基础限流：分析 10 req/min/IP，行情 30 req/min/IP，全局 100 req/min/IP
9. 前端 ErrorBoundary + 后端统一异常处理，接口出错不会导致页面崩溃

## 项目结构

```
AIStock/
├── backend/          Express 后端
├── frontend/         React 前端
├── supabase/         数据库 schema
└── README.md
```

## 快速开始（本地）

### 1. 准备外部服务

| 服务 | 操作 |
|---|---|
| Supabase | 在 [supabase.com](https://supabase.com) 新建项目，记下 Project URL 和 `service_role` key |
| Finnhub | 在 [finnhub.io](https://finnhub.io) 免费注册，获取 API key |
| DeepSeek | 在 [platform.deepseek.com](https://platform.deepseek.com) 创建 API key |

在 Supabase Dashboard → SQL Editor 执行 `supabase/schema.sql`，创建 4 张表（analyses / request_logs / llm_logs / error_logs）。

### 2. 启动后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入上面 3 个服务的 key
npm install
npm run dev
```

后端默认监听 `http://localhost:8080`，访问 `/api/health` 应返回 `{"ok":true}`。

### 3. 启动前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

打开 `http://localhost:5173`。

## API 文档

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/stock/:symbol` | 获取行情 + 公司信息 |
| POST | `/api/analyze` | body `{symbol}`，返回 LLM 分析并入库 |
| GET | `/api/history?limit=50&symbol=` | 历史记录列表 |
| GET | `/api/history/:id` | 历史记录详情 |
| GET | `/api/monitor/stats?window=1h\|24h` | 流量统计 |
| GET | `/api/monitor/requests?limit=100` | 请求日志 |
| GET | `/api/monitor/llm?limit=100` | LLM 调用日志 |
| GET | `/api/monitor/errors?limit=100` | 异常日志 |

## 数据库 Schema

见 [supabase/schema.sql](supabase/schema.sql)。四张表全部启用 RLS，策略为 `for all using (true)`（无认证场景）。

## LLM 严格 JSON 约束

`backend/src/services/llmService.js` 采用三重保障：

1. **系统提示**强制要求只输出 JSON 并给出 schema
2. **API 参数** `response_format: { type: "json_object" }`
3. **解析层**：先 `JSON.parse`，失败用正则回退提取，再失败抛 `JSONParseError` 并自动重试一次

返回字段：
```json
{
  "summary": "...",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High",
  "key_factors": ["...", "...", "..."],
  "suggestion": "..."
}
```

## 部署到 Vercel

部署顺序：**Supabase → backend → frontend**。建议在 Vercel 创建两个 Project：一个后端 Project，Root Directory 指向 `backend`；一个前端 Project，Root Directory 指向 `frontend`。

### 后端（Serverless Function）

1. Vercel Dashboard → Add New → Project → 选择仓库
2. 配置：
   - **Name**: `aistock-backend`
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: 留空或 `npm install`
   - **Output Directory**: 留空
3. Environment Variables：
   ```
   NODE_ENV=production
   FINNHUB_API_KEY=<your key>
   DEEPSEEK_API_KEY=<your key>
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   SUPABASE_URL=<your supabase project url>
   SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
   CORS_ORIGIN=*
   ```
4. 部署后访问 `/api/health`，例如 `https://aistock-backend.vercel.app/api/health`

后端目录已包含 `backend/vercel.json` 和 `backend/api/index.js`，Vercel 会把 Express app 作为 Serverless Function 运行。

### 前端（Vite Static Site）

1. Vercel Dashboard → Add New → Project → 选择同一个仓库
2. 配置：
   - **Name**: `aistock-frontend`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables：
   ```
   VITE_API_BASE_URL=https://aistock-backend.vercel.app
   ```
4. 前端目录已包含 `frontend/vercel.json`，用于支持 React Router 刷新页面不 404。

### 回填 CORS

前端部署完拿到域名（如 `https://aistock-frontend.vercel.app`）后，回到后端 Project 的 Environment Variables，把 `CORS_ORIGIN` 改成该域名并重新部署后端。

## 已知限制 / 后续改进

- Vercel Serverless Function 有最大执行时长限制，AI 分析接口可能受套餐限制影响
- Finnhub 免费层只支持美股
- 历史记录目前不区分用户，公开可见
- 监控数据保留无清理策略，建议加定时任务定期归档/删除旧日志
- 后续可加：用户认证、自选股、价格告警、技术指标图表、多语言
