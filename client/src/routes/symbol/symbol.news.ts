//

import * as Template from './symbol.news.html?style=./symbol.news.css'
import * as Vts from 'vue-property-decorator'
import * as Avts from 'av-ts'
import Vue from 'vue'
import _ from 'lodash'
import lockr from 'lockr'
import Symbol from './symbol'
import * as shared from '../../shared'
import * as utils from '../../services/utils'
import * as http from '../../services/http'
import * as socket from '../../services/socket'



@Template
@Vts.Component(<VueComponent>{
	name: 'SymbolNews',
} as any)
export default class SymbolNews extends Avts.Mixin<Vue & utils.Mixin>(Vue, utils.Mixin) {

	get parent() { return this.$parent as Symbol }

	created() {
		this.syncNews()
	}

	mounted() {
		(this.$refs.symbol_news_search as HTMLElement).focus()
	}

	beforeDestroy() {
		socket.emitter.removeListener(this.socketNews)
		this.syncStamp.cancel()
	}

	syncStamp = _.debounce(this.$forceUpdate, 1000, { leading: false, trailing: true })



	get symbol() { return this.$route.params.symbol.toUpperCase() }
	@Vts.Watch('symbol') w_symbol(to: string, from: string) {
		this.syncNews()
	}

	syncNews() {
		socket.emitter.removeListener(this.socketNews)
		http.post<RangesBody, Array<NewsItem>>('/get.news', { symbols: [this.symbol] }, { production: true }).then(response => {
			utils.vdestroyedSafety(this)
			this.items = response
			socket.emitter.addListener(shared.RKEY.NEWSES + ':' + this.symbol, this.socketNews)
		}).catch(error => {
			console.error('sync > error', error)
		})
	}

	socketNews(item: NewsItem) {
		item = shared.explode(shared.RMAP.NEWSES, item)
		let found = this.items.find(v => v && v.id == item.id)
		if (found) return shared.merge(found, item);
		this.items.push(item)
	}



	search = ''
	items = [] as Array<NewsItem>
	get v_items() {
		this.syncStamp()
		let search = utils.cleanSearch(this.search)
		if (!search) return this.items;
		return this.items.filter(function(item) {
			let cleaned = utils.cleanSearch(item.api + ' ' + item.source + ' ' + item.min + ' ' + item.title + ' ' + item.summary)
			return cleaned.indexOf(search) >= 0
		})
	}

	headers = ([
		{ text: '', value: '', sortable: false },
		{ text: 'Source', value: 'source', sortable: false },
		{ text: 'Title', value: 'title', sortable: false },
		{ text: 'Published', value: 'published' },
		{ text: 'Stamp', value: 'stamp' },
	] as Array<VueTableHeader>).mapFast(function(header) {
		header.align = 'left'
		return header
	})

	pagination = { sortBy: 'published', descending: true, rowsPerPage: -1 } as VueTablePagination



	get v_stocktwits() {
		return 'https://stocktwits.com/symbol/' + this.symbol
	}
	get v_yahoo() {
		return 'https://finance.yahoo.com/quote/' + this.symbol + '/community?p=' + this.symbol
	}

	v_source(source: string) {
		// source = source.replace(/\.W+/g, '').replace(/\s/g, '').trim().toLowerCase()
		source = source.replace(/[^a-zA-Z0-9.]/g, '').trim().toLowerCase()
		let split = source.split('.')
		if (split.length > 1) return source;
		return source + '.com'
	}
	v_logo_url(source: string) {
		return 'https://logo.clearbit.com/' + source
	}
	on_logo_error(event: Event) {
		let el = event.target as HTMLImageElement
		el.src = 'https://logo.clearbit.com/' + _.sample([
			'www.otcmarkets.com',
			'www.nyse.com',
			'www.nasdaq.com',
			'www.batstrading.com',
		])
	}
	v_decode(str: string) {
		return shared.decodeString(str)
	}



}







