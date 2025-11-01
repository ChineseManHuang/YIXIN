import crypto from 'crypto'
import { env } from '../config/env.js'

export interface GenerateRtcTokenOptions {
  channelId: string
  userId: string
  timestamp?: number
  nonce?: string
}

export interface RtcTokenResult {
  token: string
  timestamp: number
  nonce: string
}

const buildSignaturePayload = (appId: string, channelId: string, userId: string, timestamp: number, nonce: string): string => {
  return `${appId}${channelId}${userId}${timestamp}${nonce}`
}

export const generateRtcToken = (options: GenerateRtcTokenOptions): RtcTokenResult => {
  const appId = env.RTC_APP_ID
  const appKey = env.RTC_APP_KEY

  if (!appId || !appKey) {
    throw new Error('RTC credentials are not configured. Please set RTC_APP_ID and RTC_APP_KEY.')
  }

  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const nonce = options.nonce ?? crypto.randomBytes(16).toString('hex')

  const signaturePayload = buildSignaturePayload(appId, options.channelId, options.userId, timestamp, nonce)
  const signature = crypto
    .createHmac('sha256', appKey)
    .update(signaturePayload)
    .digest('hex')

  const tokenPayload = {
    appId,
    channelId: options.channelId,
    userId: options.userId,
    timestamp,
    nonce,
    signature,
  }

  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

  return {
    token,
    timestamp,
    nonce,
  }
}

export default generateRtcToken
