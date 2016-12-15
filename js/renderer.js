const ws = require('./websocket');
require('./cursor');

var remoteVideo = document.getElementById('remoteVideo'); 
var peerConnection; 
var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}; 
 
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia; 
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; 
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate; 
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription; 

function gotDescription(description) { 
    console.log('got description'); 
    peerConnection.setLocalDescription(description, function () { 
        ws.send(JSON.stringify({'sdp': description})); 
    }, function() {console.log('set description error')}); 
}
 
function pageReady() {     
    var constraints = { video: { mandatory: { chromeMediaSource: 'screen', maxWidth: screen.width, maxHeight: screen.height, 
    minFrameRate: 1, maxFrameRate: 60 }, optional: [] }, audio: false }; 
 
    if(navigator.getUserMedia) { 
        navigator.getUserMedia(constraints, (stream) => { 
            localStream = stream;
        } , errorHandler); 
    } else { 
        alert('Your browser does not support getUserMedia API'); 
    } 
}
 
function start(isCaller) { 
    peerConnection = new RTCPeerConnection(peerConnectionConfig); 
    peerConnection.onicecandidate = (event) => { 
      if(event.candidate != null) { 
          ws.send(JSON.stringify({'ice': event.candidate})); 
      } 
    } ; 
    peerConnection.onaddstream = (event) => { 
      console.log('got remote stream'); 
      remoteVideo.src = window.URL.createObjectURL(event.stream); 
    }; 
    peerConnection.addStream(localStream);
 
    if (isCaller) {
        peerConnection.createOffer(gotDescription, errorHandler); 
    } else {
      document.querySelector('#sendCursorWrapper').style = '';
    }
    document.querySelector('#startScreen').style = 'opacity: 0';
}
 
function errorHandler(error) { 
    console.log(error); 
}

function sendSecret() {
  const secret = document.querySelector('#secret').value;
  ws.send(JSON.stringify({ 'secret': secret }));
}

(function createSecret() {
  function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  }

  let numbers = new Array(20).fill(0);
  numbers = numbers.map((val, key) => {
    if (key === 0) {
      return '';
    }
    if (key % 5 === 0) {
      return '-';
    }
    return randomIntInc(0, 9);
  });
  document.querySelector('#secret').value = numbers.join('');
})();

ws.on('message', (message) => { 
  if(!peerConnection) start(false); 

  if(message.sdp) { 
      peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp), function() { 
          peerConnection.createAnswer(gotDescription, errorHandler); 
      }, errorHandler); 
  } else if(message.ice) { 
      peerConnection.addIceCandidate(new RTCIceCandidate(message.ice)); 
  } 
});

document.querySelector('#share').addEventListener('click', () => {
  sendSecret();
  pageReady();
  setTimeout(() => { start(true) }, 1000);
});

document.querySelector('#receive').addEventListener('click', () => {
  sendSecret();
  pageReady();
});

ws.on('connect', () => {
  document.querySelector('#startScreen').style = '';
})