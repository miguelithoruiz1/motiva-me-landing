(function(){
  "use strict";
  // Explorador de módulos: contenido ya está en el HTML (sin JS no queda vacío).
  // JS solo cambia qué panel se muestra, con el mismo patrón tablist/tabs de antes.
  var list = document.getElementById("modList");
  var panel = document.getElementById("modPanel");
  if(list && panel){
    var btns = list.querySelectorAll(".mod-btn");
    var panels = panel.querySelectorAll(".mod-panel-content");
    btns.forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-module");
        btns.forEach(function(b){ b.setAttribute("aria-selected", b===btn ? "true" : "false"); });
        panels.forEach(function(p){
          if(p.getAttribute("data-panel")===id){ p.removeAttribute("hidden"); }
          else { p.setAttribute("hidden", ""); }
        });
        // Animación de entrada del panel, como antes (MutationObserver en el otro bloque la detecta por cambio de atributo, no de hijos;
        // así que la re-disparamos aquí directamente).
        panel.classList.remove("panel-enter"); void panel.offsetWidth; panel.classList.add("panel-enter");
      });
    });
  }
})();

(function(){
/* --- Animación 3D profesional: inclinación + entrada + scroll --- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone3d = document.getElementById("phone3d");
  var stage = document.getElementById("phoneStage");
  if(phone3d && stage && !reduceMotion){
    var raf = null, tx = -13, ty = 5, cx = -13, cy = 5;
    function loop(){
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      phone3d.style.transform = "rotateY(" + cx.toFixed(2) + "deg) rotateX(" + cy.toFixed(2) + "deg)";
      if(Math.abs(tx-cx) > 0.05 || Math.abs(ty-cy) > 0.05){ raf = requestAnimationFrame(loop); } else { raf = null; }
    }
    function kick(){ if(!raf) raf = requestAnimationFrame(loop); }
    var heroEl = document.querySelector(".hero");
    function onMove(e){
      var r = stage.getBoundingClientRect();
      var px = ((e.clientX - r.left) / Math.max(r.width,1)) - 0.5;
      var py = ((e.clientY - r.top) / Math.max(r.height,1)) - 0.5;
      tx = -8 + px * 18; ty = 5 - py * 12; kick();
    }
    if(heroEl){
      heroEl.addEventListener("pointermove", onMove, {passive:true});
      heroEl.addEventListener("pointerleave", function(){ tx = -13; ty = 5; kick(); });
    }
    /* En móvil: inclinación sutil con el scroll, sin giroscopio ni permisos */
    var ticking = false;
    window.addEventListener("scroll", function(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var y = Math.min(window.scrollY, 420);
        if(window.innerWidth < 921){ tx = -9 + (y/420)*6; ty = 4 - (y/420)*3; kick(); }
        ticking = false;
      });
    }, {passive:true});
  }
  /* Reveal al hacer scroll + barras animadas del teléfono */
  var revealEls = document.querySelectorAll(".sec-head, .day-card, .value, .about-logo, .course-band, .wait-form, .social-card, .phone-stage");
  revealEls.forEach(function(el){ el.classList.add("reveal"); });
  if("IntersectionObserver" in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("inview"); io.unobserve(en.target); } });
    }, {threshold: 0.14});
    revealEls.forEach(function(el){ io.observe(el); });
    if(stage) io.observe(stage);
  } else {
    revealEls.forEach(function(el){ el.classList.add("inview"); });
    if(stage) stage.classList.add("inview");
  }

  
})();

(function(){
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2);

  /* ---------- Preloader: rápido y con salida garantizada ---------- */
  var pre = document.getElementById("preloader");
  var prePct = document.getElementById("prePct");
  var preBar = document.getElementById("preBar");
  function hidePre(){ document.body.classList.add("loaded"); if(pre){ pre.classList.add("done"); setTimeout(function(){ if(pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 700); } }
  if(reduceMotion){ hidePre(); }
  else if(pre){
    var p = 0;
    var preTimer = setInterval(function(){
      p = Math.min(100, p + 7 + Math.random() * 9);
      if(prePct) prePct.textContent = Math.floor(p) + "%";
      if(preBar) preBar.style.width = p + "%";
      if(p >= 100){ clearInterval(preTimer); setTimeout(hidePre, 140); }
    }, 68);
    setTimeout(function(){ clearInterval(preTimer); hidePre(); }, 1700); /* nunca atrapa el contenido */
  }

  /* ---------- Dividir titulares en palabras (tipografía cinética) ---------- */
  function splitWords(el){
    if(!el) return [];
    var label = el.textContent.replace(/\s+/g, " ").trim();
    if(label) el.setAttribute("aria-label", label);
    var inners = [];
    var wordIdx = 0;
    function process(node){
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function(child){
        if(child.nodeType === 3){
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(" ")); return; }
            var wrap = document.createElement("span"); wrap.className = "w-wrap"; wrap.setAttribute("aria-hidden","true");
            var inn = document.createElement("span"); inn.className = "w-in"; inn.textContent = part;
            inn.style.setProperty("--d", (wordIdx++ * 0.055).toFixed(3) + "s");
            wrap.appendChild(inn); frag.appendChild(wrap); inners.push(inn);
          });
          node.replaceChild(frag, child);
        } else if(child.nodeType === 1){ process(child); }
      });
    }
    process(el);
    return inners;
  }
  var heroWords = splitWords(document.querySelector(".hero h1"));
  var headWords = [];
  document.querySelectorAll(".sec-head h2").forEach(function(h){ headWords.push({el:h, words:splitWords(h)}); });

  /* ---------- Scroll suave nativo (sin librerías externas) ---------- */
  /* html{scroll-behavior:smooth} + scroll-margin-top en las secciones hacen
     el trabajo que antes dependía de Lenis cargado desde un CDN. */

  /* ---------- Titulares cinéticos en CSS puro (sin GSAP) ---------- */
  /* Las palabras del H1 suben cuando el preloader termina (body.loaded);
     las de cada sección suben cuando el IntersectionObserver del primer
     script marca la cabecera como .inview. Si este script no corriera,
     splitWords nunca crea los spans y el texto se ve normal: nada queda
     oculto esperando a una librería. */

  /* ---------- Fondo del héroe: partículas + ondas (canvas 2D, ligero) ---------- */
  var canvas = document.getElementById("heroCanvas");
  var hero = document.querySelector(".hero");
  if(canvas && hero && !reduceMotion){
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, parts = [], running = false, rafId = null, phase = 0;
    var mouseX = .5, mouseY = .5;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function count(){ if(lowPower) return 26; return window.innerWidth < 640 ? 46 : 78; }
    function resize(){
      var r = hero.getBoundingClientRect();
      W = Math.max(300, r.width); H = Math.max(300, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function seed(){
      parts = []; var n = count();
      for(var i = 0; i < n; i++){
        parts.push({ x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32,
          r: Math.random() * 2.3 + .8, mag: Math.random() < .14 });
      }
    }
    function frame(){
      if(!running) return;
      phase += .008;
      ctx.clearRect(0, 0, W, H);
      /* ondas wireframe en la base */
      for(var wv = 0; wv < 3; wv++){
        ctx.beginPath();
        var baseY = H * (.68 + wv * .1), amp = 16 + wv * 9;
        for(var x = 0; x <= W; x += 14){
          var y = baseY + Math.sin(x * .008 + phase * (1.4 + wv * .5) + wv * 1.7) * amp + Math.cos(x * .003 + phase) * 8;
          if(x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wv === 1 ? "rgba(255,46,136,.13)" : "rgba(0,229,255," + (0.16 - wv * .04) + ")";
        ctx.lineWidth = 1; ctx.stroke();
      }
      /* partículas y constelación */
      var ox = (mouseX - .5) * 14, oy = (mouseY - .5) * 10;
      parts.forEach(function(pt){
        pt.x += pt.vx; pt.y += pt.vy;
        if(pt.x < -6) pt.x = W + 6; if(pt.x > W + 6) pt.x = -6;
        if(pt.y < -6) pt.y = H + 6; if(pt.y > H + 6) pt.y = -6;
        ctx.beginPath(); ctx.arc(pt.x + ox * pt.r * .4, pt.y + oy * pt.r * .4, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = pt.mag ? "rgba(255,46,136,.85)" : "rgba(0,229,255,.8)"; ctx.fill();
      });
      for(var i = 0; i < parts.length; i++){
        for(var j = i + 1; j < parts.length; j++){
          var dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y, d2 = dx * dx + dy * dy;
          if(d2 < 11800){
            ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y);
            ctx.strokeStyle = "rgba(0,229,255," + (0.10 * (1 - d2 / 11800)) + ")"; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    function start(){ if(!running){ running = true; rafId = requestAnimationFrame(frame); } }
    function stop(){ running = false; if(rafId) cancelAnimationFrame(rafId); }
    resize();
    var rzT; window.addEventListener("resize", function(){ clearTimeout(rzT); rzT = setTimeout(resize, 180); }, { passive: true });
    hero.addEventListener("pointermove", function(e){
      var r = hero.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / Math.max(r.width, 1); mouseY = (e.clientY - r.top) / Math.max(r.height, 1);
    }, { passive: true });
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(en){ en[0].isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(hero);
    } else start();
    document.addEventListener("visibilitychange", function(){ document.hidden ? stop() : start(); });
  }

  /* ---------- Cursor propio ---------- */
  if(finePointer && !reduceMotion){
    var dot = document.getElementById("cursorDot"), ring = document.getElementById("cursorRing");
    if(dot && ring){
      document.body.classList.add("has-cursor");
      var mx = -100, my = -100, rx = -100, ry = -100;
      document.addEventListener("pointermove", function(e){ mx = e.clientX; my = e.clientY; dot.style.left = mx + "px"; dot.style.top = my + "px"; }, { passive: true });
      (function loopCursor(){ rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.left = rx + "px"; ring.style.top = ry + "px"; requestAnimationFrame(loopCursor); })();
      document.querySelectorAll("a, button, summary, input, .mod-btn, .social-card").forEach(function(el){
        el.addEventListener("pointerenter", function(){ ring.classList.add("is-hover"); });
        el.addEventListener("pointerleave", function(){ ring.classList.remove("is-hover"); });
      });
      document.addEventListener("pointerdown", function(){ ring.classList.add("is-press"); });
      document.addEventListener("pointerup", function(){ ring.classList.remove("is-press"); });
    }
  }

  /* ---------- Botones magnéticos ---------- */
  if(finePointer && !reduceMotion && window.innerWidth > 860){
    document.querySelectorAll(".btn, .brand").forEach(function(el){
      el.addEventListener("pointermove", function(e){
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        el.style.transform = "translate(" + (dx * 7) + "px," + (dy * 6) + "px)";
      });
      el.addEventListener("pointerleave", function(){ el.style.transform = ""; });
    });
    /* Tilt sutil en tarjetas */
    document.querySelectorAll(".day-card, .value, .social-card, .about-logo").forEach(function(card){
      card.addEventListener("pointermove", function(e){
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        card.style.transform = "perspective(760px) rotateX(" + (-dy * 4.5) + "deg) rotateY(" + (dx * 4.5) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function(){ card.style.transform = ""; });
    });
  }

  /* ---------- Contadores animados de datos del héroe ---------- */
  var facts = document.querySelector(".hero-facts");
  function animateCount(el, from, to, suffix){
    var t0 = null, dur = 950;
    function step(ts){
      if(!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e) + (suffix || "");
      if(k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if(facts && !reduceMotion && "IntersectionObserver" in window){
    var done = false;
    new IntersectionObserver(function(en){
      if(en[0].isIntersecting && !done){
        done = true;
        facts.querySelectorAll(".count-num").forEach(function(el){
          var target = parseInt(el.getAttribute("data-count"), 10);
          animateCount(el, target === 2021 ? 2000 : 0, target, "");
        });
        facts.querySelectorAll(".count-range").forEach(function(el){
          var a = parseInt(el.getAttribute("data-from"), 10), b = parseInt(el.getAttribute("data-to"), 10), t0 = null;
          (function step(ts){
            if(!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 950), e = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(a * e) + "–" + Math.round(b * e);
            if(k < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      }
    }, { threshold: .35 }).observe(facts);
  }

  /* ---------- Progreso de scroll + respiración de la banda al hacer scroll ---------- */
  var prog = document.getElementById("scrollProgress");
  var band = document.querySelector(".marquee-band");
  var lastY = window.scrollY, tickingP = false;
  function updateProgress(){
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var k = max > 0 ? window.scrollY / max : 0;
    if(prog) prog.style.transform = "scaleX(" + k + ")";
    if(band && !reduceMotion){
      var vel = Math.max(-14, Math.min(14, (window.scrollY - lastY) * .35));
      band.style.transform = "skewX(" + (-vel * .4) + "deg)";
      clearTimeout(band._skT); band._skT = setTimeout(function(){ band.style.transform = "skewX(0deg)"; }, 120);
    }
    lastY = window.scrollY; tickingP = false;
  }
  window.addEventListener("scroll", function(){ if(!tickingP){ tickingP = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();

  /* ---------- Transición animada del panel de módulos ---------- */
  var modPanel = document.getElementById("modPanel");
  if(modPanel && !reduceMotion && "MutationObserver" in window){
    new MutationObserver(function(){
      modPanel.classList.remove("panel-enter"); void modPanel.offsetWidth; modPanel.classList.add("panel-enter");
    }).observe(modPanel, { childList: true });
  }
})();
