module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: './src/__tests__/tsconfig.json'
    }
  },
  testMatch: [
    "**/__tests__/**/*test.ts"
  ]
}