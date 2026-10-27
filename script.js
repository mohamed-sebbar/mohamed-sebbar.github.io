(() => {
  "use strict";
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeToggle = document.querySelector(".theme-toggle");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const toast = document.querySelector(".toast");
  const themeColors = { light: "#f5f4ef", dark: "#121713" };

  function applyTheme(theme, persist = true) {
    const next = theme === "dark" ? "dark" : "light";
    root.dataset.theme = next;
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(next === "dark"));
      themeToggle.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
    if (themeMeta) themeMeta.setAttribute("content", themeColors[next]);
    if (persist) {
      try { localStorage.setItem("theme", next); } catch { /* Storage may be disabled. */ }
    }
  }

  function initialTheme() {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* Use the system preference when storage is unavailable. */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  applyTheme(initialTheme(), false);
  themeToggle?.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  function closeMenu() {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("inert", "");
    document.body.classList.remove("menu-open");
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", () => {
      const opening = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
      mobileNav.classList.toggle("is-open", opening);
      if (opening) mobileNav.removeAttribute("inert");
      else mobileNav.setAttribute("inert", "");
      document.body.classList.toggle("menu-open", opening);
    });
    mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 800) closeMenu(); });
  }

  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  document.querySelectorAll("[data-copy-email]").forEach(button => {
    button.addEventListener("click", async () => {
      const email = button.dataset.copyEmail;
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
        showToast("Email address copied.");
      } catch {
        const field = document.createElement("textarea");
        field.value = email;
        field.setAttribute("readonly", "");
        Object.assign(field.style, { position: "fixed", opacity: "0" });
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        showToast(copied ? "Email address copied." : `Email: ${email}`);
      }
    });
  });

  const year = String(new Date().getFullYear());
  const yearNode = document.querySelector("#year");
  if (yearNode) yearNode.textContent = year;
  document.querySelectorAll(".current-year").forEach(node => { node.textContent = year; });

  document.querySelectorAll(".shot img, .case-image img, .gallery-item img, .cinematic-frame img, .about-portrait img").forEach(img => {
    const markMissing = () => img.parentElement.classList.add("no-img");
    img.addEventListener("error", markMissing, { once: true });
    if (img.complete && img.naturalWidth === 0) markMissing();
  });

 
  const revealSelector =
    ".section-heading, .project-card, .case-heading, .principle, " +
    ".about-copy, .contact-top, .timeline-item, [data-reveal], " +
    ".documentation-block, .cinematic-band";

  if (
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -25px 0px"
    });

    function observeRevealElements(scope = document) {
      scope.querySelectorAll(revealSelector).forEach(target => {
        if (target.dataset.revealObserved === "true") return;

        target.dataset.revealObserved = "true";
        target.classList.add("reveal-on-scroll");
        observer.observe(target);
      });
    }

    observeRevealElements();

    document.addEventListener("projects-loaded", () => {
      observeRevealElements();
    });
}

})();


async function loadProject(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}: ${response.status}`);
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

async function loadProjects() {
  await Promise.all([
    loadProject("project-proj1", "projects/proj1.html"),
    loadProject("project-proj2", "projects/proj2.html"),
    loadProject("project-proj3", "projects/proj3.html")
  ]);

  document.dispatchEvent(new CustomEvent("projects-loaded"));
}

loadProjects();