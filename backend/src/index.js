const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const stockRoute = require('./routes/stock');
const analyzeRoute = require('./routes/analyze');
const historyRoute = require('./routes/history');
const monitorRoute = require('./routes/monitor');

const app = express();

// Render / Heroku 等代理后端正确读取客户端 IP
app.set('trust proxy', 1);

app.use(
    cors({
        origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
        credentials: false,
    }),
);
app.use(express.json({ limit: '256kb' }));
app.use(requestLogger);
app.use(globalLimiter);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

app.use('/api/stock', stockRoute);
app.use('/api/analyze', analyzeRoute);
app.use('/api/history', historyRoute);
app.use('/api/monitor', monitorRoute);

app.use((req, res) => {
    res.status(404).json({ error: { type: 'not_found', message: `Route not found: ${req.method} ${req.path}` } });
});

app.use(errorHandler);

// 兜底：未捕获异常打印但不退出，保证服务存活
process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('[uncaughtException]', err);
});

app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`AIStock backend listening on :${config.port} (${config.nodeEnv})`);
});
