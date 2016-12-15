// In the renderer process.
// const {desktopCapturer} = require('electron');

// function getSources() {
//   return new Promise((res, rej) => {
//     desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
//       if (error) return rej(error);
//       res(sources);
//     });
//   });
// }

// getSources().then(sources => {
//   console.log(sources);
//   document.querySelector('img').src = sources[0].thumbnail.toDataURL();
// })


// for (let i = 0; i < sources.length; ++i) {
//     if (sources[i].name === 'Electron') {
//       navigator.webkitGetUserMedia({
//         audio: false,
//         video: {
//           mandatory: {
//             chromeMediaSource: 'desktop',
//             chromeMediaSourceId: sources[i].id,
//             minWidth: 1280,
//             maxWidth: 1280,
//             minHeight: 720,
//             maxHeight: 720
//           }
//         }
//       }, handleStream, handleError)
//       return
//     }
//   }

// function handleStream (stream) {
//   document.querySelector('video').src = URL.createObjectURL(stream)
// }

// function handleError (e) {
//   console.log(e)
// }

const ws = require('./websocket');

var localVideo; 
var remoteVideo; 
var peerConnection; 
var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}; 
 
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia; 
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; 
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate; 
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription; 
 
function pageReady() { 
    localVideo = document.getElementById('localVideo'); 
    remoteVideo = document.getElementById('remoteVideo'); 
 
    ws.on('data', gotMessageFromServer);
 
    // var constraints = { 
    //     video: true, 
    //     audio: true, 
    // }; 
     
    var constraints = { video: { mandatory: { chromeMediaSource: 'screen', maxWidth: screen.width, maxHeight: screen.height, 
    minFrameRate: 1, maxFrameRate: 60 }, optional: [] }, audio: false }; 
 
    if(navigator.getUserMedia) { 
        navigator.getUserMedia(constraints, getUserMediaSuccess, errorHandler); 
    } else { 
        alert('Your browser does not support getUserMedia API'); 
    } 
} 
 
function getUserMediaSuccess(stream) { 
    localStream = stream; 
    localVideo.src = window.URL.createObjectURL(stream); 
} 
 
function start(isCaller) { 
    peerConnection = new RTCPeerConnection(peerConnectionConfig); 
    peerConnection.onicecandidate = gotIceCandidate; 
    peerConnection.onaddstream = gotRemoteStream; 
    peerConnection.addStream(localStream);
 
    if(isCaller) {
        peerConnection.createOffer(gotDescription, errorHandler); 
    } 
} 
 
function gotMessageFromServer(message) { 
    if(!peerConnection) start(false); 
 
    var signal = JSON.parse(message); 
    if(signal.sdp) { 
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() { 
            peerConnection.createAnswer(gotDescription, errorHandler); 
        }, errorHandler); 
    } else if(signal.ice) { 
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)); 
    } else if(signal.cursor) { 
      setCusorWindow(signal.cursor); 
    } 
} 
 
function gotIceCandidate(event) { 
    if(event.candidate != null) { 
        ws.send(JSON.stringify({'ice': event.candidate})); 
    } 
} 
 
function gotDescription(description) { 
    console.log('got description'); 
    peerConnection.setLocalDescription(description, function () { 
        ws.send(JSON.stringify({'sdp': description})); 
    }, function() {console.log('set description error')}); 
} 
 
function gotRemoteStream(event) { 
    console.log('got remote stream'); 
    remoteVideo.src = window.URL.createObjectURL(event.stream); 
} 
 
function errorHandler(error) { 
    console.log(error); 
}

var sendCursorInterval = null; 
var electron = require('electron'); 
var remote = electron.remote;
var electronScreen = electron.screen; 
var screenSize = electronScreen.getPrimaryDisplay().size; 
var BrowserWindow = remote.BrowserWindow; 
var secondCursorWindow; 
var sendCursor = false; 

function toggleSendCursor() { 
  sendCursor = !sendCursor; 
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
  secondCursorWindow.loadURL('file://' + __dirname + '/cursor.html'); 
  // window.webContents.openDevTools(); 
  secondCursorWindow.on('closed', function() { 
    window = null; 
  }); 
} 
 
function setCusorWindow(cursor) { 
  if (!secondCursorWindow) { 
    console.log('created window'); 
    createSecondCursorWindow(); 
    console.log(secondCursorWindow); 
  } 
   
  console.log(cursor.x, screenSize.width, cursor.y, screenSize.height); 
   
  var bounds = { 
    x: Math.round(cursor.x * screenSize.width) - 20, 
    y: Math.round(cursor.y * screenSize.height) - 10, 
    width: 20, 
    height: 20 
  }; 
   
  console.log(bounds); 
   
  secondCursorWindow.setBounds(bounds); 
} 
 
function sendCursorPos(e) { 
  if (!sendCursor) { 
    return; 
  } 
   
  ws.send(JSON.stringify({ 
    'cursor': { 
      x: e.offsetX / e.srcElement.offsetWidth, 
      y: e.offsetY / e.srcElement.offsetHeight 
    } 
  })); 
}

// document.querySelector('#send').addEventListener('click', () => {
//   pageReady();
//   setTimeout(() => {
//     start(true);
//   }, 2000);
// });

function sendSecret() {
  const secret = document.querySelector('#secret').value;
  ws.send(JSON.stringify({ 'secret': secret }));
}


document.querySelector('#sendCursor').addEventListener('click', () => {
  toggleSendCursor();
});

document.querySelector('#remoteVideo').addEventListener('mousemove', () => {
  sendCursorPos(event);
});

document.querySelector('#share').addEventListener('click', () => {
  sendSecret();
  pageReady();
  setTimeout(() => { start(true) }, 1000);
});

document.querySelector('#receive').addEventListener('click', () => {
  sendSecret();
  pageReady();
  // start();
});