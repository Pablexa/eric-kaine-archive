// Live call microphone capture: downsamples the mic to 16 kHz mono and posts
// signed 16-bit PCM frames of 640 samples (40 ms) to the main thread.
const TARGET = 16000
const FRAME = 640

class LiveCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.ratio = sampleRate / TARGET
    this.frame = new Int16Array(FRAME)
    this.n = 0
    this.pos = 0
    this.acc = 0
    this.count = 0
    this.peak = 0
  }

  process(inputs, outputs) {
    const input = inputs[0] && inputs[0][0]
    // keep the (silent) output alive so the node is always pulled
    if (outputs[0] && outputs[0][0]) outputs[0][0].fill(0)
    if (!input) return true
    for (let i = 0; i < input.length; i++) {
      // box-filter decimation: average every `ratio` input samples
      this.acc += input[i]
      this.count++
      this.pos += 1
      if (this.pos < this.ratio) continue
      this.pos -= this.ratio
      let v = this.acc / this.count
      this.acc = 0
      this.count = 0
      if (v > 1) v = 1
      else if (v < -1) v = -1
      const a = v < 0 ? -v : v
      if (a > this.peak) this.peak = a
      this.frame[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff
      if (this.n === FRAME) {
        this.port.postMessage({ pcm: this.frame.buffer, peak: this.peak }, [this.frame.buffer])
        this.frame = new Int16Array(FRAME)
        this.n = 0
        this.peak = 0
      }
    }
    return true
  }
}

registerProcessor('live-capture', LiveCapture)
