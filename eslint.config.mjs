import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Biçimlendirme kurallarını Prettier'a bırak.
  prettier,
  {
    // GEÇİCİ: Refactor öncesi koddan devralınan hatalar. Davranışı değiştirmeden
    // düzeltilemedikleri için uyarıya düşürüldü; ilgili plan adımında "error"a geri alınacak.
    rules: {
      'react-hooks/set-state-in-effect': 'warn', // Adım 9
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'docs/baseline/**',
  ]),
]);

export default eslintConfig;
