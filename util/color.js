/**
 * 
 * 
 */
/**
 * convert hex string to rgb array
 * @param {* hex} hex 
 */
function hex2rgb(hex) {
  let r = hex.substring(0, 2);
  let g = hex.substring(2, 4);
  let b = hex.substring(4, 6);
  r = parseInt(r, 16);
  g = parseInt(g, 16);
  b = parseInt(b, 16);
  return [r, g, b, hex];
}
/**
 * convert rgb array to hex string
 * @param {* red} r 
 * @param {* green} g 
 * @param {* blue} b 
 */
function rgb2hex(r, g, b) {
  if (r == "") r = 0;
  if (g == "") g = 0;
  if (b == "") b = 0;
  r = parseInt(r);
  g = parseInt(g);
  b = parseInt(b);
  if (r < 0) r = 0;
  if (g < 0) g = 0;
  if (b < 0) b = 0;
  if (r > 255) r = 255;
  if (g > 255) g = 255;
  if (b > 255) b = 255;
  let hex = r * 65536 + g * 256 + b;
  hex = hex.toString(16, 6);
  let len = hex.length;
  if (len < 6) {
    for (i = 0; i < 6 - len; i++) {
      hex = '0' + hex;
    }
  }
  return hex.toUpperCase();
}
/**
 * convert rgb array to hsv array
 * @param {* red} r 
 * @param {* green} g 
 * @param {* blue} b 
 */
function rgb2hsv(r, g, b) {
  if (r == "") r = 0;
  if (g == "") g = 0;
  if (b == "") b = 0;
  r = parseFloat(r);
  g = parseFloat(g);
  b = parseFloat(b);
  if (r < 0) r = 0;
  if (g < 0) g = 0;
  if (b < 0) b = 0;
  if (r > 255) r = 255;
  if (g > 255) g = 255;
  if (b > 255) b = 255;
  let hex = r * 65536 + g * 256 + b;
  hex = hex.toString(16, 6);
  let len = hex.length;
  if (len < 6) {
    for (i = 0; i < 6 - len; i++) {
      hex = '0' + hex;
    }
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let diff = max - min;
  if (diff == 0) h = 0;
  else if (max == r) h = ((g - b) / diff) % 6;
  else if (max == g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;
  h *= 60;
  if (h < 0) h += 360;
  let v = max;
  if (v == 0) {
    s = 0;
  }
  else {
    s = diff / v;
  }
  s *= 100;
  v *= 100;
  return [h.toFixed(0), s.toFixed(1), v.toFixed(1)];
}
/**
 * convert hsv array to rgb array
 * @param {* hue} h 
 * @param {* saturation} s 
 * @param {* brightness} v 
 */
function hsv2rgb(h, s, v) {
  if (h == "") h = 0;
  if (s == "") s = 0;
  if (v == "") v = 0;
  h = parseFloat(h);
  s = parseFloat(s);
  v = parseFloat(v);
  if (h < 0) h = 0;
  if (s < 0) s = 0;
  if (v < 0) v = 0;
  if (h >= 360) h = 359;
  if (s > 100) s = 100;
  if (v > 100) v = 100;
  s /= 100;
  v /= 100;
  C = v * s;
  let hh = h / 60;
  let X = C * (1 - Math.abs(hh % 2 - 1));
  r = g = b = 0;
  if (hh >= 0 && hh < 1) {
    r = C;
    g = X;
  }
  else if (hh >= 1 && hh < 2) {
    r = X;
    g = C;
  }
  else if (hh >= 2 && hh < 3) {
    g = C;
    b = X;
  }
  else if (hh >= 3 && hh < 4) {
    g = X;
    b = C;
  }
  else if (hh >= 4 && hh < 5) {
    r = X;
    b = C;
  }
  else {
    r = C;
    b = X;
  }
  m = v - C;
  r += m;
  g += m;
  b += m;
  r *= 255.0;
  g *= 255.0;
  b *= 255.0;
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  hex = r * 65536 + g * 256 + b;
  hex = hex.toString(16, 6);
  len = hex.length;
  if (len < 6) {
    for (i = 0; i < 6 - len; i++) {
      hex = '0' + hex;
    }
  }
  return [r, g, b, hex.toUpperCase()];
}

module.exports = {
  hex2rgb: hex2rgb,
  rgb2hex: rgb2hex,
  hsv2rgb: hsv2rgb,
  rgb2hsv: rgb2hsv
};