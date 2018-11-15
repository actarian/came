/* global window, document, console, GlslCanvas, Swiper, TweenLite */

export default class Dom {

	static hasClass(element: Element, name: string): boolean {
		return element && new RegExp(`(?:^|\\s+)${name}(?:\\s+|$)`).test(element.className);
	}

	static addClass(element: Element, name: string): Dom {
		if (element && !Dom.hasClass(element, name)) {
			element.className = element.className ? (`${element.className} ${name}`) : name;
		}
		return Dom;
	}

	static removeClass(element: Element, name: string): Dom {
		if (element && Dom.hasClass(element, name)) {
			element.className = element.className.split(name).join(``).replace(/\s\s+/g, ` `); // .replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
		}
		return Dom;
	}

	static scrollTop(): number {
		const pageYOffset = window ? window.pageXOffset : 0;
		const scrollTop = document && document.documentElement ? document.documentElement.scrollTop : 0;
		return pageYOffset || scrollTop;
	}

}
