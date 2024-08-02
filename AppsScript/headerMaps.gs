function getShelvesMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const shelvesSheet = ss.getSheetByName('Shelves');
	const headers = shelvesSheet.getRange(1, 1, 1, shelvesSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}

function getDatabaseMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('Database');
	const headers = databaseSheet.getRange(1, 1, 1, databaseSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}

function getOTWMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('OntheWay');
	const headers = databaseSheet.getRange(1, 1, 1, databaseSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}

function getWantMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const wantSheet = ss.getSheetByName('Want');
	const headers = wantSheet.getRange(1, 1, 1, wantSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}

function getReadingLogMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const readingLogSheet = ss.getSheetByName('ReadingLog');
	const headers = readingLogSheet.getRange(1, 1, 1, readingLogSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}

function getPubDataMap() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const pubDataSheet = ss.getSheetByName('Publishers');
	const headers = pubDataSheet.getRange(1, 1, 1, pubDataSheet.getLastColumn()).getValues()[0];
	const columnIndexMap = {};
	headers.forEach((header, index) => {
		columnIndexMap[header] = index;
	});
	return columnIndexMap;
}
