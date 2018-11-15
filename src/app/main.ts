import MtmDataService from "./models/mtm-data.service";
import Dom from "./utils/dom";

export default class MtmConfigurator {

	element: HTMLElement;

	constructor(selector: string) {
		this.element = document.querySelector(selector) as HTMLElement;
		this.addMediaScrollListener();
		this.addRecapScrollListener();
		MtmDataService.fetch();
	}

	addMediaScrollListener() {
		const media = this.element.querySelector('.media') as HTMLElement;
		const picture = media.querySelector('.picture') as HTMLElement;
		window.addEventListener('scroll', () => {
			const rect: ClientRect | DOMRect = media.getBoundingClientRect();
			if (rect.top < 60) {
				Dom.addClass(picture, 'fixed');
			} else {
				Dom.removeClass(picture, 'fixed');
			}
		}, false);
	}

	addRecapScrollListener() {
		const inner = this.element.querySelector('.section--recap > .inner') as HTMLElement;
		var lastScrollTop = Dom.scrollTop();
		window.addEventListener('scroll', () => {
			var scrollTop = Dom.scrollTop();
			if (scrollTop > lastScrollTop) {
				Dom.addClass(inner, 'fixed');
			} else {
				Dom.removeClass(inner, 'fixed');
			}
			lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
		}, false);
	}

}

const configurator = new MtmConfigurator(`.configurator`);

