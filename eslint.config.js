import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import process from 'process';

const dirname = process.cwd();
const compat = new FlatCompat({
    baseDirectory: dirname,
    resolvePluginsRelativeTo: dirname,
});

const appConfigs = compat.config({
    env: {
        node: true,
        'react-native/react-native': true,
        es2020: true,
    },
    root: true,
    extends: [
        'airbnb',
        'airbnb/hooks',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
        'react-native',
        'simple-import-sort',
        'import-newlines'
    ],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {
                project: [
                    './tsconfig.json',
                ],
            },
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
            }
        },
    },
    rules: {
        'no-unused-vars': 0,
        '@typescript-eslint/no-unused-vars': 1,
        'no-use-before-define': 0,
        '@typescript-eslint/no-use-before-define': 1,
        'no-shadow': 0,
        '@typescript-eslint/no-shadow': ['error'],
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    '**/*.test.{ts,tsx}',
                    'eslint.config.js',
                    'metro.config.js',
                    'babel.config.js',
                ],
                optionalDependencies: false,
            },
        ],
        indent: ['error', 4, { SwitchCase: 1 }],
        'import/no-cycle': ['error', { allowUnsafeDynamicCyclicDependency: true }],
        'react/react-in-jsx-scope': 'off',
        'camelcase': 'off',
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'import/extensions': ['off', 'never'],
        'import/named': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/require-default-props': ['warn', { ignoreFunctionalComponents: true }],
        'simple-import-sort/imports': 'warn',
        'simple-import-sort/exports': 'warn',
        'import-newlines/enforce': ['warn', 1],
        'react/jsx-props-no-spreading': 'warn',
        'react/style-prop-object': ['error', { allow: ['StatusBar'] }],
        'global-require': 'off',
        'react-native/no-unused-styles': 'off',
        'react-native/no-inline-styles': 'warn',
        'react-native/no-color-literals': 'off',
    },
    overrides: [
        {
            files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
            rules: {
                'simple-import-sort/imports': [
                    'error',
                    {
                        'groups': [
                            // side effect imports
                            ['^\\u0000'],
                            // packages `react` related packages come first
                            ['^react', '^react-native', '^expo', '^@expo', '^@?\\w'],
                            // internal packages
                            ['^@/'],
                            // parent imports. Put `..` last
                            // other relative imports. Put same-folder imports and `.` last
                            ['^\\.\\.(?!/?$)', '^\\.\\./?$', '^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                            // style imports
                            ['^.+\\.json$'],
                        ]
                    }
                ]
            }
        }
    ],
}).map((conf) => ({
    ...conf,
    files: [
        'app/**/*.tsx', 'app/**/*.jsx', 'app/**/*.ts', 'app/**/*.js',
        'components/**/*.tsx', 'components/**/*.jsx', 'components/**/*.ts', 'components/**/*.js',
        'contexts/**/*.tsx', 'contexts/**/*.jsx', 'contexts/**/*.ts', 'contexts/**/*.js',
        'hooks/**/*.tsx', 'hooks/**/*.jsx', 'hooks/**/*.ts', 'hooks/**/*.js',
        'utils/**/*.tsx', 'utils/**/*.jsx', 'utils/**/*.ts', 'utils/**/*.js',
        'constants/**/*.tsx', 'constants/**/*.jsx', 'constants/**/*.ts', 'constants/**/*.js',
    ],
    ignores: [
        "node_modules/",
        ".expo/",
        "android/",
        "ios/",
        "coverage/",
        "codegen.ts",
        'generated/types/'
    ],
}));

const otherConfig = {
    files: ['*.js', '*.cjs'],
    ...js.configs.recommended,
};

const nodeConfig = {
    files: ['app.config.js', 'metro.config.js', 'babel.config.js'],
    ...js.configs.recommended,
    languageOptions: {
        globals: {
            require: 'readonly',
            module: 'writable',
            process: 'readonly',
            __dirname: 'readonly',
        },
    },
};

export default [
    ...appConfigs,
    otherConfig,
    nodeConfig,
];
