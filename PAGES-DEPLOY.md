# Cloudflare Pages 部署指南

本指南将帮助您通过 Cloudflare Pages 部署导航站。

## 前置准备

1. 安装 Wrangler CLI
2. 已创建 Cloudflare 账户
3. 已完成 Worker 和 D1 数据库的创建（参考 README.md）

## 方法一：使用 Wrangler CLI 部署（推荐）

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 部署前端页面

```bash
cd nav-database
wrangler pages deploy index.html --project-name=nav-database
```

这会将 `index.html` 部署到 Cloudflare Pages。

### 4. 获取部署 URL

部署完成后，会显示类似以下的 URL：
```
https://nav-database.pages.dev
```

### 5. 修改 API 地址

编辑 `index.html`，找到第 360 行左右的代码：

```javascript
// 将这行
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';

// 改为您的 Worker URL
const API_BASE = 'https://nav-database.你的子域名.workers.dev';
```

### 6. 重新部署

```bash
wrangler pages deploy index.html --project-name=nav-database
```

## 方法二：通过 Cloudflare Dashboard 部署

### 1. 访问 Cloudflare Dashboard

登录 https://dash.cloudflare.com/

### 2. 进入 Pages

左侧菜单选择 **Workers & Pages** > **Create application** > **Pages**

### 3. 连接 Git 仓库

选择 **Connect to Git**，然后：
- 如果您有 GitHub/GitLab/Bitbucket 仓库：连接您的仓库
- 如果没有仓库：选择 **Upload assets** 直接上传文件

### 4. 上传文件

如果选择 **Upload assets**：
1. 点击 **Upload assets**
2. 上传 `index.html` 文件
3. 点击 **Save and Deploy**

### 5. 配置构建设置

如果使用 Git 仓库：
1. 构建命令留空（静态文件）
2. 构建输出目录留空（静态文件）
3. 环境变量（可选）：
   - `API_BASE_URL`: 您的 Worker URL

### 6. 等待部署完成

部署完成后，会自动分配一个 URL：
```
https://your-project.pages.dev
```

## 方法三：使用 GitHub Actions 自动部署

### 1. 创建 GitHub 仓库

将 `nav-database` 文件夹上传到 GitHub 仓库。

### 2. 创建 Cloudflare Pages 项目

在 Cloudflare Dashboard 中创建 Pages 项目，连接到 GitHub 仓库。

### 3. 配置 Workflow

在仓库根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Wrangler
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy
        run: wrangler pages deploy index.html --project-name=nav-database
```

### 4. 添加 Cloudflare API Token

在 GitHub 仓库设置中添加环境变量：
- Name: `CLOUDFLARE_API_TOKEN`
- Value: 您的 Cloudflare API Token

### 5. 推送代码触发部署

```bash
git add .
git commit -m "Update deployment"
git push origin main
```

## 自定义域名

### 1. 在 Pages 项目设置中添加自定义域名

在 Cloudflare Dashboard 中：
1. 选择您的 Pages 项目
2. 进入 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入您的域名（如 `nav.example.com`）
5. 按照提示配置 DNS

### 2. 配置 DNS

Cloudflare 会自动配置 DNS 记录，您也可以手动添加：
- Type: CNAME
- Name: nav
- Target: `your-project.pages.dev`

## 测试部署

部署完成后，访问您的 Pages URL：
```
https://nav-database.pages.dev
```

测试功能：
- [ ] 搜索功能是否正常
- [ ] 分类切换是否正常
- [ ] 暗黑模式切换是否正常
- [ ] 链接是否可以正常打开

## 常见问题

### Q1: API 请求失败，显示 CORS 错误

**解决方案**：
1. 确认 Worker 已正确部署
2. 检查 Worker URL 是否正确
3. 查看 Worker 日志：Dashboard > Workers > 选择 Worker > Logs

### Q2: 页面无法加载图标

**解决方案**：
确保网络可以访问 cdnjs.cloudflare.com

### Q3: 数据库连接失败

**解决方案**：
1. 检查 `wrangler.toml` 中的 database_id 是否正确
2. 确认 D1 数据库已创建并绑定到 Worker
3. 查看 Worker 日志获取详细错误信息

### Q4: 如何更新内容？

**方法一：通过 API**
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/links \
  -H "Content-Type: application/json" \
  -d '{"name": "新网站", "url": "https://example.com", "category": "工具", "sort_order": 1}'
```

**方法二：直接修改数据库**
```bash
wrangler d1 execute nav-database --command="INSERT INTO links (name, url, category, sort_order) VALUES ('新网站', 'https://example.com', '工具', 1)"
```

## 监控和维护

### 查看访问日志

在 Cloudflare Dashboard 中：
1. 选择 Workers & Pages
2. 点击您的项目
3. 进入 **Logs** 查看访问日志

### 更新前端

```bash
# 使用 Wrangler
wrangler pages deploy index.html --project-name=nav-database

# 或通过 Git 自动部署
git add index.html
git commit -m "Update UI"
git push
```

### 更新 Worker

```bash
wrangler deploy
```

## 下一步优化

1. **添加管理后台**：创建一个简单的管理界面来添加/编辑/删除链接
2. **添加搜索高亮**：优化搜索体验
3. **添加更多图标**：支持更多网站图标
4. **添加收藏功能**：允许用户收藏常用网站
5. **添加统计**：记录访问量和使用情况

## 技术支持

如有问题，请查看：
- Cloudflare Pages 文档：https://developers.cloudflare.com/pages/
- Wrangler 文档：https://developers.cloudflare.com/workers/wrangler/
- 问题反馈：提交 Issue
