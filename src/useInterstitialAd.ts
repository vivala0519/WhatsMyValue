import {useEffect, useRef} from 'react'
import {loadFullScreenAd, showFullScreenAd} from '@apps-in-toss/web-framework'

const testId = 'ait-ad-test-interstitial-id'
const adGroupId = import.meta.env.DEV ? testId : (import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || '').trim()

export function useInterstitialAd() {
  const showRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!adGroupId || !loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) return
    let disposed = false
    let ready = false
    let loading = false
    let unregisterLoad: (() => void) | undefined
    let unregisterShow: (() => void) | undefined

    const load = () => {
      if (disposed || loading || ready) return
      loading = true
      try {
        unregisterLoad = loadFullScreenAd({
          options: {adGroupId},
          onEvent: event => {
            if (disposed) return
            if (event.type === 'loaded') { loading = false; ready = true }
          },
          onError: () => { loading = false; ready = false },
        })
      } catch { loading = false; ready = false }
    }

    showRef.current = () => {
      if (!ready || disposed) { load(); return }
      ready = false
      try {
        unregisterShow = showFullScreenAd({
          options: {adGroupId},
          onEvent: event => {
            if (!disposed && (event.type === 'dismissed' || event.type === 'failedToShow')) load()
          },
          onError: () => { if (!disposed) load() },
        })
      } catch { load() }
    }
    load()
    return () => {
      disposed = true
      showRef.current = () => {}
      unregisterLoad?.()
      unregisterShow?.()
    }
  }, [])
  return showRef
}
