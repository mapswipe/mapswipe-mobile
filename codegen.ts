import { CodegenConfig } from '@graphql-codegen/cli';

const schema = process.env.EXPO_PUBLIC_GRAPHQL_CODEGEN_ENDPOINT;

if (!schema) {
  throw new Error(
    'EXPO_PUBLIC_GRAPHQL_CODEGEN_ENDPOINT is not set. Add it to your .env.local file.'
  );
}

const config: CodegenConfig = {
  schema,
  documents: [
    'app/**/*.tsx',
    'app/**/*.ts',
    'hooks/**/*.tsx',
    'hooks/**/*.ts',
    'components/**/*.tsx',
    'components/**/*.ts',
  ],
  ignoreNoDocuments: true,
  generates: {
    './generated/types/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-urql',
      ],
      config: {
        withComponent: false,
        withHooks: true,
        purgeMagicComment: true,
        gqlImport: 'urql#gql',
        dedupeFragments: true,
        skipTypename: true,
      },
    },
    './generated/schema.json': {
      plugins: ['introspection'],
    },
  },
};

export default config;
