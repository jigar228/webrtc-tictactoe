var sendChannel;
var isChannelReady;
var isInitiator;
var isStarted;
var isRoomFull;
var localStream;
var pc;
var remoteStream;
//var host = 'https://webrtctictactoe-c9-jigarkaneriya.c9.io/';
var host = 'https://webrtc-tictactoedemo.rhcloud.com/';
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var constraints = {video: true};
var pc_config = {'iceServers':[{'url':'stun:23.21.150.121'}]} ;
var pc_constraints = {'optional': [	{'RtpDataChannels': true} ]};
var sdpConstraints = {'mandatory': {'OfferToReceiveVideo':true }};

var roomId = location.pathname.substring(1);
//roomId += prompt('Enter roomId:');

var socket = io.connect(host);
console.log('Socket :',socket);

if (roomId !== '') {
  console.log('Request for Create or join room', roomId);
  socket.emit('create or join', roomId);
}

initSocketCallBack();

function initSocketCallBack(){
	socket.on('created', function (roomId){
	  console.log('Room created:"' + roomId+'"');
	  isInitiator = true;
	});

	socket.on('full', function (roomId){
	  console.log('Room "' + roomId + '" is full');
	  isRoomFull=true;
	  window.location.replace('roomFull.html');
	});

	socket.on('join', function (roomId){
	  console.log('Opponent requested for join room ' + roomId);
	  isChannelReady = true;
	});

	socket.on('joined', function (roomId){
	  console.log('This peer has joined room ' + roomId);
	  isChannelReady = true;
	});

	//socket.on('tictactoe', function (array){
	//  console.log('tictactoe ', array);
	//});

	//socket.on('log', function (array){
	//  console.log.apply(console, array);
	//});

	socket.on('message', function (message){
	  console.log('Received message (socket connection):', message);
	  if (message === 'mediaStreamReady') {
		startIfReady();
	  } else if (message.type === 'offer') {
		console.log('offer received and anser sent');
		if (!isInitiator && !isStarted) {
		  startIfReady();
		}
		pc.setRemoteDescription(new RTCSessionDescription(message));
		pc.createAnswer(setLocalAndSendMessage, failureCallback, sdpConstraints);
	  } else if (message.type === 'answer' && isStarted) {
		pc.setRemoteDescription(new RTCSessionDescription(message));
	  } else if (message.type === 'candidate' && isStarted) {
		var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,candidate:message.candidate});
		pc.addIceCandidate(candidate);
	  } else if (message === 'bye' && isStarted) {
		handleRemoteHangup();
	  }
	});
}

//send message on socket to server
function sendMessage(message){
	console.log('Sending message: ', message);
  socket.emit('message', message);
}

function userMediaSuccessCallback(stream) {
  localStream = stream;
  console.log('local stream added');
  attachMediaStream(localVideo,stream);
  sendMessage('mediaStreamReady');
  if (isInitiator) {
	startIfReady();
  }
}

function userMediaErrorCallback(error){
  console.log('getUserMedia error: ', error);
}

getUserMedia(constraints, userMediaSuccessCallback, userMediaErrorCallback);
console.log('Getting user media with constraints', constraints);

function startIfReady() {
  if (!isStarted && localStream && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
		createOffer();
    }
  }
}

window.onbeforeunload = function(e){
	if(!isRoomFull)
	sendMessage('bye');
}

//creates p2p media and data connections
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = iceCandidateCallback;
    console.log('createPeerConnection: RTCPeerConnection created');
  } catch (e) {
    console.log('Failed to create PeerConnection' + e.message);
	alert('Failed to create PeerConnection' + e.message);
    return;
  }
  pc.onaddstream = addStreamCallback;
  pc.onremovestream = removeStreamCallback;
  if (isInitiator) {
    try {
      sendChannel = pc.createDataChannel("sendDataChannel",{reliable: false});
      sendChannel.onmessage = handleMessage;
	  sendChannel.onopen = handshakeBeforeGame;
      console.log('createPeerConnection: data channel created');
    } catch (e) {
      console.log('Failed to create DataChannel' + e.message);
	  alert('Failed to create datachannel' + e.message);
    }
	}
    else {
    pc.ondatachannel = gotDataChannel;
  }
}

function handshakeBeforeGame(){
	//0-8 is for box on tictacteo board but 9 is for handshake
	sendChannel.send(9);
	initFirstPlayer();
}

function gotDataChannel(event) {
  console.log('gotDataChannel: sendChannel for data is received');
  sendChannel = event.channel;
  sendChannel.onmessage = handleMessage;
}

function handleMessage(event) {
	console.log('Received message on RTCData (for TicTacToe): ' + event.data);
	//0-8 is for box on tictacteo board but 9 is for handshake
	if(event.data == 9){
		initSecondPlayer();
	}else if(event.data <= 8 && event.data >= 0){
		opponentClickCell(event.data);
	}
	
}

// sends data on RTCData channel
function sendData(data) {
  sendChannel.send(data);
  console.log('sentData(RTCData channel): ' + data);
}


function iceCandidateCallback(event) {
  console.log('iceCandidateCallback: ', event);
	if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('candidate is null');
  }
}

function addStreamCallback(event) {
  console.log('addStreamCallback: Remote stream added');
  remoteStream = event.stream;
  attachMediaStream(remoteVideo, event.stream);
}

function createOffer() {
  console.log('createOffer: Offer created and local session set and sent');
  pc.createOffer(setLocalAndSendMessage, failureCallback, sdpConstraints);
}

function failureCallback(){
	console.log('failureCallback: either answer or offer');
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function removeStreamCallback(event) {
  console.log('removeStreamCallback: ', event);
}

function hangup() {
  console.log('hangng:');
  stop();
  if(!isRoomFull)
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('remoteHangup:');
  stop();
  isInitiator = false;
  alert('Opponent has terminated connection.\n Page will refresh for new session.');
  window.location.href = window.location;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}