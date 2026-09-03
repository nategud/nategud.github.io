const carousel = document.getElementById("projectCarousel");
const cards = [...document.querySelectorAll(".project-card")];
const titles = cards.map(card => card.querySelector(".project-title"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hoverMode = window.matchMedia("(hover: hover) and (pointer: fine)");

const CARD_COUNT = cards.length;
const ANGLE_STEP = 360 / CARD_COUNT;
const TOUCH_FRICTION = 0.973;
const DESKTOP_FRICTION = 0.95;
const WHEEL_FRICTION = 0.91;
const MAGNET_SPEED = 0.008;
const MAGNET_EASE = 0.12;
const MAX_VELOCITY = 0.38;
const DRAG_THRESHOLD = 7;

let position = 0;
let velocity = 0;
let magneticTarget = 0;
let settling = false;
let frame = null;
let lastFrameTime = 0;
let lastInputType = "mouse";
let tiltedImage = null;

let dragging = false;
let dragged = false;
let dragStartX = 0;
let dragStartPosition = 0;
let lastDragX = 0;
let lastDragTime = 0;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function wrapDelta(value) {
  return ((value + CARD_COUNT / 2) % CARD_COUNT + CARD_COUNT) % CARD_COUNT - CARD_COUNT / 2;
}

function getGeometry() {
  const width = carousel.clientWidth;
  const phone = width <= 700;

  return {
    radius: phone
      ? clamp(width * 0.78, 280, 390)
      : clamp(width * 0.47, 480, 760),
    lift: phone ? 14 : 22
  };
}

function getDragDistance() {
  return clamp(carousel.clientWidth * 0.62, 185, 270);
}

function getFriction() {
  if (lastInputType === "touch") return TOUCH_FRICTION;
  if (lastInputType === "wheel") return WHEEL_FRICTION;
  return DESKTOP_FRICTION;
}

function isMechanicalWheel(event, amount) {
  return event.deltaMode !== 0 || Math.abs(amount) >= 50;
}

function getWheelImpulse(event, amount) {
  const mechanicalTick = isMechanicalWheel(event, amount);

  return mechanicalTick
    ? Math.sign(amount) * 0.055
    : amount * 0.0006;
}

function resetTilt() {
  if (!tiltedImage) return;

  tiltedImage.style.transform = "";
  tiltedImage.style.boxShadow = "";
  tiltedImage = null;
}

function render() {
  const geometry = getGeometry();
  let activeCard = null;
  let activeDistance = Infinity;

  cards.forEach((card, index) => {
    const delta = wrapDelta(index - position);
    const angle = delta * ANGLE_STEP;
    const radians = angle * Math.PI / 180;
    const distance = Math.abs(delta);
    const frontness = (Math.cos(radians) + 1) / 2;
    const focus = Math.exp(-distance * 0.82);

    const x = Math.sin(radians) * geometry.radius;
    const z = (Math.cos(radians) - 1) * geometry.radius;
    const y = -focus * geometry.lift + Math.pow(distance, 1.18) * 2.5;
    const scale = reducedMotion.matches
      ? 1
      : 0.46 + Math.pow(focus, 2.35) * 0.72;
    const opacity = clamp(0.06 + Math.pow(frontness, 2.6) * 0.94, 0, 1);
    const blur = Math.max(0, (1 - frontness) * 1.4);
    const titleProgress = smoothstep(clamp(1 - distance / 0.62, 0, 1));

    card.style.transform = [
      `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px)`,
      `rotateY(${angle * -0.72}deg)`,
      `rotateZ(${clamp(delta, -2.5, 2.5) * -0.7}deg)`,
      `scale(${scale})`
    ].join(" ");
    card.style.opacity = opacity;
    card.style.filter = [
      `brightness(${0.78 + frontness * 0.22})`,
      `saturate(${0.76 + frontness * 0.24})`,
      `blur(${blur}px)`
    ].join(" ");
    card.style.zIndex = Math.round(frontness * 1000);

    titles[index].style.opacity = titleProgress;
    titles[index].style.transform = `translate3d(0, ${9 * (1 - titleProgress)}px, 0) scale(${0.96 + titleProgress * 0.04})`;

    if (distance < activeDistance) {
      activeDistance = distance;
      activeCard = card;
    }
  });

  cards.forEach(card => {
    const active = card === activeCard && activeDistance < 0.46;
    const cardIndex = cards.indexOf(card);
    const distance = Math.abs(wrapDelta(cardIndex - position));
    const clickable = distance < 1.35;

    card.classList.toggle("is-active", active);
    card.classList.toggle("is-clickable", clickable);
    card.tabIndex = active ? 0 : -1;
    card.setAttribute("aria-hidden", clickable ? "false" : "true");
  });

  if (
    tiltedImage &&
    !tiltedImage.closest(".project-card").classList.contains("is-clickable")
  ) {
    resetTilt();
  }
}

function beginMagneticSettle(target = Math.round(position)) {
  magneticTarget = target;
  settling = true;
  velocity = 0;
}

function animate(timestamp) {
  const deltaFrames = lastFrameTime
    ? clamp((timestamp - lastFrameTime) / 16.667, 0.25, 2.5)
    : 1;

  lastFrameTime = timestamp;

  if (!dragging) {
    if (reducedMotion.matches) {
      position = settling ? magneticTarget : position;
      velocity = 0;
      settling = false;
    } else if (settling) {
      const distance = magneticTarget - position;
      const magneticProgress = 1 - Math.pow(1 - MAGNET_EASE, deltaFrames);
      position += distance * magneticProgress;

      if (Math.abs(distance) < 0.0006) {
        position = magneticTarget;
        settling = false;
      }
    } else {
      position += velocity * deltaFrames;
      velocity *= Math.pow(getFriction(), deltaFrames);

      if (Math.abs(velocity) < MAGNET_SPEED) {
        beginMagneticSettle();
      }
    }
  }

  render();

  if (dragging || settling || Math.abs(velocity) >= MAGNET_SPEED) {
    frame = requestAnimationFrame(animate);
  } else {
    frame = null;
    lastFrameTime = 0;
  }
}

function requestAnimation() {
  if (!frame) {
    lastFrameTime = 0;
    frame = requestAnimationFrame(animate);
  }
}

carousel.addEventListener("wheel", event => {
  const amount = Math.abs(event.deltaY) > Math.abs(event.deltaX)
    ? event.deltaY
    : event.deltaX;

  if (amount === 0) return;

  event.preventDefault();

  if (reducedMotion.matches) {
    beginMagneticSettle(Math.round(position) + Math.sign(amount));
    requestAnimation();
    return;
  }

  if (isMechanicalWheel(event, amount)) {
    const startingPoint = settling ? magneticTarget : Math.round(position);
    beginMagneticSettle(startingPoint + Math.sign(amount));
    requestAnimation();
    return;
  }

  lastInputType = "wheel";
  settling = false;
  velocity = clamp(
    velocity + getWheelImpulse(event, amount),
    -MAX_VELOCITY,
    MAX_VELOCITY
  );
  requestAnimation();
}, { passive: false });

carousel.addEventListener("pointerdown", event => {
  if (event.button !== 0 && event.pointerType === "mouse") return;

  dragging = true;
  dragged = false;
  settling = false;
  velocity = 0;
  resetTilt();
  lastInputType = event.pointerType || "mouse";
  dragStartX = event.clientX;
  dragStartPosition = position;
  lastDragX = event.clientX;
  lastDragTime = performance.now();
  requestAnimation();
});

carousel.addEventListener("pointermove", event => {
  if (!dragging) return;

  const now = performance.now();
  const distance = event.clientX - dragStartX;
  const elapsed = Math.max(now - lastDragTime, 1);
  const dragDistance = getDragDistance();

  if (Math.abs(distance) > DRAG_THRESHOLD && !dragged) {
    dragged = true;

    try {
      carousel.setPointerCapture(event.pointerId);
    } catch (error) {}
  }

  position = dragStartPosition - distance / dragDistance;

  const instantVelocity = ((lastDragX - event.clientX) / dragDistance) * (16 / elapsed);
  velocity = clamp(
    velocity * 0.42 + instantVelocity * 0.58,
    -MAX_VELOCITY,
    MAX_VELOCITY
  );

  lastDragX = event.clientX;
  lastDragTime = now;
  render();
});

carousel.addEventListener("pointermove", event => {
  if (!hoverMode.matches || dragging || reducedMotion.matches) {
    resetTilt();
    return;
  }

  const hoveredCard = event.target.closest(".project-card.is-clickable");
  const activeCard = cards.find(card => card.classList.contains("is-active"));
  const image = (hoveredCard || activeCard)?.querySelector(".project-image");

  if (!image) {
    resetTilt();
    return;
  }

  const rect = image.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (!inside) {
    resetTilt();
    return;
  }

  if (tiltedImage && tiltedImage !== image) resetTilt();
  tiltedImage = image;

  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const normalizedX = x * 2 - 1;
  const normalizedY = y * 2 - 1;
  const tiltX = normalizedY * -2.4;
  const tiltY = normalizedX * 2.4;

  image.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(1px)`;
  image.style.boxShadow = `${normalizedX * -5}px ${20 + normalizedY * 3}px 62px rgba(0, 0, 0, 0.105)`;
});

carousel.addEventListener("pointerleave", resetTilt);

function finishDrag(event) {
  if (!dragging) return;

  dragging = false;

  const releaseDelay = performance.now() - lastDragTime;
  if (releaseDelay > 120) {
    velocity *= clamp(1 - (releaseDelay - 120) / 300, 0, 1);
  }

  if (carousel.hasPointerCapture(event.pointerId)) {
    carousel.releasePointerCapture(event.pointerId);
  }

  if (!reducedMotion.matches && dragged && Math.abs(velocity) >= MAGNET_SPEED) {
    settling = false;
  } else {
    beginMagneticSettle();
  }

  requestAnimation();
}

carousel.addEventListener("pointerup", finishDrag);
carousel.addEventListener("pointercancel", finishDrag);

carousel.addEventListener("keydown", event => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  event.preventDefault();
  beginMagneticSettle(
    Math.round(position) + (event.key === "ArrowRight" ? 1 : -1)
  );
  requestAnimation();
});

cards.forEach(card => {
  card.addEventListener("click", event => {
    if (dragged || !card.classList.contains("is-clickable")) {
      event.preventDefault();
      dragged = false;
    }
  });
});

window.addEventListener("resize", render);

render();
