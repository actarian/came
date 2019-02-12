import { MtmControlType } from './constants';
import { MtmControl } from './control';

export class MtmGroup extends MtmControl {

	constructor(options: MtmControl) {
		super(options);
		this.type = MtmControlType.Group;
	}

	getTemplate?(): string {
		return `<div class="option option--${this.key}">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="control control--group ${this.values.length === 4 ? `btn-group--4` : ``} ${this.className}"></div>
	</div>`;
	}

}
