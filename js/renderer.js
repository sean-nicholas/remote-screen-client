navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

if (!navigator.getUserMedia || !window.RTCPeerConnection || !window.RTCIceCandidate || !window.RTCSessionDescription) {
  alert('Your browser does not support getUserMedia or RTCPeerConnection or RTCIceCandidate or RTCSessionDescription API');
}

const ws = require('./websocket');
require('./cursor');

let isSender = true;

const peerConnectionConfig = {
  'iceServers': [
    {'url': 'stun:stun.l.google.com:19302'},
    {'url': 'stun:stun1.l.google.com:19302'},
    {'url': 'stun:stun2.l.google.com:19302'},
    {'url': 'stun:stun3.l.google.com:19302'},
    {'url': 'stun:stun4.l.google.com:19302'}
  ]
};
const peerConnection = new RTCPeerConnection(peerConnectionConfig);

peerConnection.onicecandidate = (event) => {
  if (event.candidate != null) {
    ws.send(JSON.stringify({
      'ice': event.candidate
    }));
  }
};

peerConnection.onaddstream = (event) => {
  document.getElementById('remoteVideo').src = window.URL.createObjectURL(event.stream);
};

const userMediaConstraints = {
  video: {
    mandatory: {
      chromeMediaSource: 'screen',
      maxWidth: screen.width,
      maxHeight: screen.height,
      minFrameRate: 1,
      maxFrameRate: 60
    },
    optional: []
  },
  audio: false
};

function gotDescription(description) {
  console.log('got description');
  peerConnection.setLocalDescription(description, function () {
    ws.send(JSON.stringify({
      'sdp': description
    }));
  }, function () {
    console.log('set description error')
  });
}

function getScreenStream() {
  return new Promise((res, rej) => {
    navigator.getUserMedia(userMediaConstraints, res, rej);
  });
}

function start(isCaller, stream) {
  if (isCaller) {
    peerConnection.addStream(stream);
    peerConnection.createOffer(gotDescription, errorHandler);
  } else {
    document.querySelector('#sendCursorWrapper').style = 'opacity: 1';
  }
  removeStartScreen();
}

function errorHandler(error) {
  console.log(error);
}

function removeStartScreen() {
  document.querySelector('#startScreen').style = 'opacity: 0';
}

function sendSecret() {
  const secret = document.querySelector('#secret').value;
  ws.send(JSON.stringify({
    'secret': secret
  }));
}

function createSecret() {
  function randomIntInc(low, high) {
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

  return numbers.join('');
};

// document.querySelector('#secret').value = createSecret();

document.querySelector('#share').addEventListener('click', () => {
  sendSecret();
  getScreenStream().then((stream) => {
    start(true, stream);
  });
});

document.querySelector('#receive').addEventListener('click', () => {
  isSender = false;
  sendSecret();
});

ws.on('message', (message) => {
  if (!isSender) start(false);

  if (message.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
      peerConnection.createAnswer(gotDescription, errorHandler);
    }, errorHandler);
  } else if (message.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(message.ice));
  }
});

ws.on('connect', () => {
  document.querySelector('#startScreen').style = '';
});