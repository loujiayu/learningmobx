import {IComputedValue, ComputedValue} from '../core/computedvalue';

export interface IComputedValueOptions<T> {
	compareStructural?: boolean;
	struct?: boolean;
	name?: string;
	setter?: (value: T) => void;
	context?: any;
}

export interface IComputed {
	<T>(func: () => T, setter?: (value: T) => void): IComputedValue<T>;
	<T>(func: () => T, options: IComputedValueOptions<T>): IComputedValue<T>;
	(target: Object, key: string | symbol, baseDescriptor?: PropertyDescriptor): void;
	struct(target: Object, key: string | symbol, baseDescriptor?: PropertyDescriptor): void;
}

export var computed: IComputed = (
  function computed(arg1, arg2, arg3) {
    if (typeof arg2 === 'string') {
      // return compu
    }

    const opts: IComputedValueOptions<any> = typeof arg2 === 'object' ? arg2 : {};
    opts.setter = typeof arg2 === "function" ? arg2 : opts.setter;
    return new ComputedValue(arg1, opts.context, opts.compareStructural || opts.struct || false, opts.name || arg1.name || "", opts.setter);
  }
) as any;