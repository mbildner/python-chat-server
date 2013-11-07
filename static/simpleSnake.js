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

	var grid = [];

	this.grid = grid;

	for (var row=0; row<rows; row++){
		var currentRow = [];
		this.grid.push(currentRow);
		for (var col=0; col<cols; col++){
			var box = new GridBox(row, col, colWidth, rowHeight);
			currentRow.push(box);
			// currentRow.collideable = (row == ( 0 || rows-1)) ? true : false;
		}
	}


	this.randomBox = function(){
		var randBox = {};
		randBox.collideable = true;

		while (randBox.collideable){
			var randRow = Math.floor(Math.random()*this.grid.length);
			var randCol = Math.floor(Math.random()*this.grid[0].length);
			var randBox = this.grid[randRow][randCol];
		}
		
		return randBox;
	}

	// Canvas setup code - put it in a this.init function

	// set edges to collideable and render them black
	// CHANGED CODE WATCH FOR ERROR
	this.setHardEdges = function () {
		this.grid[0].forEach(function(box){
			box.collideable = true;
			box.render("black");
		});
		
		this.grid[this.grid.length-1].forEach(function(box){
			box.collideable = true;
			box.render("black");
		});

		this.grid.forEach(function(row){
			row[0].collideable = true;
			row[row.length-1].collideable = true;
			row[0].render("black");
			row[row.length-1].render("black");
		});		
	}



	// set a block to have food, make it collideable, and render it blue

	var foodBlock = this.randomBox();
	foodBlock.collideable = true;
	foodBlock.food = true;
	foodBlock.render("blue");

	this.foodBlock = foodBlock;
	
}



var SnakeModel = function(canvas, snakeLength){
	// this.body = [];
	
	// for (var bodyBlock=0; bodyBlock<snakeLength; bodyBlock++){
	// 	this.body.push({});
	// }

	this.directionsDict = {
		"Up": {"col": -1, "row":0},
		"Down":{"col": 1, "row":0},
		"Left": {"col": 0, "row":-1},
		"Right": {"col": 0, "row":1}
	}	
	



	this.body = [
		{row:1,col:3},
		{row:1,col:4},
		{row:1,col:5},		
		{row:1,col:6},		
		{row:1,col:7},		
		];

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
				// broadcast death to other players
				// should build a wrapped function to only ws.send when ws.readyState === 1
				var obit = JSON.stringify({
					id: browserId,
					snake: "dead",
				});

				// kill the snake, it hit something it shouldn't
				window.clearInterval(gameLoopHandle);

				alert("Game over, thanks for playing.");

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


		// var directionsDict = {
		// 	"Left": {"col": -1, "row":0},
		// 	"Right":{"col": 1, "row":0},
		// 	"Up": {"col": 0, "row":-1},
		// 	"Down": {"col": 0, "row":1}
		// }

		// Hack to get around weird grid inversion

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

;(function(){
	// get a unique browser ID
	this.browserId = Math.round(Math.random() * 1000000)

	// wrap up ws init in a function

	var wsEndpoint = "/snakesocket";

	var origin = document.location.origin;

	var wsUrl = "ws" + origin.substring(4) + wsEndpoint;

	var ws = new WebSocket(wsUrl);

	ws.onmessage = function (m) {
		var update = m.data;
		update = JSON.parse(update);

		// ignore our own browser
		if (update.id != browserId && update.snake) {
			// this is about someone else's snake, and that snake is alive
			outsideSnakes[update.id] = update.snake;
		} else if (typeof(update.snake)==="undefined") {
			console.log("snake death: ", update.id);
		}
	}

	this.ws = ws;


	this.canvas = document.getElementById('snakeGameCanvas');
	this.canvas.backgroundColor = "white";
	this.context = canvas.getContext('2d');
	this.gridModel = new GridModel(canvas, 40, 40);	

	this.gridModel.setHardEdges();

	this.snake = new SnakeModel(canvas, 10);
	

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
	
})(this);



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

	// reinstate the snake
	snake.setBodyColideable();
	snake.collisionCheck();

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
			var box = gridModel.grid[box.row][box.col]
			box.collideable = true;
			box.render("orange");
		});
	}
}

var gameLoopHandle = window.setInterval(gameLoop, 80);
