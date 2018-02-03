#!/usr/local/bin/node

// dummy object to experiement with
const item = { 'a' : 1,
	'b' : 2,
	'c' : 3,
	'd' : { 'apple' : 'red',
		'bannana' : 'yellow'},
	'e': 4};

// test the dot-accessor notation
console.log(item.a);
console.log(item.b);
console.log(item.d.apple);

// test the return type of an non-present key
let fruit = item.d.orange;

if (fruit) {
	console.log('got a fruit!!');
} else {
	console.log('null fruit');
}