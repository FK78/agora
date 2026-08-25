import { eq, sql, isNull, and } from "drizzle-orm";
import { db, type DbOrTransaction } from "../db/db.ts";
import { refreshTokens, type RefreshToken, type NewRefreshToken } from "../db/schema.ts";

interface SaveRefreshTokenInput {
  refreshTokenHash: string;
  userId: string;
  tokenFamilyId: string;
  expiresAt: Date;
}

/**
 * @param input - Token data to save
 * @param dbOrTx - Database or transaction instance
 * @returns The created refresh token record
 */
export const saveRefreshToken = async (
  input: SaveRefreshTokenInput,
  dbOrTx: DbOrTransaction = db
): Promise<RefreshToken> => {
  const [token] = await dbOrTx
    .insert(refreshTokens)
    .values({
      tokenHash: input.refreshTokenHash,
      userId: input.userId,
      tokenFamilyId: input.tokenFamilyId,
      expiresAt: input.expiresAt,
    })
    .returning();

  if (!token) {
    throw new Error("Failed to insert refresh token");
  }

  return token;
};

/**
 * @param refreshTokenHash - Hash of the token to find
 * @param dbOrTx - Database or transaction instance (should be a transaction!)
 * @returns Token record or null if not found
 */
export const findRefreshTokenByHash = async (
  refreshTokenHash: string,
  dbOrTx: DbOrTransaction = db
): Promise<RefreshToken | null> => {
  const [token] = await dbOrTx
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, refreshTokenHash))
    .limit(1)
    .for("update"); // Row-level lock - prevents race condition in token rotation

  return token ?? null;
};

/**
 * @param oldTokenId - ID of the token being replaced
 * @param dbOrTx - Database or transaction instance
 */
export const markTokenReplaced = async (
  oldTokenId: string,
  dbOrTx: DbOrTransaction = db
): Promise<void> => {
  await dbOrTx
    .update(refreshTokens)
    .set({
      revokedAt: sql`now()`,
    })
    .where(eq(refreshTokens.id, oldTokenId));
};

/**
 * @param oldTokenId - ID of the old token
 * @param newTokenId - ID of the new token that replaced it
 * @param dbOrTx - Database or transaction instance
 */
export const linkReplacedToken = async (
  oldTokenId: string,
  newTokenId: string,
  dbOrTx: DbOrTransaction = db
): Promise<void> => {
  await dbOrTx
    .update(refreshTokens)
    .set({
      replacedById: newTokenId,
    })
    .where(eq(refreshTokens.id, oldTokenId));
};

/**
 * @param tokenFamilyId - ID of the token family to revoke
 * @param reason - Reason for revocation (e.g., 'reuse_detected')
 * @param dbOrTx - Database or transaction instance
 */
export const revokeTokenFamily = async (
  tokenFamilyId: string,
  reason: string,
  dbOrTx: DbOrTransaction = db
): Promise<void> => {
  await dbOrTx
    .update(refreshTokens)
    .set({
      revokedAt: sql`now()`,
      revokedReason: reason,
    })
    .where(
      and(
        eq(refreshTokens.tokenFamilyId, tokenFamilyId),
        isNull(refreshTokens.revokedAt)
      )
    );
};
