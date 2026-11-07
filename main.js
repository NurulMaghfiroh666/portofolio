(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ── YEAR STAMP ──────────────────────────────────────── */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── LIVE CLOCK (WIB, Asia/Jakarta) ─────────────────── */
  var clockEl = document.getElementById("live-clock");

  function updateLiveClock() {
    if (!clockEl) clockEl = document.getElementById("live-clock");
    if (!clockEl) return;
    try {
      var now = new Date();
      var fmt = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      clockEl.textContent = fmt.format(now).replace(/\./g, ":") + " WIB";
    } catch (e) {
      var d = new Date();
      clockEl.textContent =
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + ":" +
        String(d.getSeconds()).padStart(2, "0") + " WIB";
    }
  }

  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  /* ── QUANTUM VIOLET GRID CANVAS ─────────────────────── */
  var canvas = document.querySelector(".contact-canvas") || document.querySelector(".hero-canvas");
  var ctx = canvas ? canvas.getContext("2d", { alpha: false, desynchronized: true }) : null;
  var W = 0;
  var H = 0;
  var dpr = 1;
  var scrollY = 0;

  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("mousemove", function (e) {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("scroll", function () {
    scrollY = window.scrollY || window.pageYOffset;
  }, { passive: true });

  /* Fibonacci sphere node distribution */
  var N = 420;
  var pts = [];
  var golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) {
    var yy = 1 - (i / (N - 1)) * 2;
    var rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    var theta = golden * i;
    pts.push({
      x: Math.cos(theta) * rr,
      y: yy,
      z: Math.sin(theta) * rr,
      accent: i % 29 === 0,
      soft: i % 47 === 0
    });
  }

  /* Precompute edges (threshold² = 0.3²) */
  var edges = [];
  var TH2 = 0.3 * 0.3;
  for (var i = 0; i < N; i++) {
    var a = pts[i];
    for (var j = i + 1; j < N; j++) {
      var b = pts[j];
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      var dz = a.z - b.z;
      if (dx * dx + dy * dy + dz * dz < TH2) edges.push(i * N + j);
    }
  }

  var proj = new Array(N);

  function resizeCanvas() {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nw = Math.round(rect.width * dpr);
    var nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    W = nw;
    H = nh;
  }

  function drawMesh(time) {
    if (!ctx || !W || !H) return;

    /* smooth mouse lerp */
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;

    /* slow continuous rotation — no progress scrub needed */
    var slowTime = time * 0.000085;
    var rotY = slowTime + mouse.x * 0.4;
    var rotX = -0.22 + mouse.y * 0.28;

    var sinY = Math.sin(rotY), cosY = Math.cos(rotY);
    var sinX = Math.sin(rotX), cosX = Math.cos(rotX);
    var isDesktop = W > 768 * dpr;
    var cx = isDesktop ? W * 0.28 : W * 0.5;
    var cy = isDesktop ? H * 0.46 : H * 0.40;
    var R = Math.min(W, H) * (isDesktop ? 0.38 : 0.32);

    for (var k = 0; k < N; k++) {
      var pt = pts[k];
      var x1 = pt.x * cosY - pt.z * sinY;
      var z1 = pt.x * sinY + pt.z * cosY;
      var y1 = pt.y * cosX - z1 * sinX;
      var z2 = pt.y * sinX + z1 * cosX;
      var scale = 1.65 / (2.3 - z2);
      proj[k] = { x: cx + x1 * R * scale, y: cy + y1 * R * scale, z: z2 };
    }

    /* background */
    ctx.fillStyle = "#07070d";
    ctx.fillRect(0, 0, W, H);

    /* ambient violet radial glow */
    var glow = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, R * 2.4);
    glow.addColorStop(0, "rgba(168,85,247,0.14)");
    glow.addColorStop(0.5, "rgba(99,102,241,0.07)");
    glow.addColorStop(1, "rgba(7,7,13,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* edges */
    ctx.lineWidth = Math.max(1, dpr * 0.65);
    for (var k = 0; k < edges.length; k++) {
      var e = edges[k];
      var ia = (e / N) | 0;
      var ib = e % N;
      var pa = proj[ia];
      var pb = proj[ib];
      var depth = (pa.z + pb.z) * 0.5;
      var alpha = (depth + 1) * 0.5 * 0.3;
      if (alpha < 0.02) continue;
      ctx.strokeStyle = "rgba(192,132,252," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    /* nodes */
    for (var k = 0; k < N; k++) {
      var pr = proj[k];
      var d = (pr.z + 1) * 0.5;
      if (pts[k].accent) {
        ctx.fillStyle = "rgba(168,85,247," + (0.55 + d * 0.45).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, dpr * (1.6 + d * 1.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (pts[k].soft) {
        ctx.fillStyle = "rgba(99,102,241," + (0.5 + d * 0.5).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, dpr * (1.4 + d * 1.3), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(245,243,252," + (0.1 + d * 0.6).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, dpr * (0.65 + d * 1.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderLoop(time) {
    if (!ctx || !W || !H) return;
    drawMesh(time || performance.now());
    window.requestAnimationFrame(renderLoop);
  }

  if (canvas) {
    resizeCanvas();
    if ("ResizeObserver" in window) {
      new ResizeObserver(resizeCanvas).observe(canvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        resizeCanvas();
        if (typeof window.ScrollTrigger !== "undefined") {
          window.ScrollTrigger.refresh();
        }
      }, 150);
    });
    window.requestAnimationFrame(renderLoop);
  }

  /* ── LENIS SMOOTH SCROLL ─────────────────────────────── */
  var lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduced) {
    try {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      if (hasGsap) {
        lenis.on("scroll", window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); window.requestAnimationFrame(raf); };
        window.requestAnimationFrame(raf);
      }
    } catch (err) { lenis = null; }
  }

  /* ── ANCHOR SCROLL ───────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.25 });
      } else {
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    });
  });

  /* ── SKILLS TOOLTIP ──────────────────────────────────── */
  var hint = document.querySelector(".skills-hint");
  document.querySelectorAll(".sk").forEach(function (item) {
    var show = function () {
      if (hint) hint.textContent = item.getAttribute("data-desc") || item.textContent;
    };
    item.addEventListener("mouseenter", show);
    item.addEventListener("focus", show);
  });

  /* ── VIEW ALL PROJECTS ───────────────────────────────── */
  var viewAll = document.getElementById("view-all");
  var more = document.querySelector(".projects-more");
  if (viewAll && more) {
    viewAll.addEventListener("click", function () {
      more.hidden = false;
      var actions = viewAll.closest(".projects-actions");
      if (actions) actions.style.display = "none";
      if (hasGsap) {
        window.gsap.from(more.querySelectorAll(".p-card"), {
          y: 60, opacity: 0, duration: 0.85, ease: "power3.out", stagger: 0.12
        });
      }
      window.requestAnimationFrame(function () {
        more.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        if (hasGsap) {
          window.setTimeout(function () { window.ScrollTrigger.refresh(); }, 450);
        }
      });
    });
  }

  /* ── CERTIFICATE MODAL ───────────────────────────────── */
  var certModal = document.getElementById("cert-modal");
  var modalClose = document.getElementById("modal-close-btn");
  var modalTitle = document.getElementById("modal-title");
  var modalCat = document.getElementById("modal-category");
  var modalIssuer = document.getElementById("modal-issuer");
  var modalDesc = document.getElementById("modal-desc");
  var modalYear = document.getElementById("modal-year");
  var modalStatus = document.getElementById("modal-status");

  function openModal(btn) {
    if (!certModal) return;
    if (modalTitle) modalTitle.textContent = btn.getAttribute("data-title") || "Sertifikat";
    if (modalCat) modalCat.textContent = btn.getAttribute("data-cat") || "Kredensial";
    if (modalIssuer) modalIssuer.textContent = btn.getAttribute("data-issuer") || "";
    if (modalDesc) modalDesc.textContent = btn.getAttribute("data-desc") || "";
    if (modalYear) modalYear.textContent = btn.getAttribute("data-year") || "-";
    if (modalStatus) modalStatus.textContent = btn.getAttribute("data-status") || "Terverifikasi";
    certModal.classList.add("active");
    certModal.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
  }

  function closeModal() {
    if (!certModal) return;
    certModal.classList.remove("active");
    certModal.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }

  document.querySelectorAll(".btn-cert-modal").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(btn);
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);

  if (certModal) {
    certModal.addEventListener("click", function (e) {
      if (e.target === certModal) closeModal();
    });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && certModal && certModal.classList.contains("active")) {
      closeModal();
    }
  });

  /* ── GSAP SCROLL ANIMATIONS ──────────────────────────── */
  if (hasGsap && !reduced) {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    /* ─ Hero entrance: staggered fade-in from below ─ */
    var heroEls = document.querySelectorAll("[data-hero-in]");
    if (heroEls.length) {
      gsap.from(heroEls, {
        y: 36,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.15
      });
    }

    /* ─ Scroll reveal: [data-rv] elements ─ */
    gsap.utils.toArray("[data-rv]").forEach(function (el) {
      gsap.from(el, {
        y: 44,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });

    /* ─ Project cards ─ */
    document.querySelectorAll(".projects-section > .projects-grid").forEach(function (grid) {
      gsap.from(grid.querySelectorAll(".p-card"), {
        y: 55,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: grid, start: "top 85%" }
      });
    });

    /* ─ Cert cards ─ */
    document.querySelectorAll(".cert-grid").forEach(function (grid) {
      gsap.from(grid.querySelectorAll(".cert-card"), {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: grid, start: "top 85%" }
      });
    });

    /* ─ Journey timeline line fill ─ */
    var tlLine = document.querySelector(".line");
    if (tlLine) {
      gsap.fromTo(tlLine,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".tl",
            start: "top 72%",
            end: "bottom 65%",
            scrub: true
          }
        }
      );
    }

    /* ─ Journey large bg numbers parallax ─ */
    gsap.utils.toArray(".j-num").forEach(function (num) {
      gsap.fromTo(num,
        { yPercent: 20 },
        {
          yPercent: -20,
          ease: "none",
          scrollTrigger: {
            trigger: num.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    /* ─ Journey item reveal ─ */
    gsap.utils.toArray(".j-item").forEach(function (item) {
      gsap.from(item.querySelectorAll(".j-in"), {
        y: 36,
        opacity: 0,
        stagger: 0.1,
        duration: 0.95,
        ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 76%" }
      });
    });

    /* ─ Contact section entrance ─ */
    gsap.from(".contact-title", {
      y: 50,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".contact-section", start: "top 80%" }
    });

    /* refresh after fonts/images settle */
    window.setTimeout(function () { ST.refresh(); }, 400);
    window.addEventListener("load", function () { ST.refresh(); });

  } else if (hasGsap) {
    window.ScrollTrigger.refresh();
  }

})();
