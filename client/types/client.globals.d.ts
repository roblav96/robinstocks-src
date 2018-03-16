// 

import Vue, { ComponentOptions, WatchOptions, FunctionalComponentOptions } from 'vue'
import * as VueRouter from 'vue-router'
import * as Vuex from 'vuex'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import * as ee3 from 'eventemitter3'



declare global {

	namespace NodeJS {
		interface Process {
			$domain: string
			$version: string
			ee3: ee3.EventEmitter
		}
		interface ProcessEnv {
			NODE_ENV: 'DEVELOPMENT' | 'PRODUCTION'
		}
		interface Global {
			Chartist: any
		}
	}

	interface Window {

	}

	interface VueComponent extends ComponentOptions<Vue> { }

	interface VueHeaderItem {
		key: string
		text: string
		sortable: boolean
		stdev: boolean
		vif: boolean
		vpaths: Array<string>
		vpercent: boolean
		pmcolor: boolean
	}
	interface VueLocation extends VueRouter.Location { }
	interface VueRoute extends VueRouter.Route { }
	type VueRouteNext = (to?: VueRouter.RawLocation | false | ((vm: Vue) => any) | void) => void

	interface VueTableHeader {
		text: string
		align: string
		sortable: boolean
		value: string
	}
	interface VueTablePagination {
		sortBy: string
		descending: boolean
		page: number
		rowsPerPage: number
		totalItems: number
	}

	interface ChartElement<T> extends HTMLElement {
		chart: T
	}

	interface BottomTabItem {
		id: string
		dname: string
		icon: string
		component: VueComponent
	}

}



declare module 'highcharts' {
	interface ChartObject {
		quotes(): Array<FullQuote>
		update(options: Options, redraw?: boolean, one2one?: boolean): void
	}
	interface LineStates {
		radiusPlus?: number
	}
	interface SeriesChart {
		dataGrouping?: any
	}
	interface IndividualSeriesOptions {
		step?: string
		lineWidth?: number
		marker?: { symbol?: string }
		turboThreshold?: number
		fillOpacity?: number
		tooltip?: {
			changeDecimals?: number
			valueDecimals?: number
			pointFormatter?: any
		}
		dataGrouping?: {
			enabled?: boolean
			approximation?: string
			groupPixelWidth?: number
		}
		states?: any
	}
	interface TooltipOptions extends SeriesTooltipOptions {
		formatter?: (params: any) => boolean | string | Array<string>
	}
	interface CrosshairObject {
		snap?: boolean
		label?: {
			enabled?: boolean
			formatter?: (this: any, value: number) => string
		}
	}
}

declare module 'highcharts/highstock' {
	interface AxisOptions {
		ordinal?: boolean
		top?: string
		height?: string
		overscroll?: number
		labels?: {
			formatter?: (this: {
				axis: AxisOptions
				chart: Highcharts.ChartObject
				isFirst: boolean
				isLast: boolean
				pos: number
				value: number
			}) => string
		}
	}
}










declare global {
	type PlotlyMarker = Partial<_PlotlyMarker>
	interface _PlotlyMarker extends Plotly.ScatterMarker {
		color: Array<string>
	}

	type PlotlyTrace = Partial<_PlotlyTrace>
	interface _PlotlyTrace extends Plotly.Data {
		x: Array<Plotly.Datum>
		y: Array<Plotly.Datum>
		text: Array<string>
		marker: PlotlyMarker
		boxmean: boolean
		boxpoints: boolean
		close: Array<Plotly.Datum>
		increasing: PlotlyTrace
		decreasing: PlotlyTrace
		fillcolor: Plotly.Color
		high: Array<Plotly.Datum>
		hoverinfo: string
		hoverlabel: {
			font: {
				family: string
				size: number
			}
			namelength: number
		}
		index: number
		legendgroup: string
		line: Plotly.ScatterLine
		low: Array<Plotly.Datum>
		name: string
		opacity: number
		open: Array<Plotly.Datum>
		orientation: string
		showlegend: boolean
		type: string
		uid: string
		visible: boolean
		whiskerwidth: number
		xaxis: string
		xcalendar: string
		yaxis: string
		ycalendar: string
		error_x: {
			visible: boolean
		}
		error_y: {
			visible: boolean
		}
		hovertext: string
		textposition: string
		width: number
	}

	type PlotlyLayout = Partial<_PlotlyLayout>
	interface _PlotlyLayout extends Plotly.Layout {
		annotations: Array<any>
		autosize: boolean
		bargap: number
		bargroupgap: number
		barmode: string
		barnorm: string
		boxgap: number
		boxgroupgap: number
		boxmode: string
		calendar: string
		dragmode: string
		font: {
			color: Plotly.Color
			family: string
			size: number
		}
		height: number
		hidesources: boolean
		hoverlabel: {
			font: {
				family: string
				size: number
			}
			namelength: number
		}
		hovermode: string
		images: Array<any>
		legend: any
		margin: {
			autoexpand: boolean
			b: number
			l: number
			pad: number
			r: number
			t: number
		}
		paper_bgcolor: Plotly.Color
		plot_bgcolor: Plotly.Color
		separators: string
		shapes: Array<any>
		showlegend: boolean
		sliders: Array<any>
		smith: boolean
		title: string
		titlefont: {
			color: Plotly.Color
			family: string
			size: number
		}
		updatemenus: Array<any>
		width: number
		xaxis: PlotlyAxis
		yaxis: PlotlyAxis
		yaxis2: PlotlyAxis
		yaxis3: PlotlyAxis
		yaxis4: PlotlyAxis
		yaxis5: PlotlyAxis
		yaxis6: PlotlyAxis
		yaxis7: PlotlyAxis
		yaxis8: PlotlyAxis
		yaxis9: PlotlyAxis
	}

	type PlotlyAxis = Partial<_PlotlyAxis>
	interface _PlotlyAxis extends Plotly.Axis {
		anchor: string
		autorange: boolean
		calendar: string
		color: Plotly.Color
		constrain: string
		constraintoward: string
		domain: Array<number>
		dtick: string
		exponentformat: string
		fixedrange: boolean
		hoverformat: string
		layer: string
		nticks: number
		range: Array<string>
		rangemode: string
		rangeselector: {
			buttons: Array<any>
			visible: boolean
		}
		rangeslider: {
			visible: boolean
		}
		showexponent: string
		showgrid: boolean
		showline: boolean
		showspikes: boolean
		showticklabels: boolean
		side: string
		tick0: string
		tickangle: string
		tickfont: {
			color: Plotly.Color
			family: string
			size: number
		}
		tickformat: string
		tickmode: string
		tickprefix: string
		ticks: string
		ticksuffix: string
		title: string
		titlefont: {
			color: Plotly.Color
			family: string
			size: number
		}
		type: string
		visible: boolean
		zeroline: boolean
		gridcolor: Plotly.Color
		gridwidth: number
		separatethousands: boolean
		zerolinecolor: Plotly.Color
		zerolinewidth: number
		overlaying: string
	}

	type PlotlyConfig = Partial<_PlotlyConfig>
	interface _PlotlyConfig extends Plotly.Config {
		autosizable: boolean
		displayModeBar: boolean
		displaylogo: boolean
		doubleClick: string
		editable: boolean
		edits: {
			annotationPosition: boolean
			annotationTail: boolean
			annotationText: boolean
			axisTitleText: boolean
			colorbarPosition: boolean
			colorbarTitleText: boolean
			legendPosition: boolean
			legendText: boolean
			shapePosition: boolean
			titleText: boolean
		}
		fillFrame: boolean
		frameMargins: number
		globalTransforms: Array<any>
		linkText: string
		logging: boolean
		mapboxAccessToken: string
		modeBarButtons: boolean
		modeBarButtonsToAdd: Array<any>
		modeBarButtonsToRemove: Array<any>
		plotGlPixelRatio: number
		queueLength: number
		scrollZoom: boolean
		sendData: boolean
		showAxisDragHandles: boolean
		showAxisRangeEntryBoxes: boolean
		showLink: boolean
		showSources: boolean
		showTips: boolean
		staticPlot: boolean
		topojsonURL: string
	}

}

declare module 'vue/types/options' {
	interface ComponentOptions<V extends Vue> {
		store?: Vuex.Store<StoreState>
	}
}

declare module 'vue/types/vue' {
	interface Vue {
		$store: Vuex.Store<StoreState>
	}
	interface VueConstructor {
		options: ComponentOptions<Vue>
	}
}

declare module 'vue-property-decorator' {
	function Watch(path: string, options?: WatchOptions): MethodDecorator & PropertyDecorator
}

declare module 'av-ts' {
	type VClass<T extends Vue> = {
		new(): T
		extend(option: ComponentOptions<Vue> | FunctionalComponentOptions): typeof Vue
	}
	function Mixin<T extends Vue>(parent: typeof Vue, ...traits: (typeof Vue)[]): VClass<T>
}



declare module 'plotly.js' {
	export const version: string
	export function addFrames(gd: Plotly.Root, frameList: Array<any>, indices: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function addTraces(gd: Plotly.Root, traces: Array<PlotlyTrace>, newindices?: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function animate(gd: Plotly.Root, frameOrGroupNameOrFrameList: Array<any>, animationOpts: any): Promise<void>
	export function deleteFrames(gd: Plotly.Root, frameList: Array<any>): Promise<Plotly.PlotlyHTMLElement>
	export function deleteTraces(gd: Plotly.Root, indices: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function downloadImage(gd: Plotly.Root, opts: any): Promise<string>
	export function extendTraces(gd: Plotly.Root, update: PlotlyTrace, indices: Array<number>, maxPoints: number): Promise<Plotly.PlotlyHTMLElement>
	export function moveTraces(gd: Plotly.Root, currentindices: Array<number>, newindices: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function newPlot(gd: Plotly.Root, data: Array<PlotlyTrace>, layout: PlotlyLayout, config: PlotlyConfig): Promise<Plotly.PlotlyHTMLElement>
	export function plot(gd: Plotly.Root, data: Array<PlotlyTrace>, layout?: PlotlyLayout, config?: PlotlyConfig): Promise<Plotly.PlotlyHTMLElement>
	export function prependTraces(gd: Plotly.Root, update: PlotlyTrace, indices: Array<number>, maxPoints: number): Promise<Plotly.PlotlyHTMLElement>
	export function purge(gd: Plotly.Root): Plotly.Root
	export function redraw(gd: Plotly.Root): Promise<Plotly.PlotlyHTMLElement>
	export function register(_modules: any): void
	export function relayout(gd: Plotly.Root, layout: PlotlyLayout, indices: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function restyle(gd: Plotly.Root, data: PlotlyTrace, indices: Array<number>): Promise<Plotly.PlotlyHTMLElement>
	export function setPlotConfig(configObj: PlotlyConfig): any
	export function toImage(gd: Plotly.Root, opts: any): Promise<string>
	export function update(gd: Plotly.Root, traceUpdate: PlotlyTrace, layoutUpdate?: PlotlyLayout): Promise<Plotly.PlotlyHTMLElement>
	export function validate(data: Array<PlotlyTrace>, layout: PlotlyLayout): any
}






