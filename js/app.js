(() => {
  'use strict';
  const cfg = window.GIFT_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const safe = (v, fallback = '') => typeof v === 'string' && v.trim() ? v.trim() : fallback;

  const romanticAddress = safe(cfg.romanticAddress, 'Sayang');
  const me = safe(cfg.senderName, 'Aku');
  $('#birthdayName').textContent = romanticAddress + '.';
  $('#birthdayNameInline').textContent = 'kamu';
  $('#polaroidMe').textContent =
  safe(cfg.polaroidMeCaption, me.toLowerCase() + ', di sini ♡');
  $('#polaroidHer').textContent =
  safe(cfg.polaroidHerCaption, romanticAddress.toLowerCase() + ', di sana ♡');
  $('#signatureName').textContent = me + '.';
  $('#giftBoxLetter').textContent = 'Untuk ' + romanticAddress.toLowerCase() + ' ♡';
  $('#finalTitle').textContent = safe(cfg.finalTitle, 'Untuk kamu, yang istimewa.');
  $('#finalMessage').textContent = safe(cfg.finalMessage, 'Selamat ulang tahun! Semoga semua hal baik selalu menyertaimu.');
  $('#secretText').textContent = safe(cfg.secretMessage, 'Semoga hal-hal baik selalu menjaga cerita kita.');
  $('#firstTalkText').textContent = safe(cfg.firstTalkText, $('#firstTalkText').textContent);
  $('#relationshipText').textContent = safe(cfg.relationshipText, $('#relationshipText').textContent);
  if (safe(cfg.firstTalkDate)) $('#firstTalkDate').textContent = cfg.firstTalkDate;
  if (safe(cfg.relationshipDate)) $('#relationshipDate').textContent = cfg.relationshipDate;
  document.title = `Untuk ${romanticAddress.toLowerCase()} ♡ | Sugeng Ambalwarsa`;

  function setupPhoto(selector, src) {
    const img = $(selector);
    if (!img) return;
    img.onerror = () => {
      if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
      else img.classList.add('has-error');
    };
    img.onload = () => img.classList.remove('has-error');
    if (safe(src) && src !== img.getAttribute('src')) {
      img.removeAttribute('srcset');
      img.src = src;
    }
    if (img.complete && img.naturalWidth === 0) img.classList.add('has-error');
  }
  setupPhoto('#photoMe', cfg.photoMe);
  setupPhoto('#photoHer', cfg.photoHer);


  function populateStars(selector, count, seed) {
    const parent = $(selector);
    if (!parent) return;
    let n = seed;
    const rand = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const r = rand();
      el.className = 'star-dot';
      el.style.left = `${rand() * 100}%`;
      el.style.top = `${rand() * 100}%`;
      const size = r > .94 ? 3 : r > .65 ? 2 : 1;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.setProperty('--delay', `${-rand() * 5}s`);
      el.style.setProperty('--twinkle', `${3 + rand() * 4}s`);
      fragment.appendChild(el);
    }
    parent.appendChild(fragment);
  }
  const compactScreen = window.matchMedia('(max-width: 600px)').matches;
  populateStars('#gateStars', compactScreen ? 35 : 65, 8421);
  populateStars('#heroStars', compactScreen ? 55 : 105, 6514);

  // 2. V4.1 ENVELOPE — each physical layer has its own independent timeline.
  // Older CSS-stage animations are deliberately suppressed while the sequence runs.
  const gate = $('#gate');
  const envelope = $('#envelope');
  const skipGate = $('#skipGate');
  const gateLabel = $('#gateSequence');
  const flap = $('.envelope__flap');
  const seal = $('.envelope__seal');
  const paper = $('.envelope__letter');
  const paperFold = $('.envelope__paper-fold');
  let opening = false;
  let gateFinished = false;
  const activeGateAnims = new Set();
  const timing = {ease:'cubic-bezier(.23,.74,.24,1)', paper:'cubic-bezier(.18,.78,.24,1)', lid:'cubic-bezier(.15,.7,.24,1)'};
  function animatePart(el, frames, duration, easing, set) {
    if (reduceMotion || !el) return Promise.resolve();
    const playbackDuration = set === activeGateAnims ? duration * .78 : duration;
    const a = el.animate(frames, {duration: playbackDuration, easing, fill:'forwards'});
    if (set) set.add(a);
    return a.finished.catch(()=>{});
  }
  function cancelParts(set) {
    for (const a of set) { try { a.cancel(); } catch {} }
    set.clear();
  }
  function forceTop() {
    const root=document.documentElement;
    const previous=root.style.scrollBehavior;
    root.style.scrollBehavior='auto';
    window.scrollTo({top:0,left:0,behavior:'instant'});
    root.style.scrollBehavior=previous;
  }
  // Don't let browser scroll restoration bypass the envelope during a replay.
  if (window.location.hash) history.replaceState(null,'',window.location.pathname+window.location.search);
  forceTop();
  window.addEventListener('pageshow',()=>{if (!gateFinished) forceTop();});
  let gateToken=0;
  async function finishGate(skipped=false) {
    if (gateFinished) return;
    gateFinished=true;
    gateToken++;
    skipGate.hidden=true;
    gate.classList.add('is-mechanism-finished');
    cancelParts(activeGateAnims);
    gateLabel.textContent='Selamat datang dalam cerita kecil kita. ♡';
    if (!skipped && !reduceMotion) {
      gate.classList.add('is-cinematic-exiting');
      await wait(590);
    }
    gate.classList.add('is-leaving');
    document.body.classList.remove('is-locked');
    gate.hidden=true;
    document.dispatchEvent(new CustomEvent('gift:gate-opened'));
    updateScroll();
  }
  async function openGate() {
    if (opening || gateFinished) return;
    opening=true;
    const token=++gateToken;
    envelope.disabled=true;
    $('#openGate').disabled=true;
    skipGate.hidden=false;
    skipGate.focus({preventScroll:true});
    gate.classList.add('is-cinematic-playing');
    const stage=async (label, actions) => {
      if (gateFinished || token !== gateToken) return false;
      gateLabel.textContent=label;
      await Promise.all(actions());
      return !gateFinished && token===gateToken;
    };
    if (!await stage('Ada surat kecil yang ingin keluar...',()=>[
      animatePart(envelope,[{transform:'rotate(-2deg) translateY(0)'},{transform:'rotate(-1.2deg) translateY(-6px)',offset:.55},{transform:'rotate(-2deg) translateY(0)'}],420,timing.ease,activeGateAnims)
    ])) return;
    if (!await stage('Segelnya pelan-pelan terlepas...',()=>[
      animatePart(seal,[{transform:'translate3d(0,0,0) rotate(0) scale(1)',opacity:1}, {transform:'translate3d(1px,-4px,0) rotate(10deg) scale(1.05)',opacity:1,offset:.33}, {transform:'translate3d(0,-22px,0) rotate(-29deg) scale(.12)',opacity:0}],750,timing.ease,activeGateAnims)
    ])) return;
    gate.classList.add('is-seal-gone');
    if (!await stage('Lipatan amplop dibuka perlahan...',()=>[
      animatePart(flap,[{transform:'rotateX(0deg)'},{transform:'rotateX(-48deg)',offset:.28},{transform:'rotateX(-126deg)',offset:.73},{transform:'rotateX(-179deg)'}],1420,'cubic-bezier(.42,.03,.18,.98)',activeGateAnims)
    ])) return;
    gate.classList.add('is-flap-open');
    if (!await stage('Kertas suratnya mulai keluar...',()=>[
      animatePart(paper,[{transform:'translate3d(0,0,0) rotate(0)'}, {transform:'translate3d(0,-43px,0) rotate(-.2deg)',offset:.32}, {transform:'translate3d(0,-112px,0) rotate(-1deg)',offset:.83}, {transform:'translate3d(0,-118px,0) rotate(-.8deg)'}],1740,timing.paper,activeGateAnims)
    ])) return;
    gate.classList.add('is-paper-up');
    if (!await stage('Suratnya terbentang untukmu...',()=>[
      animatePart(paperFold,[{transform:'rotateX(0deg)',opacity:1},{transform:'rotateX(-75deg)',opacity:1,offset:.4},{transform:'rotateX(-178deg)',opacity:0}],670,timing.ease,activeGateAnims),
      animatePart(paper,[{transform:'translate3d(0,-118px,0) rotate(-.8deg)'},{transform:'translate3d(0,-123px,0) rotate(-.3deg) scale(1.035)'}],670,timing.ease,activeGateAnims)
    ])) return;
    gate.classList.add('is-paper-open');
    if (!await stage('Dibuat khusus untukmu. ♡',()=>[
      animatePart(paper,[{transform:'translate3d(0,-123px,0) rotate(-.3deg) scale(1.035)'},{transform:'translate3d(0,-129px,0) rotate(0) scale(1.075)'}],370,timing.ease,activeGateAnims)
    ])) return;
    gate.classList.add('is-paper-presented');
    await finishGate(false);
  }
  envelope.addEventListener('click',openGate);
  $('#openGate').addEventListener('click',openGate);
  skipGate.addEventListener('click',()=>finishGate(true));

  // 3. SCROLL ANIMATIONS, PROGRESS AND NAVIGATION
  let revealObserver = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = revealObserver = new IntersectionObserver((entries) => {
      for (const item of entries) {
        if (item.isIntersecting) {
          item.target.classList.add('is-visible');
          observer.unobserve(item.target);
        }
      }
    }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    $$('.reveal').forEach((el, index) => {
      if (el.classList.contains('letter-card')) {
        el.style.transitionDelay = `${(index % 4) * 65}ms`;
      }
      observer.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  let scrollTicking = false;
  const navLinks = $$('.main-nav a');
  const navSections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
  const menu = $('#chapterMenu');
  const nav = $('#chapterNav');
  const mobileNav = matchMedia('(max-width: 800px)');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
  }
  menu.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true'));
  });
  document.addEventListener('pointerdown', event => {
    if (!menu.contains(event.target) && !nav.contains(event.target)) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (event.target !== menu && !nav.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  mobileNav.addEventListener('change', closeMenu);
  function updateScroll() {
    const pos = window.scrollY;
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    $('#pageProgress').style.width = `${Math.min(100, pos / total * 100)}%`;
    $('#siteHeader').classList.toggle('is-scrolled', pos > 100);
    let active = '';
    for (const section of navSections) {
      if (section.getBoundingClientRect().top < window.innerHeight * .48) active = section.id;
    }
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + active;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScroll);
      scrollTicking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  // Controlled anchor scrolling so long section jumps do not flash through the page.
  $$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const href=link.getAttribute('href');
    const target=href&&document.querySelector(href);
    if(!target || !gateFinished)return;
    event.preventDefault();
    if (nav.contains(link) && mobileNav.matches) {
      closeMenu();
      target.tabIndex = -1;
      target.focus({preventScroll:true});
    }
    window.chapterScroll.toElement(target,href==='#home'?1100:970);
  }));

  // 4. FOUR REAL LETTERS
  const letterDialog = $('#letterDialog');
  const openLetters = new Set();
  const letters = cfg.letters || {};
  const order = ['miss','tired','sad','hope'];
  async function openLetter(key) {
    const number = order.indexOf(key) + 1;
    const data = letters[key];
    if (!data || !number) return;
    $('#dialogKicker').textContent = `SURAT KECIL NO. ${String(number).padStart(2, '0')}`;
    $('#dialogTitle').textContent = safe(data.title, 'Untukmu...');
    $('#dialogContent').textContent = safe(data.message, 'Semoga hari ini membawa kabar baik untukmu.');
    const card = $(`[data-letter="${key}"]`);
    if (card.classList.contains('is-opening')) return;
    card.classList.add('is-opening');
    await wait(reduceMotion ? 25 : 550);
    if (letterDialog.showModal) letterDialog.showModal();
    else letterDialog.setAttribute('open', '');
    openLetters.add(key);
    card.classList.add('is-opened');
    card.setAttribute('aria-description','Surat sudah dibuka');
    card.classList.remove('is-opening');
  }
  $$('.letter-card').forEach(card => card.addEventListener('click', () => openLetter(card.dataset.letter)));
  $('#dialogClose').addEventListener('click', () => letterDialog.close());
  letterDialog.addEventListener('click', e => {
    if (e.target === letterDialog) letterDialog.close();
  });

  // 5. HIDDEN STAR SECRET, CLICK 3 TIMES
  const secretDialog = $('#secretDialog');
  let starCount = 0;
  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2700);
  }
  $('#secretStar').addEventListener('click', () => {
    starCount += 1;
    if (starCount >= 3) {
      starCount = 0;
      secretDialog.showModal();
    } else toast(starCount === 1 ? 'Ada sesuatu di bintang ini... ✧' : 'Sekali lagi, rahasianya hampir terbuka. ✧');
  });
  $('#secretClose').addEventListener('click', () => secretDialog.close());
  $('#secretDone').addEventListener('click', () => secretDialog.close());
  secretDialog.addEventListener('click', e => { if (e.target === secretDialog) secretDialog.close(); });

  // 6. V4.1 GIFT — an independent physical sequence (not CSS stage collisions).
  const giftStage = $('#giftStage');
  const giftBox = $('#giftBox');
  const giftHint = $('#giftHint');
  const skipGift = $('#skipGift');
  const activeGiftAnims = new Set();
  const giftBows = $$('.gift-box__bow');
  const giftTails = $$('.gift-box__ribbon-tail');
  const giftRibbonH = $('.gift-box__ribbon-h');
  const giftRibbonV = $('.gift-box__ribbon-v');
  const giftLid = $('.gift-box__lid');
  const giftLetter = $('.gift-box__letter');
  const giftGlow = $('.gift-box__light');
  let giftRunning=false, giftFinished=false, giftToken=0;
  function finishGift(skipped=false){
    if(giftFinished)return;
    giftFinished=true;giftRunning=false;giftToken++;
    giftStage.classList.add('is-cinematic-finished');
    cancelParts(activeGiftAnims);
    giftHint.textContent='surat terakhir sudah terbuka ♡';
    giftHint.append(document.createElement('br'), 'Satu surat terakhir, khusus untukmu. ♡');
    skipGift.hidden=true;
    giftBox.disabled=false;
    giftBox.setAttribute('aria-label','Baca surat terakhir');
    $('#giftReveal').hidden=false;
    readFinalLetter(skipped?400:780);
  }
  function readFinalLetter(duration) {
    $('#finalTitle').tabIndex = -1;
    $('#finalTitle').focus({preventScroll:true});
    window.chapterScroll.toElement($('#giftReveal'),duration);
  }
  async function openGift(){
    if(giftFinished){readFinalLetter(750);return;}
    if(giftRunning)return;
    giftRunning=true;
    const token=++giftToken;
    giftBox.disabled=true;
    skipGift.hidden=false;
    skipGift.focus({preventScroll:true});
    giftStage.classList.add('is-cinematic-playing');
    const step=async (caption,animations)=>{
      if(giftFinished || token !== giftToken)return false;
      giftHint.textContent=caption;
      await Promise.all(animations());
      return !giftFinished && token===giftToken;
    };
    if(!await step('Ada kejutan yang menunggu...',()=>[
      animatePart(giftBox,[{transform:'rotate(-4deg) translateY(0)'},{transform:'rotate(-1deg) translateY(-8px)',offset:.5},{transform:'rotate(-3deg) translateY(0)'}],480,timing.ease,activeGiftAnims)
    ]))return;
    if(!await step('Simpul pitanya dilepas pelan-pelan...',()=>[
      animatePart(giftBows[0],[{transform:'rotate(23deg)',opacity:1},{transform:'translate(-19px,-18px) rotate(-25deg) scale(.9)'}],1120,timing.ease,activeGiftAnims),
      animatePart(giftBows[1],[{transform:'rotate(65deg) scaleX(-1)',opacity:1},{transform:'translate(21px,-18px) rotate(105deg) scaleX(-.91)'}],1120,timing.ease,activeGiftAnims),
      animatePart($('.gift-box__center'),[{transform:'scale(1)',opacity:1},{transform:'translateY(6px) scale(.3) rotate(20deg)',opacity:0}],900,timing.ease,activeGiftAnims),
      animatePart(giftTails[0],[{transform:'rotate(19deg)'},{transform:'translate(-9px,20px) rotate(38deg)'}],1120,timing.ease,activeGiftAnims),
      animatePart(giftTails[1],[{transform:'rotate(-22deg)'},{transform:'translate(9px,20px) rotate(-42deg)'}],1120,timing.ease,activeGiftAnims)
    ]))return;
    if(!await step('Pitanya jatuh menyusul...',()=>[
      animatePart(giftBows[0],[{transform:'translate(-19px,-18px) rotate(-25deg) scale(.9)',opacity:1},{transform:'translate(-88px,125px) rotate(-104deg) scale(.63)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims),
      animatePart(giftBows[1],[{transform:'translate(21px,-18px) rotate(105deg) scaleX(-.91)',opacity:1},{transform:'translate(96px,132px) rotate(125deg) scaleX(-.63)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims),
      animatePart(giftTails[0],[{transform:'translate(-9px,20px) rotate(38deg)',opacity:1},{transform:'translate(-66px,133px) rotate(76deg)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims),
      animatePart(giftTails[1],[{transform:'translate(9px,20px) rotate(-42deg)',opacity:1},{transform:'translate(69px,133px) rotate(-76deg)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims),
      animatePart(giftRibbonV,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate(29px,132px) rotate(26deg)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims),
      animatePart(giftRibbonH,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate(37px,93px) rotate(-9deg)',opacity:0}],1000,'cubic-bezier(.4,0,.74,.64)',activeGiftAnims)
    ]))return;
    if(!await step('Tutup kotaknya mulai terangkat...',()=>[
      animatePart(giftLid,[{transform:'translate3d(0,0,0) rotate(0deg)',offset:0}, {transform:'translate3d(-4px,-20px,0) rotate(-4deg)',offset:.24},{transform:'translate3d(-13px,-66px,0) rotate(-10deg)',offset:.74},{transform:'translate3d(-16px,-84px,0) rotate(-13deg)',offset:.89},{transform:'translate3d(-16px,-77px,0) rotate(-12deg)',offset:1}],1900,timing.lid,activeGiftAnims)
    ]))return;
    if(!await step('Ada surat yang muncul dari dalam...',()=>[
      animatePart(giftGlow,[{opacity:0,transform:'translateY(0) scale(.4)'},{opacity:.8,transform:'translateY(-10px) scale(1.2)'}],970,'ease-out',activeGiftAnims),
      animatePart(giftLetter,[{transform:'translateY(40px) scale(.8) rotate(5deg)',opacity:0},{transform:'translateY(-13px) scale(.93) rotate(1deg)',opacity:.65,offset:.52},{transform:'translateY(-55px) scale(1.01) rotate(-2deg)',opacity:1}],970,timing.paper,activeGiftAnims)
    ]))return;
    await finishGift(false);
  }
  giftBox.addEventListener('click',openGift);
  skipGift.addEventListener('click',()=>finishGift(true));
  $('#restart').addEventListener('click',()=>{
    // Real replay, not navigation to #home. Every interactive state is reset in place.
    if ($('#replayCurtain').classList.contains('is-on')) return;
    document.dispatchEvent(new CustomEvent('gift:replay-start'));
    pauseMusic();
    const voice=$('#voiceAudio'); if(voice) {voice.pause();voice.currentTime=0;}
    const curtain=$('#replayCurtain');
    curtain.hidden=false;
    requestAnimationFrame(()=>curtain.classList.add('is-on'));
    document.body.classList.add('is-locked');
    setTimeout(()=>{
      gateToken++; gateFinished=false; opening=false;
      cancelParts(activeGateAnims);
      gate.className='gate'; gate.hidden=false;
      gateLabel.textContent='ketuk amplop untuk membuka hadiahnya';
      envelope.disabled=false;
      $('#openGate').disabled=false;
      skipGate.hidden=true;
      giftToken++; giftFinished=false; giftRunning=false;
      cancelParts(activeGiftAnims);
      giftStage.classList.remove('is-cinematic-playing','is-cinematic-finished','is-open','is-playing','is-preparing','is-untying','is-ribbon-falling','is-lifting-lid','is-glowing');
      giftBox.disabled=false;
      giftBox.setAttribute('aria-label','Buka kado terakhir');
      giftHint.textContent='ketuk kadonya pelan-pelan ✦';
      skipGift.hidden=true;
      $('#giftReveal').hidden=true;
      openLetters.clear();
      $$('.letter-card').forEach(card=>{
        card.classList.remove('is-opened','is-opening');
        card.removeAttribute('aria-description');
      });
      if (letterDialog.open) letterDialog.close();
      if (secretDialog.open) secretDialog.close();
      starCount=0; clearTimeout(toastTimer);$('#toast').classList.remove('is-visible');
      litStars.clear();
      starButtons.forEach((el,index)=>{
        el.setAttribute('aria-pressed','false');
        el.classList.remove('is-lit');
        el.setAttribute('aria-label',`Bintang ${index+1}, buka harapan`);
      });
      starLines.forEach(el=>el.classList.remove('is-linked'));
      $('#wishCount').textContent='00 / 05';
      $('#wishComplete').hidden=true;
      sky.classList.remove('is-complete');
      wishBody.innerHTML=initialWishHTML;
      wishBody.style.animation='';
      $('#wishSky').querySelectorAll('.star-particle').forEach(el=>el.remove());
      clearTimeout(futureSwapTimer);
      clearTimeout(futureSettleTimer);
      currentFuture=0; switchingFuture=false; visitedFuture.clear();
      futureCard.classList.remove('is-flipped','is-swapping');
      futureCard.setAttribute('aria-pressed','false');
      futureCard.removeAttribute('aria-describedby');
      $('#futureHint').textContent='Ketuk kartunya dulu untuk membaca harapan pertama.';
      displayFuture();
      document.dispatchEvent(new CustomEvent('gift:full-replay'));
      if(window.location.hash) history.replaceState(null,'',window.location.pathname+window.location.search);
      forceTop();
      updateScroll();
      if(revealObserver){
        $$('.reveal').forEach(el=>{el.classList.remove('is-visible');revealObserver.observe(el);});
      }
      curtain.classList.remove('is-on');
      setTimeout(()=>{curtain.hidden=true;},reduceMotion?20:550);
    },reduceMotion?20:590);
  });

  // 7. FIVE STARS OF HOPE — visit each once to illuminate an actual constellation.
  const skyWishes = Array.isArray(cfg.skyWishes) && cfg.skyWishes.length === 5 ? cfg.skyWishes : [
    {title:'Kebaikan untukmu',message:'Semoga setiap hari membawamu mendekati hal baik.'},
    {title:'Ketenangan',message:'Semoga hatimu dijaga di hari-hari yang sulit.'},
    {title:'Semangat belajar',message:'Semoga setiap usahamu diberkahi.'},
    {title:'Sabar menghadapi jarak',message:'Semoga kita selalu menjaga hal baik di antara kita.'},
    {title:'Masa depan',message:'Semoga Allah memilihkan yang paling baik.'}
  ];
  const litStars = new Set();
  const starButtons = $$('.wish-star');
  const starLines = $$('.star-path');
  const wishBody = $('#wishMessage');
  const initialWishHTML = wishBody.innerHTML;
  const sky = $('#wishSky');
  // A little ambient dust is painted once, not animated with a costly canvas loop.
  for (let i = 0; i < 23; i++) {
    const dust = document.createElement('i');
    dust.style.left = `${((i * 37 + 11) % 97)}%`;
    dust.style.top = `${((i * 59 + 17) % 94)}%`;
    dust.style.animationDelay = `${-i * .27}s`;
    $('#wishDust').append(dust);
  }
  function starBurst(button) {
    if (reduceMotion) return;
    const source = button.getBoundingClientRect();
    const bounds = sky.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span');
      s.className = 'star-particle';
      s.textContent = i % 3 ? '·' : '✧';
      s.style.left = `${source.left - bounds.left + source.width / 2}px`;
      s.style.top = `${source.top - bounds.top + source.height / 2}px`;
      const a = Math.PI * 2 * i / 10;
      const r = 38 + (i % 3) * 13;
      s.style.setProperty('--dx', `${Math.cos(a) * r}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * r}px`);
      sky.append(s);
      s.addEventListener('animationend', () => s.remove(), {once:true});
      setTimeout(() => s.remove(), 1100);
    }
  }
  starButtons.forEach(button => button.setAttribute('aria-pressed','false'));
  starButtons.forEach((button, index) => button.addEventListener('click', () => {
    const first = !litStars.has(index);
    litStars.add(index);
    button.classList.add('is-lit');
    button.setAttribute('aria-label', `Bintang ${index + 1}, sudah dibuka: ${safe(skyWishes[index].title, 'Harapan')}`);
    if (first) starBurst(button);
    starLines.forEach((line, j) => line.classList.toggle('is-linked', litStars.has(j) && litStars.has(j + 1)));
    $('#wishCount').textContent = `${String(litStars.size).padStart(2,'0')} / 05`;
    const title = safe(skyWishes[index]?.title, 'Harapan kecil untukmu');
    const message = safe(skyWishes[index]?.message, 'Semoga Allah mengabulkan hal-hal baik.');
    wishBody.replaceChildren();
    const num = document.createElement('span'); num.className = 'wish-caption__number'; num.textContent = `✦ 0${index + 1}`;
    const h = document.createElement('h3'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = message;
    wishBody.append(num,h,p);
    starButtons.forEach(star => star.setAttribute('aria-pressed', String(star === button)));
    if (window.matchMedia('(max-width: 800px), (max-width: 1000px) and (max-height: 480px)').matches) {
      // Keep the constellation reachable and bring the opening lines into view.
      const firstLines = p.getBoundingClientRect().top + 2 * parseFloat(getComputedStyle(p).lineHeight);
      const needed = firstLines + 12 - innerHeight;
      const available = sky.getBoundingClientRect().top - $('#siteHeader').offsetHeight - 8;
      const distance = Math.min(needed, available);
      if (distance > 0) window.chapterScroll.toY(window.scrollY + distance, 420);
    }
    wishBody.style.animation = 'none'; void wishBody.offsetWidth; wishBody.style.animation = '';
    if (litStars.size === 5) {
      $('#wishComplete').hidden = false;
      sky.classList.add('is-complete');
      if (first) { toast('Lima bintang, lima doa. Semuanya sudah menyala. ✨'); document.dispatchEvent(new CustomEvent('gift:sky-complete')); }
    }
  }));

  // 8. UNWRITTEN MEMORY DECK — genuine flip interaction with browsable hope cards.
  const futureItems = Array.isArray(cfg.futureCards) && cfg.futureCards.length >= 4 ? cfg.futureCards : [
    {title:'Pertemuan pertama.',message:'Semoga waktunya tiba dengan cara terbaik.'},
    {title:'Foto pertama.',message:'Bersama, dalam satu bingkai.'},
    {title:'Cerita tanpa layar.',message:'Suatu hari, semoga bisa mengobrol berdekatan.'},
    {title:'Hari yang baik.',message:'Semoga langkah kita selalu diberi petunjuk.'}
  ];
  const futureCard = $('#futureCard');
  const futureBars = $$('#futureProgressBars span');
  let currentFuture = 0;
  let switchingFuture = false;
  let futureSwapTimer;
  let futureSettleTimer;
  let suppressSwipeClick = false;
  const visitedFuture = new Set();
  function displayFuture() {
    const item = futureItems[currentFuture];
    $('#futureCardTitle').textContent = safe(item?.title, 'Harapan berikutnya');
    $('#futureCardMessage').textContent = safe(item?.message, 'Semoga waktunya baik.');
    $('#futureIndex').textContent = `${String(currentFuture + 1).padStart(2,'0')} / ${String(futureItems.length).padStart(2,'0')}`;
    $('#futureCounterText').textContent = `Kartu ${currentFuture + 1} dari ${futureItems.length}`;
    futureBars.forEach((bar, index) => bar.classList.toggle('is-active', index === currentFuture));
    futureCard.setAttribute('aria-label', `Balik kartu ${currentFuture + 1}: ${safe(item?.title,'Harapan')}`);
  }
  futureCard.addEventListener('click', event => {
    if (suppressSwipeClick && event.detail > 0) return;
    if (switchingFuture) return;
    const flipped = futureCard.classList.toggle('is-flipped');
    futureCard.setAttribute('aria-pressed', String(flipped));
    if (flipped) futureCard.setAttribute('aria-describedby', 'futureCardMessage');
    else futureCard.removeAttribute('aria-describedby');
    if (flipped) {
      visitedFuture.add(currentFuture);
      document.dispatchEvent(new CustomEvent('gift:future-progress',{detail:{count:visitedFuture.size,total:futureItems.length}}));
      $('#futureHint').textContent = visitedFuture.size === futureItems.length
        ? 'Semua harapan sudah kamu baca. Semoga hari-hari baik datang pada waktunya. ♡'
        : 'Satu harapan tersimpan. Masih ada kartu lainnya.';
    } else $('#futureHint').textContent = 'Ketuk kartunya untuk melihat harapan ini lagi.';
  });
  function changeFuture(by) {
    if (switchingFuture) return;
    switchingFuture = true;
    futureCard.classList.add('is-swapping');
    futureSwapTimer = setTimeout(() => {
      currentFuture = (currentFuture + by + futureItems.length) % futureItems.length;
      displayFuture();
      futureCard.classList.add('is-flipped');
      futureCard.setAttribute('aria-pressed', 'true');
      futureCard.setAttribute('aria-describedby', 'futureCardMessage');
      visitedFuture.add(currentFuture);
      document.dispatchEvent(new CustomEvent('gift:future-progress',{detail:{count:visitedFuture.size,total:futureItems.length}}));
      $('#futureHint').textContent = visitedFuture.size === futureItems.length
        ? 'Semua harapan sudah kamu baca. Semoga hari-hari baik datang pada waktunya. ♡'
        : 'Harapan berikutnya terbuka. Geser lagi untuk membaca semuanya.';
    }, reduceMotion ? 0 : 190);
    futureSettleTimer = setTimeout(() => { futureCard.classList.remove('is-swapping');switchingFuture = false; }, reduceMotion ? 25 : 565);
  }
  let swipeStart = null;
  futureCard.addEventListener('pointerdown', event => {
    suppressSwipeClick = false;
    if (event.pointerType === 'mouse') return;
    swipeStart = event.isPrimary ? {id:event.pointerId, x:event.clientX, y:event.clientY} : null;
  });
  futureCard.addEventListener('pointercancel', () => { swipeStart = null; });
  futureCard.addEventListener('pointerup', event => {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressSwipeClick = true;
      changeFuture(dx < 0 ? 1 : -1);
    }
  });
  $('#futureNext').addEventListener('click', () => changeFuture(1));
  $('#futurePrev').addEventListener('click', () => changeFuture(-1));
  displayFuture();

  // 9. SUBTLE POINTER PARALLAX — limited to fine pointer devices and RAF to stay smooth.
  const hero = $('#home');
  if (!reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let pointerRAF = 0;
    hero.addEventListener('pointermove', e => {
      if (pointerRAF) return;
      const x = (e.clientX / window.innerWidth - .5) * 19;
      const y = (e.clientY / window.innerHeight - .5) * 18;
      pointerRAF = requestAnimationFrame(() => {
        const art = $('.hero__art');
        art.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
        art.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
        pointerRAF=0;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave',()=>{
      $('.hero__art').style.setProperty('--pointer-x', '0px');
      $('.hero__art').style.setProperty('--pointer-y', '0px');
    });
  }

  // 10. OPTIONAL AUDIO: user-supplied music.mp3 OR gentle, original synthesized ambient background.
  // No copyrighted track; never autoplay. Audio starts only after a user click.
  let audioFile;
  let audioContext;
  let toneInterval;
  let activeNodes = [];
  let soundOn = false;
  let musicRequested = false;
  let musicRequest = 0;
  let synthRequest = -1;
  let synthStep = 0;
  const MusicCtx = window.AudioContext || window.webkitAudioContext;
  function playTone(frequency, duration=.75, volume=.016) {
    if (!audioContext) return;
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = 'sine';osc.frequency.value = frequency;
    filter.type = 'lowpass';filter.frequency.value = 900;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.07);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
    osc.start(t);osc.stop(t+duration+.02);
    activeNodes.push(osc);
    osc.onended = () => { activeNodes=activeNodes.filter(n=>n!==osc);osc.disconnect();gain.disconnect();filter.disconnect(); };
  }
  async function startSynth(request) {
    if (!musicRequested || request !== musicRequest || synthRequest === request) return;
    synthRequest = request;
    if (!MusicCtx) { pauseMusic(); toast('Browser ini tidak mendukung musik latar.');return; }
    try {
      audioContext = audioContext || new MusicCtx();
      await audioContext.resume();
      if (request !== musicRequest) return;
      soundOn=true;
      renderSound();
      const melody = [261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,329.63,392,493.88,440,392,329.63,261.63];
      const tick = () => { if (!soundOn) return; playTone(melody[synthStep % melody.length],1.25,.012);if(synthStep%4===0)playTone(130.81,.9,.005);synthStep++; };
      tick();toneInterval = window.setInterval(tick,830);
    } catch {
      if (request === musicRequest) {pauseMusic();toast('Musik tidak bisa diputar di browser ini.');}
    }
  }
  function stopSynth() {
    clearInterval(toneInterval);toneInterval=null;
    activeNodes.forEach(o=>{try{o.stop();}catch{}});activeNodes=[];
  }
  function renderSound() {
    $('#musicToggle').setAttribute('aria-pressed', String(soundOn));
    $('#musicToggle').setAttribute('aria-label', soundOn ? 'Matikan musik latar' : 'Nyalakan musik latar');
    $('#musicLabel').textContent = soundOn ? 'On' : 'Off';
  }
  function playMusic() {
    const request = ++musicRequest;
    musicRequested = true;
    $('#voiceAudio').pause();
    if (safe(cfg.musicFile)) {
      if (!audioFile) {
        audioFile=new Audio(cfg.musicFile);
        audioFile.loop=true;
        audioFile.volume=.32;
        audioFile.addEventListener('playing', () => {
          if (musicRequested && !audioFile.paused) {soundOn=true;renderSound();}
        });
        audioFile.addEventListener('pause', () => {
          if (audioFile.paused && soundOn && synthRequest !== musicRequest) pauseMusic();
        });
      }
      audioFile.onerror=()=>startSynth(request);
      audioFile.play().catch(()=>startSynth(request));
    } else startSynth(request);
  }
  function pauseMusic() {
    musicRequest++;
    musicRequested=false;
    soundOn=false;
    renderSound();
    if(audioFile) audioFile.pause();
    stopSynth();
  }
  $('#musicToggle').addEventListener('click', () => musicRequested ? pauseMusic() : playMusic());

  // Voice note appears only when an actual voice recording exists.
  if (safe(cfg.voiceFile)) {
    const voice = $('#voiceAudio');
    const button = $('#voiceButton');
    voice.preload='metadata';
    voice.src=cfg.voiceFile;
    const showVoice = () => {$('#voiceNote').hidden=false;};
    voice.addEventListener('loadedmetadata', showVoice, {once:true});
    voice.addEventListener('error',()=>{$('#voiceNote').hidden=true;});
    function renderVoice() {
      button.textContent = voice.paused ? '▶' : 'Ⅱ';
      button.setAttribute('aria-label', voice.paused ? 'Putar pesan suara' : 'Jeda pesan suara');
    }
    for (const event of ['play','pause','ended','emptied']) voice.addEventListener(event,renderVoice);
    button.addEventListener('click',async()=>{
      if(voice.paused){pauseMusic();try{await voice.play();}catch(error){if(error.name!=='AbortError')toast('Pesan suara tidak dapat diputar.');}}
      else voice.pause();
    });
  }

  // Do not unexpectedly keep background music alive in another hidden tab.
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) {
      if (musicRequested) pauseMusic();
      $('#voiceAudio').pause();
    }
  });

  // Commit the enhanced layout only after its controls have initialized.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const scenes = [$('#home'), $('#wishSky'), $('#candleScene')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('ambient-paused', !entry.isIntersecting);
      }
    });
    scenes.forEach(scene => observer.observe(scene));
  }
  document.body.classList.add('gift-ready', 'is-locked');
  gate.hidden=false;
})();
