export type { RefreshToken, NewRefreshToken } from "../db/schema.ts";

export type RevokedReason = "reuse_detected" | "logout" | "admin_revoked";
