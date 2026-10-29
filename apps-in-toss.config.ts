import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'whats-my-value',
  brand: { primaryColor: '#3182f6' },
  permissions: [],
  webView: { bounces: false, pullToRefreshEnabled: false },
  webBundleDir: 'dist',
})
