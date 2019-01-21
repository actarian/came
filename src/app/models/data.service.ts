import 'whatwg-fetch';
import { MtmControlEnum, MtmControls, MtmControlType } from '../controls/constants';
import { MtmControl } from '../controls/control';
import { MtmGrid } from '../controls/grid';
import { MtmGroup } from '../controls/group';
import { MtmList } from '../controls/list';
import { MtmSelect } from '../controls/select';

export class MtmPart {
	code: string;
	id: number;
	image: string;
	longDescription: string;
	name: string;
	price: number;
	shortDescription: string;
	type: string;
}

export class MtmKit {
	code?: string;
	digi?: string;
	buttonType?: string;
	singleModuleFrame?: string;
	finish?: string;
	moduleSize?: number;
	mount?: string;
	system?: string;
	AV?: string;
	keypad?: string;
	proximity?: string;
	infoModule?: string;
	hearingModule?: string;
	digitalDisplay?: string;
	additionalModules?: string;
	buttons?: number;
	divided?: string;
	mounting?: number;
	flushRainshield?: number;
	frame?: number;
	electronicsModule1?: number;
	frontPiece1?: number;
	electronicsModule2?: number;
	frontPiece2?: number;
	electronicsModule3?: number;
	frontPiece3?: number;
	electronicsModule4?: number;
	frontPiece4?: number;
	ci?: string;
	description?: string;
	price?: number;
}

export class MtmResult {
	/*
	AV: "Audio"
	apartmentNumber: null
	buttons: "1"
	callButtons: null
	code: "MTMVR1S/S2A/1"
	constrainedDimension: null
	digitalDisplay: "-"
	divided: "-"
	electronicsModule1: "100"
	electronicsModule2: "-"
	electronicsModule3: "-"
	electronicsModule4: "-"
	finish: "Zamak VR"
	flushRainshield: "-"
	frame: "120"
	frontPiece1: "142"
	frontPiece2: "-"
	frontPiece3: "-"
	frontPiece4: "-"
	hearingModule: "No"
	infoModule: "No"
	keypad: "No"
	knownTecnology: null
	moduleSize: "1"
	mount: "Surface mount"
	mounting: "163"
	none: null
	price: "397"
	proximity: "No"
	system: "System 200"
	*/
}

export default class MtmDataService {

	static controls: any;
	static kits: MtmKit[] = [];
	static parts: MtmPart[] = [];
	static cols: MtmControl[] = [];
	static rows: number[][] = [];
	static map: { [key: string]: keyof typeof MtmControlEnum } = {}; //: Map<string, string> = {};
	static controlsMap: { [key: string]: any } = {};
	static fetch(callback?: Function, error?: Function) {
		Object.keys(MtmControlEnum).forEach((k: string) => {
			const key = k as keyof typeof MtmControlEnum;
			const value = MtmControlEnum[key] as string;
			MtmDataService.map[value] = key;
		});

		// MtmDataService.controlsMap[value] = MtmDataService.controls.find(x => x.type === value);
		// console.log('MtmControlEnum', MtmControlEnum);
		// console.log('controlsMap', MtmDataService.controlsMap);
		return MtmDataService.fetchJson(callback, error);
		// return MtmDataService.fetchCsv(callback, error);
	}

	static fetchJson(callback?: Function, error?: Function) {
		const bp: any = {};
		return Promise.all(
			// ['https://came.yetnot.it/came_configurator/export/kits_list', 'https://came.yetnot.it/came_configurator/export/parts'].map((x, index) => fetch(x)
			['data/kits.json', 'data/parts.json', 'data/localizations.json'].map((x, index) => fetch(x)
				.then((response) => response.json())
				.then((data) => {
					if (index === 0) {
						data = data.map((x: any) => {
							if (x.code.indexOf('DIGI2D') !== -1) {
								x.digi = 'DIGI2D';
							} else if (x.code.indexOf('DIGI1') !== -1) {
								x.digi = 'DIGI1';
							} else if (x.code.indexOf('DIGI') !== -1) {
								x.digi = 'DIGI';
							} else {
								x.digi = null;
							}
							if (x.digi) {
								x.buttons = 48;
								x.buttonType = x.digi;
							} else if (isNaN(parseInt(x.buttons))) {
								x.buttons = null;
								x.buttonType = null;
								console.log('error', x);
							} else {
								x.buttons = parseInt(x.buttons);
								x.buttonType = (x.buttons ? x.buttons : '') + (x.divided ? x.divided : '');
							}
							if (!bp[x.buttons]) {
								console.log(x.buttons);
								bp[x.buttons] = true;
							}
							x.electronicsModule1 = x.electronicsModule1 ? parseInt(x.electronicsModule1) : null;
							x.electronicsModule2 = x.electronicsModule2 ? parseInt(x.electronicsModule2) : null;
							x.electronicsModule3 = x.electronicsModule3 ? parseInt(x.electronicsModule3) : null;
							x.electronicsModule4 = x.electronicsModule4 ? parseInt(x.electronicsModule4) : null;
							x.frontPiece1 = x.frontPiece1 ? parseInt(x.frontPiece1) : null;
							x.frontPiece2 = x.frontPiece2 ? parseInt(x.frontPiece2) : null;
							x.frontPiece3 = x.frontPiece3 ? parseInt(x.frontPiece3) : null;
							x.frontPiece4 = x.frontPiece4 ? parseInt(x.frontPiece4) : null;
							x.frame = parseInt(x.frame);
							x.mounting = parseInt(x.mounting);
							x.moduleSize = parseInt(x.moduleSize);
							x.flushRainshield = x.flushRainshield ? parseInt(x.flushRainshield) : null;
							return x;
						}).filter((x: MtmKit) => x.buttons);
					} else if (index === 1) {
						data = data.rows.map((x: any) => {
							x.id = parseInt(x.nid);
							x.price = parseFloat(x.price);
							delete x.nid;
							return x;
						});
					} else if (index === 2) {
						MtmDataService.controls = MtmControls.withLocale(data);
						MtmDataService.controls.filter((x: any) => !x.disabled).forEach((x: any) => {
							MtmDataService.controlsMap[x.key] = x;
						});
					}
					return data;
				})))
			.then(all => {
				const parts = all[1];
				const partsPool: any = {};
				parts.forEach((x: MtmPart) => {
					partsPool[x.id] = x;
				});
				const partsKeys = ['electronicsModule1', 'electronicsModule2', 'electronicsModule3', 'electronicsModule4',
					'frontPiece1', 'frontPiece2', 'frontPiece3', 'frontPiece4',
					'frame', 'mounting', 'flushRainshield'];
				const keysPool: any = {};
				const kits = all[0].map((x: any) => {
					let price = 0;
					partsKeys.forEach((key: string) => {
						if (x.hasOwnProperty(key)) {
							const part: MtmPart = partsPool[x[key]];
							if (part) {
								price += part.price;
								const name: string = key.replace(/\d/, '');
								part.type = name;
								const codes = keysPool[name] = keysPool[name] || [];
								if (codes.indexOf(part.code) === -1) {
									codes.push(part.code);
								}
							}
						}
					});
					/*
					if (x.electronicsModule1) {
						price += partsPool[x.electronicsModule1].price;
						electronicModules[x.electronicsModule1] = partsPool[x.electronicsModule1].code;
					}
					if (x.electronicsModule2) {
						price += partsPool[x.electronicsModule2].price;
						electronicModules[x.electronicsModule2] = partsPool[x.electronicsModule2].code;
					}
					if (x.electronicsModule3) {
						price += partsPool[x.electronicsModule3].price;
						electronicModules[x.electronicsModule3] = partsPool[x.electronicsModule3].code;
					}
					if (x.electronicsModule4) {
						price += partsPool[x.electronicsModule4].price;
						electronicModules[x.electronicsModule4] = partsPool[x.electronicsModule4].code;
					}
					if (x.frontPiece1) {
						price += partsPool[x.frontPiece1].price;
						frontPieces[x.frontPiece1] = partsPool[x.frontPiece1].code;
					}
					if (x.frontPiece2) {
						price += partsPool[x.frontPiece2].price;
						frontPieces[x.frontPiece2] = partsPool[x.frontPiece2].code;
					}
					if (x.frontPiece3) {
						price += partsPool[x.frontPiece3].price;
						frontPieces[x.frontPiece3] = partsPool[x.frontPiece3].code;
					}
					if (x.frontPiece4) {
						price += partsPool[x.frontPiece4].price;
						frontPieces[x.frontPiece4] = partsPool[x.frontPiece4].code;
					}
					if (x.frame) {
						price += partsPool[x.frame].price;
						frames[x.frame] = partsPool[x.frame].code;
					}
					if (x.mounting) {
						price += partsPool[x.mounting].price;
						mountings[x.mounting] = partsPool[x.mounting].code;
					}
					if (x.flushRainshield) {
						price += partsPool[x.flushRainshield].price;
						rainshields[x.flushRainshield] = partsPool[x.flushRainshield].code;
					}
					*/
					x.price = price;
					return x;
				});
				Object.keys(keysPool).forEach((key: string) => {
					keysPool[key].sort();
				});
				console.log(JSON.stringify(keysPool));
				kits.sort((a: MtmKit, b: MtmKit) => {
					return a.price - b.price;
				});
				// console.log(JSON.stringify(kits));
				const values = MtmDataService.controls.filter((x: any) => !x.disabled).map((x: any) => x.key);
				const cols: MtmControl[] = values.map((x: string) => MtmDataService.newControlByKey(x));
				const colsPool: any = {};
				cols.forEach((x: MtmControl) => colsPool[x.key] = x);
				const rows = kits.map((x: any) => values.filter((key: string) => colsPool[key]).map((key: string) => {
					const col = colsPool[key];
					return col.addValue(x[key], x.price);
				}));
				cols.forEach((x, i) => x.sort(i));
				MtmDataService.kits = kits;
				MtmDataService.parts = parts;
				MtmDataService.cols = cols;
				MtmDataService.rows = rows;
				console.log(MtmDataService.optionWithKey(MtmControlEnum.ButtonType));
				/*
				console.log('kit0', kits[0]);
				console.log('part0', parts[0])
				console.log('row0', rows[0]);
				*/
				if (typeof callback === 'function') {
					callback(cols, rows);
				}
			});
	}

	static fetchCsv(callback?: Function, error?: Function) {
		fetch('data/data.csv')
			.then((response) => response.text())
			.then((text: string) => {
				const csv = text.split('\n');
				const cols = MtmDataService.parseCsvArray(csv.shift() || '').map(x => MtmDataService.renameColumn(x.trim())).map(x => MtmDataService.newControlByKey(x));
				const records = csv.map(x => MtmDataService.parseCsvArray(x).map(x => x.trim()));
				const rows = records.map((values: string[]) => values.map((value: string, i: number) => cols[i].addValue(value, 0)).filter(x => x));
				cols.forEach((x, i) => x.sort(i));
				MtmDataService.cols = cols;
				MtmDataService.rows = rows;
				// console.log(cols[0], rows[0]);
				if (typeof callback === 'function') {
					callback(cols, rows);
				}
			}).catch((reason: any) => {
				if (typeof error === 'function') {
					error(reason);
				}
			});
	}

	static renameColumn(name: string): MtmControlEnum {
		if (name === '') {
			name = 'description';
		}
		return name as MtmControlEnum; // MtmDataService.map[name];
		// return name.replace(/ |\//gm, '');
	}

	static newControlByKey(key: string): MtmControl {
		const map = MtmDataService.controlsMap[key] || MtmDataService.controlsMap.Default;
		// console.log('newControlByKey', key);
		let control: MtmControl;
		switch (map.type) {
			case MtmControlType.Select:
				control = new MtmSelect(map);
				break;
			case MtmControlType.Group:
				control = new MtmGroup(map);
				break;
			case MtmControlType.List:
				control = new MtmList(map);
				break;
			case MtmControlType.Grid:
				control = new MtmGrid(map);
				break;
			default:
				control = new MtmControl(map);
		}
		return control;
	}

	static optionWithKey(key: MtmControlEnum): MtmControl {
		return MtmDataService.cols.find(x => {
			return x.key === key;
		});
	}

	static parseCsvArray(value: string): string[] {
		const isValid: RegExp = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		const matchValues: RegExp = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		if (!isValid.test(value)) {
			return [];
		}
		const a: string[] = [];
		value.replace(matchValues,
			function (m0, m1, m2, m3) {
				if (m1 !== undefined) {
					a.push(m1.replace(/\\'/g, `'`));
				} else if (m2 !== undefined) {
					a.push(m2.replace(/\\"/g, `"`));
				} else if (m3 !== undefined) {
					a.push(m3);
				}
				return '';
			});
		if (/,\s*$/.test(value)) {
			a.push('');
		}
		return a;
	}

}
