//

import rethinkdbdash = require('rethinkdbdash')
import shared = require('../shared')



const r = rethinkdbdash({
	host: process.$rethinkdb.host,
	port: process.$rethinkdb.port,
	authKey: process.$rethinkdb.authKey,
	db: process.$rethinkdb.db,
	silent: true,
	// discovery: true,
}) as rethinkdbdash.RDash



r.expr(1).run()
process.ee3_private.addListener(shared.RKEY.SYS.TICK_10, function() { r.expr(1).run() })



// function cleanup() { r.getPoolMaster().drain() }
// process.on('beforeExit', cleanup)
// process.on('exit', cleanup)



export = r

