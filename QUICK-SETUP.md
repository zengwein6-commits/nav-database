# 快速部署完整方案（Worker + D1 数据库）

本指南将帮助您在 10 分钟内完成完整方案的部署。

## 前置准备

1. 已安装 Node.js
2. 已安装 Wrangler CLI（如果未安装）：
   ```bash
   npm install -g wrangler
   ```

## 步骤一：登录 Cloudflare

```bash
wrangler login
```

会打开浏览器，授权后返回终端。

## 步骤二：创建 Worker

```bash
wrangler init nav-database
```

**交互式配置：**
- **Choose an exporter**: npm
- **Choose a template**: Hello World
- **Create wrangler.toml in current directory**: Yes

## 步骤三：创建 D1 数据库

```bash
wrangler d1 create nav-database
```

记录下返回的 `database_id`，格式类似：
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 步骤四：配置 wrangler.toml

打开 `wrangler.toml`，修改以下内容：

```toml
name = "nav-database"
main = "worker.js"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "你的数据库ID"  # 替换为步骤三获取的ID
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

### 5.3 验证数据

```bash
wrangler d1 execute nav-database --command="SELECT * FROM links"
```

应该看到 8 条记录。

## 步骤六：更新 worker.js

打开 `worker.js`，替换为完整代码：

```javascript
// 导航站 API Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 获取所有链接
      if (path === '/api/links' && request.method === 'GET') {
        const links = await env.DB.prepare(
          'SELECT * FROM links ORDER BY category, sort_order, id'
        ).all();

        return new Response(JSON.stringify(links.results), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 根据分类获取链接
      if (path.startsWith('/api/links/') && request.method === 'GET') {
        const category = path.split('/')[3];
        const links = await env.DB.prepare(
          'SELECT * FROM links WHERE category = ? ORDER BY sort_order, id'
        ).bind(category).all();

        return new Response(JSON.stringify(links.results), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 添加新链接
      if (path === '/api/links' && request.method === 'POST') {
        const data = await request.json();

        // 验证必填字段
        if (!data.name || !data.url || !data.category) {
          return new Response(JSON.stringify({ error: '缺少必填字段' }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }

        const result = await env.DB.prepare(
          `INSERT INTO links (name, url, category, description, icon, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          data.name,
          data.url,
          data.category,
          data.description || '',
          data.icon || '',
          data.sort_order || 0
        ).run();

        if (result.success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }

        return new Response(JSON.stringify({ error: '添加失败' }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 删除链接
      if (path.startsWith('/api/links/') && request.method === 'DELETE') {
        const id = path.split('/')[3];

        const result = await env.DB.prepare('DELETE FROM links WHERE id = ?')
          .bind(id).run();

        if (result.success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }

        return new Response(JSON.stringify({ error: '删除失败' }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 获取所有分类
      if (path === '/api/categories' && request.method === 'GET') {
        const categories = await env.DB.prepare(
          'SELECT DISTINCT category FROM links ORDER BY category'
        ).all();

        return new Response(JSON.stringify(categories.results), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 404
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
```

## 步骤七：部署 Worker

```bash
wrangler deploy
```

部署成功后会显示：
```
✨ Successfully deployed your Worker!
  https://nav-database.your-subdomain.workers.dev
```

**重要：记住这个 URL！**

## 步骤八：获取 Worker URL

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 点击您的 Worker（不是 Pages）
4. 在页面顶部可以看到 **Worker URL**

**格式：**
```
https://nav-database.your-subdomain.workers.dev
```

## 步骤九：更新 index.html

打开 `index.html`，找到第 318 行，替换为您的 Worker URL：

```javascript
const API_BASE = 'https://nav-database.your-subdomain.workers.dev';
```

## 步骤十：部署前端

```bash
wrangler pages deploy index.html --project-name=nav-database
```

## 步骤十一：测试

访问您的 Pages URL：
```
https://nav-database.pages.dev
```

应该能看到导航站了！

## 快速检查清单

- [ ] 已安装 Wrangler
- [ ] 已登录 Cloudflare
- [ ] 已创建 Worker
- [ ] 已创建 D1 数据库
- [ ] 已配置 `wrangler.toml`
- [ ] 已初始化数据库（表 + 数据）
- [ ] 已部署 Worker
- [ ] 已获取 Worker URL
- [ ] 已更新 `index.html` 的 API_BASE
- [ ] 已部署前端

## 验证步骤

### 1. 测试 Worker API

```bash
# 测试获取链接
curl https://nav-database.your-subdomain.workers.dev/api/links

# 测试获取分类
curl https://nav-database.your-subdomain.workers.dev/api/categories
```

### 2. 测试前端

打开浏览器访问：
```
https://nav-database.pages.dev
```

应该能看到：
- ✅ 搜索框
- ✅ 分类标签
- ✅ 链接卡片
- ✅ 暗黑模式切换

## 常见问题

### Q1: wrangler init 后没有 worker.js

**解决：**
```bash
# 删除 wrangler.toml
rm wrangler.toml

# 重新初始化
wrangler init nav-database
```

### Q2: 部署 Worker 失败

**解决：**
```bash
# 检查配置
cat wrangler.toml

# 重新部署
wrangler deploy
```

### Q3: 数据库查询失败

**解决：**
```bash
# 检查数据库
wrangler d1 execute nav-database --command="SELECT * FROM links"

# 如果没有数据，重新初始化
wrangler d1 execute nav-database --file=init-db.js
```

## 下一步

部署成功后，您可以：

1. **添加更多链接**：通过 API 或直接操作数据库
2. **自定义主题**：修改 `index.html` 中的 CSS
3. **添加自定义域名**：在 Pages 设置中配置
4. **查看日志**：在 Cloudflare Dashboard 中监控

## 需要帮助？

- 查看详细文档：
  - DEPLOY-WORKER.md - Worker 部署
  - DATABASE-DASHBOARD.md - 数据库操作
  - TROUBLESHOOTING.md - 故障排查
