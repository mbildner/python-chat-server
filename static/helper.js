function toArray (indexableObject) {
	var newArray = [];

	for (var i=0; i<indexableObject.length; i++) {
		newArray.push(indexableObject[i]);
	}

	return newArray;
}


function range (/* ...args */) {
	var end;

	var start = 0;
	var step = 1;

	var args = toArray(arguments);

	if (args.length === 1) {
		end = args[0];

	} else if (args.length === 2) {
		start = args[0];
		end = args[1];

	} else if (args.length === 3) {
		start = args[0];
		end = args[1];
		step = args[2];
	} else {
		// TODO error message is imprecise, if two arguments they must be: start, end;
		throw new Error("range takes arguments: range([start], end, [step])");
	}

	var numberArray = [];

	for (var i=start; step > 0 ? i<end : i>end; i+=step) {
		numberArray.push(i);
	}
	return numberArray;	
}

