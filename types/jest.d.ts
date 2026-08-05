// TypeScript 6 no longer auto-includes @types packages nothing imports, so without this
// reanimated's type-only `namespace jest` is the only `jest` in scope and jest.fn() fails.
/// <reference types="jest" />
