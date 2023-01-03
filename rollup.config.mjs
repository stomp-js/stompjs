import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const umdConf = {
  file: 'bundles/stomp.umd.js',
  format: 'umd',
  name: 'StompJs',
  sourcemap: true,
};

const umdMinConf = {
  ...umdConf,
  file: 'bundles/stomp.umd.min.js',
  sourcemap: false,
  plugins: [terser()],
};

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript()],
    output: [umdConf, umdMinConf],
  },
];
