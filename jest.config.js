module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'TokenService.js',
        'StateManager.js',
        'MessageBus.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageThreshold: {
        global: {
            statements: 50,
            branches: 40,
            functions: 50,
            lines: 50
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true
};
