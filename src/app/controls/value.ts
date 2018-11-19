
export class MtmValue {
	id: number;
	name: string;
	price?: number = 0;
	count?: number = 1;
	order?: number = 0;
	value?: number = 0;
	active?: boolean = false;
	disabled?: boolean = false;
	data?: any;

	getPrice?(): string {
		return this.price ? `<span class="price">+ € ${this.price.toFixed(2)}</span>` : ``;
	}

	getKey?(): string {
		return this.name.replace(/ /g, ``);
	}

	constructor(options?: MtmValue) {
		if (options) {
			Object.assign(this, options);
		}
	}

}
