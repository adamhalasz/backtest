import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

if (typeof window !== 'undefined') {
	Object.defineProperty(window, 'ResizeObserver', {
		configurable: true,
		writable: true,
		value: ResizeObserverMock,
	});
}

if (typeof HTMLElement !== 'undefined') {
	HTMLElement.prototype.scrollIntoView = () => {};
}

afterEach(() => {
	cleanup();
});
