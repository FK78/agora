import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import {
  linkReplacedToken,
  markTokenReplaced,
  saveRefreshToken,
} from "../queries/token.queries.ts";
import type { RefreshToken } from "../types/tokens.ts";
import type { AuthUser } from "../types/auth.ts";
import { generateOpaqueToken, hashToken } from "../utils/auth.ts";
import { getPrivateKey } from "../config/keys.ts";
import type { DbOrTransaction } from "../db/db.ts";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

/**
 * @param user - User to create tokens for
 * @param tokenFamilyId - Family ID for token rotation tracking
 * @param dbOrTx - Database or transaction instance
 */
const createAndPersistTokenPair = async (
  user: AuthUser,
  tokenFamilyId: string,
  dbOrTx?: DbOrTransaction
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
    dbOrTx
  );

  return { accessToken, refreshToken, newRow };
};

/**
 * @param user - User to issue tokens for
 * @returns Access token and refresh token
 */
export const issueTokenPair = async (user: AuthUser) => {
  const { accessToken, refreshToken } = await createAndPersistTokenPair(
    user,
    randomUUID()
  );
  return { accessToken, refreshToken };
};

/**
 * @param user - User to issue new tokens for
 * @param oldToken - The refresh token being rotated out
 * @param tx - Drizzle transaction instance (required for atomicity)
 * @returns New access token and refresh token
 */
export const rotateTokenPair = async (
  user: AuthUser,
  oldToken: RefreshToken,
  tx: DbOrTransaction
) => {
  await markTokenReplaced(oldToken.id, tx);

  const { accessToken, refreshToken, newRow } = await createAndPersistTokenPair(
    user,
    oldToken.tokenFamilyId,
    tx
  );

  await linkReplacedToken(oldToken.id, newRow.id, tx);

  return { accessToken, refreshToken };
};
