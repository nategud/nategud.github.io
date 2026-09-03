(function () {
  class ThumbnailRail {
    constructor(options) {
      this.container = options.container;
      this.items = options.items;
      this.renderItem = options.renderItem;
      this.prepareRender = options.prepareRender || (() => undefined);
      this.onItemState = options.onItemState || (() => {});
      this.getDragDistance = options.getDragDistance;
      this.activeThreshold = options.activeThreshold ?? 0.52;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      this.minimum = 0;
      this.maximum = Math.max(0, this.items.length - 1);
      this.position = this.clamp(options.initialIndex ?? 0);
      this.velocity = 0;
      this.magneticTarget = this.position;
      this.settling = false;
      this.frame = null;
      this.lastFrameTime = 0;
      this.lastInputType = "mouse";
      this.dragging = false;
      this.dragged = false;
      this.dragStartX = 0;
      this.dragStartPosition = this.position;
      this.lastDragX = 0;
      this.lastDragTime = 0;
      this.lastMechanicalWheel = 0;

      this.touchFriction = options.touchFriction ?? 0.945;
      this.desktopFriction = options.desktopFriction ?? 0.925;
      this.trackpadFriction = options.trackpadFriction ?? 0.89;
      this.magnetSpeed = options.magnetSpeed ?? 0.014;
      this.magnetEase = options.magnetEase ?? 0.18;
      this.maxVelocity = options.maxVelocity ?? 0.34;
      this.dragThreshold = options.dragThreshold ?? 7;

      this.animate = this.animate.bind(this);
      this.bindEvents();
      this.render();
    }

    clamp(value, minimum = this.minimum, maximum = this.maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    getFriction() {
      if (this.lastInputType === "touch") return this.touchFriction;
      if (this.lastInputType === "trackpad") return this.trackpadFriction;
      return this.desktopFriction;
    }

    isMechanicalWheel(event, amount) {
      return event.deltaMode !== 0 || Math.abs(amount) >= 50;
    }

    render() {
      let activeIndex = 0;
      let activeDistance = Infinity;
      const states = [];
      const renderContext = this.prepareRender();

      this.items.forEach((item, index) => {
        const delta = index - this.position;
        const distance = Math.abs(delta);
        const state = { index, delta, distance };
        states.push(state);
        this.renderItem(item, state, renderContext);

        if (distance < activeDistance) {
          activeDistance = distance;
          activeIndex = index;
        }
      });

      this.items.forEach((item, index) => {
        const active = index === activeIndex && activeDistance < this.activeThreshold;
        item.classList.toggle("is-active", active);
        this.onItemState(item, { ...states[index], active });
      });
    }

    beginSettle(target = Math.round(this.position)) {
      this.magneticTarget = this.clamp(target);
      this.settling = true;
      this.velocity = 0;
    }

    animate(timestamp) {
      const frameScale = this.lastFrameTime
        ? this.clamp((timestamp - this.lastFrameTime) / 16.667, 0.25, 2.5)
        : 1;
      this.lastFrameTime = timestamp;

      if (!this.dragging) {
        if (this.reducedMotion.matches) {
          this.position = this.settling ? this.magneticTarget : this.clamp(this.position);
          this.velocity = 0;
          this.settling = false;
        } else if (this.settling) {
          const distance = this.magneticTarget - this.position;
          const progress = 1 - Math.pow(1 - this.magnetEase, frameScale);
          this.position += distance * progress;

          if (Math.abs(distance) < 0.0007) {
            this.position = this.magneticTarget;
            this.settling = false;
          }
        } else {
          this.position += this.velocity * frameScale;
          this.velocity *= Math.pow(this.getFriction(), frameScale);

          if (this.position <= this.minimum || this.position >= this.maximum) {
            this.position = this.clamp(this.position);
            this.beginSettle(this.position);
          } else if (Math.abs(this.velocity) < this.magnetSpeed) {
            this.beginSettle();
          }
        }
      }

      this.render();

      if (this.dragging || this.settling || Math.abs(this.velocity) >= this.magnetSpeed) {
        this.frame = requestAnimationFrame(this.animate);
      } else {
        this.frame = null;
        this.lastFrameTime = 0;
      }
    }

    requestAnimation() {
      if (this.frame) return;
      this.lastFrameTime = 0;
      this.frame = requestAnimationFrame(this.animate);
    }

    goTo(index) {
      this.beginSettle(index);
      this.requestAnimation();
    }

    finishDrag(event) {
      if (!this.dragging) return;
      this.dragging = false;

      const releaseDelay = performance.now() - this.lastDragTime;
      if (releaseDelay > 110) {
        this.velocity *= this.clamp(1 - (releaseDelay - 110) / 260, 0, 1);
      }

      if (this.container.hasPointerCapture(event.pointerId)) {
        this.container.releasePointerCapture(event.pointerId);
      }

      if (!this.reducedMotion.matches && this.dragged && Math.abs(this.velocity) >= this.magnetSpeed) {
        this.settling = false;
      } else {
        this.beginSettle();
      }

      this.requestAnimation();
    }

    consumeDragged() {
      const value = this.dragged;
      this.dragged = false;
      return value;
    }

    bindEvents() {
      this.container.addEventListener("wheel", event => {
        const amount = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
        if (amount === 0) return;
        event.preventDefault();

        if (this.reducedMotion.matches) {
          this.beginSettle(Math.round(this.position) + Math.sign(amount));
          this.requestAnimation();
          return;
        }

        if (this.isMechanicalWheel(event, amount)) {
          const now = performance.now();
          if (now - this.lastMechanicalWheel < 85) return;
          this.lastMechanicalWheel = now;
          const start = this.settling ? this.magneticTarget : Math.round(this.position);
          this.beginSettle(start + Math.sign(amount));
          this.requestAnimation();
          return;
        }

        this.lastInputType = "trackpad";
        this.settling = false;
        this.velocity = this.clamp(
          this.velocity + amount * 0.00058,
          -this.maxVelocity,
          this.maxVelocity
        );
        this.requestAnimation();
      }, { passive: false });

      this.container.addEventListener("pointerdown", event => {
        if (event.button !== 0 && event.pointerType === "mouse") return;
        this.dragging = true;
        this.dragged = false;
        this.settling = false;
        this.velocity = 0;
        this.lastInputType = event.pointerType || "mouse";
        this.dragStartX = event.clientX;
        this.dragStartPosition = this.position;
        this.lastDragX = event.clientX;
        this.lastDragTime = performance.now();
        this.requestAnimation();
      });

      this.container.addEventListener("pointermove", event => {
        if (!this.dragging) return;
        const now = performance.now();
        const distance = event.clientX - this.dragStartX;
        const elapsed = Math.max(now - this.lastDragTime, 1);
        const dragDistance = this.getDragDistance();

        if (Math.abs(distance) > this.dragThreshold && !this.dragged) {
          this.dragged = true;
          try {
            this.container.setPointerCapture(event.pointerId);
          } catch (error) {}
        }

        this.position = this.clamp(this.dragStartPosition - distance / dragDistance);
        const instantVelocity = ((this.lastDragX - event.clientX) / dragDistance) * (16 / elapsed);
        this.velocity = this.clamp(
          this.velocity * 0.38 + instantVelocity * 0.62,
          -this.maxVelocity,
          this.maxVelocity
        );
        this.lastDragX = event.clientX;
        this.lastDragTime = now;
        this.render();
      });

      this.container.addEventListener("pointerup", event => this.finishDrag(event));
      this.container.addEventListener("pointercancel", event => this.finishDrag(event));

      this.container.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        this.beginSettle(
          Math.round(this.position) + (event.key === "ArrowRight" ? 1 : -1)
        );
        this.requestAnimation();
      });

      window.addEventListener("resize", () => this.render());
    }
  }

  window.ThumbnailRail = ThumbnailRail;
})();
