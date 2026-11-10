import { FlatCompat } from '@eslint/eslintrc';

/**
 * Config propia de la plataforma: sin esto Next hereda la del landing que
 * está en la raíz del repo, que apunta a dependencias que aquí no existen.
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
