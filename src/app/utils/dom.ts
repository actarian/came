/* global window, document, console, GlslCanvas, Swiper, TweenLite */

export default class Dom {

	static log(...args: any[]) {
		// const s = args.join(', ');
		const items = ['%c%s', 'background: #1976d2; color: #fff; border-radius: 3px; padding: 4px 8px; margin-bottom: 4px;'].concat(args) as [any?, ...any[]];
		console.log.apply(this, items);
	}

	static fragmentFirstElement(fragment: DocumentFragment): HTMLElement {
		return Array.prototype.slice.call(fragment.children).find((x: Node) => x.nodeType === Node.ELEMENT_NODE);
	}

	static fragmentFromHTML(html: string): DocumentFragment {
		return document.createRange().createContextualFragment(html);
	}

	static scrollTop(): number {
		const pageYOffset = window ? window.pageXOffset : 0;
		const scrollTop = document && document.documentElement ? document.documentElement.scrollTop : 0;
		return pageYOffset || scrollTop;
	}

}
