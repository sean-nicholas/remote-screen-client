const SimpleWebsocket = require('simple-websocket')
const ws = new SimpleWebsocket('wss://remote-desktop.herokuapp.com');

ws.on('data', (data) => {
  let message = {};

  try {
    message = JSON.parse(data);
  } catch (e) {
    console.log(e);
  }

  ws.emit('message', message);
})

module.exports = ws;