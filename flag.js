/*!
 * IsraeliFlag - self-contained, dependency-free waving Israeli-flag cloth simulation.
 *
 * Usage:
 *   <canvas id="flag" style="width:480px;height:360px"></canvas>
 *   <script src="flag.js"></script>
 *   <script>
 *     var handle = IsraeliFlag.mount(document.getElementById('flag'), {
 *       transparentBackground: true,
 *       windStrength: 1,
 *       poleColor: '#C9A227',
 *       showPole: true
 *     });
 *     // handle.destroy();  // to tear everything down
 *   </script>
 *
 * Real cloth: 3D mass-spring particle grid, Verlet integration, structural +
 * shear + bend constraints, layered-noise wind turbulence + gravity, left edge
 * pinned to a gold flagpole, trailing-edge whip, per-vertex-normal fold shading.
 * The Israeli flag (white field, two blue stripes, Star of David) is drawn to an
 * offscreen canvas and affine-warped triangle-by-triangle across the deformed
 * mesh so the stripes and star bend and stretch with the cloth.
 *
 * Respects prefers-reduced-motion (one static frame), pauses when scrolled
 * offscreen (IntersectionObserver), handles devicePixelRatio + resize, and caps
 * grid density for a steady ~60fps. No external dependencies, no CDN.
 */
(function (global) {
  'use strict';

  var FLAG_WHITE = '#FFFFFF';
  var FLAG_BLUE = '#0038B8';       // Israeli-flag blue
  var SHADOW_NAVY = '10,30,74';    // #0A1E4A as rgb for shading overlay
  var FLAG_ASPECT = 11 / 8;        // width : height

  // -------------------------------------------------------------------------
  // Offscreen Israeli-flag texture
  // -------------------------------------------------------------------------
  function buildFlagTexture() {
    var texH = 440;
    var texW = Math.round(texH * FLAG_ASPECT); // 605
    var c = document.createElement('canvas');
    c.width = texW;
    c.height = texH;
    var g = c.getContext('2d');

    // White field
    g.fillStyle = FLAG_WHITE;
    g.fillRect(0, 0, texW, texH);

    // Two horizontal blue stripes (~1/8 height each), inset ~1/8 from top/bottom.
    var stripeH = texH * 0.125;
    var inset = texH * 0.145;
    g.fillStyle = FLAG_BLUE;
    g.fillRect(0, inset, texW, stripeH);                       // top stripe
    g.fillRect(0, texH - inset - stripeH, texW, stripeH);      // bottom stripe

    // Star of David (hexagram = two overlapping equilateral triangles, outline).
    var cx = texW / 2;
    var cy = texH / 2;
    var R = texH * 0.215;                 // circumradius of each triangle
    var lw = R * 0.155;                   // stroke width
    g.strokeStyle = FLAG_BLUE;
    g.lineWidth = lw;
    g.lineJoin = 'miter';
    g.miterLimit = 6;

    function tri(startDeg) {
      g.beginPath();
      for (var k = 0; k < 3; k++) {
        var a = (startDeg + k * 120) * Math.PI / 180;
        var x = cx + R * Math.cos(a);
        var y = cy + R * Math.sin(a);
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
    }
    tri(-90); // upward-pointing triangle
    tri(90);  // downward-pointing triangle

    return { canvas: c, w: texW, h: texH };
  }

  // -------------------------------------------------------------------------
  // Layered-noise turbulence (cheap, deterministic, smooth)
  // -------------------------------------------------------------------------
  function turbulence(x, y, t) {
    return (
      0.55 * Math.sin(x * 1.7 + t * 1.9) +
      0.30 * Math.sin(y * 2.3 - t * 1.3 + x * 0.7) +
      0.20 * Math.sin((x + y) * 1.1 + t * 2.7) +
      0.12 * Math.sin(x * 4.1 - y * 1.3 + t * 3.6)
    );
  }

  // -------------------------------------------------------------------------
  // Mount
  // -------------------------------------------------------------------------
  function mount(canvas, opts) {
    if (!canvas || !canvas.getContext) {
      throw new Error('IsraeliFlag.mount: a <canvas> element is required');
    }
    opts = opts || {};
    var o = {
      transparentBackground: opts.transparentBackground !== false,
      windStrength: typeof opts.windStrength === 'number' ? opts.windStrength : 1,
      poleColor: opts.poleColor || '#C9A227',
      showPole: opts.showPole !== false
    };

    var ctx = canvas.getContext('2d');
    var tex = buildFlagTexture();

    var reducedMotion =
      global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Simulation state (rebuilt on layout).
    var dpr = 1;
    var W = 0, H = 0;                 // device pixels
    var cols = 0, rows = 0;
    var px, py, pz, ox, oy, oz;      // current + previous positions (flat arrays)
    var pinned;                       // Uint8Array
    var constraints = [];             // {a,b,rest}
    var flagLeft = 0, flagTop = 0, flagW = 0, flagH = 0;
    var poleX = 0, poleW = 0;
    var t = 0;                        // simulation time
    var rafId = 0;
    var running = false;
    var visible = true;
    var lastTs = 0;

    var LIGHT = normalize3(-0.35, -0.45, 0.82);

    function idx(i, j) { return j * cols + i; }

    function buildGrid() {
      // Density capped for steady 60fps.
      cols = clamp(Math.round(flagW / (16 * dpr)), 16, 42);
      rows = clamp(Math.round(cols / FLAG_ASPECT), 12, 34);

      var n = cols * rows;
      px = new Float64Array(n); py = new Float64Array(n); pz = new Float64Array(n);
      ox = new Float64Array(n); oy = new Float64Array(n); oz = new Float64Array(n);
      pinned = new Uint8Array(n);

      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var id = idx(i, j);
          var x = flagLeft + (i / (cols - 1)) * flagW;
          var y = flagTop + (j / (rows - 1)) * flagH;
          px[id] = ox[id] = x;
          py[id] = oy[id] = y;
          pz[id] = oz[id] = 0;
          if (i === 0) pinned[id] = 1; // left edge pinned to the pole
        }
      }

      // Constraints: structural + shear + bend.
      constraints = [];
      function add(i0, j0, i1, j1) {
        if (i1 < 0 || i1 >= cols || j1 < 0 || j1 >= rows) return;
        var a = idx(i0, j0), b = idx(i1, j1);
        var dx = px[a] - px[b], dy = py[a] - py[b], dz = pz[a] - pz[b];
        constraints.push({ a: a, b: b, rest: Math.sqrt(dx * dx + dy * dy + dz * dz) });
      }
      for (var jj = 0; jj < rows; jj++) {
        for (var ii = 0; ii < cols; ii++) {
          add(ii, jj, ii + 1, jj);       // structural (horizontal)
          add(ii, jj, ii, jj + 1);       // structural (vertical)
          add(ii, jj, ii + 1, jj + 1);   // shear
          add(ii, jj, ii + 1, jj - 1);   // shear
          add(ii, jj, ii + 2, jj);       // bend (horizontal)
          add(ii, jj, ii, jj + 2);       // bend (vertical)
        }
      }
    }

    function layout() {
      dpr = global.devicePixelRatio || 1;
      var cssW = canvas.clientWidth || canvas.width || 480;
      var cssH = canvas.clientHeight || canvas.height || 360;
      W = Math.max(1, Math.round(cssW * dpr));
      H = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      var pad = Math.min(W, H) * 0.06;
      poleW = o.showPole ? Math.max(6 * dpr, W * 0.014) : 0;
      var finialR = o.showPole ? poleW * 1.6 : 0;
      poleX = o.showPole ? pad + finialR : 0;

      var availLeft = poleX + poleW;
      var availW = W - availLeft - pad;
      var availH = H - pad * 2 - (o.showPole ? finialR * 1.2 : 0);

      // Fit an 11:8 flag inside the available box.
      flagW = availW;
      flagH = flagW / FLAG_ASPECT;
      if (flagH > availH) {
        flagH = availH;
        flagW = flagH * FLAG_ASPECT;
      }
      flagLeft = availLeft;
      flagTop = (H - flagH) / 2 + (o.showPole ? finialR * 0.4 : 0);

      buildGrid();
    }

    // Verlet integration step.
    function simulate(dt) {
      t += dt;
      var damping = 0.982;
      var g = 30 * dpr;                       // gravity (device px / s^2) - light, so wind holds the flag out
      var wind = o.windStrength;
      var n = cols * rows;

      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var id = idx(i, j);
          if (pinned[id]) {
            // Gentle vertical breathing along the pinned edge keeps it alive.
            continue;
          }
          var frac = i / (cols - 1);                 // 0 at pole, 1 at free edge
          var whip = 0.35 + frac * frac * 2.2;       // trailing-edge whip

          var nx = px[id] / (120 * dpr);
          var ny = py[id] / (120 * dpr);
          var turb = turbulence(nx, ny, t);
          var gust = 0.82 + 0.24 * Math.sin(t * 0.6 + frac * 2.0);   // never falls to a dead calm
          var wave = Math.sin(frac * 7.0 - t * 2.4);                 // ripples travelling pole -> free edge

          // Strong, steady +x wind holds the flag out taut (dominates gravity); the +z term rolls
          // a deep billow PLUS a travelling wave so the cloth shows real, pretty S-curve folds.
          var ax = wind * (118 * dpr) * whip * (0.78 + 0.22 * turb);
          var az = wind * whip * ((88 * dpr) * gust * (0.55 + 0.45 * turb) + (58 * dpr) * wave);
          var ay = g + wind * (9 * dpr) * whip * Math.sin(t * 1.3 + turb);

          // Verlet: x' = x + (x - xo)*damping + a*dt^2
          var vx = (px[id] - ox[id]) * damping;
          var vy = (py[id] - oy[id]) * damping;
          var vz = (pz[id] - oz[id]) * damping;
          ox[id] = px[id]; oy[id] = py[id]; oz[id] = pz[id];
          px[id] += vx + ax * dt * dt;
          py[id] += vy + ay * dt * dt;
          pz[id] += vz + az * dt * dt;
        }
      }

      // Constraint relaxation.
      var iters = 4;
      for (var k = 0; k < iters; k++) {
        for (var c = 0; c < constraints.length; c++) {
          var con = constraints[c];
          var a = con.a, b = con.b;
          var dx = px[b] - px[a];
          var dy = py[b] - py[a];
          var dz = pz[b] - pz[a];
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
          var diff = (d - con.rest) / d * 0.5;
          var mvx = dx * diff, mvy = dy * diff, mvz = dz * diff;
          var pa = pinned[a], pb = pinned[b];
          if (pa && pb) continue;
          if (!pa && !pb) {
            px[a] += mvx; py[a] += mvy; pz[a] += mvz;
            px[b] -= mvx; py[b] -= mvy; pz[b] -= mvz;
          } else if (pa) {
            px[b] -= mvx * 2; py[b] -= mvy * 2; pz[b] -= mvz * 2;
          } else {
            px[a] += mvx * 2; py[a] += mvy * 2; pz[a] += mvz * 2;
          }
        }
      }

      // Anti-collapse envelope: keep every vertex inside a flag-shaped box so a
      // wind lull, resize, or instability can NEVER fold the cloth into a rag.
      // Limits are generous, so in a normal breeze they almost never engage.
      var zLim = flagW * 0.46;
      var topLim = flagTop - flagH * 0.30;
      var botLim = flagTop + flagH * 1.30;
      for (var jc = 0; jc < rows; jc++) {
        for (var ic = 1; ic < cols; ic++) {          // column 0 is pinned to the pole
          var idc = idx(ic, jc);
          var fr = ic / (cols - 1);
          var minX = flagLeft + fr * flagW * 0.55;   // free edge can't curl back past 55% extension
          var maxX = flagLeft + flagW + flagW * 0.10;
          if (px[idc] < minX) px[idc] = minX;
          else if (px[idc] > maxX) px[idc] = maxX;
          if (py[idc] < topLim) py[idc] = topLim;
          else if (py[idc] > botLim) py[idc] = botLim;
          if (pz[idc] > zLim) pz[idc] = zLim;
          else if (pz[idc] < -zLim) pz[idc] = -zLim;
        }
      }
    }

    // Perspective projection (device px) - returns screen x/y for a vertex.
    function projX(id, cxp) { var f = 900 * dpr; return cxp + (px[id] - cxp) * f / (f - pz[id]); }
    function projY(id, cyp) { var f = 900 * dpr; return cyp + (py[id] - cyp) * f / (f - pz[id]); }

    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!o.transparentBackground) {
        ctx.fillStyle = '#0A1E4A';
        ctx.fillRect(0, 0, W, H);
      }

      var cxp = flagLeft + flagW / 2;
      var cyp = flagTop + flagH / 2;

      // Pole (behind the cloth's pinned edge).
      if (o.showPole) drawPole(cxp, cyp);

      // Precompute projected screen coords + per-vertex normals.
      var n = cols * rows;
      var sx = new Float64Array(n), sy = new Float64Array(n);
      var inten = new Float64Array(n);
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var id = idx(i, j);
          sx[id] = projX(id, cxp);
          sy[id] = projY(id, cyp);
          inten[id] = vertexIntensity(i, j);
        }
      }

      var texStepU = tex.w / (cols - 1);
      var texStepV = tex.h / (rows - 1);

      for (var jj = 0; jj < rows - 1; jj++) {
        for (var ii = 0; ii < cols - 1; ii++) {
          var a = idx(ii, jj), b = idx(ii + 1, jj);
          var cc = idx(ii + 1, jj + 1), d = idx(ii, jj + 1);
          var u0 = ii * texStepU, u1 = (ii + 1) * texStepU;
          var v0 = jj * texStepV, v1 = (jj + 1) * texStepV;

          // Triangle 1: a, b, c
          drawTexTri(
            sx[a], sy[a], sx[b], sy[b], sx[cc], sy[cc],
            u0, v0, u1, v0, u1, v1
          );
          shadeTri(sx[a], sy[a], sx[b], sy[b], sx[cc], sy[cc],
            (inten[a] + inten[b] + inten[cc]) / 3);

          // Triangle 2: a, c, d
          drawTexTri(
            sx[a], sy[a], sx[cc], sy[cc], sx[d], sy[d],
            u0, v0, u1, v1, u0, v1
          );
          shadeTri(sx[a], sy[a], sx[cc], sy[cc], sx[d], sy[d],
            (inten[a] + inten[cc] + inten[d]) / 3);
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function vertexIntensity(i, j) {
      var l = idx(Math.max(0, i - 1), j);
      var r = idx(Math.min(cols - 1, i + 1), j);
      var u = idx(i, Math.max(0, j - 1));
      var dn = idx(i, Math.min(rows - 1, j + 1));
      var ux = px[r] - px[l], uy = py[r] - py[l], uz = pz[r] - pz[l];
      var vx = px[dn] - px[u], vy = py[dn] - py[u], vz = pz[dn] - pz[u];
      // normal = cross(U, V)
      var nx = uy * vz - uz * vy;
      var ny = uz * vx - ux * vz;
      var nz = ux * vy - uy * vx;
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      var d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      return d; // -1..1
    }

    // Affine-map the flag texture onto a destination triangle.
    function drawTexTri(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
      ctx.save();
      // Slightly expand the clip triangle outward from its centroid to hide
      // sub-pixel seams between adjacent textured triangles.
      var mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3;
      var grow = 0.75; // device px of outward expansion
      var e0 = expand(x0, y0, mx, my, grow);
      var e1 = expand(x1, y1, mx, my, grow);
      var e2 = expand(x2, y2, mx, my, grow);
      ctx.beginPath();
      ctx.moveTo(e0[0], e0[1]);
      ctx.lineTo(e1[0], e1[1]);
      ctx.lineTo(e2[0], e2[1]);
      ctx.closePath();
      ctx.clip();

      var det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
      if (Math.abs(det) < 1e-6) { ctx.restore(); return; }
      var ia = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / det;
      var ic = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / det;
      var ie = x0 - ia * u0 - ic * v0;
      var ib = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / det;
      var id_ = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / det;
      var iff = y0 - ib * u0 - id_ * v0;
      ctx.setTransform(ia, ib, ic, id_, ie, iff);
      ctx.drawImage(tex.canvas, 0, 0);
      ctx.restore();
    }

    function shadeTri(x0, y0, x1, y1, x2, y2, intensity) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var mid = 0.55;
      // Expand outward so shared edges overlap (no anti-aliased seam grid).
      var mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3;
      var g0 = expand(x0, y0, mx, my, 0.75);
      var g1 = expand(x1, y1, mx, my, 0.75);
      var g2 = expand(x2, y2, mx, my, 0.75);
      ctx.beginPath();
      ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.closePath();
      if (intensity > mid) {
        var hl = Math.min(0.35, (intensity - mid) * 0.7);
        ctx.fillStyle = 'rgba(255,255,255,' + hl + ')';
      } else {
        var sh = Math.min(0.45, (mid - intensity) * 0.6);
        ctx.fillStyle = 'rgba(' + SHADOW_NAVY + ',' + sh + ')';
      }
      ctx.fill();
    }

    function drawPole(cxp, cyp) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var topId = idx(0, 0);
      var botId = idx(0, rows - 1);
      var topY = projY(topId, cyp);
      var botY = projY(botId, cyp);
      var poleTop = Math.max(0, topY - flagH * 0.14);
      var poleBot = Math.min(H, botY + flagH * 0.06);
      var x = poleX + poleW / 2;

      // Shaft with a metallic gradient.
      var grd = ctx.createLinearGradient(poleX, 0, poleX + poleW, 0);
      var base = o.poleColor;
      grd.addColorStop(0, shade(base, -0.35));
      grd.addColorStop(0.4, shade(base, 0.25));
      grd.addColorStop(0.55, base);
      grd.addColorStop(1, shade(base, -0.45));
      ctx.fillStyle = grd;
      roundRect(ctx, poleX, poleTop, poleW, poleBot - poleTop, poleW * 0.5);
      ctx.fill();

      // Gold finial ball on top.
      var fr = poleW * 1.55;
      var fcx = x, fcy = poleTop - fr * 0.55;
      var rg = ctx.createRadialGradient(fcx - fr * 0.35, fcy - fr * 0.35, fr * 0.1, fcx, fcy, fr);
      rg.addColorStop(0, shade(base, 0.55));
      rg.addColorStop(0.6, base);
      rg.addColorStop(1, shade(base, -0.5));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(fcx, fcy, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- loop / lifecycle -------------------------------------------------
    function frame(ts) {
      if (!running) return;
      var dt = lastTs ? Math.min(0.033, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      simulate(dt);
      render();
      rafId = global.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reducedMotion || !visible) return;
      running = true;
      lastTs = 0;
      rafId = global.requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) global.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    // ---- observers --------------------------------------------------------
    var io = null;
    if (global.IntersectionObserver) {
      io = new global.IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          visible = entries[i].isIntersecting;
          if (visible) start(); else stop();
        }
      }, { threshold: 0.01 });
      io.observe(canvas);
    }

    var ro = null;
    var resizeScheduled = false;
    function onResize() {
      if (resizeScheduled) return;
      resizeScheduled = true;
      global.requestAnimationFrame(function () {
        resizeScheduled = false;
        layout();
        if (reducedMotion) { warmupAndRenderOnce(); }
      });
    }
    if (global.ResizeObserver) {
      ro = new global.ResizeObserver(onResize);
      ro.observe(canvas);
    } else {
      global.addEventListener('resize', onResize);
    }

    function warmupAndRenderOnce() {
      // Simulate a fixed number of steps to reach a pleasing waving pose.
      for (var s = 0; s < 90; s++) simulate(0.016);
      render();
    }

    // ---- init -------------------------------------------------------------
    layout();
    if (reducedMotion) {
      warmupAndRenderOnce();
    } else {
      // Warm up a little so the first visible frame is already waving.
      for (var s = 0; s < 20; s++) simulate(0.016);
      render();
      if (visible) start();
    }

    return {
      canvas: canvas,
      start: start,
      stop: stop,
      destroy: function () {
        stop();
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        else global.removeEventListener('resize', onResize);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);
      }
    };
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function dist(x0, y0, x1, y1) { var dx = x0 - x1, dy = y0 - y1; return Math.sqrt(dx * dx + dy * dy); }
  function expand(x, y, cx, cy, amt) {
    var dx = x - cx, dy = y - cy;
    var l = Math.sqrt(dx * dx + dy * dy);
    if (l < 1e-4) return [x, y];
    return [x + dx / l * amt, y + dy / l * amt];
  }
  function normalize3(x, y, z) { var l = Math.sqrt(x * x + y * y + z * z) || 1; return [x / l, y / l, z / l]; }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Lighten (amt>0) / darken (amt<0) a hex color.
  function shade(hex, amt) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var r = parseInt(c.substring(0, 2), 16);
    var g = parseInt(c.substring(2, 4), 16);
    var b = parseInt(c.substring(4, 6), 16);
    if (amt >= 0) {
      r = Math.round(r + (255 - r) * amt);
      g = Math.round(g + (255 - g) * amt);
      b = Math.round(b + (255 - b) * amt);
    } else {
      r = Math.round(r * (1 + amt));
      g = Math.round(g * (1 + amt));
      b = Math.round(b * (1 + amt));
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  global.IsraeliFlag = { mount: mount };

})(typeof window !== 'undefined' ? window : this);
