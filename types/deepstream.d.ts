// 

export { }



declare global {

	interface DsAuthBody {
		xid?: string
		uuid?: string
		bytes?: string
		token?: string
		isServer?: boolean
	}
	interface DsAuthServerData {
		xid?: string
		authed?: boolean
		isServer?: boolean
	}
	interface DsAuthClientData {
		authed?: boolean
	}

}










