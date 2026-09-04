const projectPage = document.querySelector(".project-page");
const carousel = document.getElementById("photoCarousel");
const track = document.getElementById("photoTrack");

// Actual filenames and display dimensions, in project order.
// Each image version changes when its exported file changes.
const projects = {
  caphill: {
    folder: "caphill",
    photos: [
      ["caphill1.jpg",2400,1591,"b1bd4a0c3d21"],
      ["caphill2.jpg",2400,1591,"95444830e8bc"],
      ["caphill3.jpg",2400,1591,"0f0d376b1f61"],
      ["caphill4.jpg",2400,1591,"213ee8ee1a6c"],
      ["caphill5.jpg",2400,1591,"404a8a3b2730"],
      ["caphill6.jpg",2400,1591,"63ff0f6fdda0"],
      ["caphill7.jpg",2400,1591,"fc3651c8bac1"],
      ["caphill8.jpg",2400,1591,"88c39478650a"],
      ["caphill9.jpg",2400,1591,"8e8f81d02be3"],
      ["caphill10.jpg",2400,1591,"472cb88d7b7a"],
      ["caphill11.jpg",2400,1591,"ab5eb925c362"],
      ["caphill12.jpg",2400,1591,"b22492881cc4"],
      ["caphill13.jpg",2400,1591,"4feec86b55a1"],
      ["caphill14.jpg",2400,1591,"cd2a87b8fe06"],
      ["caphill15.jpg",2400,1591,"f7e49ec48c74"],
      ["caphill16.jpg",2400,1591,"f02183f977a8"],
      ["caphill17.jpg",2400,1591,"2f89bb64e2d4"],
      ["caphill18.jpg",2400,1591,"efc2531802fc"],
      ["caphill19.jpg",2400,1591,"0ffe0575322c"],
      ["caphill20.jpg",2400,1591,"d5940dcf69b1"],
      ["caphill21.jpg",2400,1591,"9f7112f0938a"],
      ["caphill22.jpg",2400,1591,"2ff545aff796"],
      ["caphill23.jpg",2400,1591,"69b8712e1263"],
      ["caphill24.jpg",2400,1591,"53387935ad36"],
      ["caphill25.jpg",2400,1591,"33098b7ba6e5"],
      ["caphill26.jpg",2400,1591,"f5c0484146d5"],
      ["caphill27.jpg",2400,1591,"3aa2669ef276"],
      ["caphill28.jpg",2400,1591,"772b2a32ce64"],
      ["caphill29.jpg",2400,1591,"5bfa2810dc2c"],
      ["caphill30.jpg",2400,1591,"ce6387c73976"],
      ["caphill31.jpg",2400,1591,"92d49307a561"]
    ]
  },
  fashion: {
    folder: "fashion",
    photos: [
      ["fashion1.jpg",2400,1600,"28d86e61e118"],
      ["fashion2.jpg",2400,1600,"40715c90f4bc"],
      ["fashion3.jpg",2400,1600,"6452831cae82"],
      ["fashion4.jpg",2400,1600,"c4ebf116bf54"],
      ["fashion5.jpg",2400,1600,"e3eab85648a7"],
      ["fashion6.jpg",2400,1600,"0a56e2056559"],
      ["fashion7.jpg",2400,1600,"b72dfaf56fb0"],
      ["fashion8.jpg",2400,1600,"043b0e3a0844"],
      ["fashion9.jpg",2400,1600,"0e17198b5a12"],
      ["fashion10.jpg",2400,1600,"9edb79e307e8"],
      ["fashion11.jpg",2400,1600,"398a13e0ef60"],
      ["fashion12.jpg",2400,1600,"f6419659e42c"],
      ["fashion13.jpg",2400,1600,"04479d6a87ad"],
      ["fashion14.jpg",2400,1600,"fdb297e4df08"],
      ["fashion15.jpg",2400,1600,"61abc237c4e3"],
      ["fashion16.jpg",2400,1600,"81b4cf27eb8c"]
    ]
  },
  italy: {
    folder: "italy",
    photos: [
      ["italy1.jpg",2425,927,"ba75afcace8f"],
      ["italy2.jpg",2425,927,"d49313a2146c"],
      ["italy3.jpg",2425,927,"ddee58d33b7d"],
      ["italy4.jpg",2425,927,"3e8617ff33de"],
      ["italy5.jpg",2425,927,"02f977f9b35c"],
      ["italy6.jpg",2425,927,"262f8ecaa2a9"],
      ["italy7.jpg",2425,927,"c469ccf742e8"],
      ["italy8.jpg",2425,927,"6e75948889f8"],
      ["italy9.jpg",2425,927,"2812ed8ae27b"],
      ["italy10.jpg",2425,927,"b85855029768"],
      ["italy11.jpg",2425,927,"f31f88d4b44d"],
      ["italy12.jpg",2425,927,"61aa2c68cccf"],
      ["italy13.jpg",2425,927,"ab79669449fc"],
      ["italy14.jpg",2425,927,"8c6f868b4216"],
      ["italy15.jpg",2425,927,"81ab5586e3d4"],
      ["italy16.jpg",2425,927,"9c7fd3bc0fef"],
      ["italy17.jpg",2425,927,"7bc309415e45"],
      ["italy18.jpg",2425,927,"8cb987dfb2df"],
      ["italy19.jpg",2425,927,"b4469419ea78"]
    ]
  },
  idaho: {
    folder: "idaho",
    photos: [
      ["idaho1.jpg",2400,877,"19d1c04540f9"],
      ["idaho2.jpg",2400,877,"7a2fa0fa6d05"],
      ["idaho3.jpg",2400,877,"83e486da4dda"],
      ["idaho4.jpg",2400,877,"cb2052eb4f53"],
      ["idaho5.jpg",2400,877,"6070e9255586"],
      ["idaho6.jpg",2400,877,"75d667b3111c"],
      ["idaho7.jpg",2400,877,"e0a6934dc14f"],
      ["idaho8.jpg",2400,877,"f479d8981a14"],
      ["idaho9.jpg",2400,877,"b0bf02149d9c"],
      ["idaho10.jpg",2400,877,"c2ed06934f08"],
      ["idaho11.jpg",2400,877,"8e4e44805061"],
      ["idaho12.jpg",2400,877,"262e9c3a0fab"],
      ["idaho13.jpg",2400,877,"9e74d1a24333"],
      ["idaho14.jpg",2400,877,"651ea18a04a8"],
      ["idaho15.jpg",2400,877,"a497e5a5d8dc"],
      ["idaho16.jpg",2400,877,"edb78cd0c769"],
      ["idaho17.jpg",2400,877,"16c8e933512f"],
      ["idaho18.jpg",2400,877,"c8f6935afa5e"],
      ["idaho19.jpg",2400,877,"82832fedab4f"],
      ["idaho20.jpg",2400,877,"af3a33fc7dc8"],
      ["idaho21.jpg",2400,877,"cbfeb3de5e24"],
      ["idaho22.jpg",2400,877,"29a94bf4bbc5"],
      ["idaho23.jpg",2400,877,"62b52371a1f3"],
      ["idaho24.jpg",2400,877,"cc33b205585a"],
      ["idaho25.jpg",2400,877,"f0b73c3c06d3"],
      ["idaho26.jpg",2400,877,"0973e6f5d982"],
      ["idaho27.jpg",2400,877,"826b35d01e98"],
      ["idaho28.jpg",2400,877,"cd16f8ecfcb4"],
      ["idaho29.jpg",2400,877,"00d92c5b85c1"],
      ["idaho30.jpg",2400,877,"55e476f4eeb7"],
      ["idaho31.jpg",2400,877,"7425a755294f"],
      ["idaho32.jpg",2400,877,"099ba1d9fe5f"]
    ]
  },
  seattle: {
    folder: "seattle",
    photos: [
      ["seattle1.jpg",2400,2050,"8e2f31050790"],
      ["seattle2.jpg",2400,2050,"b18b3f58f8c5"],
      ["seattle3.jpg",2400,2050,"4711e138d175"],
      ["seattle4.jpg",2400,2050,"3b5ea41ec208"],
      ["seattle5.jpg",2400,2050,"e2dde6adaaf9"],
      ["seattle6.jpg",2400,2050,"77464859d37e"],
      ["seattle7.jpg",2400,2050,"33204b898178"],
      ["seattle8.jpg",2400,2050,"d3f17290d0f8"],
      ["seattle9.jpg",2400,2050,"bc29c7e2641a"],
      ["seattle10.jpg",2400,2050,"80f900a4963e"],
      ["seattle11.jpg",2400,2050,"4580046704b7"],
      ["seattle12.jpg",2400,2050,"1594c35887ab"],
      ["seattle13.jpg",2400,2050,"e6a811230a87"],
      ["seattle14.jpg",2400,2050,"eec6c57616e1"],
      ["seattle15.jpg",2400,2050,"8cc61254bec0"],
      ["seattle16.jpg",2400,2050,"ea73252a5828"],
      ["seattle17.jpg",2400,2050,"9e813a787842"],
      ["seattle18.jpg",2400,2050,"8923a30b69e2"],
      ["seattle19.jpg",2400,2050,"80a492454cd5"],
      ["seattle20.jpg",2400,2050,"4cf15bd1154e"],
      ["seattle21.jpg",2400,2050,"bbcaf5ada0b4"],
      ["seattle22.jpg",2400,2050,"019337ca5740"],
      ["seattle23.jpg",2400,2050,"98643064613d"],
      ["seattle24.jpg",2400,2050,"06b70e444957"],
      ["seattle25.jpg",2400,2050,"d5421528f454"]
    ]
  },
  wallingford: {
    folder: "wallingford",
    photos: [
      ["wallingford1.jpg",2400,927,"9431f8254436"],
      ["wallingford2.jpg",2400,927,"276fac33040f"],
      ["wallingford3.jpg",2400,927,"f884b6a8299d"],
      ["wallingford4.jpg",2400,927,"193c4ef91795"],
      ["wallingford5.jpg",2400,927,"e694f4645e2e"],
      ["wallingford6.jpg",2400,927,"59ba35a3f915"],
      ["wallingford7.jpg",2400,927,"6acc4f1cc918"],
      ["wallingford8.jpg",2400,927,"7ae33d4f04be"],
      ["wallingford9.jpg",2400,927,"0185a39872f0"],
      ["wallingford10.jpg",2400,927,"6d04f6ab4836"],
      ["wallingford11.jpg",2400,927,"29dc13070ab7"],
      ["wallingford12.jpg",2400,927,"36e0e785a44e"],
      ["wallingford13.jpg",2400,927,"24097a74936f"],
      ["wallingford14.jpg",2400,927,"414ce773fdcd"],
      ["wallingford15.jpg",2400,927,"18ab847f10a2"],
      ["wallingford16.jpg",2400,927,"0bb4c49ff02a"],
      ["wallingford17.jpg",2400,927,"2489f16c85c5"],
      ["wallingford18.jpg",2400,927,"afbc30358736"],
      ["wallingford19.jpg",2400,927,"549c92f3c1c3"],
      ["wallingford20.jpg",2400,927,"60efad6c89a7"],
      ["wallingford21.jpg",2400,927,"16f887acc62b"],
      ["wallingford22.jpg",2400,927,"d9ec3893ac55"],
      ["wallingford23.jpg",2400,927,"e012aeedeb3c"],
      ["wallingford24.jpg",2400,927,"b0a8292acd49"],
      ["wallingford25.jpg",2400,927,"2ea5689dc726"],
      ["wallingford26.jpg",2400,927,"7dc1d9279361"],
      ["wallingford27.jpg",2400,927,"e77efd83bf9e"],
      ["wallingford28.jpg",2400,927,"1767f3794335"],
      ["wallingford29.jpg",2400,927,"249943261511"],
      ["wallingford30.jpg",2400,927,"2c5350d55e98"],
      ["wallingford31.jpg",2400,927,"f3cc737d457e"],
      ["wallingford32.jpg",2400,927,"8688fa148a80"],
      ["wallingford33.jpg",2400,927,"d25d5a477884"],
      ["wallingford34.jpg",2400,927,"fc9acc759a14"],
      ["wallingford35.jpg",2400,927,"b5ed10a25fb0"],
      ["wallingford36.jpg",2400,927,"c52e712492cd"],
      ["wallingford37.jpg",2400,927,"0551658e7d91"],
      ["wallingford38.jpg",2400,927,"2bc1ac6cd9a9"],
      ["wallingford39.jpg",2400,927,"9e252a1eeb0d"],
      ["wallingford40.jpg",2400,927,"980483c564ac"],
      ["wallingford41.jpg",2400,927,"a5acd326d67e"],
      ["wallingford42.jpg",2400,927,"dcf2d0901578"]
    ]
  }
};

const projectKey = projectPage.dataset.project;
const project = projects[projectKey];

if (!project || project.photos.length === 0) {
  carousel.removeAttribute("tabindex");
} else {
  const fragment = document.createDocumentFragment();

  for (let index = 1; index <= project.photos.length; index += 1) {
    const [filename, width, height, version] = project.photos[index - 1];
    const card = document.createElement("div");
    const image = document.createElement("img");

    card.className = `photo-card ${width >= height ? "is-landscape" : "is-portrait"}`;
    card.style.setProperty("--cross-factor", Math.min(width, height) / Math.max(width, height));
    image.src = `../photos/${project.folder}/${encodeURIComponent(filename)}?v=${version}`;
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
  let tiltFrame = 0;
  let pointer = null;

  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    if (!tiltedImage) return;
    tiltedImage.style.transform = "";
    tiltedImage.style.boxShadow = "";
    tiltedImage = null;
  }

  carousel.addEventListener("pointermove", event => {
    if (!hoverMode.matches || rail.dragging || reducedMotion.matches || lightbox.classList.contains("is-open")) {
      resetTilt();
      return;
    }
    pointer = { x: event.clientX, y: event.clientY };
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      tiltFrame = 0;
      const image = images[rail.activeIndex];
      if (!image) return resetTilt();

      const rect = image.getBoundingClientRect();
      const inside =
        pointer.x >= rect.left && pointer.x <= rect.right &&
        pointer.y >= rect.top && pointer.y <= rect.bottom;
      if (!inside) return resetTilt();

      if (tiltedImage && tiltedImage !== image) resetTilt();
      tiltedImage = image;
      const x = ((pointer.x - rect.left) / rect.width) * 2 - 1;
      const y = ((pointer.y - rect.top) / rect.height) * 2 - 1;
      image.style.transform = `perspective(900px) rotateX(${y * -2.2}deg) rotateY(${x * 2.2}deg) translateZ(1px)`;
    });
  });

  carousel.addEventListener("pointerleave", resetTilt);
  carousel.addEventListener("pointerdown", resetTilt);
}
