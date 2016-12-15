const SimpleWebsocket = require('simple-websocket')
const ws = new SimpleWebsocket('ws://localhost:3434');

module.exports = ws;