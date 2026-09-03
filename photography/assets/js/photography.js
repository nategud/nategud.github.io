(function () {
const carousel = document.getElementById("projectCarousel");
const cards = [...carousel.querySelectorAll(".project-card")];
const hoverMode = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

const rail = new window.ThumbnailRail({
  container: carousel,
  items: cards,
  initialIndex: Math.floor(cards.length / 2),
  getDragDistance: () => clamp(carousel.clientWidth * 0.36, 180, 430),
  prepareRender: () => ({
    spacing: cards[0].offsetWidth + (carousel.clientWidth <= 700 ? 9 : 12)
  }),
  renderItem: (card, { delta, distance }, { spacing }) => {
    const x = delta * spacing;

    card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, 0)`;
    card.style.zIndex = Math.round(1000 - distance * 100);
  },
  onItemState: (card, { active }) => {
    card.tabIndex = active ? 0 : -1;
    if (active) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  }
});

cards.forEach((card, index) => {
  card.addEventListener("click", event => {
    if (rail.consumeDragged()) {
      event.preventDefault();
      return;
    }

    if (!card.classList.contains("is-active")) {
      event.preventDefault();
      rail.goTo(index);
    }
  });
});

let tiltedImage = null;

function resetTilt() {
  if (!tiltedImage) return;
  tiltedImage.style.transform = "";
  tiltedImage.style.boxShadow = "";
  tiltedImage = null;
}

carousel.addEventListener("pointermove", event => {
  if (!hoverMode.matches || rail.dragging || reducedMotion.matches) {
    resetTilt();
    return;
  }

  const image = carousel.querySelector(".project-card.is-active img");
  if (!image) return resetTilt();

  const rect = image.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left && event.clientX <= rect.right &&
    event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) return resetTilt();

  tiltedImage = image;
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  image.style.transform = `perspective(900px) rotateX(${y * -2.4}deg) rotateY(${x * 2.4}deg) translateZ(1px)`;
  image.style.boxShadow = `${x * -5}px ${20 + y * 3}px 62px rgba(0, 0, 0, 0.105)`;
});

carousel.addEventListener("pointerleave", resetTilt);
})();
