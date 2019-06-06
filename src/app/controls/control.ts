import { MtmPaths } from '../data.service';
import Dom from '../utils/dom';
import { MtmControlEnum, MtmControlType, MtmSortType } from './constants';
import { MtmValue } from './value';

export class MtmControl {
	type?: MtmControlType = MtmControlType.Grid;
	key: MtmControlEnum = MtmControlEnum.Default;
	name: string = '';
	description?: string = '';
	originalName?: string = '';
	values?: MtmValue[] = [];
	cache?: any = {};
	count?: number = 0;
	index?: number = 0;
	className?: string = '';
	nullable?: boolean = false;
	lazy?: boolean = false;
	sortType?: MtmSortType = MtmSortType.String;
	element?: HTMLElement = null;
	currentItem?: MtmValue = null;
	didChange?: Function = null;
	defaultId?: number;
	defaultNames?: string;
	dynamicPicture?: boolean = false;
	resolvePicture?: Function = (item: MtmValue): string => {
		return null;
	}

	constructor(options: MtmControl) {
		/*
		if (typeof options == 'string') {
			const map = MTM_MAP[options as string] || MTM_MAP.Default;
			this.key = map.key;
			this.name = map.name;
			this.description = map.description;
			this.originalName = options;
			this.values = [];
			this.cache = {};
			this.count = 0;
		} else {
			*/
		options = options as MtmControl;
		Object.assign(this, options);
		this.originalName = this.name;
		if (options.values) {
			this.values = options.values.map(x => new MtmValue(x));
			this.values.forEach(x => {
				this.cache[x.name] = x;
				this.count++;
			});
			/*
			if (this.values.length) {
				this.values[0].selected = true;
				this.currentItem = this.values[0];
			}
			*/
		}
		// }
	}

	get selected(): any {
		const selected = this.currentItem;
		if (this.currentItem) {
			return this.currentItem;
		} else {
			return {
				id: -1,
				name: '-',
				price: 0,
			}
		}
	}

	getTemplate?(): string {
		return `<div class="option option--${this.key}">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control ${this.className}"></div>
	</div>`;
	}

	getChildTemplate?(item: MtmValue): string {
		if (this.dynamicPicture) {
			return `<button type="button" class="btn btn--option btn--picture ${item.selected ? `selected` : ``} ${item.active ? `active` : ``}" data-id="${item.id}">
			<span class="picture"><img src="${this.resolvePicture(item)}" /></span><span class="label"><span class="text">${item.locale}</span>${item.getPrice()}</span>
		</button>`;
		} else {
			return `<button type="button" class="btn btn--option ${item.selected ? `selected` : ``} ${item.active ? `active` : ``}" data-id="${item.id}">
			<span class="label"><span class="text">${item.locale}</span>${item.getPrice()}</span>
		</button>`;
		}
	}

	getFragment?(): DocumentFragment {
		const fragment = Dom.fragmentFromHTML(this.getTemplate());
		this.element = Dom.fragmentFirstElement(fragment);
		// console.log(this.key, fragment.children);
		return fragment;
	}

	render?(): DocumentFragment {
		const fragment = this.getFragment();
		const group = fragment.querySelector('.control');
		const fragments = this.values.map(x => Dom.fragmentFromHTML(this.getChildTemplate(x)));
		const buttons = fragments.map(x => Dom.fragmentFirstElement(x) as HTMLButtonElement);
		buttons.forEach(x => x.addEventListener('click', (e) => this.onClick(x)));
		fragments.forEach(x => group.appendChild(x));
		// this.element = group as HTMLElement;
		// console.log(this.key, this.element);
		return fragment;
	}

	onClick?(button: HTMLButtonElement, prevent: boolean = false) {
		if (!button) {
			return;
		}
		const buttons = Array.prototype.slice.call(button.parentNode.childNodes);
		buttons.forEach((x: Element) => x.classList.remove('selected'));
		this.values.forEach(x => x.selected = false);
		let item: MtmValue;
		const id = parseInt(button.getAttribute('data-id'));
		item = this.values.find(x => x.id === id);
		if (this.currentItem === item) {
			if (item) {
				item.selected = false;
			}
			this.currentItem = null;
		} else {
			button.classList.add('selected');
			item.selected = true;
			this.currentItem = item;
		}
		if (!prevent && typeof this.didChange === 'function') {
			this.didChange(this.currentItem, this);
		}
		// console.log('MtmControl.onClick', 'button', button, 'item', item);
	}

	unselect?() {
		const buttons = Array.prototype.slice.call(this.element.querySelectorAll('.selected'));
		buttons.forEach((x: Element) => x.classList.remove('selected'));
		this.values.forEach(x => x.selected = false);
		this.currentItem = null;
	}

	onSelect?(value: MtmValue, prevent: boolean = false) {
		this.values.forEach(x => x.selected = false);
		this.currentItem = value;
		if (value) {
			value.selected = true;
			if (this.element) {
				const group = this.element.querySelector('.control');
				const button = group.querySelector(`[data-id="${value.id}"]`) as HTMLButtonElement;
				this.onClick(button, prevent);
			}
		} else {
			this.unselect();
		}
	}

	updateState?() {
		// console.log('MtmControl.updateState', this.key, this.element);
		if (this.element) {
			const group = this.element.querySelector('.control');
			this.values.forEach((x, i) => {
				const button = group.childNodes[i] as Element;
				if (x.disabled) {
					button.classList.add('disabled');
				} else {
					button.classList.remove('disabled');
				}
				if (x.selected) {
					button.classList.add('selected');
				} else {
					button.classList.remove('selected');
				}
				// console.log(x.disabled);
			});
		}
	}

	addValue?(name: string, locale: string, price: number, code: string = null): number {
		if (name === 'No' &&
			(this.key === MtmControlEnum.AudioVideo || this.key === MtmControlEnum.System)) {
			return -1;
		}
		let item = this.cache[name];
		if (item == undefined) {
			/*
			if (name === 'No') {
				console.log(this.key, name);
			}
			*/
			item = new MtmValue({ id: ++this.count, name, locale, price, value: parseInt(name), code: code });
			this.values.push(item);
			/*
			if (this.key === 'buttons') {
				console.log(item, this.values[0]);
			}
			*/
		} else {
			item.count++;
			item.price = Math.min(price, item.price);
		}
		this.cache[name] = item;
		return item.id;
	}

	sort?(index: number) {
		const paths = new MtmPaths();
		this.index = index;
		if (this.values.length > 0) {
			if (this.sortType === MtmSortType.Numeric) {
				this.values.sort((a, b) => a.value - b.value);
			} else {
				this.values.sort((a, b) => a.price - b.price);
				const minimumPrice = this.values[0].price;
				if (minimumPrice) {
					this.values.forEach(x => x.price = x.price - minimumPrice);
				} else {
					this.values.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
				}
			}
			// this.values.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
		}
		const nullValue = this.values.find(x => x.name === 'No');
		if (nullValue) {
			this.values.splice(this.values.indexOf(nullValue), 1);
			if (this.nullable) {
				this.values.unshift(nullValue);
				/*
				this.values.unshift(new MtmValue({
					id: nullValue ? nullValue.id : 0,
					name: 'No',
				}));
				*/
			}
		}
		if (paths.showPrices !== '1') {
			this.values.forEach((x, i) => x.price = 0);
		}
		/*
		if (this.key === MtmControlEnum.Finish) {
			console.log(this.values.map(x => x.name));
		}
		*/
		this.setDefaultValue();
		this.setDefaultNames();
	}

	setDefaultValue() {
		if (this.values.length && this.defaultId) {
			// this.values[0].selected = true;
			const defaultValue = this.values.find(x => x.id === this.defaultId);
			if (defaultValue) {
				defaultValue.selected = true;
				this.currentItem = defaultValue;
				this.values.splice(this.values.indexOf(defaultValue), 1);
				this.values.unshift(defaultValue);
			}
		}
	}

	setDefaultNames() {
		if (this.values.length && this.defaultNames) {
			// this.values[0].selected = true;
			const defaultValue = this.values.find(x => this.defaultNames.indexOf(x.name) !== -1);
			if (defaultValue) {
				defaultValue.selected = true;
				this.currentItem = defaultValue;
				this.values.splice(this.values.indexOf(defaultValue), 1);
				this.values.unshift(defaultValue);
			}
		}
	}

}
