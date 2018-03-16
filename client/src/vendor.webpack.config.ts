// 

import * as path from 'path'
import * as webpack from 'webpack'
import * as BundleAnalyzerPlugin from 'webpack-bundle-analyzer'



const config = {

	entry: {
		vendor: [
			// 'slayer',
			// 'nostradamus',
			// 'zodiac-ts',
			// 'anomaly',
			// 'regression',
			// 'ml-regression',
			// 'ubique',
			// 'everpolate',
			// 'dts-gen',
			// 'typescript',
			'source-map-support',
			'babel-polyfill',
			'correcting-interval',
			'delay',
			'p-event',
			'p-forever',
			'p-queue',
			'p-timeout',
			'animate.css',
			'axios',
			// 'fuzzy',
			// 'chart.js',
			// 'plotly.js',
			// 'highcharts/highstock',
			'echarts',
			'echarts-stat',
			'chartist',
			'chartist-plugin-tooltips',
			'chartist-plugin-zoom',
			'lodash',
			'lockr',
			'rxjs/Rx',
			'eventemitter3',
			'moment',
			'query-string',
			'humanize-plus',
			'technicalindicators',
			'timeseries-analysis',
			'simple-statistics',
			'vue',
			'vue-class-component',
			'vue-property-decorator',
			'vue-router',
			'av-ts',
			'vuetify',
			'vuex',
			'./src/theme.styl',
		],
	},



	context: process.cwd(),

	output: {
		filename: '[name].dll.js',
		path: path.resolve(__dirname, 'assets'),
		library: '[name]',
		// pathinfo: true,
	},

	node: {
		fs: 'empty'
	},

	resolve: {
		extensions: ['.js'],
		alias: {
			'vue': 'vue/dist/vue.js',
			'technicalindicators': 'technicalindicators/dist/index.js',
		},
	},

	module: {
		rules: [
			{
				test: /\.css$/,
				loader: ['style-loader', 'css-loader', 'stylus-loader'],
			},
			{
				test: /\.styl$/,
				loader: ['style-loader', 'css-loader', 'stylus-loader', {
					loader: 'vuetify-loader',
					options: {
						theme: path.resolve('./src/theme.styl')
					}
				}],
			},
			{
				test: /\.js$/,
				loader: 'ify-loader'
			}
		],
	},

	plugins: [
		new webpack.DllPlugin({
			name: '[name]',
			path: path.resolve(__dirname, 'assets', '[name].json'),
		}),
		// new webpack.optimize.UglifyJsPlugin({
		// 	sourceMap: false,
		// 	compress: {
		// 		warnings: false,
		// 	},
		// }),
		new webpack.IgnorePlugin(/typescript/),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
		}),
		// new BundleAnalyzerPlugin.BundleAnalyzerPlugin(),
	],

	// devtool: false,
	// devtool: 'eval',
	// devtool: 'eval-source-map',
	// devtool: 'source-map',
	// devtool: 'inline-source-map',
	// devtool: 'cheap-module-eval-source-map',

} as webpack.Configuration



if (process.env.NODE_ENV == 'DEVELOPMENT') {
	// (config.entry as any).vendor.push('dts-gen')
	// config.devtool = 'eval'
	// config.devtool = 'inline-source-map'
	config.devtool = 'source-map'
}



if (process.env.NODE_ENV == 'PRODUCTION') {
	config.devtool = false
}



export default config

