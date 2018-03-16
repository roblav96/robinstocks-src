
# Server starts [here](https://github.com/roblav96/robinstocks-src/blob/master/server/src/server.ts)
* Uses Nginx as reverse proxy for easy SSL and security, supports http2, & serves blazing fast static content
* [PublicEmitter](https://github.com/roblav96/robinstocks-src/blob/master/server/src/server.ts#L273) - Public websocket server
* [Interactive Brokers Gateway](https://github.com/roblav96/robinstocks-src/blob/master/server/src/adapters/ib.gateway.ts) - uses [node-ib](https://github.com/pilwon/node-ib)
* [Trade Decisions](https://github.com/roblav96/robinstocks-src/blob/master/server/src/adapters/ib.trader.ts)

