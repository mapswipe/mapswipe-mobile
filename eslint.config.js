import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import process from 'process';

import STYLING_ALLOWLIST from './eslint/styling-allowlist.json' with { type: 'json' };

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
                    'jest/**',
                    'eslint.config.js',
                    'metro.config.js',
                    'babel.config.js',
                    'jest.config.cjs',
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
        '__tests__/**/*.tsx', '__tests__/**/*.ts',
        'jest/**/*.tsx', 'jest/**/*.ts',
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
    files: ['app.config.js', 'metro.config.js', 'babel.config.js', 'jest.config.cjs'],
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

// Appended plainly, not via compat.config({overrides}): the .map() above rewrites `files`.
const testConfig = {
    files: ['__tests__/**/*.{ts,tsx}', 'jest/**/*.{ts,tsx}'],
    rules: {
        // jest.mock factories are hoisted above imports, so they can only require.
        '@typescript-eslint/no-require-imports': 'off',
        'react/function-component-definition': 'off',
    },
    languageOptions: {
        globals: {
            afterAll: 'readonly',
            afterEach: 'readonly',
            beforeAll: 'readonly',
            beforeEach: 'readonly',
            describe: 'readonly',
            expect: 'readonly',
            it: 'readonly',
            jest: 'readonly',
            require: 'readonly',
            test: 'readonly',
        },
    },
};

// Only components/ui/** may build styles. The configs below are plain flat-config objects: the
// .map() above rewrites `files`, which would widen them to the whole app.
const UI = ['components/ui/**/*.{ts,tsx}'];

// Domain leaves may lay out measured geometry, but colours and sizes still come from tokens.
const DOMAIN = ['components/domain/**/*.{ts,tsx}'];

// Flat config replaces an option array instead of merging, so Airbnb's entries must be re-listed
// wherever no-restricted-syntax is set.
const AIRBNB_RESTRICTED_SYNTAX = [
    { selector: 'ForInStatement', message: 'for..in iterates the prototype chain. Use Object.{keys,values,entries}.' },
    { selector: 'ForOfStatement', message: 'iterators/generators need regenerator-runtime. Prefer array iteration.' },
    { selector: 'LabeledStatement', message: 'Labels are a form of GOTO and make code hard to follow.' },
    { selector: 'WithStatement', message: '`with` is disallowed in strict mode.' },
];

const NO_RAW_COLOR = [
    { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: 'Raw colour. Use a ColorVariant.' },
    { selector: 'Literal[value=/^(rgb|rgba|hsl|hsla)[(]/]', message: 'Raw colour. Use a ColorVariant.' },
];

const SIZE_PROPS = [
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    // 'start' and 'end' are deliberately absent: esquery matches key names alone, so they would
    // also hit maps like { start: 'auto' }.
    'top', 'bottom', 'left', 'right',
    'insetBlockStart', 'insetBlockEnd', 'insetInlineStart', 'insetInlineEnd',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'marginVertical', 'marginHorizontal', 'marginStart', 'marginEnd',
    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'paddingVertical', 'paddingHorizontal', 'paddingStart', 'paddingEnd',
    'borderRadius', 'borderWidth', 'fontSize', 'lineHeight', 'gap', 'rowGap', 'columnGap',
].join('|');

// `ignores` takes minimatch globs, where `[id]` is a character class, so an unescaped
// 'project/[id]/index.tsx' matches nothing and the file stays unignored.
const asIgnorePattern = (path) => path.replace(/[[\]{}()!+@]/g, (ch) => `\\${ch}`);

const noRawPaintInDomain = {
    files: DOMAIN,
    rules: {
        'react-native/no-inline-styles': 'error',
        'react-native/no-color-literals': 'error',
        'react-native/no-single-element-style-arrays': 'error',
        'no-restricted-syntax': ['error', ...NO_RAW_COLOR],
    },
};

const noStylingInViews = {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    // The allowlist may only shrink; scripts/check-styling-allowlist.ts fails CI on an addition.
    ignores: [...UI, ...DOMAIN, 'app/playground/**', ...STYLING_ALLOWLIST.map(asIgnorePattern)],
    rules: {
        'react-native/no-inline-styles': 'error',
        'react-native/no-color-literals': 'error',
        'react-native/no-single-element-style-arrays': 'error',
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-restricted-imports': ['error', {
            paths: [
                {
                    name: 'react-native',
                    importNames: [
                        'StyleSheet', 'View', 'Text', 'Pressable', 'TouchableOpacity',
                        'TouchableHighlight', 'TouchableWithoutFeedback', 'ScrollView',
                        'SafeAreaView', 'ActivityIndicator', 'Image', 'ImageBackground',
                        'Modal', 'Dimensions', 'PixelRatio', 'ViewStyle', 'TextStyle', 'StyleProp',
                    ],
                    message: 'Views must not touch RN styling primitives. Use @/components/ui/*.',
                },
                { name: 'react-native-safe-area-context', importNames: ['SafeAreaView'], message: 'Use <Screen />.' },
                { name: '@/hooks/useTheme', message: 'Take a colorVariant prop.' },
                { name: '@/hooks/useThemedStyles', message: 'Only components/ui/** may build styles.' },
                { name: '@/hooks/useSpacingToken', message: 'Use the spacing prop.' },
                { name: '@/constants/dimensions', message: 'Use spacing and size props.' },
                { name: '@/utils/styles', message: 'Only components/ui/**.' },
                { name: '@/utils/layout', message: 'Only components/ui/**.' },
            ],
        }],
        'no-restricted-syntax': ['error',
            ...AIRBNB_RESTRICTED_SYNTAX,
            ...NO_RAW_COLOR,
            {
                selector: "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
                message: 'No StyleSheet.create in views.',
            },
            // `mapStyle` is excluded: it is MapLibre's style document, not an RN style.
            {
                selector: "JSXAttribute[name.name=/[Ss]tyle$/]:not([name.name='mapStyle'])",
                message: 'No style prop in views. Add a variant.',
            },
            {
                selector: 'JSXAttribute[name.name=/^(color|backgroundColor|borderColor|placeholderTextColor|stroke|fill)$/]',
                message: 'Pass a colorVariant.',
            },
            { selector: "CallExpression[callee.object.name='Dimensions']", message: 'Use useViewport().' },
            {
                selector: 'Property[key.name=/^(tabBarStyle|headerStyle|cardStyle|contentStyle|sceneStyle)$/]',
                message: 'Navigator styling belongs in ui/TabBar or ui/Screen.',
            },
            {
                selector: 'TSAsExpression[typeAnnotation.type="TSAnyKeyword"]',
                message: 'No `as any` in views: it defeats style?: never.',
            },
        ],
    },
};

const tokensOnlyInUi = {
    files: UI,
    rules: {
        'react-native/no-inline-styles': 'error',
        'react-native/no-color-literals': 'error',
        'react-native/no-unused-styles': 'error',
        'no-restricted-syntax': ['error',
            ...AIRBNB_RESTRICTED_SYNTAX,
            ...NO_RAW_COLOR,
            // [value!=0] is required: esquery does not coerce numeric literals, so /^[0-9]/ fails.
            { selector: `Property[key.name=/^(${SIZE_PROPS})$/] > Literal[value!=0]`, message: 'Raw size. Use a token.' },
            { selector: `Property[key.name=/^(${SIZE_PROPS})$/] > UnaryExpression > Literal`, message: 'Raw size. Use a token.' },
        ],
    },
};

// theme.ts and typography.ts are the only files allowed a colour literal.
const tokenSources = {
    files: ['constants/**/*.ts', 'utils/**/*.ts'],
    ignores: ['constants/theme.ts', 'constants/typography.ts'],
    rules: {
        'no-restricted-syntax': ['error', ...AIRBNB_RESTRICTED_SYNTAX, ...NO_RAW_COLOR],
    },
};

export default [
    ...appConfigs,
    otherConfig,
    nodeConfig,
    testConfig,
    noStylingInViews,
    noRawPaintInDomain,
    tokensOnlyInUi,
    tokenSources,
];
