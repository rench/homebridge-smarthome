/*
With these functions you can convert the CIE color space to the RGB color space and vice versa.
The developer documentation for Philips Hue provides the formulas used in the code below:
https://developers.meethue.com/documentation/color-conversions-rgb-xy
I've used the formulas and Objective-C example code and transfered it to JavaScript.
Examples:
var rgb = cie_to_rgb(0.6611, 0.2936)
var cie = rgb_to_cie(255, 39, 60)
------------------------------------------------------------------------------------
The MIT License (MIT)
Copyright (c) 2017 www.usolved.net
Published under https://github.com/usolved/cie-rgb-converter
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
@author lo.wang
@link https://github.com/rench
@email 185656156@qq.com
*/

var default_gamut = { // Default colour gamut.
  r: [1.0000, 0.0000],
  g: [0.0000, 1.0000],
  b: [0.0000, 0.0000]
};

module.exports = {
  cie_to_rgb: cie_to_rgb,
  rgb_to_cie: rgb_to_cie,
  hkhue_to_cie: hkhue_to_cie,
  cie_to_hkhue: cie_to_hkhue,
  hkhue_to_rgb: hkhue_to_rgb,
  rgb_to_hkhue: rgb_to_hkhue,
  default_gamut: default_gamut
}

function hkhue_to_rgb(hue, sat, gamut) {
  var cie = hkhue_to_cie(hue, sat, gamut ? gamut : default_gamut);
  return cie_to_rgb(cie[0], cie[1]);
}

function rgb_to_hkhue(r, g, b) {
  var cie = rgb_to_cie(r, g, b);
  return cie_to_hkhue(cie, default_gamut);
}




// Return point in color gamut closest to p.
function closestInGamut(p, gamut) {
  // Return cross product of two points.
  function crossProduct(p1, p2) {
    return p1.x * p2.y - p1.y * p2.x;
  }

  // Return distance between two points.
  function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Return point on line a,b closest to p.
  function closest(a, b, p) {
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const ab = { x: b.x - a.x, y: b.y - a.y };
    let t = (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y);
    t = t < 0.0 ? 0.0 : t > 1.0 ? 1.0 : t;
    return { x: a.x + t * ab.x, y: a.y + t * ab.y };
  }

  const R = { x: gamut.r[0], y: gamut.r[1] };
  const G = { x: gamut.g[0], y: gamut.g[1] };
  const B = { x: gamut.b[0], y: gamut.b[1] };
  const v1 = { x: G.x - R.x, y: G.y - R.y };
  const v2 = { x: B.x - R.x, y: B.y - R.y };
  const v = crossProduct(v1, v2);
  const q = { x: p.x - R.x, y: p.y - R.y };
  const s = crossProduct(q, v2) / v;
  const t = crossProduct(v1, q) / v;
  if (s >= 0.0 && t >= 0.0 && s + t <= 1.0) {
    return p;
  }
  const pRG = closest(R, G, p);
  const pGB = closest(G, B, p);
  const pBR = closest(B, R, p);
  const dRG = distance(p, pRG);
  const dGB = distance(p, pGB);
  const dBR = distance(p, pBR);
  let min = dRG;
  p = pRG;
  if (dGB < min) {
    min = dGB;
    p = pGB;
  }
  if (dBR < min) {
    p = pBR;
  }
  return p;
}

// Transform bridge xy values [0.0000, 1.0000]
// to homekit hue value [0˚, 360˚] and saturation value [0%, 100%].
function cie_to_hkhue(xy, gamut) {
  gamut = gamut ? gamut : default_gamut
  // Inverse Gamma correction (sRGB Companding).
  function compand(v) {
    return v <= 0.0031308 ?
      12.92 * v : (1.0 + 0.055) * Math.pow(v, (1.0 / 2.4)) - 0.055;
  }

  function rescale() {
    if (R > G && R > B && R > 1.0) {
      G /= R; B /= R; R = 1.0;
    } else if (G > R && G > B && G > 1.0) {
      R /= G; B /= G; G = 1.0;
    } else if (B > R && B > G && B > 1.0) {
      R /= B; G /= B; B = 1.0;
    }
  }

  // xyY to XYZ to RGB
  // See: http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  const p = closestInGamut({ x: xy[0], y: xy[1] }, gamut);
  const x = p.x;
  const y = p.y === 0.0 ? 0.0001 : p.y;
  const z = 1.0 - x - y;
  const Y = 1.0;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;
  let R = X * 1.656492 + Y * -0.354851 + Z * -0.255038;
  let G = X * -0.707196 + Y * 1.655397 + Z * 0.036152;
  let B = X * 0.051713 + Y * -0.121364 + Z * 1.011530;
  rescale();
  R = compand(R);
  G = compand(G);
  B = compand(B);
  rescale();

  // RGB to HSV
  // See: https://en.wikipedia.org/wiki/HSL_and_HSV
  const M = Math.max(R, G, B);
  const m = Math.min(R, G, B);
  const C = M - m;
  let S = (M === 0.0) ? 0.0 : C / M;
  S = S > 1.0 ? 1.0 : S;			// Deal with negative RGB.
  let H;
  switch (M) {
    case m:
      H = 0.0;
      break;
    case R:
      H = (G - B) / C;
      if (H < 0) {
        H += 6.0;
      }
      break;
    case G:
      H = (B - R) / C;
      H += 2.0;
      break;
    case B:
      H = (R - G) / C;
      H += 4.0;
      break;
  }
  H /= 6.0;
  return { hue: Math.round(H * 360), sat: Math.round(S * 100) };
}

// Transform homekit hue value [0˚, 360˚] and saturation value [0%, 100%]
// to bridge xy values [0.0, 1.0].
function hkhue_to_cie(hue, sat, gamut) {
  gamut = gamut ? gamut : default_gamut;
  // Gamma correction (inverse sRGB Companding).
  function invCompand(v) {
    return v > 0.04045 ? Math.pow((v + 0.055) / (1.0 + 0.055), 2.4) : v / 12.92;
  }

  // HSV to RGB
  // See: https://en.wikipedia.org/wiki/HSL_and_HSV
  let H = hue / 360.0;
  const S = sat / 100.0;
  const V = 1;
  const C = V * S;
  H *= 6;
  const m = V - C;
  let x = (H % 2) - 1.0;
  if (x < 0) {
    x = -x;
  }
  x = C * (1.0 - x);
  let R, G, B;
  switch (Math.floor(H) % 6) {
    case 0: R = C + m; G = x + m; B = m; break;
    case 1: R = x + m; G = C + m; B = m; break;
    case 2: R = m; G = C + m; B = x + m; break;
    case 3: R = m; G = x + m; B = C + m; break;
    case 4: R = x + m; G = m; B = C + m; break;
    case 5: R = C + m; G = m; B = x + m; break;
  }

  // RGB to XYZ to xyY
  // See: http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  const linearR = invCompand(R);
  const linearG = invCompand(G);
  const linearB = invCompand(B);
  const X = linearR * 0.664511 + linearG * 0.154324 + linearB * 0.162028;
  const Y = linearR * 0.283881 + linearG * 0.668433 + linearB * 0.047685;
  const Z = linearR * 0.000088 + linearG * 0.072310 + linearB * 0.986039;
  const sum = X + Y + Z;
  const p = sum === 0.0 ? { x: 0.0, y: 0.0 } : { x: X / sum, y: Y / sum };
  const q = closestInGamut(p, gamut);
  return [Math.round(q.x * 10000) / 10000, Math.round(q.y * 10000) / 10000];
}




/**
 * Converts CIE color space to RGB color space
 * @param {Number} x
 * @param {Number} y
 * @param {Number} brightness - Ranges from 1 to 254
 * @return {Array} Array that contains the color values for red, green and blue
 */
function cie_to_rgb(x, y, brightness) {
  //Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
  if (brightness === undefined) {
    brightness = 254;
  }

  var z = 1.0 - x - y;
  var Y = (brightness / 254).toFixed(2);
  var X = (Y / y) * x;
  var Z = (Y / y) * z;

  //Convert to RGB using Wide RGB D65 conversion
  var red = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  var green = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  var blue = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

  //If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
  if (red > blue && red > green && red > 1.0) {

    green = green / red;
    blue = blue / red;
    red = 1.0;
  }
  else if (green > blue && green > red && green > 1.0) {

    red = red / green;
    blue = blue / green;
    green = 1.0;
  }
  else if (blue > red && blue > green && blue > 1.0) {

    red = red / blue;
    green = green / blue;
    blue = 1.0;
  }

  //Reverse gamma correction
  red = red <= 0.0031308 ? 12.92 * red : (1.0 + 0.055) * Math.pow(red, (1.0 / 2.4)) - 0.055;
  green = green <= 0.0031308 ? 12.92 * green : (1.0 + 0.055) * Math.pow(green, (1.0 / 2.4)) - 0.055;
  blue = blue <= 0.0031308 ? 12.92 * blue : (1.0 + 0.055) * Math.pow(blue, (1.0 / 2.4)) - 0.055;


  //Convert normalized decimal to decimal
  red = Math.round(red * 255);
  green = Math.round(green * 255);
  blue = Math.round(blue * 255);

  if (isNaN(red))
    red = 0;

  if (isNaN(green))
    green = 0;

  if (isNaN(blue))
    blue = 0;


  return [red, green, blue];
}


/**
 * Converts RGB color space to CIE color space
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @return {Array} Array that contains the CIE color values for x and y
 */
function rgb_to_cie(red, green, blue) {
  //Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
  var red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
  var green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
  var blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

  //RGB values to XYZ using the Wide RGB D65 conversion formula
  var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
  var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
  var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

  //Calculate the xy values from the XYZ values
  var x = (X / (X + Y + Z)).toFixed(4);
  var y = (Y / (X + Y + Z)).toFixed(4);

  if (isNaN(x))
    x = 0;

  if (isNaN(y))
    y = 0;


  return [x, y];
}