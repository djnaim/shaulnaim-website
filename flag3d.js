/* ============================================================
   flag3d.js : the Israeli flag as real cloth, rendered in WebGL.
   - Position-based cloth (Verlet) with structural, shear and bend links.
   - Aerodynamic wind: every triangle is pushed by the component of the
     relative wind along its normal, so the cloth snaps, rolls and flutters.
   - Gusts travel down the flag; gravity is real; the pole edge is sewn on.
   - Low, heroic 3D camera; key light, silk sheen, light through the cloth.
   - Official proportions (160 x 220; 15/25/80/25/15; star side 55, line 5.5).
   API: window.IsraeliFlag3D.mount(canvas, opts) -> { destroy } | null (no WebGL)
   ============================================================ */
(function (global) {
  'use strict';

  var BLUE = '#0038B8';

  /* ---------- flag texture (POT, official geometry) ---------- */
  function flagTexture() {
    var S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S;
    var g = c.getContext('2d');
    // draw in flag units (220 x 160), stretched to the square; the mesh restores the aspect
    g.scale(S / 220, S / 160);
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 220, 160);
    g.fillStyle = BLUE; g.fillRect(0, 15, 220, 25); g.fillRect(0, 120, 220, 25);
    var cx = 110, cy = 80, R = 55 / Math.sqrt(3);
    g.strokeStyle = BLUE; g.lineWidth = 5.5; g.lineJoin = 'miter'; g.miterLimit = 10;
    [-90, 90].forEach(function (s) {
      g.beginPath();
      for (var k = 0; k < 3; k++) { var a = (s + k * 120) * Math.PI / 180; g[k ? 'lineTo' : 'moveTo'](cx + R * Math.cos(a), cy + R * Math.sin(a)); }
      g.closePath(); g.stroke();
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
    // woven fabric: fine warp + weft
    g.globalAlpha = 0.012; g.fillStyle = '#0A1E4A';
    for (var y = 0; y < S; y += 3) g.fillRect(0, y, S, 1);
    for (var x = 0; x < S; x += 3) g.fillRect(x, 0, 1, S);
    g.globalAlpha = 1;
    // sleeve along the pole edge + stitched hem on the fly end
    var sl = S * 0.05, sg = g.createLinearGradient(0, 0, sl, 0);
    sg.addColorStop(0, 'rgba(10,30,74,.20)'); sg.addColorStop(.6, 'rgba(10,30,74,.03)'); sg.addColorStop(1, 'rgba(10,30,74,0)');
    g.fillStyle = sg; g.fillRect(0, 0, sl, S);
    g.fillStyle = 'rgba(10,30,74,.08)'; g.fillRect(sl, 0, 2, S); g.fillRect(S - 10, 0, 2, S);
    for (var yy = 4; yy < S; yy += 10) { g.fillRect(sl + 5, yy, 1.5, 5); g.fillRect(S - 6, yy, 1.5, 5); }
    return c;
  }

  /* ---------- tiny math ---------- */
  function persp(fovy, asp, n, f) {
    var t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
  }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }

  /* ---------- shaders ---------- */
  var VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUV;',
    'uniform mat4 uP, uV; varying vec3 vN; varying vec2 vUV; varying vec3 vW;',
    'void main(){ vN=aNor; vUV=aUV; vW=aPos; gl_Position=uP*uV*vec4(aPos,1.0); }'
  ].join('\n');
  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTex; uniform int uMode; uniform vec3 uEye; uniform vec3 uTint; uniform vec2 uRes;',
    'varying vec3 vN; varying vec2 vUV; varying vec3 vW;',
    'vec3 shoulder(vec3 c){ float m=max(c.r,max(c.g,c.b)); if(m>0.8){ c*= (0.8+0.2*(1.0-exp(-(m-0.8)/0.2)))/m; } return c; }',
    'void main(){',
    '  vec3 N=normalize(vN); vec3 V=normalize(uEye-vW);',
    '  if(dot(N,V)<0.0) N=-N;',
    '  vec3 L=normalize(vec3(-0.35,0.80,0.45));',                 // broad, soft key
    '  vec3 H=normalize(L+V); float nl=dot(N,L);',
    '  if(uMode==0){',
    '    vec3 base=pow(texture2D(uTex,vUV).rgb,vec3(2.2));',        // decode to linear
    '    float wrap=max(0.0,(nl+0.6)/1.6);',
    '    vec3 amb=vec3(0.716,0.791,0.913);',                         // cool ambient #DCE6F5
    '    float sheen=pow(max(dot(N,H),0.0),12.0)*0.045;',
    '    float trans=max(0.0,-nl)*0.06;',
    '    float rim=pow(1.0-max(dot(N,V),0.0),3.0)*0.025;',
    '    vec3 col=base*(0.40*amb+0.62*wrap)+vec3(sheen)+base*trans+vec3(rim);',
    '    col=shoulder(col);',
    '    vec2 suv=gl_FragCoord.xy/uRes;',                            // quiet the periphery
    '    float edge=smoothstep(0.55,1.0,max(abs(2.0*suv.x-1.0),abs(2.0*suv.y-1.0)));',
    '    col=mix(col,vec3(0.855,0.906,1.0),0.10*edge);',
    '    gl_FragColor=vec4(pow(col,vec3(1.0/2.2)),1.0);',            // encode once
    '  } else {',
    '    float d=max(nl,0.0); float s=pow(max(dot(N,H),0.0),70.0);',
    '    float env=0.5+0.5*N.y;',
    '    vec3 col=uTint*(0.35+0.55*d+0.25*env)+vec3(s)*0.9;',
    '    gl_FragColor=vec4(min(col,vec3(1.0)),1.0);',
    '  }',
    '}'
  ].join('\n');

  function mount(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) return null;

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var A = { pos: gl.getAttribLocation(prog, 'aPos'), nor: gl.getAttribLocation(prog, 'aNor'), uv: gl.getAttribLocation(prog, 'aUV') };
    var U = { P: gl.getUniformLocation(prog, 'uP'), V: gl.getUniformLocation(prog, 'uV'), tex: gl.getUniformLocation(prog, 'uTex'),
              mode: gl.getUniformLocation(prog, 'uMode'), res: gl.getUniformLocation(prog, 'uRes'), eye: gl.getUniformLocation(prog, 'uEye'), tint: gl.getUniformLocation(prog, 'uTint') };

    /* ---- texture ---- */
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flagTexture());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);

    /* ---- cloth ---- */
    var small = (canvas.clientWidth || 600) < 520;
    var C = small ? 28 : 58, R = Math.round(C * 160 / 220);
    var FW = 3.0, FH = FW * 160 / 220, top = FH / 2;
    var N = C * R, P = new Float32Array(N * 3), O = new Float32Array(N * 3), F = new Float32Array(N * 3), pin = new Uint8Array(N);
    var UV = new Float32Array(N * 2), NOR = new Float32Array(N * 3);
    for (var j = 0; j < R; j++) for (var i = 0; i < C; i++) {
      var k = j * C + i, x = i / (C - 1) * FW, y = top - j / (R - 1) * FH;
      P[k * 3] = O[k * 3] = x; P[k * 3 + 1] = O[k * 3 + 1] = y; P[k * 3 + 2] = O[k * 3 + 2] = 0;
      UV[k * 2] = i / (C - 1); UV[k * 2 + 1] = j / (R - 1);
      if (i === 0) pin[k] = 1;
    }
    var links = [];
    function link(a, b, stiff) { var dx = P[a*3]-P[b*3], dy = P[a*3+1]-P[b*3+1]; links.push(a, b, Math.hypot(dx, dy), stiff); }
    for (j = 0; j < R; j++) for (i = 0; i < C; i++) {
      var a = j * C + i;
      if (i < C - 1) link(a, a + 1, 1);
      if (j < R - 1) link(a, a + C, 1);
      if (i < C - 1 && j < R - 1) { link(a, a + C + 1, 0.9); link(a + 1, a + C, 0.9); }
      if (i < C - 2) link(a, a + 2, 0.4);
      if (j < R - 2) link(a, a + 2 * C, 0.4);
    }
    var L = new Float32Array(links);
    var IDX = [];
    for (j = 0; j < R - 1; j++) for (i = 0; i < C - 1; i++) { var q = j * C + i; IDX.push(q, q + 1, q + C, q + 1, q + C + 1, q + C); }
    var IND = new Uint16Array(IDX);

    /* ---- buffers ---- */
    function buf(data, usage) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; }
    var bPos = buf(P, gl.DYNAMIC_DRAW), bNor = buf(NOR, gl.DYNAMIC_DRAW), bUV = buf(UV, gl.STATIC_DRAW);
    var bIdx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, IND, gl.STATIC_DRAW);

    /* ---- pole + finial meshes ---- */
    function cylinder(r, y0, y1, seg) {
      var p = [], n = [], ix = [];
      for (var s = 0; s <= seg; s++) { var t = s / seg * Math.PI * 2, cx = Math.cos(t), cz = Math.sin(t);
        p.push(r * cx - r * 1.2, y0, r * cz, r * cx - r * 1.2, y1, r * cz); n.push(cx, 0, cz, cx, 0, cz); }
      for (s = 0; s < seg; s++) { var b0 = s * 2; ix.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); }
      return { p: new Float32Array(p), n: new Float32Array(n), i: new Uint16Array(ix) };
    }
    function sphere(r, cx, cy, seg) {
      var p = [], n = [], ix = [];
      for (var a = 0; a <= seg; a++) for (var b = 0; b <= seg; b++) {
        var th = a / seg * Math.PI, ph = b / seg * Math.PI * 2, x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        p.push(cx + r * x, cy + r * y, r * z); n.push(x, y, z);
      }
      for (a = 0; a < seg; a++) for (b = 0; b < seg; b++) { var q0 = a * (seg + 1) + b; ix.push(q0, q0 + seg + 1, q0 + 1, q0 + 1, q0 + seg + 1, q0 + seg + 2); }
      return { p: new Float32Array(p), n: new Float32Array(n), i: new Uint16Array(ix) };
    }
    var pr = 0.045;
    var poleM = cylinder(pr, -3.4, top + 0.16, 24), ballM = sphere(pr * 1.65, -pr * 1.2, top + 0.16 + pr * 1.55, 40);
    function meshBufs(m) { return { p: buf(m.p, gl.STATIC_DRAW), n: buf(m.n, gl.STATIC_DRAW),
      i: (function () { var b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.i, gl.STATIC_DRAW); return b; })(), c: m.i.length }; }
    var pole = meshBufs(poleM), ball = meshBufs(ballM);

    /* ---- simulation ---- */
    var t = 0, baseWind = opts.wind || 0.95, wind = baseWind, gustTarget = 0, gustNow = 0;
    function noise(x, y, z) { return Math.sin(x * 1.7 + z * 1.3) * Math.cos(y * 1.9 - z * 0.7) + 0.5 * Math.sin(x * 3.1 - y * 2.3 + z * 2.1); }
    function step(dt) {
      t += dt;
      // pointer gust: quick attack (~180ms), slow release (~1s)
      gustNow += (gustTarget - gustNow) * Math.min(1, dt / (gustTarget > gustNow ? 0.18 : 1.0));
      gustTarget *= Math.max(0, 1 - dt / 0.6);
      wind = Math.min(1.10, baseWind + gustNow);
      var gust = 1 + 0.22 * Math.sin(t * 0.35) + 0.08 * Math.sin(t * 0.9 + 1.1);   // breathing gusts
      var Wx = 14 * wind * gust, Wy = 0.6 * Math.sin(t * 0.8), Wz = 1.1 * wind * Math.sin(t * 0.37);
      F.fill(0);
      var drag = 0.11, lift = 0.02;
      for (var q = 0; q < IND.length; q += 3) {
        var a = IND[q] * 3, b = IND[q + 1] * 3, c = IND[q + 2] * 3;
        var e1x = P[b]-P[a], e1y = P[b+1]-P[a+1], e1z = P[b+2]-P[a+2], e2x = P[c]-P[a], e2y = P[c+1]-P[a+1], e2z = P[c+2]-P[a+2];
        var nx = e1y*e2z - e1z*e2y, ny = e1z*e2x - e1x*e2z, nz = e1x*e2y - e1y*e2x;
        var area2 = Math.hypot(nx, ny, nz) || 1e-6; nx /= area2; ny /= area2; nz /= area2;
        // travelling turbulence: eddies roll from the pole to the fly end
        var mx = (P[a] + P[b] + P[c]) / 3, my = (P[a+1] + P[b+1] + P[c+1]) / 3;
        var turb = noise(mx * 1.4 - t * 1.5, my * 1.6, t * 0.55);
        var vx = (P[a]-O[a] + P[b]-O[b] + P[c]-O[c]) / (3 * dt), vy = (P[a+1]-O[a+1] + P[b+1]-O[b+1] + P[c+1]-O[c+1]) / (3 * dt), vz = (P[a+2]-O[a+2] + P[b+2]-O[b+2] + P[c+2]-O[c+2]) / (3 * dt);
        var rx = Wx * (1 + 0.35 * turb) - vx, ry = Wy - vy, rz = Wz + 1.8 * wind * turb - vz;
        var dn = rx * nx + ry * ny + rz * nz;
        var f = drag * dn * Math.abs(dn) * area2 * 0.5;
        var fx = f * nx + lift * rx * area2, fy = f * ny + lift * ry * area2, fz = f * nz + lift * rz * area2;
        F[a] += fx; F[a+1] += fy; F[a+2] += fz; F[b] += fx; F[b+1] += fy; F[b+2] += fz; F[c] += fx; F[c+1] += fy; F[c+2] += fz;
      }
      var m = (FW * FH) / N * 0.45, g = -9.8, damp = 0.992, dt2 = dt * dt;
      for (var k = 0; k < N; k++) {
        if (pin[k]) continue;
        var k3 = k * 3;
        for (var d = 0; d < 3; d++) {
          var p = P[k3 + d], v = (p - O[k3 + d]) * damp;
          O[k3 + d] = p;
          P[k3 + d] = p + v + (F[k3 + d] / m + (d === 1 ? g : 0)) * dt2;
        }
      }
      for (var it = 0; it < 10; it++) {
        for (var l = 0; l < L.length; l += 4) {
          var i0 = L[l] * 3, i1 = L[l + 1] * 3, rest = L[l + 2], st = L[l + 3];
          var dx = P[i1]-P[i0], dy = P[i1+1]-P[i0+1], dz = P[i1+2]-P[i0+2];
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1e-6, corr = (dist - rest) / dist * st;
          var w0 = pin[L[l]] ? 0 : 1, w1 = pin[L[l + 1]] ? 0 : 1, ws = w0 + w1; if (!ws) continue;
          corr /= ws;
          P[i0] += dx*corr*w0; P[i0+1] += dy*corr*w0; P[i0+2] += dz*corr*w0;
          P[i1] -= dx*corr*w1; P[i1+1] -= dy*corr*w1; P[i1+2] -= dz*corr*w1;
        }
      }
      // the fly end can never cross back through the pole
      for (k = 0; k < N; k++) if (P[k * 3] < 0.02 && !pin[k]) P[k * 3] = 0.02;
    }
    function normals() {
      NOR.fill(0);
      for (var q = 0; q < IND.length; q += 3) {
        var a = IND[q] * 3, b = IND[q + 1] * 3, c = IND[q + 2] * 3;
        var e1x = P[b]-P[a], e1y = P[b+1]-P[a+1], e1z = P[b+2]-P[a+2], e2x = P[c]-P[a], e2y = P[c+1]-P[a+1], e2z = P[c+2]-P[a+2];
        var nx = e1y*e2z - e1z*e2y, ny = e1z*e2x - e1x*e2z, nz = e1x*e2y - e1y*e2x;
        NOR[a] += nx; NOR[a+1] += ny; NOR[a+2] += nz; NOR[b] += nx; NOR[b+1] += ny; NOR[b+2] += nz; NOR[c] += nx; NOR[c+1] += ny; NOR[c+2] += nz;
      }
    }

    /* ---- camera: low, heroic, three-quarter ---- */
    var eye0 = opts.eye || [-1.1, -1.05, 4.75], eye = eye0.slice(), drift = small ? 0.5 : 1, target = opts.target || [1.75, 0.22, 0.1];
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(global.devicePixelRatio || 1, small ? 1.25 : 1.5);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      var P2 = Math.PI * 2;
      eye[0] = eye0[0] + 0.035 * drift * Math.sin(P2 * t / 32);
      eye[1] = eye0[1] + 0.018 * drift * Math.sin(P2 * t / 41);
      eye[2] = eye0[2] + 0.045 * drift * Math.sin(P2 * t / 38);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.uniformMatrix4fv(U.P, false, new Float32Array(persp(opts.fov || 0.62, canvas.width / canvas.height, 0.1, 50)));
      gl.uniformMatrix4fv(U.V, false, new Float32Array(lookAt(eye, target, [0, 1, 0])));
      gl.uniform3fv(U.eye, eye);
      // cloth
      normals();
      gl.uniform1i(U.mode, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.tex, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P); gl.enableVertexAttribArray(A.pos); gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bNor); gl.bufferSubData(gl.ARRAY_BUFFER, 0, NOR); gl.enableVertexAttribArray(A.nor); gl.vertexAttribPointer(A.nor, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bUV); gl.enableVertexAttribArray(A.uv); gl.vertexAttribPointer(A.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.drawElements(gl.TRIANGLES, IND.length, gl.UNSIGNED_SHORT, 0);
      // pole + finial
      gl.disableVertexAttribArray(A.uv); gl.vertexAttrib2f(A.uv, 0, 0);
      [[pole, [0.80, 0.83, 0.90]], [ball, [0.86, 0.68, 0.22]]].forEach(function (pm) {
        var m = pm[0]; gl.uniform1i(U.mode, 1); gl.uniform3fv(U.tint, pm[1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.vertexAttribPointer(A.nor, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); gl.drawElements(gl.TRIANGLES, m.c, gl.UNSIGNED_SHORT, 0);
      });
    }

    /* ---- loop ---- */
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = 0, running = false, paused = false, last = 0, acc = 0, visible = true, warm = 0, lastDraw = 0;
    var FIX = 1 / 120, minFrame = small ? 1000 / 30 : 0;
    function warmup(done) {           // settle the cloth in small batches so the page never stalls
      var t0 = global.performance ? performance.now() : 0; while (warm < 240 && (!global.performance || performance.now() - t0 < 3)) { step(FIX); warm++; }
      if (warm < 240) global.requestAnimationFrame(function () { warmup(done); }); else done();
    }
    function frame(ts) {
      if (!running) return;
      raf = global.requestAnimationFrame(frame);
      if (minFrame && ts - lastDraw < minFrame) return;
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 1 / 60; last = ts; lastDraw = ts;
      acc += dt; var n = 0;
      while (acc >= FIX && n < 8) { step(FIX); acc -= FIX; n++; }
      if (n === 8) acc = 0;
      draw();
    }
    function start() { if (running || reduced || paused || !visible || warm < 240) return; running = true; last = 0; acc = 0; raf = global.requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) global.cancelAnimationFrame(raf); }
    var io = null, onVis = function () { document.hidden ? stop() : start(); };
    warmup(function () {
      draw(); canvas.classList.add('flag-ready');
      if (global.IntersectionObserver) { io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }); io.observe(canvas); }
      else start();
      document.addEventListener('visibilitychange', onVis);
      global.addEventListener('resize', function () { if (!running) draw(); });
    });
    return {
      destroy: function () { stop(); if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); },
      pause: function () { paused = true; stop(); },
      resume: function () { paused = false; start(); },
      isPaused: function () { return paused || reduced; },
      gust: function (amount) { gustTarget = Math.max(gustTarget, Math.min(0.15, amount)); }
    };
  }

  global.IsraeliFlag3D = { mount: function (c, o) { try { return mount(c, o); } catch (e) { if (global.console) console.warn('flag3d', e); return null; } } };
})(window);
