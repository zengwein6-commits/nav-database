# Cloudflare Dashboard 数据库操作指南

本指南将帮助您在 Cloudflare Dashboard 中直接操作 D1 数据库，无需使用命令行。

## 前置准备

1. 已安装 Wrangler（用于创建数据库）
2. 已登录 Cloudflare Dashboard

## 步骤一：创建 D1 数据库

### 方法一：使用 Wrangler 创建（推荐）

```bash
wrangler d1 create nav-database
```

记录下返回的 `database_id`。

### 方法二：在 Dashboard 中创建

1. 访问：https://dash.cloudflare.com/
2. 左侧菜单选择 **Workers & Pages** > **D1**
3. 点击 **Create database**
4. 输入数据库名称：`nav-database`
5. 选择区域（建议选择 `Automatic` 或 `East`）
6. 点击 **Create database**

## 步骤二：打开数据库管理界面

1. 在 D1 页面，找到刚创建的 `nav-database`
2. 点击 **Edit** 按钮
3. 系统会自动打开数据库管理页面

## 步骤三：创建表结构

在数据库管理界面中：

### 方法一：使用 SQL 编辑器

1. 点击 **SQL Editor** 标签
2. 点击 **New query**
3. 粘贴以下 SQL 语句：

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

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_sort_order ON links(sort_order);
```

4. 点击 **Run query** 执行

### 方法二：分步执行

**创建表：**
```sql
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
```

**创建索引：**
```sql
CREATE INDEX IF NOT EXISTS idx_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_sort_order ON links(sort_order);
```

## 步骤四：插入示例数据

在 SQL Editor 中执行以下 SQL：

```sql
-- 插入示例数据
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

点击 **Run query** 执行。

## 步骤五：验证数据

### 方法一：查看所有数据

在 SQL Editor 中执行：
```sql
SELECT * FROM links;
```

应该看到 8 条记录。

### 方法二：查看特定分类

```sql
-- 查看开发工具分类
SELECT * FROM links WHERE category = '开发工具';

-- 查看搜索引擎分类
SELECT * FROM links WHERE category = '搜索引擎';
```

### 方法三：查看分类列表

```sql
SELECT DISTINCT category FROM links;
```

## 步骤六：配置 wrangler.toml

打开 `wrangler.toml` 文件，修改 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "nav-database"
database_id = "你的数据库ID"  # 替换为 Dashboard 中显示的 ID
```

**如何获取 database_id：**
1. 在 Cloudflare Dashboard 中，进入 Workers & Pages > D1
2. 点击 `nav-database` 右侧的 **Edit**
3. 在页面顶部可以看到 `database_id`

## 步骤七：部署 Worker

配置完成后，部署 Worker：

```bash
wrangler deploy
```

## 常用 SQL 操作

### 查询数据

```sql
-- 查看所有链接
SELECT * FROM links;

-- 按分类查看
SELECT * FROM links WHERE category = '开发工具';

-- 搜索名称
SELECT * FROM links WHERE name LIKE '%Google%';

-- 排序
SELECT * FROM links ORDER BY sort_order, id;

-- 分页查询
SELECT * FROM links LIMIT 10 OFFSET 0;
```

### 插入数据

```sql
-- 插入单个链接
INSERT INTO links (name, url, category, description, icon, sort_order)
VALUES ('示例网站', 'https://example.com', '工具', '网站描述', 'fa-example', 1);

-- 批量插入
INSERT INTO links (name, url, category, description, icon, sort_order)
VALUES
  ('网站1', 'https://site1.com', '工具', '描述1', 'fa-site1', 1),
  ('网站2', 'https://site2.com', '工具', '描述2', 'fa-site2', 2);
```

### 更新数据

```sql
-- 更新链接信息
UPDATE links
SET description = '新的描述'
WHERE id = 1;

-- 修改排序
UPDATE links SET sort_order = 5 WHERE id = 1;
```

### 删除数据

```sql
-- 删除单个链接
DELETE FROM links WHERE id = 1;

-- 删除特定分类的所有链接
DELETE FROM links WHERE category = '开发工具';

-- 删除所有数据
DELETE FROM links;
```

### 统计数据

```sql
-- 统计每个分类的链接数量
SELECT category, COUNT(*) as count
FROM links
GROUP BY category;

-- 统计总链接数
SELECT COUNT(*) FROM links;
```

## 数据库管理

### 查看所有数据库

在 Cloudflare Dashboard > Workers & Pages > D1 页面可以看到所有数据库。

### 备份数据库

```sql
-- 导出为 SQL 文件
-- 在 SQL Editor 中执行
-- 然后点击 **Export** 下载 SQL 文件
```

### 删除数据库

**警告：此操作不可逆！**

1. 在 D1 页面，找到 `nav-database`
2. 点击 **Delete** 按钮
3. 确认删除

## 高级操作

### 创建视图

```sql
-- 创建一个简化视图
CREATE VIEW link_summary AS
SELECT
    id,
    name,
    url,
    category,
    icon
FROM links
ORDER BY sort_order, id;
```

### 创建触发器

```sql
-- 创建自动时间戳触发器
CREATE TRIGGER update_timestamp
AFTER UPDATE ON links
FOR EACH ROW
BEGIN
    UPDATE links
    SET created_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;
```

### 添加新字段

```sql
-- 添加新字段
ALTER TABLE links ADD COLUMN status TEXT DEFAULT 'active';

-- 添加索引
CREATE INDEX idx_status ON links(status);
```

## 常见问题

### Q1: SQL Editor 中无法执行

**解决方案**：
1. 确认已选择正确的数据库
2. 检查 SQL 语法是否正确
3. 查看错误提示，根据提示修改

### Q2: 插入数据时提示错误

**常见错误**：
- `UNIQUE constraint failed`: ID 重复，检查是否已存在
- `NOT NULL constraint failed`: 必填字段为空
- 语法错误：检查 SQL 语句是否正确

### Q3: 如何查看执行计划

```sql
EXPLAIN QUERY PLAN
SELECT * FROM links WHERE category = '开发工具';
```

### Q4: 数据库性能优化

```sql
-- 分析表
ANALYZE TABLE links;

-- 重建索引
REINDEX TABLE links;

-- 查看表大小
SELECT
    name,
    sql
FROM sqlite_master
WHERE type='table';
```

## 最佳实践

1. **备份重要数据**：定期备份数据库
2. **使用事务**：批量操作时使用事务
3. **优化索引**：根据查询需求添加索引
4. **定期清理**：删除不需要的数据
5. **监控性能**：定期查看数据库性能

## 下一步

数据库初始化完成后：

1. **配置 wrangler.toml**：设置 database_id
2. **部署 Worker**：运行 `wrangler deploy`
3. **部署 Pages**：部署前端页面
4. **测试功能**：确保 API 正常工作

## 需要帮助？

- Cloudflare D1 文档：https://developers.cloudflare.com/d1/
- SQL 参考：https://www.sqlite.org/lang.html
