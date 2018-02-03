let secSinceEpoch = Date.now();
console.log(secSinceEpoch);

const date = new Date(secSinceEpoch);
console.log(date.toLocaleTimeString('en-US'));
const y = date.getFullYear();
const m = date.getMonth();
const d = date.getDate();
const hh = date.getHours();
const mm = date.getMinutes();
const ss = date.getSeconds();

console.log(d + "/" + m + "/" + y + " " + hh + ":" + mm + ":" + ss);