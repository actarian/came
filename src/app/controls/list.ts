import { MtmControlType } from './constants';
import { MtmControl } from './control';

export class MtmList extends MtmControl {

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.List;
	}

	getTemplate?(): string {
		return `<div class="option option--${this.key}">
			<div class="title">${this.name}</div>${this.description ? `<div class="subtitle">${this.description}</div>` : ``}
			<div class="control control--list ${this.className}"></div>
		</div>`;
	}

}
