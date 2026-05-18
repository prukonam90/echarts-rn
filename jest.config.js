module.exports = {
  projects: [
    {
      displayName: 'app',
      preset: 'react-native',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{ts,tsx}'],
      moduleNameMapper: {
        '@xpanse/native-charts': '<rootDir>/packages/charts/src/index.ts',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@wuba/react-native-echarts|echarts|zrender)/)',
      ],
    },
    {
      displayName: 'charts-lib',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/charts/src/**/__tests__/**/*.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
      },
    },
  ],
};
