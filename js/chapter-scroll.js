(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('main');
  const { gsap, ScrollTrigger, Lenis } = window;
  const canReveal = Boolean(gsap && ScrollTrigger);
  let reading = false;
  let lenis;
  let context;
  let sizeObserver;
  let refreshFrame;
  const originals = new Map();

  function toY(top, milliseconds = 970) {
    if (lenis) {
      // The final letter can expand the page in the same click.
      lenis.resize();
      lenis.scrollTo(top, { duration: milliseconds / 1000 });
    } else {
      window.scrollTo({ top, behavior: reduced.matches ? 'instant' : 'smooth' });
    }
  }

  function toElement(element, milliseconds) {
    if (!element) return;
    const parent = element.offsetParent;
    // Measure the paper's layout edge even while its CSS entrance is playing.
    const top = parent
      ? parent.getBoundingClientRect().top + parent.clientTop + element.offsetTop
      : element.getBoundingClientRect().top;
    toY(Math.max(0, top + scrollY - document.querySelector('#siteHeader').offsetHeight - 12), milliseconds);
  }

  window.chapterScroll = { toY, toElement };

  function revealTitle(heading) {
    const original = [...heading.childNodes];
    const label = heading.innerText.trim().replace(/\s+/g, ' ');
    originals.set(heading, { original, label: heading.getAttribute('aria-label') });
    heading.replaceChildren(...original.map(node => node.cloneNode(true)));
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const words = [];
    for (const node of nodes) {
      const pieces = node.data.split(/(\s+)/).filter(Boolean).map(piece => {
        if (!piece.trim()) return piece;
        const span = document.createElement('span');
        span.textContent = piece;
        span.setAttribute('aria-hidden', 'true');
        words.push(span);
        return span;
      });
      node.replaceWith(...pieces);
    }
    heading.setAttribute('aria-label', label);
    gsap.from(words, {
      opacity: 0, duration: 0.38, stagger: 0.075, ease: 'power1.out',
      scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
    });
  }

  const tick = seconds => lenis?.raf(seconds * 1000);

  function refreshTitles() {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function start() {
    if (!reading || reduced.matches) return;
    if (Lenis) {
      lenis = new Lenis({ autoRaf: !canReveal, syncTouch: false });
      if (canReveal) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
      }
    }
    if (canReveal) {
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        main.querySelectorAll('.hero__headline, h2.display-title').forEach(revealTitle);
      });
      // Keys, letters and the gift can move later chapters after the initial render.
      if (window.ResizeObserver) {
        sizeObserver = new ResizeObserver(refreshTitles);
        sizeObserver.observe(main);
      }
      document.fonts?.addEventListener('loadingdone', refreshTitles);
    }
  }

  function stop() {
    sizeObserver?.disconnect();
    document.fonts?.removeEventListener('loadingdone', refreshTitles);
    cancelAnimationFrame(refreshFrame);
    if (canReveal) gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = undefined;
    context?.revert();
    context = undefined;
    for (const [heading, { original, label }] of originals) {
      heading.replaceChildren(...original);
      if (label === null) heading.removeAttribute('aria-label');
      else heading.setAttribute('aria-label', label);
    }
    originals.clear();
  }

  document.addEventListener('gift:gate-opened', () => { reading = true; start(); });
  document.addEventListener('gift:replay-start', () => { reading = false; stop(); });
  reduced.addEventListener('change', () => { stop(); start(); });

  // Stop wheel momentum behind a modal, including while the user reads a long letter.
  const syncDialog = () => {
    if (document.querySelector('dialog[open]')) lenis?.stop();
    else lenis?.start();
  };
  const dialogObserver = new MutationObserver(syncDialog);
  document.querySelectorAll('dialog').forEach(dialog =>
    dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
})();
