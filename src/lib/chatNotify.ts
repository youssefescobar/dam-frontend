/** Soft chime for inbound chat messages (no audio asset required). */
export function playChatNotifySound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime

    const tone = (freq: number, start: number, dur: number, gain = 0.045) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(gain, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur + 0.02)
    }

    tone(880, now, 0.12, 0.05)
    tone(1174, now + 0.1, 0.16, 0.035)

    window.setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 500)
  } catch {
    /* ignore autoplay / unsupported */
  }
}
