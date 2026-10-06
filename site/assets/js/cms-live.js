/**
 * Apply live CMS snapshot from /cms/public.json onto the static site.
 * Keeps the exact UI; updates CMS-managed text after admin publishes.
 */
(function () {
  var SNAPSHOT_URL = "/cms/public.json";

  function pathParts() {
    var parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    return parts;
  }

  function currentLang() {
    var p = pathParts()[0];
    if (p === "he" || p === "en" || p === "es") return p;
    return "he";
  }

  function currentSlug() {
    var parts = pathParts();
    if (parts.length < 2) return "";
    return parts.slice(1).join("/");
  }

  function setText(el, value) {
    if (!el || value == null || value === "") return;
    el.textContent = value;
  }

  function setHtml(el, value) {
    if (!el || value == null || value === "") return;
    el.innerHTML = value;
  }

  function findBySlug(list, slug) {
    if (!list || !slug) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].slug === slug) return list[i];
    }
    return null;
  }

  function findPage(pages, key) {
    if (!pages || !key) return null;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i] && pages[i].key === key) return pages[i];
    }
    return null;
  }

  function plainToStoryHtml(body) {
    return body
      .split(/\n\n+/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean)
      .map(function (p) {
        return '<p class="about-story-p">' + escapeHtml(p).replace(/\n/g, "<br/>") + "</p>";
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Product/solution plain text → one block per line (matches admin textarea). */
  function plainToProductHtml(body) {
    var raw = String(body || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var lines = raw.split("\n");
    var html = ['<div class="rich-text product-description-body">'];
    var blankRun = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/[ \t]+$/g, "");
      if (!line.trim()) {
        blankRun += 1;
        continue;
      }
      var spacerClass = blankRun > 0 ? " product-desc-line--break" : "";
      blankRun = 0;
      html.push(
        '<p class="product-desc-line' +
          spacerClass +
          '">' +
          escapeHtml(line.trim()) +
          "</p>"
      );
    }
    html.push("</div>");
    return html.length > 2 ? html.join("") : "";
  }

  function applyContact(settings) {
    if (!settings) return;
    var phone = settings.contact_phone;
    var email = settings.contact_email;
    var brand = settings.brand_name;
    var root = document.querySelector(".footer-contact");
    if (root) {
      var links = root.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) {
        var a = links[i];
        var href = a.getAttribute("href") || "";
        if (phone && href.indexOf("tel:") === 0) {
          a.setAttribute("href", "tel:" + phone);
          a.textContent = phone;
        }
        if (email && href.indexOf("mailto:") === 0) {
          a.setAttribute("href", "mailto:" + email);
          a.textContent = email;
        }
      }
    }
    if (brand) {
      setText(document.querySelector(".footer-brand-name"), brand);
      var bottom = document.querySelector(".footer-bottom p");
      if (bottom) bottom.textContent = "© " + brand;
    }
  }

  function applyNavSolutions(solutions, lang) {
    if (!solutions) return;
    var links = document.querySelectorAll(".mega-dropdown a[href], .footer-sitemap a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute("href") || "";
      for (var j = 0; j < solutions.length; j++) {
        var sol = solutions[j];
        if (!sol || !sol.slug) continue;
        if (href.indexOf("/" + sol.slug) === -1 && href.indexOf("/" + sol.slug + "/") === -1) continue;
        var tr = (sol.translations || {})[lang] || {};
        if (tr.title) a.textContent = tr.title;
      }
    }
  }

  function applyProduct(product, lang) {
    if (!product) return;
    var tr = (product.translations || {})[lang] || {};
    setText(document.querySelector(".product-detail-page .page-title"), tr.title);
    var desc = document.querySelector(".product-detail-page .product-description");
    if (desc && tr.body) {
      if (tr.body.indexOf("<") !== -1) setHtml(desc, tr.body);
      else setHtml(desc, plainToProductHtml(tr.body));
    }
    applyProductCarousel(product);
    applyProductDocuments(product);
  }

  function applyProductCarousel(product) {
    var lang = currentLang();
    var media = (product.media || []).filter(function (m) {
      if (!m || !m.url) return false;
      var kind = String(m.kind || "").toLowerCase();
      if (kind === "document" || kind === "schematic") return false;
      if (m.enabled === false) return false;
      if (lang === "he" && m.enabledHe === false) return false;
      if (lang === "en" && m.enabledEn === false) return false;
      if (lang === "es" && m.enabledEs === false) return false;
      return true;
    });
    if (!media.length) return;
    var section = document.querySelector(".product-detail-page .product-carousel");
    if (!section) return;
    var track = section.querySelector(".carousel-track");
    var dots = section.querySelector(".carousel-dots");
    if (!track) return;

    var current = track.querySelectorAll("img");
    var same =
      current.length === media.length &&
      Array.prototype.every.call(current, function (img, i) {
        return (img.getAttribute("src") || "") === media[i].url;
      });
    if (same) return;

    var slides = "";
    var dotsHtml = "";
    for (var i = 0; i < media.length; i++) {
      var active = i === 0 ? " is-active" : "";
      var src = media[i].url;
      var alt = escapeHtml(media[i].label || media[i].alt || "");
      slides +=
        '<div class="carousel-slide' +
        active +
        '" data-index="' +
        i +
        '"><img src="' +
        escapeHtml(src) +
        '" alt="' +
        alt +
        '" loading="lazy"/></div>';
      dotsHtml +=
        '<button class="carousel-dot' +
        active +
        '" aria-label="Slide ' +
        (i + 1) +
        '" data-index="' +
        i +
        '"></button>';
    }
    track.innerHTML = slides;
    if (dots) dots.innerHTML = dotsHtml;

    var prev = section.querySelector(".carousel-prev");
    var next = section.querySelector(".carousel-next");
    if (media.length <= 1) {
      if (prev) prev.style.display = "none";
      if (next) next.style.display = "none";
      if (dots) dots.style.display = "none";
    } else {
      if (prev) prev.style.display = "";
      if (next) next.style.display = "";
      if (dots) dots.style.display = "";
    }
  }

  function applyProductDocuments(product) {
    var lang = currentLang();
    var docs = (product.media || []).filter(function (m) {
      if (!m) return false;
      var kind = String(m.kind || "").toLowerCase();
      if (kind !== "schematic" && kind !== "document") return false;
      if (m.enabled === false) return false;
      if (lang === "he" && m.enabledHe === false) return false;
      if (lang === "en" && m.enabledEn === false) return false;
      if (lang === "es" && m.enabledEs === false) return false;
      var url =
        (lang === "he" && m.urlHe) ||
        (lang === "en" && m.urlEn) ||
        (lang === "es" && m.urlEs) ||
        m.url ||
        "";
      return Boolean(url);
    });
    var host = document.querySelector(".product-detail-page .product-detail-copy");
    if (!host) return;
    var existing = host.querySelector(".product-documents");
    if (!docs.length) {
      if (existing) existing.remove();
      return;
    }
    var labels = {
      he: { schematic: "שרטוטים", document: "הורד מסמכים" },
      en: { schematic: "Schematics", document: "Download Docs" },
      es: { schematic: "Esquemas", document: "Descargar documentos" },
    };
    var L = labels[lang] || labels.en;
    var html = '<div class="product-documents">';
    for (var i = 0; i < docs.length; i++) {
      var kind = String(docs[i].kind || "").toLowerCase();
      var url =
        (lang === "he" && docs[i].urlHe) ||
        (lang === "en" && docs[i].urlEn) ||
        (lang === "es" && docs[i].urlEs) ||
        docs[i].url;
      var label = kind === "schematic" ? L.schematic : L.document;
      html +=
        '<a class="btn btn-doc" href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(label) +
        "</a>";
    }
    html += "</div>";
    if (existing) existing.outerHTML = html;
    else {
      var desc = host.querySelector(".product-description");
      if (desc) desc.insertAdjacentHTML("afterend", html);
      else host.insertAdjacentHTML("beforeend", html);
    }
  }

  function applySolution(solution, lang) {
    if (!solution) return;
    var tr = (solution.translations || {})[lang] || {};
    setText(document.querySelector(".page-title"), tr.title);
    var lead = document.querySelector(".use-case-about, .solution-lead, .page-lead, .solution-framing");
    setText(lead, tr.lead);
  }

  function applyHomeSolutions(solutions, lang) {
    (solutions || []).forEach(function (sol) {
      if (!sol || !sol.slug) return;
      var tr = (sol.translations || {})[lang] || {};
      var homeText = tr.homeDescription || tr.body || "";
      var anchors = document.querySelectorAll("a.home-solution-group-item[href]");
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        var href = (a.getAttribute("href") || "").split("?")[0].replace(/\/$/, "");
        if (href.indexOf("/" + sol.slug) === -1) continue;
        if (!href.endsWith("/" + sol.slug)) continue;
        setText(a.querySelector(".home-solution-group-item-title"), tr.title);
        var textEl = a.querySelector(".home-solution-group-item-text");
        if (textEl && homeText) setText(textEl, homeText);
      }
    });
  }

  function applyIndustry(industry, lang) {
    if (!industry) return;
    var tr = (industry.translations || {})[lang] || {};
    setText(document.querySelector(".page-title"), tr.title);
    var offer = document.querySelector(".industry-block-offer");
    setText(offer, tr.offer);
    var media = document.querySelector(".industry-block-media");
    if (media && industry.heroImageUrl) {
      media.style.backgroundImage = "url('" + industry.heroImageUrl + "')";
      if (tr.title) media.setAttribute("aria-label", tr.title);
    }
  }

  function applyIndustriesListing(industries, lang) {
    (industries || []).forEach(function (industry) {
      if (!industry || !industry.slug) return;
      var block = document.getElementById(industry.slug);
      if (!block) return;
      var tr = (industry.translations || {})[lang] || {};
      setText(block.querySelector(".industry-block-title"), tr.title);
      setText(block.querySelector(".industry-block-offer"), tr.offer);
      var media = block.querySelector(".industry-block-media");
      if (media && industry.heroImageUrl) {
        media.style.backgroundImage = "url('" + industry.heroImageUrl + "')";
        if (tr.title) media.setAttribute("aria-label", tr.title);
      }
    });
  }

  function applyCmsPage(page, lang, slug) {
    if (!page) return;
    var tr = (page.translations || {})[lang] || {};
    if (!tr) return;
    var body = tr.body || "";

    function paragraphsFromBody(raw) {
      if (!raw) return [];
      var text = raw;
      if (text.indexOf("<") !== -1) {
        var tmp = document.createElement("div");
        tmp.innerHTML = text;
        var nodes = tmp.querySelectorAll("p");
        if (nodes.length) {
          var out = [];
          for (var i = 0; i < nodes.length; i++) {
            var t = (nodes[i].textContent || "").trim();
            if (t) out.push(t);
          }
          return out;
        }
        text = (tmp.textContent || "").trim();
      }
      return text
        .split(/\n\s*\n/)
        .map(function (p) {
          return p.replace(/\s+/g, " ").trim();
        })
        .filter(Boolean);
    }

    if (slug === "about") {
      if (tr.title) setText(document.querySelector(".about-hero-title"), tr.title);
      var story = document.querySelector(".about-story");
      if (story && body) {
        var paras = paragraphsFromBody(body);
        if (paras.length) setHtml(story, plainToStoryHtml(paras.join("\n\n")));
      }
      return;
    }

    if (tr.title) setText(document.querySelector(".page-title"), tr.title);
    var rich = document.querySelector(".page-content .rich-content, .page-content .rich-text");
    if (rich && body) {
      var parts = paragraphsFromBody(body);
      if (parts.length) {
        setHtml(
          rich,
          parts
            .map(function (p) {
              return "<p>" + p.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>";
            })
            .join(""),
        );
      }
    }
  }

  function apply(snapshot) {
    if (!snapshot) return;
    var lang = currentLang();
    var slug = currentSlug();
    applyContact(snapshot.settings || {});
    applyNavSolutions(snapshot.solutions || [], lang);

    if (!slug) {
      // Homepage: apply per-solution home descriptions from CMS.
      applyHomeSolutions(snapshot.solutions || [], lang);
      return;
    }

    if (slug === "industries") {
      applyIndustriesListing(snapshot.industries || [], lang);
      return;
    }

    var product = findBySlug(snapshot.products, slug);
    if (product) {
      applyProduct(product, lang);
      return;
    }
    var solution = findBySlug(snapshot.solutions, slug);
    if (solution) {
      applySolution(solution, lang);
      return;
    }
    var industry = findBySlug(snapshot.industries, slug);
    if (industry) {
      applyIndustry(industry, lang);
      return;
    }

    applyCmsPage(findPage(snapshot.pages, slug), lang, slug);
  }

  fetch(SNAPSHOT_URL, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("snapshot " + res.status);
      return res.json();
    })
    .then(apply)
    .catch(function () {
      /* keep baked-in static content */
    });
})();
