import { MtmControl } from "./controls/control";
import { MtmGroup } from "./controls/group";
import { MtmSelect } from "./controls/select";
import { MtmValue } from "./controls/value";
import MtmDataService from "./models/data.service";
import Dom from "./utils/dom";

export default class MtmConfigurator {

	element: HTMLElement;
	options: MtmControl[];

	constructor(selector: string) {
		this.element = document.querySelector(selector) as HTMLElement;
		this.addMediaScrollListener();
		this.addRecapScrollListener();
		MtmDataService.fetch((cols: MtmControl[], rows: number[][]) => {
			console.log(cols[0]);
			console.log(rows[0]);
			let options = [
				new MtmGroup({
					key: 'knownTecnology',
					name: 'Conosci già la tecnologia da adottare?',
					values: [
						{ id: 1, name: 'No' },
						{ id: 2, name: 'Sì' },
					],
					className: 'btn-group--sm',
				}),
				new MtmGroup({
					key: 'constrainedDimension',
					name: 'Hai un vincolo sul numero di moduli e dimensione del pannello?',
					values: [
						{ id: 1, name: 'No' },
						{ id: 2, name: 'Sì' },
					],
					className: 'btn-group--sm'
				}),
				new MtmSelect({
					key: 'apartmentNumber',
					name: 'Quanti appartamenti o punti interni devi gestire?',
					values: new Array(20).fill(0).map((x: number, i: number) => {
						return { id: i + 1, name: (i + 1).toFixed(0) };
					})
				}),
				MtmDataService.optionWithKey('audioVideo'),
				MtmDataService.optionWithKey('keypad'),
				MtmDataService.optionWithKey('infoModule'),
				MtmDataService.optionWithKey('proximity'),
				MtmDataService.optionWithKey('system'),
				MtmDataService.optionWithKey('moduleSize'),
			];
			options.forEach(x => x.didChange = (item: MtmValue, control: MtmControl) => {
				console.log('MtmConfigurator.didChange', control.key, item);
				switch (control.key) {
					case 'knownTecnology':
						const controls = this.options.map(x => x.element);
						controls.unshift(controls.pop());
						const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
						controls.forEach(x => outlet.appendChild(x));
						break;
					case 'constrainedDimension':

						break;
				}
			});
			this.options = options;
			this.render();
		}, (error: any) => {
			console.log('error', error);
		});
	}

	render() {
		const outlet = this.element.querySelector('.options-outlet') as HTMLElement;
		this.options.map(x => x.render()).forEach(x => outlet.appendChild(x));
		console.log('render.outlet', outlet);
	}

	addMediaScrollListener() {
		const media = this.element.querySelector('.media') as HTMLElement;
		const picture = media.querySelector('.picture') as HTMLElement;
		const onScroll = () => {
			const rect: ClientRect | DOMRect = media.getBoundingClientRect();
			if (rect.top < 60) {
				Dom.addClass(picture, 'fixed');
			} else {
				Dom.removeClass(picture, 'fixed');
			}
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

	addRecapScrollListener() {
		const inner = this.element.querySelector('.section--recap > .inner') as HTMLElement;
		var lastScrollTop = Dom.scrollTop();
		const onScroll = () => {
			var scrollTop = Dom.scrollTop();
			if (scrollTop > lastScrollTop) {
				Dom.addClass(inner, 'fixed');
			} else {
				Dom.removeClass(inner, 'fixed');
			}
			lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
		};
		onScroll();
		window.addEventListener('scroll', onScroll, false);
	}

}

const configurator = new MtmConfigurator(`.configurator`);
