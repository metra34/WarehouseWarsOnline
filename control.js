//all player keyboard / onscreen / mobile sensor controls go here

	function moveMe(dx, dy){
		var message = {};
		var changes = {};
		message['command'] = 'move';
		changes['x'] = myX;
		changes['y'] = myY;
		changes['dx'] = dx;
		changes['dy'] = dy;
		changes['gameId'] = gameId;
		message['payload'] = changes;
		var json = JSON.stringify(message);
		socket.send(json);
	}  
	

	function keyControl(e){
		if (interval && playerId){
			if (e.keyCode<41){
				if (e.keyCode === 37){
					//left 37
					moveMe(-1, 0);
				} else if (e.keyCode === 39){
					//right 39
					moveMe(1, 0);
				} else if (e.keyCode === 38){
					//up 38
					moveMe(0, 1);
				} else if (e.keyCode === 40){
					//down 40
					moveMe(0, -1);
				}
			} else if (e.keyCode<91){
				if (e.keyCode=== 81){
					//NW
					moveMe(-1, 1);
				} else if (e.keyCode === 87){
					//N
					moveMe(0, 1);
				}else if (e.keyCode === 69){
					//NE
					moveMe(1, 1);
				}else if (e.keyCode === 68){
					//E
					moveMe(1, 0);
				}else if (e.keyCode === 65){
					//W
					moveMe(-1, 0);
				}else if (e.keyCode === 90){
					//SW
					moveMe(-1, -1);
				}else if (e.keyCode === 88){
					//S
					moveMe(0, -1);
				}else if (e.keyCode === 67){
					//SE
					moveMe(1, -1);
				}
			}
		}
	}


	function mouseControl(i){
		if (interval && playerId){
			if (i==0){
				//north-west up, left
				moveMe(-1, 1);	
			} else if (i==1){
				//move north
				moveMe(0, 1);
			} else if (i==2){
				//move north-east		
				moveMe(1, 1);
			} else if (i==3){
				//move west		
				moveMe(-1, 0);
			} else if (i==4){
				//move east
				moveMe(1, 0);	
			} else if (i==5){
				//move south-west		
				moveMe(-1, -1);
			} else if (i==6){
				//move south	
				moveMe(0, -1);
			} else if (i==7){
				//move south-east
				moveMe(1, -1);
			}
		}
	}

	//move with mouse click or touch screen
	//use geometry to determine whether the angle is more vertical, diagonal, or horizontal 
	//from the origin (myX, myY) to determine the appropriate move
	function moveWithClick(coor){
		if (playerId != null && interval > 0){
			var x = parseInt(coor.split(',')[0]);
			var y = parseInt(coor.split(',')[1]);
			var dx = 0;
			var dy = 0;
			//check for vertical / horizontal line
			if (x === myX){
				//vertical move;
				if (y < myY){
					dy = -1;
				}else if (y > myY){
					dy = 1;
				}
			}
			else if (y === myY){
				//horizontal line
				if (x < myX){
					dx = -1;
				}else if (x > myX){
					dx = 1;
				}
			}
			else{
				//tan function to get angle
				var adjacent;
				var opposite;
				adjacent = (myX - x);
				opposite = (myY - y);
				var angle = Math.atan(opposite/parseFloat(adjacent));
				if (Math.abs(angle)<=Math.PI/6.00){
					//x changes
					dx = 1; dy = 0;
				}else if(Math.abs(angle)<=Math.PI/3.00){
					//x and y change
					dx = 1; dy = 1;
				}else{
					//y changes
					dx = 0; dy = 1;
				}
				if (x > myX){
					//right side
					if (angle<0){
						//lower quadrant
						dy *= -1;
					}
				}else{
					//left side
					dx *= -1;
					if (angle>0){
						//lower quadrant
						dy *= -1;
					}
				}
			}
			moveMe(dx, dy);
		}
	}