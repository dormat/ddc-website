document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  const mobileNav = window.matchMedia("(max-width: 900px)");

  const closeSubmenus = () => {
    nav?.querySelectorAll(".nav-item.has-dropdown.is-submenu-open").forEach((item) => {
      item.classList.remove("is-submenu-open");
      item.querySelector(".nav-submenu-toggle")?.setAttribute("aria-expanded", "false");
    });
  };

  const toggleSubmenu = (btn) => {
    const item = btn.closest(".nav-item.has-dropdown");
    if (!item) return;

    const willOpen = !item.classList.contains("is-submenu-open");
    closeSubmenus();
    if (willOpen) {
      item.classList.add("is-submenu-open");
      btn.setAttribute("aria-expanded", "true");
    }
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) {
        closeSubmenus();
      }
    });
  }

  nav?.addEventListener("click", (event) => {
    const btn = event.target.closest(".nav-submenu-toggle");
    if (!btn || !nav.contains(btn)) return;
    if (!mobileNav.matches) return;

    event.preventDefault();
    event.stopPropagation();
    toggleSubmenu(btn);
  });

  nav?.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (!mobileNav.matches) return;
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
      closeSubmenus();
    });
  });

  // Carousels (homepage hero + product gallery)
  document.querySelectorAll(".hero-carousel, .product-carousel").forEach((carousel) => {
    const slides = carousel.querySelectorAll(".carousel-slide");
    const dots = carousel.querySelectorAll(".carousel-dot");
    const prev = carousel.querySelector(".carousel-prev");
    const next = carousel.querySelector(".carousel-next");
    let current = 0;
    let timer = null;
    let transitioning = false;

    function showSlide(index) {
      if (slides.length === 0 || transitioning) return;
      const next = (index + slides.length) % slides.length;
      if (next === current) return;

      transitioning = true;
      slides[current]?.classList.remove("is-active");
      current = next;
      slides[current]?.classList.add("is-active");
      dots.forEach((d, i) => d.classList.toggle("is-active", i === current));

      window.setTimeout(() => {
        transitioning = false;
      }, 800);
    }

    function nextSlide() {
      showSlide(current + 1);
    }

    function startAutoplay() {
      stopAutoplay();
      if (slides.length > 1) {
        timer = setInterval(nextSlide, 5000);
      }
    }

    function stopAutoplay() {
      if (timer) clearInterval(timer);
    }

    prev?.addEventListener("click", () => {
      showSlide(current - 1);
      startAutoplay();
    });
    next?.addEventListener("click", () => {
      nextSlide();
      startAutoplay();
    });
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.index));
        startAutoplay();
      });
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);

    startAutoplay();
  });

  // Products page category filter
  const productFilter = document.getElementById("product-category-filter");
  const productSections = document.querySelectorAll(".products-page .hub-section");
  if (productFilter && productSections.length) {
    const applyFilter = () => {
      const value = productFilter.value.trim();
      productSections.forEach((section) => {
        const match = !value || section.dataset.subcategory === value;
        section.classList.toggle("is-hidden", !match);
      });
    };
    productFilter.addEventListener("change", applyFilter);
  }

  document.querySelectorAll("[data-loop-slider], [data-project-slider]").forEach((root) => {
    const track = root.querySelector(".project-slider-track");
    if (!track) return;
    const originals = Array.from(track.children);
    if (!originals.length) return;

    const setHtml = originals.map((el) => el.outerHTML).join("");
    track.innerHTML = setHtml + setHtml + setHtml;

    const section = root.closest("[data-slider-section], .home-projects-slider") || root;
    const prev = section.querySelector(".project-slider-prev");
    const next = section.querySelector(".project-slider-next");
    let jumping = false;

    const gap = () => {
      const style = getComputedStyle(track);
      return parseFloat(style.columnGap || style.gap) || 0;
    };
    const setSize = () => {
      const cards = track.children;
      const count = originals.length;
      if (cards.length < count * 2) return 0;
      return cards[count].offsetLeft - cards[0].offsetLeft;
    };
    const goToMiddle = () => {
      jumping = true;
      track.scrollLeft = setSize();
      requestAnimationFrame(() => {
        jumping = false;
      });
    };
    const wrap = () => {
      if (jumping) return;
      const size = setSize();
      if (!size) return;
      if (track.scrollLeft < size * 0.5) {
        jumping = true;
        track.scrollLeft += size;
        jumping = false;
      } else if (track.scrollLeft >= size * 1.5) {
        jumping = true;
        track.scrollLeft -= size;
        jumping = false;
      }
    };

    goToMiddle();
    track.addEventListener("scrollend", wrap);
    track.addEventListener("scroll", () => {
      window.clearTimeout(track._loopTimer);
      track._loopTimer = window.setTimeout(wrap, 180);
    }, { passive: true });
    window.addEventListener("resize", goToMiddle);

    const step = () => Math.max(track.clientWidth * 0.7, 200);
    prev?.addEventListener("click", () => {
      track.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next?.addEventListener("click", () => {
      track.scrollBy({ left: step(), behavior: "smooth" });
    });
  });

  const closeLangMenu = (menu) => {
    const btn = menu.querySelector(".lang-menu-toggle");
    const list = menu.querySelector(".lang-menu-list");
    btn?.setAttribute("aria-expanded", "false");
    list?.setAttribute("hidden", "");
  };

  const searchRoot = document.querySelector("[data-site-search]");
  const searchToggle = searchRoot?.querySelector(".header-search-toggle");
  const searchPanel = searchRoot?.querySelector(".site-search-panel");
  const searchInput = searchRoot?.querySelector(".site-search-input");
  const searchResults = searchRoot?.querySelector(".site-search-results");
  let searchIndex = null;
  let searchIndexPromise = null;

  const closeSearch = () => {
    searchToggle?.setAttribute("aria-expanded", "false");
    searchPanel?.setAttribute("hidden", "");
    document.body.classList.remove("search-open");
  };

  const openLangMenu = (menu) => {
    const btn = menu.querySelector(".lang-menu-toggle");
    const list = menu.querySelector(".lang-menu-list");
    document.querySelectorAll("[data-lang-menu]").forEach((other) => {
      if (other !== menu) closeLangMenu(other);
    });
    closeSearch();
    btn?.setAttribute("aria-expanded", "true");
    list?.removeAttribute("hidden");
  };

  document.addEventListener("click", (event) => {
    document.querySelectorAll("[data-lang-menu]").forEach((menu) => {
      if (!menu.contains(event.target)) {
        closeLangMenu(menu);
      }
    });
  });

  document.querySelectorAll("[data-lang-menu]").forEach((menu) => {
    menu.querySelector(".lang-menu-toggle")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const expanded = menu.querySelector(".lang-menu-toggle")?.getAttribute("aria-expanded") === "true";
      if (expanded) closeLangMenu(menu);
      else openLangMenu(menu);
    });
  });

  const renderSearchResults = (items, query) => {
    if (!searchResults) return;
    searchResults.innerHTML = "";
    if (!query) return;
    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "site-search-empty";
      empty.textContent = searchResults.dataset.empty || "No results";
      searchResults.append(empty);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.url;
      const kind = document.createElement("span");
      kind.className = "site-search-kind";
      kind.textContent = item.kindLabel || item.kind;
      const title = document.createElement("span");
      title.textContent = item.title;
      a.append(kind, document.createTextNode(" "), title);
      li.append(a);
      searchResults.append(li);
    });
  };

  const normalizeQuery = (value) => value.trim().toLowerCase();

  const filterSearch = (query) => {
    const q = normalizeQuery(query);
    if (!q || !searchIndex) {
      renderSearchResults([], q);
      return;
    }
    const scored = [];
    searchIndex.forEach((item) => {
      const title = (item.title || "").toLowerCase();
      const text = (item.text || "").toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (text.includes(q)) score = 30;
      if (score) scored.push({ item, score });
    });
    scored.sort((a, b) => b.score - a.score);
    renderSearchResults(scored.slice(0, 12).map((row) => row.item), q);
  };

  const loadSearchIndex = () => {
    if (searchIndexPromise) return searchIndexPromise;
    const url = searchRoot?.getAttribute("data-index-url");
    if (!url) return Promise.resolve([]);
    searchIndexPromise = fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        searchIndex = Array.isArray(data) ? data : [];
        return searchIndex;
      })
      .catch(() => {
        searchIndex = [];
        return searchIndex;
      });
    return searchIndexPromise;
  };

  const openSearch = () => {
    if (!searchPanel) return;
    document.querySelectorAll("[data-lang-menu]").forEach(closeLangMenu);
    searchToggle?.setAttribute("aria-expanded", "true");
    searchPanel.removeAttribute("hidden");
    document.body.classList.add("search-open");
    loadSearchIndex().then(() => {
      searchInput?.focus();
      filterSearch(searchInput?.value || "");
    });
  };

  searchToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = searchToggle.getAttribute("aria-expanded") === "true";
    if (open) closeSearch();
    else openSearch();
  });

  searchRoot?.querySelector("[data-search-close]")?.addEventListener("click", closeSearch);
  searchPanel?.addEventListener("click", (event) => {
    if (event.target === searchPanel) closeSearch();
  });
  searchInput?.addEventListener("input", () => filterSearch(searchInput.value));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll("[data-lang-menu]").forEach(closeLangMenu);
    closeSearch();
  });

  const contactForm = document.getElementById("contact-form");
  const contactError = document.getElementById("contact-form-error");

  const closeContactPopup = () => {
    contactPopup?.setAttribute("hidden", "");
    document.body.classList.remove("contact-popup-open");
  };

  const openContactPopup = () => {
    if (!contactPopup) return;
    contactPopup.removeAttribute("hidden");
    document.body.classList.add("contact-popup-open");
    document.getElementById("contact-popup-close")?.focus();
  };

  contactPopup?.querySelectorAll("[data-contact-popup-close]").forEach((el) => {
    el.addEventListener("click", closeContactPopup);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && contactPopup && !contactPopup.hasAttribute("hidden")) {
      closeContactPopup();
    }
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const honey = contactForm.querySelector('[name="_honey"]');
    if (honey instanceof HTMLInputElement && honey.value.trim()) {
      return;
    }

    const submitBtn = contactForm.querySelector(".btn-submit");
    const sendingLabel = contactForm.dataset.sendingLabel || "Sending...";
    const errorMessage = contactForm.dataset.errorMessage || "Could not send message.";
    const originalLabel = submitBtn?.textContent || "";

    contactError?.setAttribute("hidden", "");
    submitBtn?.setAttribute("disabled", "true");
    if (submitBtn) submitBtn.textContent = sendingLabel;

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Form submit failed");
      }

      contactForm.reset();
      openContactPopup();
    } catch {
      if (contactError) {
        contactError.textContent = errorMessage;
        contactError.removeAttribute("hidden");
      }
    } finally {
      submitBtn?.removeAttribute("disabled");
      if (submitBtn) submitBtn.textContent = originalLabel;
    }
  });
});
