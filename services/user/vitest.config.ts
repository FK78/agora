import { defineConfig } from "vitest/config";

// Test ES256 key pair (for testing only - not for production use)
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgkNasxn5H819sZXDQ
89bvFSpX8mCoCrlAh7j21hv2NkShRANCAASQqgC2LWSsWTx38LONoM3p0gwDdQxW
xDiRRBwy8v/voTPMg+hJr5RIoVoVz0ObjJdKbpgQf0HFHFAzkdQG4/n4
-----END PRIVATE KEY-----`;

const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEkKoAti1krFk8d/CzjaDN6dIMA3UM
VsQ4kUQcMvL/76EzzIPoSa+USKFaFc9Dm4yXSm6YEH9BxRxQM5HUBuP5+A==
-----END PUBLIC KEY-----`;

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    env: {
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "test",
      POSTGRES_PORT: "5432",
      JWT_PRIVATE_KEY: TEST_PRIVATE_KEY,
      JWT_PUBLIC_KEY: TEST_PUBLIC_KEY,
    },
  },
});
