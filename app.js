function Stage(width, height){
    // all actors are kept in their respective arrays to increase run times
    this.monsters = []; 
    this.boxes = [];
    this.players = [];
    this.usedCoor = {}; // object array storing used coordinates as {(x,y) : actor object}
    // the logical width and height of the stage
    this.width=width;
    this.height=height;
    //assign the boundries to memory for readability (for me)
    //boundraies are uneven when width or height is positive -> (abs(-x) > x) && (y > abs(-y)) (skewed left and up by 1)
    this.leftWall = 0-Math.floor(this.width/2);
    this.rightWall = Math.ceil(this.width/2) - 1;
    this.topWall = Math.ceil(this.height/2);
    this.bottomWall = 1-Math.floor(this.height/2);
    //keep a unique counter to give to every new player object on the field
    this.unique = 0;
    //changedActors stores the changes of actors in play to be broadcasted on every update
    //it holds arrays as elements that have 2,3 or 4 items in them
    // [x,y] -> delete actor at position || [x,y,playerId] -> add new player at position || [x,y,dx,dy] -> move actor at position
    this.changedActors = []; 
 };

// initialize an instance of the game
Stage.prototype.initialize=function(){
    //number of boxes is determined by the size of the arena
    var boxes = Math.round(this.height*this.width/4);
	// Add some Boxes to the stage, adding the (x,y):actor pairs to usedCoor
    while (boxes>0){
    	var x = this.randX();
    	var y = this.randY();
        if (!this.isUsedCoor(x,y)){
        	var strC = this.xyToString(x,y);
            var k = new Actor(this.unique, x, y, "box", null);
            this.unique++;
            this.boxes.push(k);
            this.usedCoor[strC]=k;
            boxes--;
        }
    }

    //number of monsters is determined by the size of the arena, assumes square arena or atleast an arena where width<height for mobile
    var totalMonsters = Math.floor(this.width/2+2);
    var currCount = 0;
	// Add in [totalMonsters] Monsters
    while (currCount<totalMonsters){
        var x = this.randX();
        var y = this.randY();
        if (!this.isUsedCoor(x,y)){
        	var strC = this.xyToString(x,y);
            var level = 1;
            if (this.numMonster%2===0){
                level = 2;
            } else if (this.numMonster%3===0){
                level = 3;
            }
            var k = new Actor(this.unique, x, y, "monster", level);
            this.unique++;
            this.monsters.push(k);
            this.usedCoor[strC]=k;
            currCount++;
        }
    }

};

//generate a random x coordinate based on the width
Stage.prototype.randX = function(){
	//w is width when accounting for walls
	var w = this.width - 2;
	var x = Math.floor(Math.random()*w) - Math.floor(w/2);
	return x;
};

//generate a random y coordinate
Stage.prototype.randY = function(){
	var h = this.height -2;
	var y = 1 + Math.floor(Math.random()*h) - Math.floor(h/2);
	return y;
};

Stage.prototype.xyToString=function(x,y){
    return '('+x+','+y+')';
};

//check if the (x,y) coordinates are occupied. If they are, returns actor object else null object.
Stage.prototype.isUsedCoor=function(x,y){
    var strC = '('+x+','+y+')';
    if (strC in this.usedCoor){
        return this.usedCoor[strC];
    }
    return null;
};

Stage.prototype.addPlayer=function(){
	//check if middle is available else, find a random position
	var x = 0;
	var y = 0;
	while (this.isUsedCoor(x,y)){
		x = this.randX();
    	y = this.randY();
	}
	var strC = this.xyToString(x,y); //strC is used to map the string representation of x,y to the respective actor object
	var actor = new Actor(this.unique, x, y, 'player', null); //unique gives a unique actor ID to players
	this.usedCoor[strC]=actor;
	this.unique++;
    this.players.push(actor);
    this.changedActors.push([x, y, actor.getId()]);
    return actor;
};

//use to determine win
Stage.prototype.getNumMonsters=function(){
    return this.monsters.length;
};

//use to determine loss
Stage.prototype.getNumOfPlayers=function(){
    return this.players.length;
};

Stage.prototype.removeActor=function(actor){
		var x = actor.getX();
		var y = actor.getY();
        var stringC = this.xyToString(x, y);
        delete this.usedCoor[stringC];
        if (actor.getType() === 'player'){
            //splice them and send a game over message to the user controlling the monster
            this.numPlayers--; //keep track of living players
            var remove = this.players.indexOf(actor);
            if (remove > -1) {
                this.players.splice(remove, 1);
            }
        }else if (actor.getType()==="box"){ 
            //incase i want to do something with this
            var remove = this.boxes.indexOf(actor);
            if (remove > -1) {
                this.boxes.splice(remove, 1);
            }
        }else if (actor.getType()==="monster"){
            this.numMonster--;
            var remove = this.monsters.indexOf(actor);
            if (remove > -1) {
                this.monsters.splice(remove, 1);
            }
        }
        this.changedActors.push([x,y]);
};

Stage.prototype.winCondition=function(){
    if (this.numMonster>0){
        return false;
    }
    return true;
};

// Take one step in the animation of the game.  
Stage.prototype.step=function(){
    var dead = [];
    for (k = 0; k<this.monsters.length; k++) {
        // each monster takes a single step in the game
        var i = 0;
        var oldX = this.monsters[k].getX();
        var oldY = this.monsters[k].getY();
        while (i < 3) {
        	var dx = 0; var dy = 0;
        	if (this.monsters[k].getLevel()===1){
        		//level 1 monster takes a random step
        		dx = Math.floor(Math.random() * 3 - 1);
            	dy = Math.floor(Math.random() * 3 - 1);
        	}
        	else if (this.monsters[k].getLevel()===2){
        		//level 2 monster takes a step towards a random player, or possibly none at all
        		var randInt = Math.floor(Math.random() * this.players.length);
        		var player = this.players[randInt];
        		if (player.getX() > oldX){
        			dx = Math.floor(Math.random()*2)===1 ? 1 : 0;
        		} else {
        			dx = Math.floor(Math.random()*2)===1 ? -1 : 0;
        		}
        		if (player.getY() > oldY){
        			dy = Math.floor(Math.random()*2)===1 ? 1 : 0;
        		}else{
        			dy = Math.floor(Math.random()*2)===1 ? -1 : 0;
        		}
        	}
        	else{
        		//level 3 monster takes a random leap of upto 3 squares in any direction
        		dx = Math.floor(Math.random()*7) -3;
        		dy = Math.floor(Math.random()*7) -3;
        	}

            if (this.moveMonster(oldX, oldY, dx, dy)) {
            	//to make it more balanced the level 3 monster is checked for surrounding boxes every move 
        		if (this.monsters[k].getType()===3 && this.isDead(this.monsters[k])){
                 	dead.push(this.monsters[k]);
            	}  
                break;
            }
            i++;
        }
        if (i=== 3) {
            //check if monster is trapped
            if (this.isDead(this.monsters[k])){
                 dead.push(this.monsters[k]);
            }              
        }
    }
    var c = dead.pop();
    while (c!==null && c!==undefined){
        this.removeActor(c);
        c=dead.pop();
    }
};

Stage.prototype.isDead=function(actor){
    var x = actor.getX();
    var y = actor.getY();
    
    for (i=-1;i<2;i++){
        for (j=-1;j<2;j++){
            //excludes checking your own spot
            if (i!==0 || j!==0){
                var space = this.isUsedCoor(x+i, y+j);
                if (!space){ 
                    if (!this.isBorder()){
                        return false;
                    }
                } else {
                    if (space.getType() === 'player'){
                        return false;
                    }
                }
            } 
        }
    }
    return true;
};

Stage.prototype.getChanges=function(){
	return this.changedActors;
};

Stage.prototype.clearChanges=function(){
	this.changedActors = [];
};

Stage.prototype.isBorder=function(x, y){
	if (x === this.leftWall || x === this.rightWall || y === this.topWall ||   y === this.bottomWall){
        return true;
    }
    return false;
};

//update the usedCoor object
Stage.prototype.changeCoor=function(actor, newX, newY){
	try{
		this.changedActors.push([actor.getX(), actor.getY(), newX, newY]);
		var oldC = this.xyToString(actor.getX(), actor.getY());
		var newC = this.xyToString(newX, newY);
		delete this.usedCoor[oldC];
		this.usedCoor[newC] = actor;

	}catch(err) {
    	console.log('change Coor error: '+err.message);
	}	
};

Stage.prototype.deleteCoor=function(x, y){
	this.changedActors.push([x, y]);
	var strC = this.xyToString(x, y);
	delete this.usedCoor[strC];
};

Stage.prototype.moveBox=function(x, y, dx, dy){
	//hit a wall
	if (this.isBorder(x+dx, y+dy)){
		return false;
	}
	var actor = this.isUsedCoor(x+dx, y+dy);
	if (actor){
		//boxes can only move other boxes
		if (actor.getType() !== 'box'){
			return false;
		}
		this.moveBox(x+dx, y+dy, dx, dy);
	}
	actor = this.isUsedCoor(x+dx, y+dy);
	if (!actor){
		//move
		actor = this.isUsedCoor(x, y);
		this.changeCoor(actor, x+dx, y+dy);
		actor.move(dx, dy);
		return true;
	}	
	return false;
};

Stage.prototype.moveMonster=function(x, y, dx, dy){
	//hit a wall
	if (this.isBorder(x+dx, y+dy)){
		return false;
	}
	var actor = this.isUsedCoor(x+dx, y+dy);
	if (actor){
		if (actor.getType() !== 'player'){
			return false;
		}
		//landed on a player
		this.removeActor(actor);
		
	}	
	actor = this.isUsedCoor(x+dx, y+dy);
	if (!actor){
		//move
		actor = this.isUsedCoor(x, y);
		if (!actor){
			console.log("error: actor in move monster is null...");
		}else{
			this.changeCoor(actor, x+dx, y+dy);
			actor.move(dx, dy);
		}
		return true;
	}	
	return false;
};

Stage.prototype.movePlayer=function(x, y, dx, dy){
	if (this.isBorder(x+dx, y+dy)){
		//wall
		return false;
	}
	var player = this.isUsedCoor(x, y);
	var actor = this.isUsedCoor(x+dx, y+dy);

	if (actor){
		//if monster, die
		if (actor.getType()==='monster'){
			this.removeActor(player);
			return true;
		}else if (actor.getType()==='box'){
			//try to move box
			this.moveBox(x+dx, y+dy, dx, dy);
		}else{
			//player
			return false;
		}
		
	}
	var actor = this.isUsedCoor(x+dx, y+dy);
	if (!actor){
		try{
			//move
			this.changeCoor(player, x+dx, y+dy);
			player.move(dx, dy);
			return true;
		}
		catch(err){
			console.log('move player error: '+err.message);
		}
	}
    return false;
};

// End Class Stage

//actor class
function Actor(id, x, y, type, level){
    this.id1 = id;
	this.ActorX=x;
	this.ActorY=y;
	this.type1 = type;
    this.level = level;
};

Actor.prototype.getX=function(){
    return this.ActorX;
};

Actor.prototype.getY=function(){
    return this.ActorY;
};

Actor.prototype.getType=function(){
    return this.type1;
};

Actor.prototype.getId=function(){
    return this.id1;
};

Actor.prototype.getLevel=function(){
    return this.level;
};

Actor.prototype.move = function(dX, dY){
    this.ActorX = this.ActorX+dX;
    this.ActorY = this.ActorY+dY;
};

Actor.prototype.toJSON=function(){
    return {"type":this.type1, "id":this.id1, "x":this.ActorX, "y":this.ActorY};
};

//Game Logic Ends

//-------------------------------------------------------------------------------------------------------

//Server Logic Begins

var express = require('express');
//var html = require('html');
//path module for path.join
//var path = require('path');
var app = express(),
httpPort = 10130,
wsPort = 10135; //ports assigned to me

app.get('/', function(req, res, next){
	//check if new user or returning user
	res.setHeader('Content-Type', 'text/html');
	res.sendFile(__dirname +'/views/ww.html');
});

app.get('/jquery-2.1.0.js', function(req, res, next){
	res.sendFile(__dirname +'/jquery-2.1.0.js');
});

app.get('/ww.js', function(req, res, next){
	res.sendFile(__dirname +'/ww.js');
});

app.get('/control.js', function(req, res, next){
	res.sendFile(__dirname +'/control.js');
});

//handle icon requests
app.get('/views/icons/*', function(req, res){
	var param = req.params[0];
	res.sendFile(__dirname +'/views/icons/'+param);
});

app.listen(httpPort, function(){
	console.log('server listening on 127.0.0.1:'+httpPort);
//alternate: console.log('server listening on cslinux.utm.utoronto.ca:'+httpPort);
});

var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({port: wsPort});
console.log('socket listening on 127.0.0.1:'+wsPort);
//alternate: console.log('socket listening on cslinux.utm.utoronto.ca:'+wsPort);

var allGames = [];
var allClients = {};
var counter = 0;
var socketCounter = 0;

function init(h, w, gameName) {
	//initialize a new game and return it as an object
	var stage = new Stage(h, w);
    stage.initialize();
    counter++;
    return {
    	"gameName" : gameName,
    	"stage" : stage, //entire game object
    	"interval" : 0, //use to determine whether game is running or not
    	"timeBonus" : 600, //timer 
    	"score" : 0, //score for all players
    	"width" : w,
    	"height" : h,
    	"gameId" : counter,
    	"numOfMonsters" : stage.getNumMonsters()
    };
};

wss.broadcast = function(game){
	var gameClients = allClients[game['gameId']];
	if (!gameClients){
		console.log('broadcast could not find game');
	}else{
		try{
			var message = {};
			message['command'] = 'update';
			message['payload'] = game['stage'].getChanges();
			message['timeBonus'] = game['timeBonus'];
			message['score'] = game['score'];
			message['interval'] = game['interval'];
			var json = JSON.stringify(message);
			var i;
			for(i=0; i<gameClients.length; i++){
				if (this.clients.indexOf(gameClients[i]) > -1){
					gameClients[i].send(json);
				}else{
					console.log('broadcast has a dead ws');
				}
			}
		}catch(error){
			console.log('error in broadcast: '+error.message);
		}
	}
}

wss.on('connection', function(ws) {
	ws.id = socketCounter;
	socketCounter++;
	console.log('New Connection from Client '+ws.id);
	ws.on('message', function(message) {
		var msg = JSON.parse(message);
		var command = msg['command'];
		var response = {};
		if (command === 'get games'){
			//send game info
			response['command'] = 'get games';
			var games = []; //game name, 
			for (i=0; i<allGames.length; i++){
				if (!allGames[i]['stage']){
					console.log('stage was missing from game: '+allGames[i]['gameId']);
					continue;
				}
				games.push([allGames[i]['gameName'], allGames[i]['stage'].players.length, 
					allGames[i]['width'], allGames[i]['height'], allGames[i]['gameId']]);
			}
			response['clientId'] = ws.id;
			response['payload'] = games;
			var json = JSON.stringify(response);
			ws.send(json);

		}else if (command === 'add game'){
			//create new game
			//add current user to the game
			//send the actors of the game to the client
			//play the game
			var myGame = init(msg['height'], msg['width'], msg['gameName']);
			var thisPlayer = myGame['stage'].addPlayer();
			allClients[myGame['gameId']] = []; //map websocket to the game they're playing
			allClients[myGame['gameId']].push(ws);
			allGames.push(myGame);
			//send the entire game to the user
			response['command'] = 'start game';
			response['payload'] = myGame;
			response['playerId'] = thisPlayer.getId();
			var json = JSON.stringify(response);
			ws.send(json);

		}else if (command === 'play game'){
			var myGame = null;
			var thisPlayer = null;
			var requestedId = parseInt(msg['gameId']);
			for (i=0; i<allGames.length; i++){
				console.log('gameId received @ playgame: '+requestedId);
				if (allGames[i]['gameId'] === requestedId){
					myGame = allGames[i];
				}
			}
			response['command'] = 'start game';
			if (myGame===null){
				console.log('could not find game');
				response['payload'] = 'could not find game';
			}else{
				var thisPlayer = myGame['stage'].addPlayer();
				allClients[myGame['gameId']].push(ws);
				response['playerId'] = thisPlayer.getId();
				response['payload'] = myGame;
			}
			var json = JSON.stringify(response);
			ws.send(json);

		}else if (command === 'move'){
			//move player
			try{
				var changes = msg['payload'];
				var game;
				for (i=0; i<allGames.length; i++){
					if (allGames[i]['gameId'] === changes['gameId']){
						game = allGames[i];
					}
				}
				game['stage'].movePlayer(changes['x'], changes['y'], changes['dx'], changes['dy']);
				var changes = game['stage'].getChanges();
				wss.broadcast(game);
				game['stage'].clearChanges();
			}catch(error){
				console.log('move error: '+error.message);
			}

		}else if (command === 'change interval'){
			var game;
			for (i=0; i<allGames.length; i++){
				if (allGames[i]['gameId'] === msg['gameId']){
					game = allGames[i];
				}
			}
			if (!game){
				console.log('could not find game during change interval');
			}else{
				game['interval'] = msg['interval'];
				wss.broadcast(game);
				game['stage'].clearChanges();
			}
		}else if (command === 'play again'){
			var game;
			for (i=0; i<allGames.length; i++){
				if (allGames[i]['gameId'] === msg['gameId']){
					console.log('starting a new game: '+msg['gameId']);
					game = allGames[i];
					break;
				}
			}
			var stage = new Stage(parseInt(game['width']), parseInt(game['height']));
			stage.initialize();
			game['stage'] = stage;
			game['numOfMonsters'] = stage.getNumMonsters();
			var clientList = allClients[msg['gameId']];
			response['command'] = 'start game';
			response['payload'] = game;
			for (i=0; i<clientList.length; i++){
				var thisPlayer = game['stage'].addPlayer();
				response['playerId'] = thisPlayer.getId();
				var json = JSON.stringify(response);
				ws.send(json);
			}

		}else if (command === 'quit'){
			//leaves the game, not the socket
			console.log('quitting gameId: '+msg['gameId']);
			var clientList = allClients[msg['gameId']];
			if (!clientList){
				console.log('could not find client list @ Quit');
			}else{
				var index = -1;
				for (i=0; i<allGames.length; i++){
					if (allGames[i]['gameId'] == msg['gameId']){
						console.log('gameId1: '+ allGames[i]['gameId']);
						console.log('gameId2: '+ msg['gameId']);
						index = i;
						break;
					}
				}
				if (index === -1){
					console.log('failed to find client\'s game @ quit'); 
				}else{
					allGames.splice(index, 1);
					if (clientList.length === 1 && ws.id === msg['clientId']){
						console.log('All players left '+msg['gameId']+' closing the game');
						//shut the game down
						delete allClients[msg['gameId']];
					}
					else{
						console.log('deleting client from client list');
						for (i=0; i<clientList.length; i++){
							if (clientList[i].id === msg['clientId']){
								break;
							}
						}
						if (i < clientList.length){
							clientList.splice(i, 1);
						}
						allClients[msg['gameId']] = clientList;
					}	
				
				}
			}
		}
	});

	wss.on('close', function() {
    	console.log('disconnected');
	});
});

//send win or lose notification and end game
wss.conditional = function(gameId, condition){
	var clientList = allClients[gameId];
	if (!clientList){
		console.log('Game not found @ wss.conditional');
	}else{
		var message = {};
		message['command'] = condition;
		message['gameId'] = gameId;
		var json = JSON.stringify(message);
		for (i=0; i<clientList.length; i++){
			if (this.clients.indexOf(clientList[i]) > -1){
				clientList[i].send(json);
			}else{
				console.log('wss.conditional has a dead ws');
			}
		}
	}
}

function updateAllGames(){
	for (i=0; i<allGames.length; i++){
		var game = allGames[i];
		if (game['interval']){
			//lose condition
			if (game['stage'].players.length===0){
				wss.conditional(game['gameId'], 'game over');
				game['interval'] = 0;
				game['score'] = 0;
				game['timeBonus'] = 600;
				delete game['stage']; //end of game;
				continue;
			}
			//update timebonus
			game['timeBonus'] -= 1;
			//check if numOfMonsters has changed, if so, update score and correct the numOfMonsters
			if (game['numOfMonsters'] > game['stage'].getNumMonsters()){
				game['score'] += (game['numOfMonsters'] - game['stage'].getNumMonsters()) * 100;
				game['numOfMonsters'] = game['stage'].getNumMonsters();
				//check win
				if (game['numOfMonsters'] === 0){
					wss.conditional(game['gameId'], 'win');
					game['interval'] = 0;
					game['score'] = 0;
					game['timeBonus'] = 600;
					delete game['stage']; //end of game;
					continue;
				}
			}
			game['stage'].step();
			wss.broadcast(game);
			game['stage'].clearChanges();
		}
	} 
}

setInterval(function(){ updateAllGames(); }, 2000);