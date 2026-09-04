(() => {
  const elements = [...document.querySelectorAll('.glass-text')];
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, pending = null, current = null;
  const clamp = value => Math.max(0, Math.min(1, value));

  function reset(element) {
    if (pending?.element === element) {
      cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
    }
    if (current === element) current = null;
    element.classList.remove('is-tilting');
    for (const [name, value] of Object.entries({
      'pointer-x': '0px', 'pointer-y': '0px',
      'pointer-tilt-x': '0deg', 'pointer-tilt-y': '0deg',
      'light-x': '50%', 'light-y': '50%'
    })) element.style.setProperty(`--${name}`, value);
  }

  function paint() {
    frame = 0;
    if (!pending || !hover.matches || reduced.matches) return;
    const { element, clientX, clientY } = pending;
    pending = null;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp((clientX - rect.left) / rect.width);
    const y = clamp((clientY - rect.top) / rect.height);
    const nx = x * 2 - 1, ny = y * 2 - 1;
    element.style.setProperty('--pointer-x', `${nx * 1.2}px`);
    element.style.setProperty('--pointer-y', `${ny * .8}px`);
    element.style.setProperty('--pointer-tilt-x', `${ny * -2.8}deg`);
    element.style.setProperty('--pointer-tilt-y', `${nx * 3.8}deg`);
    element.style.setProperty('--light-x', `${x * 100}%`);
    element.style.setProperty('--light-y', `${y * 100}%`);
  }

  elements.forEach(element => {
    const link = element.closest('a') || element;
    const label = element.textContent.trim();
    element.dataset.label = label;
    // Keep the decorative highlight from duplicating the accessible link name.
    if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label', label);
    function update(event) {
      if (event.pointerType !== 'mouse' || !hover.matches || reduced.matches) return;
      if (current && current !== element) reset(current);
      current = element;
      element.classList.add('is-tilting');
      pending = { element, clientX: event.clientX, clientY: event.clientY };
      // One update per display frame, only for the text under the pointer.
      if (!frame) frame = requestAnimationFrame(paint);
    }
    link.addEventListener('pointerenter', update);
    link.addEventListener('pointermove', update);
    link.addEventListener('pointerleave', () => reset(element));
    link.addEventListener('blur', () => reset(element));
  });

  function clear() { if (current) reset(current); }
  hover.addEventListener('change', clear);
  reduced.addEventListener('change', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
})();
