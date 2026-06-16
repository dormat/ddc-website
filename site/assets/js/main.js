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
  const productCards = document.querySelectorAll(".product-card-grid .product-card");
  if (productFilter && productCards.length) {
    const applyFilter = () => {
      const value = productFilter.value.trim();
      productCards.forEach((card) => {
        if (!value) {
          card.classList.remove("is-hidden");
          return;
        }
        const subs = (card.dataset.subcategories || "")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        const match = subs.some((sub) => sub === value);
        card.classList.toggle("is-hidden", !match);
      });
    };
    productFilter.addEventListener("change", applyFilter);
  }

  const contactForm = document.getElementById("contact-form");
  const contactPopup = document.getElementById("contact-popup");
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
