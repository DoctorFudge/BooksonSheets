const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwulIZ57OTz5m2aJ4irzuE7kJa9-r7-7R1qFujh6ixdPK4uf1JfHmEb1Hy2nMZMwJBJCg/exec';

function openBookshelf() {
	openWebApp();
}

function openBookshop() {
	openWebApp('bookshop');
}

function openWebApp(page) {
	var url = (page === 'bookshop') ? WEB_APP_URL + '?page=bookshop' : WEB_APP_URL;
	var message = (page === 'bookshop') ? 'Setting Up Shop' : 'Putting Up Shelves';
	var html = HtmlService.createHtmlOutput('<script>window.open("' + url + '"); setTimeout(function() { google.script.host.close(); }, 1000);</script>').setWidth(200).setHeight(1).setSandboxMode(HtmlService.SandboxMode.IFRAME);
	SpreadsheetApp.getUi().showModalDialog(html, message);
}

function doGet(e) {
	var page = e.parameter.page;
	if (page === 'bookshop') {
		return HtmlService.createHtmlOutputFromFile('Bookshop').setTitle('Bookshop').addMetaTag('viewport', 'width=device-width, initial-scale=1');
	} else {
		return HtmlService.createHtmlOutputFromFile('Bookshelf').setTitle('Bookshelf').addMetaTag('viewport', 'width=device-width, initial-scale=1');
	}
}

function showBookshelf() {
	var html = HtmlService.createHtmlOutputFromFile('BookshelfDisplay').setWidth(1200).setHeight(600);
	SpreadsheetApp.getUi().showModalDialog(html, 'Bookshelf Display');
}

function getSheetData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheets = {
		shelves: ss.getSheetByName('Shelves'),
		cases: ss.getSheetByName('Cases'),
		database: ss.getSheetByName('Database'),
		controlPanel: ss.getSheetByName('Control Panel'),
		misc: ss.getSheetByName('Misc')
	};
	const maps = {
		shelves: getShelvesMap(),
		database: getDatabaseMap()
	};
	const miscData = sheets.misc.getRange(2, 1, sheets.misc.getLastRow() - 1, 3).getValues().filter(row => row[0] && row[1] && row[2]);
	if (miscData.length === 0) {
		throw new Error('No valid data found in the Misc sheet for columns A-C.');
	}
	const randomMisc = miscData[Math.floor(Math.random() * miscData.length)];
	const getColumnIndexes = (map, columns) => columns.map(header => map[header] + 1);
	const shelvesColumns = getColumnIndexes(maps.shelves, ['Case', 'Shelf', 'Title', 'Author', 'Thickness', 'Height', 'Width']);
	const databaseColumns = getColumnIndexes(maps.database, ['HTML', 'Cover', 'ISBN13', 'ISBN', 'ID', 'Author l-f', 'Page Count', 'Favorite', 'Genre', 'Other Genres', 'Tags', 'Original Publication Date', 'Edition Publication Date']);
	const additionalColumns = ['Orientation', 'Display Space'].map(header => maps.shelves[header] + 1);
	const currentlyReadId = String(sheets.controlPanel.getRange('B16').getValue());
	let defaultScale = Math.max(2, Math.min(100, sheets.controlPanel.getRange('H21').getValue()));
	const actualLength = sheets.shelves.getRange(2, maps.shelves['Title'] + 1, sheets.shelves.getLastRow() - 1, 1).getDisplayValues().map(row => row[0]).findIndex(title => title === "") + 1 || sheets.shelves.getLastRow() - 1;
	const getSheetData = (sheet, columns, length) => columns.map(colIndex => sheet.getRange(2, colIndex, length - 1, 1).getValues().map(row => row[0]));
	const shelvesData = getSheetData(sheets.shelves, shelvesColumns, actualLength);
	const additionalData = getSheetData(sheets.shelves, additionalColumns, actualLength);
	const databaseData = sheets.database.getRange(2, 1, actualLength - 1, sheets.database.getLastColumn()).getDisplayValues();
	const processDatabaseData = (data, index, formatter = val => val || '') => data.map(row => formatter(row[index - 1]));
	const formatGenres = genres => genres.split(',').map(genre => genre.trim());
	const extractYear = dateStr => {
		if (dateStr.includes("BCE")) {
			const match = dateStr.match(/(\d{1,4})\sBCE$/);
			return match ? -parseInt(match[1]) : null;
		} else {
			const match = dateStr.match(/(\d{4})$/);
			return match ? parseInt(match[1]) : null;
		}
	};
	const getCenturySuffix = century => {
		const suffixes = ["th", "st", "nd", "rd"];
		const v = century % 100;
		return (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
	};
	const getDecadeAndCentury = year => {
		if (!year) return [];
		if (year < 0) {
			const decade = `${Math.floor(year / 10) * -10}s BCE`;
			const centuryNumber = Math.ceil(-year / 100);
			const century = `${centuryNumber}${getCenturySuffix(centuryNumber)} Century BCE`;
			return [decade, century];
		} else {
			const decade = `${Math.floor(year / 10) * 10}s`;
			const centuryNumber = Math.floor(year / 100) + 1;
			const century = `${centuryNumber}${getCenturySuffix(centuryNumber)} Century`;
			return [decade, century];
		}
	};
	const processedData = {
		html: processDatabaseData(databaseData, databaseColumns[0], validateHTML),
		cover: processDatabaseData(databaseData, databaseColumns[1], validateCover),
		isbn13: processDatabaseData(databaseData, databaseColumns[2], formatISBN13),
		isbn: processDatabaseData(databaseData, databaseColumns[3], formatISBN),
		id: processDatabaseData(databaseData, databaseColumns[4]),
		spine: maps.database['Spine'] ? processDatabaseData(databaseData, maps.database['Spine'] + 1) : [],
		authorLF: processDatabaseData(databaseData, databaseColumns[5]),
		pageCount: processDatabaseData(databaseData, databaseColumns[6]),
		favorite: processDatabaseData(databaseData, databaseColumns[7], val => (val == 1) ? 1 : 0),
		genre: processDatabaseData(databaseData, databaseColumns[8]),
		otherGenres: processDatabaseData(databaseData, databaseColumns[9], formatGenres),
		tags: processDatabaseData(databaseData, databaseColumns[10], tags => tags.split(',').map(tag => tag.trim())),
		opd: processDatabaseData(databaseData, databaseColumns[11], extractYear).map(getDecadeAndCentury),
		epd: processDatabaseData(databaseData, databaseColumns[12], extractYear).map(getDecadeAndCentury)
	};
	const authorLastNames = processedData.authorLF.map(name => name.split(',')[0].trim());
	const descriptionData = sheets.shelves.getRange(2, maps.shelves['Description'] + 1, actualLength - 1, 1).getValues().map(row => row[0]);
	const combinedShelvesData = shelvesData[0].map((_, i) => {
		let thickness = shelvesData[4][i];
		if (!thickness || thickness == 0) {
			thickness = processedData.pageCount[i] ? (Math.round(processedData.pageCount[i] * 0.00337323502136328 * 10000) / 10000) : 1.1931;
		}
		let height = shelvesData[5][i] || [6.63, 7, 8, 8.25, 8.5, 9, 9.25, 9.75, 10, 10.25, 10.88, 11][Math.floor(Math.random() * 12)];
		const color = processedData.html[i] || '#000000';
		const {
			r,
			g,
			b
		} = hexToRgb(color);
		const luminance = calculateLuminance(r, g, b);
		const textColor = luminance > 0.2 ? '#000000' : '#FFFFFF';
		return [...shelvesData.map((col, index) => (index === 3 ? (col[i] || '—') : (index === 4 ? thickness : (index === 5 ? height : col[i])))),
			processedData.html[i], processedData.cover[i], descriptionData[i], processedData.isbn13[i], processedData.isbn[i], processedData.id[i], ...(maps.database['Spine'] ? [processedData.spine[i]] : []), authorLastNames[i], textColor, additionalData[0][i] || '', parseFloat(additionalData[1][i]) || 0.25,
			processedData.favorite[i], processedData.tags[i], processedData.genre[i], processedData.otherGenres[i], processedData.opd[i], processedData.epd[i]
		];
	});
	const casesData = sheets.cases.getRange(2, 1, sheets.cases.getLastRow() - 1, sheets.cases.getLastColumn()).getValues();
	return {
		shelves: combinedShelvesData,
		cases: casesData,
		currentlyReadId: currentlyReadId,
		dontWorryAboutIt: {
			url: randomMisc[0],
			offset: randomMisc[1],
			backgroundColor: randomMisc[2]
		},
		defaultScale: defaultScale,
		webAppUrl: WEB_APP_URL
	};
}

function getMenuData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const databaseSheet = ss.getSheetByName('Database');
	const databaseMap = getDatabaseMap();
	const indexes = {
		author: databaseMap['Author'] + 1,
		tags: databaseMap['Tags'] + 1,
		genre: databaseMap['Genre'] + 1,
		otherGenres: databaseMap['Other Genres'] + 1,
		opd: databaseMap['Original Publication Date'] + 1,
		epd: databaseMap['Edition Publication Date'] + 1
	};
	const getColumnData = (index) => databaseSheet.getRange(2, index, databaseSheet.getLastRow() - 1, 1).getDisplayValues().flat();
	const uniqueReducer = (uniqueItems, item) => {
		if (!uniqueItems.includes(item)) uniqueItems.push(item);
		return uniqueItems;
	};
	const authors = getColumnData(indexes.author).filter(author => author && author.trim() !== '—').flatMap(author => author.split(' and ').map(a => a.trim())).reduce(uniqueReducer, []);
	const tags = getColumnData(indexes.tags).filter(tag => tag).flatMap(tag => tag.split(',').map(t => t.trim())).reduce(uniqueReducer, []);
	const genres = getColumnData(indexes.genre).filter(genre => genre).reduce(uniqueReducer, []);
	const otherGenres = getColumnData(indexes.otherGenres).filter(otherGenre => otherGenre).flatMap(otherGenre => otherGenre.split(',').map(og => og.trim())).reduce(uniqueReducer, []);
	const combinedGenres = [...genres];
	otherGenres.forEach(otherGenre => {
		if (!genres.includes(otherGenre)) combinedGenres.push(otherGenre + '*');
	});
	const extractYear = dateStr => {
		if (dateStr.includes("BCE")) {
			const match = dateStr.match(/(\d{1,4})\sBCE$/);
			return match ? -parseInt(match[1]) : null;
		} else {
			const match = dateStr.match(/(\d{4})$/);
			return match ? parseInt(match[1]) : null;
		}
	};
	const getCenturySuffix = century => {
		const suffixes = ["th", "st", "nd", "rd"];
		const v = century % 100;
		return (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
	};
	const getDecadeAndCentury = year => {
		if (!year) return [];
		if (year < 0) {
			const decade = `${Math.ceil(year / 10) * -10}s BCE`;
			const centuryNumber = Math.ceil(-year / 100);
			const century = `${centuryNumber}${getCenturySuffix(centuryNumber)} Century BCE`;
			return [decade, century];
		} else {
			const decade = `${Math.floor(year / 10) * 10}s`;
			const centuryNumber = Math.floor(year / 100) + 1;
			const century = `${centuryNumber}${getCenturySuffix(centuryNumber)} Century`;
			return [decade, century];
		}
	};
	const opdData = getColumnData(indexes.opd).map(extractYear).map(getDecadeAndCentury).flat().reduce(uniqueReducer, []);
	const epdData = getColumnData(indexes.epd).map(extractYear).map(getDecadeAndCentury).flat().reduce(uniqueReducer, []);
	const combinedDates = [...new Set([...opdData, ...epdData])];
	combinedDates.sort((a, b) => {
		const transform = (date) => {
			if (date.includes('Century')) {
				const centuryNumber = parseInt(date.match(/\d+/)[0]);
				return date.includes('BCE') ? `${-centuryNumber * 100} ${date}` : `${centuryNumber * 100} ${date}`;
			} else {
				const year = parseInt(date.match(/\d+/)[0]);
				return date.includes('BCE') ? `${-year} ${date}` : `${year} ${date}`;
			}
		};
		const transformedA = transform(a);
		const transformedB = transform(b);
		return transformedA.localeCompare(transformedB);
	});
	return {
		authors,
		tags,
		genres: combinedGenres,
		dates: combinedDates
	};
}

function formatISBN13(isbn13) {
	return typeof isbn13 === 'string' ? isbn13.padStart(13, '0') : String(isbn13).padStart(13, '0');
}

function formatISBN(isbn) {
	return typeof isbn === 'string' ? isbn.padStart(10, '0') : String(isbn).padStart(10, '0');
}

function validateHTML(html) {
	if (!html || !/^#([0-9A-F]{3}){1,2}$/i.test(html)) {
		return '#000000';
	}
	return html.startsWith('#') ? html : `#${html}`;
}

function validateCover(cover) {
	const defaultCover = 'https://lh3.googleusercontent.com/d/1oNb-F3oDqVyZJwdd6r79p8iO4tKh1G_I';
	const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+)([\/\w.-]*)*\/?$/;
	if (cover && urlPattern.test(cover)) {
		return cover;
	} else {
		return defaultCover;
	}
}

function logFirstBook() {
	const data = getSheetData();
	if (data.shelves && data.shelves.length > 0) {
		Logger.log('First Book Data: ' + JSON.stringify(data.shelves[0]));
	} else {
		Logger.log('No book data found.');
	}
}

function getWantData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const wantSheet = ss.getSheetByName('Want');
	const wantMap = getWantMap();
	const lastRow = wantSheet.getLastRow();
	const titleColumnIndex = wantMap['Title'] + 1;
	const titles = wantSheet.getRange(2, titleColumnIndex, lastRow - 1, 1).getDisplayValues().map(row => row[0]);
	const actualLastRow = titles.findIndex(title => title === "") + 1 || titles.length;
	const columns = ['Title', 'Author', 'Description', 'Genre', 'Original Publication Date', 'AbeBooks', 'Author l-f'].map(header => wantMap[header] + 1);
	const data = columns.map(colIndex => wantSheet.getRange(2, colIndex, actualLastRow - 1, 1).getDisplayValues().map(row => row[0]));
	const authorLastNames = data[6].map(name => name.split(',')[0].trim());
	const genres = data[3];
	const colors = genres.map(genre => getRandomColorForGenre(genre));
	const heights = [69, 80, 85, 90, 103];
	const wantData = data[0].map((_, i) => [
		data[0][i],
		data[1][i],
		data[2][i],
		data[3][i],
		data[4][i],
		data[5][i],
		authorLastNames[i],
		colors[i].color,
		colors[i].textColor,
		heights[Math.floor(Math.random() * heights.length)]
	]).filter(row => row[0]);
	return {
		want: wantData,
		webAppUrl: WEB_APP_URL
	};
}

function getRandomColorForGenre(genre) {
	const genreColors = {
		'Literary Fiction': '#6379a0',
		'Historical Fiction': '#a08970',
		'Adventure': '#35634a',
		'Western': '#baa892',
		'Fantasy': '#bba0e3',
		'Science Fiction': '#85dadd',
		'Horror': '#9e6363',
		'Thriller': '#778899',
		'Mystery': '#8674a9',
		'Crime': '#a05252',
		'Romance': '#ffdde0',
		'Humor': '#fff9c4',
		'Poetry': '#afc9e9',
		'History': '#8a977d',
		'Biography/Autobiography': '#7a9ad1',
		'Science/Nature': '#a17a5a',
		'Self-Help': '#b8e2b8',
		'Other': '#b8e2b8'
	};
	const baseColor = genreColors[genre] || '#b8e2b8';
	const {
		r,
		g,
		b
	} = hexToRgb(baseColor);
	const {
		h,
		s,
		v
	} = rgbToHsv(r, g, b);
	const newS = Math.max(0, Math.min(100, s + (Math.random() * 20 - 10)));
	const newV = Math.max(0, Math.min(100, v + (Math.random() * 20 - 10)));
	const {
		r: newR,
		g: newG,
		b: newB
	} = hsvToRgb(h, newS, newV);
	const randomColor = rgbToHex(newR, newG, newB);
	const luminance = calculateLuminance(newR, newG, newB);
	const textColor = luminance > 0.2 ? '#000000' : '#FFFFFF';
	return {
		color: randomColor,
		textColor: textColor
	};
}

function getWallArtData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const miscSheet = ss.getSheetByName('Misc');
	const lastRow = miscSheet.getLastRow();
	const dataRange = miscSheet.getRange(2, 5, lastRow - 1, 5).getValues();
	const wallArtData = dataRange.map(row => ({
		name: row[0],
		url: row[1],
		frame: row[2],
		height: row[3] * 10,
		width: row[4] * 10
	}));
	return wallArtData;
}

function getSimpleData() {
	return {
		message: "Hello, World!"
	};
}
