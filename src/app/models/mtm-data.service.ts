import 'whatwg-fetch';

export class MtmValue {
	id: number;
	name: string;

	constructor(id: number, name: string) {
		this.id = id;
		this.name = name;
	}
}

const MTM_MAP: any = {
	'Code': { key: 'code', name: 'Codice', description: '' },
	'SingleModuleFrame': { key: 'singleModuleFrame', name: '', description: '' },
	'Finish': { key: 'finish', name: 'Finitura', description: '' },
	'ModuleSize': { key: 'moduleSize', name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.' },
	'Mount': { key: 'mount', name: '', description: '' },
	'System': { key: 'system', name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.' },
	'AV': { key: 'audioVideo', name: 'Caratteristiche Audio / Video', description: '' },
	'Keypad': { key: 'keypad', name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza' },
	'Proximity': { key: 'proximity', name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID' },
	'InfoModule': { key: 'infoModule', name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato' },
	'HearingModule': { key: 'hearingModule', name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?' },
	'DigitalDisplay': { key: 'digitalDisplay', name: 'Display Digitale', description: '' },
	'moduliaggiuntivi': { key: 'additionalModules', name: '', description: '' },
	'Buttons': { key: 'buttons', name: 'Pulsanti di chiamata', description: '' },
	'Divided': { key: 'divided', name: '', description: '' },
	'Mounting': { key: 'mounting', name: '', description: '' },
	'FlushRainshield': { key: 'flushRainshield', name: '', description: '' },
	'Frame': { key: 'frame', name: '', description: '' },
	'ElectronicsModule1': { key: 'electronicsModule1', name: '', description: '' },
	'FrontPiece1': { key: 'frontPiece1', name: '', description: '' },
	'ElectronicsModule2': { key: 'electronicsModule2', name: '', description: '' },
	'FrontPiece2': { key: 'frontPiece2', name: '', description: '' },
	'ElectronicsModule3': { key: 'electronicsModule3', name: '', description: '' },
	'FrontPiece3': { key: 'frontPiece3', name: '', description: '' },
	'ElectronicsModule4': { key: 'electronicsModule4', name: '', description: '' },
	'FrontPiece4': { key: 'frontPiece4', name: '', description: '' },
	'CI': { key: 'identifierCode', name: '', description: '' },
	'': { key: 'Description', name: '', description: '' },
	Default: { key: 'key', name: 'name', description: 'description' },
}

export class MtmOption {
	key: string;
	name: string;
	description: string;
	originalName: string;
	values: MtmValue[];
	cache: any;
	count: number;

	constructor(originalName: string = '') {
		const map = MTM_MAP[originalName] || MTM_MAP.Default;
		this.key = map.key;
		this.name = map.name;
		this.description = map.description;
		this.originalName = originalName;
		this.values = [];
		this.cache = {};
		this.count = 0;
	}

	addValue(value: string): number {
		let item = this.cache[value];
		if (this.cache[value] == undefined) {
			item = new MtmValue(++this.count, value);
			this.values.push(item);
		}
		this.cache[value] = item;
		return item.id;
	}

	sort() {
		this.values.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
		// this.values.forEach((x, i) => x.id = i + 1);
	}

}

export default class MtmDataService {

	static options: MtmOption[] = [];

	static fetch(callback: Function) {
		/*
		fetch('data/data.json')
			.then((response) => response.json())
			.then((json) => {
				console.log('json', json);
			});
		*/
		fetch('data/data.csv')
			.then((response) => response.text())
			.then((text: string) => {
				const csv = text.split('\n');
				const cols = MtmDataService.parseCsvArray(csv.shift() || '').map(x => x.trim().replace(/ |\//gm, '')).map(x => new MtmOption(x));
				const rows = csv.map(x => MtmDataService.parseCsvArray(x).map(x => x.trim()));
				// console.log('rows', rows.length, cols, rows[0]);
				const records = rows.map((values: string[]) => values.map((value: string, i: number) => cols[i].addValue(value)));
				cols.forEach(x => x.sort());
				MtmDataService.options = cols;
				// console.log(MtmDataService.options);
			});
	}

	static parseCsvArray(value: string): string[] {
		const isValid: RegExp = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		const matchValues: RegExp = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		// Return NULL if input string is not well formed CSV string.
		if (!isValid.test(value)) return [];
		const a: string[] = [];
		value.replace(matchValues,
			function (m0, m1, m2, m3) {
				// Remove backslash from \' in single quoted values.
				if (m1 !== undefined) {
					a.push(m1.replace(/\\'/g, "'"));
				}
				// Remove backslash from \" in double quoted values.
				else if (m2 !== undefined) {
					a.push(m2.replace(/\\"/g, '"'));
				}
				else if (m3 !== undefined) {
					a.push(m3);
				}
				return '';
			});
		// Handle special case of empty last value.
		if (/,\s*$/.test(value)) a.push('');
		return a;

	}

}
