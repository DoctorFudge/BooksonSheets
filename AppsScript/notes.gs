function noteMaster() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Fixing up the Notes');
	Utilities.sleep(10);
	clearDescriptionNotes();
	Utilities.sleep(10);
	runClearPublisherNotes();
	Utilities.sleep(10);
	runClearAuthorNotes()
	Utilities.sleep(10);
	runApplyPublisherNotes();
	Utilities.sleep(10);
	runAuthorNotes();
	Utilities.sleep(10);
	createDescriptionNotes();
	Utilities.sleep(10);
	caseDivider();
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function runClearPublisherNotes() {
	const databaseMap = getDatabaseMap();
	clearPublisherNotes(databaseMap);
}

function runApplyPublisherNotes() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Applying Publisher Notes');
	const databaseMap = getDatabaseMap();
	applyPublisherNotes(databaseMap);
}

function runClearAuthorNotes() {
	const databaseMap = getDatabaseMap();
	clearAuthorNotes(databaseMap);
}

function runAuthorNotes() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Applying Author Notes');
	const databaseMap = getDatabaseMap();
	authorNotes(databaseMap);
}

function clearPublisherNotes(databaseMap) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var dbSheet = ss.getSheetByName('Database');
	var lastRow = dbSheet.getLastRow();
	var dbRange = dbSheet.getRange(2, databaseMap["Publisher"] + 1, lastRow - 1, 1);
	dbRange.clearNote();
}

function applyPublisherNotes(databaseMap) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var dbSheet = ss.getSheetByName('Database');
	var publishersSheet = ss.getSheetByName('Publishers');
	var publishersRange = publishersSheet.getRange('A2:B' + publishersSheet.getLastRow());
	var publishersData = publishersRange.getValues();
	var pubInfo = {};
	publishersData.forEach(function(row) {
		pubInfo[row[0].trim()] = row[1];
	});
	var lastRow = dbSheet.getLastRow();
	var dbRange = dbSheet.getRange(2, databaseMap["Publisher"] + 1, lastRow - 1, 1);
	var dbData = dbRange.getValues();
	dbData.forEach(function(row, index) {
		var publisherName = row[0].trim();
		if (pubInfo.hasOwnProperty(publisherName)) {
			var cell = dbRange.getCell(index + 1, 1);
			cell.setNote(pubInfo[publisherName]);
		}
	});
}

function authorNotes(databaseMap) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('Database');
	const authorsSheet = ss.getSheetByName('Authors');
	const authorData = authorsSheet.getRange(1, 1, authorsSheet.getLastRow(), 5).getDisplayValues();
	const authorMap = {};
	authorData.forEach(row => {
		authorMap[row[0]] = row;
	});
	const databaseRange = databaseSheet.getDataRange();
	const databaseValues = databaseRange.getDisplayValues();
	for (let i = 1; i < databaseValues.length; i++) {
		const authorCell = databaseValues[i][databaseMap['Author']];
		const authors = authorCell.split(' and ');
		let note = '';
		authors.forEach((author, index) => {
			if (authorMap[author]) {
				const [authorName, fullName, birthDate, deathDate, origin] = authorMap[author];
				const formattedNote = formatAuthorNote(authorName, fullName, birthDate, deathDate, origin, authors.length > 1);
				if (formattedNote) {
					note += (index > 0 ? '\n\n' : '') + formattedNote;
				}
			}
		});
		if (note) {
			databaseSheet.getRange(i + 1, databaseMap['Author'] + 1).setNote(note);
		}
	}
}

function formatAuthorNote(authorName, fullName, birthDate, deathDate, origin, isMultiAuthor) {
	let note = isMultiAuthor ? authorName + '\n' : '';
	if (fullName) {
		note += fullName + '\n';
	}
	if (birthDate !== 'Unknown' || deathDate !== 'Unknown') {
		const formattedDeathDate = deathDate === 'Alive' ? 'Present' : deathDate;
		note += (birthDate !== 'Unknown' ? birthDate : 'Unknown') + ' - ' + (formattedDeathDate !== 'Unknown' ? formattedDeathDate : 'Unknown') + '\n';
	}
	if (origin !== 'Unknown') {
		note += origin;
	}
	return note.trim();
}

function clearAuthorNotes(databaseMap) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var dbSheet = ss.getSheetByName('Database');
	var lastRow = dbSheet.getLastRow();
	var dbRange = dbSheet.getRange(2, databaseMap["Author"] + 1, lastRow - 1, 1);
	dbRange.clearNote();
}

function createDescriptionNotes() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Applying Description Notes');
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheetInfo = [{
		name: 'Shelves',
		mapFunc: getShelvesMap
	}, {
		name: 'Database',
		mapFunc: getDatabaseMap
	}, {
		name: 'Want',
		mapFunc: getWantMap
	}, {
		name: 'OntheWay',
		mapFunc: getOTWMap
	}];
	sheetInfo.forEach(info => {
		const sheet = ss.getSheetByName(info.name);
		const columnIndexMap = info.mapFunc();
		const descriptionIndex = columnIndexMap['Description'] + 1;
		const numRows = sheet.getLastRow();
		if (numRows > 1) {
			const descriptionColumn = sheet.getRange(2, descriptionIndex, numRows - 1).getValues();
			descriptionColumn.forEach((cell, rowIndex) => {
				if (cell[0] && cell[0] !== '—') {
					sheet.getRange(rowIndex + 2, descriptionIndex).setNote(cell[0]);
				}
			});
		}
	});
}

function clearDescriptionNotes() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheetInfo = [{
		name: 'Shelves',
		mapFunc: getShelvesMap
	}, {
		name: 'Database',
		mapFunc: getDatabaseMap
	}, {
		name: 'Want',
		mapFunc: getWantMap
	}, {
		name: 'OntheWay',
		mapFunc: getOTWMap
	}];
	sheetInfo.forEach(info => {
		const sheet = ss.getSheetByName(info.name);
		const columnIndexMap = info.mapFunc();
		const descriptionIndex = columnIndexMap['Description'] + 1;
		const numRows = sheet.getLastRow();
		if (numRows > 1) {
			sheet.getRange(2, descriptionIndex, numRows - 1).clearNote();
		}
	});
}
