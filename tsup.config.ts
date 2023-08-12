import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/multipart.ts', 'src/sse.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
});
