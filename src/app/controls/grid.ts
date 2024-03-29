import { MtmPaths } from '../data.service';
import { MtmControlType } from './constants';
import { MtmControl } from './control';
import { MtmValue } from './value';

export class MtmGrid extends MtmControl {

	paths: MtmPaths;

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.Grid;
		this.paths = new MtmPaths();
	}

	getTemplate?(): string {
		return `<div class="option option--${this.key}">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control control--grid ${this.className}"></div>
	</div>`;
	}

	getChildTemplate?(item: MtmValue): string {
		return `<div class="btn btn--system ${item.selected ? `selected` : ``} ${item.active ? `active` : ``}" data-id="${item.id}">
		<img class="icon" src="${this.paths.assets}img/mtm-configurator/${item.getKey()}.jpg" title="${item.locale}" />${item.getPrice()}
		<button type="button" class="btn btn--info">i</button>
	</div>`;
	}

}
