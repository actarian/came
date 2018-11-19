import 'whatwg-fetch';
import { MtmControlEnum, MtmControls, MtmControlType } from '../controls/constants';
import { MtmControl } from '../controls/control';
import { MtmGrid } from '../controls/grid';
import { MtmGroup } from '../controls/group';
import { MtmList } from '../controls/list';
import { MtmSelect } from '../controls/select';

export default class MtmDataService {

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
		MtmControls.forEach(x => {
			MtmDataService.controlsMap[x.key] = x;
		});
		// MtmDataService.controlsMap[value] = MtmControls.find(x => x.type === value);
		// console.log('MtmControlEnum', MtmControlEnum);
		// console.log('controlsMap', MtmDataService.controlsMap);
		fetch('data/data.csv')
			.then((response) => response.text())
			.then((text: string) => {
				const csv = text.split('\n');
				const cols = MtmDataService.parseCsvArray(csv.shift() || '').map(x => MtmDataService.renameColumn(x.trim())).map(x => MtmDataService.newControlByKey(x));
				const records = csv.map(x => MtmDataService.parseCsvArray(x).map(x => x.trim()));
				const rows = records.map((values: string[]) => values.map((value: string, i: number) => cols[i].addValue(value)).filter(x => x));
				cols.forEach(x => x.sort());
				MtmDataService.cols = cols;
				MtmDataService.rows = rows;
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
			name = 'Description';
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
