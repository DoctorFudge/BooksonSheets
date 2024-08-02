function convertToInches(inch) {
	return inch * 25.4;
}

function convertToMM(mm) {
	return mm / 25.4;
}

function parseDate(dateInput) {
	if (dateInput instanceof Date) {
		return dateInput;
	}
	if (typeof dateInput === 'string' && dateInput.trim() !== '') {
		var parts = dateInput.split('/');
		var day = parts[1];
		var month = parts[0] - 1;
		var year = parts[2];
		return new Date(year, month, day);
	}
	return new Date(0);
}

function columnToLetter(column) {
	var temp, letter = '';
	while (column > 0) {
		temp = (column - 1) % 26;
		letter = String.fromCharCode(temp + 65) + letter;
		column = (column - temp - 1) / 26;
	}
	return letter;
}

function transpose(array) {
	return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
}
