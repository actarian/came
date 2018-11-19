import Dom from '../utils/dom';
import { MtmControlType } from './constants';
import { MtmControl } from './control';

export class MtmSelect extends MtmControl {

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.Select;
	}

	getTemplate?(): string {
		return `<div class="option">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control control--list ${this.className}">
			<div class="btn btn--select">
				<select class="form-control form-control--select"></select>
				<span class="label"></span>
			</div>
		</div>
	</div>`;
	}

	render?(): DocumentFragment {
		const fragment = this.getFragment();
		const select = fragment.querySelector('.form-control--select') as HTMLSelectElement;
		this.values.map(x => {
			const html = `
		<option value="${x.id}">${x.name}</option>
		`;
			const fragment = Dom.fragmentFromHTML(html);
			return fragment;
		}).forEach(x => select.appendChild(x));
		select.addEventListener('change', (e) => this.onChange(e));
		const value = this.values.find(x => x.active);
		if (value) {
			select.value = value.id.toFixed();
		}
		this.onUpdate(select);
		return fragment;
	}

	onUpdate(select: HTMLSelectElement): void {
		if (select) {
			const id: number = parseInt(select.value);
			const item = this.values.find(x => x.id === id);
			this.currentItem = item;
			if (item) {
				const label = this.element.querySelector('.label');
				label.innerHTML = item.name;
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

}
