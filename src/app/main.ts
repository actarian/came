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
				MtmDataService.optionWithKey(MtmControlEnum.InfoModule),
				MtmDataService.optionWithKey(MtmControlEnum.Proximity),
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
						break;
					case MtmControlEnum.ApartmentNumber:
						this.updateCallButtons();
						break;
					case MtmControlEnum.CallButtons:
						this.didSelectCallButton();
						this.onSearch();
						break;
					default:
						this.onSearch();
				}
			});
			this.options = options;
			this.initCallButtons();
			this.render();
			this.updateCallButtons();
			this.didSelectCallButton();
			this.onSearch();
		}, (error: any) => {
			console.log('error', error);

		});
	}

	initCallButtons() {
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		const digi1 = buttons.values.filter(x => x.name === 'DIGI1');
		const digi2 = buttons.values.filter(x => x.name === 'DIGI2');
		const numericButtons = buttons.values.filter(x => parseInt(x.name).toString() === x.name);
		const digitalDisplay = MtmDataService.optionWithKey(MtmControlEnum.DigitalDisplay);
		const digitalDisplayButton = digitalDisplay.values.find(x => x.name === 'Digital Display');
		// console.log(buttons.values); // 26
		// Modulo 1 Pulsante
		const values: MtmValue[] = [];
		let i = 0;
		values.push(new MtmValue({
			id: ++i,
			name: `DIGI1`,
			value: 1,
			order: 10 - 2,
			data: { buttons: digi1 }
		}));
		values.push(new MtmValue({
			id: ++i,
			name: `DIGI2`,
			value: 2,
			order: 20 - 1,
			data: { buttons: digi2 }
		}));
		numericButtons.forEach(x => {
			const value = parseInt(x.name);
			values.push(new MtmValue({
				id: ++i,
				name: `Modulo ${value > 1 ? value + ' pulsanti' : '1 pulsante'}`,
				value: value,
				order: value * 10,
				data: { buttons: x }
			}));
			values.push(new MtmValue({
				id: ++i,
				name: `Modulo DIGI1 + ${value > 1 ? value + ' pulsanti' : '1 pulsante'}`,
				value: value + 1,
				order: (value + 1) * 10 - 2,
				data: { buttons: x } // + digi1
			}));
			values.push(new MtmValue({
				id: ++i,
				name: `Modulo DIGI2 + ${value > 1 ? value + ' pulsanti' : '1 pulsante'}`,
				value: value + 2,
				order: (value + 2) * 10 - 1,
				data: { buttons: x } // + digi2
			}));
		})
		values.push(new MtmValue({
			id: ++i,
			name: `Digital Display`,
			value: 1000,
			order: 10000,
			data: { digitalDisplay: digitalDisplayButton }
		}))
		values.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		callButtons.values = values;
		callButtons.values.forEach((x, i) => x.price = 4.99 * i);
		if (callButtons.values.length) {
			callButtons.values[0].active = true;
			callButtons.currentItem = callButtons.values[0];
		}
	}

	updateCallButtons() {
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		const apartmentNumberValue = apartmentNumber.currentItem.id;
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		callButtons.values.forEach(x => {
			switch (x.name) {
				case 'Digital Display':
					x.disabled = false;
					break;
				default:
					x.disabled = x.value !== apartmentNumberValue;
					break;
			}
		});
		// console.log(callButtons.values.filter(x => !x.disabled).map(x => x.name));
		callButtons.updateState();
		// const callButtonsCurrentItem = callButtons.currentItem;
		// console.log('updateCallButtons', apartmentNumberValue, callButtonsCurrentItem.name);
	}

	didSelectCallButton() {
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		const digitalDisplay = MtmDataService.optionWithKey(MtmControlEnum.DigitalDisplay);
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		// console.log('didSelectCallButton.currentItem =>', callButtons.currentItem);
		if (callButtons.currentItem && callButtons.currentItem.data) {
			buttons.onSelect(callButtons.currentItem.data.buttons);
			digitalDisplay.onSelect(callButtons.currentItem.data.digitalDisplay);
		}
		/*
		buttons.values.forEach(x => x.active = false);
		digitalDisplay.values.forEach(x => x.active = false);
		if (callButtons.currentItem.name === 'Digital Display') {
			digitalDisplay.currentItem = digitalDisplay.values.find(x => x.id === callButtons.currentItem.id);
			digitalDisplay.currentItem.active = true;
			buttons.currentItem = null;
		} else {
			buttons.currentItem = buttons.values.find(x => x.id === callButtons.currentItem.id);
			buttons.currentItem.active = true;
			digitalDisplay.currentItem = null;
		}
		*/
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
		const infoModule = this.options.find(x => x.key === MtmControlEnum.InfoModule);
		const proximity = this.options.find(x => x.key === MtmControlEnum.Proximity);
		const finish = this.options.find(x => x.key === MtmControlEnum.Finish);
		const mount = this.options.find(x => x.key === MtmControlEnum.Mount);
		controls.push(apartmentNumber.element);
		controls.push(callButtons.element);
		controls.push(audioVideo.element);
		controls.push(keypad.element);
		controls.push(infoModule.element);
		controls.push(proximity.element);
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

	onSearch() {
		// FILTERS
		const filters = this.options.map(x => {
			const index = this.cols.indexOf(x);
			if (index !== -1) {
				const control = x;
				const selectedValue = x.values.find(v => v.active);
				const value = selectedValue ? selectedValue.id : -1;
				const name = selectedValue ? selectedValue.name : '-';
				const price = selectedValue ? selectedValue.price : 0;
				return { index, value, name, price, control };
			} else {
				return { index };
			}
		}).filter(x => x.index !== -1 && x.value !== -1);
		console.log(filters.map(x => x.control.name + ' ' + x.name + ' ' + x.value).join('\n'));
		// TOTALPRICE ?
		const totalPrice = filters.reduce((p, x) => {
			// console.log(p, x.price);
			return p + x.price;
		}, 0);
		// FILTER RESULTS
		const results = this.rows.filter(x => {
			let has = true;
			filters.forEach(f => has = has && x[f.index] === f.value);
			return has;
		}).map(r => {
			const result: any = {};
			this.cols.forEach((c, i) => {
				if (r[i]) {
					const value = c.values.find(v => v.id === r[i]);
					result[c.key] = value ? value.name : '-';
				} else {
					result[c.key] = null;
				}
			});
			return result;
		});
		if (results.length > 0) {
			const result = results[0];
			this.element.querySelector('.result-price').innerHTML = `€ ${totalPrice.toFixed(2)}`;
			this.element.querySelector('.result-code').innerHTML = result.code;
			// this.element.querySelectorAll('.result-code').forEach(x => x.innerHTML = result.code);
			this.element.querySelector('.result-description').innerHTML = result.Description;
			if (results.length === 1) {
				console.log('MtmConfigurato.onSearch', result);
			} else {
				console.log('onSearch.error', results);
			}
		} else {
			console.log('onSearch.error', results);
		}
	}

	render() {
		const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
		this.options.map(x => x.render()).forEach(x => outlet.appendChild(x));
		// console.log('render.outlet', outlet);
	}

	addMediaScrollListener() {
		const media = this.element.querySelector('.media') as HTMLElement;
		const picture = media.querySelector('.picture') as HTMLElement;
		const onScroll = () => {
			const rect: ClientRect | DOMRect = media.getBoundingClientRect();
			if (rect.top < 60) {
				Dom.addClass(picture, 'fixed');
			} else {
				Dom.removeClass(picture, 'fixed');
			}
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

	addRecapScrollListener() {
		const inner = this.element.querySelector('.section--recap > .inner') as HTMLElement;
		var lastScrollTop = Dom.scrollTop();
		const onScroll = () => {
			var scrollTop = Dom.scrollTop();
			if (scrollTop > lastScrollTop) {
				Dom.addClass(inner, 'fixed');
			} else {
				Dom.removeClass(inner, 'fixed');
			}
			lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

}

const configurator = new MtmConfigurator(`.configurator`);
