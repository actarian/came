
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
		return this.price > 0 ? `<span class="price">+ € ${this.price.toFixed(2)}</span>` : `<span class="price"></span>`;
	}

	updatePrice?(element: HTMLElement): void {
		if (element) {
			const priceElement = element.querySelector(`[data-id="${this.id}"] .price`);
			priceElement.innerHTML = this.price > 0 ? `+ € ${this.price.toFixed(2)}` : ``;
		}
	}

	getKey?(): string {
		return this.name.replace(/ /g, ``).toLowerCase();
	}

	constructor(options?: MtmValue) {
		if (options) {
			Object.assign(this, options);
		}
	}

}
