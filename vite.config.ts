import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => {
  if (mode === 'toss') {
    const id = loadEnv(mode, process.cwd(), 'VITE_').VITE_INTERSTITIAL_AD_GROUP_ID?.trim()
    if (!id || id.startsWith('ait-ad-test-')) {
      throw new Error('앱인토스 빌드에는 라이브 VITE_INTERSTITIAL_AD_GROUP_ID가 필요합니다.')
    }
  }
  return {
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5174, strictPort: true, watch: { ignored: ['**/artifacts/**'] } },
  }
})
