const projectPage = document.querySelector(".project-page");
const carousel = document.getElementById("photoCarousel");
const track = document.getElementById("photoTrack");

const projectKey = projectPage.dataset.project || new URLSearchParams(location.search).get('project');
const project = PhotoProjects.projects.find(entry => entry.id === projectKey);
if (project) {
  projectPage.querySelector('h1').textContent = project.title;
  document.title = project.title + ' — nate gudmestad';
}

if (!project?.photos.length) {
  carousel.removeAttribute('tabindex');
  projectPage.querySelector('h1').classList.remove('visually-hidden');
  projectPage.querySelector('h1').textContent = 'This project is unavailable.';
} else {
  const fragment = document.createDocumentFragment();
  project.photos.forEach((photo, index) => {
    const {width, height} = photo;
    const card = document.createElement('div');
    card.className = 'photo-card';
    const image = document.createElement('img');
    image.className = 'photo-image';
    image.dataset.src = PhotoProjects.imageSource(project, photo, '../photos/');
    image.alt = `${projectKey} photograph ${index + 1}`;
    image.width = width;
    image.height = height;
    image.decoding = 'async';
    image.draggable = false;
    image.tabIndex = -1;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Expand ${image.alt}`);
    if (index === 0) image.fetchPriority = 'high';

    const reflection = document.createElement('div');
    reflection.className = 'photo-reflection';
    reflection.setAttribute('aria-hidden', 'true');
    const mirror = document.createElement('img');
    mirror.dataset.src = image.dataset.src;
    mirror.alt = '';
    mirror.width = width;
    mirror.height = height;
    mirror.decoding = 'async';
    mirror.draggable = false;
    reflection.appendChild(mirror);
    card.append(image, reflection);
    fragment.appendChild(card);
  });
  track.appendChild(fragment);
  initializeViewer([...track.children]);
}

function initializeViewer(cards) {
  const images = cards.map(card => card.querySelector('.photo-image'));
  const caption = document.createElement('div');
  caption.className = 'coverflow-caption';
  const title = document.createElement('span');
  title.textContent = projectPage.querySelector('h1').textContent;
  const count = document.createElement('span');
  count.className = 'coverflow-count';
  count.setAttribute('aria-live', 'polite');
  count.setAttribute('aria-atomic', 'true');
  caption.append(title, count);
  carousel.appendChild(caption);

  const scrubber = document.createElement('div');
  scrubber.className = 'gallery-scrubber';
  scrubber.tabIndex = 0;
  scrubber.setAttribute('role', 'slider');
  scrubber.setAttribute('aria-label', 'Scrub through project photographs');
  scrubber.setAttribute('aria-valuemin', '1');
  scrubber.setAttribute('aria-valuemax', String(cards.length));
  scrubber.setAttribute('aria-valuenow', '1');
  scrubber.innerHTML = '<span class="scrubber-line" aria-hidden="true"><span class="scrubber-fill"></span><span class="scrubber-thumb"></span></span>';
  projectPage.appendChild(scrubber);
  const scrubberLine = scrubber.querySelector('.scrubber-line');

  let resizeFrame = 0;
  const rail = new window.CoverFlowRail({
    container: carousel, track, items: cards, initialIndex: 0,
    onActiveChange: index => {
      const focusedPhoto = images.includes(document.activeElement);
      images.forEach((image, i) => {
        image.tabIndex = i === index ? 0 : -1;
        image.setAttribute('aria-label', `${i === index ? 'Expand' : 'Select'} ${image.alt}`);
      });
      if (focusedPhoto) images[index].focus({ preventScroll: true });
      count.textContent = `${index + 1} / ${cards.length}`;
    },
    onProgress: (progress, index) => {
      scrubber.style.setProperty('--progress', progress);
      scrubber.setAttribute('aria-valuenow', String(index + 1));
      scrubber.setAttribute('aria-valuetext', `Photograph ${index + 1} of ${cards.length}`);
    }
  });

  images.forEach((image, index) => PhotoProjects.measure(image, (width, height) => {
    const mirror = cards[index].querySelector('.photo-reflection img');
    mirror.width = width;
    mirror.height = height;
    if (!resizeFrame) resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; rail.refresh(); });
  }));

  let scrubPointer = null;
  function scrubTo(clientX) {
    const rect = scrubberLine.getBoundingClientRect();
    rail.setProgress(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  }
  function finishScrubbing(event) {
    if (scrubPointer !== event.pointerId) return;
    scrubPointer = null;
    scrubber.classList.remove('is-scrubbing');
    if (scrubber.hasPointerCapture(event.pointerId)) scrubber.releasePointerCapture(event.pointerId);
    rail.snapToNearest();
  }
  scrubber.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    scrubPointer = event.pointerId;
    scrubber.focus({ preventScroll: true });
    scrubber.classList.add('is-scrubbing');
    scrubber.setPointerCapture(event.pointerId);
    scrubTo(event.clientX);
  });
  scrubber.addEventListener('pointermove', event => {
    if (scrubPointer !== event.pointerId) return;
    event.preventDefault();
    scrubTo(event.clientX);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => scrubber.addEventListener(type, finishScrubbing));
  scrubber.addEventListener('keydown', event => {
    if (!['Home', 'End', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') rail.centerItem(0);
    else if (event.key === 'End') rail.centerItem(cards.length - 1);
    else {
      const step = event.key.startsWith('Page') ? 5 : 1;
      const direction = ['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1;
      rail.centerItem(Math.round(rail.target) + direction * step);
    }
  });

  const lightbox = document.createElement('div');
  lightbox.className = 'photo-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Expanded photograph');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.inert = true;
  lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image">×</button><img alt="">';
  document.body.appendChild(lightbox);
  const expandedImage = lightbox.querySelector('img');
  const closeButton = lightbox.querySelector('button');
  const background = [projectPage, document.querySelector('.site-header'), document.querySelector('.site-back')];
  let trigger = null;

  function openLightbox(image) {
    trigger = image;
    expandedImage.src = image.currentSrc || image.src;
    expandedImage.alt = image.alt;
    lightbox.inert = false;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    background.forEach(element => { if (element) element.inert = true; });
    closeButton.focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.inert = true;
    background.forEach(element => { if (element) element.inert = false; });
    trigger?.focus({ preventScroll: true });
  }
  images.forEach((image, index) => {
    const activate = () => {
      if (rail.consumeDragged()) return;
      if (index !== rail.activeIndex) rail.centerItem(index);
      else openLightbox(image);
    };
    image.addEventListener('click', activate);
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  closeButton.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'Tab') { event.preventDefault(); closeButton.focus(); }
  });
  // Arrow keys work immediately after opening a gallery, without a preliminary click.
  if (document.activeElement === document.body) carousel.focus({ preventScroll: true });
}
