export default {
  preset: 'ts-jest',           // ← this teaches Jest to read TypeScript
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],  // look for .test.ts files
  forceExit: true,
};