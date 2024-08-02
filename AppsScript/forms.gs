function showInitialForm() {
	var html = HtmlService.createHtmlOutputFromFile('InitialForm').setWidth(300).setHeight(150);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a Book');
}

function processInitialForm(formObject) {
	var option = formObject.initialOption;
	if (option == '1') {
		showDatabaseForm();
	} else if (option == '2') {
		showWantForm();
	} else if (option == '3') {
		showOTWForm();
	}
}

function showDatabaseForm() {
	var html = HtmlService.createHtmlOutputFromFile('DatabaseForm').setWidth(400).setHeight(600);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a Newly Acquired Book');
}

function showWantForm() {
	var html = HtmlService.createHtmlOutputFromFile('WantForm').setWidth(400).setHeight(600);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a Book to Wanted List');
}

function showOTWForm() {
	var html = HtmlService.createHtmlOutputFromFile('OTWForm').setWidth(400).setHeight(600);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a Book On the Way');
}

function processDatabaseForm(formObject) {
	var databaseMap = getDatabaseMap();
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var databaseSheet = ss.getSheetByName('Database');
	var newRow = [];
	for (var key in databaseMap) {
		if (formObject[key] !== undefined) {
			if ((key === 'Thickness' || key === 'Height' || key === 'Width') && formObject[key].trim() !== '') {
				var value = convertUnits(parseFloat(formObject[key]), formObject[key + 'InputUnit'], formObject[key + 'OutputUnit']);
				newRow[databaseMap[key]] = value;
			} else if (key === 'HTML') {
				var htmlValue = formObject[key].trim();
				if (htmlValue && htmlValue.charAt(0) !== '#') {
					htmlValue = '#' + htmlValue;
				}
				newRow[databaseMap[key]] = htmlValue;
			} else {
				newRow[databaseMap[key]] = formObject[key];
			}
		} else {
			newRow[databaseMap[key]] = '';
		}
	}
	var today = new Date();
	var dateString = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
	newRow[databaseMap['Acquisition Date']] = dateString;
	databaseSheet.appendRow(newRow);
	SpreadsheetApp.getUi().alert('Book added to Database.');
}

function convertUnits(value, inputUnit, outputUnit) {
	var conversionFactors = {
		'cm': {
			'cm': 1,
			'mm': 10,
			'in': 0.3937007874015748
		},
		'mm': {
			'cm': 0.1,
			'mm': 1,
			'in': 0.03937007874015748
		},
		'in': {
			'cm': 2.54,
			'mm': 25.4,
			'in': 1
		}
	};
	var result = value * conversionFactors[inputUnit][outputUnit];
	return Number(result.toFixed(14));
}

function processWantForm(formObject) {
	if (!formObject.Title || formObject.Title.trim() === '') {
		SpreadsheetApp.getUi().alert('Title Required');
		return;
	}
	var wantMap = getWantMap();
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var wantSheet = ss.getSheetByName('Want');
	var headers = wantSheet.getRange(1, 1, 1, wantSheet.getLastColumn()).getValues()[0];
	var newRow = Array(headers.length).fill('');
	for (var key in wantMap) {
		if (formObject[key] !== undefined) {
			newRow[wantMap[key]] = formObject[key];
		}
	}
	var data = wantSheet.getDataRange().getValues();
	var lastRow = data.length;
	for (var i = data.length - 1; i >= 0; i--) {
		if (data[i].some(cell => cell !== '')) {
			lastRow = i + 1;
			break;
		}
	}
	wantSheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
	SpreadsheetApp.getUi().alert('Book added to Want list.');
}

function processOTWForm(formObject) {
	var otwMap = getOTWMap();
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var otwSheet = ss.getSheetByName('OntheWay');
	var headers = otwSheet.getRange(1, 1, 1, otwSheet.getLastColumn()).getValues()[0];
	var newRow = Array(headers.length).fill('');
	for (var key in otwMap) {
		if (formObject[key] !== undefined) {
			newRow[otwMap[key]] = formObject[key];
		}
	}
	var data = otwSheet.getDataRange().getValues();
	var lastRowWithData = data.length;
	for (var i = data.length - 1; i >= 0; i--) {
		if (data[i].some(cell => cell !== '')) {
			lastRowWithData = i + 1;
			break;
		}
	}
	otwSheet.getRange(lastRowWithData + 1, 1, 1, newRow.length).setValues([newRow]);
	SpreadsheetApp.getUi().alert('Book added to On the Way list.');
}

function showAuthorsForm() {
	var html = HtmlService.createHtmlOutputFromFile('AuthorsForm').setWidth(400).setHeight(300);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a New Author');
}

function processAuthorsForm(formObject) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var authorsSheet = ss.getSheetByName('Authors');
	var newRow = [];
	newRow.push(formObject['Author'] || '');
	newRow.push(formObject['Real Name'] || '');
	var bornIndex = newRow.push(validateDate(formObject['Born'])) - 1;
	var diedIndex = newRow.push(validateDateOrAlive(formObject['Died'])) - 1;
	newRow.push(formObject['From'] || 'Unknown');
	var data = authorsSheet.getDataRange().getValues();
	var lastRowWithData = data.length;
	for (var i = data.length - 1; i >= 0; i--) {
		if (data[i].some(cell => cell !== '')) {
			lastRowWithData = i + 1;
			break;
		}
	}
	authorsSheet.getRange(lastRowWithData + 1, 1, 1, newRow.length).setValues([newRow]);
	var lastRow = lastRowWithData + 1;
	if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(newRow[bornIndex])) {
		authorsSheet.getRange(lastRow, bornIndex + 1).setNumberFormat('MMMM d, yyyy');
	}
	if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(newRow[diedIndex])) {
		authorsSheet.getRange(lastRow, diedIndex + 1).setNumberFormat('MMMM d, yyyy');
	}
	var range = authorsSheet.getRange(2, 1, authorsSheet.getLastRow() - 1, authorsSheet.getLastColumn());
	range.sort({
		column: 1,
		ascending: true
	});
	SpreadsheetApp.getUi().alert('Author added.');
}

function validateDate(dateString) {
	if (!dateString || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString) && !/^\d{4}$/.test(dateString)) {
		return 'Unknown';
	}
	return dateString;
}

function validateDateOrAlive(dateString) {
	if (!dateString || dateString.toLowerCase() !== 'alive' && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString) && !/^\d{4}$/.test(dateString)) {
		return 'Unknown';
	}
	return dateString;
}

function showPublishersForm() {
	var html = HtmlService.createHtmlOutputFromFile('PublishersForm').setWidth(400).setHeight(300);
	SpreadsheetApp.getUi().showModalDialog(html, 'Add a New Publisher');
}

function processPublishersForm(formObject) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var publishersSheet = ss.getSheetByName('Publishers');
	var newRow = [];
	newRow.push(formObject['Publisher'] || '');
	newRow.push(formObject['Description'] || '');
	var data = publishersSheet.getDataRange().getValues();
	var lastRowWithData = data.length;
	for (var i = data.length - 1; i >= 0; i--) {
		if (data[i].some(cell => cell !== '')) {
			lastRowWithData = i + 1;
			break;
		}
	}
	publishersSheet.getRange(lastRowWithData + 1, 1, 1, newRow.length).setValues([newRow]);
	var range = publishersSheet.getRange(2, 1, publishersSheet.getLastRow() - 1, publishersSheet.getLastColumn());
	range.sort({
		column: 1,
		ascending: true
	});
	SpreadsheetApp.getUi().alert('Publisher added.');
}
