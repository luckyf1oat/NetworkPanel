# NetworkPanel Cloudflare Workers 部署指南

## 📋 前提条件

- Node.js 18+
- Cloudflare 账号
- 已配置好的域名（可选，可使用 workers.dev 域名）

## 🚀 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 Cloudflare Dashboard 中设置以下 secret：

```bash
# 后端 API 地址（例如：https://app.netart.cn）
npx wrangler secret put API_TARGET
# 输入: https://app.netart.cn
```

或者使用 `.env` 文件（仅用于 Vite 构建）：

```env
VITE_API_URL=//app.netart.cn/network-panel/
```

### 3. 构建并部署

```bash
# 构建前端 + 部署到 Cloudflare Workers
npm run deploy

# 仅构建预览
npm run build-only

# 仅部署（跳过构建）
npx wrangler deploy
```

### 4. 首次部署验证

```bash
# 访问你的 Worker URL
curl https://network-panel.<your-subdomain>.workers.dev/healthcheck
# 应返回: OK
```

## ⚙️ 配置说明

### wrangler.toml

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `name` | Worker 名称 | `network-panel` |
| `compatibility_date` | 运行时兼容日期 | `2024-12-01` |
| `assets.directory` | 静态资源目录 | `./dist` |

### Worker 环境变量 (Secrets)

| 变量 | 说明 | 必需 |
|------|------|------|
| `API_TARGET` | 后端 API 地址，如 `https://app.netart.cn` | 否（不配置则无API代理） |
| `API_BASE_PATH` | API 代理基础路径，默认 `/api/` | 否 |

## 🌐 自定义域名

```bash
# 添加自定义域名
npx wrangler routes add network-panel --pattern "your-domain.com/*"
```

或在 Cloudflare Dashboard > Workers & Pages > network-panel > Triggers > Custom Domains 中添加。

## 📦 构建产物

部署后的 `dist/` 目录结构：

```
dist/
├── index.html                  # SPA 入口
├── icon.png                    # 图标
├── icon-fill.png               # 填充图标
├── manifest.webmanifest        # PWA Manifest
└── assets/
    ├── index-*.js              # 应用 JS
    ├── vendor-*.js             # 依赖库 JS
    ├── index-*.css             # 应用样式
    ├── vendor-*.css            # 依赖库样式
    └── DingTalk-simple-*.ttf  # 全屏模式字体
```

## 🔧 本地预览

```bash
# 构建后本地预览（使用 Wrangler 模拟 Workers 环境）
npx wrangler dev

# 或使用 Vite 开发模式
npm run dev
```

## 📝 注意事项

1. **CORS**：Worker 会自动为 API 代理请求添加 CORS 头部
2. **SPA 路由**：所有无扩展名的请求都会回退到 `index.html`
3. **静态资源**：Cloudflare 会自动缓存静态资源并实现全球加速
4. **免费额度**：Workers 免费计划每天 10 万次请求，足够个人使用
5. **API 密钥**：后端 API 密钥等敏感信息请使用 `wrangler secret put` 设置，不要硬编码