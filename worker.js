// 导航站 API Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

      // 更新链接
      if (path.startsWith('/api/links/') && request.method === 'PUT') {
        const id = path.split('/')[3];
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
          `UPDATE links
           SET name = ?, url = ?, category = ?, description = ?, icon = ?, sort_order = ?
           WHERE id = ?`
        ).bind(
          data.name,
          data.url,
          data.category,
          data.description || '',
          data.icon || '',
          data.sort_order || 0,
          id
        ).run();

        if (result.success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }

        return new Response(JSON.stringify({ error: '更新失败' }), {
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
