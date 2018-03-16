// 

import * as webpack from 'webpack'
import * as path from 'path'
import * as LiveReloadPlugin from 'webpack-livereload-plugin'
import * as BundleAnalyzerPlugin from 'webpack-bundle-analyzer'
import { CheckerPlugin } from 'awesome-typescript-loader'



const config = {

	context: path.resolve(__dirname),
	entry: './src/main.ts',
	output: {
		path: path.resolve(__dirname, './dist'),
		publicPath: '/dist/',
		filename: 'build.js',
	},

	node: {
		fs: 'empty'
	},

	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'vue': 'vue/dist/vue.js',
			'technicalindicators': 'technicalindicators/dist/index.js',
		},
	},

	module: {
		rules: [{
			test: /\.ts$/,
			loader: 'awesome-typescript-loader',
			include: [path.resolve(__dirname, 'src')],
			exclude: /node_modules/,
			options: {
				instance: 'tsc',
				useCache: true,
			},
		}, {
			test: /\.html$/,
			loader: 'vue-template-loader',
			options: {
				transformToRequire: {
					img: 'src',
				},
				scoped: false,
				hmr: true,
			},
		}, {
			test: /\.css$/,
			loader: ['style-loader', 'css-loader', 'stylus-loader'],
		}, {
			test: /\.(png|jpg|ico|gif|svg)$/,
			loader: 'file-loader',
			options: {
				objectAssign: 'Object.assign',
			},
		}],
	},

	plugins: [
		new webpack.DllReferencePlugin({
			context: process.cwd(),
			manifest: require(path.resolve('assets', 'vendor.json')),
		}),
		new webpack.IgnorePlugin(/typescript/),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
		}),
	],

	// devtool: 'inline-source-map',
	// devtool: 'source-map',

} as webpack.Configuration



const envconfig = {
	$env: process.env.NODE_ENV,
} as { [key: string]: string }



if (process.env.NODE_ENV == 'DEVELOPMENT') {
	envconfig.$devsecret = 'FREE BITCOIN'
	config.devtool = 'source-map'
	config.watchOptions = { ignored: /node_modules/ }
	config.plugins.push(new CheckerPlugin())
	config.plugins.push(new LiveReloadPlugin({ appendScriptTag: true }))
	// config.plugins.push(new BundleAnalyzerPlugin.BundleAnalyzerPlugin())
}



if (process.env.NODE_ENV == 'PRODUCTION') {

}



Object.keys(envconfig).forEach(function(key) {
	let value = envconfig[key]
	envconfig[key] = '"' + value + '"'
})

config.plugins.push(new webpack.DefinePlugin({ 'process.env': envconfig }))



export default config

