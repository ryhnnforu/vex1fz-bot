/**
 * Shim @rexxhayanasi/elaina-baileys → @japofc/baileys (vex1fz).
 * THERYHANN-BOT di-port ke atas japofc: 8 simbol yang dipakai seluruhnya
 * tersedia di japofc (Button/ButtonV2/AIRich/Carousel + util jid).
 * Hanya AIRich butuh pembungkus tipis: static generateVerificationMetadata()
 * (dari Utils/rich-message-utils) + send() yang mengembalikan {key:{id}}.
 */
import * as jp from '@japofc/baileys'
import { botMetadataCertificate, botMetadataSignature } from '../../../node_modules/@japofc/baileys/lib/Utils/rich-message-utils.js'

export const areJidsSameUser = jp.areJidsSameUser
export const jidNormalizedUser = jp.jidNormalizedUser
export const getContentType = jp.getContentType
export const downloadMediaMessage = jp.downloadMediaMessage
export const extractMessageContent = jp.extractMessageContent
export const isJidGroup = jp.isJidGroup
export const isJidNewsletter = jp.isJidNewsletter
export const jidDecode = jp.jidDecode
export const proto = jp.proto
export const Button = jp.Button
export const ButtonV2 = jp.ButtonV2
export const Carousel = jp.Carousel

export class AIRich extends jp.AIRich {
  static generateVerificationMetadata () {
    return {
      proofs: [{
        certificateChain: [botMetadataCertificate(), botMetadataCertificate(892)],
        version: 1,
        useCase: 1,
        signature: botMetadataSignature()
      }]
    }
  }
  /** selaraskan hasil send() dengan ekspektasi THB: { key: { id } } */
  async send (jid, opts) {
    const res = await super.send(jid, opts)
    if (typeof res === 'string') return { key: { id: res }, id: res }
    if (res && typeof res === 'object') {
      if (!res.key) res.key = { id: res.id || res.messageId || '' }
      return res
    }
    return { key: { id: '' } }
  }
}

export default {
  AIRich, Button, ButtonV2, Carousel,
  areJidsSameUser, jidNormalizedUser, getContentType, downloadMediaMessage,
  extractMessageContent, isJidGroup, isJidNewsletter, jidDecode, proto
}
