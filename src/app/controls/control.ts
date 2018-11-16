import Dom from '../utils/dom';
import { MtmControlType, MTM_MAP } from './consts';
import { MtmValue } from './value';

export class MtmControl {
	type?: MtmControlType = MtmControlType.Grid;
	key: string = '';
	name: string = '';
	description?: string = '';
	originalName?: string = '';
	values?: MtmValue[] = [];
	cache?: any = {};
	count?: number = 0;
	className?: string = '';
	element?: HTMLElement = null;
	currentItem?: MtmValue = null;
	didChange?: Function = null;

	constructor(options: string | MtmControl) {
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
			options = options as MtmControl;
			Object.assign(this, options);
			this.originalName = this.name;
			if (options.values) {
				this.values = options.values.map(x => new MtmValue(x));
				this.values.forEach(x => {
					this.cache[x.name] = x;
					this.count++;
				});
				if (this.values.length) {
					this.values[0].active = true;
				}
			}
		}
	}

	getTemplate?(): string {
		return `<div class="option">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="btn-control ${this.className}"></div>
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
		return fragment;
	}

	render?(): DocumentFragment {
		const fragment = this.getFragment();
		const group = fragment.querySelector('.btn-control');
		const fragments = this.values.map(x => Dom.fragmentFromHTML(this.getChildTemplate(x)));
		const buttons = fragments.map(x => Dom.fragmentFirstElement(x) as HTMLButtonElement);
		buttons.forEach(x => x.addEventListener('click', (e) => this.onClick(x)));
		fragments.forEach(x => group.appendChild(x));
		return fragment;
	}

	onClick?(button: HTMLButtonElement) {
		const buttons = Array.prototype.slice.call(button.parentNode.childNodes);
		buttons.forEach((x: Element) => Dom.removeClass(x, 'active'));
		Dom.addClass(button, 'active');
		const id = parseInt(button.getAttribute('data-id'));
		const item: MtmValue = this.values.find(x => x.id === id);
		this.currentItem = item;
		if (typeof this.didChange === 'function') {
			this.didChange(item, this);
		}
		console.log('MtmControl.onClick', 'button', button, 'item', item);
	}

	addValue?(name: string): number {
		if (name.trim() !== '') {
			let item = this.cache[name];
			if (this.cache[name] == undefined) {
				item = new MtmValue({ id: ++this.count, name });
				this.values.push(item);
			}
			this.cache[name] = item;
			return item.id;
		}
	}

	sort?() {
		this.values.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
		if (this.values.length === 1) {
			this.values.unshift(new MtmValue({
				id: 0,
				name: 'No',
			}));
		}
		this.values.forEach((x, i) => x.price = 4.99 * i);
		if (this.values.length) {
			this.values[0].active = true;
		}
	}

}
