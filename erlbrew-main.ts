// Erlbrew Café — Main TypeScript Entry
// Handles: nav scroll, mobile menu, Google Maps embed, intersection observers

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  name: string;
  nameJa: string;
  price: number;
  note?: string;
  tag?: "signature" | "new" | "bestseller";
}

interface MenuSection {
  category: string;
  categoryJa: string;
  items: MenuItem[];
}

// ─── Menu Data ────────────────────────────────────────────────────────────────
const menuData: MenuSection[] = [
  {
    category: "Espresso",
    categoryJa: "エスプレッソ",
    items: [
      { name: "Americano", nameJa: "アメリカーノ", price: 89 },
      { name: "Cappuccino", nameJa: "カプチーノ", price: 110 },
      { name: "Café Latte", nameJa: "カフェラテ", price: 115 },
      { name: "Flat White", nameJa: "フラットホワイト", price: 120, tag: "bestseller" },
    ],
  },
  {
    category: "Matcha",
    categoryJa: "抹茶",
    items: [
      { name: "Matcha Latte", nameJa: "抹茶ラテ", price: 130, tag: "signature" },
      { name: "Strawberry Matcha Latte", nameJa: "苺抹茶ラテ", price: 145, tag: "new" },
      { name: "Blueberry Matcha Latte", nameJa: "ブルーベリー抹茶ラテ", price: 145, tag: "new" },
      { name: "Coconut Matcha", nameJa: " coconut 抹茶", price: 135, tag: "signature" },
    ],
  },
  {
    category: "Non-Coffee",
    categoryJa: "ノンコーヒー",
    items: [
      { name: "Chocolate Latte", nameJa: "チョコレートラテ", price: 120 },
      { name: "Chai Latte", nameJa: "チャイラテ", price: 120 },
      { name: "Hojicha Latte", nameJa: "焙じ茶ラテ", price: 125, tag: "signature" },
    ],
  },
  {
    category: "Pastries",
    categoryJa: "ペストリー",
    items: [
      { name: "Croffle", nameJa: "クロッフル", price: 95, tag: "bestseller" },
      { name: "Butter Croissant", nameJa: "クロワッサン", price: 75 },
    ],
  },
];

// ─── Render Menu ──────────────────────────────────────────────────────────────
function renderMenu(): void {
  const container = document.getElementById("menu-grid");
  if (!container) return;

  container.innerHTML = menuData
    .map(
      (section) => `
    <div class="menu-section mb-10">
      <div class="flex items-baseline gap-3 mb-5 pb-3 border-b border-matcha-gold/30">
        <h3 class="font-serif text-xl text-ink font-semibold">${section.category}</h3>
        <span class="font-serif text-sm text-ink-light tracking-widest">${section.categoryJa}</span>
      </div>
      <ul class="space-y-3">
        ${section.items
          .map(
            (item) => `
          <li class="flex items-start justify-between gap-4 group">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-sans text-sm font-medium text-ink">${item.name}</span>
                <span class="font-serif text-xs text-ink-light">${item.nameJa}</span>
                ${
                  item.tag
                    ? `<span class="tag-${item.tag} text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold tracking-wide uppercase">${item.tag}</span>`
                    : ""
                }
              </div>
            </div>
            <span class="font-sans text-sm font-semibold text-matcha-green whitespace-nowrap">₱${item.price}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `
    )
    .join("");
}

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
function initMobileNav(): void {
  const toggle = document.getElementById("nav-toggle");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("mobile-overlay");

  if (!toggle || !drawer || !overlay) return;

  const openDrawer = (): void => {
    drawer.classList.remove("translate-x-full");
    overlay.classList.remove("opacity-0", "pointer-events-none");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = (): void => {
    drawer.classList.add("translate-x-full");
    overlay.classList.add("opacity-0", "pointer-events-none");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
}

// ─── Scroll Effects ───────────────────────────────────────────────────────────
function initScrollEffects(): void {
  const header = document.getElementById("site-header");

  window.addEventListener("scroll", () => {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add("bg-washi/95", "backdrop-blur-sm", "shadow-sm");
      header.classList.remove("bg-transparent");
    } else {
      header.classList.remove("bg-washi/95", "backdrop-blur-sm", "shadow-sm");
      header.classList.add("bg-transparent");
    }
  });
}

// ─── Intersection Observer for Animations ─────────────────────────────────────
function initAnimations(): void {
  const targets = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = "1";
          (entry.target as HTMLElement).style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => {
    (el as HTMLElement).style.opacity = "0";
    (el as HTMLElement).style.transform = "translateY(24px)";
    (el as HTMLElement).style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
}

// ─── Smooth Scroll ─────────────────────────────────────────────────────────────
function initSmoothScroll(): void {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const href = anchor.getAttribute("href");
      if (!href) return;
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ─── Active Nav Link ─────────────────────────────────────────────────────────
function initActiveNav(): void {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove("text-matcha-green");
            link.classList.add("text-ink-muted");
            if (link.getAttribute("href") === `#${entry.target.id}`) {
              link.classList.add("text-matcha-green");
              link.classList.remove("text-ink-muted");
            }
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  initMobileNav();
  initScrollEffects();
  initAnimations();
  initSmoothScroll();
  initActiveNav();
});
