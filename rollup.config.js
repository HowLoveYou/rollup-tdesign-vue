import babel from 'rollup-plugin-babel'; //rollup-plugin-babel用于转换es6语法
import commonjs from 'rollup-plugin-commonjs'; //支持CommonJS模块
import postcss from 'rollup-plugin-postcss'; //支持css文件的加载、css加前缀、css压缩、对scss/less的支持等等
import autoprefixer from 'autoprefixer'; //给css3的一些属性加前缀
import cssnano from 'cssnano'; //cssnano对打包后的css进行压缩
import vue from 'rollup-plugin-vue'; //vue
import { terser } from 'rollup-plugin-terser'; //代码压缩
import serve from 'rollup-plugin-serve'; //启动服务
import livereload from 'rollup-plugin-livereload'; //用于文件变化时，实时刷新页面

export default {
  input: './src/index.js',
  output: [
    {
      file: './dist/lib-umd.js',
      format: 'umd',
      name: 'hrLib',
      //当入口文件有export时，'umd'格式必须指定name
      //这样，在通过<script>标签引入时，才能通过name访问到export的内容。
    },
    {
      file: './dist/lib-es.js',
      format: 'es',
    },
    {
      file: './dist/lib-cjs.js',
      format: 'cjs',
    },
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    commonjs(),
    postcss({
      plugins: [autoprefixer(), cssnano()],
      extract: 'css/index.css',
    }),
    vue({
      style: {
        postcssPlugins: [autoprefixer()], //vue添加样式前缀和样式压缩
      },
    }),
    terser(),
    // serve({
    //   open: true,
    //   openPage: '/dist/index.html',
    //   contentBase: '', //服务器启动的文件夹，默认是项目根目录，需要在该文件下创建index.html
    //   port: 8020, //端口号，默认10001
    //   historyApiFallback: true,
    // }),
    livereload('dist'), //watch dist目录，当目录中的文件发生变化时，刷新页面
  ],
  external: [
    //外部库， 使用'umd'文件时需要先引入这个外部库
    'vue',
    'tdesign-vue',
    'lodash',
    'tdesign-icons-vue',
  ],
};
