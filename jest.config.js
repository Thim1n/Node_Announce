module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/test/**/*Test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/apps.js',
        '!src/models/index.js'
    ],
    coverageDirectory: 'coverage',
    verbose: true
};