import { importPKCS8, importSPKI } from "jose";
import { env } from "./env.ts";

let privateKey: CryptoKey;
let publicKey: CryptoKey;

export const getPrivateKey = async (): Promise<CryptoKey> => {
  if (!privateKey) {
    privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, "ES256");
  }
  return privateKey;
};

export const getPublicKey = async (): Promise<CryptoKey> => {
  if (!publicKey) {
    publicKey = await importSPKI(env.JWT_PUBLIC_KEY, "ES256");
  }
  return publicKey;
};
