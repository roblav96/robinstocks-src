//

import eyes = require('eyes')
import clc = require('cli-color')
import _ = require('lodash')
import errors = require('restify-errors')
import utils = require('./utils')



export function peRender(error: IdkError, where = '') { // HttpError
	if (_.isString(error)) return clc.bold.redBright(error);
	if (!_.isError(error)) return JSON.stringify(error);

	let message = error.message
	let stack = error.stack
	if (stack && stack.indexOf(message) >= 0) stack = stack.replace(message, '');

	let desc = ''
	if (error.config) {
		desc = desc + '\nurl > ' + decodeURIComponent(error.config.url)
	}
	if (error.response && error.response.statusText) {
		desc = desc + '\nstatus > ' + error.response.statusText
	}
	if (error.response && error.response.data && Array.isArray(error.response.data.non_field_errors)) {
		desc = desc + '\nresponse > ' + error.response.data.non_field_errors.join('\n')
	}
	if (desc) {
		desc = desc + '\n'
		message = 'message > ' + message
	}

	if (where) where = clc.underline.bold.redBright(where) + ' > ';
	return where + clc.bold.redBright(desc + message + '\n') + stack
}



export function generateError(error: IdkError, where?: string): errors.HttpError {
	console.error('restify route error >', peRender(error, where))
	if (error instanceof errors.HttpError != true) {
		let status = 500
		if (Number.isFinite(error.statusCode)) status = error.statusCode;
		if (error.response && Number.isFinite(error.response.status)) status = error.response.status;
		if (error.response && error.response.data && Number.isFinite(error.response.data.statusCode)) status = error.response.data.statusCode;
		error = errors.makeErrFromCode(status, error)
	}
	return error
}

export function getStack(i = 2) {
	let stack = new Error().stack.toString()
	stack = stack.replace(/^([^\n]*?\n){2}((.|\n)*)$/gmi, '$2')
	stack = stack.split('\n')[i].trim()
	stack = stack.split('/').pop()
	return stack.substring(0, stack.length - 1)
}



export function isTimeoutError(error: Error) {
	if (error == null || !_.isString(error.message)) return false;
	let message = error.message.toLowerCase()
	return message.indexOf('timeout') >= 0 && message.indexOf('exceeded') >= 0
}





// if (!('toJSON' in Error.prototype)) {
// 	Object.defineProperty(Error.prototype, 'toJSON', {
// 		value: function() {
// 			let alt = {} as any
// 			Object.getOwnPropertyNames(this).forEach(k => alt[k] = this[k], this)
// 			return alt
// 		},
// 		configurable: true,
// 		writable: true,
// 	})
// }


