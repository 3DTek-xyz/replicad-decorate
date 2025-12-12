import replaceImports from 'rollup-plugin-replace-imports-with-vars';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import wordpressHeader from './rollup-plugin-wordpress-header.js';


export default {
  input: `src/index.js`,
  output: [
    { 
      file: "dist/es/replicad-decorate.js", 
      format: "es" 
    },
    { 
      file: "dist/studio/replicad-decorate.js", 
      format: "es", 
      plugins: [replaceImports({ varType: 'const', replacementLookup: {"replicad": "replicad" }})] 
    },
    {
      file: "dist/wordpress/replicad-decorate.js",
      format: "es",
      plugins: [
        replaceImports({ varType: 'const', replacementLookup: {"replicad": "replicad" }}),
        wordpressHeader()
      ]
    }
  ],
  external: ["replicad"],
  watch: {
    include: "src/**",
  },
  plugins: [resolve(), commonjs()]
};
