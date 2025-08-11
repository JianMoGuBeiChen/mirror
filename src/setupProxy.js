const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy WebSocket connections
  app.use(
    '/settings-sync',
    createProxyMiddleware({
      target: 'http://localhost:8889',
      changeOrigin: true,
      ws: true,
      pathRewrite: {
        '^/settings-sync': '/',
      },
      logLevel: 'silent',
    })
  );

  // Proxy HTTP settings API
  app.use(
    '/api/settings',
    createProxyMiddleware({
      target: 'http://localhost:8889',
      changeOrigin: true,
      pathRewrite: {
        '^/api/settings': '/settings',
      },
      logLevel: 'silent',
    })
  );
};
