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
				this.values[0].active = true;
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
		return `<button type="button" class="btn btn--option ${item.active ? `active` : ``}" data-id="${item.id}">
		<span class="label">${item.name}</span>${item.getPrice()}
	</button>`;
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
		/*
		const group = this.element.querySelector('.control');
		const buttons = Array.prototype.slice.call(group.childNodes);
		const index = buttons.indexOf(button);
		if (index !== -1) {
			this.onSelected(this.values[index].id);
		}
		*/
		console.log('onClick');
		if (!button) {
			return;
		}
		const buttons = Array.prototype.slice.call(button.parentNode.childNodes);
		buttons.forEach((x: Element) => x.classList.remove('active'));
		this.values.forEach(x => x.active = false);
		const id = parseInt(button.getAttribute('data-id'));
		const item: MtmValue = this.values.find(x => x.id === id);
		if (this.currentItem === item) {
			item.active = false;
			this.currentItem = null;
		} else {
			button.classList.add('active');
			item.active = true;
			this.currentItem = item;
		}
		if (!prevent && typeof this.didChange === 'function') {
			this.didChange(this.currentItem, this);
		}
		// console.log('MtmControl.onClick', 'button', button, 'item', item);
	}

	onSelect?(value: MtmValue, prevent: boolean = false) {
		this.values.forEach(x => x.active = false);
		this.currentItem = value;
		if (value) {
			value.active = true;
			if (this.element) {
				const group = this.element.querySelector('.control');
				const button = group.querySelector(`[data-id="${value.id}"]`) as HTMLButtonElement;
				this.onClick(button, prevent);
			}
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
				// console.log(x.disabled);
			});
		}
	}

	addValue?(name: string, price: number): number {
		name = name && name.toString().trim() !== '' ? name.toString() : 'No';
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
			item = new MtmValue({ id: ++this.count, name, price, value: parseInt(name) });
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
		if (this.values.length) {
			this.values[0].active = true;
		}
		*/
	}

}
