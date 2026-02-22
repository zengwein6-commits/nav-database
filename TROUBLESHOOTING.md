# 故障排查指南

如果您打开网页后显示"加载失败，请稍后重试"，请按照以下步骤排查。

## 快速检查清单

### 1. 检查 Worker 是否部署成功

访问您的 Worker URL：

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
  },
  ...
]
```

### 2. 检查浏览器控制台错误

1. 打开网页
2. 按 **F12** 打开开发者工具
3. 点击 **Console** 标签
4. 查看是否有错误信息

**常见错误：**

#### 错误 1：CORS 错误
```
Access to fetch at 'https://...' from origin 'null' has been blocked by CORS policy
```

**解决方案：**
- 确认 Worker 已正确部署
- 检查 Worker CORS 配置（worker.js 中已配置）

#### 错误 2：API_BASE 配置错误
```
Failed to fetch
```

**解决方案：**
- 检查 `index.html` 中的 `API_BASE` 是否正确

#### 错误 3：网络错误
```
Network Error
```

**解决方案：**
- 确认网络连接正常
- 尝试访问 Worker URL 是否正常

---

## 详细排查步骤

### 步骤一：验证 Worker 部署

#### 方法 1：使用 curl 测试

```bash
curl https://nav-database.your-subdomain.workers.dev/api/links
```

如果返回 JSON 数据，说明 Worker 正常。

#### 方法 2：在浏览器中测试

直接在浏览器地址栏输入：
```
https://nav-database.your-subdomain.workers.dev/api/links
```

#### 方法 3：查看 Cloudflare Dashboard

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 点击您的 Worker
4. 查看 **Logs** 标签

**如果看到错误，查看具体错误信息。**

---

### 步骤二：检查 API_BASE 配置

打开 `index.html` 文件，找到第 360 行左右：

```javascript
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';
```

**重要：**
1. 替换 `your-worker.your-subdomain` 为您的实际 Worker URL
2. 确保没有多余的空格
3. 确保没有尾随斜杠

**正确的示例：**
```javascript
const API_BASE = 'https://nav-database.example.workers.dev';
```

**错误的示例：**
```javascript
const API_BASE = 'https://nav-database.example.workers.dev/';  // ❌ 有尾随斜杠
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';  // ❌ URL 错误
```

---

### 步骤三：检查数据库绑定

#### 1. 检查 wrangler.toml

打开 `wrangler.toml`，确认配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "你的数据库ID"
```

**检查点：**
- `binding` 必须是 "DB"（小写）
- `database_id` 必须正确
- 不要有多余的空格

#### 2. 重新部署 Worker

修改 `wrangler.toml` 后，必须重新部署：

```bash
wrangler deploy
```

---

### 步骤四：检查 Worker 日志

在 Cloudflare Dashboard 中查看 Worker 日志：

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 点击您的 Worker
4. 点击 **Logs** 标签

**常见错误信息：**

#### 错误：Database binding not found
```
Error: Database binding 'DB' not found
```

**解决方案：**
- 检查 `wrangler.toml` 中的 `binding` 是否为 "DB"
- 重新部署 Worker

#### 错误：Database not found
```
Error: Database not found
```

**解决方案：**
- 检查 `database_id` 是否正确
- 确认数据库已创建

#### 错误：No such table: links
```
Error: No such table: links
```

**解决方案：**
- 在数据库中创建表结构
- 参考 `DATABASE-DASHBOARD.md`

---

### 步骤五：清除浏览器缓存

有时候浏览器缓存会导致问题：

1. 打开网页
2. 按 **Ctrl + Shift + Delete** 打开清除缓存对话框
3. 选择 **缓存的图片和文件**
4. 点击 **清除数据**
5. 刷新页面

---

### 步骤六：检查网络连接

确保网络可以访问：

1. 测试访问 Google：https://www.google.com
2. 测试访问 Worker URL：https://nav-database.your-subdomain.workers.dev
3. 如果无法访问，可能是网络问题或防火墙

---

## 常见问题解决方案

### 问题 1：Worker 部署成功但 API 返回 404

**原因：** Worker URL 错误或 API 路径不正确

**解决方案：**
1. 确认 Worker URL：https://dash.cloudflare.com/ > Workers & Pages > 点击 Worker
2. 测试访问：https://nav-database.your-subdomain.workers.dev/api/links
3. 如果 404，说明 Worker URL 错误

---

### 问题 2：API 返回 500 错误

**原因：** 数据库查询错误

**解决方案：**
1. 查看 Worker 日志获取详细错误
2. 检查数据库中是否有数据
3. 测试数据库查询

```bash
wrangler d1 execute nav-database --command="SELECT * FROM links"
```

---

### 问题 3：API 返回 CORS 错误

**原因：** CORS 配置问题

**解决方案：**
1. 检查 `worker.js` 中的 CORS headers
2. 确认 CORS headers 已正确设置
3. 重新部署 Worker

---

### 问题 4：前端页面显示"加载中..."

**原因：** API 请求失败或超时

**解决方案：**
1. 打开浏览器控制台查看具体错误
2. 检查 API_BASE 配置
3. 确认 Worker 正常运行

---

## 调试模式

### 启用详细日志

在浏览器控制台中运行：

```javascript
// 测试 API 请求
fetch('https://nav-database.your-subdomain.workers.dev/api/links')
  .then(response => response.json())
  .then(data => console.log('API 返回数据:', data))
  .catch(error => console.error('API 错误:', error));

// 测试分类 API
fetch('https://nav-database.your-subdomain.workers.dev/api/categories')
  .then(response => response.json())
  .then(data => console.log('分类数据:', data))
  .catch(error => console.error('分类 API 错误:', error));
```

### 检查网络请求

1. 打开开发者工具（F12）
2. 点击 **Network** 标签
3. 刷新页面
4. 查看所有请求：
   - `api/links` - 应该返回 200
   - `api/categories` - 应该返回 200

**状态码检查：**
- **200 OK** - 正常
- **404 Not Found** - API 路径错误
- **500 Internal Server Error** - 服务器错误
- **CORS Error** - 跨域问题

---

## 快速修复脚本

如果您不确定问题所在，可以尝试以下步骤：

### 1. 重置所有配置

```bash
# 1. 检查 Worker 是否部署
wrangler deploy

# 2. 测试 API
curl https://nav-database.your-subdomain.workers.dev/api/links

# 3. 检查数据库
wrangler d1 execute nav-database --command="SELECT * FROM links"
```

### 2. 更新 index.html

确保 `API_BASE` 正确配置。

### 3. 重新部署

```bash
wrangler deploy
```

---

## 需要帮助？

如果以上步骤都无法解决问题，请提供以下信息：

1. **Worker URL**
2. **浏览器控制台错误信息**（截图或复制文本）
3. **Worker 日志**（截图或复制文本）
4. **数据库中是否有数据**

这些信息可以帮助我们快速定位问题。

---

## 成功标志

当一切正常时，您应该看到：

1. ✅ Worker URL 返回 JSON 数据
2. ✅ 浏览器控制台没有错误
3. ✅ Network 标签显示 200 状态码
4. ✅ 页面显示链接卡片
5. ✅ 可以搜索和切换分类
