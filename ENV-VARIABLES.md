# 环境变量配置指南

本指南说明如何配置 Cloudflare Pages 和 Worker 的环境变量。

## 概述

项目使用环境变量来配置：
- **API_BASE_URL**: Pages URL（用于前端调用 Worker API）
- **DATABASE_ID**: D1 数据库 ID（用于 Worker 连接数据库）

---

## 方法一：Cloudflare Pages 配置（推荐）

### 步骤一：配置 Pages 环境变量

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **Pages** > 选择您的项目（nav-database）
3. 点击 **Settings** > **Environment variables**
4. 添加环境变量：

#### 添加 API_BASE_URL

- **Variable name**: `API_BASE_URL`
- **Value**: `https://nav-database.pages.dev`
- **Environment**: Production

#### 添加 DATABASE_ID（可选，用于 Worker）

- **Variable name**: `DATABASE_ID`
- **Value**: `你的数据库ID`
- **Environment**: Production

5. 点击 **Save**

### 步骤二：部署前端

```bash
wrangler pages deploy index.html --project-name=nav-database
```

或通过 Dashboard 点击 **Retry deployment**。

### 步骤三：更新 Worker

1. 进入 **Workers & Pages** > **Workers** > 点击您的 Worker
2. 点击 **Settings** > **Variables**
3. 添加环境变量：

#### 添加 DATABASE_ID

- **Variable name**: `DATABASE_ID`
- **Value**: `你的数据库ID`
- **Environment**: Production

4. 点击 **Save**
5. 点击 **Deploy** 重新部署 Worker

---

## 方法二：Dashboard 直接配置

### 配置 Pages 环境变量

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **Pages** > 选择您的项目
3. 点击 **Settings** > **Environment variables**
4. 添加环境变量（同上）

### 配置 Worker 环境变量

1. 进入 **Workers & Pages** > **Workers** > 点击您的 Worker
2. 点击 **Settings** > **Variables**
3. 添加环境变量

---

## 方法三：使用 Wrangler CLI

### 配置 Pages 环境变量

```bash
wrangler pages secret put API_BASE_URL --project-name=nav-database
```

输入值：`https://nav-database.pages.dev`

```bash
wrangler pages secret put DATABASE_ID --project-name=nav-database
```

输入值：`你的数据库ID`

### 配置 Worker 环境变量

```bash
wrangler secret put DATABASE_ID --name=nav-database
```

输入值：`你的数据库ID`

---

## 环境变量说明

### API_BASE_URL

- **用途**: 前端调用 Worker API 的地址
- **默认值**: `https://nav-database.pages.dev`
- **示例**: `https://nav-database.pages.dev` 或 `https://nav-database.your-subdomain.workers.dev`

### DATABASE_ID

- **用途**: Worker 连接 D1 数据库的 ID
- **格式**: UUID 格式，例如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **获取方式**:
  - 在 Cloudflare Dashboard > **Workers & Pages** > **D1** > 点击您的数据库
  - 页面顶部显示 `database_id`

---

## 环境变量优先级

1. **Cloudflare Pages 环境变量**（最高）
2. **Worker 环境变量**
3. **默认值**（最低）

如果配置了多个环境变量，Cloudflare Pages 的环境变量优先级最高。

---

## 验证环境变量

### 查看已配置的环境变量

#### Pages 环境变量

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **Pages** > 选择您的项目
3. 点击 **Settings** > **Environment variables**
4. 查看已配置的变量

#### Worker 环境变量

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** > **Workers** > 点击您的 Worker
3. 点击 **Settings** > **Variables**
4. 查看已配置的变量

### 测试环境变量

访问以下 URL 测试：

```
https://nav-database.pages.dev
```

如果页面正常加载，说明环境变量配置正确。

---

## 常见问题

### Q1: 环境变量不生效

**检查：**
1. 确认环境变量已正确配置
2. 确认环境变量名称完全匹配（区分大小写）
3. 确认环境选择正确（Production）
4. 重新部署项目

### Q2: 如何修改环境变量

1. 进入 **Settings** > **Environment variables**
2. 找到要修改的变量
3. 点击 **Edit**
4. 修改值
5. 点击 **Save**
6. 重新部署项目

### Q3: 如何删除环境变量

1. 进入 **Settings** > **Environment variables**
2. 找到要删除的变量
3. 点击 **Delete**
4. 确认删除
5. 重新部署项目

### Q4: 环境变量可以包含敏感信息吗？

**可以**，Cloudflare Pages 和 Worker 的环境变量是加密存储的。

---

## 安全建议

1. **不要**在代码中硬编码敏感信息
2. **不要**将环境变量提交到 Git 仓库
3. **定期**检查环境变量列表
4. **限制**环境变量的访问权限
5. **使用**强密码和密钥

---

## 项目中的环境变量使用

### index.html

```javascript
const API_BASE = API_BASE_URL || 'https://nav-database.pages.dev';
```

从环境变量 `API_BASE_URL` 读取，如果不存在则使用默认值。

### worker.js

```javascript
const databaseId = env.DATABASE_ID;
```

从环境变量 `DATABASE_ID` 读取。

---

## 下一步

配置完成后：

1. **部署前端**: `wrangler pages deploy index.html --project-name=nav-database`
2. **部署 Worker**: `wrangler deploy`
3. **测试功能**: 访问首页和管理后台
4. **添加链接**: 通过管理后台添加导航链接

---

## 需要帮助？

- **Pages 文档**: https://developers.cloudflare.com/pages/
- **Workers 文档**: https://developers.cloudflare.com/workers/
- **环境变量文档**: https://developers.cloudflare.com/workers/configuration/environment-variables/
