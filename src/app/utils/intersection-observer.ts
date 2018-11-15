
export default class IntersectionObserver {

	element: Element;

	constructor(element: Element, options: any) {
		this.element = element;
		this.addIntersectionObserver(element);
	}

	addIntersectionObserver(element: Element) {
		// require('intersection-observer'); // use require for polyfill
		const options = {
			root: null,
			rootMargin: '0px',
			threshold: this.intersectionObserverThresholds(100),
		};
		const observer = new IntersectionObserver((entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
			entries.forEach((entry: IntersectionObserverEntry) => {
				console.log(entry);
			});
		}, options);
		observer.observe(element);
	}

	intersectionObserverThresholds(steps: number = 1) {
		const thresholds = [];
		for (let i = 1.0; i <= steps; i++) {
			const ratio = i / steps;
			thresholds.push(ratio);
		}
		thresholds.push(0);
		return thresholds;
	}

}
