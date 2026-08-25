import { describe, it, expect, vi } from "vitest";
import { SignJWT } from "jose";
import type { Request, Response } from "express";
import { authenticate } from "./authenticate.ts";
import { AppError } from "../errors/AppError.ts";
import { env } from "../config/env.ts";

const secret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);
const wrongSecret = new TextEncoder().encode("wrong-secret");

const sign = async (
  payload: Record<string, unknown>,
  overrides: { secret?: Uint8Array; issuer?: string; audience?: string; expiresIn?: string; algorithm?: string } = {}
) => {
  const { secret: key = secret, issuer = "auth-starter", audience = "auth-starter-api", expiresIn = "15m", algorithm = "HS256" } = overrides;
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn)
    .sign(key);
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

  it("throws for a token signed with the wrong secret", async () => {
    const token = await sign({ sub: "user-1", type: "access" }, { secret: wrongSecret });

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

  it("throws for a token signed with a different algorithm", async () => {
    const token = await sign({ sub: "user-1", type: "access" }, { algorithm: "HS384" });

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
