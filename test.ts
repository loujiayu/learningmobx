// import * as mobx from './src/mobx'
import * as test from 'tape'
import * as mobx from './src/mobx';
// import {observable, observe, computed, isObservable, isObservableObject, IObjectChange} from './src/mobx';

var m = mobx;
var observable = mobx.observable;
var computed = mobx.computed;
var reaction = mobx.reaction;

var voidObserver = function(){};

function buffer() {
    var b: number[] = [];
    var res = function(x) {
        b.push(x.newValue);
    };
    res.toArray = function() {
        return b;
    }
    return res;
}

test('basic', t => {
	var a = mobx.observable(1);
	var values = [];

	var d = reaction(() => a.get(), newValue => {
		values.push(newValue);
	})

	a.set(2);
	a.set(3);
	d();
	a.set(4);

	t.deepEqual(values, [2, 3]);
	t.end();
})