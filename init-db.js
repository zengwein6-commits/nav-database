// 数据库初始化脚本
import { D1Database } from 'https://deno.land/x/d1@2.2.0/mod.ts';

// 示例数据 - 可以根据需要修改
const sampleData = [
  {
    name: 'Google',
    url: 'https://www.google.com',
    category: '搜索引擎',
    description: '全球最大的搜索引擎',
    icon: 'fa-google',
    sort_order: 1
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    category: '开发工具',
    description: '代码托管平台',
    icon: 'fa-github',
    sort_order: 2
  },
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    category: '开发工具',
    description: 'OpenAI AI助手',
    icon: 'fa-robot',
    sort_order: 3
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    category: '视频网站',
    description: '视频分享平台',
    icon: 'fa-youtube',
    sort_order: 1
  },
  {
    name: 'Bilibili',
    url: 'https://www.bilibili.com',
    category: '视频网站',
    description: '中国知名视频网站',
    icon: 'fa-bilibili',
    sort_order: 2
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    category: '开发工具',
    description: '程序员问答社区',
    icon: 'fa-stack-overflow',
    sort_order: 4
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com',
    category: '社交媒体',
    description: '社交媒体平台',
    icon: 'fa-twitter',
    sort_order: 1
  },
  {
    name: '微信',
    url: 'https://weixin.qq.com',
    category: '社交媒体',
    description: '即时通讯软件',
    icon: 'fa-weixin',
    sort_order: 2
  }
];

// 初始化数据库
async function initDB(db) {
  console.log('开始初始化数据库...');

  // 创建表
  console.log('创建表...');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 检查是否已有数据
  const count = await db.prepare('SELECT COUNT(*) as count FROM links').first();
  if (count.count > 0) {
    console.log('数据库已存在数据，跳过插入');
    return;
  }

  // 插入示例数据
  console.log('插入示例数据...');
  for (const data of sampleData) {
    await db.prepare(`
      INSERT INTO links (name, url, category, description, icon, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.url,
      data.category,
      data.description,
      data.icon,
      data.sort_order
    ).run();
  }

  console.log('数据库初始化完成！');
  console.log(`已插入 ${sampleData.length} 条示例数据`);
}

// 运行初始化
async function main() {
  const db = new D1Database(':memory:');
  await initDB(db);
  console.log('测试完成！');
}

main().catch(console.error);
