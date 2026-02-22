# 部署 Worker（D1 数据库已创建）

本指南帮助您在 D1 数据库已创建的情况下，快速部署 Worker。

## 前置检查

✅ 已在 Cloudflare Dashboard 创建 D1 数据库
✅ 已安装 Wrangler CLI

## 步骤一：配置 wrangler.toml

打开 `wrangler.toml` 文件，修改以下内容：

```toml
name = "nav-database"
main = "worker.js"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "你的数据库ID"  # 在 Cloudflare Dashboard 中查看
```

**如何获取 database_id：**
1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **D1**
3. 点击您的数据库（nav-database）
4. 在页面顶部可以看到 `database_id`

## 步骤二：创建数据库表结构

在 Cloudflare Dashboard 中：

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **D1**
3. 点击您的数据库（nav-database）> **Edit**
4. 点击 **SQL Editor**
5. 执行以下 SQL：

```sql
-- 导航链接表
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_sort_order ON links(sort_order);
```

点击 **Run query**

## 步骤三：插入示例数据

在 SQL Editor 中执行：

```sql
INSERT INTO links (name, url, category, description, icon, sort_order)
VALUES
  ('Google', 'https://www.google.com', '搜索引擎', '全球最大的搜索引擎', 'fa-google', 1),
  ('GitHub', 'https://github.com', '开发工具', '代码托管平台', 'fa-github', 2),
  ('ChatGPT', 'https://chat.openai.com', '开发工具', 'OpenAI AI助手', 'fa-robot', 3),
  ('YouTube', 'https://www.youtube.com', '视频网站', '视频分享平台', 'fa-youtube', 1),
  ('Bilibili', 'https://www.bilibili.com', '视频网站', '中国知名视频网站', 'fa-bilibili', 2),
  ('Stack Overflow', 'https://stackoverflow.com', '开发工具', '程序员问答社区', 'fa-stack-overflow', 4),
  ('Twitter', 'https://twitter.com', '社交媒体', '社交媒体平台', 'fa-twitter', 1),
  ('微信', 'https://weixin.qq.com', '社交媒体', '即时通讯软件', 'fa-weixin', 2);
```

点击 **Run query**

## 步骤四：验证数据库

在 SQL Editor 中执行：

```sql
SELECT * FROM links;
```

应该看到 8 条记录。

## 步骤五：更新 worker.js

确保 `worker.js` 文件内容完整，包含以下代码：

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

## 步骤六：部署 Worker

```bash
wrangler deploy
```

部署成功后会显示：

```
✨ Successfully deployed your Worker!
  https://nav-database.your-subdomain.workers.dev
```

**重要：记住这个 URL！**

## 步骤七：获取 Worker URL

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 点击您的 Worker
4. 在页面顶部可以看到 **Worker URL**

**格式：**
```
https://nav-database.your-subdomain.workers.dev
```

## 步骤八：测试 Worker

在浏览器中访问：

```
https://nav-database.your-subdomain.workers.dev/api/links
```

应该看到 JSON 格式的链接数据。

## 步骤九：更新 index.html

打开 `index.html`，找到第 318 行：

```javascript
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';
```

替换为您的 Worker URL：

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

## 验证数据库连接

在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages**
2. 点击您的 Worker
3. 点击 **Logs** 标签
4. 访问 API，查看日志

## 常见问题

### Q1: wrangler deploy 失败

**检查配置：**
```bash
cat wrangler.toml
```

确保 `database_id` 正确。

### Q2: Worker 返回 500 错误

**查看日志：**
1. 在 Cloudflare Dashboard 中查看 Worker Logs
2. 检查错误信息

**常见原因：**
- database_id 错误
- 数据库表不存在
- 数据库中没有数据

### Q3: 如何添加新链接

**方法一：通过 API**
```bash
curl -X POST https://nav-database.your-subdomain.workers.dev/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新网站",
    "url": "https://example.com",
    "category": "工具",
    "description": "网站描述",
    "icon": "fa-example",
    "sort_order": 1
  }'
```

**方法二：在 Dashboard 中**
1. 进入 **Workers & Pages** > **D1**
2. 点击您的数据库 > **Edit** > **SQL Editor**
3. 执行：
```sql
INSERT INTO links (name, url, category, description, icon, sort_order)
VALUES ('新网站', 'https://example.com', '工具', '描述', 'fa-example', 1);
```

## 下一步

部署成功后：

1. **部署前端**：完成步骤十
2. **自定义域名**：在 Pages 设置中配置
3. **添加更多链接**：使用 API 或 SQL
4. **查看日志**：监控 Worker 运行状态
