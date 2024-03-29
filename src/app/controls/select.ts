import Dom from '../utils/dom';
import { MtmControls, MtmControlType } from './constants';
import { MtmControl } from './control';
import { MtmValue } from './value';

export class MtmSelect extends MtmControl {

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.Select;
		if (this.nullable) {
			this.values.unshift(MtmControls.selectNone);
		}
	}

	getTemplate?(): string {
		return `<div class="option option--${this.key}">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control control--list ${this.className}">
			<div class="btn btn--select">
				<select class="form-control form-control--select"></select>
				<span class="label"><span class="text"></span></span>
			</div>
		</div>
	</div>`;
	}

	getChildTemplate?(item: MtmValue): string {
		return `<option class="${item.selected ? `selected` : ``} ${item.disabled ? `disabled` : ``} ${item.active ? `active` : ``}" value="${item.id}" data-id="${item.id}">${item.locale}</option>`;
	}

	render?(): DocumentFragment {
		const fragment = this.getFragment();
		const select = fragment.querySelector('.form-control--select') as HTMLSelectElement;
		const fragments = this.values.map(x => Dom.fragmentFromHTML(this.getChildTemplate(x)));
		const group = fragment.querySelector('.control');
		fragments.forEach(x => select.appendChild(x));
		this.element = group as HTMLElement;
		select.addEventListener('change', (e) => this.onChange(e));
		const value = this.values.find(x => x.selected);
		if (value) {
			select.value = value.id.toFixed();
		}
		this.onUpdate(select);
		return fragment;
	}

	updateState?() {
		// console.log('MtmSelect.updateState', this.element);
		if (this.element) {
			const select = this.element.querySelector('select');
			this.values.forEach((x, i) => {
				const option = select.childNodes[i] as Element;
				if (x.disabled && x.id !== -1) {
					option.setAttribute('disabled', 'disabled');
				} else {
					option.removeAttribute('disabled');
				}
			});
		}
	}

	onUpdate(select: HTMLSelectElement): void {
		if (select) {
			const id: number = parseInt(select.value);
			const item = this.values.find(x => x.id === id);
			this.currentItem = item;
			// console.log(select.value, id, item);
			if (item && this.element) {
				const label = this.element.querySelector('.label>.text');
				label.innerHTML = item.locale;
			}
			if (typeof this.didChange === 'function') {
				this.didChange(item, this);
			}
		}
		// console.log('MtmSelect.onUpdate', select.value);
	}

	onChange?(e: Event): void {
		// console.log('MtmSelect.onChange', e.target);
		this.onUpdate(e.target as HTMLSelectElement);
	}

	onSelect?(value: MtmValue, prevent: boolean = false) {
		this.values.forEach(x => x.selected = false);
		this.currentItem = value;
		// console.log('MtmSelect.onSelect', value);
		if (value) {
			value.selected = true;
			if (this.element) {
				const label = this.element.querySelector('.label>.text');
				label.innerHTML = value.locale;
				const select = this.element.querySelector('select') as HTMLSelectElement;
				this.values.forEach((x, i) => {
					x.selected = false;
					const option = select.childNodes[i] as Element;
					if (x.selected) {
						option.classList.add('selected');
					} else {
						option.classList.remove('selected');
					}
				});
				select.value = value.id.toString();
			}
		}
	}

}
