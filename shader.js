/* =========================================================================
   Elec Training
   shader.js - "Neuro Noise" WebGL background for the Courses section.

   Adapted from Paper Shaders (https://shaders.paper.design/neuro-noise),
   licensed Apache-2.0, via the 21st.dev Shader Builder. The original export
   is a React component; this is a plain-JS port with the same uniforms.
   Cursor interaction and the 5-tap blur are dropped: both are unused at
   these settings and cost fill rate on a full-width background.

   Honours prefers-reduced-motion by drawing a single static frame.
   Pauses when the section is off screen or the tab is hidden.
   ========================================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('shader-canvas');
  if (!canvas || !window.WebGLRenderingContext) { return; }

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { return; }

  var VERT =
    'attribute vec2 a_position;' +
    'void main() { gl_Position = vec4(a_position, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec3 u_colors[8];',
    'uniform vec4 u_scene;',
    'uniform vec4 u_shape;',
    'uniform vec4 u_surface;',
    'uniform vec4 u_finish;',
    'uniform vec4 u_transform;',
    'uniform vec4 u_space;',
    '#define u_resolution u_scene.xy',
    '#define u_time u_scene.z',
    '#define u_colorCount u_scene.w',
    '#define u_scale u_shape.x',
    '#define u_intensity u_shape.y',
    '#define u_paramA u_shape.z',
    '#define u_warp u_shape.w',
    '#define u_detail u_surface.x',
    '#define u_contrast u_surface.y',
    '#define u_brightness u_surface.z',
    '#define u_saturation u_surface.w',
    '#define u_hue u_finish.x',
    '#define u_vignette u_finish.y',
    '#define u_grain u_finish.w',
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    '#define u_seed u_transform.x',
    '#else',
    '#define u_seed mod(u_transform.x, 31.0)',
    '#endif',
    '#define u_rotate u_transform.y',
    '#define u_drift u_transform.z',
    '#define u_oklab u_transform.w',
    '#define u_offset u_space.xy',
    'float hash21(vec2 p) {',
    '#ifndef GL_FRAGMENT_PRECISION_HIGH',
    '  p = mod(p, 31.0);',
    '#endif',
    '  p = fract(p * vec2(234.34, 435.345));',
    '  p += dot(p, p + 34.23);',
    '  return fract(p.x * p.y);',
    '}',
    'float grainHash(vec2 p) {',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),',
    '    u.y);',
    '}',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    'vec3 srgbToLinear(vec3 c) {',
    '  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),',
    '    step(0.04045, c));',
    '}',
    'vec3 linearToSrgb(vec3 c) {',
    '  return mix(c * 12.92,',
    '    1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,',
    '    step(0.0031308, c));',
    '}',
    'vec3 linToOklab(vec3 c) {',
    '  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;',
    '  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;',
    '  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;',
    '  l = pow(max(l, 0.0), 1.0 / 3.0);',
    '  m = pow(max(m, 0.0), 1.0 / 3.0);',
    '  s = pow(max(s, 0.0), 1.0 / 3.0);',
    '  return vec3(',
    '    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,',
    '    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,',
    '    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);',
    '}',
    'vec3 oklabToLin(vec3 c) {',
    '  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;',
    '  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;',
    '  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;',
    '  l = l * l * l; m = m * m * m; s = s * s * s;',
    '  return vec3(',
    '    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,',
    '    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,',
    '    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);',
    '}',
    'vec3 mixColour(vec3 a, vec3 b, float t) {',
    '  if (u_oklab > 0.5) {',
    '    vec3 la = linToOklab(srgbToLinear(a));',
    '    vec3 lb = linToOklab(srgbToLinear(b));',
    '    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);',
    '  }',
    '  return mix(a, b, t);',
    '}',
    'vec3 palette(float x) {',
    '  float n = max(u_colorCount - 1.0, 1.0);',
    '  float f = clamp(x, 0.0, 1.0) * n;',
    '  vec3 col = u_colors[0];',
    '  for (int i = 0; i < 7; i++) {',
    '    if (float(i) < n)',
    '      col = mixColour(col, u_colors[i + 1],',
    '        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));',
    '  }',
    '  return col;',
    '}',
    'vec3 hueRotate(vec3 col, float a) {',
    '  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,',
    '                          0.587, -0.274, -0.523,',
    '                          0.114, -0.322, 0.312);',
    '  const mat3 toRGB = mat3(1.0, 1.0, 1.0,',
    '                          0.956, -0.272, -1.106,',
    '                          0.621, -0.647, 1.703);',
    '  vec3 yiq = toYIQ * col;',
    '  float ca = cos(a), sa = sin(a);',
    '  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);',
    '  return toRGB * yiq;',
    '}',
    'vec3 shade(vec2 p, float t) {',
    '  vec2 q = p * (1.6 + u_intensity * 2.4);',
    '  float field = 0.0;',
    '  float weight = 0.55;',
    '  for (int i = 0; i < 6; i++) {',
    '    float fi = float(i);',
    '    q += vec2(',
    '      sin(q.y * (1.7 + fi * 0.09) + t * (0.35 + fi * 0.04) + u_seed),',
    '      cos(q.x * (1.5 + fi * 0.11) - t * (0.28 + fi * 0.03))',
    '    ) * (0.22 + u_intensity * 0.14);',
    '    float filaments = abs(sin(q.x + q.y + fi * 0.72));',
    '    field += weight / (0.08 + filaments);',
    '    weight *= 0.62;',
    '    q = q.yx * vec2(-1.08, 1.04);',
    '  }',
    '  float glow = 1.0 - exp(-field * (0.018 + u_paramA * 0.04));',
    '  return palette(clamp(glow, 0.0, 1.0));',
    '}',
    'void main() {',
    '  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)',
    '    / min(u_resolution.x, u_resolution.y);',
    '  p *= u_scale;',
    '  if (abs(u_rotate) > 0.0001) {',
    '    float cr = cos(u_rotate), sr = sin(u_rotate);',
    '    p = mat2(cr, -sr, sr, cr) * p;',
    '  }',
    '  p += u_offset;',
    '  if (u_drift > 0.0001)',
    '    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));',
    '  if (u_warp > 0.0) {',
    '    p += u_warp * (vec2(',
    '      fbm(p * u_detail + u_seed),',
    '      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);',
    '  }',
    '  vec3 col = shade(p, u_time);',
    '  if (abs(u_contrast - 1.0) > 0.0001)',
    '    col = (col - 0.5) * u_contrast + 0.5;',
    '  if (abs(u_saturation - 1.0) > 0.0001) {',
    '    float luma = dot(col, vec3(0.299, 0.587, 0.114));',
    '    col = mix(vec3(luma), col, u_saturation);',
    '  }',
    '  if (abs(u_hue) > 0.0001) col = hueRotate(col, u_hue);',
    '  if (abs(u_brightness) > 0.0001) col += u_brightness;',
    '  if (u_vignette > 0.0001) {',
    '    float vd = length(screenUv - 0.5) * 1.41421356;',
    '    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);',
    '  }',
    '  if (u_grain > 0.0001)',
    '    col += (grainHash(',
    '      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5)',
    '      * u_grain;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  var U = {
    colors: [
      // Remapped to the Elec Training palette: logo navy #13326b and the
      // blue ramp that runs through the rest of the page.
      0.925490, 0.925490, 0.925490,   // #ececec  light grey
      0.047059, 0.137255, 0.313725,   // #0c2350  navy deep
      0.000000, 0.400000, 0.800000,   // #0066cc  brand blue
      0.917647, 0.980392, 1.000000,   // #eafaff  near white
      0.662745, 0.827451, 0.976471,   // #a9d3f9  blue pale
      0.662745, 0.827451, 0.976471,
      0.662745, 0.827451, 0.976471,
      0.662745, 0.827451, 0.976471
    ],
    colorCount: 5,
    scale: 1.26, intensity: 0.35, paramA: 0.28, warp: 0.0,
    detail: 1.824, contrast: 1.005, brightness: 0.15, saturation: 1.3,
    hue: 0.0, vignette: 0.0, grain: 0.045,
    seed: 1.0, rotate: 0.0, offsetX: 0.0, offsetY: 0.0, drift: 0.204,
    oklab: 0.0, timeScale: 0.252
  };

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) {
        console.warn('shader compile failed:', gl.getShaderInfoLog(s));
      }
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { return; }

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { return; }
  gl.useProgram(program);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uni = {
    colors: gl.getUniformLocation(program, 'u_colors'),
    scene: gl.getUniformLocation(program, 'u_scene'),
    shape: gl.getUniformLocation(program, 'u_shape'),
    surface: gl.getUniformLocation(program, 'u_surface'),
    finish: gl.getUniformLocation(program, 'u_finish'),
    transform: gl.getUniformLocation(program, 'u_transform'),
    space: gl.getUniformLocation(program, 'u_space')
  };

  gl.uniform3fv(uni.colors, new Float32Array(U.colors));
  gl.uniform4f(uni.shape, U.scale, U.intensity, U.paramA, U.warp);
  gl.uniform4f(uni.surface, U.detail, U.contrast, U.brightness, U.saturation);
  gl.uniform4f(uni.finish, U.hue, U.vignette, 0.0, U.grain);
  gl.uniform4f(uni.transform, U.seed, U.rotate, U.drift, U.oklab);
  gl.uniform4f(uni.space, U.offsetX, U.offsetY, 0, 0);

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now();
  var raf = 0;
  var visible = document.visibilityState === 'visible';
  var inView = false;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) { return false; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rawW = Math.max(1, Math.round(rect.width * dpr));
    var rawH = Math.max(1, Math.round(rect.height * dpr));
    // Cap total pixels so a full-width section stays cheap to fill.
    var s = Math.min(1, Math.sqrt(2000000 / Math.max(1, rawW * rawH)));
    var w = Math.max(1, Math.round(rawW * s));
    var h = Math.max(1, Math.round(rawH * s));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    return true;
  }

  function draw(seconds) {
    if (!resize()) { return; }
    gl.uniform4f(uni.scene, canvas.width, canvas.height,
      seconds * U.timeScale, U.colorCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = 0;
    if (!visible || !inView) { return; }
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }

  function request() {
    if (reduced) { draw(0); return; }
    if (raf === 0 && visible && inView) { raf = requestAnimationFrame(frame); }
  }

  function stop() {
    if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; }
  }

  function onLayout() {
    if (reduced || raf === 0) { draw(reduced ? 0 : 0); }
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      inView = entries[0] ? entries[0].isIntersecting : true;
      if (inView) { request(); } else { stop(); }
    }, { rootMargin: '200px' }).observe(canvas);
  } else {
    inView = true;
    request();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(onLayout).observe(canvas);
  }
  window.addEventListener('resize', onLayout);

  document.addEventListener('visibilitychange', function () {
    visible = document.visibilityState === 'visible';
    if (visible) { request(); } else { stop(); }
  });
})();
