// Definitions by: Pawel Badenski <https://github.com/pbadenski>

declare module 'metrics' {

	import events = require('events')

	namespace metrics {
		type Metric = Meter | Timer | Counter | Histogram

		type MeterPrintObj = {
			type: "histogram",
			count: number,
			m1: number,
			m5: number,
			m15: number,
			mean: number,
			unit: "seconds"
		}

		class Meter {
			type: "meter"
			mark: (n?: number) => void
			rates: () => ({
				1: number
				5: number
				15: number
				mean: number
			})
			fifteenMinuteRate: () => number
			fiveMinuteRate: () => number
			oneMinuteRate: () => number
			meanRate: () => number
			printObj: () => MeterPrintObj
		}

		class Timer {
			type: "timer"
			histogram: Histogram
			meter: Meter

			clear: () => void
			update: (duration: number) => void

			count: () => number
			min: () => number
			max: () => number
			mean: () => number
			stdDev: () => number
			percentiles: (percentiles: number[]) => ({ [percentile: number]: number })
			values: () => number[]

			oneMinuteRate: () => void
			fiveMinuteRate: () => void
			fifteenMinuteRate: () => void
			meanRate: () => void
			tick: () => void
			rates: () => void

			printObj: () => ({
				type: "timer",
				duration: HistogramPrintObj
				rate: MeterPrintObj
			})
		}

		class Counter {
			type: "counter"

			clear: () => void

			inc: () => void
			dec: () => void
			printObj: () => ({
				type: "counter"
				count: number
			})
		}

		type HistogramPrintObj = {
			type: "histogram",

			min: number,
			max: number,
			sum: number,
			variance: number | null,
			mean: number | null,
			std_dev: number | null,
			count: number,
			median: number,
			p75: number,
			p95: number,
			p99: number,
			p999: number
		}

		class Histogram {
			type: "histogram"
			sample: any
			min: number
			max: number
			sum: number

			clear: () => void
			update: (value: number, timestamp: number) => void
			updateVariance: (value: number) => void

			percentiles: (percentiles: number[]) => ({ [percentile: number]: number })
			variance: () => number | null
			mean: () => number | null
			stdDev: () => number | null
			values: () => number[]

			printObj: () => HistogramPrintObj
		}

		interface Metrics {
			meters: (Meter & { name: string })[]
			timers: (Timer & { name: string })[]
			counters: (Counter & { name: string })[]
			histograms: (Histogram & { name: string })[]
		}

		abstract class ScheduledReporter extends events.EventEmitter {
			constructor(registry: Report)
			start: () => void
			stop: () => void
			getMetrics: () => Metrics

			abstract report: () => void
		}

		class ConsoleReporter extends ScheduledReporter {
			constructor(registry: Report)
			report: () => void
		}

		class CsvReporter extends ScheduledReporter {
			constructor(registry: Report)
			report: () => void
			write: (timestamp: number, name: string, header: string, line: string, values: any[]) => void
			reportCounter: (counter: Counter, timestamp: number) => void
			reportMeter: (meter: Meter, timestamp: number) => void
			reportTimer: (timer: Timer, timestamp: number) => void
			reportHistogram: (histogram: Histogram, timestamp: number) => void
		}

		class GraphiteReporter extends ScheduledReporter {
			constructor(registry: Report)
			report: () => void
			write: (timestamp: number, name: string, header: string, line: string, values: any[]) => void
			reportCounter: (counter: Counter, timestamp: number) => void
			reportMeter: (meter: Meter, timestamp: number) => void
			reportTimer: (timer: Timer, timestamp: number) => void
			reportHistogram: (histogram: Histogram, timestamp: number) => void
		}

		class Report {
			addMetric: (eventName: string, metric: Metric) => void
			getMetric: (eventName: string) => Metric
			summary: () => { [namespace: string]: { [name: string]: Metric } }
		}
	}

	export = metrics

}

