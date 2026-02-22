# Cloudflare Worker 部署指南

本指南将帮助您部署 Cloudflare Worker（后端 API）。

## 前置准备

1. 已安装 Node.js
2. 已安装 Wrangler CLI
3. 已创建 Cloudflare 账户

## 步骤一：安装 Wrangler

```bash
npm install -g wrangler
```

验证安装：
```bash
wrangler --version
```

## 步骤二：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，授权 Wrangler 访问您的 Cloudflare 账户。

## 步骤三：创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create nav-database
```

**重要**：记录下返回的 `database_id`，格式类似：
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 步骤四：配置 wrangler.toml

打开 `wrangler.toml` 文件，修改以下内容：

```toml
name = "nav-database"
main = "worker.js"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "你的数据库ID"  # 替换为步骤三中获取的ID
```

**示例**：
```toml
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## 步骤五：初始化数据库

### 5.1 创建表结构

```bash
wrangler d1 execute nav-database --file=schema.sql
```

### 5.2 插入示例数据

```bash
wrangler d1 execute nav-database --file=init-db.js
```

**验证数据**：
```bash
wrangler d1 execute nav-database --command="SELECT * FROM links"
```

应该看到示例数据：
```
| id | name       | url                | category     | description       | icon    | sort_order |
|----|------------|--------------------|--------------|-------------------|---------|------------|
| 1  | Google     | https://www.google.com | 搜索引擎     | 全球最大的搜索引擎 | fa-google | 1          |
| 2  | GitHub     | https://github.com | 开发工具     | 代码托管平台      | fa-github | 2          |
...
```

## 步骤六：部署 Worker

```bash
wrangler deploy
```

部署成功后，会显示类似信息：
```
✨ Successfully deployed your Worker!
  https://nav-database.your-subdomain.workers.dev
```

**重要**：记录下这个 URL，后面部署 Pages 时需要用到！

## 步骤七：测试 Worker API

### 7.1 测试获取所有链接

```bash
curl https://nav-database.your-subdomain.workers.dev/api/links
```

### 7.2 测试获取分类

```bash
curl https://nav-database.your-subdomain.workers.dev/api/categories
```

### 7.3 测试添加链接

```bash
curl -X POST https://nav-database.your-subdomain.workers.dev/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试网站",
    "url": "https://example.com",
    "category": "工具",
    "description": "这是一个测试",
    "icon": "fa-test",
    "sort_order": 1
  }'
```

### 7.4 测试删除链接

```bash
curl -X DELETE https://nav-database.your-subdomain.workers.dev/api/links/1
```

## 步骤八：配置环境变量（可选）

如果需要配置环境变量，编辑 `wrangler.toml`：

```toml
[vars]
API_BASE_URL = "https://nav-database.your-subdomain.workers.dev"
```

然后重新部署：
```bash
wrangler deploy
```

## 常用命令

### 查看日志

```bash
wrangler tail
```

### 重新部署

```bash
wrangler deploy
```

### 查看数据库

```bash
# 查看所有数据
wrangler d1 execute nav-database --command="SELECT * FROM links"

# 查看特定分类
wrangler d1 execute nav-database --command="SELECT * FROM links WHERE category = '开发工具'"

# 查看数据库大小
wrangler d1 info nav-database
```

### 更新数据库

```bash
# 删除所有数据
wrangler d1 execute nav-database --command="DELETE FROM links"

# 重新初始化
wrangler d1 execute nav-database --file=init-db.js
```

## 验证部署

### 检查 Worker 是否正常运行

访问：https://nav-database.your-subdomain.workers.dev/api/links

应该返回 JSON 格式的链接数据。

### 检查 Worker 日志

在 Cloudflare Dashboard：
1. 进入 **Workers & Pages**
2. 选择您的 Worker
3. 查看 **Logs** 标签

## 常见问题

### Q1: 提示 "database_id is required"

**解决方案**：确保 `wrangler.toml` 中的 `database_id` 已正确配置。

### Q2: 提示 "Binding DB not found"

**解决方案**：检查 `wrangler.toml` 中的 `binding` 是否为 "DB"。

### Q3: 部署成功但 API 返回 404

**解决方案**：
1. 检查 Worker URL 是否正确
2. 查看浏览器控制台是否有 CORS 错误
3. 检查 `index.html` 中的 `API_BASE` 是否正确设置

### Q4: 数据库查询失败

**解决方案**：
1. 确认数据库已创建：`wrangler d1 list`
2. 确认数据库已绑定：检查 `wrangler.toml`
3. 手动测试 SQL：`wrangler d1 execute nav-database --command="SELECT 1"`

### Q5: 如何查看部署历史

```bash
wrangler deployments list
```

## 下一步

Worker 部署成功后，接下来可以：

1. **部署 Cloudflare Pages**：部署前端页面
   - 查看 [PAGES-DEPLOY.md](./PAGES-DEPLOY.md)

2. **添加更多功能**：
   - 添加用户认证
   - 添加管理后台
   - 添加更多 API 端点

3. **优化性能**：
   - 添加缓存
   - 优化数据库查询
   - 添加错误处理

## 需要帮助？

- Wrangler 文档：https://developers.cloudflare.com/workers/wrangler/
- D1 文档：https://developers.cloudflare.com/d1/
- Cloudflare Dashboard：https://dash.cloudflare.com/
