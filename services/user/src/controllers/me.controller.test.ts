import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { SignJWT, importPKCS8 } from "jose";
import { app } from "../app.ts";
import { getUserAddresses } from "../services/me.service.ts";
import { AppError } from "../errors/AppError.ts";
import { env } from "../config/env.ts";
import type { Address } from "../db/schema.ts";

vi.mock("../services/me.service.ts");

const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, "ES256");

const signAccessToken = async (sub: string) =>
  new SignJWT({ sub, type: "access" })
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer("agora-user-service")
    .setAudience("agora-api")
    .setExpirationTime("15m")
    .sign(privateKey);

const fakeAddress = (overrides: Partial<Address> = {}): Address => ({
  id: "addr-1",
  userId: "user-1",
  type: "shipping",
  isDefault: true,
  name: "Home",
  line1: "123 Main St",
  line2: null,
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "US",
  phone: "+1234567890",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

describe("GET /me/addresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the user's addresses when authenticated", async () => {
    const addresses = [
      fakeAddress({ id: "addr-1", type: "shipping", isDefault: true }),
      fakeAddress({ id: "addr-2", type: "billing", isDefault: false }),
    ];
    vi.mocked(getUserAddresses).mockResolvedValue(addresses);
    const token = await signAccessToken("user-1");

    const res = await request(app)
      .get("/me/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe("addr-1");
    expect(res.body[1].id).toBe("addr-2");
    expect(getUserAddresses).toHaveBeenCalledWith("user-1");
  });

  it("returns an empty array when the user has no addresses", async () => {
    vi.mocked(getUserAddresses).mockResolvedValue([]);
    const token = await signAccessToken("user-1");

    const res = await request(app)
      .get("/me/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 401 when no authorization header is provided", async () => {
    const res = await request(app).get("/me/addresses");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Access token is required" });
    expect(getUserAddresses).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/me/addresses")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(getUserAddresses).not.toHaveBeenCalled();
  });

  it("returns 500 when the service throws an unexpected error", async () => {
    vi.mocked(getUserAddresses).mockRejectedValue(new Error("Database connection lost"));
    const token = await signAccessToken("user-1");

    const res = await request(app)
      .get("/me/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});
