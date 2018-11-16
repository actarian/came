import 'whatwg-fetch';
import { MtmControlType, MTM_MAP } from '../controls/consts';
import { MtmControl } from '../controls/control';
import { MtmGrid } from '../controls/grid';
import { MtmGroup } from '../controls/group';
import { MtmList } from '../controls/list';
import { MtmSelect } from '../controls/select';

export default class MtmDataService {

	static cols: MtmControl[] = [];
	static rows: number[][] = [];

	static fetch(callback?: Function, error?: Function) {
		fetch('data/data.csv')
			.then((response) => response.text())
			.then((text: string) => {
				const csv = text.split('\n');
				const cols = MtmDataService.parseCsvArray(csv.shift() || '').map(x => x.trim().replace(/ |\//gm, '')).map(x => MtmDataService.newControlByKey(x));
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

	static newControlByKey(key: string): MtmControl {
		const map = MTM_MAP[key] || MTM_MAP.Default;
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

	static optionWithKey(key: string): MtmControl {
		return MtmDataService.cols.find(x => {
			// console.log(x.key, key);
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
