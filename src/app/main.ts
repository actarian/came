import { MtmControlEnum } from "./controls/constants";
import { MtmControl } from "./controls/control";
import { MtmValue } from "./controls/value";
import MtmDataService, { MtmPaths } from "./data.service";
import Dom from "./utils/dom";
import Rect from "./utils/rect";

export default class MtmConfigurator {

	element: HTMLElement;
	stickys: HTMLElement[];
	stickyContents: HTMLElement[];
	options: MtmControl[];
	cols: MtmControl[] = [];
	rows: number[][] = [];
	filteredRows: any[] = [];
	row: number[] = null;
	currentKey: MtmControlEnum = MtmControlEnum.Buttons;
	playing: boolean = false;

	constructor(selector: string) {
		this.element = document.querySelector(selector) as HTMLElement;
		const paths = new MtmPaths();
		if (paths.showPrices !== '1') {
			this.element.classList.add('noprice');
		}
		const stickys = [].slice.call(this.element.querySelectorAll('[sticky]'));
		this.stickys = stickys;
		this.stickyContents = stickys.map(x => x.querySelector('[sticky-content]'));
		// this.addMediaScrollListener();
		// this.addRecapScrollListener();
		this.addRecapScrollFixed();
		MtmDataService.fetch((cols: MtmControl[], rows: number[][]) => {
			this.cols = cols;
			this.rows = rows;
			let options = [
				MtmDataService.newControlByKey(MtmControlEnum.KnownTecnology),
				MtmDataService.newControlByKey(MtmControlEnum.ConstrainedDimension),
				MtmDataService.newControlByKey(MtmControlEnum.ApartmentNumber),
				// MtmDataService.optionWithKey(MtmControlEnum.Buttons),
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
					/*
				case MtmControlEnum.ApartmentNumber:
					this.onSearch(this.didSelectApartmentNumber());
					break;
					*/
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

	getRows(key?: MtmControlEnum, value?: MtmValue) {
		this.currentKey = key;
		const controls = this.options.map(x => {
			const index = this.cols.indexOf(x);
			if (index !== -1) {
				return x;
			} else {
				return { index };
			}
		}).filter(x => x.index !== -1).map(x => x as MtmControl);
		let selected = controls.filter(x => x.selected && x.selected.id !== -1);
		let unselected = controls.filter(x => !(x.selected && x.selected.id !== -1));
		unselected.forEach(x => {
			x.values.forEach(v => v.disabled = true);
		});
		/*
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		if (buttons.selected && buttons.selected.id !== -1) {
			selected.unshift(buttons);
		} else {
			buttons.values.forEach(v => {
				v.disabled = false;
			});
			buttons.updateState();
		}
		*/
		const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
		if (divided.selected && divided.selected.id !== -1) {
			selected.unshift(divided);
		} else {
			divided.values.forEach(v => {
				v.disabled = false;
			});
			divided.updateState();
		}
		const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
		if (digi.selected && digi.selected.id !== -1) {
			selected.unshift(digi);
		} else {
			digi.values.forEach(v => {
				v.disabled = false;
			});
			digi.updateState();
		}
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		if (apartmentNumber.selected && apartmentNumber.selected.id !== -1) {
			selected.unshift(apartmentNumber);
		}
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		let filteredRows = this.rows.filter(x => {
			return selected.reduce((has, c) => {
				if (c.key === MtmControlEnum.ApartmentNumber) {
					const buttonId = x[buttons.index];
					const buttonValue = buttons.values.find(v => v.id === buttonId);
					return has && apartmentNumber.selected.value <= buttonValue.value;
				} else if (c.key === key) {
					if (value) {
						if (value.id === -1) {
							return true;
						} else {
							return has && x[c.index] === value.id;
						}
					} else {
						return has && x[c.index] === c.selected.id;
					}
				} else {
					return has && x[c.index] === c.selected.id;
				}
			}, true);
		});
		filteredRows.forEach(r => {
			unselected.forEach(c => {
				c.values.forEach(v => {
					if (v.id === r[c.index]) {
						v.disabled = false;
					}
				});
				c.updateState();
			});
		});
		return filteredRows;
	}

	didSelectApartmentNumber(): MtmControlEnum {
		let key: MtmControlEnum;
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		key = MtmControlEnum.ApartmentNumber;
		return key;
	}

	setApartmentNumberState(filteredRows: number[][]) {
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		// filteredRows = this.getRows(MtmControlEnum.Buttons, buttons.values.find(x => x.value === -1));
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		apartmentNumber.values.forEach(x => x.disabled = true);
		filteredRows.forEach(r => {
			const buttonId = r[buttons.index];
			const button = buttons.values.find(b => b.id === buttonId);
			apartmentNumber.values.forEach(v => {
				v.disabled = v.disabled && !(button.value >= v.value);
			});
			apartmentNumber.updateState();
		});
	}

	didSelectCallButton(): MtmControlEnum {
		let key: MtmControlEnum;
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
		const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
		if (callButtons.selected.id !== -1) {
			// console.log('firstValue', firstValue);
			switch (callButtons.selected.id) {
				case 1:
					// pulsante singolo
					divided.onSelect(divided.values.find(x => x.id === 1));
					digi.currentItem = null;
					key = MtmControlEnum.Divided;
					break;
				case 2:
					// pulsante doppio
					divided.onSelect(divided.values.find(x => x.id === 2));
					digi.currentItem = null;
					key = MtmControlEnum.Divided;
					break;
				case 3:
					// digital keypad
					divided.onSelect(divided.values.find(x => x.id === 1));
					digi.onSelect(digi.values.find(x => x.name === 'DIGI'));
					key = MtmControlEnum.Keypad;
					break;
				case 4:
					// digital keypad + DIGI 1
					divided.onSelect(divided.values.find(x => x.id === 1));
					digi.onSelect(digi.values.find(x => x.name === 'DIGI1'));
					key = MtmControlEnum.Digi;
					break;
				case 5:
					// digital keypad + DIGI 2
					divided.onSelect(divided.values.find(x => x.id === 2));
					digi.onSelect(digi.values.find(x => x.name === 'DIGI2D'));
					key = MtmControlEnum.Digi;
					break;
			}
			/*
			console.log(
				'apartmentNumber', apartmentNumberValue,
				'buttons', buttons.selected.id,
				'divided', divided.selected.id,
				'digi', digi.selected.id
			);
			*/
		} else {
			divided.currentItem = null;
			digi.currentItem = null;
		}
		return key;
	}

	setCallButtonsState(filteredRows: number[][]) {
		const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
		const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		callButtons.values.forEach(x => x.disabled = true);
		filteredRows.forEach(r => {
			const dividedId = r[divided.index];
			const digiId = r[digi.index];
			// console.log(dividedId, digiId);
			callButtons.values.forEach(v => {
				let name = '';
				switch (v.id) {
					case 1:
						// pulsante singolo
						v.disabled = v.disabled && !(dividedId === 1 && digiId === 1);
						name = 'pulsante singolo';
						break;
					case 2:
						// pulsante doppio
						v.disabled = v.disabled && !(dividedId === 2 && digiId === 1);
						name = 'pulsante doppio';
						break;
					case 3:
						// digital keypad
						// query[buttons.index] = buttons.values.find(x => x.name === '48').id;
						v.disabled = v.disabled && !(dividedId === 1 && digiId === digi.values.find(x => x.name === 'DIGI').id);
						name = 'digital keypad';
						break;
					case 4:
						// digital keypad + DIGI 1
						// query[buttons.index] = buttons.values.find(x => x.name === '48').id;
						v.disabled = v.disabled && !(dividedId === 1 && digiId === digi.values.find(x => x.name === 'DIGI1').id);
						name = 'digital keypad + DIGI 1';
						break;
					case 5:
						// digital keypad + DIGI 2
						// query[buttons.index] = buttons.values.find(x => x.name === '48').id;
						v.disabled = v.disabled && !(dividedId === 2 && digiId === digi.values.find(x => x.name === 'DIGI2D').id);
						name = 'digital keypad + DIGI 2';
						break;
				}
			});
			callButtons.updateState();
		});
	}

	doReorder() {
		const controls = [];
		const knownTecnology = this.options.find(x => x.key === MtmControlEnum.KnownTecnology);
		const system = this.options.find(x => x.key === MtmControlEnum.System);
		const constrainedDimension = this.options.find(x => x.key === MtmControlEnum.ConstrainedDimension);
		const moduleSize = this.options.find(x => x.key === MtmControlEnum.ModuleSize);
		controls.push(knownTecnology.element);
		if (knownTecnology.selected.id === 2) {
			controls.push(system.element);
		}
		controls.push(constrainedDimension.element);
		if (constrainedDimension.selected.id === 2) {
			controls.push(moduleSize.element);
		}
		const apartmentNumber = this.options.find(x => x.key === MtmControlEnum.ApartmentNumber);
		const buttons = this.options.find(x => x.key === MtmControlEnum.Buttons);
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		const audioVideo = this.options.find(x => x.key === MtmControlEnum.AudioVideo);
		const keypad = this.options.find(x => x.key === MtmControlEnum.Keypad);
		const proximity = this.options.find(x => x.key === MtmControlEnum.Proximity);
		const digitalDisplay = this.options.find(x => x.key === MtmControlEnum.DigitalDisplay);
		const infoModule = this.options.find(x => x.key === MtmControlEnum.InfoModule);
		const hearingModule = this.options.find(x => x.key === MtmControlEnum.HearingModule);
		const finish = this.options.find(x => x.key === MtmControlEnum.Finish);
		const mount = this.options.find(x => x.key === MtmControlEnum.Mount);
		if (apartmentNumber && apartmentNumber.element) {
			controls.push(apartmentNumber.element);
		}
		if (buttons && buttons.element) {
			controls.push(buttons.element);
		}
		controls.push(callButtons.element);
		controls.push(audioVideo.element);
		controls.push(keypad.element);
		controls.push(proximity.element);
		controls.push(digitalDisplay.element);
		controls.push(infoModule.element);
		controls.push(hearingModule.element);
		controls.push(finish.element);
		controls.push(mount.element);
		if (knownTecnology.selected.id === 1) {
			controls.push(system.element);
		}
		if (constrainedDimension.selected.id === 1) {
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

	onSearch(key?: MtmControlEnum) {
		const filteredRows = this.getRows(key);
		this.setApartmentNumberState(filteredRows);
		this.setCallButtonsState(filteredRows);
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

	calcOptions__(row: number[]) {
		const prices = MtmDataService.optionWithKey(MtmControlEnum.Price);
		const controls = [
			// MtmControlEnum.CallButtons,
			MtmControlEnum.Buttons,
			MtmControlEnum.AudioVideo,
			MtmControlEnum.Keypad,
			MtmControlEnum.Proximity,
			MtmControlEnum.DigitalDisplay,
			MtmControlEnum.InfoModule,
			MtmControlEnum.HearingModule,
			MtmControlEnum.Finish,
			MtmControlEnum.Mounting,
			MtmControlEnum.System,
			MtmControlEnum.ModuleSize,
		].map(key => MtmDataService.optionWithKey(key));
		/*
		controls.forEach(control => {
			control.values.forEach(x => {
				if (x.id !== control.selected.id) {
					const rows = this.getRows(control.key, x);
					console.log(control.key, x.name, rows.length);
					if (rows.length) {
						x.disabled = false;
					} else {
						x.disabled = true;
					}
				}
			});
			control.updateState();
		});
		return;
		*/
		const currentControl = MtmDataService.optionWithKey(this.currentKey);
		if (controls.indexOf(currentControl) > 0) {
			controls.splice(controls.indexOf(currentControl), 1);
			controls.unshift(currentControl);
		}
		const paths = new MtmPaths();
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
				if (paths.showPrices == '1') {
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
				} else {
					v.price = 0;
					if (rows.length > 0) {
						if (MtmDataService.partsKeys.indexOf(control.key) !== -1) {
							const part = MtmDataService.partsPool[v.value];
							if (part) {
								v.price = part.price;
							}
							// console.log(control.key, v.price, v, part);
						}
						v.disabled = false;
						count++;
					} else {
						v.disabled = true;
					}
					v.updatePrice(control.element);
				}
			});
			if (paths.showPrices == '1') {
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
			}
			control.updateState();
		});
		/*
		const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
		const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
		const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
		const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
		// const callButtons = MtmDataService.optionWithKey(MtmControlEnum.CallButtons);
		controls.push(divided);
		controls.push(digi);
		callButtons.values.forEach(v => {
			const query = row.slice();
			let name = '';
			switch (v.id) {
				case 1:
					// pulsante singolo
					query[divided.index] = 1;
					query[digi.index] = 1;
					name = 'pulsante singolo';
					break;
				case 2:
					// pulsante doppio
					query[divided.index] = 2;
					query[digi.index] = 1;
					name = 'pulsante doppio';
					break;
				case 3:
					// digital keypad
					query[buttons.index] = buttons.values.find(x => x.name === '48').id;
					query[divided.index] = 1;
					query[digi.index] = digi.values.find(x => x.name === 'DIGI').id;
					name = 'digital keypad';
					break;
				case 4:
					// digital keypad + DIGI 1
					query[buttons.index] = buttons.values.find(x => x.name === '48').id;
					query[divided.index] = 1;
					query[digi.index] = digi.values.find(x => x.name === 'DIGI1').id;
					name = 'digital keypad + DIGI 1';
					break;
				case 5:
					// digital keypad + DIGI 2
					query[buttons.index] = buttons.values.find(x => x.name === '48').id;
					query[divided.index] = 2;
					query[digi.index] = digi.values.find(x => x.name === 'DIGI2D').id;
					name = 'digital keypad + DIGI 2';
					break;
			}
			let rows = this.rows.filter(r => {
				return controls.reduce((has, c, i) => {
					return has && r[c.index] === query[c.index];
				}, true);
			});
			if (rows.length > 0) {
				v.disabled = false;
			} else {
				v.disabled = true;
			}
			// console.log(name, rows.length, v);
		});
		callButtons.updateState();
		*/
		// console.log('callButtons', callButtons, 'divided', divided, 'digi', digi);
		// callButtons.onSelect(callButtons.values.find(x => x.id == 1), true);
	}

	calcOptions(row: number[]) {

	}

	setRow(row: number[]) {
		this.row = row;
		const result: any = {};
		this.cols.forEach((c, i) => {
			if (row[i]) {
				const value = c.values.find(v => v.id === row[i]);
				if (value) {
					result[c.key] = value.name;
					// c.onSelect(value, true);
				} else {
					result[c.key] = '-';
				}
			} else {
				result[c.key] = null;
			}
		});
		const price = parseFloat(result.price);
		const paths = new MtmPaths();
		if (paths.showPrices == '1') {
			this.element.querySelectorAll('.result-price').forEach(x => x.innerHTML = `€ ${price.toFixed(2)}`);
		} else {
			this.element.querySelectorAll('.result-price').forEach(x => x.innerHTML = ``);
		}
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
		const code = result.code.replace(/\//g, '|');
		this.element.querySelector('.result-cta').setAttribute('href', `${paths.configurator}/view_kit/${code}`);
		const picture = this.element.querySelector('.media>.picture');
		picture.classList.add('loading');
		const image = new Image();
		image.onload = () => {
			picture.classList.remove('loading');
			picture.querySelectorAll('img').forEach(x => x.parentNode.removeChild(x));
			picture.appendChild(image);
		}
		image.src = `${paths.configurator}/build_kit_image/${code}`;
		this.calcOptions(row);
		Dom.log('setRow', result);
	}

	render() {
		const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
		this.options.map(x => x.render()).forEach(x => outlet.appendChild(x));
		this.options.forEach(x => x.element = this.element.querySelector(`.option--${x.key}`));
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

	addRecapScrollFixed() {
		const inner = this.element.querySelector('.section--recap--fixed > .inner') as HTMLElement;
		inner.classList.add('fixed');
	}

	animate() {
		this.stickys.forEach((node, i) => {
			const content = this.stickyContents[i];
			let top = parseInt(node.getAttribute('sticky')) || 0;
			let rect = Rect.fromNode(node);
			const maxtop = node.offsetHeight - content.offsetHeight;
			if (window.innerWidth >= 768) {
				top = Math.max(0, Math.min(maxtop, top - rect.top));
				content.setAttribute('style', `transform: translateY(${top}px);`);
			} else {
				content.setAttribute('style', `transform: none;`);
			}
		});
	}

	loop() {
		this.animate();
		if (this.playing) {
			window.requestAnimationFrame(() => {
				this.loop();
			});
		}
	}

	play() {
		this.playing = true;
		this.loop();
	}

	pause() {
		this.playing = false;
	}

}

const configurator = new MtmConfigurator(`.configurator`);
configurator.play();
