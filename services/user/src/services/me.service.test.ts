import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserAddresses } from "./me.service.ts";
import { getAddresses } from "../queries/me.queries.ts";
import type { Address } from "../db/schema.ts";

vi.mock("../queries/me.queries.ts");

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

describe("getUserAddresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns addresses from the query layer", async () => {
    const addresses = [
      fakeAddress({ id: "addr-1", type: "shipping" }),
      fakeAddress({ id: "addr-2", type: "billing" }),
    ];
    vi.mocked(getAddresses).mockResolvedValue(addresses);

    const result = await getUserAddresses("user-1");

    expect(getAddresses).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(addresses);
  });

  it("returns an empty array when the user has no addresses", async () => {
    vi.mocked(getAddresses).mockResolvedValue([]);

    const result = await getUserAddresses("user-1");

    expect(getAddresses).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([]);
  });

  it("propagates errors from the query layer", async () => {
    const error = new Error("Database error");
    vi.mocked(getAddresses).mockRejectedValue(error);

    await expect(getUserAddresses("user-1")).rejects.toBe(error);
  });
});
