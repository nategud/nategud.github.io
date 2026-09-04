(() => {
  const page = document.querySelector('.photography');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const records = [...page.querySelectorAll('.project')].map(node => ({
    node, title: node.querySelector('.project-title'),
    panel: node.querySelector('.project-reveal'), strip: node.querySelector('.photo-strip'),
    track: node.querySelector('.preview-track'),
    images: [...node.querySelectorAll('.preview-photo img')], max: 0, suppressClickUntil: 0
  }));
  const byNode = new Map(records.map(record => [record.node, record]));
  let active = null, input = 'keyboard', lastPointer = null, gesture = null;
  let frame = 0, idleTimer = 0, motion = null, observer = null;
  let position = 0, target = 0, direction = 1, lastFrame = 0, lastActivity = 0;
  let idleSpeed = 0;
  const idleDelay = 4000, cruiseSpeed = 36, acceleration = 60;
  const clamp = value => Math.max(0, Math.min(active?.max || 0, value));

  function stopMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    motion = null;
    if (active) {
      active.track.style.transform = '';
      position = target = active.strip.scrollLeft;
    }
  }

  function renderPosition() {
    // Some browsers round native scrolling. The track supplies the missing fraction
    // so photographs move every frame, even at a slow pace or high refresh rate.
    active.strip.scrollLeft = Math.floor(position);
    active.track.style.transform = `translate3d(${active.strip.scrollLeft - position}px, 0, 0)`;
  }

  function waitForIdle() {
    if (idleTimer || !active || reduced.matches || document.hidden) return;
    idleTimer = setTimeout(() => {
      idleTimer = 0;
      if (!active || reduced.matches || document.hidden) return;
      if (gesture || performance.now() - lastActivity < idleDelay) waitForIdle();
      else if (active.images.length > 1 && active.max > 0) startMotion('idle');
    }, Math.max(100, idleDelay - (performance.now() - lastActivity)));
  }

  function activity() {
    lastActivity = performance.now();
    if (motion === 'idle') stopMotion();
    waitForIdle();
  }

  function tick(now) {
    frame = 0;
    if (!active || document.hidden || gesture) return;
    const dt = Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    if (motion === 'idle') {
      const remaining = direction > 0 ? active.max - position : position;
      const desiredSpeed = Math.min(cruiseSpeed, Math.sqrt(2 * acceleration * remaining));
      const previousSpeed = idleSpeed;
      idleSpeed += Math.max(-acceleration * dt, Math.min(acceleration * dt, desiredSpeed - idleSpeed));
      position = clamp(position + direction * (previousSpeed + idleSpeed) * .5 * dt);
      if ((direction > 0 && position >= active.max) || (direction < 0 && position <= 0)) {
        direction *= -1;
        idleSpeed = 0;
      }
      target = position;
    } else {
      position += (target - position) * (1 - Math.exp(-14 * dt));
      if (Math.abs(target - position) < .15) {
        active.strip.scrollLeft = target;
        stopMotion();
        return;
      }
    }
    renderPosition();
    frame = requestAnimationFrame(tick);
  }

  function startMotion(kind) {
    motion = kind;
    if (kind === 'idle') {
      idleSpeed = 0;
      if (position >= active.max) direction = -1;
      else if (position <= 0) direction = 1;
    }
    if (!frame && active && !document.hidden && !reduced.matches) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function move(delta) {
    if (!active) return false;
    activity();
    const next = clamp(target + delta);
    if (next === target) return false;
    target = next;
    if (reduced.matches) active.strip.scrollLeft = position = target;
    else startMotion('scroll');
    return true;
  }

  function loadImage(image) {
    if (!image.dataset.src) return;
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  }

  function loadPreview(record) {
    record.images.slice(0, 2).forEach(loadImage);
    if ('IntersectionObserver' in window) {
      const pendingObserver = new IntersectionObserver(entries => {
        if (active !== record) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) { loadImage(entry.target); pendingObserver.unobserve(entry.target); }
        });
      }, { root: record.strip, rootMargin: '0px 240px' });
      observer = pendingObserver;
      record.images.filter(image => image.dataset.src).forEach(image => observer.observe(image));
    } else record.images.forEach(loadImage);
  }

  function setOpen(record, open) {
    record.node.classList.toggle('is-selected', open);
    record.title.setAttribute('aria-expanded', String(open));
    record.panel.inert = !open;
    record.panel.setAttribute('aria-hidden', String(!open));
  }

  function select(record) {
    if (record === active) return;
    stopMotion();
    clearTimeout(idleTimer);
    idleTimer = 0;
    observer?.disconnect();
    observer = null;
    if (gesture) endGesture();
    const handoff = Boolean(active && record && input === 'mouse' && !reduced.matches);
    if (active) {
      active.node.classList.toggle('is-retiring', handoff);
      setOpen(active, false);
    }
    active = record;
    if (active) {
      active.node.classList.remove('is-retiring');
      setOpen(active, true);
    }
    page.classList.toggle('has-selection', Boolean(active));
    position = target = 0;
    direction = 1;
    if (active) {
      active.strip.scrollLeft = 0;
      active.max = Math.max(0, active.strip.scrollWidth - active.strip.clientWidth);
      loadPreview(active);
      activity();
    }
  }

  function followPointer(event) {
    if (event.pointerType !== 'mouse' || !hover.matches || gesture) return;
    if (lastPointer?.x === event.clientX && lastPointer?.y === event.clientY) return;
    lastPointer = { x: event.clientX, y: event.clientY };
    input = 'mouse';
    const title = event.target.closest('.project-title');
    const preview = event.target.closest('.project-reveal-inner') ||
      event.target.closest('.project-reveal-clip') || event.target.closest('.project-hover-bridge');
    const record = byNode.get((title || preview)?.closest('.project'));
    // React on entry, even during a quick sweep. CSS reverses each reveal
    // from its current progress when the pointer moves to the next title.
    if (title && record) select(record);
    else {
      if (!preview || record !== active) select(null);
    }
    if (active) activity();
  }

  function leavePage() {
    if (input === 'mouse') select(null);
    lastPointer = null;
  }

  function endGesture() {
    const ended = gesture;
    gesture = null;
    if (!ended) return;
    if (ended.moved) ended.record.suppressClickUntil = performance.now() + 400;
    const strip = ended.record.strip;
    strip.classList.remove('is-dragging');
    if (strip.hasPointerCapture(ended.id)) strip.releasePointerCapture(ended.id);
    if (active) position = target = active.strip.scrollLeft;
  }

  records.forEach(record => {
    const { title, strip, images } = record;
    const ratio = image => Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
    images.forEach(image => image.parentElement.style.setProperty('--ratio', ratio(image)));
    strip.style.setProperty('--first-ratio', ratio(images[0]));
    strip.style.setProperty('--last-ratio', ratio(images.at(-1)));
    title.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.detail === 0) input = 'keyboard';
      // Desktop clicks follow the project link; touch keeps its preview-first behavior.
      if (event.detail > 0 && input === 'mouse' && hover.matches) return;
      if (active !== record) { event.preventDefault(); select(record); }
    });
    record.panel.addEventListener('transitionend', event => {
      if (event.target === record.panel && event.propertyName === 'grid-template-rows') record.node.classList.remove('is-retiring');
    });
    title.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); title.click(); }
    });
    strip.addEventListener('pointerdown', event => {
      if (active !== record || event.button !== 0) return;
      stopMotion();
      activity();
      gesture = { id: event.pointerId, type: event.pointerType, x: event.clientX, y: event.clientY,
        left: strip.scrollLeft, moved: false, record };
    });
    strip.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const distance = gesture.x - event.clientX;
      if (Math.hypot(distance, gesture.y - event.clientY) > 6) gesture.moved = true;
      if (gesture.type === 'mouse' && gesture.moved) {
        event.preventDefault();
        if (!strip.hasPointerCapture(event.pointerId)) strip.setPointerCapture(event.pointerId);
        strip.classList.add('is-dragging');
        strip.scrollLeft = position = target = clamp(gesture.left + distance);
      }
    });
    function release(event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      endGesture();
      activity();
      if (event.pointerType === 'mouse') {
        lastPointer = null;
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        if (hit) followPointer({ ...event, pointerType: 'mouse', clientX: event.clientX, clientY: event.clientY, target: hit });
      }
    }
    strip.addEventListener('pointerup', release);
    strip.addEventListener('pointercancel', release);
    strip.addEventListener('lostpointercapture', release);
    strip.addEventListener('click', event => {
      if (performance.now() < record.suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    strip.addEventListener('scroll', () => {
      if (active !== record || Math.abs(strip.scrollLeft - position) <= 1.5) return;
      stopMotion(); // Native touch momentum or browser scrolling owns the position.
      activity();
    }, { passive: true });
  });

  page.addEventListener('wheel', event => {
    if (!active || event.ctrlKey) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? active.strip.clientWidth : 1;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (move(delta * unit)) event.preventDefault();
  }, { passive: false });
  page.addEventListener('keydown', event => {
    input = 'keyboard';
    if (!active) return;
    if (event.key === 'Escape') {
      active.title.focus({ preventScroll: true }); select(null); event.preventDefault();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      move((event.key === 'ArrowRight' ? 1 : -1) * 180); event.preventDefault();
    } else if (event.target === active.strip) {
      if (event.key === 'Home' || event.key === 'End') {
        move(event.key === 'Home' ? -active.max : active.max); event.preventDefault();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); active.title.click();
      }
    }
  });
  document.addEventListener('pointermove', followPointer, { passive: true });
  document.addEventListener('pointerdown', event => {
    input = event.pointerType === 'mouse' ? 'mouse' : 'touch';
    if (input === 'touch') lastPointer = null;
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (event.pointerType === 'mouse' && !event.relatedTarget && !gesture) leavePage();
  });
  window.addEventListener('blur', leavePage);
  document.addEventListener('visibilitychange', () => {
    stopMotion(); clearTimeout(idleTimer); idleTimer = 0;
    if (!document.hidden) activity();
  });
  reduced.addEventListener('change', () => {
    stopMotion(); clearTimeout(idleTimer); idleTimer = 0;
    records.forEach(record => record.node.classList.remove('is-retiring')); activity();
  });
  hover.addEventListener('change', () => { if (!hover.matches) leavePage(); });
  const resize = new ResizeObserver(() => {
    records.forEach(record => { record.max = Math.max(0, record.strip.scrollWidth - record.strip.clientWidth); });
    if (active) {
      target = clamp(target); position = clamp(position);
      if (motion) renderPosition();
      else active.strip.scrollLeft = position;
    }
  });
  records.forEach(record => resize.observe(record.strip));
})();
