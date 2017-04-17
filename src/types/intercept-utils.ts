import {once, Lambda} from '../utils/utils';

export type IInterceptor<T> = (change: T) => T | null;

export interface IInterceptable<T> {
	interceptors: IInterceptor<T>[] | null;
	intercept(handler: IInterceptor<T>): Lambda;
}

export function registerInterceptor<T>(interceptable: IInterceptable<T>, handler: IInterceptor<T>): Lambda {
	const interceptors = interceptable.interceptors || (interceptable.interceptors = []);
	interceptors.push(handler);
	return once(() => {
		const idx = interceptors.indexOf(handler);
		if (idx !== -1) {
			interceptors.splice(idx, 1)
		}
	})
}