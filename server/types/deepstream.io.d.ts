// 

declare namespace deepstreamIO {

	interface ServerConstants {
		ACTIONS: {
			ACK: string;
			CHALLENGE: string;
			CHALLENGE_RESPONSE: string;
			CREATE: string;
			CREATEORREAD: string;
			DELETE: string;
			ERROR: string;
			EVENT: string;
			HAS: string;
			LEADER_REQUEST: string;
			LEADER_VOTE: string;
			LISTEN: string;
			LISTEN_ACCEPT: string;
			LISTEN_REJECT: string;
			LISTEN_SNAPSHOT: string;
			LOCK_RELEASE: string;
			LOCK_REQUEST: string;
			LOCK_RESPONSE: string;
			PATCH: string;
			PING: string;
			PONG: string;
			PRESENCE_JOIN: string;
			PRESENCE_LEAVE: string;
			QUERY: string;
			READ: string;
			REJECTION: string;
			REMOVE: string;
			REQUEST: string;
			RESPONSE: string;
			SNAPSHOT: string;
			STATUS: string;
			SUBSCRIBE: string;
			SUBSCRIPTIONS_FOR_PATTERN_FOUND: string;
			SUBSCRIPTION_FOR_PATTERN_FOUND: string;
			SUBSCRIPTION_FOR_PATTERN_REMOVED: string;
			SUBSCRIPTION_HAS_PROVIDER: string;
			UNLISTEN: string;
			UNSUBSCRIBE: string;
			UPDATE: string;
			WRITE_ACKNOWLEDGEMENT: string;
		};
		ALL: string;
		EVENT: {
			ACK_TIMEOUT: string;
			AUTH_ATTEMPT: string;
			AUTH_ERROR: string;
			AUTH_SUCCESSFUL: string;
			CACHE_RETRIEVAL_TIMEOUT: string;
			CLIENT_DISCONNECTED: string;
			CLOSED_SOCKET_INTERACTION: string;
			CLUSTER_JOIN: string;
			CLUSTER_LEAVE: string;
			CONNECTION_AUTHENTICATION_TIMEOUT: string;
			CONNECTION_ERROR: string;
			DEPRECATED: string;
			DISTRIBUTED_STATE_ADD: string;
			DISTRIBUTED_STATE_FULL_STATE: string;
			DISTRIBUTED_STATE_REMOVE: string;
			DISTRIBUTED_STATE_REQUEST_FULL_STATE: string;
			INCOMING_CONNECTION: string;
			INFO: string;
			INVALID_AUTH_DATA: string;
			INVALID_AUTH_MSG: string;
			INVALID_CONFIG_DATA: string;
			INVALID_LEADER_REQUEST: string;
			INVALID_MESSAGE: string;
			INVALID_MESSAGE_DATA: string;
			INVALID_MSGBUS_MESSAGE: string;
			INVALID_VERSION: string;
			LEADING_LISTEN: string;
			LOCAL_LISTEN: string;
			MAXIMUM_MESSAGE_SIZE_EXCEEDED: string;
			MESSAGE_DENIED: string;
			MESSAGE_PARSE_ERROR: string;
			MESSAGE_PERMISSION_ERROR: string;
			MULTIPLE_ACK: string;
			MULTIPLE_RESPONSE: string;
			MULTIPLE_SUBSCRIPTIONS: string;
			NOT_SUBSCRIBED: string;
			NO_RPC_PROVIDER: string;
			PLUGIN_ERROR: string;
			PLUGIN_INITIALIZATION_ERROR: string;
			PLUGIN_INITIALIZATION_TIMEOUT: string;
			RECORD_CREATE_ERROR: string;
			RECORD_DELETE_ERROR: string;
			RECORD_DELETION: string;
			RECORD_LOAD_ERROR: string;
			RECORD_NOT_FOUND: string;
			RECORD_SNAPSHOT_ERROR: string;
			RECORD_UPDATE_ERROR: string;
			RESPONSE_TIMEOUT: string;
			STORAGE_RETRIEVAL_TIMEOUT: string;
			SUBSCRIBE: string;
			TIMEOUT: string;
			TOO_MANY_AUTH_ATTEMPTS: string;
			TRIGGER_EVENT: string;
			UNKNOWN_ACTION: string;
			UNKNOWN_CALLEE: string;
			UNKNOWN_TOPIC: string;
			UNSOLICITED_MSGBUS_MESSAGE: string;
			UNSUBSCRIBE: string;
			VERSION_EXISTS: string;
		};
		LOG_LEVEL: {
			DEBUG: number;
			ERROR: number;
			INFO: number;
			OFF: number;
			WARN: number;
		};
		MESSAGE_PART_SEPERATOR: string;
		MESSAGE_SEPERATOR: string;
		SOURCE_MESSAGE_CONNECTOR: string;
		STATES: {
			CLOSED: string;
			CLOSING: string;
			INITIALIZED: string;
			IS_RUNNING: string;
			STARTING: string;
		};
		TOPIC: {
			AUTH: string;
			CLUSTER: string;
			CONNECTION: string;
			ERROR: string;
			EVENT: string;
			LEADER: string;
			LEADER_PRIVATE: string;
			LISTEN: string;
			LISTEN_PATTERNS: string;
			ONLINE_USERS: string;
			PRESENCE: string;
			PRIVATE: string;
			PUBLISHED_SUBSCRIPTIONS: string;
			RECORD: string;
			RPC: string;
			SUBSCRIPTIONS: string;
		};
		TYPES: {
			FALSE: string;
			NULL: string;
			NUMBER: string;
			OBJECT: string;
			STRING: string;
			TRUE: string;
			UNDEFINED: string;
		};
	}

	interface ServerConfig {
		authenticationHandler?: {
			addListener?: any;
			domain?: any;
			emit?: any;
			eventNames?: any;
			getMaxListeners?: any;
			isReady?: boolean;
			isValidUser?: any;
			listenerCount?: any;
			listeners?: any;
			on?: any;
			once?: any;
			prependListener?: any;
			prependOnceListener?: any;
			removeAllListeners?: any;
			removeListener?: any;
			setMaxListeners?: any;
			type?: string;
		};
		broadcastTimeout?: number;
		cache?: {
			delete?: any;
			get?: any;
			isReady?: boolean;
			set?: any;
		};
		cacheRetrievalTimeout?: number;
		clusterActiveCheckInterval?: number;
		clusterKeepAliveInterval?: number;
		clusterNodeInactiveTimeout?: number;
		dependencyInitialisationTimeout?: number;
		externalUrl?: any;
		healthCheckPath?: string;
		heartbeatInterval?: number;
		host?: string;
		listenResponseTimeout?: number;
		lockRequestTimeout?: number;
		lockTimeout?: number;
		logInvalidAuthData?: boolean;
		logLevel?: number;
		maxAuthAttempts?: number;
		maxMessageSize?: number;
		messageConnector?: {
			isReady?: boolean;
			publish?: any;
			subscribe?: any;
			unsubscribe?: any;
		};
		permissionHandler?: {
			addListener?: any;
			canPerformAction?: any;
			domain?: any;
			emit?: any;
			eventNames?: any;
			getMaxListeners?: any;
			isReady?: boolean;
			listenerCount?: any;
			listeners?: any;
			on?: any;
			once?: any;
			prependListener?: any;
			prependOnceListener?: any;
			removeAllListeners?: any;
			removeListener?: any;
			setMaxListeners?: any;
			type?: string;
		};
		port?: number;
		rpcAckTimeout?: number;
		rpcTimeout?: number;
		serverName?: string;
		showLogo?: boolean;
		sslCa?: any;
		sslCert?: any;
		sslKey?: any;
		stateReconciliationTimeout?: number;
		storage?: {
			delete?: any;
			get?: any;
			isReady?: boolean;
			set?: any;
		};
		storageExclusion?: any;
		storageRetrievalTimeout?: number;
		unauthenticatedClientTimeout?: number;
		urlPath?: string;



		hash?: string
		auth?: {
			type?: string
			options?: {
				endpointUrl?: string
				permittedStatusCodes?: Array<number>
				requestTimeout?: number
			}
		}

		logger?: {
			name?: string
			options?: {
				colors?: boolean
				logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'OFF'
			}
		}

		permission?: {
			type?: string
			options?: {
				path?: string
				maxRuleIterations?: number
				cacheEvacuationInterval?: number
			}
		}



	}

}

declare module 'deepstream.io' {
	import Events = require('events')

	export = class Server extends Events.EventEmitter {

		static constants: deepstreamIO.ServerConstants

		static readMessage<T>(message: string): T;

		constructor(config: deepstreamIO.ServerConfig);

		convertTyped<T>(value: string): T;

		isRunning(): boolean;

		set<T>(key: string, value: T): void;

		start(): void;

		stop(): void;

		on<T>(event: string, callback: (data: T) => void): this;
		on(event: 'error', callback: (error: string, event: string, topic: string) => void): this;

	}

}

