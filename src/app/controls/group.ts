import { MtmControlType } from './consts';
import { MtmControl } from './control';

export class MtmGroup extends MtmControl {

	constructor(options: string | MtmControl) {
		super(options);
		this.type = MtmControlType.Group;
	}

	getTemplate?(): string {
		return `<div class="option">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="btn-control btn-group ${this.values.length === 4 ? `btn-group--4` : ``} ${this.className}"></div>
	</div>`;
	}

}
