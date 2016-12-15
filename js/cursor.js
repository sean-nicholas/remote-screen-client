const electron = require('electron'); 
const remote = electron.remote;
const electronScreen = electron.screen; 
const screenSize = electronScreen.getPrimaryDisplay().size; 
const BrowserWindow = remote.BrowserWindow;
const ws = require('./websocket');
const url = require('url');
const path = require('path');
let secondCursorWindow; 
let sendCursor = false;

ws.on('message', (message) => {
  if (message.type !== 'cursor') { 
    return;
  }

  if (message.cursor) {
    setCusorWindow(message.cursor); 
  }

  if (message.stop) {
    console.log('stopping window');
    secondCursorWindow.destroy();
  }
});

function toggleSendCursor() { 
  sendCursor = !sendCursor;
  if (!sendCursor) {
    ws.send(JSON.stringify({
      type: 'cursor',
      stop: true
    }));
  }
} 
 
function createSecondCursorWindow() { 
  secondCursorWindow = new BrowserWindow({ 
    width: 20, 
    height: 20, 
    alwaysOnTop: true, 
    resizable: false, 
    movable: false, 
    minimizable: false, 
    maximizable: false, 
    closable: false, 
    skipTaskbar: true, 
    frame: false, 
    transparent: true, 
  });

  secondCursorWindow.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'html', 'cursor.html'),
    protocol: 'file:',
    slashes: true
  }));

  secondCursorWindow.on('closed', function() { 
    secondCursorWindow = null; 
  }); 
} 
 
function setCusorWindow(cursor) { 
  if (!secondCursorWindow) { 
    console.log('created window'); 
    createSecondCursorWindow(); 
    console.log(secondCursorWindow); 
  } 
   
  // console.log(cursor.x, screenSize.width, cursor.y, screenSize.height); 
   
  var bounds = { 
    x: Math.round(cursor.x * screenSize.width) - 20, 
    y: Math.round(cursor.y * screenSize.height) - 10, 
    width: 20, 
    height: 20 
  };
   
  secondCursorWindow.setBounds(bounds); 
} 
 
function sendCursorPos(e) { 
  if (!sendCursor) { 
    return; 
  } 
   
  ws.send(JSON.stringify({
    type: 'cursor',
    cursor: { 
      x: e.offsetX / e.srcElement.offsetWidth, 
      y: e.offsetY / e.srcElement.offsetHeight 
    } 
  })); 
}

document.querySelector('#sendCursor').addEventListener('click', () => {
  toggleSendCursor();
});

document.querySelector('#remoteVideo').addEventListener('mousemove', () => {
  sendCursorPos(event);
});