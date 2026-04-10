// MIT License
// Copyright (c) 2026 kodebite <1572004866@qq.com>
// Permission is hereby granted, free of charge, to any person obtaining a copy...
// The above copyright notice and this permission notice shall be included in all copies.
// 
// MIT 许可证
// 版权所有 (c) 2026 kodebite <1572004866@qq.com>
// 特此免费授予任何获得本软件副本的人...
// 上述版权声明和本许可声明应包含在所有副本中。

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.dim}${getTime()}${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[OK]${colors.reset}   ${colors.dim}${getTime()}${colors.reset} ${colors.bright}${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}[ERR]${colors.reset}  ${colors.dim}${getTime()}${colors.reset} ${colors.bright}${colors.red}${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${colors.dim}${getTime()}${colors.reset} ${colors.yellow}${msg}${colors.reset}`),
    api: (method, path, status, time) => {
        const statusColor = status >= 200 && status < 300 ? colors.green : colors.red;
        console.log(
            `${colors.magenta}[API]${colors.reset}  ${colors.dim}${getTime()}${colors.reset} ` +
            `${colors.cyan}${method.padEnd(4)}${colors.reset} ${colors.bright}${path}${colors.reset} ` +
            `${statusColor}${status}${colors.reset} ${colors.dim}${time}ms${colors.reset}`
        );
    },
    proxy: (target) => console.log(`${colors.blue}[PROXY]${colors.reset} ${colors.dim}${getTime()}${colors.reset} → ${colors.underline}${target}${colors.reset}`),
    startup: () => {
        console.log('');
        console.log(`${colors.bright}${colors.bgCyan}${colors.black} 影视搜索代理服务 ${colors.reset}`);
        console.log(`${colors.dim}═══════════════════════════════════════${colors.reset}`);
        console.log('');
    }
};

function getTime() {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        log.api(req.method, req.path, res.statusCode, Date.now() - start);
    });
    next();
});

app.get('/api/search', async (req, res) => {
    const { wd, pg = 1 } = req.query;
    
    if (!wd) {
        log.warn('搜索参数缺失: wd');
        return res.status(400).json({ error: '缺少搜索关键词' });
    }
    
    const targetUrl = `https://bfzyapi.com/api.php/provide/vod/?ac=detail&wd=${encodeURIComponent(wd)}&pg=${pg}`;
    log.proxy(targetUrl);
    
    try {
        const response = await axios.get(targetUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        log.success(`搜索成功: "${wd}" 找到 ${response.data.list?.length || 0} 条结果`);
        res.json(response.data);
        
    } catch (error) {
        log.error(`代理请求失败: ${error.message}`);
        res.status(500).json({ 
            error: '代理请求失败', 
            message: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3000;

log.startup();
log.info('正在初始化服务...');

app.listen(PORT, () => {
    console.log('');
    log.success(`服务已启动！`);
    console.log(`${colors.dim}┌─────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.dim}│${colors.reset}  ${colors.bright}本地地址:${colors.reset} ${colors.cyan}http://localhost:${PORT}${colors.reset}      ${colors.dim}│${colors.reset}`);
    console.log(`${colors.dim}│${colors.reset}  ${colors.bright}API端点: ${colors.reset} ${colors.yellow}/api/search?wd=关键词${colors.reset}  ${colors.dim}│${colors.reset}`);
    console.log(`${colors.dim}│${colors.reset}  ${colors.bright}健康检查:${colors.reset} ${colors.yellow}/health${colors.reset}                 ${colors.dim}│${colors.reset}`);
    console.log(`${colors.dim}└─────────────────────────────────────┘${colors.reset}`);
    console.log('');
    log.info('等待请求中...');
    console.log('');
});

process.on('SIGTERM', () => {
    log.warn('收到终止信号，正在关闭...');
    process.exit(0);
});