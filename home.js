const wheel = document.getElementById("homeWheel");
const options = [...document.querySelectorAll(".home-option")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const OPTION_COUNT = options.length;
const TOUCH_FRICTION = 0.97;
const DESKTOP_FRICTION = 0.95;
const WHEEL_FRICTION = 0.91;
const MAGNET_SPEED = 0.009;
const MAGNET_EASE = 0.14;
const MAX_VELOCITY = 0.32;
const DRAG_THRESHOLD = 7;

let position = reducedMotion.matches ? 0 : -0.12;
let velocity = 0;
let magneticTarget = 0;
let settling = !reducedMotion.matches;
let frame = null;
let lastFrameTime = 0;
let lastInputType = "mouse";

let dragging = false;
let dragged = false;
let dragStartY = 0;
let dragStartPosition = 0;
let lastDragY = 0;
let lastDragTime = 0;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function wrapDelta(value) {
  return ((value + OPTION_COUNT / 2) % OPTION_COUNT + OPTION_COUNT) % OPTION_COUNT - OPTION_COUNT / 2;
}

function getDragDistance() {
  return clamp(wheel.clientHeight * 0.27, 78, 112);
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

function render() {
  const compact = wheel.clientHeight < 290;
  const radiusY = compact ? 112 : Math.min(wheel.clientHeight * 0.43, 160);
  const radiusZ = compact ? 150 : 205;
  let activeOption = null;
  let activeDistance = Infinity;

  options.forEach((option, index) => {
    const delta = wrapDelta(index - position);
    const angle = delta * (compact ? 31 : 34);
    const radians = angle * Math.PI / 180;
    const distance = Math.abs(delta);
    const focus = Math.exp(-distance * 0.8);
    const y = Math.sin(radians) * radiusY;
    const z = (Math.cos(radians) - 1) * radiusZ;
    const scale = reducedMotion.matches
      ? 1
      : 0.95 + Math.pow(focus, 2.7) * 0.42;
    const opacity = clamp(0.62 + focus * 0.38, 0, 1);
    const blur = Math.max(0, distance - 0.9) * 0.18;

    option.style.transform = [
      `translate3d(-50%, calc(-50% + ${y}px), ${z}px)`,
      `rotateX(${angle * -0.72}deg)`,
      `scale(${scale})`
    ].join(" ");
    option.style.opacity = opacity;
    option.style.filter = `blur(${blur}px)`;
    option.style.zIndex = Math.round((3 - distance) * 100);

    if (distance < activeDistance) {
      activeDistance = distance;
      activeOption = option;
    }
  });

  options.forEach(option => {
    const active = option === activeOption;
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-current", active ? "true" : "false");
  });
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

wheel.addEventListener("wheel", event => {
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

wheel.addEventListener("pointerdown", event => {
  if (event.button !== 0 && event.pointerType === "mouse") return;

  dragging = true;
  dragged = false;
  settling = false;
  velocity = 0;
  lastInputType = event.pointerType || "mouse";
  dragStartY = event.clientY;
  dragStartPosition = position;
  lastDragY = event.clientY;
  lastDragTime = performance.now();
  requestAnimation();
});

wheel.addEventListener("pointermove", event => {
  if (!dragging) return;

  const now = performance.now();
  const distance = event.clientY - dragStartY;
  const elapsed = Math.max(now - lastDragTime, 1);
  const dragDistance = getDragDistance();

  if (Math.abs(distance) > DRAG_THRESHOLD && !dragged) {
    dragged = true;

    try {
      wheel.setPointerCapture(event.pointerId);
    } catch (error) {}
  }

  position = dragStartPosition - distance / dragDistance;

  const instantVelocity = ((lastDragY - event.clientY) / dragDistance) * (16 / elapsed);
  velocity = clamp(
    velocity * 0.42 + instantVelocity * 0.58,
    -MAX_VELOCITY,
    MAX_VELOCITY
  );

  lastDragY = event.clientY;
  lastDragTime = now;
  render();
});

function finishDrag(event) {
  if (!dragging) return;

  dragging = false;

  const releaseDelay = performance.now() - lastDragTime;
  if (releaseDelay > 120) {
    velocity *= clamp(1 - (releaseDelay - 120) / 300, 0, 1);
  }

  if (wheel.hasPointerCapture(event.pointerId)) {
    wheel.releasePointerCapture(event.pointerId);
  }

  if (!reducedMotion.matches && dragged && Math.abs(velocity) >= MAGNET_SPEED) {
    settling = false;
  } else {
    beginMagneticSettle();
  }

  requestAnimation();
}

wheel.addEventListener("pointerup", finishDrag);
wheel.addEventListener("pointercancel", finishDrag);

wheel.addEventListener("keydown", event => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

  event.preventDefault();
  beginMagneticSettle(
    Math.round(position) + (event.key === "ArrowDown" ? 1 : -1)
  );
  requestAnimation();
});

options.forEach(option => {
  option.addEventListener("click", event => {
    if (dragged) {
      event.preventDefault();
      dragged = false;
    }
  });
});

window.addEventListener("resize", render);

render();
requestAnimation();
