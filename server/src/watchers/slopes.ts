//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')
import logger = require('../adapters/logger')

import cron = require('cron')
import moment = require('moment')
import redis = require('../adapters/redis')
import socket = require('../adapters/socket')
import robinhood = require('../adapters/robinhood')



export const sslopes = {} as { [symbol: string]: SymbolSlopes }

export function initSymbols(symbols: Array<string>): Promise<void> {
	let coms = symbols.mapFast(v => ['hgetall', shared.RKEY.CALCS + ':' + v])
	return redis.main.pipelinecoms(coms).then(function(cquotes: Array<CalcQuote>) {
		utils.fixPipelineFast(cquotes)
		symbols.forEachFast(function(symbol, i) {
			let cquote = utils.fromhget(cquotes[i])
			cquote.symbol = symbol
			
		})
		return Promise.resolve()
	})
}



class SymbolSlopes {
	
	

}
















