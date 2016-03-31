var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({port: 8000});

var messages=["hello", "foo"];

wss.on('close', function() {
    console.log('disconnected');
});

wss.broadcast = function(message){
	var i;
	for(i=0;i<this.clients.length;i++){	
		this.clients[i].send(message);
	}
}

wss.on('connection', function(ws) {
	var i;
	for(i=0;i<messages.length;i++){
		ws.send(messages[i]);
	}
	ws.on('message', function(message) {
		console.log(message);
		// ws.send(message); 
		wss.broadcast(message);
		messages.push(message);
	});
	console.log("ws: "+ws);
});
console.log("server listening on port 8000");