import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    sourcemap: true,
    format: 'cjs'
  },
  external: ['obsidian'],
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    typescript()
  ]
};
