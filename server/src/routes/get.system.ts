//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('../adapters/utils')

import moment = require('moment')
import si = require('systeminformation')
import r = require('../adapters/rethinkdb')
import redis = require('../adapters/redis')
import http = require('../adapters/http')



const si_fns = [
	// { fn: 'baseboard', init: true, bad: true },
	// { fn: 'battery', sync: true, bad: true },
	// { fn: 'bios', init: true, bad: true },
	{ fn: 'blockDevices', other: true },
	{ fn: 'cpu', init: true },
	{ fn: 'cpuCache', other: true },
	{ fn: 'cpuCurrentspeed', sync: true },
	{ fn: 'cpuFlags', init: true },
	{ fn: 'cpuTemperature', sync: true },
	{ fn: 'currentLoad', sync: true },
	{ fn: 'diskLayout', init: true },
	{ fn: 'disksIO', sync: true },
	{ fn: 'fsSize', sync: true },
	{ fn: 'fsStats', sync: true },
	{ fn: 'fullLoad', other: true },
	{ fn: 'graphics', init: true },
	// { fn: 'inetChecksite', other: true },
	{ fn: 'inetLatency', init: true },
	{ fn: 'mem', sync: true },
	{ fn: 'memLayout', init: true },
	{ fn: 'networkConnections', sync: true },
	// { fn: 'networkInterfaceDefault', other: true },
	{ fn: 'networkInterfaces', init: true },
	{ fn: 'networkStats', sync: true },
	{ fn: 'osInfo', init: true },
	// { fn: 'processLoad', other: true },
	{ fn: 'processes', processes: true },
	{ fn: 'services', sync: true },
	// { fn: 'shell', other: true, bad: true },
	// { fn: 'system', init: true, bad: true },
	{ fn: 'time', sync: true },
	{ fn: 'users', sync: true, bad: true },
	// { fn: 'version', init: true, bad: true },
	{ fn: 'versions', init: true, bad: true },
] as Array<SystemInformationFn>



export = utils.restifyRoute<GetSystemBody, SystemInformationData>(function(req, res, next) {

	const init = req.body.init
	const sync = req.body.sync
	const other = req.body.other
	const processes = req.body.processes
	const services = Array.isArray(req.body.services) ? req.body.services.join(',') : ''

	const reqfns = si_fns.filter(function(v) {
		if (v.bad == true && req.devsecretvalid != true) return false;
		if (v.fn == 'services') {
			if (sync == true && !!services) return true;
			return false
		}
		if (v.init == true && init == true) return true;
		if (v.sync == true && sync == true) return true;
		if (v.other == true && other == true) return true;
		if (v.processes == true && processes == true) return true;
		return false
	})

	Promise.resolve().then(function() {
		return Promise.all(reqfns.mapFast(function(v) {
			if (v.fn == 'services') return si.services(services);
			return si[v.fn]()
		}))

	}).then(function(resolved) {
		let data = {} as SystemInformationData
		reqfns.forEachFast((v, i) => data[v.fn] = resolved[i])

		if (Array.isArray(_.get(data, 'processes.list'))) {
			data.processes.list.forEachFast(function(item) {
				let stamp = -1
				let split = item.started.split(':')
				if (split.length == 1) stamp = shared.moment(item.started, 'MMM DD').valueOf();
				if (split.length == 2) stamp = shared.moment(item.started, 'mm:ss').valueOf();
				if (split.length == 3) stamp = shared.moment(item.started, 'HH:mm:ss').valueOf();
				if (stamp > (shared.now() + moment.duration(1, 'minute').asMilliseconds())) {
					stamp = stamp - moment.duration(1, 'day').asMilliseconds()
				}
				item.stamp = stamp
			})
		}
		shared.fixResponse(data.cpu)
		if (data.fsSize) data.fsSize = _.orderBy(data.fsSize, ['fs']);

		res.send(data)
		return next()

	}).catch(function(error) {
		return next(utils.generateError(error))
	})

})







