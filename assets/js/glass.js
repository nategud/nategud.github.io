(function () {
const elements = [...document.querySelectorAll(".glass-text")];
const hoverMode = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function resetPointerEffect(element) {
  element.classList.remove("is-tilting");
  element.style.setProperty("--pointer-x", "0px");
  element.style.setProperty("--pointer-y", "0px");
  element.style.setProperty("--pointer-tilt-x", "0deg");
  element.style.setProperty("--pointer-tilt-y", "0deg");
  element.style.setProperty("--light-x", "50%");
  element.style.setProperty("--light-y", "50%");
}

elements.forEach(element => {
  element.addEventListener("pointerenter", () => {
    if (!hoverMode.matches || reducedMotion.matches) return;
    element.classList.add("is-tilting");
  });

  element.addEventListener("pointermove", event => {
    if (!hoverMode.matches || reducedMotion.matches) return;

    const rect = element.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const normalizedX = x * 2 - 1;
    const normalizedY = y * 2 - 1;

    element.style.setProperty("--pointer-x", `${normalizedX * 1.2}px`);
    element.style.setProperty("--pointer-y", `${normalizedY * 0.8}px`);
    element.style.setProperty("--pointer-tilt-x", `${normalizedY * -2.8}deg`);
    element.style.setProperty("--pointer-tilt-y", `${normalizedX * 3.8}deg`);
    element.style.setProperty("--light-x", `${x * 100}%`);
    element.style.setProperty("--light-y", `${y * 100}%`);
  });

  element.addEventListener("pointerleave", () => resetPointerEffect(element));
  element.addEventListener("blur", () => resetPointerEffect(element));
});
})();
