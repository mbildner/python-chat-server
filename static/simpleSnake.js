var GridBox = function(row, col, width, height){
	this.row = row;
	this.col = col;
	this.width = width;
	this.height = height;
	this.collideable = false;

	this.render = function(color){
		context.fillStyle = color;
		context.fillRect(row*height, col*width, width, height, color)
	}

	this.erase = function(){
		this.render(canvas.backgroundColor);
	}
}

var GridModel = function(canvas, rows, cols){
	this.rows = rows;
	this.cols = cols;

	var rowHeight = canvas.height/rows;
	var colWidth = canvas.width/cols;

	this.rowHeight = rowHeight;
	this.colWidth = colWidth;

	this.colWidth = colWidth;
	this.rowHeight = rowHeight;

	this.grid = range(rows).map(function (row) {
		return range(cols).map(function (col) {
			return new GridBox(row, col, colWidth, rowHeight);
		})
	});


	this.randomBox = function(){
		var nonCollideables = [];

		this.grid.forEach(function (row) {
			row.forEach(function (box) {
				if (!box.collideable) {
					nonCollideables.push(box);
				}
			});
		});

		return nonCollideables[Math.round(Math.random() * nonCollideables.length)];
	}

	// Canvas setup code - put it in a this.init function

	// set edges to collideable and render them black


	this.setHard = function (boxArray) {
		boxArray.forEach(function (box) {
			box.collideable = true;
			box.render("black");
		});
	}


	this.setHardEdges = function () {
		var edges = [
			this.grid[0],
			this.grid[this.grid.length-1],
			this.grid.map(function (row) {
				return row[0];
			}),
			this.grid.map(function (row) {
				return row[row.length-1];
			})

		];

		edges.forEach(setHard);

	}

	var row_is_safe = function (rowNumber) {
		var row = gridModel.grid[rowNumber];

		var edgelessRow = row.slice(1, row.length-2);

		var collideable = edgelessRow.some(function (box) {
			return box.collideable;
		});

		var safe = !(collideable);

		return safe;
	}


	this.row_is_safe = row_is_safe;

	// set a block to have food, make it collideable, and render it blue

	var foodBlock = this.randomBox();
	foodBlock.collideable = true;
	foodBlock.food = true;
	foodBlock.render("blue");

	this.foodBlock = foodBlock;
}

var SnakeModel = function(canvas, snakeLength){

	var randomSnake = function () {
		// for now, body is mostly predefined but we need to plug in a row number
		var rowNumber = Math.round(Math.random() * gridModel.grid.length);

		if (gridModel.row_is_safe(rowNumber)) {

			var body = [
					{row:rowNumber,col:3},
					{row:rowNumber,col:4},
					{row:rowNumber,col:5},		
					{row:rowNumber,col:6},		
					{row:rowNumber,col:7},		
					];

			return body;
		} else {
			return randomSnake();
		}

	}


	this.randomSnake = randomSnake;

	this.body = randomSnake();

	this.directionsDict = {
		"Up": {"col": -1, "row":0},
		"Down":{"col": 1, "row":0},
		"Left": {"col": 0, "row":-1},
		"Right": {"col": 0, "row":1}
	}	

	this.setBodyColideable = function(){
		var trunk = this.body.slice(1);
		trunk.forEach(function(rc){
			var box = gridModel.grid[rc.row][rc.col];
			box.collideable = true;

		});
	}


	this.collisionCheck = function(){
		head = this.body[0];
		var headGridBox = gridModel.grid[head.row][head.col];
		var collision = headGridBox.collideable;

		if (collision){
			if (headGridBox.food){
				// grow the snake; it ate food
				snake.grow();
				// set the food key to false and reset it randomly
				headGridBox.food = false;
				headGridBox.collideable = false;
				var newFood = gridModel.randomBox();
				newFood.collideable = true;
				newFood.food = true;
				newFood.render("blue");
				gridModel.foodBlock = newFood;

			} else {
				// should build a wrapped function to only ws.send when ws.readyState === 1
				var obit = JSON.stringify({
					id: browserId
				});

				// kill the snake, it hit something it shouldn't
				// window.clearInterval(gameHandle);
				endGame();

				// alert("Game over, thanks for playing.");

			}
		}
	}

	this.grow = function(){
		var tail = this.body[this.body.length-1];
		var directionDelta = this.directionsDict[this.direction];
		var newTail = {
			"row": tail.row + directionDelta.row,
			"col": tail.col + directionDelta.col
		}

		gridModel.grid[newTail.row][newTail.col].collideable = true;

		this.body.push(newTail);
		var newTailBlock = gridModel.grid[newTail.row][newTail.col];
		// newTailBlock.render("lime");

	}

	this.direction = "Right";


	// this.body.forEach(function(block){
	// 	var gridBox = gridModel.grid[block.row][block.col];
	// 	gridBox.render("lime");
	// })

	this.move = function(direction){
		var tail = this.body.pop();

		var tailBox = gridModel.grid[tail.row][tail.col];
		tailBox.collideable = false;
		tailBox.erase();


		var directionsDict = {
			"Up": {"col": -1, "row":0},
			"Down":{"col": 1, "row":0},
			"Left": {"col": 0, "row":-1},
			"Right": {"col": 0, "row":1}
		}	

		var oldHead = this.body[0];
		
		var newHead = {
			"row": oldHead.row,
			"col": oldHead.col
		};		

		newHead.row += this.directionsDict[direction]["row"];
		newHead.col += this.directionsDict[direction]["col"];
		this.body = [newHead].concat(this.body);

		// gridModel.grid[newHead.row][newHead.col].render("lime");

	}

	this.render = function (color) {
		this.body.forEach(function (square) {
			var box = gridModel.grid[square.row][square.col];
			box.render(color);
		});
	}
}


var safeSend = function (ws, item) {
	if (ws.readyState===1) {
		ws.send(item);
	} else {
		console.log("error sending through websocket, readyState: ", ws.readyState);
	}
}


var createWebSocket = function (endpoint) {
	// var wsEndpoint = "/snakesocket";
	var wsEndpoint = endpoint;
	var origin = document.location.origin;
	var wsUrl = "ws" + origin.substring(4) + wsEndpoint;
	var ws = new WebSocket(wsUrl);
	return ws;	
}


window.browserId = Math.round(Math.random() * 1000000)

var ws = createWebSocket('/snakesocket');

ws.addEventListener('message', function (m) {
	var update = m.data;
	update = JSON.parse(update);

	// ignore our own browser
	if (update.id != browserId && update.snake) {
		// this is about someone else's snake, and that snake is alive
		outsideSnakes[update.id] = update.snake;

	} else if (typeof(update.snake)==="undefined") {
		// no update was sent, the snake is dead.
		delete outsideSnakes[update.id];
	}

});


var canvas = document.getElementById('snakeGameCanvas');
var canvas.backgroundColor = "white";
var context = canvas.getContext('2d');
var gridModel = new GridModel(canvas, 40, 40);	

var gridModel.setHardEdges();

var snake = new SnakeModel(canvas, 10);
	

var keyDict = {
	37 : "Left",
	38 : "Up",
	39 : "Right",
	40 : "Down"
}

	document.addEventListener("keydown", function(keyPress){

		// keyidentifier should be "Up Down Right Left", mozilla doesn't implement it, so we'll do it ourselves
		keyPress.keyIdentifier = keyDict[keyPress.which];

		if (keyPress.keyIdentifier in snake.directionsDict){
			// if the user is trying to reverse the snake's direction ignore the input
			if ((Math.abs(snake.directionsDict[keyPress.keyIdentifier].row)) != (Math.abs(snake.directionsDict[snake.direction].row))){
				snake.direction = keyPress.keyIdentifier;
			}

		} else {
			// for now, just suppress all other key presses, but they may be useful later
		}
	});
	
})();

window.outsideSnakes = {};

var clearBoard = function () {
	// clears the board visually AND clears all collision boxes
	gridModel.grid.forEach(function (row) {
		row.forEach(function (square) {
			var box = gridModel.grid[square.row][square.col];
			box.collideable = false;
		})
	});

	context.fillStyle = "white";

	var startingX = 0 + gridModel.colWidth;
	var startingY = 0 + gridModel.rowHeight;

	var width = canvas.width;

	var height = canvas.height;

	context.fillRect(startingX, startingY, width, height);
}


var gameLoop = function(){
	// reinstate the snake
	snake.setBodyColideable();
	snake.collisionCheck();
	// clear the board
	clearBoard();

	// reinstate the food
	gridModel.foodBlock.render("blue");
	gridModel.foodBlock.collideable = true;

	// make edges crashable
	gridModel.setHardEdges();
	// move the snake
	snake.move(snake.direction);
	snake.head = snake.body[0];


	// render the snake
	snake.render("lime");

	// broadcast the snake's new position
	if (ws.readyState === 1) {
		var snakeBody = snake.body;

		var update = JSON.stringify({
			id: browserId,
			snake: snakeBody
		});

		ws.send(update);

	}

	// process incoming snakes
	// this should be wrapped up in its own function and called

	for (var s in outsideSnakes) {
		var fsnake = outsideSnakes[s];

		fsnake.forEach(function (box) {
			var box = gridModel.grid[box.row][box.col];
			box.collideable = true;
			box.render("orange");
		});
	}
}


var gameState = "dead";
var gameHandle;
var speed;

var newGame = function () {
	var speedInput = document.getElementById('speedInput');
	speed = speedInput.value;
	window.snake = new SnakeModel(canvas, 10);
	console.log(window.snake);
	startGame();
}

var startGame = function () {
	var gameLoopHandle = window.setInterval(gameLoop, speed);
	gameState = "running";
	toggleGameButton.innerHTML = "Pause";
	gameHandle = gameLoopHandle;
}

var pauseGame = function() {
	window.clearInterval(gameHandle);
	toggleGameButton.innerHTML = "Unpause";
	toggleGameButton.focus();
	gameState = "paused";
}

var endGame = function () {
	pauseGame();
	toggleGameButton.innerHTML = "Start over";
	toggleGameButton.focus();
	gameState = "dead";
}

var toggleGameButton = document.getElementById('toggleGameButton');

toggleGameButton.height = 100;
toggleGameButton.width = 100;

toggleGameButton.innerHTML = "Start";
toggleGameButton.focus();

toggleGameButton.addEventListener('click', function () {
	var funcs = {
		"dead"   : newGame,
		"paused" : startGame,
		"running": pauseGame
	};
	funcs[gameState]();
});