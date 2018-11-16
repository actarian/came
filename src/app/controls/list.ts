import { MtmControlType } from './consts';
import { MtmControl } from './control';

export class MtmList extends MtmControl {

	constructor(options: string | MtmControl) {
		super(options);
		this.type = MtmControlType.List;
	}

	getTemplate?(): string {
		return `<div class="option">
		<div class="title">${this.name}</div>${
			this.description ? `<div class="subtitle">${this.description}</div>` : ``
			}
		<div class="btn-control btn-list ${this.className}"></div>
	</div>`;
	}

}
