const path = require('node:path');

// Single platform on purpose: snapshots must be deterministic, and jest-expo's
// universal preset would render every component once per platform.
const preset = require('jest-expo/android/jest-preset');

const BABEL_CONFIG = path.resolve(__dirname, 'jest/babel.config.cjs');

// The preset's babel-jest entries carry `caller` metadata that babel-preset-expo
// reads, so extend them rather than replacing them.
const transform = Object.fromEntries(
    Object.entries(preset.transform).map(([pattern, value]) => {
        if (value === 'babel-jest') {
            return [pattern, ['babel-jest', { configFile: BABEL_CONFIG }]];
        }
        if (Array.isArray(value) && value[0] === 'babel-jest') {
            return [pattern, ['babel-jest', { ...value[1], configFile: BABEL_CONFIG }]];
        }
        return [pattern, value];
    }),
);

module.exports = {
    ...preset,
    transform,
    rootDir: __dirname,
    testMatch: ['<rootDir>/__tests__/**/*.test.@(ts|tsx)'],
    // Both firebase trees ship a package.json named "functions", which collides in
    // haste. Neither is part of the app bundle.
    modulePathIgnorePatterns: [
        '<rootDir>/android/',
        '<rootDir>/ios/',
        '<rootDir>/backend/',
        '<rootDir>/firebase/',
    ],
    moduleNameMapper: {
        ...preset.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/$1',
    },
    setupFilesAfterEnv: [
        ...(preset.setupFilesAfterEnv ?? []),
        '<rootDir>/jest/setup.tsx',
    ],
    clearMocks: true,
    resetMocks: false,
};
