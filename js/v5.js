/* V5: elegant Arabic opening + optional 3-key discovery. No network or personal data transmission. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const cfg = window.GIFT_CONFIG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = $('#nameIntro');
  const introName = $('#nameIntroArabic');
  const gate = $('#gate');
  const hud = $('#keyHud');
  const toggle = $('#keyHudToggle');
  const panel = $('#keyHudPanel');
  const vault = $('#vaultCard');
  const vaultBox = $('#vaultBox');
  const keyDefs = [
    {id:'memory',spot:$('#keySpotMemory'),btn:$('#keyMemory'),label:$('#keyLabelMemory'),jump:'#story'},
    {id:'prayer',spot:$('#keySpotPrayer'),btn:$('#keyPrayer'),label:$('#keyLabelPrayer'),jump:'#sky'},
    {id:'hope',spot:$('#keySpotHope'),btn:$('#keyHope'),label:$('#keyLabelHope'),jump:'#future'}
  ];
  if (!document.body.classList.contains('gift-ready') || !intro || !gate || !hud || keyDefs.some(k=>!k.spot || !k.btn)) return;
  introName.textContent = typeof cfg.recipientArabicName === 'string' && cfg.recipientArabicName.trim()
    ? cfg.recipientArabicName : 'نعمة بدرية الصالحة';
  const vaultArabic = $('.vault__arabic');
  vaultArabic.textContent = introName.textContent;
  $('.vault__signature').textContent = `dari ${cfg.senderName || 'aku'}, dengan doa yang baik. ♡`;
  const collected = new Set();
  let introTimers=[];
  let unlockTimer=0;
  let isUnlocking=false;
  function stopIntroTimers(){introTimers.forEach(clearTimeout);introTimers=[];}
  function introLater(fn,delay){introTimers.push(setTimeout(fn,delay));}
  function endIntro(){
    if (intro.hidden || intro.classList.contains('is-exiting')) return;
    stopIntroTimers();
    intro.classList.add('is-exiting');
    const duration=reduce?40:950;
    introLater(()=>{
      intro.hidden=true;
      intro.classList.remove('is-playing','is-exiting');
      gate.inert=false;
      $('#envelope').focus({preventScroll:true});
    },duration);
  }
  function startIntro(){
    stopIntroTimers();
    intro.className='name-intro';
    intro.hidden=false;
    gate.inert=true;
    $('main').inert=true;
    $('#siteHeader').inert=true;
    $('#nameIntroSkip').focus({preventScroll:true});
    void intro.offsetWidth;
    intro.classList.add('is-playing');
    introLater(endIntro, reduce ? 4800 : 6800);
  }
  $('#nameIntroSkip').addEventListener('click', endIntro);
  const memoryKey = $('#keyMemory');
  const keyObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) showKeyProgress();
      }, {threshold: 0.35})
    : null;
  function showKeyProgress(){
    if ($('main').inert) return;
    hud.hidden = false;
    keyObserver?.disconnect();
  }
  memoryKey.addEventListener('focus', showKeyProgress);
  document.addEventListener('gift:gate-opened',()=>{
    $('main').inert=false;
    $('#siteHeader').inert=false;
    keyObserver?.observe(memoryKey);
    $('.brand').focus({preventScroll:true});
  });
  let panelOpener = toggle;
  function setPanel(open, opener = toggle){
    panel.hidden=!open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      panelOpener = opener;
      $('#keyHudClose').focus({preventScroll:true});
    }
  }
  function dismissPanel() {
    setPanel(false);
    panelOpener.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>setPanel(panel.hidden));
  $('#keyHudClose').addEventListener('click',dismissPanel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden) dismissPanel();});
  document.addEventListener('pointerdown',e=>{if(!panel.hidden && !hud.contains(e.target))setPanel(false);});
  document.addEventListener('focusin',e=>{if(!panel.hidden && !hud.contains(e.target))setPanel(false);});
  function toSection(selector){
    const el=$(selector);if(!el)return;
    setPanel(false);
    const heading = el.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
    window.chapterScroll.toElement(el);
  }
  $$('[data-jump-key]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.jumpKey;
    toSection(keyDefs.find(k=>k.id===id)?.jump || '#story');
  }));
  $('#vaultShortcut').addEventListener('click',event=>{showKeyProgress();setPanel(true,event.currentTarget);});
  $('#keyHudUnlock').addEventListener('click',()=>toSection('#vault'));
  const keySVG='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="15.6" cy="8" r="4.2"></circle><path d="M12.6 11.3 3 21v-4h3v-3h3l3.6-3.7"></path></svg>';
  // Use vector keys: no emoji-platform mismatch, crisp on Android.
  $$('.key-pickup__symbol').forEach(el=>el.innerHTML=keySVG);
  function markCollected(def){
    def.btn.disabled=true;
    def.btn.setAttribute('aria-label',`${def.id} sudah ditemukan`);
    def.spot.classList.add('is-collected');
    def.btn.querySelector('span:nth-child(3)').textContent='Kunci tersimpan ✓';
    def.label.textContent='Ditemukan ✓';
    const slot=$(`[data-key-slot="${def.id}"]`);
    slot.textContent='✦';slot.classList.add('is-found');
  }
  function updateProgress(){
    const count=collected.size;
    $('#keyHudCount').textContent=`${count}/3`;
    $('#vaultStatus').textContent=`${count} DARI 3 KUNCI DITEMUKAN`;
    toggle.classList.remove('is-pulsing');void toggle.offsetWidth;toggle.classList.add('is-pulsing');
    if(count===3){
      vault.classList.add('is-ready');
      vaultBox.disabled=false;
      vaultBox.setAttribute('aria-label','Buka rahasia tiga kunci');
      $('#vaultInstruction').textContent='Ketiganya sudah terkumpul. Ketuk peti surat untuk membuka rahasia kecil ini. ✦';
      $('#keyHudUnlock').hidden=false;
    }
  }
  keyDefs.forEach(def=>{
    def.btn.addEventListener('click',()=>{
      if(collected.has(def.id))return;
      collected.add(def.id);
      showKeyProgress();
      markCollected(def);
      updateProgress();
    });
  });
  document.addEventListener('gift:sky-complete',()=>{
    if(!collected.has('prayer')) keyDefs[1].spot.hidden=false;
  });
  document.addEventListener('gift:future-progress',ev=>{
    if(ev.detail?.count>=ev.detail?.total && !collected.has('hope'))keyDefs[2].spot.hidden=false;
  });
  vaultBox.addEventListener('click',()=>{
    if(collected.size!==3||isUnlocking||vault.classList.contains('is-opened'))return;
    isUnlocking=true;
    vaultBox.disabled=true;
    vault.classList.add('is-unlocking');
    $('#vaultInstruction').textContent='Tiga kunci membuka sesuatu yang kusimpan untukmu...';
    unlockTimer=setTimeout(()=>{
      vault.classList.remove('is-unlocking');vault.classList.add('is-opened');
      $('#vaultReveal').hidden=false;
      const heading = $('#vaultReveal h3');
      heading.tabIndex = -1;
      heading.focus();
      $('#vaultStatus').textContent='RAHASIA TERBUKA ✦';
      $('#vaultInstruction').textContent='Rahasia kecil ini sekarang milikmu. ♡';
      isUnlocking=false;
    },reduce?50:2300);
  });
  function resetV5(){
    clearTimeout(unlockTimer);isUnlocking=false;
    keyObserver?.disconnect();
    collected.clear();setPanel(false);hud.hidden=true;
    keyDefs.forEach((def,i)=>{
      def.spot.hidden = i!==0;
      def.spot.classList.remove('is-collected');
      def.btn.disabled=false;
      def.btn.setAttribute('aria-label',`Ambil kunci ${def.id}`);
      def.btn.querySelector('span:nth-child(3)').textContent = ['Temukan kunci kenangan','Ambil kunci doa','Ambil kunci harapan'][i];
      def.label.textContent='Belum ditemukan';
      const slot=$(`[data-key-slot="${def.id}"]`);slot.textContent='◇';slot.classList.remove('is-found');
    });
    $('#keyHudCount').textContent='0/3';
    $('#vaultStatus').textContent='0 DARI 3 KUNCI DITEMUKAN';
    $('#vaultReveal').hidden=true;
    $('#vaultInstruction').textContent='Cari tiga kunci tersembunyi di sepanjang cerita. Kado ulang tahun utama tetap bisa dibuka kapan saja.';
    vault.classList.remove('is-ready','is-unlocking','is-opened');
    vaultBox.disabled=true;
    vaultBox.setAttribute('aria-label','Kumpulkan tiga kunci untuk membuka rahasia');
    $('#keyHudUnlock').hidden=true;
    startIntro();
  }
  document.addEventListener('gift:full-replay',resetV5);
  startIntro();
})();
