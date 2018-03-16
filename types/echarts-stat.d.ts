// 

declare namespace EChartsStat {

	type InputData = Array<Array<number>>
	type OutputData = Array<Array<number>>

	interface HistogramBins {
		bins: Array<HistogramBinsBin>
		data: OutputData
	}
	interface HistogramBinsBin {
		x0: number
		y0: number
		sample: Array<number>
	}
	function histogram(data: Array<number>, binMethod: 'squareRoot' | 'scott' | 'freedmanDiaconis' | 'sturges'): HistogramBins

	namespace clustering {
		interface Result {
			centroids: OutputData
			clusterAssment: OutputData
			pointsInCluster: OutputData
		}
		function hierarchicalKMeans(data: InputData, clusterNumer: number, stepByStep: boolean): Result
		function kMeans(data: InputData, clusterNumer: number): Result
	}

	interface RegressionResult<T = Array<number>> {
		points: OutputData
		parameter: T
		expression: string
		gradient: number
		intercept: number
	}
	function regression(regreMethod: 'exponential' | 'logarithmic' | 'polynomial', data: InputData, order?: number): RegressionResult

	interface LinearRegressionResult {
		gradient: number
		intercept: number
	}
	function regression(regreMethod: 'linear', data: InputData, order?: number): RegressionResult<LinearRegressionResult>

	namespace statistics {
		function deviation(data: Array<number>): number
		function sampleVariance(data: Array<number>): number
		function quantile(data: Array<number>, p: number): number
		function max(data: Array<number>): number
		function mean(data: Array<number>): number
		function median(data: Array<number>): number
		function min(data: Array<number>): number
		function sum(data: Array<number>): number
	}

}

declare module 'echarts-stat' {
	export = EChartsStat
}

