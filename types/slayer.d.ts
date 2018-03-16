/** Declaration file generated by dts-gen */

declare module 'slayer' {

	export = slayer

	declare function slayer(config?: any): any

	declare namespace slayer {
		class Slayer {
			constructor(config?: any)

			configureFilters(config?: any): any

			createReadStream(options?: any): any

			filterDataItem(item?: any): any

			fromArray(data?: any): any

			getItem(item?: any, originalItem?: any, i?: any): any

			getValueX(item?: any, i?: any): any

			getValueY(item?: any): any

			transform(mapper?: any): any

			use(fn?: any): any

			x(mapper?: any): any

			y(mapper?: any): any

		}

	}

}


