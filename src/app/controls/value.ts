
export class MtmValue {
	id: number;
	name: string;
	locale: string;
	code?: string;
	price?: number = 0;
	count?: number = 1;
	order?: number = 0;
	value?: number = 0;
	selected?: boolean = false;
	active?: boolean = false;
	disabled?: boolean = false;
	data?: any;

	getPrice?(): string {
		const priceString = this.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		return this.price > 0 ? `<span class="price">+ € ${priceString}</span>` : `<span class="price"></span>`;
	}

	updatePrice?(element: HTMLElement): void {
		if (element) {
			const priceElement = element.querySelector(`[data-id="${this.id}"] .price`);
			if (priceElement) {
				const priceString = this.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
				priceElement.innerHTML = this.price > 0 ? `+ € ${priceString}` : ``;
			}
		}
	}

	getKey?(): string {
		return this.name.replace(/ /g, ``).toLowerCase();
	}

	constructor(options?: MtmValue) {
		if (options) {
			Object.assign(this, options);
			this.locale = this.locale || this.name;
		}
	}

}
