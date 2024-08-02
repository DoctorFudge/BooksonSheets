function onOpen() {
	var ui = SpreadsheetApp.getUi();
	ui.createMenu('De Libris').addItem('Open Sidebar', 'showSidebar').addItem('Show Bookshelf', 'openBookshelf').addItem('Show Bookshop', 'openBookshop').addToUi();
}

function onSheetChange(e) {
	if (e.changeType === 'OTHER') {
		var sourceSheet = e.source.getActiveSheet();
		if (sourceSheet.getName() === 'Shelves' || sourceSheet.getName() === 'Database') {
			updateShelfSequenceRatio();
		}
	}
}

function triggerAuthorization() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("How to Use This Sheet (DeleteMe)");
	if (sheet) {
		sheet.getRange("A4").clearContent().setValue("by PresidentoftheSun/DoctorFudge");
	}
}
