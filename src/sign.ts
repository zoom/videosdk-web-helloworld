import KJUR from "jsrsasign";

// You should sign your JWT with a backend service
export function generateSignature(sessionName: string, role: number) {
  const sdkKey = "zwNwiHxETRenkL8HJAliPQ";
  const sdkSecret = "V5n5clhFpXGaYUYQB92zkIfZDQzLjWfSd1wJ";
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
