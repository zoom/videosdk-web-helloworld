import { VideoClient } from "@zoom/videosdk";
import KJUR from "jsrsasign";

// You should sign your JWT with a backend service in a production use-case
export function generateSignature(sessionName: string, role: number, sdkKey: string, sdkSecret: string) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
  return sdkJWT;
}

// For safari desktop browsers, you need to start audio after the media-sdk-change event is triggered
export const useWorkAroundForSafari = async (client: typeof VideoClient) => {
  let audioDecode: boolean
  let audioEncode: boolean
  client.on('media-sdk-change', (payload) => {
    console.log('media-sdk-change', payload)
    if (payload.type === 'audio' && payload.result === 'success') {
      if (payload.action === 'encode') {
        audioEncode = true
      } else if (payload.action === 'decode') {
        audioDecode = true
      }
      if (audioEncode && audioDecode) {
        console.log('start audio')
        client.getMediaStream().startAudio()
      }
    }
  })
}
