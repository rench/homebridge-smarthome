const color = require('../util/color');

console.log(color.rgb2hsv(230, 80, 80));
console.log(color.hsv2rgb(0, 65.2, 90.2));

console.log(color.rgb2hex(230, 80, 80));
console.log(color.hex2rgb('E65050'));