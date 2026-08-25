import { describe, it, expect, vi } from "vitest";
import { SignJWT, generateKeyPair, exportPKCS8, exportSPKI, importPKCS8 } from "jose";
import type { Request, Response } from "express";
import { authenticate } from "./authenticate.ts";
import { AppError } from "../errors/AppError.ts";
import { env } from "../config/env.ts";

// Use the actual keys from env for valid tokens
const validPrivateKey = await importPKCS8(env.JWT_PRIVATE_KEY, "ES256");

// Generate a separate key pair for "wrong key" tests
const wrongKeyPair = await generateKeyPair("ES256");

const sign = async (
  payload: Record<string, unknown>,
  overrides: { privateKey?: CryptoKey; issuer?: string; audience?: string; expiresIn?: string; algorithm?: string } = {}
) => {
  const {
    privateKey = validPrivateKey,
    issuer = "agora-user-service",
    audience = "agora-api",
    expiresIn = "15m",
    algorithm = "ES256"
  } = overrides;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn)
    .sign(privateKey);
};

const fakeReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } }) as unknown as Request;

describe("authenticate", () => {
  it("throws when there is no Authorization header", async () => {
    await expect(authenticate(fakeReq(), {} as Response, vi.fn())).rejects.toThrow(AppError);
  });

  it("throws when the Authorization header isn't a Bearer token", async () => {
    await expect(
      authenticate(fakeReq("Basic abc123"), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("sets req.user and calls next() for a valid access token", async () => {
    const token = await sign({ sub: "user-1", type: "access" });
    const req = fakeReq(`Bearer ${token}`);
    const next = vi.fn();

    await authenticate(req, {} as Response, next);

    expect(req.user).toEqual({ id: "user-1" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws for a token signed with the wrong key", async () => {
    const token = await sign({ sub: "user-1", type: "access" }, { privateKey: wrongKeyPair.privateKey as CryptoKey });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for a token with the wrong issuer", async () => {
    const token = await sign({ sub: "user-1", type: "access" }, { issuer: "someone-else" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for an expired token", async () => {
    const token = await sign({ sub: "user-1", type: "access" }, { expiresIn: "0s" });
    // Small delay to ensure the token is expired
    await new Promise((r) => setTimeout(r, 10));

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws when the token type isn't 'access'", async () => {
    const token = await sign({ sub: "user-1", type: "refresh" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws when the token has no sub claim", async () => {
    const token = await sign({ type: "access" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });
});
