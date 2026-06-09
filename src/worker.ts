/**
 * NetworkPanel - Cloudflare Worker
 * 
 * 功能：
 * 1. 提供静态资源托管 (Vite 构建产物的 Assets)
 * 2. SPA 路由回退 (所有非静态资源路径指向 index.html)
 * 3. API 代理转发 (支持 CORS 头部处理)
 */

// 引用 Cloudflare Workers 类型（解决 VS Code 中 Fetcher 类型报红）
/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  /** 后端 API 地址，例如 "https://api.netart.cn" */
  API_TARGET?: string;
  /** 前端使用的 API 基础路径，例如 "/" 或 "/api/" */
  API_BASE_PATH?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========== 健康检查 ==========
    if (path === '/healthcheck') {
      return new Response('OK', { status: 200 });
    }

    // ========== API 代理 ==========
    // 如果配置了 API_TARGET，将 /api/* 或其他配置路径的请求代理到后端
    const apiBase = env.API_BASE_PATH || '/api/';
    if (env.API_TARGET && path.startsWith(apiBase)) {
      const targetPath = path.replace(apiBase, '/');
      const targetUrl = env.API_TARGET + targetPath + url.search;
      
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      });
      
      // 移除原始 Host 头部，避免透传
      proxyRequest.headers.delete('Host');
      
      try {
        const response = await fetch(proxyRequest);
        // 添加 CORS 头部
        const corsHeaders = new Headers(response.headers);
        corsHeaders.set('Access-Control-Allow-Origin', '*');
        corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'API proxy failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ========== CORS 预检请求 ==========
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ========== 静态资源服务 ==========
    const assetResponse = await env.ASSETS.fetch(request);
    
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // ========== SPA 路由回退 ==========
    // 如果请求的不是有扩展名的文件（如 .js, .css, .png 等），返回 index.html
    if (!path.match(/\.\w+$/)) {
      const indexUrl = new URL('/index.html', request.url);
      const indexRequest = new Request(indexUrl, request);
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      
      if (indexResponse.status === 200) {
        return indexResponse;
      }
    }

    // ========== 404 兜底 ==========
    return new Response('Not Found', { status: 404 });
  },
};