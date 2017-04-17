// import * as mobx from './src/mobx'
import * as test from 'tape'
import * as mobx from './src/mobx';
// import {observable, observe, computed, isObservable, isObservableObject, IObjectChange} from './src/mobx';

var m = mobx;
var observable = mobx.observable;
var computed = mobx.computed;
// var transaction = mobx.transaction;

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

test('basic', function(t) {
    var x = observable(3);
    var z = computed(function () { return x.get() * 2});
    var y = computed(function () { return x.get() * 3});

    m.observe(z, voidObserver);

    t.equal(z.get(), 6);
    t.equal(y.get(), 9);

    x.set(5);
    t.equal(z.get(), 10);
    t.equal(y.get(), 15);

    // t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})
