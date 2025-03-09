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
    // @rollup/plugin-typescript@12 required the file output to be within the outDir
    // Accordingly after the build the npm build steps removes the *.d.ts as these are not needed
    // for the UJS bundle
    plugins: [typescript({compilerOptions: {outDir: 'bundles'}})],
    output: [umdConf, umdMinConf],
  },
];
