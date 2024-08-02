function updateColors() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Beginning Color Update');
	Utilities.sleep(10);
	clearDescriptionNotes();
	Utilities.sleep(10);
	createDescriptionNotes();
	convertColorAndUpdateSheet();
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	Utilities.sleep(10);
	updateShelfSequenceRatio();
	Utilities.sleep(10);
	caseDivider();
	ui.showModalDialog(closingHtml, 'Finished!');
}

function convertColorAndUpdateSheet() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Applying Colors');
	var databaseMap = getDatabaseMap();
	var shelvesMap = getShelvesMap();
	var databaseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Database');
	var shelvesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shelves');
	var startingRowIndex = 2;
	var lastRow = databaseSheet.getLastRow();
	var range = databaseSheet.getRange(startingRowIndex, databaseMap["HTML"] + 1, lastRow - startingRowIndex + 1, 1);
	var hexCodes = range.getValues();
	hexCodes.forEach(function(row, index) {
		var hexCode = row[0];
		var rowIndex = index + startingRowIndex;
		if (hexCode) {
			var rgb = hexToRgb(hexCode);
			var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
			var lightness = calculateLightness(rgb.r, rgb.g, rgb.b);
			updateCellColor(databaseSheet, rowIndex, databaseMap["Red"] + 1, {
				r: rgb.r,
				g: 0,
				b: 0
			});
			updateCellColor(databaseSheet, rowIndex, databaseMap["Green"] + 1, {
				r: 0,
				g: rgb.g,
				b: 0
			});
			updateCellColor(databaseSheet, rowIndex, databaseMap["Blue"] + 1, {
				r: 0,
				g: 0,
				b: rgb.b
			});
			var hueRgb = hsvToRgb(hsv.h, 100, 100);
			var satRgb = hsvToRgb(hsv.h, hsv.s, 100);
			var valRgb = hsvToRgb(0, 0, hsv.v);
			var lightRgb = hsvToRgb(0, 0, lightness);
			updateCellColor(databaseSheet, rowIndex, databaseMap["Hue"] + 1, hueRgb);
			updateCellColor(databaseSheet, rowIndex, databaseMap["Saturation"] + 1, satRgb);
			updateCellColor(databaseSheet, rowIndex, databaseMap["Value"] + 1, valRgb);
			updateCellColor(databaseSheet, rowIndex, databaseMap["Lightness"] + 1, lightRgb);
			databaseSheet.getRange(rowIndex, databaseMap["Lightness"] + 1).setValue(lightness);
			databaseSheet.getRange(rowIndex, databaseMap["Color"] + 1).setBackground(hexCode);
			databaseSheet.getRange(rowIndex, databaseMap["Red"] + 1, 1, 3).setValues([
				[rgb.r, rgb.g, rgb.b]
			]);
			databaseSheet.getRange(rowIndex, databaseMap["Hue"] + 1, 1, 3).setValues([
				[hsv.h, hsv.s, hsv.v]
			]);
			shelvesSheet.getRange(rowIndex, shelvesMap["Color"] + 1).setBackground(hexCode);
		} else {
			clearFormatting(databaseSheet, shelvesSheet, rowIndex, databaseMap["Red"] + 1, databaseMap["Lightness"] + 1, shelvesMap["Color"] + 1);
		}
	});
}

function updateCellColor(sheet, rowIndex, columnIndex, rgb) {
	var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
	var cell = sheet.getRange(rowIndex, columnIndex);
	cell.setBackground(hex);
	var luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
	var textColor = luminance > 0.2 ? '#000000' : '#FFFFFF';
	cell.setFontColor(textColor);
}

function clearFormatting(databaseSheet, shelvesSheet, rowIndex, dbRedIndex, dbLightnessIndex, sColorIndex) {
	var clearColumnCount = dbLightnessIndex - dbRedIndex + 1;
	databaseSheet.getRange(rowIndex, dbRedIndex, 1, clearColumnCount).setBackground(null).setFontColor(null).clearContent();
	shelvesSheet.getRange(rowIndex, sColorIndex).setBackground(null);
}

function hexToRgb(hex) {
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function rgbToHsv(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	var h, s, v = max;
	var d = max - min;
	s = max == 0 ? 0 : d / max;
	if (max == min) {
		h = 0;
	} else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		v: Math.round(v * 100)
	};
}

function calculateLightness(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	return Math.round(((max + min) / 2) * 100);
}

function rgbToHex(r, g, b) {
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function calculateLuminance(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	[r, g, b] = [r, g, b].map(function(c) {
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hsvToRgb(h, s, v) {
	var r, g, b, i, f, p, q, t;
	h = h / 360, s = s / 100, v = v / 100;
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0:
			r = v, g = t, b = p;
			break;
		case 1:
			r = q, g = v, b = p;
			break;
		case 2:
			r = p, g = v, b = t;
			break;
		case 3:
			r = p, g = q, b = v;
			break;
		case 4:
			r = t, g = p, b = v;
			break;
		case 5:
			r = v, g = p, b = q;
			break;
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}
