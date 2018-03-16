// 

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import restify = require('restify')
import errors = require('restify-errors')
import shared = require('../shared')
import utils = require('./utils')
import logger = require('./logger')

import forge = require('node-forge')
import redis = require('./redis')
import robinhood = require('./robinhood')





export function getConnectionHash(headers: HttpHeaders) {
	return shared.hash(headers['x-real-ip'] + headers['x-forwarded-for'] + headers['host'] + headers['hostname'])
}

export function login(xid: string, uuid: string, ip: string, conhash: string, rhtoken: string, reftoken: string, rhexpires: number): Promise<RhLoginResponse> {
	if (!xid) throw new errors.PreconditionRequiredError('Undefined xid');
	if (!uuid) throw new errors.PreconditionRequiredError('Undefined uuid');
	if (!ip) throw new errors.PreconditionRequiredError('Undefined ip');
	if (!conhash) throw new errors.PreconditionRequiredError('Undefined conhash');
	if (!rhtoken) throw new errors.PreconditionRequiredError('Undefined rhtoken');
	if (!reftoken) throw new errors.PreconditionRequiredError('Undefined reftoken');
	if (!rhexpires) throw new errors.PreconditionRequiredError('Undefined rhexpires');

	rhexpires = Date.now() + (rhexpires * 1000)
	let date = Date.now().toString()
	let doc = { uuid, ip, conhash, rhtoken, reftoken, rhexpires, date } as SecurityDoc
	doc.bytes = forge.util.bytesToHex(forge.random.getBytesSync(32))
	return generateProbablePrime().then(function(prime) {
		doc.prime = prime
		return redis.main.hmset(shared.RKEY.SYS.SECURITY + ':' + xid, doc).then(function() {
			let sendi: RhLoginResponse = {
				xid,
				token: getHmacToken(doc),
				bytes: doc.bytes,
				tstamp: Date.now(),
				rhtoken,
			}
			return Promise.resolve(sendi)
		})
	})
}

export function logout(xid: string): Promise<boolean> {
	console.warn('logout > xid', xid)
	return redis.main.del(shared.RKEY.SYS.SECURITY + ':' + xid).then(function(result: boolean) {
		result = utils.parseBool(result)
		return Promise.resolve(result)
	})
}

export function getHmacToken(doc: SecurityDoc, force = false): string {
	if (force) {
		if (!doc.uuid) throw new errors.PreconditionRequiredError('Undefined uuid');
		if (!doc.bytes) throw new errors.PreconditionRequiredError('Undefined bytes');
		if (!doc.ip) throw new errors.PreconditionRequiredError('Undefined ip');
		if (!doc.conhash) throw new errors.PreconditionRequiredError('Undefined conhash');
		if (!doc.date) throw new errors.PreconditionRequiredError('Undefined date');
		if (!doc.prime) throw new errors.PreconditionRequiredError('Undefined prime');
	}
	let msg = doc.uuid + doc.bytes + doc.ip + doc.conhash + doc.date
	let hmac = forge.hmac.create()
	hmac.start('sha256', doc.prime)
	hmac.update(msg)
	return hmac.digest().toHex()
}



export function generateProbablePrime(bits = 256): Promise<string> {
	return <any>new Promise(function(resolve, reject) {
		forge.prime.generateProbablePrime(bits, function(error, prime) {
			if (error) return reject(error);
			resolve(prime.toString(16))
		})
	})
}




