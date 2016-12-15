navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

if (!navigator.getUserMedia || !window.RTCPeerConnection || !window.RTCIceCandidate || !window.RTCSessionDescription) {
  alert('Your browser does not support getUserMedia or RTCPeerConnection or RTCIceCandidate or RTCSessionDescription API');
}

const ws = require('./websocket');
const cursor = require('./cursor');

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
  peerConnection.setLocalDescription(description, () => {
    ws.send(JSON.stringify({
      'sdp': description
    }));
  }, () => {
    console.log('set description error')
  });
}

function getScreenStream() {
  return new Promise((res, rej) => {
    navigator.getUserMedia(userMediaConstraints, res, rej);
  });
}

function errorHandler(error) {
  console.log(error);
}

function removeStartScreen() {
  document.querySelector('#startScreen').style = 'display: none;';
}

function sendSecret(secret) {
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

function addStream() {
  getScreenStream().then((stream) => {
    peerConnection.addStream(stream);
    peerConnection.createOffer(gotDescription, errorHandler);
  });
}

function createSenderChannel() {
  return new Promise((res, rej) => {
    const senderChannel = peerConnection.createDataChannel('senderChannel');
    senderChannel.onerror = rej;
    senderChannel.onopen = () => {
      res(senderChannel);
    };
  });
}

document.querySelector('#share').addEventListener('click', () => {
  const secret = createSecret();
  sendSecret(secret);
  removeStartScreen();
  document.querySelector('#shareScreen').style = '';
  document.querySelector('#secret').innerHTML = secret;
  // createDataChannels();
  createSenderChannel().then(channel => {
    cursor(null, channel);
  });
});

document.querySelector('#receive').addEventListener('click', () => {
  isSender = false;
  sendSecret(document.querySelector('#secretInput').value);
  document.querySelector('#sendCursorWrapper').style = '';
  document.querySelector('#remoteVideoWrapper').style = '';
  removeStartScreen();
  // createDataChannels();
  peerConnection.ondatachannel = (event) => {
    const channel = event.channel;
    cursor(channel, null);
  }
});

ws.on('message', (message) => {
  if (message.secret && isSender) {
    addStream();
  }
});

ws.on('message', (message) => {
  if (!message.sdp) return;

  new Promise((res, rej) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp), res, rej);
  })
  .then(() => {
    if (isSender) return;
    peerConnection.createAnswer(gotDescription, errorHandler);
  })
  .catch(errorHandler);
});

ws.on('message', (message) => {
  if (!message.ice) return;
  peerConnection.addIceCandidate(new RTCIceCandidate(message.ice));
});

ws.on('connect', () => {
  document.querySelector('#startScreen').style = '';
});