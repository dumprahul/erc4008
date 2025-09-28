module.exports = {
    env: {
        node: true,
        es2022: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    rules: {
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'warn',
        'no-debugger': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': 'error',
        'curly': 'error',
        'no-trailing-spaces': 'error',
        'comma-dangle': ['error', 'never'],
        'semi': ['error', 'always'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'indent': ['error', 4, { SwitchCase: 1 }],
        'max-len': ['warn', { code: 120, ignoreUrls: true }]
    },
    globals: {
        process: 'readonly'
    }
};