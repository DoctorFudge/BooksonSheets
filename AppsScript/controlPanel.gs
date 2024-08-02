function showSidebar() {
	var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('De Libris').setWidth(300);
	SpreadsheetApp.getUi().showSidebar(html);
}

function getControlPanelData() {
	updateShelfSequenceRatio();
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	var data = {
		sortOptions: sheet.getRange('B1:B13').getValues().flat(),
		sortOrders: sheet.getRange('C1:C13').getValues().flat(),
		presetName: sheet.getRange('E14').getValue(),
		bookId: sheet.getRange('B18').getValue(),
		titleSearch: sheet.getRange('B23').getValue(),
		authorSearch: sheet.getRange('C23').getValue(),
		currentlyReadingTitle: sheet.getRange('B17').getValue(),
		currentlyReadingAuthor: sheet.getRange('C17').getValue(),
		currentBookImage: "",
		shelfSequenceRatio: sheet.getRange('H19').getValue(),
		caseNumber: sheet.getRange('G22').getValue(),
		shelfNumber: sheet.getRange('H22').getValue()
	};
	var imageFormula = sheet.getRange('D16').getFormula();
	if (typeof imageFormula === 'string') {
		var matches = imageFormula.match(/"([^"]+)"/);
		if (matches) {
			data.currentBookImage = matches[1];
		}
	}
	return data;
}

function updateControlPanelData(data) {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	updateShelfSequenceRatio();
	sheet.getRange('B1:B13').setValues(data.sortOptions.map(function(option) {
		return [option];
	}));
	sheet.getRange('C1:C13').setValues(data.sortOrders.map(function(order) {
		return [order];
	}));
	sheet.getRange('E14').setValue(data.presetName);
	sheet.getRange('B18').setValue(data.bookId);
	sheet.getRange('B23').setValue(data.titleSearch);
	sheet.getRange('C23').setValue(data.authorSearch);
	sheet.getRange('G22').setValue(data.caseNumber);
	sheet.getRange('H22').setValue(data.shelfNumber);
}

function getDropdownOptions() {
	var dropdownSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dropdowns');
	var sortOptions = dropdownSheet.getRange('A:A').getValues().flat().filter(function(option) {
		return option !== '';
	});
	var sortOrders = dropdownSheet.getRange('B:B').getValues().flat().filter(function(option) {
		return option !== '';
	});
	var controlPanelSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	var currentSortOptions = controlPanelSheet.getRange('B1:B13').getValues().flat();
	var currentSortOrders = controlPanelSheet.getRange('C1:C13').getValues().flat();
	return {
		sortOptions: sortOptions,
		sortOrders: sortOrders,
		currentSortOptions: currentSortOptions,
		currentSortOrders: currentSortOrders
	};
}

function updateShelfSequenceRatio() {
	var ratio = countHighLowRatios();
	var controlPanelSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Control Panel');
	controlPanelSheet.getRange('H19').setValue(ratio);
}

function getSortPresets() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SortPresets');
	var presets = sheet.getRange('A2:A' + sheet.getLastRow()).getValues().flat();
	return presets.filter(function(preset) {
		return preset !== '';
	});
}

function applySortPreset() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Applying Sort Preset');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var controlPanelSheet = spreadsheet.getSheetByName('Control Panel');
	var sortPresetsSheet = spreadsheet.getSheetByName('SortPresets');
	var presetName = controlPanelSheet.getRange('E14').getValue();
	var presetsData = sortPresetsSheet.getDataRange().getValues();
	var presetRowIndex = presetsData.findIndex(row => row[0] === presetName);
	if (presetRowIndex === -1) {
		throw new Error('Preset not found: ' + presetName);
	}
	var presetData = presetsData[presetRowIndex].slice(1);
	for (var i = 0; i < presetData.length / 2; i++) {
		controlPanelSheet.getRange(i + 1, 2).setValue(presetData[i]);
		controlPanelSheet.getRange(i + 1, 3).setValue(presetData[i + 13]);
	}
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function saveSortPreset() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Saving Sort Preset');
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var controlPanelSheet = spreadsheet.getSheetByName('Control Panel');
	var sortPresetsSheet = spreadsheet.getSheetByName('SortPresets');
	var newPresetName = controlPanelSheet.getRange('E14').getValue();
	var dropdownCriteriaValues = controlPanelSheet.getRange('B1:B13').getValues().flat();
	var dropdownOrderValues = controlPanelSheet.getRange('C1:C13').getValues().flat();
	var existingPresets = sortPresetsSheet.getDataRange().getValues();
	var presetExists = existingPresets.some(row => row[0] === newPresetName);
	if (presetExists) {
		var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
		ui.showModalDialog(closingHtml, 'Finished!');
		SpreadsheetApp.getUi().alert('Preset name already exists: ' + newPresetName);
		return;
	}
	var newRow = [newPresetName, ...dropdownCriteriaValues, ...dropdownOrderValues];
	sortPresetsSheet.appendRow(newRow);
	sortPresetsSheet.getRange('A3:AA' + sortPresetsSheet.getLastRow()).sort({
		column: 1,
		ascending: true
	});
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
	SpreadsheetApp.getUi().alert('Preset saved successfully: ' + newPresetName);
}

function countHighLowRatios() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Shelves");
	var shelvesMap = getShelvesMap();
	var columnIndex = shelvesMap["% of Shelf"] + 1;
	var values = sheet.getRange(1, columnIndex, sheet.getLastRow(), 1).getValues();
	var countHigh = 0;
	var totalCount = 0;
	for (var i = 0; i < values.length - 1; i++) {
		if (values[i][0] > values[i + 1][0]) {
			totalCount++;
			if (values[i][0] >= 0.96) {
				countHigh++;
			}
		}
	}
	return totalCount > 0 ? countHigh + "/" + totalCount : "N/A";
}
