# AI Stock Analysis Dashboard

一个全栈 AI 股票分析面板：用户输入股票代码 → 获取实时行情 → 调用 LLM 生成结构化分析 → 持久化到 Supabase，并提供历史记录与监控页面。

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS + React Router
- **后端**：Node.js + Express
- **数据库**：Supabase (PostgreSQL)
- **AI**：DeepSeek API (OpenAI 兼容)
- **股票数据**：Finnhub API
- **部署**：Render.com

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

## 部署到 Render

部署顺序：**Supabase → backend → frontend**。先部署 backend 拿到域名，再用该域名配置 frontend。

### 后端（Web Service）

1. Render Dashboard → New → Web Service → 连接仓库
2. 配置：
   - **Name**: `aistock-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Environment Variables：
   ```
   NODE_ENV=production
   FINNHUB_API_KEY=<your key>
   DEEPSEEK_API_KEY=<your key>
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   SUPABASE_URL=<your supabase project url>
   SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
   CORS_ORIGIN=<frontend Render URL，先填 * 部署完再回填>
   ```
4. 部署后记录 backend URL，例如 `https://aistock-backend.onrender.com`

### 前端（Static Site）

1. Render Dashboard → New → Static Site → 连接仓库
2. 配置：
   - **Name**: `aistock-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Environment Variables：
   ```
   VITE_API_BASE_URL=https://aistock-backend.onrender.com
   ```
4. Redirects/Rewrites（SPA 路由必需）：
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

### 回填 CORS

前端部署完拿到域名（如 `https://aistock-frontend.onrender.com`）后，回到 backend 的 Environment 把 `CORS_ORIGIN` 改成该域名，Render 会自动重新部署。

## 已知限制 / 后续改进

- Render 免费层 backend 闲置 15 分钟会冷启动，首次请求慢约 30s
- Finnhub 免费层只支持美股
- 历史记录目前不区分用户，公开可见
- 监控数据保留无清理策略，建议加定时任务定期归档/删除旧日志
- 后续可加：用户认证、自选股、价格告警、技术指标图表、多语言
