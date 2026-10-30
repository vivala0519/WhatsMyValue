import {useEffect, useRef} from 'react'
import {loadFullScreenAd, showFullScreenAd} from '@apps-in-toss/web-framework'

const testId = 'ait-ad-test-interstitial-id'
const adGroupId = import.meta.env.DEV ? testId : (import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || '').trim()

export function useInterstitialAd() {
  const showRef = useRef<(onComplete: () => void) => void>(onComplete => onComplete())

  useEffect(() => {
    if (!adGroupId) return
    // The SDK support checks can throw when the native Toss bridge is absent.
    try {
      if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) return
    } catch {
      return
    }
    let disposed = false
    let ready = false
    let loading = false
    let showing = false
    let unregisterLoad: (() => void) | undefined
    let unregisterShow: (() => void) | undefined

    const load = () => {
      if (disposed || loading || ready || showing) return
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

    showRef.current = onComplete => {
      if (showing) return
      if (!ready || disposed) { onComplete(); return }
      ready = false
      showing = true
      let completed = false
      const finish = () => {
        if (completed || disposed) return
        completed = true
        showing = false
        onComplete()
        load()
      }
      try {
        unregisterShow = showFullScreenAd({
          options: {adGroupId},
          onEvent: event => {
            if (event.type === 'dismissed' || event.type === 'failedToShow') finish()
          },
          onError: finish,
        })
      } catch { finish() }
    }
    load()
    return () => {
      disposed = true
      showRef.current = onComplete => onComplete()
      unregisterLoad?.()
      unregisterShow?.()
    }
  }, [])
  return showRef
}
