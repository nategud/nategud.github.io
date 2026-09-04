(function () {
  class SimpleHorizontalRail {
    constructor(options) {
      this.container = options.container;
      this.track = options.track;
      this.items = options.items;
      this.initialIndex = options.initialIndex ?? 0;
      this.onActiveChange = options.onActiveChange || (() => {});
      this.onProgress = options.onProgress || (() => {});
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      this.activeIndex = -1;
      this.scrollFrame = null;
      this.motionFrame = null;
      this.snapTimer = null;
      this.dragging = false;
      this.dragged = false;
      this.pointerType = "mouse";
      this.dragStartX = 0;
      this.dragStartScroll = 0;
      this.lastPointerX = 0;
      this.lastPointerTime = 0;
      this.velocity = 0;
      this.lastMotionTime = 0;
      this.lastWheelStep = 0;
      this.itemCenters = [];
      this.maximum = 0;
      this.viewportWidth = 0;

      this.bindEvents();
      requestAnimationFrame(() => this.refresh(this.initialIndex));
    }

    clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    clampIndex(index) {
      return this.clamp(index, 0, this.items.length - 1);
    }

    getMaxScroll() {
      return this.maximum;
    }

    setEdgePadding() {
      if (!this.items.length) return;
      const firstPadding = Math.max(
        0,
        this.container.clientWidth / 2 - this.items[0].offsetWidth / 2
      );
      const lastPadding = Math.max(
        0,
        this.container.clientWidth / 2 - this.items[this.items.length - 1].offsetWidth / 2
      );
      this.track.style.paddingLeft = `${firstPadding}px`;
      this.track.style.paddingRight = `${lastPadding}px`;
    }

    stopMotion() {
      if (this.motionFrame) cancelAnimationFrame(this.motionFrame);
      if (this.snapTimer) clearTimeout(this.snapTimer);
      this.motionFrame = null;
      this.snapTimer = null;
      this.velocity = 0;
      this.lastMotionTime = 0;
    }

    centerItem(index, behavior = "smooth") {
      const item = this.items[this.clampIndex(index)];
      if (!item) return;
      this.stopMotion();
      const left = item.offsetLeft + item.offsetWidth / 2 - this.container.clientWidth / 2;
      this.container.scrollTo({
        left,
        behavior: this.reducedMotion.matches ? "auto" : behavior
      });
    }

    getNearestIndex() {
      const center = this.container.scrollLeft + this.viewportWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      this.itemCenters.forEach((itemCenter, index) => {
        const distance = Math.abs(itemCenter - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      return nearestIndex;
    }

    updateActive() {
      const nextIndex = this.getNearestIndex();
      if (nextIndex === this.activeIndex) return;

      const previous = this.items[this.activeIndex];
      previous?.classList.remove("is-active");
      previous?.removeAttribute("aria-current");
      const current = this.items[nextIndex];
      current.classList.add("is-active");
      current.setAttribute("aria-current", "true");

      this.activeIndex = nextIndex;
      this.onActiveChange(nextIndex, this.items[nextIndex]);
    }

    emitProgress() {
      const maximum = this.getMaxScroll();
      this.onProgress(
        maximum ? this.container.scrollLeft / maximum : 0,
        this.activeIndex
      );
    }

    refresh(index = this.activeIndex < 0 ? this.initialIndex : this.activeIndex) {
      this.setEdgePadding();
      this.viewportWidth = this.container.clientWidth;
      // Photo dimensions are fixed by CSS; measure once per resize, not per scroll.
      this.itemCenters = this.items.map(item => item.offsetLeft + item.offsetWidth / 2);
      this.maximum = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
      this.centerItem(index, "auto");
      this.updateActive();
      this.emitProgress();
    }

    setProgress(progress) {
      this.stopMotion();
      this.container.scrollLeft = this.clamp(progress, 0, 1) * this.getMaxScroll();
      this.updateActive();
      this.emitProgress();
    }

    snapToNearest() {
      this.centerItem(this.getNearestIndex());
    }

    scheduleSnap(delay = 140) {
      if (this.snapTimer) clearTimeout(this.snapTimer);
      this.snapTimer = setTimeout(() => {
        this.snapTimer = null;
        this.snapToNearest();
      }, delay);
    }

    consumeDragged() {
      const dragged = this.dragged;
      this.dragged = false;
      return dragged;
    }

    startInertia() {
      if (this.reducedMotion.matches || Math.abs(this.velocity) < 0.35) {
        this.snapToNearest();
        return;
      }

      const friction = this.pointerType === "touch" ? 0.955 : 0.93;
      this.lastMotionTime = 0;

      const coast = timestamp => {
        const frameScale = this.lastMotionTime
          ? this.clamp((timestamp - this.lastMotionTime) / 16.667, 0.25, 2.5)
          : 1;
        this.lastMotionTime = timestamp;

        const before = this.container.scrollLeft;
        this.container.scrollLeft += this.velocity * frameScale;
        const hitBoundary = this.container.scrollLeft === before && Math.abs(this.velocity) > 0.5;
        this.velocity *= Math.pow(friction, frameScale);

        if (hitBoundary || Math.abs(this.velocity) < 0.35) {
          this.motionFrame = null;
          this.velocity = 0;
          this.snapToNearest();
          return;
        }

        this.motionFrame = requestAnimationFrame(coast);
      };

      this.motionFrame = requestAnimationFrame(coast);
    }

    finishDrag(event) {
      if (!this.dragging) return;
      this.dragging = false;
      this.container.classList.remove("is-dragging");

      if (this.container.hasPointerCapture(event.pointerId)) {
        this.container.releasePointerCapture(event.pointerId);
      }

      if (this.dragged) this.startInertia();
      else this.velocity = 0;

      setTimeout(() => {
        if (!this.dragging) this.dragged = false;
      }, 0);
    }

    bindEvents() {
      this.container.addEventListener("scroll", () => {
        if (this.scrollFrame) return;
        this.scrollFrame = requestAnimationFrame(() => {
          this.scrollFrame = null;
          this.updateActive();
          this.emitProgress();
        });
      }, { passive: true });

      this.container.addEventListener("wheel", event => {
        const amount = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
        if (!amount) return;
        event.preventDefault();
        this.stopMotion();

        const mechanical = event.deltaMode !== 0 || Math.abs(amount) >= 50;
        if (mechanical) {
          const now = performance.now();
          if (now - this.lastWheelStep < 85) return;
          this.lastWheelStep = now;
          this.centerItem(this.getNearestIndex() + Math.sign(amount));
        } else {
          this.container.scrollLeft += amount;
          this.scheduleSnap();
        }
      }, { passive: false });

      this.container.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        this.stopMotion();
        this.container.scrollTo({ left: this.container.scrollLeft, behavior: "auto" });
        this.dragging = true;
        this.dragged = false;
        this.pointerType = event.pointerType || "mouse";
        this.dragStartX = event.clientX;
        this.dragStartScroll = this.container.scrollLeft;
        this.lastPointerX = event.clientX;
        this.lastPointerTime = performance.now();
        this.velocity = 0;
      });

      this.container.addEventListener("pointermove", event => {
        if (!this.dragging) return;
        const now = performance.now();
        const distance = event.clientX - this.dragStartX;

        if (!this.dragged && Math.abs(distance) > 6) {
          this.dragged = true;
          this.container.classList.add("is-dragging");
          try {
            this.container.setPointerCapture(event.pointerId);
          } catch (error) {}
        }

        if (this.dragged) {
          event.preventDefault();
          this.container.scrollLeft = this.dragStartScroll - distance;
          const elapsed = Math.max(now - this.lastPointerTime, 1);
          const instantVelocity = ((this.lastPointerX - event.clientX) / elapsed) * 16.667;
          this.velocity = this.clamp(
            this.velocity * 0.28 + instantVelocity * 0.72,
            -70,
            70
          );
        }

        this.lastPointerX = event.clientX;
        this.lastPointerTime = now;
      });

      this.container.addEventListener("pointerup", event => this.finishDrag(event));
      this.container.addEventListener("pointercancel", event => this.finishDrag(event));

      this.container.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        this.centerItem(this.getNearestIndex() + direction);
      });

      window.addEventListener("resize", () => this.refresh());
    }
  }

  window.SimpleHorizontalRail = SimpleHorizontalRail;
})();
