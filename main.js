(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── YEAR ────────────────────────────────────────────── */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── MOBILE NAV ──────────────────────────────────────── */
  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  var navLabel = document.getElementById("nav-toggle-label");
  var navQuery = window.matchMedia("(max-width: 720px)");

  function setNavOpen(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (navLabel) navLabel.textContent = open ? "Tutup" : "Menu";
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      setNavOpen(!navMenu.classList.contains("is-open"));
    });

    navMenu.addEventListener("click", function (e) {
      if (e.target.closest(".nav-link")) setNavOpen(false);
    });

    var onNavQueryChange = function (e) {
      if (!e.matches) setNavOpen(false);
    };
    if (typeof navQuery.addEventListener === "function") {
      navQuery.addEventListener("change", onNavQueryChange);
    } else if (typeof navQuery.addListener === "function") {
      navQuery.addListener(onNavQueryChange);
    }

    document.addEventListener("click", function (e) {
      if (!navMenu.classList.contains("is-open")) return;
      if (e.target.closest(".site-nav")) return;
      setNavOpen(false);
    });
  }

  /* ── SCROLL REVEAL ───────────────────────────────────── */
  var revealEls = document.querySelectorAll("[data-rv], [data-hero-in]");
  var canObserve = "IntersectionObserver" in window;

  function revealAll() {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (reduced || !canObserve) {
    revealAll();
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ── SHOW ALL PROJECTS ───────────────────────────────── */
  var viewAll = document.getElementById("view-all");
  var moreProjects = document.querySelector(".projects-more");
  if (viewAll && moreProjects) {
    viewAll.addEventListener("click", function () {
      moreProjects.hidden = false;
      var actions = viewAll.closest(".projects-actions");
      if (actions) actions.style.display = "none";
      var firstCard = moreProjects.querySelector(".p-card");
      if (firstCard) {
        var focusTarget = firstCard.querySelector(".p-photo-btn");
        if (focusTarget) {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (err) {
            focusTarget.focus();
          }
        }
        firstCard.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  }

  /* ── DETAIL MODAL ────────────────────────────────────── */
  var certModal = document.getElementById("cert-modal");
  var modalContent = certModal ? certModal.querySelector(".modal-content") : null;
  var modalClose = document.getElementById("modal-close-btn");
  var modalTitle = document.getElementById("modal-title");
  var modalCat = document.getElementById("modal-category");
  var modalIssuer = document.getElementById("modal-issuer");
  var modalDesc = document.getElementById("modal-desc");
  var modalYear = document.getElementById("modal-year");
  var modalStatus = document.getElementById("modal-status");
  var modalImages = document.getElementById("modal-images");
  var lastFocusedEl = null;

  function renderModalImages(btn) {
    if (!modalImages) return;
    var raw = btn.getAttribute("data-img") || "";
    var sources = raw.split("|").filter(Boolean);
    modalImages.innerHTML = "";
    if (!sources.length) {
      modalImages.hidden = true;
      modalImages.classList.remove("has-multiple");
      return;
    }
    if (sources.length > 1) {
      modalImages.classList.add("has-multiple");
    } else {
      modalImages.classList.remove("has-multiple");
    }
    var title = btn.getAttribute("data-title") || "Sertifikat";
    var label = btn.getAttribute("data-img-label") || "Dokumen Sertifikat";
    var labels = (btn.getAttribute("data-img-labels") || "").split("|");
    sources.forEach(function (src, index) {
      var captionText = labels[index] || (index === 0 ? label : "Lampiran Pencipta");
      var figure = document.createElement("figure");
      var img = document.createElement("img");
      img.src = src;
      img.alt = title + " — " + captionText;
      img.loading = "eager";
      img.decoding = "async";
      figure.appendChild(img);
      var caption = document.createElement("figcaption");
      caption.textContent = captionText;
      figure.appendChild(caption);
      modalImages.appendChild(figure);
    });
    modalImages.hidden = false;
  }

  function openModal(btn) {
    if (!certModal || !btn) return;
    if (modalTitle) modalTitle.textContent = btn.getAttribute("data-title") || "Sertifikat";
    if (modalCat) modalCat.textContent = btn.getAttribute("data-cat") || "Kredensial";
    if (modalIssuer) modalIssuer.textContent = btn.getAttribute("data-issuer") || "";
    if (modalDesc) modalDesc.textContent = btn.getAttribute("data-desc") || "";
    if (modalYear) modalYear.textContent = btn.getAttribute("data-year") || "-";
    if (modalStatus) modalStatus.textContent = btn.getAttribute("data-status") || "Terverifikasi";
    renderModalImages(btn);

    lastFocusedEl = document.activeElement;
    certModal.classList.add("active");
    certModal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");

    if (modalContent) {
      modalContent.scrollTop = 0;
      window.setTimeout(function () {
        if (!certModal.classList.contains("active")) return;
        try {
          modalContent.focus({ preventScroll: true });
        } catch (err) {
          modalContent.focus();
        }
      }, 60);
    }
  }

  function closeModal() {
    if (!certModal || !certModal.classList.contains("active")) return;
    certModal.classList.remove("active");
    certModal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("modal-open");
    if (modalImages) modalImages.hidden = true;

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      try {
        lastFocusedEl.focus({ preventScroll: true });
      } catch (err) {
        lastFocusedEl.focus();
      }
    }
    lastFocusedEl = null;
  }

  document.querySelectorAll(".btn-cert-modal").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(btn);
    });
  });

  /* ── CERTIFICATE FLIPPER (SISI BOLAK-BALIK DOKUMEN) ─── */
  document.querySelectorAll("[data-cert-flipper]").forEach(function (flipper) {
    var pills = flipper.querySelectorAll(".cert-flip-pill");
    var img = flipper.querySelector(".cert-preview-btn img");
    if (!pills.length || !img) return;

    pills.forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var targetSrc = pill.getAttribute("data-flip-src");
        if (!targetSrc || img.getAttribute("src") === targetSrc) return;

        pills.forEach(function (p) { p.classList.remove("is-active"); });
        pill.classList.add("is-active");

        img.style.opacity = "0.35";
        img.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        img.style.transform = "scale(0.98)";

        var temp = new Image();
        temp.onload = function () {
          img.src = targetSrc;
          img.style.opacity = "1";
          img.style.transform = "";
        };
        temp.src = targetSrc;
      });
    });
  });

  /* certificate document previews open the matching credential */
  document.querySelectorAll("[data-cert-preview]").forEach(function (preview) {
    preview.addEventListener("click", function () {
      var card = preview.closest(".cert-card");
      var trigger = card ? card.querySelector(".btn-cert-modal") : null;
      if (trigger) trigger.click();
    });
  });

  /* project media previews open their detail modal */
  document.querySelectorAll("[data-project-preview]").forEach(function (preview) {
    preview.addEventListener("click", function () {
      var card = preview.closest(".p-card");
      var trigger = card ? card.querySelector(".btn-cert-modal") : null;
      if (trigger) trigger.click();
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);
  document.querySelectorAll("[data-modal-close]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  if (certModal) {
    certModal.addEventListener("click", function (e) {
      if (e.target === certModal) closeModal();
    });

    /* keep keyboard focus inside the dialog */
    certModal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusables = certModal.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ── GLOBAL KEYS ─────────────────────────────────────── */
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeModal();
    setNavOpen(false);
  });
})();
