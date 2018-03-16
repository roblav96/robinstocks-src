// 

declare namespace ECharts {

	/*==============================
	=            STATIC            =
	==============================*/

	// const version: string

	// function connect(groupId: any): any

	// function disConnect(groupId: any): void

	// function disconnect(groupId: any): void

	// function dispose(chart: any): void

	// function extendChartView(opts: any): any

	// function extendComponentModel(opts: any): any

	// function extendComponentView(opts: any): any

	// function extendSeriesModel(opts: any): any

	// function getInstanceByDom(dom: any): any

	// function getInstanceById(key: any): any

	// function getMap(mapName: any): any

	// function loadMap(): void

	// function parseGeoJSON(geoJson: any): any

	// function registerAction(actionInfo: any, eventName: any, action: any): void

	// function registerCoordinateSystem(type: any, CoordinateSystem: any): void

	// function registerLayout(priority: any, layoutFunc: any): void

	// function registerLoading(name: any, loadingFx: any): void

	// function registerMap(mapName: any, geoJson: any, specialAreas: any): void

	// function registerPostUpdate(postUpdateFunc: any): void

	// function registerPreprocessor(preprocessorFunc: any): void

	// function registerProcessor(priority: any, processorFunc: any): void

	// function registerTheme(name: any, theme: any): void

	// function registerVisual(priority: any, visualFunc: any): void

	// function setCanvasCreator(creator: any): void

	// function throttle(fn: any, delay: any, debounce: any, ...args: any[]): any



	const graphic: any

	function init(
		dom: HTMLDivElement | HTMLCanvasElement,
		theme?: Object | string,
		opts?: {
			devicePixelRatio?: number
			renderer?: string
			width?: number
			height?: number
		}
	): ECharts

	function connect(group: string | Array<string>): void

	function disConnect(group: string): void

	function dispose(target: ECharts | HTMLDivElement | HTMLCanvasElement): void

	function getInstanceByDom(target: HTMLDivElement | HTMLCanvasElement): void

	function registerMap(mapName: string, geoJson: Object, specialAreas?: Object): void

	function registerTheme(themeName: string, theme: Object): void





	/*=============================
	=            CLASS            =
	=============================*/

	class ECharts {

		// id: string

		// clear(): void

		// containPixel(finder: any, value: any): any

		// convertFromPixel(args: any[]): any

		// convertToPixel(args: any[]): any

		// dispatchAction(payload: any, opt: any): void

		// dispose(): void

		// getConnectedDataURL(opts: any): any

		// getDataURL(opts: any): any

		// getDevicePixelRatio(): any

		// getDom(): any

		// getHeight(): any

		// getModel(): any

		// getOption(): any

		// getRenderedCanvas(opts: any): any

		// getViewOfComponentModel(componentModel: any): any

		// getViewOfSeriesModel(seriesModel: any): any

		// getVisual(finder: any, visualType: any): any

		// getWidth(): any

		// getZr(): any

		// hideLoading(): void

		// isDisposed(): any

		// isSilent(event: any): any

		// makeActionFromEvent(eventObj: any): any

		// off(eventName: any, handler: any, context: any): void

		// on(eventName: any, handler: any, context: any): void

		// one(eventName: any, handler: any, context: any): void

		// resize(args: any[]): any

		// setOption(option: any, notMerge: any, lazyUpdate: any): void

		// setTheme(): void

		// showLoading(name: any, cfg: any): void

		// trigger(type: any, args: any[]): any

		// triggerWithContext(type: any, args: any[]): any





		_model: { option: ECharts.Options }

		group: string

		setOption(option: Options, notMerge?: boolean, lazyUpdate?: boolean, silent?: boolean): void

		getWidth(): number

		getHeight(): number

		getDom(): HTMLCanvasElement | HTMLDivElement

		getOption(): Options

		resize(opts?: { width?: number, height?: number }): void

		dispatchAction(payload: any): void

		on(eventName: string, handler: Function, context?: Object): void

		off(eventName: string, handler?: Function): void

		showLoading(type?: string, opts?: Object): void

		hideLoading(): void

		getDataURL(opts: {
			type?: string
			pixelRatio?: number
			backgroundColor?: string
		}): string

		getConnectedDataURL(opts: {
			type: string
			pixelRatio: number
			backgroundColor: string
		}): string

		clear(): void

		isDisposed(): boolean

		dispose(): void

		convertFromPixel(finder: ConvertFinder, values?: Array<number>): Array<number>

		convertToPixel(finder: ConvertFinder, values: Array<any>): Array<any>

		containPixel(finder: ConvertFinder, values?: Array<number>): boolean

	}

	interface ConvertFinder {
		seriesIndex?: Array<number>
		seriesId?: string
		seriesName?: string
		geoIndex?: Array<number>
		geoId?: string
		geoName?: string
		xAxisIndex?: Array<number>
		xAxisId?: string
		xAxisName?: string
		yAxisIndex?: Array<number>
		yAxisId?: string
		yAxisName?: string
		gridIndex?: Array<number>
		gridId?: string
		gridName?: string
	}

	interface Event {
		batch: Array<any>
		type: string
		start: number
		end: number
	}

	interface DataPoint {
		value?: Array<number>
		name?: string
		symbol?: string
		symbolSize?: number
		symbolRotate?: number
		symbolOffset?: Array<any>
		label?: Style
		itemStyle?: Style
		lineStyle?: Style
		areaStyle?: Style
	}



	/*===============================
	=            OPTIONS            =
	===============================*/

	interface Options {
		animation?: boolean
		animationDuration?: number
		animationDurationUpdate?: number
		animationEasing?: string
		animationEasingUpdate?: string
		animationThreshold?: number
		axisPointer?: AxisPointer
		backgroundColor?: string
		brush?: Array<any>
		color?: Array<string>
		dataZoom?: Array<DataZoom>
		grid?: Array<Grid>
		hoverLayerThreshold?: number
		legend?: any
		markArea?: Array<MarkArea>
		markLine?: Array<MarkLine>
		markPoint?: Array<MarkPoint>
		marker?: Array<any>
		progressive?: number
		progressiveThreshold?: number
		series?: Array<Series>
		textStyle?: TextStyle
		tooltip?: Tooltip
		useUTC?: boolean
		visualMap?: Array<any>
		xAxis?: Array<Axis>
		yAxis?: Array<Axis>
		toolbox?: any
		title?: any
	}

	interface Grid {
		backgroundColor?: string
		borderColor?: string
		borderWidth?: number
		containLabel?: boolean
		height?: any
		top?: any
		bottom?: any
		left?: any
		right?: any
		show?: boolean
		width?: any
		z?: number
		zlevel?: number
		tooltip?: Tooltip
	}

	interface DataZoom {
		handleStyle?: StyleOptions
		textStyle?: StyleOptions
		dataBackground?: {
			lineStyle?: StyleOptions
			areaStyle?: StyleOptions
		}
		top?: any
		minSpan?: number
		maxSpan?: number
		bottom?: any
		handleIcon?: string
		showDetail?: boolean
		showDataShadow?: boolean
		left?: any
		right?: any
		height?: any
		angleAxisIndex?: Array<number>
		disabled?: boolean
		moveOnMouseMove?: string
		zoomOnMouseWheel?: string
		end?: number
		endValue?: number
		filterMode?: string
		orient?: string
		backgroundColor?: string
		borderColor?: string
		fillerColor?: string
		radiusAxisIndex?: Array<number>
		singleAxisIndex?: Array<number>
		start?: number
		startValue?: number
		throttle?: number
		type?: string
		realtime?: boolean
		xAxisIndex?: Array<number>
		yAxisIndex?: Array<number>
		z?: number
		zAxisIndex?: Array<number>
		zlevel?: number
		zoomLock?: boolean
		// labelFormatter?: (y: number, x: number) => string
		labelFormatter?: (...params: any) => string
	}

	interface Axis {
		data?: Array<any>
		min?: number
		max?: number
		gridIndex?: number
		splitNumber?: number
		axisLabel?: AxisLabel
		axisLine?: AxisLine
		axisPointer?: AxisPointer
		axisTick?: AxisTick
		boundaryGap?: boolean
		inverse?: boolean
		name?: string
		uuid?: string
		nameGap?: number
		nameLocation?: string
		nameRotate?: any
		nameTextStyle?: {
			padding?: number
			align?: string
			verticalAlign?: string
			backgroundColor?: string
			borderColor?: string
			borderRadius?: number
			borderWidth?: number
			width?: number
			height?: number
		} & TextStyle & ShadowOpts
		nameTruncate?: {
			ellipsis?: string
			maxWidth?: any
			placeholder?: string
		}
		offset?: number
		rangeEnd?: any
		rangeStart?: any
		show?: boolean
		silent?: boolean
		scale?: boolean
		position?: string
		silent?: boolean
		splitArea?: {
			areaStyle?: {
				color?: Array<string>
			}
			show?: boolean
		}
		splitLine?: {
			lineStyle?: StyleOptions
			show?: boolean
		}
		tooltip?: Tooltip
		triggerEvent?: boolean
		type?: string
		z?: number
		zlevel?: number
	}

	interface AxisTick {
		alignWithLabel?: boolean
		inside?: boolean
		interval?: string
		length?: number
		lineStyle?: StyleOptions
		show?: boolean
	}

	interface AxisLine {
		lineStyle?: {
			color?: string
			type?: string
			width?: number
		}
		onZero?: boolean
		show?: boolean
	}

	interface AxisLabel {
		inside?: boolean
		interval?: number
		margin?: number
		formatter?: (value: number) => string
		rotate?: number
		show?: boolean
		showMaxLabel?: any
		showMinLabel?: any
		lineStyle?: StyleOptions
		textStyle?: TextStyle
	}

	interface ShadowOpts {
		color?: string
		shadowBlur?: number
		shadowColor?: string
		shadowOffsetX?: number
		shadowOffsetY?: number
		opacity?: number
	}

	interface AxisPointer {
		animation?: any
		animationDurationUpdate?: number
		handle?: {
			color?: string
			icon?: string
			margin?: number
			shadowBlur?: number
			shadowColor?: string
			shadowOffsetX?: number
			shadowOffsetY?: number
			show?: boolean
			size?: number
			throttle?: number
		}
		label?: {
			backgroundColor?: string
			borderColor?: any
			borderWidth?: number
			// formatter?: (params: Array<TooltipPositionParams>, ticket?: string, callback?: (ticket, result) => string) => string
			formatter?: (...params: any) => string
			margin?: number
			padding?: Array<number>
			precision?: string
			shadowBlur?: number
			shadowColor?: string
			show?: boolean
			textStyle?: TextStyle
		}
		lineStyle?: {
			color?: string
			type?: string
			width?: number
			opacity?: number
		}
		link?: any
		shadowStyle?: ShadowOpts
		show?: boolean
		snap?: boolean
		status?: any
		triggerOn?: any
		triggerTooltip?: boolean
		type?: string
		value?: any
		z?: number
		zlevel?: number
	}

	interface Tooltip {
		formatter?: (params: Array<TooltipParams>) => string
		position?: (pos, params, el, elRect, size) => any
		alwaysShowContent?: boolean
		axisPointer?: AxisPointer
		backgroundColor?: string
		borderColor?: string
		borderRadius?: number
		borderWidth?: number
		confine?: boolean
		displayMode?: string
		enterable?: boolean
		extraCssText?: string
		hideDelay?: number
		padding?: number
		show?: boolean
		showContent?: boolean
		showDelay?: number
		textStyle?: TextStyle
		transitionDuration?: number
		trigger?: string
		triggerOn?: string
		z?: number
		zlevel?: number
	}

	interface TooltipPositionParams {
		componentType?: string
		componentSubType?: string
		seriesType?: string
		seriesIndex?: number
		seriesId?: string
		seriesName?: string
		name?: string
		dataIndex?: number
		data?: Array<any>
		dataType?: string
		value?: Array<number>
		color?: string
		$vars?: string
		axisDim?: string
		axisIndex?: number
		axisType?: string
		axisId?: string
		axisValue?: number
		axisValueLabel?: string
		percent?: number
	}

	interface MarkArea {
		animation?: boolean
		itemStyle?: Style
		label?: Style
		tooltip?: Tooltip
		data?: Array<any>
		silent?: boolean
		z?: number
		zlevel?: number
	}

	interface MarkLine {
		animation?: boolean
		label?: Style
		lineStyle?: Style
		precision?: number
		symbol?: Array<string>
		symbolSize?: number
		data?: Array<any>
		silent?: boolean
		tooltip?: Tooltip
		z?: number
		zlevel?: number
	}

	interface MarkPoint {
		itemStyle?: Style
		label?: Style
		symbol?: string
		symbolSize?: number
		tooltip?: Tooltip
		z?: number
		zlevel?: number
	}

	interface TextStyle {
		color?: string
		fontFamily?: string
		fontSize?: number
		fontStyle?: string
		fontWeight?: string
	}

	interface StyleOptions {
		borderColor?: string
		borderColor0?: string
		borderWidth?: number
		shadowColor?: string
		shadowBlur?: number
		shadowOffsetX?: number
		shadowOffsetY?: number
		color?: string
		color0?: string
		position?: string
		type?: string
		show?: boolean
		width?: number
		opacity?: number
		show?: boolean
		smooth?: number
		length?: number
		length2?: number
		textStyle?: StyleOptions
		lineStyle?: StyleOptions
	}
	interface Style {
		normal?: StyleOptions
		emphasis?: StyleOptions
	}

	interface Series {
		connectNulls?: boolean
		symbolSize?: number
		symbol?: string
		symbolRotate?: number
		symbolOffset?: Array<any>
		smooth?: boolean
		step?: string
		smoothMonotone?: string
		sampling?: string
		silent?: boolean
		stack?: string
		large?: boolean
		largeThreshold?: number
		showAllSymbol?: boolean
		showSymbol?: boolean
		animation?: boolean
		tooltip?: Tooltip
		data?: Array<ECharts.DataPoint>
		xAxisIndex?: number
		yAxisIndex?: number
		animationType?: string
		animationDelay?: number
		animationDuration?: number
		animationEasing?: string
		animationUpdate?: boolean
		barMaxWidth?: any
		barWidth?: any
		barGap?: any
		barCategoryGap?: string
		coordinateSystem?: string
		hoverAnimation?: boolean
		areaStyle?: Style
		lineStyle?: Style
		clipOverflow?: boolean
		markPoint?: MarkPoint
		markLine?: MarkLine
		markArea?: MarkArea
		itemStyle?: Style
		layout?: string
		legendHoverLink?: boolean
		name?: string
		uuid?: string
		type?: string
		radius?: any
		center?: Array<any>
		roseType?: string
		label?: Style
		labelLine?: Style
		id?: string
		z?: number
		zlevel?: number
	}

	interface TooltipParams {
		$vars: string[]
		axisDim: string
		axisId: string
		axisIndex: number
		axisType: string
		axisValue: string
		axisValueLabel: string
		color: string
		componentSubType: string
		componentType: string
		data: number[]
		dataIndex: number
		dataType: any
		marker: string
		name: string
		seriesIndex: number
		seriesType: string
		seriesName: string
		seriesId: string
		value: number
	}

}

declare module 'echarts' {
	export = ECharts
}





