const config = require('./config');
const app = require('./app');

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
