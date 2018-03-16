// 

export { }
import restify = require('restify')
import errors = require('restify-errors')
import url = require('url')
import ee3 = require('eventemitter3')
import * as axios from 'axios'



declare global {

	namespace NodeJS {
		interface Process {
			$instance: number
			$instances: number
			$dname: string
			$host: string
			$port: number
			$version: string
			$redis: {
				host: string
				port: number
				password: string
			}
			$rethinkdb: {
				host: string
				port: number
				authKey: string
				db: string
			}

			$stack: string
			$dometrics: boolean

			// $dev_symbols: () => Array<string>
			// $hasinstruments: boolean
			// $listening: boolean
			// $calcsready: boolean
		}

		interface Global {
			String: number
		}
	}

	interface Console {
		format(c: any): any
	}

	interface AppmetricsProfiling {
		time: number
		functions: Array<{
			self: number
			parent: number
			file: string
			name: string
			line: number
			count: number
		}>
	}



	interface AxiosError extends axios.AxiosError {
		config?: axios.AxiosRequestConfig
		response?: AxiosErrorResponse
	}
	interface AxiosErrorResponse extends axios.AxiosResponse {
		data: AxiosErrorData
	}
	type AxiosErrorData = errors.HttpError & RobinhoodErrorResponse

	type IdkError = Error & AxiosError & errors.HttpError

	interface AxiosCanceler extends axios.Canceler {

	}



	/*===============================
	=            RESTIFY            =
	===============================*/

	type HttpHeaders = { [key: string]: string }

	interface SecurityDoc {
		uuid: string
		bytes: string
		token: string
		ip: string
		conhash: string
		prime: string
		date: string
		admin: boolean
		moderator: boolean
		rhtoken: string
		reftoken: string
		rhexpires: number
	}

	interface RestifyRequest<T = any> extends restify.Request {
		headers: HttpHeaders
		sdoc: SecurityDoc
		admin: boolean
		moderator: boolean
		authed: boolean
		rhtoken: string
		xid: string
		uuid: string
		bytes: string
		platform: string
		token: string
		appversion: string
		ua: string
		ip: string
		conhash: string
		route: restify.Route
		tht: number
		thtPunish: number
		body: T
		devsecretvalid: boolean
	}

	interface RestifyResponse<T = any> extends restify.Response {
		_body: T
		send(body?: T)
		// redirect(href: string, next: RestifyNext): void
	}

	interface RestifyNext extends restify.Next {

	}



	interface Url extends url.Url {
		shost: string
		fhost: string
		spathname: Array<string>
		psearch: { [key: string]: string }
	}


}



