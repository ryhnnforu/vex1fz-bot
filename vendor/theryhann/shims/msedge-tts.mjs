/** Stub msedge-tts — modul aslinya tidak dipasang (batas 30 deps vex1fz).
 *  aiTTS() THB otomatis jatuh ke fallback gTTS (translate.google) bila ini throw. */
export const OUTPUT_FORMAT = {
  AUDIO_24KHZ_48KBITRATE_MONO_MP3: 'audio-24khz-48kbitrate-mono-mp3',
  WEBM_24KHZ_16BIT_MONO_OPUS: 'webm-24khz-16bit-mono-opus'
}
export class MsEdgeTTS {
  constructor () { this._closed = false }
  async setMetadata () { throw new Error('msedge-tts tidak tersedia di vex1fz — pakai fallback gTTS') }
  toStream () { throw new Error('msedge-tts tidak tersedia di vex1fz — pakai fallback gTTS') }
  close () { this._closed = true }
}
export default { MsEdgeTTS, OUTPUT_FORMAT }
