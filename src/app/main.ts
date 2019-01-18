import { MtmControlEnum } from "./controls/constants";
import { MtmControl } from "./controls/control";
import { MtmValue } from "./controls/value";
import MtmDataService from "./models/data.service";
import Dom from "./utils/dom";

export default class MtmConfigurator {

	element: HTMLElement;
	options: MtmControl[];
	cols: MtmControl[] = [];
	rows: number[][] = [];
	filteredRows: any[] = [];
	row: number[] = null;
	currentKey: MtmControlEnum = MtmControlEnum.ApartmentNumber;

	constructor(selector: string) {
		this.element = document.querySelector(selector) as HTMLElement;
		this.addMediaScrollListener();
		this.addRecapScrollListener();
		MtmDataService.fetch((cols: MtmControl[], rows: number[][]) => {
			this.cols = cols;
			this.rows = rows;
			let options = [
				MtmDataService.newControlByKey(MtmControlEnum.KnownTecnology),
				MtmDataService.newControlByKey(MtmControlEnum.ConstrainedDimension),
				MtmDataService.newControlByKey(MtmControlEnum.ApartmentNumber),
				MtmDataService.newControlByKey(MtmControlEnum.CallButtons),
				MtmDataService.optionWithKey(MtmControlEnum.AudioVideo),
				MtmDataService.optionWithKey(MtmControlEnum.Keypad),
				MtmDataService.optionWithKey(MtmControlEnum.Proximity),
				MtmDataService.optionWithKey(MtmControlEnum.DigitalDisplay),
				MtmDataService.optionWithKey(MtmControlEnum.InfoModule),
				MtmDataService.optionWithKey(MtmControlEnum.HearingModule),
				MtmDataService.optionWithKey(MtmControlEnum.Finish),
				MtmDataService.optionWithKey(MtmControlEnum.Mount),
				MtmDataService.optionWithKey(MtmControlEnum.System),
				MtmDataService.optionWithKey(MtmControlEnum.ModuleSize),
			];
			options.forEach(x => x.didChange = (item: MtmValue, control: MtmControl) => {
				// console.log('MtmConfigurator.didChange', control.key, item);
				switch (control.key) {
					case MtmControlEnum.KnownTecnology:
					case MtmControlEnum.ConstrainedDimension:
						this.doReorder();
						this.onSearch(this.didSelectCallButton());
						break;
					case MtmControlEnum.ApartmentNumber:
						this.onSearch(this.didSelectCallButton());
						break;
					case MtmControlEnum.CallButtons:
						this.onSearch(this.didSelectCallButton());
						break;
					default:
						this.onSearch(control.key);
				}
			});
			this.options = options;
			this.render();
			this.onSearch(this.didSelectCallButton());
			this.element.querySelector('.media>.picture').addEventListener('click', () => {
				this.toggleResults();
			});
		}, (error: any) => {
			console.log('error', error);

		});
	}

	didSelectCallButton(): MtmControlEnum {
		let key: MtmControlEnum;
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		if (callButtons.selected) {
			const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
			const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
			const keypad = MtmDataService.optionWithKey(MtmControlEnum.Keypad);
			const keypadValue = keypad.values.find(x => x.name === 'Digital Keypad');
			const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
			const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
			let apartmentNumberValue = apartmentNumber.selected.value;
			if (callButtons.selected.id === 2) {
				apartmentNumberValue = Math.ceil(apartmentNumberValue / 2) * 2;
			}
			const firstValue = buttons.values.find(v => v.value >= apartmentNumberValue);
			if (!firstValue && callButtons.selected.id < 3) {
				callButtons.onSelect(callButtons.values.find(x => x.id == 3), true);
			}
			// console.log('firstValue', firstValue);
			switch (callButtons.selected.id) {
				case 1:
					// pulsante singolo
					buttons.onSelect(firstValue);
					divided.onSelect(divided.values.find(x => x.id === 1));
					keypad.onSelect(null);
					digi.onSelect(null);
					key = MtmControlEnum.Buttons;
					break;
				case 2:
					// pulsante doppio
					buttons.onSelect(firstValue);
					divided.onSelect(divided.values.find(x => x.id === 2));
					keypad.onSelect(null);
					digi.onSelect(null);
					key = MtmControlEnum.Divided;
					break;
				case 3:
					// digital keypad
					buttons.onSelect(null);
					divided.onSelect(divided.values.find(x => x.id === 1));
					keypad.onSelect(keypadValue);
					digi.onSelect(digi.values.find(x => x.name === 'DIGI'));
					key = MtmControlEnum.Keypad;
					break;
				case 4:
					// digital keypad + DIGI 1
					buttons.onSelect(null);
					divided.onSelect(divided.values.find(x => x.id === 1));
					keypad.onSelect(keypadValue);
					digi.onSelect(digi.values.find(x => x.name === 'DIGI1'));
					key = MtmControlEnum.Digi;
					break;
				case 5:
					// digital keypad + DIGI 2
					buttons.onSelect(null);
					divided.onSelect(divided.values.find(x => x.id === 2));
					keypad.onSelect(keypadValue);
					digi.onSelect(digi.values.find(x => x.name === 'DIGI2D'));
					key = MtmControlEnum.Digi;
					break;
			}
			console.log(
				'apartmentNumber', apartmentNumberValue,
				'buttons', buttons.selected.id,
				'divided', divided.selected.id,
				'keypad', keypad.selected.id,
				'digi', digi.selected.id
			);
		}
		return key;
	}

	doReorder() {
		const controls = [];
		const knownTecnology = this.options.find(x => x.key === MtmControlEnum.KnownTecnology);
		const system = this.options.find(x => x.key === MtmControlEnum.System);
		const constrainedDimension = this.options.find(x => x.key === MtmControlEnum.ConstrainedDimension);
		const moduleSize = this.options.find(x => x.key === MtmControlEnum.ModuleSize);
		controls.push(knownTecnology.element);
		if (knownTecnology.currentItem.id === 2) {
			controls.push(system.element);
		}
		controls.push(constrainedDimension.element);
		if (constrainedDimension.currentItem.id === 2) {
			controls.push(moduleSize.element);
		}
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		const audioVideo = this.options.find(x => x.key === MtmControlEnum.AudioVideo);
		const keypad = this.options.find(x => x.key === MtmControlEnum.Keypad);
		const proximity = this.options.find(x => x.key === MtmControlEnum.Proximity);
		const digitalDisplay = this.options.find(x => x.key === MtmControlEnum.DigitalDisplay);
		const infoModule = this.options.find(x => x.key === MtmControlEnum.InfoModule);
		const hearingModule = this.options.find(x => x.key === MtmControlEnum.HearingModule);
		const finish = this.options.find(x => x.key === MtmControlEnum.Finish);
		const mount = this.options.find(x => x.key === MtmControlEnum.Mount);
		controls.push(apartmentNumber.element);
		controls.push(callButtons.element);
		controls.push(audioVideo.element);
		controls.push(keypad.element);
		controls.push(proximity.element);
		controls.push(digitalDisplay.element);
		controls.push(infoModule.element);
		controls.push(hearingModule.element);
		controls.push(finish.element);
		controls.push(mount.element);
		if (knownTecnology.currentItem.id === 1) {
			controls.push(system.element);
		}
		if (constrainedDimension.currentItem.id === 1) {
			controls.push(moduleSize.element);
		}
		// const controls = this.options.map(x => x.element);
		// controls.unshift(controls.pop());
		this.options.map(x => x.element).forEach(x => {
			if (x.parentNode) {
				x.parentNode.removeChild(x);
			}
		})
		const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
		controls.forEach(x => outlet.appendChild(x));
		// console.log('doReorder');
	}

	getRows(key?: MtmControlEnum) {
		this.currentKey = key;
		const knownTecnology = this.options.find(x => x.key === MtmControlEnum.KnownTecnology);
		const constrainedDimension = this.options.find(x => x.key === MtmControlEnum.ConstrainedDimension);
		const controls = this.options.map(x => {
			const index = this.cols.indexOf(x);
			if (index !== -1 && x.key !== key) {
				switch (x.key) {
					case MtmControlEnum.System:
						x.lazy = knownTecnology.selected.id !== 2;
						break;
					case MtmControlEnum.ModuleSize:
						x.lazy = constrainedDimension.selected.id !== 2;
						break;
				}
				return x;
			} else {
				return { index };
			}
		}).filter(x => x.index !== -1).map(x => x as MtmControl).filter(x => x.selected && x.selected.id !== -1);
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		if (buttons.selected.id !== -1) {
			// console.log(buttons.index);
			// console.log('onSearch', buttons.selected.id);
			controls.unshift(buttons);
		}
		const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
		if (divided.selected.id !== -1) {
			// console.log('onSearch', divided.selected.id);
			controls.unshift(divided);
		}
		const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
		if (digi.selected.id !== -1) {
			// console.log('onSearch', digi.selected.id);
			controls.unshift(digi);
		}
		if (key) {
			// force clicked item
			controls.unshift(MtmDataService.optionWithKey(key));
		}
		let filteredRows = this.rows.filter(x => {
			return controls.reduce((has, c) => {
				if (c.lazy && c.key !== key) {
					return has;
				} else {
					return has && x[c.index] === c.selected.id;
				}
			}, true);
		});
		const lazyControls = controls.filter(c => c.lazy);
		// console.log(controls.filter(c => c.lazy).map(x => x.key + ':' + x.selected.id));
		lazyControls.forEach(c => {
			const strictRows = filteredRows.filter(x => x[c.index] === c.selected.id);
			/*
			if (c.key === MtmControlEnum.Buttons) {
				filteredRows.forEach(x => {
					console.log(c.key, c.selected.id, x[c.index]);
				});
			}
			*/
			if (strictRows.length) {
				filteredRows = strictRows;
			}
		});
		return filteredRows;
	}

	onSearch(key?: MtmControlEnum) {
		const filteredRows = this.getRows(key);
		// console.log(filteredRows.length);
		if (filteredRows.length > 0) {
			const row = filteredRows[0];
			this.setRow(row);
		}
		Dom.log('results', filteredRows.length);
		this.filteredRows = filteredRows;
	}

	toggleResults() {
		const filteredRows = this.filteredRows;
		if (filteredRows.length > 1) {
			const index = (filteredRows.indexOf(this.row) + 1) % filteredRows.length;
			this.setRow(filteredRows[index]);
		}
	}

	calcOptions(row: number[]) {
		const prices = MtmDataService.optionWithKey(MtmControlEnum.Price);
		const controls = [
			// MtmControlEnum.CallButtons,
			MtmControlEnum.AudioVideo,
			MtmControlEnum.Proximity,
			MtmControlEnum.DigitalDisplay,
			MtmControlEnum.InfoModule,
			MtmControlEnum.HearingModule,
			MtmControlEnum.Finish,
			MtmControlEnum.Mounting,
			MtmControlEnum.System,
			MtmControlEnum.ModuleSize,
		].map(key => MtmDataService.optionWithKey(key));
		const currentControl = MtmDataService.optionWithKey(this.currentKey);
		if (controls.indexOf(currentControl) > 0) {
			controls.splice(controls.indexOf(currentControl), 1);
			controls.unshift(currentControl);
		}
		controls.forEach(control => {
			const query = row.slice();
			let minimumPrice = Number.POSITIVE_INFINITY, count = 0;
			control.values.forEach(v => {
				query[control.index] = v.id;
				let rows = this.rows.filter(r => {
					return controls.reduce((has, c, i) => {
						if (c === control) {
							return has && r[c.index] === query[c.index];
						} else if (c.lazy && c.key !== this.currentKey) {
							return has;
						} else {
							return has && r[c.index] === query[c.index];
						}
					}, true);
				});
				controls.filter(c => c.lazy).forEach(c => {
					const strictRows = rows.filter(x => x[c.index] === query[c.index]);
					if (true || strictRows.length) {
						rows = strictRows;
					}
				});
				if (rows.length > 0) {
					const rowPrice = prices.values.find(v => v.id === rows[0][prices.index]).value;
					v.price = rowPrice;
					v.disabled = false;
					count++;
				} else {
					v.price = 0;
					v.disabled = true;
				}
				minimumPrice = Math.min(v.price, minimumPrice);
			});
			control.values.forEach(v => {
				const rowPrice = v.price;
				if (count > 1) {
					v.price -= minimumPrice;
				} else {
					v.price = 0;
				}
				v.updatePrice(control.element);
				// console.log(control.key, v.name, rowPrice, v.price, v.disabled ? 'disabled' : '');
			});
			control.updateState();
		});
	}

	setRow(row: number[]) {
		this.row = row;
		const result: any = {};
		this.cols.forEach((c, i) => {
			if (row[i]) {
				const value = c.values.find(v => v.id === row[i]);
				if (value) {
					result[c.key] = value.name;
					c.onSelect(value, true);
				} else {
					result[c.key] = '-';
				}
			} else {
				result[c.key] = null;
			}
		});
		const price = parseFloat(result.price);
		this.element.querySelectorAll('.result-price').forEach(x => x.innerHTML = `€ ${price.toFixed(2)}`);
		this.element.querySelector('.result-code').innerHTML = result.code;
		const keys = [MtmControlEnum.Module1, MtmControlEnum.Module2, MtmControlEnum.Module3, MtmControlEnum.Module4]
		const descriptions: string[] = [];
		keys.forEach(x => {
			const value: string = result[x];
			if (value !== '-') {
				descriptions.push(MtmDataService.parts.find(x => x.id === parseInt(value)).shortDescription);
			}
		});
		this.element.querySelector('.result-description').innerHTML = descriptions.join(', ');
		this.element.querySelector('.result-finish').innerHTML = result.finish;
		this.element.querySelector('.result-system').innerHTML = result.system;
		this.element.querySelector('.result-mount').innerHTML = result.mount;
		const picture = this.element.querySelector('.media>.picture');
		picture.classList.add('loading');
		const image = new Image();
		image.onload = () => {
			picture.classList.remove('loading');
			picture.querySelectorAll('img').forEach(x => x.parentNode.removeChild(x));
			picture.appendChild(image);
		}
		image.src = 'https://came.yetnot.it/came_configurator/build_kit_image/' + result.code.replace(/\//g, '|');
		this.calcOptions(row);
		Dom.log('setRow', result);
	}

	render() {
		const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
		this.options.map(x => x.render()).forEach(x => outlet.appendChild(x));
		// console.log('render.outlet', outlet);
	}

	addMediaScrollListener() {
		const sidebar = this.element.querySelector('.sidebar') as HTMLElement;
		const media = this.element.querySelector('.media') as HTMLElement;
		// const picture = media.querySelector('.picture') as HTMLElement;
		const onScroll = () => {
			const rect: ClientRect | DOMRect = sidebar.getBoundingClientRect();
			if (rect.top < 60) {
				media.classList.add('fixed');
			} else {
				media.classList.remove('fixed');
			}
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

	addRecapScrollListener() {
		const inner = this.element.querySelector('.section--recap--fixed > .inner') as HTMLElement;
		var lastScrollTop = Dom.scrollTop();
		const onScroll = () => {
			var scrollTop = Dom.scrollTop();
			if (scrollTop > lastScrollTop) {
				inner.classList.add('fixed');
			} else {
				inner.classList.remove('fixed');
			}
			lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

}

const configurator = new MtmConfigurator(`.configurator`);
