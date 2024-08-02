function assignBookIDs() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Generating Book IDs');
	const databaseMap = getDatabaseMap();
	bookIDGenerator(databaseMap);
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function bookIDGenerator(dbMap) {
	var databaseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Database');
	var data = databaseSheet.getDataRange().getValues();
	var genreMap = {
		'Literary Fiction': '01',
		'Historical Fiction': '02',
		'Adventure': '03',
		'Western': '04',
		'Fantasy': '05',
		'Science Fiction': '06',
		'Horror': '07',
		'Thriller': '08',
		'Mystery': '09',
		'Crime': '10',
		'Romance': '11',
		'Humor': '12',
		'Poetry': '13',
		'History': '14',
		'Biography/Autobiography': '15',
		'Science/Nature': '16',
		'Self-Help': '17',
		'Other': '00'
	};
	var bindingMap = {
		'PB': '1',
		'HC': '2',
		'HCDJ': '3',
		'S': '4'
	};
	for (var i = 1; i < data.length; i++) {
		var row = data[i];
		if (!row[dbMap["ID"]]) {
			if (row[dbMap["Genre"]] === 'Other') {
				databaseSheet.getRange(i + 1, dbMap["ID"] + 1).setValue('0000000000');
				continue;
			}
			var nonfictionComicCode = `${row[dbMap["Nonfiction"]]}${row[dbMap["Comic"]]}`;
			var genreCode = genreMap[row[dbMap["Genre"]]] || '00';
			var authorInitials = (row[dbMap["Author"]].match(/[A-Z]/g) || []).join('');
			var titleInitials = (row[dbMap["Title"]].match(/[A-Z]/g) || []).join('');
			var publicationDate = row[dbMap["Original Publication Date"]];
			var year = '0000';
			if (publicationDate) {
				year = Utilities.formatDate(publicationDate, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy');
			}
			var bindingCode = bindingMap[row[dbMap["Binding"]]] || '0';
			var id = `${nonfictionComicCode}${genreCode}${authorInitials}${titleInitials}${year}${bindingCode}`;
			databaseSheet.getRange(i + 1, dbMap["ID"] + 1).setValue(id);
		}
	}
}

function startReading() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 3000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Updating Current Book');
	const databaseMap = getDatabaseMap();
	var controlPanelSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	var currentBookID = controlPanelSheet.getRange('B16').getValue();
	var currentStartDate = controlPanelSheet.getRange('C16').getValue();
	if (currentBookID || currentStartDate) {
		var alertHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 3000);</script>').append('<p>Finish reading your current book first.</p>').setWidth(250).setHeight(50).setSandboxMode(HtmlService.SandboxMode.IFRAME);
		ui.showModalDialog(alertHtml, 'Alert');
		return;
	}
	var databaseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Database');
	var bookID = controlPanelSheet.getRange('B18').getValue();
	var data = databaseSheet.getDataRange().getValues();
	if (!bookID) {
		return;
	}
	for (var i = 0; i < data.length; i++) {
		if (data[i][databaseMap["ID"]] == bookID) {
			controlPanelSheet.getRange('B17').setValue(data[i][databaseMap["Title"]]);
			controlPanelSheet.getRange('C17').setValue(data[i][databaseMap["Author"]]);
			var imageCell = controlPanelSheet.getRange('D16');
			imageCell.clearContent();
			var imageUrl = data[i][databaseMap["Cover"]];
			if (imageUrl) {
				imageCell.setFormula('=IMAGE("' + imageUrl + '")');
			}
			controlPanelSheet.getRange('B16').setValue(bookID).setFontColor('#FFFFFF');
			controlPanelSheet.getRange('C16').setValue(new Date()).setFontColor('#FFFFFF');
			controlPanelSheet.getRange('B18').clearContent();
			break;
		}
	}
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function doneReading() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Finishing Current Book');
	finishReading();
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function finishReading() {
	var controlPanelSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	var readingLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ReadingLog');
	var databaseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Database');
	var bookID = controlPanelSheet.getRange('B16').getValue();
	var startDate = controlPanelSheet.getRange('C16').getValue();
	if (!bookID) {
		return;
	}
	var ui = SpreadsheetApp.getUi();
	var response = ui.prompt('Rate the book out of 5', 'Please enter a rating between 1 and 5:', ui.ButtonSet.OK_CANCEL);
	if (response.getSelectedButton() == ui.Button.OK) {
		var rating = parseFloat(response.getResponseText());
		if (isNaN(rating) || rating < 1 || rating > 5) {
			ui.alert('Invalid rating. Please enter a number between 1 and 5.');
			return;
		}
		var data = databaseSheet.getDataRange().getValues();
		const databaseMap = getDatabaseMap();
		for (var i = 0; i < data.length; i++) {
			if (data[i][databaseMap["ID"]] == bookID) {
				databaseSheet.getRange(i + 1, databaseMap["Rating"] + 1).setValue(rating);
				break;
			}
		}
	}
	var readingLogData = readingLogSheet.getDataRange().getValues();
	var rowToUpdate = null;
	for (var i = 0; i < readingLogData.length; i++) {
		if (readingLogData[i][0] == bookID && !readingLogData[i][2]) {
			rowToUpdate = i + 1;
			break;
		}
	}
	if (rowToUpdate) {
		readingLogSheet.getRange(rowToUpdate, 3).setValue(new Date());
	} else {
		var nextRow = readingLogSheet.getLastRow() + 1;
		readingLogSheet.getRange(nextRow, 1).setValue(bookID);
		readingLogSheet.getRange(nextRow, 2).setValue(startDate);
		readingLogSheet.getRange(nextRow, 3).setValue(new Date());
	}
	controlPanelSheet.getRange('B16:C16').clearContent();
	controlPanelSheet.getRange('B17').setValue('Nothing');
	controlPanelSheet.getRange('C17').setValue('Nobody');
	controlPanelSheet.getRange('D16').setFormula('=IMAGE("https://lh3.googleusercontent.com/d/1GPF1oyE3gm8nU_Xxitdp2us5XzswEqSb")');
	cleanReadStartDates();
	cleanReadEndDates();
}

function bookFinder() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Locating Book');
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const controlPanelSheet = ss.getSheetByName('Control Panel');
	const shelvesSheet = ss.getSheetByName('Shelves');
	const shelvesMap = getShelvesMap();
	const titleSearch = controlPanelSheet.getRange('B23').getValue().toLowerCase();
	const authorSearch = controlPanelSheet.getRange('C23').getValue().toLowerCase();
	const shelvesData = shelvesSheet.getDataRange().getValues();
	let foundBooks = [];
	for (let i = 1; i < shelvesData.length; i++) {
		const row = shelvesData[i];
		const title = row[shelvesMap['Title']].toLowerCase();
		const author = row[shelvesMap['Author']].toLowerCase();
		const authorLf = row[shelvesMap['Author l-f']].toLowerCase();
		if ((title.includes(titleSearch) || titleSearch === '') && (author.includes(authorSearch) || authorLf.includes(authorSearch) || authorSearch === '')) {
			foundBooks.push({
				title: row[shelvesMap['Title']],
				author: row[shelvesMap['Author']],
				caseNumber: row[shelvesMap['Case']],
				shelf: row[shelvesMap['Shelf']],
				index: row[shelvesMap['Index']]
			});
		}
	}
	if (foundBooks.length > 0) {
		let html = '<ul style="font-family: \'Bookman\', serif; overflow-x: auto;">';
		foundBooks.forEach((book, index) => {
			html += `<li style="white-space: nowrap;"><span style="font-weight: bold; color: #8B0000;">${book.title}</span>, by <span style="font-weight: bold; color: #006400;">${book.author}</span> is in <span style="font-weight: bold; color: #00008B;">Bookcase #${book.caseNumber}</span> on <span style="font-weight: bold; color: #4B0082;">Shelf #${book.shelf}</span> (Index #<span style="font-weight: bold; color: #8B4513;">${book.index}</span>).</li>`;
		});
		html += '</ul>';
		const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(600).setHeight(150);
		SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Book(s) Found');
	} else {
		var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
		ui.showModalDialog(closingHtml, 'Finished!');
		SpreadsheetApp.getUi().alert('Error: Book not found. Idiot');
	}
}

function findOptimalInsertion() {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var controlPanelSheet = ss.getSheetByName('Control Panel');
	var shelvesSheet = ss.getSheetByName('Shelves');
	var caseNumber = controlPanelSheet.getRange('G22').getValue();
	var shelfNumber = controlPanelSheet.getRange('H22').getValue();
	if (!caseNumber || !shelfNumber) {
		return;
	}
	var shelvesMap = getShelvesMap();
	var blockRange = findBlockRange(shelvesSheet, shelvesMap, caseNumber, shelfNumber);
	var blockData = shelvesSheet.getRange(blockRange.startRow, 1, blockRange.numRows, shelvesSheet.getLastColumn()).getValues();
	var blockTitles = [];
	var blockThicknesses = [];
	blockData.forEach(function(row) {
		blockTitles.push(row[shelvesMap['Title']]);
		blockThicknesses.push(parseFloat(row[shelvesMap['Thickness']]));
	});
	var casesSheet = ss.getSheetByName('Cases');
	var shelfSpace = getShelfSpace(casesSheet, caseNumber);
	var otherItems = getOtherItems(shelvesSheet, shelvesMap, blockRange.endRow);
	var optimalItem = findOptimalItem(blockThicknesses, otherItems, shelfSpace);
	displayOptimalItem(optimalItem);
}

function findBlockRange(sheet, shelvesMap, caseNumber, shelfNumber) {
	var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
	var startRow = -1;
	var endRow = -1;
	for (var i = 0; i < data.length; i++) {
		if (data[i][shelvesMap['Case']] == caseNumber && data[i][shelvesMap['Shelf']] == shelfNumber) {
			if (startRow == -1) {
				startRow = i + 2;
			}
			endRow = i + 2;
		}
	}
	return {
		startRow: startRow,
		endRow: endRow,
		numRows: endRow - startRow + 1
	};
}

function getShelfSpace(sheet, caseNumber) {
	var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
	var shelfSpace = 0;
	data.forEach(function(row) {
		if (row[0] == caseNumber) {
			shelfSpace = parseFloat(row[1]);
		}
	});
	return shelfSpace;
}

function getOtherItems(sheet, shelvesMap, endRow) {
	var data = sheet.getRange(endRow + 1, 1, sheet.getLastRow() - endRow, sheet.getLastColumn()).getValues();
	var otherItems = [];
	data.forEach(function(row) {
		if (row[shelvesMap['Genre']] == 'Other') {
			otherItems.push({
				title: row[shelvesMap['Title']],
				thickness: parseFloat(row[shelvesMap['Thickness']])
			});
		}
	});
	return otherItems;
}

function findOptimalItem(blockThicknesses, otherItems, shelfSpace) {
	var bestItem = null;
	var bestFit = -Infinity;
	otherItems.forEach(function(item) {
		for (var i = 0; i <= blockThicknesses.length; i++) {
			var newThicknesses = [item.thickness].concat(blockThicknesses.slice(0, blockThicknesses.length - i));
			var totalThickness = newThicknesses.reduce((sum, t) => sum + t, 0);
			if (totalThickness <= shelfSpace && totalThickness > bestFit) {
				bestFit = totalThickness;
				bestItem = item;
			}
		}
	});
	return bestItem;
}

function displayOptimalItem(item) {
	if (!item) {
		item = {
			title: 'No optimal item found',
			thickness: ''
		};
	}
	var htmlOutput = HtmlService.createHtmlOutput('<p>Optimal item to insert:</p><p>Title: ' + item.title + '</p><p>Thickness: ' + item.thickness + '</p>').setWidth(300).setHeight(200);
	SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Optimal Item');
}

function acqBook() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const controlPanelSheet = ss.getSheetByName('Control Panel');
	const wantSheet = ss.getSheetByName('Want');
	const onTheWaySheet = ss.getSheetByName('OntheWay');
	const wantMap = getWantMap();
	const onTheWayMap = getOTWMap();
	const titleSearch = controlPanelSheet.getRange('B23').getValue().toLowerCase();
	const authorSearch = controlPanelSheet.getRange('C23').getValue().toLowerCase();
	const wantData = wantSheet.getDataRange().getValues();
	const onTheWayData = onTheWaySheet.getDataRange().getValues();
	let matchCount = 0;
	let matchedRow;
	let matchedSheet;
	let matchedMap;
	let matchedData;
	[wantData, onTheWayData].forEach((data, index) => {
		const sheetMap = index === 0 ? wantMap : onTheWayMap;
		for (let i = 1; i < data.length; i++) {
			const row = data[i];
			const title = row[sheetMap['Title']].toLowerCase();
			const author = row[sheetMap['Author']].toLowerCase();
			const authorLf = row[sheetMap['Author l-f']].toLowerCase();
			if ((title.includes(titleSearch) || titleSearch === '') && (author.includes(authorSearch) || authorLf.includes(authorSearch) || authorSearch === '')) {
				matchCount++;
				matchedRow = i;
				matchedSheet = index === 0 ? 'Want' : 'OntheWay';
				matchedMap = sheetMap;
				matchedData = row;
				if (matchCount > 1) {
					SpreadsheetApp.getUi().alert('Error: More than one match found.');
					return;
				}
			}
		}
	});
	if (matchCount === 1) {
		const result = {};
		Object.keys(matchedMap).forEach((key) => {
			if (key !== 'AbeBooks') {
				if (key === 'Original Publication Date' || key === 'Edition Publication Date') {
					result[key] = formatDate(matchedData[matchedMap[key]]);
				} else {
					result[key] = matchedData[matchedMap[key]];
				}
			}
		});
		result['matchedRow'] = matchedRow + 1;
		result['matchedSheet'] = matchedSheet;
		const template = HtmlService.createTemplateFromFile('MoveToDatabaseForm');
		template.data = result;
		const html = template.evaluate().setWidth(400).setHeight(600);
		SpreadsheetApp.getUi().showModalDialog(html, 'Acquire Book');
	} else {
		SpreadsheetApp.getUi().alert('Error: No match found.');
	}
}

function processMoveToDatabaseForm(formObject) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const wantSheet = ss.getSheetByName('Want');
	const onTheWaySheet = ss.getSheetByName('OntheWay');
	const databaseSheet = ss.getSheetByName('Database');
	const databaseMap = getDatabaseMap();
	const matchedRow = formObject.matchedRow;
	const matchedSheet = formObject.matchedSheet;
	var newRow = Array(databaseSheet.getLastColumn()).fill('');
	for (var key in formObject) {
		if (databaseMap[key] !== undefined) {
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
		}
	}
	const today = new Date();
	const dateString = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
	newRow[databaseMap['Acquisition Date']] = dateString;
	databaseSheet.appendRow(newRow);
	const sheet = matchedSheet === 'Want' ? wantSheet : onTheWaySheet;
	sheet.deleteRow(matchedRow);
	SpreadsheetApp.getUi().alert('Book moved to Database.');
}

function formatDate(date) {
	if (date instanceof Date) {
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		return month + "/" + day + "/" + year;
	}
	return date;
}

function bookOrdered() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const controlPanelSheet = ss.getSheetByName('Control Panel');
	const wantSheet = ss.getSheetByName('Want');
	const wantMap = getWantMap();
	const titleSearch = controlPanelSheet.getRange('B23').getValue().toLowerCase();
	const authorSearch = controlPanelSheet.getRange('C23').getValue().toLowerCase();
	const wantData = wantSheet.getDataRange().getValues();
	let matchCount = 0;
	let matchedRow;
	for (let i = 1; i < wantData.length; i++) {
		const row = wantData[i];
		const title = row[wantMap['Title']].toLowerCase();
		const author = row[wantMap['Author']].toLowerCase();
		const authorLf = row[wantMap['Author l-f']].toLowerCase();
		if ((title.includes(titleSearch) || titleSearch === '') && (author.includes(authorSearch) || authorLf.includes(authorSearch) || authorSearch === '')) {
			matchCount++;
			matchedRow = i;
			if (matchCount > 1) {
				SpreadsheetApp.getUi().alert('Error: More than one match found.');
				return;
			}
		}
	}
	if (matchCount === 1) {
		const row = wantData[matchedRow];
		const data = {};
		Object.keys(wantMap).forEach((key) => {
			if (key !== 'AbeBooks') {
				if (key === 'Original Publication Date') {
					data[key] = formatDate(row[wantMap[key]]);
				} else {
					data[key] = row[wantMap[key]];
				}
			}
		});
		data['matchedRow'] = matchedRow + 1;
		data['matchedSheet'] = 'Want';
		const template = HtmlService.createTemplateFromFile('MoveToOTWForm');
		template.data = data;
		const html = template.evaluate().setWidth(400).setHeight(600);
		SpreadsheetApp.getUi().showModalDialog(html, 'Order Book');
	} else {
		SpreadsheetApp.getUi().alert('Error: No match found.');
	}
}

function processMoveToOTWForm(formObject) {
	const otwMap = getOTWMap();
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const wantSheet = ss.getSheetByName('Want');
	const otwSheet = ss.getSheetByName('OntheWay');
	const matchedRow = formObject.matchedRow;
	const matchedSheet = formObject.matchedSheet;
	delete formObject.matchedRow;
	delete formObject.matchedSheet;
	var newRow = Array(otwSheet.getLastColumn()).fill('');
	for (var key in formObject) {
		if (otwMap[key] !== undefined) {
			newRow[otwMap[key]] = formObject[key];
		}
	}
	otwSheet.appendRow(newRow);
	const sheet = matchedSheet === 'Want' ? wantSheet : otwSheet;
	sheet.deleteRow(matchedRow);
	SpreadsheetApp.getUi().alert('Book moved to On The Way list.');
}
