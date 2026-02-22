# Cloudflare D1 导航站

一个使用 Cloudflare D1 数据库和 Workers 构建的静态网页导航站。

## 功能特性

- ✨ 静态页面，快速加载
- 🎨 现代化 UI 设计
- 🌙 暗黑模式支持
- 🔍 搜索功能
- 📂 分类管理
- 📱 响应式设计
- 🚀 部署在 Cloudflare 上

## 项目结构

```
nav-database/
├── worker.js          # Cloudflare Worker API
├── index.html         # 前端页面
├── schema.sql         # 数据库表结构
├── wrangler.toml      # Cloudflare 配置
├── init-db.js         # 数据库初始化脚本
├── pages-config.json  # Cloudflare Pages 配置
├── PAGES-DEPLOY.md    # Pages 部署详细指南
└── README.md          # 说明文档
```

## 🚀 快速部署

### 选择部署方式

- **Cloudflare Workers + Pages**: 完整部署指南
  - 查看 [PAGES-DEPLOY.md](./PAGES-DEPLOY.md) 了解详细步骤

### 部署步骤

### 1. 安装依赖

确保已安装 Node.js 和 Wrangler CLI：

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create nav-database

# 记录下返回的 database_id
```

### 4. 配置 wrangler.toml

编辑 `wrangler.toml` 文件：

```toml
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "your-database-id-here"  # 替换为步骤3中获取的ID
```

### 5. 初始化数据库

```bash
# 初始化数据库表结构
wrangler d1 execute nav-database --file=schema.sql

# 插入示例数据
wrangler d1 execute nav-database --file=init-db.js
```

### 6. 部署 Worker

```bash
# 部署 Worker
wrangler deploy
```

### 7. 更新前端配置

编辑 `index.html` 文件，修改 API_BASE：

```javascript
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';
```

### 8. 部署前端页面

将 `index.html` 部署到 Cloudflare Pages 或任何静态托管服务：

```bash
# 使用 Wrangler 部署静态文件
wrangler pages deploy index.html --project-name=nav-database
```

或者上传到：
- Cloudflare Pages
- GitHub Pages
- Netlify
- 任何静态托管服务

## 使用说明

### 添加链接

使用以下 API 添加新链接：

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "name": "示例网站",
    "url": "https://example.com",
    "category": "开发工具",
    "description": "网站描述",
    "icon": "fa-example",
    "sort_order": 1
  }'
```

### 删除链接

```bash
curl -X DELETE https://your-worker.your-subdomain.workers.dev/api/links/1
```

### 获取所有链接

```bash
curl https://your-worker.your-subdomain.workers.dev/api/links
```

### 获取分类

```bash
curl https://your-worker.your-subdomain.workers.dev/api/categories
```

## 数据库管理

### 查看所有数据

```bash
wrangler d1 execute nav-database --command="SELECT * FROM links"
```

### 查看特定分类

```bash
wrangler d1 execute nav-database --command="SELECT * FROM links WHERE category = '开发工具'"
```

### 删除所有数据

```bash
wrangler d1 execute nav-database --command="DELETE FROM links"
```

## 自定义

### 修改主题颜色

编辑 `index.html` 中的 CSS 变量：

```css
:root {
  --accent: #3b82f6;  /* 主色调 */
  --accent-hover: #2563eb;  /* 悬停颜色 */
}
```

### 添加新分类

在 `init-db.js` 中添加新分类的数据，或者通过 API 添加。

### 修改 API 端点

编辑 `index.html` 中的 `API_BASE` 变量。

## API 文档

### GET /api/links

获取所有链接。

**响应：**
```json
[
  {
    "id": 1,
    "name": "Google",
    "url": "https://www.google.com",
    "category": "搜索引擎",
    "description": "全球最大的搜索引擎",
    "icon": "fa-google",
    "sort_order": 1,
    "created_at": "2026-01-01 00:00:00"
  }
]
```

### GET /api/links/:category

获取特定分类的链接。

### POST /api/links

添加新链接。

**请求体：**
```json
{
  "name": "网站名称",
  "url": "https://example.com",
  "category": "分类",
  "description": "描述",
  "icon": "fa-icon",
  "sort_order": 1
}
```

### DELETE /api/links/:id

删除指定链接。

### GET /api/categories

获取所有分类。

## 技术栈

- **前端**: HTML + CSS + JavaScript (Vanilla)
- **后端**: Cloudflare Workers
- **数据库**: Cloudflare D1
- **图标**: Font Awesome

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
