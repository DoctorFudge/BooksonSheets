function takeItToTheCleaners() {
	var ui = SpreadsheetApp.getUi();
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var dialog = ui.showModalDialog(html, 'Cleaning the Sheet');
	const shelvesMap = getShelvesMap();
	clearEmptyRowsShelves(shelvesMap);
	const databaseMap = getDatabaseMap();
	clearEmptyRowsDatabase(databaseMap);
	const OTWMap = getOTWMap();
	clearEmptyRowsOntheWay(OTWMap);
	const wantMap = getWantMap();
	clearEmptyRowsWant(wantMap);
	cleanupDatabaseSheet();
	cleanupOTWSheet();
	cleanupWantSheet();
	Utilities.sleep(10);
	caseDivider();
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>')
		.setWidth(1)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function cleanupDatabaseSheet() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Tidying the Database');
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName('Database');
	var dbMap = getDatabaseMap();
	var lastRow = sheet.getLastRow();
	if (lastRow <= 1) return;
	var dataRange = sheet.getDataRange();
	var data = dataRange.getValues();
	for (var i = 1; i < data.length; i++) {
		var row = data[i];
		row = row.map(function(cell) {
			return typeof cell === 'string' ? cell.trim() : cell;
		});
		var id = row[dbMap['ID']];
		if (!/^[01].*[01234]$/.test(id)) {
			row[dbMap['ID']] = '';
		}
		['Title', 'Author', 'Author l-f', 'Publisher'].forEach(function(field) {
			if (typeof row[dbMap[field]] !== 'string') {
				sheet.getRange(i + 1, dbMap[field] + 1)
					.setNumberFormat('@');
			}
		});
		if (row[dbMap['Series']] !== "—" && row[dbMap['Series']].trim() === "") {
			row[dbMap['Series']] = '';
		}
		if (!/^(\d+|—|∞)$/.test(row[dbMap['No. in Series']])) {
			row[dbMap['No. in Series']] = '';
		}
		sheet.getRange(i + 1, dbMap['No. in Series'] + 1)
			.setHorizontalAlignment('right');
		var validGenres = ['Literary Fiction', 'Historical Fiction', 'Adventure', 'Western', 'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Mystery', 'Crime', 'Romance', 'Humor', 'Poetry', 'History', 'Biography/Autobiography', 'Science/Nature', 'Self-Help', 'Other'];
		if (!validGenres.includes(row[dbMap['Genre']])) {
			row[dbMap['Genre']] = '';
		}
		['Original Publication Date', 'Edition Publication Date', 'Acquisition Date'].forEach(function(field) {
			var date = parseDate(row[dbMap[field]]);
			if (date.getTime() !== new Date(0)
				.getTime()) {
				row[dbMap[field]] = Utilities.formatDate(date, Session.getScriptTimeZone(), 'M/d/yyyy');
			} else {
				row[dbMap[field]] = '';
			}
			sheet.getRange(i + 1, dbMap[field] + 1)
				.setHorizontalAlignment('right');
		});
		['ISBN13', 'ISBN'].forEach(function(field) {
			var isbn = row[dbMap[field]].toString();
			if (isbn && isbn.match(/^[0-9]+X?$/) && (isbn.length <= (field === 'ISBN13' ? 13 : 10) || (field === 'ISBN' && isbn.length === 11 && isbn.endsWith('X')))) {
				row[dbMap[field]] = isbn.padStart(field === 'ISBN13' ? 13 : 10, '0');
			} else {
				row[dbMap[field]] = '';
			}
		});
		var validBindings = ['HC', 'HCDJ', 'PB', 'S'];
		if (!validBindings.includes(row[dbMap['Binding']])) {
			row[dbMap['Binding']] = '';
		}
		['Thickness', 'Height', 'Width'].forEach(function(field) {
			var value = parseFloat(row[dbMap[field]]);
			if (isNaN(value)) {
				row[dbMap[field]] = '';
			} else {
				row[dbMap[field]] = value;
			}
		});
		var pageCount = parseInt(row[dbMap['Page Count']], 10);
		if (isNaN(pageCount) || pageCount < 0) {
			row[dbMap['Page Count']] = '';
		}
		['Favorite', 'Nonfiction', 'Comic'].forEach(function(field) {
			var value = row[dbMap[field]];
			if (value !== 0 && value !== 1) {
				row[dbMap[field]] = '';
			}
		});
		if (!/^#[0-9A-Fa-f]{6}$/.test(row[dbMap['HTML']])) {
			row[dbMap['HTML']] = '';
		}
		['Red', 'Green', 'Blue'].forEach(function(field) {
			var value = parseInt(row[dbMap[field]], 10);
			if (isNaN(value) || value < 0 || value > 255) {
				row[dbMap[field]] = '';
			}
		});
		['Hue', 'Saturation', 'Value', 'Lightness'].forEach(function(field) {
			var value = parseInt(row[dbMap[field]], 10);
			var maxValue = field === 'Hue' ? 360 : 100;
			if (isNaN(value) || value < 0 || value > maxValue) {
				row[dbMap[field]] = '';
			}
		});
		if (!/^https?:\/\/.*$/.test(row[dbMap['Cover']])) {
			row[dbMap['Cover']] = '';
		}
		['Other Genres', 'Tags'].forEach(function(field) {
			if (row[dbMap[field]]) {
				row[dbMap[field]] = String(row[dbMap[field]])
					.split(',')
					.map(function(item) {
						return item.trim();
					})
					.join(', ');
				sheet.getRange(i + 1, dbMap[field] + 1)
					.setNumberFormat('@');
			}
		});
		data[i] = row;
	}
	dataRange.setValues(data);
}

function cleanupOTWSheet() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Tidying the OntheWay Sheet');
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName('OntheWay');
	var OTWMap = getOTWMap();
	var lastRow = sheet.getLastRow();
	if (lastRow <= 1) return;
	var dataRange = sheet.getDataRange();
	var data = dataRange.getValues();
	for (var i = 1; i < data.length; i++) {
		var row = data[i];
		row = row.map(function(cell) {
			return typeof cell === 'string' ? cell.trim() : cell;
		});
		['Title', 'Author', 'Author l-f', 'Publisher'].forEach(function(field) {
			if (typeof row[OTWMap[field]] !== 'string') {
				sheet.getRange(i + 1, OTWMap[field] + 1)
					.setNumberFormat('@');
			}
		});
		if (row[OTWMap['Series']] !== "—" && row[OTWMap['Series']].trim() === "") {
			row[OTWMap['Series']] = '';
		}
		if (!/^(\d+|—|∞)$/.test(row[OTWMap['No. in Series']])) {
			row[OTWMap['No. in Series']] = '';
		}
		sheet.getRange(i + 1, OTWMap['No. in Series'] + 1)
			.setHorizontalAlignment('right');
		var validGenres = ['Literary Fiction', 'Historical Fiction', 'Adventure', 'Western', 'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Mystery', 'Crime', 'Romance', 'Humor', 'Poetry', 'History', 'Biography/Autobiography', 'Science/Nature', 'Self-Help', 'Other'];
		if (!validGenres.includes(row[OTWMap['Genre']])) {
			row[OTWMap['Genre']] = '';
		}
		['Original Publication Date', 'Edition Publication Date'].forEach(function(field) {
			var date = parseDate(row[OTWMap[field]]);
			if (date.getTime() !== new Date(0)
				.getTime()) {
				row[OTWMap[field]] = Utilities.formatDate(date, Session.getScriptTimeZone(), 'M/d/yyyy');
			} else {
				row[OTWMap[field]] = '';
			}
			sheet.getRange(i + 1, OTWMap[field] + 1)
				.setHorizontalAlignment('right');
		});
		['ISBN13', 'ISBN'].forEach(function(field) {
			var isbn = row[OTWMap[field]].toString();
			if (isbn && isbn.match(/^[0-9]+X?$/) && (isbn.length <= (field === 'ISBN13' ? 13 : 10) || (field === 'ISBN' && isbn.length === 11 && isbn.endsWith('X')))) {
				row[OTWMap[field]] = isbn.padStart(field === 'ISBN13' ? 13 : 10, '0');
			} else {
				row[OTWMap[field]] = '';
			}
		});
		['Favorite', 'Nonfiction', 'Comic'].forEach(function(field) {
			var value = row[OTWMap[field]];
			if (value !== 0 && value !== 1) {
				row[OTWMap[field]] = '';
			}
		});
		if (!/^https?:\/\/.*$/.test(row[OTWMap['Cover']])) {
			row[OTWMap['Cover']] = '';
		}
		data[i] = row;
	}
	dataRange.setValues(data);
}

function cleanupWantSheet() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Tidying the Want Sheet');
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName('Want');
	var wantMap = getWantMap();
	var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
	var data = dataRange.getValues();
	for (var i = 0; i < data.length; i++) {
		var row = data[i];
		row = row.map(function(cell) {
			return typeof cell === 'string' ? cell.trim() : cell;
		});
		['Title', 'Author', 'Author l-f'].forEach(function(field) {
			if (typeof row[wantMap[field]] !== 'string') {
				sheet.getRange(i + 2, wantMap[field] + 1)
					.setNumberFormat('@');
			}
		});
		if (row[wantMap['Series']] !== "—" && row[wantMap['Series']].trim() === "") {
			row[wantMap['Series']] = '';
		}
		if (!/^(\d+|—|∞)$/.test(row[wantMap['No. in Series']])) {
			row[wantMap['No. in Series']] = '';
		}
		sheet.getRange(i + 2, wantMap['No. in Series'] + 1)
			.setHorizontalAlignment('right');
		var validGenres = ['Literary Fiction', 'Historical Fiction', 'Adventure', 'Western', 'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Mystery', 'Crime', 'Romance', 'Humor', 'Poetry', 'History', 'Biography/Autobiography', 'Science/Nature', 'Self-Help', 'Other'];
		if (!validGenres.includes(row[wantMap['Genre']])) {
			row[wantMap['Genre']] = '';
		}
		['Original Publication Date'].forEach(function(field) {
			var date = parseDate(row[wantMap[field]]);
			if (date.getTime() !== new Date(0)
				.getTime()) {
				row[wantMap[field]] = Utilities.formatDate(date, Session.getScriptTimeZone(), 'M/d/yyyy');
			} else {
				row[wantMap[field]] = '';
			}
			sheet.getRange(i + 1, wantMap[field] + 1)
				.setHorizontalAlignment('right');
		});
		['Favorite', 'Nonfiction', 'Comic'].forEach(function(field) {
			var value = row[wantMap[field]];
			if (value !== 0 && value !== 1) {
				row[wantMap[field]] = '';
			}
		});
		row[wantMap['AbeBooks']] = '';
		data[i] = row;
	}
	dataRange.setValues(data);
}

function clearEmptyRowsShelves(shelvesMap) {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Clearing Empty Shelves Rows');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadsheet.getSheetByName('Shelves');
	var lastRow = sheet.getLastRow();
	var lastColumn = sheet.getLastColumn();
	if (lastRow <= 1) return;
	var titleColumnIndex = shelvesMap["Title"] + 1;
	var dataRange = sheet.getRange(2, titleColumnIndex, lastRow - 1, 1);
	var data = dataRange.getValues();
	for (var i = 0; i < data.length; i++) {
		if (data[i][0] === '') {
			var rowToResetColor = i + 2;
			sheet.getRange(rowToResetColor, 1, 1, lastColumn)
				.setBackground(null);
		}
	}
}

function clearEmptyRowsDatabase(databaseMap) {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Clearing Empty Database Rows');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadsheet.getSheetByName('Database');
	var lastRow = sheet.getLastRow();
	var lastColumn = sheet.getLastColumn();
	if (lastRow <= 1) return;
	var titleColumnIndex = databaseMap["Title"] + 1;
	var dataRange = sheet.getRange(2, titleColumnIndex, lastRow - 1, 1);
	var data = dataRange.getValues();
	for (var i = 0; i < data.length; i++) {
		if (data[i][0] === '') {
			var rowToClear = i + 2;
			sheet.getRange(rowToClear, 1, 1, lastColumn)
				.clearContent()
				.setBackground(null);
		}
	}
}

function clearEmptyRowsOntheWay(OTWMap) {
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Clearing Empty OntheWay Rows');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadsheet.getSheetByName('OntheWay');
	var lastRow = sheet.getLastRow();
	var lastColumn = sheet.getLastColumn();
	if (lastRow <= 1) return;
	var titleColumnIndex = OTWMap["Title"] + 1;
	var dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
	var data = dataRange.getValues();
	for (var i = 0; i < data.length; i++) {
		if (data[i][titleColumnIndex - 1] === '') {
			var rowToClear = i + 2;
			sheet.getRange(rowToClear, 1, 1, lastColumn)
				.clearContent()
				.clearNote();
		}
	}
}

function clearEmptyRowsWant(wantMap) {
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(HtmlService.createHtmlOutputFromFile('MessageDialog')
		.append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>')
		.append('<script>function closeDialog() { google.script.host.close(); }</script>')
		.setTitle('Executing')
		.setWidth(250)
		.setHeight(1)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Clearing Empty Want Rows');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = spreadsheet.getSheetByName('Want');
	var lastRow = sheet.getLastRow();
	var lastColumn = sheet.getLastColumn();
	if (lastRow <= 1) return;
	var titleColumnIndex = wantMap["Title"] + 1;
	var dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
	var data = dataRange.getValues();
	for (var i = 0; i < data.length; i++) {
		if (data[i][titleColumnIndex - 1] === '') {
			var rowToClear = i + 2;
			sheet.getRange(rowToClear, 1, 1, lastColumn)
				.clearContent()
				.clearNote();
		}
	}
}

function cleanAcquisitionDates() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('Database');
	const databaseMap = getDatabaseMap();
	const dateColumnIndex = databaseMap['Acquisition Date'] + 1;
	const lastRow = databaseSheet.getLastRow();
	if (lastRow <= 1) return;
	const acquisitionDates = databaseSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.getValues();
	const cleanedDates = acquisitionDates.map(dateArray => {
		const date = dateArray[0];
		return [new Date(date.getFullYear(), date.getMonth(), date.getDate())];
	});
	databaseSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.setValues(cleanedDates)
		.setNumberFormat("MM/dd/yyyy");
}

function cleanReadStartDates() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const readingLogSheet = ss.getSheetByName('ReadingLog');
	const readingLogMap = getReadingLogMap();
	const dateColumnIndex = readingLogMap['Start Date'] + 1;
	const lastRow = readingLogSheet.getLastRow();
	if (lastRow <= 1) return;
	const acquisitionDates = readingLogSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.getValues();
	const cleanedDates = acquisitionDates.map(dateArray => {
		const date = dateArray[0];
		return [new Date(date.getFullYear(), date.getMonth(), date.getDate())];
	});
	readingLogSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.setValues(cleanedDates)
		.setNumberFormat("MM/dd/yyyy");
}

function cleanReadEndDates() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const readingLogSheet = ss.getSheetByName('ReadingLog');
	const readingLogMap = getReadingLogMap();
	const dateColumnIndex = readingLogMap['End Date'] + 1;
	const lastRow = readingLogSheet.getLastRow();
	if (lastRow <= 1) return;
	const acquisitionDates = readingLogSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.getValues();
	const cleanedDates = acquisitionDates.map(dateArray => {
		const date = dateArray[0];
		return [new Date(date.getFullYear(), date.getMonth(), date.getDate())];
	});
	readingLogSheet.getRange(2, dateColumnIndex, lastRow - 1)
		.setValues(cleanedDates)
		.setNumberFormat("MM/dd/yyyy");
}

function listCellsWithoutNotes() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('Database');
	const databaseMap = getDatabaseMap();
	const authorColumnIndex = databaseMap['Author'] + 1;
	const publisherColumnIndex = databaseMap['Publisher'] + 1;
	const numRows = databaseSheet.getLastRow() - 1;
	if (numRows < 1) return;
	const authorRange = databaseSheet.getRange(2, authorColumnIndex, numRows, 1);
	const publisherRange = databaseSheet.getRange(2, publisherColumnIndex, numRows, 1);
	const authorValues = authorRange.getValues();
	const publisherValues = publisherRange.getValues();
	const authorNotes = authorRange.getNotes();
	const publisherNotes = publisherRange.getNotes();
	const authorsWithoutNotes = [];
	const publishersWithoutNotes = [];
	for (let i = 0; i < numRows; i++) {
		if (authorValues[i][0] && authorValues[i][0] !== '—' && !authorNotes[i][0]) {
			authorsWithoutNotes.push(authorValues[i][0]);
		}
		if (publisherValues[i][0] && publisherValues[i][0] !== '—' && !publisherNotes[i][0]) {
			publishersWithoutNotes.push(publisherValues[i][0]);
		}
	}
	showListsInDialog(authorsWithoutNotes, publishersWithoutNotes);
}

function showListsInDialog(authors, publishers) {
	const htmlOutput = HtmlService.createHtmlOutput(`<html><body>
        <h2>Authors without Notes</h2>
        <ul>${authors.map(author => `<li>${author}</li>`).join('')}</ul>
        <h2>Publishers without Notes</h2>
        <ul>${publishers.map(publisher => `<li>${publisher}</li>`).join('')}</ul>
        <button onclick="google.script.host.close()">Close</button>
        </body></html>`)
        .setWidth(400)
        .setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Cells without Notes');
}
