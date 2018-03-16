//



r.db('robinstocks').tableCreate('ib_positions', { primaryKey: 'symbol', durability: 'soft' });
r.db('robinstocks').table('ib_positions').indexCreate('stamp');
r.db('robinstocks').table('ib_positions').indexCreate('position');
r.db('robinstocks').table('ib_positions').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
r.db('robinstocks').table('ib_positions').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);



r.db('robinstocks').tableCreate('ib_orders', { primaryKey: 'orderId', durability: 'soft' });
r.db('robinstocks').table('ib_orders').indexCreate('stamp');
r.db('robinstocks').table('ib_orders').indexCreate('symbol');
r.db('robinstocks').table('ib_orders').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
r.db('robinstocks').table('ib_orders').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);
r.db('robinstocks').table('ib_orders').indexCreate('createdAt');
r.db('robinstocks').table('ib_orders').indexCreate('status');
r.db('robinstocks').table('ib_orders').indexCreate('symbol-status', [r.row('symbol'), r.row('status')]);
r.db('robinstocks').table('ib_orders').indexCreate('symbol-active', [r.row('symbol'), r.row('active')]);
r.db('robinstocks').table('ib_orders').indexCreate('cancelledAt');
r.db('robinstocks').table('ib_orders').indexCreate('filledAt');
r.db('robinstocks').table('ib_orders').indexCreate('symbol-createdAt', [r.row('symbol'), r.row('createdAt')]);
r.db('robinstocks').table('ib_orders').indexCreate('active');
// r.db('robinstocks').table('ib_orders').indexCreate('symbol-exists', [r.row('symbol'), r.row('status').ne('Filled').and(r.row('status').ne('Cancelled'))]);
// r.db('robinstocks').table('ib_orders').indexCreate('symbol-exists', function(doc) {
// 	return doc('mems').map(function(mems) {
// 		return [doc('xid'), mems]
// 	})
// }, { multi: true });



r.db('robinstocks').tableCreate('ib_executions', { primaryKey: 'execId', durability: 'soft' });
r.db('robinstocks').table('ib_executions').indexCreate('stamp');
r.db('robinstocks').table('ib_executions').indexCreate('symbol');
r.db('robinstocks').table('ib_executions').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
r.db('robinstocks').table('ib_executions').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);
r.db('robinstocks').table('ib_executions').indexCreate('createdAt');
r.db('robinstocks').table('ib_executions').indexCreate('lastUpdate');
r.db('robinstocks').table('ib_executions').indexCreate('symbol-createdAt', [r.row('symbol'), r.row('createdAt')]);



r.db('robinstocks').tableCreate('ib_minutes', { primaryKey: 'stamp', durability: 'soft' });



r.db('robinstocks').tableCreate('ib_days', { primaryKey: 'stamp', durability: 'soft' });



r.db('robinstocks').tableCreate('wb_cflows', { durability: 'soft' });
r.db('robinstocks').table('wb_cflows').indexCreate('stamp');
r.db('robinstocks').table('wb_cflows').indexCreate('symbol');
r.db('robinstocks').table('wb_cflows').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
r.db('robinstocks').table('wb_cflows').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);



r.db('robinstocks').tableCreate('yh_summaries', { primaryKey: 'symbol', durability: 'soft' });



r.db('robinstocks').tableCreate('news', { primaryKey: 'id', durability: 'soft' });
r.db('robinstocks').table('news').indexCreate('symbol');
r.db('robinstocks').table('news').indexCreate('published');
r.db('robinstocks').table('news').indexCreate('stamp');
r.db('robinstocks').table('news').indexCreate('symbol-published', [r.row('symbol'), r.row('published')]);



r.db('robinstocks').tableCreate('lives', { primaryKey: 'id', durability: 'soft' });



r.db('robinstocks').tableCreate('baks', { primaryKey: 'id', durability: 'soft' });



r.db('robinstocks').tableCreate('wakatime', { primaryKey: 'date', durability: 'soft' });





// [
// 	"cluster_config",
// 	"current_issues",
// 	"db_config",
// 	"jobs",
// 	"logs",
// 	"permissions",
// 	"server_config",
// 	"server_status",
// 	"stats",
// 	"table_config",
// 	"table_status",
// 	"users"
// ]





// /*----------  FLUSH  ----------*/
// r.db('robinstocks').table('ib_positions').delete();
// r.db('robinstocks').table('ib_orders').delete();
// r.db('robinstocks').table('ib_executions').delete();
// r.db('robinstocks').table('ib_minutes').delete();



// r.db('robinstocks').tableCreate('ib_account', { primaryKey: 'id', durability: 'soft' });
// r.db('robinstocks').table('ib_account').indexCreate('stamp');
// r.db('robinstocks').table('ib_account').indexCreate('lastUpdate');



// r.db('robinstocks').tableCreate('news', { primaryKey: 'id', durability: 'soft' });
// r.db('robinstocks').table('news').indexCreate('stamp');
// r.db('robinstocks').table('news').indexCreate('symbol');
// r.db('robinstocks').table('news').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
// r.db('robinstocks').table('news').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);



// r.db('robinstocks').tableCreate('yh_community', { primaryKey: 'id', durability: 'soft' });
// r.db('robinstocks').table('yh_community').indexCreate('stamp');
// r.db('robinstocks').table('yh_community').indexCreate('symbol');
// r.db('robinstocks').table('yh_community').indexCreate('symbol-stamp', [r.row('symbol'), r.row('stamp')]);
// r.db('robinstocks').table('yh_community').indexCreate('stamp-symbol', [r.row('stamp'), r.row('symbol')]);







/*████████████████████████████████
█            COOKBOOK            █
████████████████████████████████*/



// r.table('yh_summaries').getAll(r.args(['AMD', 'AAPL', 'IDK'])).map(function(doc) {
// 	return doc.merge({
// 		defaultKeyStatistics: {
// 			symbol: doc('symbol')
// 		}
// 	})
// }).map((r.row('defaultKeyStatistics'))).then(function(data) {









