# GitHub 部署指南

本指南将帮助您将项目上传到 GitHub 并配置自动部署到 Cloudflare Pages。

## 方法一：使用 GitHub CLI（推荐）

### 1. 安装 GitHub CLI

**Windows:**
```bash
winget install --id GitHub.cli
```

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/ghcli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. 登录 GitHub

```bash
gh auth login
```

按照提示操作：
1. 选择您喜欢的认证方式（推荐：GitHub CLI）
2. 选择您的认证范围（推荐：全部）
3. 选择是否使用 HTTPS（推荐：HTTPS）

### 3. 创建 GitHub 仓库

```bash
# 在当前目录创建仓库（会自动初始化 Git）
gh repo create nav-database --public --source=. --remote=origin --push
```

或者手动创建：

```bash
# 1. 在 GitHub 网站上创建新仓库
#    https://github.com/new
#    仓库名：nav-database
#    设置为 Public
#    不要勾选 "Add a README file" 等选项

# 2. 返回终端，初始化 Git
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "Initial commit: Cloudflare D1 navigation site"

# 5. 添加远程仓库（替换为您的 GitHub 用户名）
git remote add origin https://github.com/your-username/nav-database.git

# 6. 推送代码
git branch -M main
git push -u origin main
```

### 4. 配置 Cloudflare Pages 自动部署

#### 在 GitHub 仓库中添加 Secrets

1. 访问您的 GitHub 仓库
2. 进入 **Settings** > **Secrets and variables** > **Actions**
3. 点击 **New repository secret**
4. 添加以下 secrets：

   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 您的 Cloudflare Account ID

#### 创建 GitHub Actions Workflow

在仓库中创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy-worker:
    runs-on: ubuntu-latest
    name: Deploy Worker
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Wrangler
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy Worker
        run: wrangler deploy

  deploy-pages:
    runs-on: ubuntu-latest
    name: Deploy Pages
    needs: deploy-worker
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Wrangler
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy Pages
        run: wrangler pages deploy index.html --project-name=nav-database
```

### 5. 测试自动部署

推送代码到 GitHub：

```bash
git add .
git commit -m "Update deployment workflow"
git push
```

进入 Cloudflare Dashboard > Workers & Pages，您应该会看到自动部署的项目。

## 方法二：使用 Git 命令行（手动方式）

### 1. 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 仓库名：`nav-database`
3. 设置为 Public
4. 点击 **Create repository**

### 2. 初始化本地 Git 仓库

```bash
# 进入项目目录
cd E:\halo\test\nav-database

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Cloudflare D1 navigation site"
```

### 3. 关联 GitHub 仓库

```bash
# 添加远程仓库（替换为您的 GitHub 用户名和仓库名）
git remote add origin https://github.com/your-username/nav-database.git

# 查看远程仓库
git remote -v
```

### 4. 推送到 GitHub

```bash
# 推送到 main 分支
git branch -M main
git push -u origin main
```

## 方法三：使用 GUI 工具

### GitHub Desktop

1. 下载并安装 GitHub Desktop: https://desktop.github.com/
2. 登录 GitHub 账户
3. **File** > **Add local repository**
4. 选择 `E:\halo\test\nav-database` 目录
5. **Publish repository**
6. 填写仓库名称和描述
7. 选择 Public 或 Private
8. 点击 **Publish repository**

### VS Code

1. 打开 VS Code
2. **Source Control** > **Open Repository**
3. 选择 `E:\halo\test\nav-database` 目录
4. **Source Control** > **Publish to GitHub**
5. 按提示登录并创建仓库

## 创建 Cloudflare Pages 项目

### 方法一：通过 GitHub 连接

1. 访问 Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages**
2. 选择 **Connect to Git**
3. 选择您的 GitHub 仓库
4. 选择分支：`main` 或 `master`
5. 构建设置：
   - Build command: 留空
   - Build output directory: 留空
   - Root directory: 留空
6. 点击 **Save and Deploy**

### 方法二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 Pages 项目（会自动连接到当前 Git 仓库）
wrangler pages project create nav-database --production-branch=main

# 部署到 Pages
wrangler pages deploy index.html --project-name=nav-database
```

## 验证部署

1. 访问 Cloudflare Dashboard > **Workers & Pages**
2. 选择您的 Pages 项目
3. 查看部署状态和 URL

## 常见问题

### Q1: 推送时提示 "remote origin already exists"

```bash
# 删除旧的远程仓库
git remote remove origin

# 重新添加
git remote add origin https://github.com/your-username/nav-database.git

# 再次推送
git push -u origin main
```

### Q2: 推送时提示认证失败

```bash
# 使用 GitHub CLI 推送（推荐）
gh repo set-default your-username/nav-database
git push
```

### Q3: GitHub Actions 部署失败

1. 检查 Secrets 是否正确配置
2. 检查 `wrangler.toml` 中的 database_id
3. 查看 GitHub Actions 日志获取详细错误

### Q4: 如何更新代码？

```bash
# 修改代码后
git add .
git commit -m "Update something"
git push
```

### Q5: 如何删除远程仓库？

1. 在 GitHub 网站上删除仓库
2. 或使用命令：
```bash
git remote remove origin
```

## 下一步

部署完成后，您可以：

1. **自定义域名**：在 Cloudflare Pages 设置中添加自定义域名
2. **配置环境变量**：在 Pages 设置中添加 API_BASE_URL
3. **查看日志**：在 Cloudflare Dashboard 查看访问日志
4. **监控性能**：使用 Cloudflare Analytics

## 需要帮助？

- GitHub 文档: https://docs.github.com/
- Wrangler 文档: https://developers.cloudflare.com/workers/wrangler/
- Cloudflare Pages 文档: https://developers.cloudflare.com/pages/
