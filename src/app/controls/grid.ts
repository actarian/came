import { MtmControlType } from './constants';
import { MtmControl } from './control';
import { MtmValue } from './value';

export class MtmGrid extends MtmControl {

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.Grid;
	}

	getTemplate?(): string {
		return `<div class="option">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control control--grid ${this.className}"></div>
	</div>`;
	}

	getChildTemplate?(item: MtmValue): string {
		return `<div class="btn btn--system ${item.active ? `active` : ``}" data-id="${item.id}">
		<img class="icon" src="img/mtm-configurator/${item.getKey()}.jpg" title="${item.name}" />${item.getPrice()}
		<button type="button" class="btn btn--info">i</button>
	</div>`;
	}

}
