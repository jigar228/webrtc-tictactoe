var playerMark = 'o';
var opponentMark = 'x';
var isItopponentTurn =false;
var isItMyTurn = true;
var lastWinner = document.getElementById('lastwinner');
var xscore = document.getElementById('xscore');
var oscore = document.getElementById('oscore');
var clickCount = 0;
var infoBox = document.getElementById('info');

initTictactoe('tictactoe');

function initTictactoe(tableId){
	var table = document.getElementById(tableId);
	infoBox.value = 'Waiting for other player to join...\n';
	
	for( var i = 0; i < 3; i++ ){
		var row = table.insertRow(i);
		for( var j = 0; j < 3; j++ ){
			var cell = row.insertCell(j);
			cell.id=i*3+j;
			cell.onclick = function(){
			if(isItMyTurn && this.innerText != 'x' && this.innerText != 'o')
				sendData(this.id); //if it is my turn then send same data to opponent via RTCData Channel
	
				clickCell(this,playerMark);
			}
		}
	}
}

function initFirstPlayer(){
	infoBox.value = 'Your Mark : '+playerMark+'\n';
	infoBox.value += 'Opponent Mark : '+opponentMark+'\n';
	infoBox.value += 'Your Turn : ';
}
function initSecondPlayer(){
	playerMark = 'x';
	opponentMark = 'o';
	isItMyTurn = false;	
	infoBox.value = 'Your Mark : '+playerMark+'\n';
	infoBox.value += 'Opponent\'s Mark : '+opponentMark+'\n';
	infoBox.value += 'Opponent\'s Turn : ';
	
}

function opponentClickCell(id){
  var cell = document.getElementById(id);
  isItopponentTurn = true;
  clickCell(cell,opponentMark);
  isItopponentTurn = false;
  isItMyTurn = true;
}

function clickCell(cell,mark){
	
	if(!isItopponentTurn)
		if(cell.innerText == 'x' || cell.innerText == 'o' || isItMyTurn == false)
			return;	//Return if user tries to click already clicked box or it is not his turn
	
	cell.style.padding="0ex 0.90ex 0.4ex 1ex";
	cell.innerText=mark;
	clickCount++;
	
	var x =  Math.floor(parseInt(cell.id)/3);
	var y = parseInt(cell.id) - 3*x;
	infoBox.value +=  '('+x+','+y+')' + mark + ' marked \n';
	
	console.log("Tictactoe:"+"x:"+x+" y:"+y);
	
	if( checkRow(x) || checkCol(y) || checkDia(x,y) ){
		var result = mark == 'x' ? xscore:oscore;
		result.innerText = parseInt(result.innerText)+1;
		lastWinner.innerText = "LastWinner: '"+mark+"'";
		flushBoard();
		infoBox.value += mark == playerMark ? 'You Win\n\n' : 'Opponent Wins\n\n';
	}else if(clickCount == 9){
		flushBoard();
		infoBox.value += 'Match Draw :( \n\n';
	}
	infoBox.value += isItopponentTurn ? 'Your Turn : ' : 'Opponent\'s Turn : ';
	isItMyTurn = false;
}

function checkRow(x){
	x=x*3;
	return isEqual(x,x+1,x+2);
}

function checkCol(y){
	return isEqual(y,y+3,y+6);
}

function checkDia(x,y){
	if((x*3+y) % 2 == 0)
		return isEqual(0,4,8) || isEqual(2,4,6);
	else
		return false;
}

function isEqual(a,b,c){
	console.log(a+""+b+""+c);
			
	return document.getElementById(a).innerText == document.getElementById(b).innerText 
		&& document.getElementById(c).innerText == document.getElementById(a).innerText 
		&& (document.getElementById(c).innerText == 'x' || document.getElementById(a).innerText == 'o');
}

function flushBoard(){
	for( var i = 0; i < 9; i++ ){
		document.getElementById(i).innerText = "";
		document.getElementById(i).style.padding="1.5ex 1.5ex";
	}
	clickCount = 0;
	infoBox.value = 'Your Mark : '+playerMark+'\n';
	infoBox.value += 'Opponent Mark : '+opponentMark+'\n';
}