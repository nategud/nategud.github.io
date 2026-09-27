(() => {
  // A continuous photo index drives every input method and every 3D transform.
  // The animation frame stops completely when the selected photo settles.
  class CoverFlowRail {
    constructor(options) {
      Object.assign(this, options);
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.position = this.target = options.initialIndex || 0;
      this.activeIndex = -1;
      this.frame = 0;
      this.snapTimer = 0;
      this.drag = null;
      this.suppressClickUntil = 0;
      this.lastWheel = -Infinity;
      this.bindEvents();
      this.refresh();
      this.observer = new ResizeObserver(() => this.refresh());
      this.observer.observe(this.container);
    }

    clamp(value) { return Math.max(0, Math.min(this.items.length - 1, value)); }
    getNearestIndex() { return Math.round(this.position); }
    consumeDragged() { return performance.now() < this.suppressClickUntil; }

    refresh() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const maxWidth = Math.min(width * (width < 700 ? .66 : .40), 760);
      const maxHeight = Math.max(72, Math.min(height * .45, height - 280));
      this.sizes = this.items.map(card => {
        const image = card.querySelector('.photo-image');
        const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
        const w = Math.min(maxWidth, maxHeight * ratio);
        const h = w / ratio;
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        return { width: w, height: h };
      });
      this.stride = Math.max(100, Math.min(width * .36, 360));
      this.sideStep = Math.max(28, Math.min(width * .055, 78));
      this.render();
    }

    render() {
      const index = this.getNearestIndex();
      const low = Math.floor(this.position), high = Math.ceil(this.position);
      const blend = this.position - low;
      const mix = key => this.sizes[low][key] * (1 - blend) + this.sizes[high][key] * blend;
      const width = mix('width'), height = mix('height');
      const reflection = Math.min(100, height * .34);
      const floor = Math.min(
        (this.container.clientHeight + height - reflection - 56) / 2,
        this.container.clientHeight - reflection - 170
      );
      this.container.style.setProperty('--floor', `${floor}px`);
      this.container.style.setProperty('--reflection-depth', `${reflection}px`);

      this.items.forEach((card, i) => {
        const distance = i - this.position;
        const absolute = Math.abs(distance);
        const visible = absolute <= 6;
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.inert = !visible;
        if (!visible) return;
        // Load only the nearby photographs, with the same cached source for the mirror.
        card.querySelectorAll('img[data-src]').forEach(image => {
          image.src = image.dataset.src;
          image.removeAttribute('data-src');
        });
        const turn = Math.min(absolute, 1);
        const side = Math.sign(distance);
        const spacing = width * .5 + this.sizes[i].width * .10 + 12;
        const x = side * (turn * spacing + Math.max(0, absolute - 1) * this.sideStep);
        const z = -turn * this.sizes[i].width * .47;
        card.style.transform = `translate(-50%, -100%) translate3d(${x}px, 0, ${z}px) rotateY(${-side * turn * 65}deg)`;
        card.style.zIndex = String(10000 - Math.round(absolute * 1000));
      });

      if (index !== this.activeIndex) {
        this.items[this.activeIndex]?.classList.remove('is-active');
        this.items[this.activeIndex]?.removeAttribute('aria-current');
        this.activeIndex = index;
        this.items[index].classList.add('is-active');
        this.items[index].setAttribute('aria-current', 'true');
        this.onActiveChange?.(index);
      }
      this.onProgress?.(this.items.length > 1 ? this.position / (this.items.length - 1) : 0, index);
    }

    stop() {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.snapTimer);
      this.frame = 0;
      this.snapTimer = 0;
    }

    animate() {
      if (this.frame) return;
      let last = performance.now();
      const tick = now => {
        this.frame = 0;
        // A frame timestamp can precede performance.now() from the scheduling call.
        const elapsed = Math.max(0, Math.min(50, now - last));
        last = now;
        const difference = this.target - this.position;
        this.position = this.reduced.matches || Math.abs(difference) < .001
          ? this.target : this.clamp(this.position + difference * (1 - Math.exp(-elapsed / 85)));
        this.render();
        if (this.position !== this.target) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }

    centerItem(index) {
      clearTimeout(this.snapTimer);
      this.target = this.clamp(Math.round(index));
      this.animate();
    }
    setProgress(progress) {
      this.stop();
      this.target = this.position = this.clamp(progress * (this.items.length - 1));
      this.render();
    }
    snapToNearest() { this.centerItem(this.position); }

    finishDrag(event, cancelled = false) {
      if (!this.drag || (event.pointerId !== undefined && event.pointerId !== this.drag.id)) return;
      const drag = this.drag;
      this.drag = null;
      this.container.classList.remove('is-dragging');
      if (this.container.hasPointerCapture(drag.id)) this.container.releasePointerCapture(drag.id);
      if (drag.moved) {
        this.stop();
        this.suppressClickUntil = performance.now() + 400;
        const velocity = cancelled || performance.now() - drag.time > 90 ? 0 : drag.velocity;
        const coast = Math.max(-2, Math.min(2, velocity * 150));
        this.centerItem(this.position + coast);
      } else this.snapToNearest();
    }

    bindEvents() {
      this.container.addEventListener('wheel', event => {
        if (event.ctrlKey) return; // Keep browser pinch/zoom available.
        const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!amount) return;
        event.preventDefault();
        if (this.drag) return;
        const now = performance.now();
        if (event.deltaMode !== 0 || Math.abs(amount) >= 50) {
          if (now - this.lastWheel < 90) return;
          this.lastWheel = now;
          this.centerItem(Math.round(this.target) + Math.sign(amount));
        } else {
          this.target = this.clamp(this.target + amount / this.stride);
          this.animate();
          clearTimeout(this.snapTimer);
          this.snapTimer = setTimeout(() => this.centerItem(this.target), 140);
        }
      }, { passive: false });

      this.container.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0 || this.drag) return;
        this.stop();
        this.target = this.position;
        this.drag = { id: event.pointerId, startX: event.clientX, start: this.position,
          lastX: event.clientX, time: performance.now(), velocity: 0, moved: false };
      });
      this.container.addEventListener('pointermove', event => {
        const drag = this.drag;
        if (!drag || event.pointerId !== drag.id) return;
        const dx = drag.startX - event.clientX;
        if (!drag.moved && Math.abs(dx) > 6) {
          drag.moved = true;
          this.container.classList.add('is-dragging');
          this.container.setPointerCapture(drag.id);
        }
        if (!drag.moved) return;
        event.preventDefault();
        const now = performance.now();
        const speed = (drag.lastX - event.clientX) / this.stride / Math.max(1, now - drag.time);
        drag.velocity = drag.velocity * .4 + speed * .6;
        drag.lastX = event.clientX;
        drag.time = now;
        this.position = this.target = this.clamp(drag.start + dx / this.stride);
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
      });
      this.container.addEventListener('pointerup', event => this.finishDrag(event));
      this.container.addEventListener('pointercancel', event => this.finishDrag(event, true));
      this.container.addEventListener('lostpointercapture', event => this.finishDrag(event, true));
      this.container.addEventListener('pointerleave', event => {
        if (this.drag && !this.drag.moved) this.finishDrag(event, true);
      });
      this.container.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'Home') this.centerItem(0);
        else if (event.key === 'End') this.centerItem(this.items.length - 1);
        else this.centerItem(Math.round(this.target) + (event.key === 'ArrowRight' ? 1 : -1));
      });
      window.addEventListener('blur', () => this.finishDrag({}, true));
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.finishDrag({}, true);
          this.stop();
          this.position = this.target = Math.round(this.target);
          this.render();
        }
      });
      this.reduced.addEventListener('change', () => { this.centerItem(this.target); });
    }
  }
  window.CoverFlowRail = CoverFlowRail;
})();
