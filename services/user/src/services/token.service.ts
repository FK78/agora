import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import type { PoolClient } from "pg";
import {
  linkReplacedToken,
  markTokenReplaced,
  saveRefreshToken,
} from "../queries/token.queries.ts";
import type { RefreshToken } from "../types/tokens.ts";
import type { AuthUser } from "../types/auth.ts";
import { generateOpaqueToken, hashToken } from "../utils/auth.ts";
import { getPrivateKey } from "../config/keys.ts";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = async (user: AuthUser): Promise<string> => {
  const key = await getPrivateKey();
  return new SignJWT({ sub: user.id, type: "access" })
    .setProtectedHeader({ alg: "ES256" })
    .setIssuedAt()
    .setIssuer("agora-user-service")
    .setAudience("agora-api")
    .setExpirationTime("15m")
    .sign(key);
};

const createAndPersistTokenPair = async (
  user: AuthUser,
  tokenFamilyId: string,
  client?: PoolClient
) => {
  const accessToken = await signAccessToken(user);
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshToken);

  const newRow = await saveRefreshToken(
    {
      refreshTokenHash,
      userId: user.id,
      tokenFamilyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
    client
  );

  return { accessToken, refreshToken, newRow };
};

export const issueTokenPair = async (user: AuthUser) => {
  const { accessToken, refreshToken } = await createAndPersistTokenPair(
    user,
    randomUUID()
  );
  return { accessToken, refreshToken };
};

export const rotateTokenPair = async (
  user: AuthUser,
  oldToken: RefreshToken,
  client: PoolClient
) => {
  await markTokenReplaced(oldToken.id, client);
  const { accessToken, refreshToken, newRow } = await createAndPersistTokenPair(
    user,
    oldToken.tokenFamilyId,
    client
  );
  await linkReplacedToken(oldToken.id, newRow.id, client);
  return { accessToken, refreshToken };
};
