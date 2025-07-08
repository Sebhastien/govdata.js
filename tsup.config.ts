import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: 'node18',
    external: ['fast-xml-parser', 'commander'],
    noExternal: [],
    treeshake: true,
    bundle: true,
    platform: 'node',
  },
  // CLI build
  {
    entry: ['src/cli/index.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    target: 'node18',
    external: ['fast-xml-parser', 'commander'],
    noExternal: [],
    treeshake: true,
    bundle: true,
    platform: 'node',
    outDir: 'dist/cli',
  }
]);