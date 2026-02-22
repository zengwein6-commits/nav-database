# Cloudflare Dashboard 部署 Worker

本指南将帮助您在 Cloudflare Dashboard 中直接部署 Worker，无需使用命令行。

## 前置检查

✅ 已在 Cloudflare Dashboard 创建 D1 数据库
✅ 已准备 `worker.js` 文件

## 步骤一：创建 Worker

### 1. 访问 Workers 页面

1. 访问：https://dash.cloudflare.com/
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Create Worker**

### 2. 配置 Worker

1. **Name**: 输入 `nav-database`
2. **Account**: 选择您的账户
3. **Region**: 选择 `Automatic` 或 `East`
4. 点击 **Deploy**

### 3. 进入 Worker 编辑页面

部署成功后，会自动打开 Worker 编辑页面。

## 步骤二：配置数据库绑定

### 1. 进入 Settings

在 Worker 编辑页面：
1. 点击 **Settings** 标签
2. 点击 **Variables** 或 **Bindings**

### 2. 添加 D1 数据库绑定

1. 点击 **Add binding**
2. **Variable name**: 输入 `DB`
3. **Database**: 选择 `nav-database`
4. 点击 **Add**

**重要**：确保 Variable name 是 `DB`（大写），这必须与 `worker.js` 中的 `env.DB` 对应。

## 步骤三：上传 worker.js 代码

### 1. 删除默认代码

在 **Edit code** 页面：
1. 点击 **Delete** 按钮
2. 确认删除

### 2. 创建新文件

1. 点击 **Create file**
2. 文件名：`worker.js`
3. 将以下代码复制粘贴到编辑器中：

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

### 3. 保存文件

1. 点击 **Save** 按钮
2. 等待保存完成

## 步骤四：部署 Worker

### 1. 点击 Deploy 按钮

在页面顶部点击 **Deploy** 按钮

### 2. 等待部署完成

部署成功后会显示：
```
✨ Successfully deployed your Worker!
```

### 3. 获取 Worker URL

部署成功后，页面顶部会显示您的 Worker URL：

```
https://nav-database.your-subdomain.workers.dev
```

**重要：复制并保存这个 URL！**

## 步骤五：测试 Worker

### 1. 访问 API 端点

在浏览器中打开：

```
https://nav-database.your-subdomain.workers.dev/api/links
```

**应该看到类似这样的 JSON 数据：**
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

### 2. 测试分类 API

```
https://nav-database.your-subdomain.workers.dev/api/categories
```

**应该看到：**
```json
[
  {"category": "搜索引擎"},
  {"category": "开发工具"},
  {"category": "视频网站"},
  {"category": "社交媒体"}
]
```

## 步骤六：更新 index.html

### 1. 下载或打开 index.html

打开项目中的 `index.html` 文件

### 2. 找到 API_BASE 配置

找到第 318 行左右：

```javascript
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';
```

### 3. 替换为您的 Worker URL

```javascript
const API_BASE = 'https://nav-database.your-subdomain.workers.dev';
```

### 4. 保存文件

## 步骤七：部署前端

### 方法一：使用 Dashboard

1. 回到 Cloudflare Dashboard
2. 进入 **Workers & Pages** > **Pages**
3. 点击 **Create application**
4. 选择 **Upload assets**
5. 上传 `index.html` 文件
6. 点击 **Save and Deploy**

### 方法二：使用 Wrangler

```bash
wrangler pages deploy index.html --project-name=nav-database
```

## 步骤八：测试前端

访问您的 Pages URL：

```
https://nav-database.pages.dev
```

应该能看到导航站了！

## 常用操作

### 查看日志

1. 在 Worker 页面点击 **Logs** 标签
2. 查看实时日志

### 修改代码

1. 在 **Edit code** 页面修改代码
2. 点击 **Deploy** 重新部署

### 重新部署

1. 点击 **Deploy** 按钮
2. 等待部署完成

### 查看部署历史

1. 点击 **Deployments** 标签
2. 查看所有部署记录

### 删除 Worker

1. 点击 **Settings** > **Delete**
2. 输入 Worker 名称确认
3. 点击 **Delete**

## 常见问题

### Q1: 部署后 API 返回 500 错误

**检查：**
1. 确认 D1 数据库绑定正确（Variable name 必须是 `DB`）
2. 确认数据库中有数据
3. 查看 Logs 标签获取详细错误

### Q2: 代码保存失败

**解决：**
1. 检查代码语法是否正确
2. 确保所有变量名与 `env.DB` 匹配
3. 重新复制粘贴代码

### Q3: 无法访问 API

**检查：**
1. 确认 Worker 已部署成功
2. 确认 URL 正确
3. 检查浏览器控制台是否有错误

### Q4: 如何更新数据库

**方法一：通过 SQL Editor**
1. 在 D1 页面点击 **Edit**
2. 进入 **SQL Editor**
3. 执行 SQL 语句

**方法二：通过 API**
```bash
curl -X POST https://nav-database.your-subdomain.workers.dev/api/links \
  -H "Content-Type: application/json" \
  -d '{"name": "新网站", "url": "https://example.com", "category": "工具", "sort_order": 1}'
```

## 最佳实践

1. **定期备份**：定期导出数据库
2. **查看日志**：定期检查 Worker 日志
3. **版本控制**：将代码保存到 Git 仓库
4. **测试部署**：每次部署后测试 API
5. **监控性能**：查看 Workers Analytics

## 下一步

部署成功后：

1. **部署前端**：完成步骤七
2. **自定义域名**：在 Pages 设置中配置
3. **添加更多链接**：使用 API 或 SQL
4. **查看日志**：监控 Worker 运行状态
5. **配置环境变量**：在 Settings 中添加

## 需要帮助？

- **Dashboard 部署**: 本文档
- **数据库操作**: `DATABASE-DASHBOARD.md`
- **故障排查**: `TROUBLESHOOTING.md`
