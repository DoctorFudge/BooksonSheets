function combinedFunction() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Full Sort Executing');
	Utilities.sleep(10);
	clearDescriptionNotes();
	Utilities.sleep(10);
	sortDatabaseSheet();
	Utilities.sleep(10);
	runApplyPublisherNotes();
	Utilities.sleep(10);
	runAuthorNotes();
	Utilities.sleep(10);
	convertColorAndUpdateSheet();
	Utilities.sleep(10);
	sortWantSheet();
	Utilities.sleep(10);
	createDescriptionNotes();
	Utilities.sleep(10);
	updateShelfSequenceRatio();
	Utilities.sleep(10);
	caseDivider();
	var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	ui.showModalDialog(closingHtml, 'Finished!');
}

function sortDatabaseSheet() {
	var html = HtmlService.createHtmlOutputFromFile('MessageDialog').append('<script>setTimeout(function() { google.script.host.close(); }, 30000);</script>').append('<script>function closeDialog() { google.script.host.close(); }</script>').setTitle('Executing').setWidth(250).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	var ui = SpreadsheetApp.getUi();
	var dialog = ui.showModalDialog(html, 'Sorting the Database');
	const sortCheckError = sortCheck();
	if (sortCheckError) {
		var closingHtml = HtmlService.createHtmlOutput('<script>setTimeout(function() { google.script.host.close(); }, 1);</script>').setWidth(1).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
		ui.showModalDialog(closingHtml, 'Failed!');
		SpreadsheetApp.getUi().alert(sortCheckError);
		return;
	}
	runClearPublisherNotes();
	runClearAuthorNotes();
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var controlPanelSheet = spreadsheet.getSheetByName('Control Panel');
	var databaseSheet = spreadsheet.getSheetByName('Database');
	var sortCriteria = controlPanelSheet.getRange('B1:B13').getValues().flat();
	var sortOrders = controlPanelSheet.getRange('C1:C13').getValues().flat();
	sortCriteria = sortCriteria.filter((criteria, i) => criteria && criteria !== 'None' && sortOrders[i] !== 'None');
	var databaseMap = getDatabaseMap();
	var firstDataRow = 2;
	var lastRow = databaseSheet.getLastRow();
	var dataRange = databaseSheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, databaseSheet.getLastColumn());
	var data = dataRange.getValues();
	data = data.filter(row => row[databaseMap["Title"]] && row[databaseMap["Title"]].trim() !== "");
	data.sort(function(row1, row2) {
		for (var i = 0; i < sortCriteria.length; i++) {
			var result = compareByCriteria(row1, row2, sortCriteria[i], sortOrders[i], databaseMap);
			if (result !== 0) return result;
		}
		return 0;
	});
	dataRange.clearContent();
	databaseSheet.getRange(firstDataRow, 1, data.length, databaseSheet.getLastColumn()).setValues(data);
	if (data.length < lastRow - firstDataRow + 1) {
		databaseSheet.getRange(firstDataRow + data.length, 1, lastRow - firstDataRow + 1 - data.length, databaseSheet.getLastColumn()).clearContent();
	}
}

function sortWantSheet() {
	var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
	var controlPanelSheet = spreadsheet.getSheetByName('Control Panel');
	var wantSheet = spreadsheet.getSheetByName('Want');
	var sortCriteria = controlPanelSheet.getRange('B1:B13').getValues().flat();
	var sortOrders = controlPanelSheet.getRange('C1:C13').getValues().flat();
	sortCriteria = sortCriteria.filter((criteria, i) => criteria && criteria !== 'None' && sortOrders[i] !== 'None');
	var wantMap = getWantMap();
	var firstDataRow = 2;
	var lastRow = wantSheet.getLastRow();
	var dataRange = wantSheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, wantSheet.getLastColumn());
	var data = dataRange.getValues();
	data = data.filter(row => row.some(cell => cell !== "" && cell !== null));
	data.sort(function(row1, row2) {
		for (var i = 0; i < sortCriteria.length; i++) {
			if (sortCriteria[i] === "Favorite" || sortCriteria[i] === "Category" || wantMap.hasOwnProperty(sortCriteria[i])) {
				var result = compareByCriteriaWant(row1, row2, sortCriteria[i], sortOrders[i], wantMap);
				if (result !== 0) return result;
			}
		}
		return 0;
	});
	dataRange = wantSheet.getRange(firstDataRow, 1, data.length, wantSheet.getLastColumn());
	dataRange.setValues(data);
	if (data.length < lastRow - firstDataRow + 1) {
		wantSheet.getRange(firstDataRow + data.length, 1, lastRow - firstDataRow + 1 - data.length, wantSheet.getLastColumn()).clearContent();
	}
	wantSheet.getRange(2, wantMap["AbeBooks"] + 1, wantSheet.getLastRow() - 1).clearContent();
}

function compareByCriteria(row1, row2, criteria, order, dbMap) {
	var isFave1 = row1[dbMap["Favorite"]] === 1;
	var isFave2 = row2[dbMap["Favorite"]] === 1;
	var isOther1 = row1[dbMap["Genre"]] === "Other";
	var isOther2 = row2[dbMap["Genre"]] === "Other";
	if (isOther1 && !isOther2) return 1;
	if (!isOther1 && isOther2) return -1;
	if (isOther1 && isOther2) return 0;
	if (order.endsWith("(Faves)") && criteria !== "Color") {
		if (isFave1 && !isFave2) return -1;
		if (!isFave1 && isFave2) return 1;
		if (isFave1 && isFave2) return 0;
	}
	return compareByCriteriaNormal(row1, row2, criteria, order, dbMap, isFave1, isFave2);
}

function compareByCriteriaNormal(row1, row2, criteria, order, dbMap, isFave1, isFave2) {
	var comparisonResult;
	switch (criteria) {
		case 'ID':
			comparisonResult = row1[dbMap["Author"]].localeCompare(row2[dbMap["Author"]]);
			break;
		case 'Title':
			comparisonResult = compareTitles(row1[dbMap["Title"]], row2[dbMap["Title"]]);
			break;
		case 'Author':
			comparisonResult = row1[dbMap["Author"]].localeCompare(row2[dbMap["Author"]]);
			break;
		case 'Author l-f':
			comparisonResult = row1[dbMap["Author l-f"]].localeCompare(row2[dbMap["Author l-f"]]);
			break;
		case 'Series':
			comparisonResult = compareBySeries(row1, row2, dbMap["Series"]);
			break;
		case 'No. in Series':
			comparisonResult = compareByPosition(row1, row2, dbMap["No. in Series"]);
			break;
		case 'Genre':
			comparisonResult = compareGenres(row1, row2, dbMap["Genre"]);
			break;
		case 'Category':
			comparisonResult = compareByCategory(row1, row2, dbMap['Genre']);
			break;
		case 'Original Publication Date':
			comparisonResult = compareByDate(row1, row2, dbMap["Original Publication Date"]);
			break;
		case 'Publisher':
			comparisonResult = comparePublishers(row1[dbMap["Publisher"]], row2[dbMap["Publisher"]]);
			break;
		case 'Edition Publication Date':
			comparisonResult = compareByDate(row1, row2, dbMap["Edition Publication Date"]);
			break;
		case 'ISBN13':
			comparisonResult = compareByISBN13(row1, row2, dbMap["ISBN13"]);
			break;
		case 'ISBN':
			comparisonResult = compareByISBN(row1, row2, dbMap["ISBN"]);
			break;
		case 'Binding':
			comparisonResult = compareByBinding(row1, row2, dbMap["Binding"]);
			break;
		case 'Thickness':
			comparisonResult = compareByThickness(row1, row2, dbMap["Thickness"]);
			break;
		case 'Height':
			comparisonResult = compareByHeight(row1, row2, dbMap["Height"]);
			break;
		case 'Width':
			comparisonResult = row1[dbMap["Width"]].localeCompare(row2[dbMap["Width"]]);
			break;
		case 'Page Count':
			comparisonResult = compareByPageCount(row1, row2, dbMap["Page Count"]);
			break;
		case 'Acquisition Date':
			comparisonResult = compareByDate(row1, row2, dbMap["Acquisition Date"]);
			break;
		case 'Color':
			comparisonResult = compareByColor(row1, row2, dbMap["Hue"], dbMap["Saturation"], dbMap["Value"], dbMap["Lightness"]);
			break;
		case 'Rating':
			comparisonResult = compareByRating(row1[dbMap["Rating"]], row2[dbMap["Rating"]]);
			break;
		case 'Favorite':
			comparisonResult = compareNumericalOrBoolean(isFave1 ? 1 : 0, isFave2 ? 1 : 0);
			break;
		case 'Comic':
			comparisonResult = compareNumericalOrBoolean(row1[dbMap["Comic"]], row2[dbMap["Comic"]]);
			break;
		case 'Nonfiction':
			comparisonResult = compareNumericalOrBoolean(row1[dbMap["Nonfiction"]], row2[dbMap["Nonfiction"]]);
			break;
		case 'Discworld':
			comparisonResult = compareDiscworldSeries(row1[dbMap["Series"]], row2[dbMap["Series"]]);
			break;
		default:
			comparisonResult = 0;
	}
	return order.startsWith('Descending') ? -comparisonResult : comparisonResult;
}

function compareByCriteriaWant(row1, row2, criteria, order, wantMap) {
	var isFave1 = row1[wantMap["Favorite"]] === 1;
	var isFave2 = row2[wantMap["Favorite"]] === 1;
	var isOther1 = row1[wantMap["Genre"]] === "Other";
	var isOther2 = row2[wantMap["Genre"]] === "Other";
	if (isOther1 && !isOther2) return 1;
	if (!isOther1 && isOther2) return -1;
	if (isOther1 && isOther2) return 0;
	if (order.endsWith("(Faves)") && criteria !== "Color") {
		if (isFave1 && !isFave2) return -1;
		if (!isFave1 && isFave2) return 1;
		if (isFave1 && isFave2) return 0;
	}
	return compareByCriteriaWantNormal(row1, row2, criteria, order, wantMap, isFave1, isFave2);
}

function compareByCriteriaWantNormal(row1, row2, criteria, order, wantMap, isFave1, isFave2) {
	var comparisonResult;
	switch (criteria) {
		case 'Title':
			comparisonResult = compareTitles(row1[wantMap["Title"]], row2[wantMap["Title"]]);
			break;
		case 'Author':
			comparisonResult = row1[wantMap["Author"]].localeCompare(row2[wantMap["Author"]]);
			break;
		case 'Author l-f':
			comparisonResult = row1[wantMap["Author l-f"]].localeCompare(row2[wantMap["Author l-f"]]);
			break;
		case 'Series':
			comparisonResult = compareBySeries(row1, row2, wantMap["Series"]);
			break;
		case 'No. in Series':
			comparisonResult = compareByPosition(row1, row2, wantMap["No. in Series"]);
			break;
		case 'Genre':
			comparisonResult = compareGenres(row1, row2, wantMap["Genre"]);
			break;
		case 'Category':
			comparisonResult = compareByCategory(row1, row2, wantMap['Genre']);
			break;
		case 'Subgenre':
			comparisonResult = row1[wantMap["Subgenre"]].localeCompare(row2[wantMap["Subgenre"]]);
			break;
		case 'Original Publication Date':
			comparisonResult = compareByDate(row1, row2, wantMap["Original Publication Date"]);
			break;
		case 'Favorite':
			comparisonResult = compareNumericalOrBoolean(isFave1 ? 1 : 0, isFave2 ? 1 : 0);
			break;
		case 'Comic':
			comparisonResult = compareNumericalOrBoolean(row1[wantMap["Comic"]], row2[wantMap["Comic"]]);
			break;
		case 'Nonfiction':
			comparisonResult = compareNumericalOrBoolean(row1[wantMap["Nonfiction"]], row2[wantMap["Nonfiction"]]);
			break;
		case 'Discworld':
			comparisonResult = compareDiscworldSeries(row1[wantMap["Series"]], row2[wantMap["Series"]]);
			break;
		default:
			comparisonResult = 0;
	}
	return order.startsWith('Descending') ? -comparisonResult : comparisonResult;
}

function compareNumericalOrBoolean(value1, value2) {
	if (value1 < value2) return -1;
	if (value1 > value2) return 1;
	return 0;
}

function compareTitles(title1, title2) {
	var regex = /^(the |a |an )/i;
	var cleanTitle1 = title1.replace(regex, '');
	var cleanTitle2 = title2.replace(regex, '');
	return cleanTitle1.localeCompare(cleanTitle2);
}

function comparePublishers(publisher1, publisher2) {
	var regex = /^(the |a |an )/i;
	var cleanPublisher1 = publisher1.replace(regex, '');
	var cleanPublisher2 = publisher2.replace(regex, '');
	return cleanPublisher1.localeCompare(cleanPublisher2);
}

function compareBySeries(row1, row2, seriesIndex) {
	const regex = /^(the |a |an )/i;
	let series1 = row1[seriesIndex] === "—" ? "AAAAAAAAA" : row1[seriesIndex].replace(regex, '');
	let series2 = row2[seriesIndex] === "—" ? "AAAAAAAAA" : row2[seriesIndex].replace(regex, '');
	return series1.localeCompare(series2);
}

function compareGenres(row1, row2, genreIndex) {
	var genre1 = getGenre(row1[genreIndex]);
	var genre2 = getGenre(row2[genreIndex]);
	return genre1.localeCompare(genre2);
}

function getGenre(actualGenre) {
	var genreCodes = {
		'Literary Fiction': 'BBB',
		'Historical Fiction': 'CCC',
		'Adventure': 'DDD',
		'Western': 'EEE',
		'Fantasy': 'FFF',
		'Science Fiction': 'GGG',
		'Horror': 'HHH',
		'Thriller': 'III',
		'Mystery': 'JJJ',
		'Crime': 'KKK',
		'Romance': 'LLL',
		'Humor': 'MMM',
		'Poetry': 'NNN',
		'History': 'OOO',
		'Biography': 'PPP',
		'Autobiography': 'QQQ',
		'Science/Nature': 'RRR',
		'Self-Help': 'SSS',
		'Other': 'TTT'
	};
	return genreCodes[actualGenre] || actualGenre;
}

function compareByCategory(row1, row2, genreIndex) {
	var genre1 = row1[genreIndex];
	var genre2 = row2[genreIndex];
	var category1 = getCategoryTier(genre1);
	var category2 = getCategoryTier(genre2);
	return category1.localeCompare(category2);
}

function getCategoryTier(genre) {
	const tierMap = {
		'Literary Fiction': 'AAA',
		'Historical Fiction': 'AAA',
		'Adventure': 'BBB',
		'Western': 'BBB',
		'Fantasy': 'BBB',
		'Science Fiction': 'BBB',
		'Horror': 'BBB',
		'Thriller': 'BBB',
		'Mystery': 'BBB',
		'Crime': 'BBB',
		'Romance': 'BBB',
		'Humor': 'BBB',
		'Poetry': 'CCC',
		'History': 'DDD',
		'Biography': 'DDD',
		'Autobiography': 'DDD',
		'Science/Nature': 'DDD',
		'Self-Help': 'DDD',
		'Other': 'EEE'
	};
	return tierMap[genre] || 'EEE';
}

function compareByDate(row1, row2, columnIndex) {
	var date1 = parseDate(row1[columnIndex]);
	var date2 = parseDate(row2[columnIndex]);
	return date1 - date2;
}

function compareByISBN(row1, row2, isbnIndex) {
	return row1[isbnIndex].toString().localeCompare(row2[isbnIndex].toString());
}

function compareByISBN13(row1, row2, isbn13Index) {
	return row1[isbn13Index].toString().localeCompare(row2[isbn13Index].toString());
}

function compareByBinding(row1, row2, bindIndex) {
	return row1[bindIndex].localeCompare(row2[bindIndex]);
}

function compareByThickness(row1, row2, thickIndex) {
	var thickness1 = roundToNearestFraction(parseFloat(row1[thickIndex]), 16);
	var thickness2 = roundToNearestFraction(parseFloat(row2[thickIndex]), 16);
	return thickness1 - thickness2;
}

function roundToNearestFraction(number, fraction) {
	var nearestFraction = Math.round(number * fraction) / fraction;
	return nearestFraction;
}

function compareByHeight(row1, row2, heightIndex) {
	return row1[heightIndex] - row2[heightIndex];
}

function compareByPageCount(row1, row2, pageIndex) {
	return row1[pageIndex] - row2[pageIndex];
}

function compareByPosition(row1, row2, positionIndex) {
	let position1 = row1[positionIndex] === "∞" ? 999999 : parseInt(row1[positionIndex], 10);
	let position2 = row2[positionIndex] === "∞" ? 999999 : parseInt(row2[positionIndex], 10);
	if (isNaN(position1)) position1 = 0;
	if (isNaN(position2)) position2 = 0;
	return position1 - position2;
}

function compareByColor(row1, row2, hueIndex, satIndex, valIndex, lightIndex) {
	var tier1 = getHueTier(row1[hueIndex], row1[satIndex], row1[valIndex], row1[lightIndex]);
	var tier2 = getHueTier(row2[hueIndex], row2[satIndex], row2[valIndex], row2[lightIndex]);
	if (tier1 !== tier2) {
		return tier1 - tier2;
	}
	return row1[lightIndex] - row2[lightIndex];
}

function getHueTier(hue, saturation, value, lightness) {
	if (saturation <= 15 || value <= 7) {
		return 999;
	}
	if ((hue >= 0 && hue <= 10) || (hue >= 355 && hue <= 360)) {
		return 1;
	}
	var tiers = [
		[11, 20],
		[21, 40],
		[41, 50],
		[51, 60],
		[61, 80],
		[81, 140],
		[141, 169],
		[170, 200],
		[201, 220],
		[221, 240],
		[241, 280],
		[281, 320],
		[321, 330],
		[331, 345],
		[346, 355]
	];
	for (var i = 0; i < tiers.length; i++) {
		if (hue >= tiers[i][0] && hue <= tiers[i][1]) {
			return i + 2;
		}
	}
	return 999;
}

function compareDiscworldSeries(series1, series2) {
	var isDiscworld1 = series1.toLowerCase().includes("discworld");
	var isDiscworld2 = series2.toLowerCase().includes("discworld");
	if (isDiscworld1 && !isDiscworld2) return -1;
	if (!isDiscworld1 && isDiscworld2) return 1;
	return 0;
}

function compareByRating(rating1, rating2) {
	const getNumericRating = (rating) => {
		if (typeof rating === 'number') {
			return rating;
		}
		return 0;
	};
	return getNumericRating(rating1) - getNumericRating(rating2);
}

function sortCheck() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const controlPanelSheet = ss.getSheetByName('Control Panel');
	const databaseSheet = ss.getSheetByName('Database');
	const databaseHeaders = databaseSheet.getDataRange().getValues()[0];
	const sortOptions = controlPanelSheet.getRange('B1:B13').getValues().flat();
	const sortOrders = controlPanelSheet.getRange('C1:C13').getValues().flat();
	let errors = [];
	let allNone = sortOptions.every(option => option === "None");
	if (allNone) {
		errors.push("No sort options selected.");
	}
	let seenOptions = {};
	for (let i = 0; i < sortOptions.length; i++) {
		const option = sortOptions[i];
		const order = sortOrders[i];
		// Check 1: Option corresponds to a header or is "None"
		//if (option !== "None" && option !== "Favorite" && !databaseHeaders.includes(option)) {
		//	errors.push(`Error at Sort Level ${i + 1}: "${option}" does not correspond to any header in Database.`);
		//}
		// Check 2: "None" is not between two non-"None" cells
		if (option === "None" && i > 0 && sortOptions[i - 1] !== "None" && sortOptions.slice(i + 1).some(o => o !== "None")) {
			errors.push(`Error at Sort Level ${i + 1}: Can't have empty sort levels between valid ones.`);
		}
		// Check 3: Contents of B are unique
		if (option !== "None" && seenOptions[option]) {
			errors.push(`Error at Sort Level ${i + 1}: Can't sort by "${option}" twice.`);
		}
		seenOptions[option] = true;
		// Check 4: Corresponding sort order is valid
		if (option !== "None" && !["Ascending", "Descending", "Ascending (Faves)", "Descending (Faves)"].includes(order)) {
			controlPanelSheet.getRange(`C${i + 1}`).setValue("Ascending");
		}
		// Check 5: If B is "None", C is also "None"
		if (option === "None" && order !== "None") {
			controlPanelSheet.getRange(`C${i + 1}`).setValue("None");
		}
	}
	return errors.length > 0 ? errors.join("\n") : null;
}

function caseDivider() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const shelvesSheet = ss.getSheetByName('Shelves');
	const shelvesMap = getShelvesMap();
	const caseColumnIndex = shelvesMap['Case'];
	const shelfColumnIndex = shelvesMap['Shelf'];
	const dataRange = shelvesSheet.getRange(2, 1, shelvesSheet.getLastRow() - 1, shelvesSheet.getLastColumn());
	const data = dataRange.getValues();
	dataRange.setBorder(false, false, false, false, false, false);
	for (let i = 1; i < data.length; i++) {
		const currentCaseValue = data[i][caseColumnIndex];
		const previousCaseValue = data[i - 1][caseColumnIndex];
		const currentShelfValue = data[i][shelfColumnIndex];
		const previousShelfValue = data[i - 1][shelfColumnIndex];
		if (typeof currentCaseValue === 'number' && typeof previousCaseValue === 'number' && currentCaseValue > previousCaseValue) {
			const rowRange = shelvesSheet.getRange(i + 2, 1, 1, data[i].length);
			rowRange.setBorder(true, null, null, null, null, null, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
		}
		if (typeof currentShelfValue === 'number' && typeof previousShelfValue === 'number' && currentShelfValue > previousShelfValue && currentShelfValue !== 1) {
			const rowRange = shelvesSheet.getRange(i + 2, 1, 1, data[i].length);
			rowRange.setBorder(true, null, null, null, null, null, "black", SpreadsheetApp.BorderStyle.SOLID);
		}
	}
}
