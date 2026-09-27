import { useEffect, useRef, useState } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4'

const MAX_FRAME_WIDTH = 1280
const MIN_FRAMES = 30
const MAX_FRAMES = 120
const FPS_TARGET = 24
const SMOOTHING = 0.1

function getScrollProgress() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  if (scrollHeight <= 0) return 0
  return Math.min(1, Math.max(0, window.scrollY / scrollHeight))
}

export default function ScrollVideo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null)
  const framesRef = useRef<ImageBitmap[]>([])
  const [framesReady, setFramesReady] = useState(false)

  // ---- Pre-extract frames into ImageBitmap[] ----
  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    const extractedBitmaps: ImageBitmap[] = []

    async function extractFrames() {
      try {
        const response = await fetch(VIDEO_URL)
        const blob = await response.blob()
        if (cancelled) return

        objectUrl = URL.createObjectURL(blob)

        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'
        video.src = objectUrl

        await new Promise<void>((resolve, reject) => {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true })
          video.addEventListener('error', () => reject(new Error('metadata failed')), {
            once: true,
          })
        })

        if (cancelled) return

        const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth)
        const targetWidth = Math.max(1, Math.round(video.videoWidth * scale))
        const targetHeight = Math.max(1, Math.round(video.videoHeight * scale))

        const frameCount = Math.min(
          MAX_FRAMES,
          Math.max(MIN_FRAMES, Math.round(video.duration * FPS_TARGET))
        )
        const seekableEnd = Math.max(0, video.duration - 0.05)

        for (let i = 0; i < frameCount; i++) {
          if (cancelled) break

          const time = frameCount === 1 ? 0 : (seekableEnd * i) / (frameCount - 1)

          await new Promise<void>((resolve, reject) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked)
              resolve()
            }
            const onError = () => {
              video.removeEventListener('error', onError)
              reject(new Error('seek failed'))
            }
            video.addEventListener('seeked', onSeeked, { once: true })
            video.addEventListener('error', onError, { once: true })
            video.currentTime = time
          })

          if (cancelled) break

          const bitmap = await createImageBitmap(video, {
            resizeWidth: targetWidth,
            resizeHeight: targetHeight,
            resizeQuality: 'high',
          })

          extractedBitmaps.push(bitmap)
        }

        if (!cancelled && extractedBitmaps.length > 0) {
          framesRef.current = extractedBitmaps
          setFramesReady(true)
        }
      } catch {
        // Extraction failed (or was cancelled); the fallback <video> keeps working.
      }
    }

    extractFrames()

    return () => {
      cancelled = true
      extractedBitmaps.forEach((bitmap) => bitmap.close())
      framesRef.current.forEach((bitmap) => bitmap.close())
      framesRef.current = []
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  // ---- Fallback <video> scrubbing (while frames aren't ready) ----
  useEffect(() => {
    if (framesReady) return

    const video = fallbackVideoRef.current
    if (!video) return

    let seeking = false
    let smoothed = 0
    let rafId: number

    const onSeeking = () => {
      seeking = true
    }
    const onSeeked = () => {
      seeking = false
    }
    video.addEventListener('seeking', onSeeking)
    video.addEventListener('seeked', onSeeked)

    function tick() {
      const target = getScrollProgress()
      smoothed += (target - smoothed) * SMOOTHING

      const duration = video!.duration || 0
      if (duration > 0 && !seeking) {
        const desired = smoothed * duration
        if (Math.abs(desired - video!.currentTime) > 0.001) {
          video!.currentTime = desired
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [framesReady])

  // ---- Canvas draw loop (once frames are ready) ----
  useEffect(() => {
    if (!framesReady) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    let smoothed = 0
    let lastIndex = -1

    function resizeCanvas() {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas!.width = Math.round(canvas!.clientWidth * dpr)
      canvas!.height = Math.round(canvas!.clientHeight * dpr)
      lastIndex = -1 // force redraw at new resolution
    }

    function drawFrame(bitmap: ImageBitmap) {
      const canvasRatio = canvas!.width / canvas!.height
      const frameRatio = bitmap.width / bitmap.height
      const scale =
        canvasRatio > frameRatio ? canvas!.width / bitmap.width : canvas!.height / bitmap.height

      const drawWidth = bitmap.width * scale
      const drawHeight = bitmap.height * scale
      const offsetX = (canvas!.width - drawWidth) / 2
      const offsetY = (canvas!.height - drawHeight) / 2

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight)
    }

    function tick() {
      const target = getScrollProgress()
      smoothed += (target - smoothed) * SMOOTHING

      const frames = framesRef.current
      if (frames.length > 0) {
        const index = Math.min(frames.length - 1, Math.floor(smoothed * frames.length))
        if (index !== lastIndex) {
          lastIndex = index
          drawFrame(frames[index])
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const onScroll = () => {}
    window.addEventListener('scroll', onScroll, { passive: true })

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('scroll', onScroll)
    }
  }, [framesReady])

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!framesReady && (
        <video
          ref={fallbackVideoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
