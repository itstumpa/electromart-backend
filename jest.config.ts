// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/tests/**/*.test.ts"],
  setupFilesAfterFramework: ["./tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/app/modules/**/*.service.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  verbose: true,
};

export default config;