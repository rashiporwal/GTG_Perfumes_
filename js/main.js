document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-header]");
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");
  let lastScroll = window.scrollY;

  hamburger?.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", String(!isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    mobileMenu?.classList.toggle("active", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    hamburger?.setAttribute("aria-expanded", "false");
    hamburger?.setAttribute("aria-label", "Open menu");
    mobileMenu.classList.remove("active");
    document.body.classList.remove("menu-open");
  }));

  const progressBar = document.querySelector(".scroll-progress span");
  const hero = document.querySelector(".hero");
  let scrollTicking = false;
  const updateScrollUI = () => {
    const current = window.scrollY;
    header?.classList.toggle("is-scrolled", current > 24);
    if (current > lastScroll && current > 180 && !mobileMenu?.classList.contains("active")) header?.classList.add("is-hidden");
    else header?.classList.remove("is-hidden");
    lastScroll = current;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${scrollable > 0 ? Math.min(current / scrollable, 1) : 0})`;
    if (hero && current < window.innerHeight * 1.2) hero.style.setProperty("--hero-scroll", `${current * .1}px`);
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) { window.requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }, { passive: true });
  updateScrollUI();

  const cursorAura = document.querySelector(".cursor-aura");
  if (cursorAura && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      cursorAura.style.left = `${event.clientX}px`;
      cursorAura.style.top = `${event.clientY}px`;
    }, { passive: true });
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (hero && finePointer && !prefersReducedMotion) {
    const depthElements = [...hero.querySelectorAll("[data-depth]")];
    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      hero.style.setProperty("--hero-shift-x", `${x * -13}px`);
      hero.style.setProperty("--hero-shift-y", `${y * -9}px`);
      depthElements.forEach((element) => {
        const depth = Number(element.dataset.depth || 0);
        element.style.translate = `${x * depth * 16}px ${y * depth * 12}px`;
      });
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--hero-shift-x", "0px");
      hero.style.setProperty("--hero-shift-y", "0px");
      depthElements.forEach((element) => { element.style.translate = "0 0"; });
    });
  }

  document.querySelectorAll(".button, .add-to-cart-btn").forEach((button) => {
    if (!finePointer || prefersReducedMotion) return;
    button.addEventListener("pointermove", (event) => {
      const bounds = button.getBoundingClientRect();
      button.style.translate = `${(event.clientX - bounds.left - bounds.width / 2) * .08}px ${(event.clientY - bounds.top - bounds.height / 2) * .12}px`;
    }, { passive: true });
    button.addEventListener("pointerleave", () => { button.style.translate = "0 0"; });
  });

  const canvas = document.querySelector(".scent-canvas");
  if (canvas && hero && !prefersReducedMotion) {
    const context = canvas.getContext("2d");
    let particles = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let canvasActive = true;
    const pointer = { x: -1000, y: -1000 };
    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvasWidth = hero.clientWidth;
      canvasHeight = hero.clientHeight;
      canvas.width = Math.round(canvasWidth * ratio);
      canvas.height = Math.round(canvasHeight * ratio);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.max(18, Math.round(canvasWidth / 65)) }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: 1 + Math.random() * 3,
        speed: .12 + Math.random() * .32,
        drift: (Math.random() - .5) * .18,
        alpha: .08 + Math.random() * .19
      }));
    };
    const drawCanvas = () => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      particles.forEach((particle) => {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150) { particle.x -= dx * .0014; particle.y -= dy * .0014; }
        particle.y -= particle.speed;
        particle.x += particle.drift;
        if (particle.y < -10) { particle.y = canvasHeight + 10; particle.x = Math.random() * canvasWidth; }
        const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 5);
        glow.addColorStop(0, `rgba(238,248,239,${particle.alpha})`);
        glow.addColorStop(1, "rgba(238,248,239,0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
        context.fill();
      });
      if (canvasActive) window.requestAnimationFrame(drawCanvas);
    };
    hero.addEventListener("pointermove", (event) => { const bounds = hero.getBoundingClientRect(); pointer.x = event.clientX - bounds.left; pointer.y = event.clientY - bounds.top; }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.x = -1000; pointer.y = -1000; });
    new ResizeObserver(resizeCanvas).observe(hero);
    new IntersectionObserver(([entry]) => {
      const shouldRun = entry.isIntersecting;
      if (shouldRun && !canvasActive) { canvasActive = true; drawCanvas(); }
      if (!shouldRun) canvasActive = false;
    }, { threshold: .02 }).observe(hero);
    resizeCanvas();
    drawCanvas();
  }

  const images = ["assets/images/gtg-gallery-01.webp", "assets/images/gtg-gallery-02.webp", "assets/images/gtg-gallery-03.webp", "assets/images/gtg-gallery-04.webp"];
  const imageAlts = ["GTG Original perfume bottle, front view", "GTG Original perfume bottle, three-quarter right view", "GTG Original perfume bottle with botanical shadow", "GTG Original perfume bottle, three-quarter left view"];
  const mainImage = document.querySelector("#mainImage");
  const galleryMain = document.querySelector(".gallery-main");
  const thumbnailButtons = [...document.querySelectorAll(".gallery-thumbnails button")];
  const currentSlide = document.querySelector("[data-current-slide]");
  let currentIndex = 0;
  const updateGallery = (index) => {
    if (!mainImage) return;
    currentIndex = (index + images.length) % images.length;
    galleryMain?.classList.add("is-changing");
    mainImage.style.opacity = ".35";
    const nextImage = new Image();
    let committed = false;
    const commitImage = () => {
      if (committed) return;
      committed = true;
      mainImage.src = images[currentIndex];
      mainImage.alt = imageAlts[currentIndex];
      window.requestAnimationFrame(() => {
        mainImage.style.opacity = "1";
        galleryMain?.classList.remove("is-changing");
      });
    };
    nextImage.onload = commitImage;
    nextImage.onerror = commitImage;
    nextImage.src = images[currentIndex];
    if (nextImage.complete) commitImage();
    thumbnailButtons.forEach((button, i) => button.classList.toggle("active", i === currentIndex));
    if (currentSlide) currentSlide.textContent = String(currentIndex + 1).padStart(2, "0");
  };
  thumbnailButtons.forEach((button) => button.addEventListener("click", () => updateGallery(Number(button.dataset.index))));
  document.querySelector(".gallery-arrow.right")?.addEventListener("click", () => updateGallery(currentIndex + 1));
  document.querySelector(".gallery-arrow.left")?.addEventListener("click", () => updateGallery(currentIndex - 1));
  images.slice(1).forEach((source) => { const image = new Image(); image.src = source; });

  if (galleryMain) {
    galleryMain.tabIndex = 0;
    galleryMain.setAttribute("role", "group");
    galleryMain.setAttribute("aria-label", "Product image gallery. Use arrow keys or swipe to browse.");
    galleryMain.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); updateGallery(currentIndex + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); updateGallery(currentIndex - 1); }
    });
    let pointerStartX = 0;
    galleryMain.addEventListener("pointerdown", (event) => { pointerStartX = event.clientX; });
    galleryMain.addEventListener("pointerup", (event) => {
      const distance = event.clientX - pointerStartX;
      if (Math.abs(distance) > 45) updateGallery(currentIndex + (distance < 0 ? 1 : -1));
    });
    if (window.matchMedia("(pointer: fine)").matches) {
      galleryMain.addEventListener("pointermove", (event) => {
        const bounds = galleryMain.getBoundingClientRect();
        galleryMain.style.setProperty("--parallax-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 7}px`);
        galleryMain.style.setProperty("--parallax-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 7}px`);
      }, { passive: true });
      galleryMain.addEventListener("pointerleave", () => {
        galleryMain.style.setProperty("--parallax-x", "0px");
        galleryMain.style.setProperty("--parallax-y", "0px");
      });
    }
  }

  const scentStage = document.querySelector("[data-scent-stage]");
  if (scentStage) {
    const scentData = {
      citrus: { phase: "Opening note", kicker: "Opening note", title: "Bergamot mist", description: "A clean, bright opening that catches the light before melting softly into the floral heart.", brightness: 84, warmth: 42, depth: 36, accent: "#d8df9e", soft: "rgba(203,220,151,.22)", image: "assets/images/gtg-gallery-01.webp" },
      floral: { phase: "Heart note", kicker: "Heart note", title: "Iris veil", description: "A soft floral layer with powdery clarity—quietly expressive, weightless and composed close to the skin.", brightness: 62, warmth: 68, depth: 54, accent: "#e5b9c4", soft: "rgba(229,185,196,.2)", image: "assets/images/gtg-gallery-03.webp" },
      woods: { phase: "Base note", kicker: "Base note", title: "Cedar hush", description: "Dry woods and mineral warmth create a grounded finish that lingers with calm, understated depth.", brightness: 38, warmth: 76, depth: 88, accent: "#c9a57b", soft: "rgba(201,165,123,.2)", image: "assets/images/gtg-gallery-04.webp" }
    };
    const labCopy = scentStage.querySelector(".lab-copy");
    const labImage = scentStage.querySelector(".lab-visual > img");
    const labVisual = scentStage.querySelector(".lab-visual");
    const labTabs = [...scentStage.querySelectorAll("[data-scent]")];
    let scentTransition = 0;
    const updateScent = (key, shouldFocus = false) => {
      const data = scentData[key];
      if (!data) return;
      const labSection = scentStage.closest(".scent-lab");
      labSection?.style.setProperty("--lab-accent", data.accent);
      labSection?.style.setProperty("--lab-soft", data.soft);
      labCopy?.classList.remove("is-changing");
      void labCopy?.offsetWidth;
      labCopy?.classList.add("is-changing");
      const fields = { "[data-lab-phase]": data.phase, "[data-lab-kicker]": data.kicker, "[data-lab-title]": data.title, "[data-lab-description]": data.description };
      Object.entries(fields).forEach(([selector, value]) => { const element = scentStage.querySelector(selector); if (element) element.textContent = value; });
      ["brightness", "warmth", "depth"].forEach((metric) => {
        const meter = scentStage.querySelector(`[data-meter="${metric}"]`);
        const value = scentStage.querySelector(`[data-value="${metric}"]`);
        if (meter) meter.style.width = `${data[metric]}%`;
        if (value) value.textContent = String(data[metric]);
      });
      if (labImage) {
        const transition = ++scentTransition;
        labImage.style.opacity = ".35";
        window.setTimeout(() => {
          if (transition !== scentTransition) return;
          labImage.src = data.image;
          labImage.style.opacity = "1";
        }, 180);
      }
      labTabs.forEach((tab) => { const active = tab.dataset.scent === key; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; });
      if (shouldFocus) labTabs.find((tab) => tab.dataset.scent === key)?.focus();
    };
    labTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => updateScent(tab.dataset.scent));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
        event.preventDefault();
        const step = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
        const next = labTabs[(index + step + labTabs.length) % labTabs.length];
        updateScent(next.dataset.scent, true);
      });
    });
    if (labVisual && finePointer && !prefersReducedMotion) {
      labVisual.addEventListener("pointermove", (event) => {
        const bounds = labVisual.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        labVisual.style.setProperty("--lab-move-x", `${x * 30}px`);
        labVisual.style.setProperty("--lab-move-y", `${y * 24}px`);
        labVisual.style.setProperty("--lab-img-x", `${x * 7}px`);
        labVisual.style.setProperty("--lab-img-y", `${y * 6}px`);
      }, { passive: true });
      labVisual.addEventListener("pointerleave", () => ["--lab-move-x", "--lab-move-y", "--lab-img-x", "--lab-img-y"].forEach((property) => labVisual.style.setProperty(property, "0px")));
    }
    updateScent("citrus");
  }

  const subscriptionCards = [...document.querySelectorAll(".subscription-card")];
  const cartButton = document.querySelector(".add-to-cart-btn");
  const prices = { "Single Subscription": "99.99", "Double Subscription": "169.99" };
  const updateCartPrice = () => {
    const plan = document.querySelector('input[name="subscription"]:checked')?.value || "Single Subscription";
    const priceLabel = cartButton?.querySelector("strong");
    if (priceLabel) priceLabel.textContent = `$${prices[plan]}`;
  };
  subscriptionCards.forEach((card) => {
    const radio = card.querySelector('input[name="subscription"]');
    card.querySelector(".subscription-header")?.addEventListener("click", () => {
      if (radio) radio.checked = true;
      subscriptionCards.forEach((item) => item.classList.toggle("active", item === card));
      updateCartPrice();
    });
    radio?.addEventListener("change", () => {
      subscriptionCards.forEach((item) => item.classList.toggle("active", item === card));
      updateCartPrice();
    });
  });
  cartButton?.addEventListener("click", (event) => {
    event.preventDefault();
    const plan = document.querySelector('input[name="subscription"]:checked')?.value || "Single Subscription";
    let fragrance1 = "Original";
    let fragrance2 = "";
    if (plan === "Single Subscription") fragrance1 = document.querySelector('input[name="single-fragrance"]:checked')?.value || "Original";
    else {
      fragrance1 = document.querySelector('input[name="double-fragrance-1"]:checked')?.value || "Original";
      fragrance2 = document.querySelector('input[name="double-fragrance-2"]:checked')?.value || "Lily";
    }
    window.location.href = `AddToCart.html?${new URLSearchParams({ plan, fragrance1, fragrance2, price: prices[plan] })}`;
  });

  const accordionItems = [...document.querySelectorAll(".accordion-item")];
  accordionItems.forEach((item) => {
    const button = item.querySelector(".accordion-header");
    button?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("active");
      accordionItems.forEach((other) => {
        other.classList.remove("active");
        other.querySelector(".accordion-header")?.setAttribute("aria-expanded", "false");
        const symbol = other.querySelector(".accordion-header b");
        if (symbol) symbol.textContent = "+";
      });
      if (!wasOpen) {
        item.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        const symbol = button.querySelector("b");
        if (symbol) symbol.textContent = "−";
      }
    });
  });

  const table = document.querySelector(".comparison-table");
  table?.querySelectorAll("thead th[data-col]").forEach((headerCell) => headerCell.addEventListener("click", () => {
    const column = headerCell.dataset.col;
    table.querySelectorAll(".highlight").forEach((cell) => cell.classList.remove("highlight"));
    headerCell.classList.add("highlight");
    table.querySelectorAll(`tbody td:nth-child(${column})`).forEach((cell) => cell.classList.add("highlight"));
  }));

  if (window.location.hash) {
    const deepLinkedSection = document.querySelector(window.location.hash);
    deepLinkedSection?.classList.add("visible");
    deepLinkedSection?.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
  }

  const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px" });
  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    revealObserver.observe(element);
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  }), { rootMargin: "-40% 0px -50%" });
  sections.forEach((section) => sectionObserver.observe(section));

  const form = document.querySelector(".newsletter-form");
  const toast = document.querySelector(".toast");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
    toast?.classList.add("show");
    window.setTimeout(() => toast?.classList.remove("show"), 2800);
  });
});
