const projectPage = document.querySelector(".project-page");
const carousel = document.getElementById("photoCarousel");
const track = document.getElementById("photoTrack");

const seattleSizes = [
  [1080, 881], [872, 1080], [1080, 883], [1080, 880], [1080, 795],
  [1080, 880], [1080, 882], [883, 1080], [1080, 875], [877, 1080],
  [884, 1080], [1080, 881], [1034, 1080], [879, 1080], [882, 1080],
  [1080, 878], [879, 1080], [1080, 876], [1080, 883], [1080, 881],
  [1080, 1064], [881, 1080], [876, 1080], [875, 1080], [1080, 886]
];

const projects = {
  caphill: { folder: "caphill", prefix: "caphill", count: 0 },
  fashion: {
    folder: "fashion",
    prefix: "fashion",
    count: 16,
    getSize: () => [3130, 2075]
  },
  italy: { folder: "italy", prefix: "italy", count: 0 },
  sawtooth: {
    folder: "sawtooths",
    prefix: "idaho",
    count: 32,
    getSize: index => index === 25 || index === 26
      ? [1105, 3024]
      : [3024, 1105]
  },
  seattle: {
    folder: "seattle",
    prefix: "seattle",
    count: seattleSizes.length,
    getSize: index => seattleSizes[index - 1]
  },
  wallingford: { folder: "wallingford", prefix: "wallingford", count: 0 }
};

const projectKey = projectPage.dataset.project;
const project = projects[projectKey];

if (!project || project.count === 0) {
  carousel.removeAttribute("tabindex");
} else {
  const fragment = document.createDocumentFragment();

  for (let index = 1; index <= project.count; index += 1) {
    const [width, height] = project.getSize(index);
    const card = document.createElement("div");
    const image = document.createElement("img");

    card.className = `photo-card ${width >= height ? "is-landscape" : "is-portrait"}`;
    card.style.setProperty("--cross-factor", Math.min(width, height) / Math.max(width, height));
    image.src = `../photos/${project.folder}/${project.prefix}${index}.jpg`;
    image.alt = `${projectKey} photograph ${index}`;
    image.width = width;
    image.height = height;
    image.decoding = "async";
    image.draggable = false;
    image.loading = index <= 3 ? "eager" : "lazy";
    image.tabIndex = -1;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `Expand ${image.alt}`);
    if (index === 1) image.fetchPriority = "high";
    card.appendChild(image);
    fragment.appendChild(card);
  }

  track.appendChild(fragment);
  initializeViewer([...track.querySelectorAll(".photo-card")]);
}

function initializeViewer(cards) {
  const hoverMode = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const images = cards.map(card => card.querySelector("img"));
  const scrubber = document.createElement("div");
  scrubber.className = "gallery-scrubber";
  scrubber.tabIndex = 0;
  scrubber.setAttribute("role", "slider");
  scrubber.setAttribute("aria-label", "Scrub through project photographs");
  scrubber.setAttribute("aria-valuemin", "1");
  scrubber.setAttribute("aria-valuemax", String(cards.length));
  scrubber.setAttribute("aria-valuenow", "1");
  scrubber.innerHTML = `
    <span class="scrubber-line" aria-hidden="true">
      <span class="scrubber-fill"></span>
      <span class="scrubber-thumb"></span>
    </span>
  `;
  projectPage.appendChild(scrubber);

  const scrubberLine = scrubber.querySelector(".scrubber-line");

  const rail = new window.SimpleHorizontalRail({
    container: carousel,
    track,
    items: cards,
    initialIndex: 0,
    onActiveChange: activeIndex => {
      images.forEach((image, index) => {
        image.tabIndex = index === activeIndex ? 0 : -1;
      });
    },
    onProgress: (progress, index) => {
      scrubber.style.setProperty("--progress", progress);
      scrubber.setAttribute("aria-valuenow", String(index + 1));
      scrubber.setAttribute("aria-valuetext", `${index + 1} of ${cards.length}`);
    }
  });

  let scrubbing = false;

  function scrubTo(clientX) {
    const rect = scrubberLine.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    rail.setProgress(progress);
  }

  function finishScrubbing(event) {
    if (!scrubbing) return;
    scrubbing = false;
    scrubber.classList.remove("is-scrubbing");
    if (scrubber.hasPointerCapture(event.pointerId)) {
      scrubber.releasePointerCapture(event.pointerId);
    }
    rail.snapToNearest();
  }

  scrubber.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    scrubbing = true;
    scrubber.classList.add("is-scrubbing");
    scrubber.setPointerCapture(event.pointerId);
    scrubTo(event.clientX);
  });

  scrubber.addEventListener("pointermove", event => {
    if (!scrubbing) return;
    event.preventDefault();
    scrubTo(event.clientX);
  });

  scrubber.addEventListener("pointerup", finishScrubbing);
  scrubber.addEventListener("pointercancel", finishScrubbing);

  scrubber.addEventListener("keydown", event => {
    if (event.key === "Home") {
      event.preventDefault();
      rail.centerItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      rail.centerItem(cards.length - 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      rail.centerItem(rail.getNearestIndex() + direction);
    }
  });

  const lightbox = document.createElement("div");
  lightbox.className = "photo-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded photograph");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close image">×</button>
    <img alt="">
  `;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector("button");
  let lightboxTrigger = null;

  function openLightbox(image) {
    lightboxTrigger = image;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    closeButton.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxTrigger?.focus({ preventScroll: true });
  }

  images.forEach(image => {
    image.addEventListener("click", event => {
      event.stopPropagation();
      if (rail.consumeDragged()) return;
      openLightbox(image);
    });

    image.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(image);
    });
  });

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });
  closeButton.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    }
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

    const image = carousel.querySelector(".photo-card.is-active img");
    if (!image) return resetTilt();

    const rect = image.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) return resetTilt();

    tiltedImage = image;
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    image.style.transform = `perspective(900px) rotateX(${y * -2.2}deg) rotateY(${x * 2.2}deg) translateZ(1px)`;
    image.style.boxShadow = `${x * -5}px ${20 + y * 3}px 62px rgba(0, 0, 0, 0.105)`;
  });

  carousel.addEventListener("pointerleave", resetTilt);
}
