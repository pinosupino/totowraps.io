(() => {
  const phrase = document.querySelector('[data-boot-phrase]');
  if (!phrase) return;
  const regularLogoLayer = document.querySelector('[data-boot-logo-layer="regular"]');
  const bootContent = document.querySelector('.boot-content');

  if (phrase.dataset.bootPhraseReady === 'true') return;
  phrase.dataset.bootPhraseReady = 'true';
  phrase.classList.add('is-loading');

  const LAST_PHRASE_KEY = 'totowrap-last-boot-phrase';
  const PLAYER_NAMES_KEY = 'totowrap-boot-player-names';
  const CRAZY_DAY_KEY = 'totowrap-boot-crazy-day';
  const CHAINED_DAY_KEY = 'totowrap-boot-chained-day';
  const STEAL_DAY_KEY = 'totowrap-boot-steal-day';
  const STEAL_LOGO_URL = 'imgs/totowrap-steal-the-day.png';
  const CHAINED_LOGO_URL = 'imgs/totowrap-chained-together.png';
  const SPECIAL_IMAGE_URL = 'imgs/whats-up-beautiful-ladies.png';
  // Independent 10% chance on each loading-screen opening, per browser session.
  // No visit counter or IP tracking is needed.
  const specialImageOpening = Math.random() < 0.1;
  let specialImageVisible = false;
  function showSpecialImageLoader() {
    if (!specialImageOpening || isChainedDayCached() || isStealDayCached() || !loaderIsActive() || !bootContent) return false;
    const picture = new Image();
    picture.src = SPECIAL_IMAGE_URL;
    picture.alt = 'WHAT’S UP BEAUTIFUL LADIEEEEEES!';
    picture.style.cssText = 'display:block;max-width:min(88vw,640px);max-height:76vh;width:auto;height:auto;object-fit:contain;';
    picture.onload = () => {
      if (!loaderIsActive() || specialImageVisible || isChainedDayCached() || isStealDayCached()) return;
      specialImageVisible = true;
      stopPhraseRotation();
      const stage = bootContent.querySelector('.boot-logo-stage');
      if (stage) stage.style.visibility = 'hidden';
      phrase.style.visibility = 'hidden';
      const crazy = bootContent.querySelector('[data-boot-crazy-day]');
      if (crazy) crazy.style.visibility = 'hidden';
      const container = document.createElement('div');
      container.className = 'boot-special-image';
      container.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;pointer-events:none;';
      container.appendChild(picture);
      bootContent.appendChild(container);
    };
    picture.onerror = () => { /* Missing image: retain the regular loading screen. */ };
    return true;
  }

  const PHRASE_VISIBLE_MS = 5000;
  const PHRASE_FADE_MS = 650;
  const PHRASE_CLEAN_MS = 500;
  let phraseTimer = null;
  let lastChoiceIndex = getLastPhraseIndex();
  let isFirstPhrase = true;
  const nameTag = name => `<span class="boot-player-name">${escapeHTML(name)}</span>`;
  const leadWithNameTag = (lead, name) => `<span class="boot-player-name">${escapeHTML(lead)} ${escapeHTML(name)}</span>`;
  // ============================================================
  // LOADER PHRASES
  // Edit the text in this section to customise the loading screen.
  // ============================================================

  const FIXED_BOOT_PHRASES = [
    '99% of players stop playing before winning. Keep gambling!',
    'TotoWrap is love, TotoWrap is life.',
    'La ludopatia è un problema solo se perdi!',
    'You miss 100% of the bets you don’t place.',
    '<span class="boot-phrase-right">"Questa <u>non</u> è una dittatura!"</span>',
    'I love the smell of TotoWrap in the morning',
    'Che vita sprecata...',
    'Mancano 2 setup',
    'La Federazione ti vuole bene',
    'La Federazione ti dà il benvenuto',
    'La Federazione è magnanima',
    'Come ogni giorno, Federica ha vinto anche oggi.',
    'Chi è Matilde?',
    "Dov’è Matilde?"
  ];

  const PLAYER_BOOT_PHRASES = [
    name => `Dude, let's focus. There's no way ${nameTag(name)} is better than you!`,
    name => `Bet responsibly. Unless you’re ${nameTag(name)}, then just don’t bet.`,
    name => `Today’s forecast: 100% chance of ${nameTag(name)} forgetting to bet.`,
    name => `${nameTag(name)} continua così, il tuo talento è nascosto benissimo.`,
    name => `${leadWithNameTag('Anche oggi', name)} vince domani.`
  ];

  const phrases = [
    ...FIXED_BOOT_PHRASES.map(text => () => text),

    ...PLAYER_BOOT_PHRASES.map(makePhrase => () => {
      const storedNames = getPlayerNames();
      const name = storedNames[randomInt(storedNames.length)];
      return name ? makePhrase(name) : '';
    })
  ];

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);
  }

  function getPlayerNames() {
    try {
      const names = JSON.parse(localStorage.getItem(PLAYER_NAMES_KEY) || '[]');
      return Array.isArray(names) ? names.map(name => String(name || '').trim()).filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function getLastPhraseIndex() {
    try {
      const raw = localStorage.getItem(LAST_PHRASE_KEY);
      if (raw === null) return -1;

      const index = Number(raw);
      return Number.isInteger(index) && index >= 0 && index < phrases.length
        ? index
        : -1;
    } catch (_) {
      return -1;
    }
  }

  function getCachedCrazyDay() {
    try {
      const cached = JSON.parse(localStorage.getItem(CRAZY_DAY_KEY) || 'null');
      return cached && typeof cached === 'object' ? cached : null;
    } catch (_) {
      return null;
    }
  }

  function storePhraseIndex(index) {
    try {
      localStorage.setItem(LAST_PHRASE_KEY, String(index));
    } catch (_) {}
  }

  function randomInt(max) {
    if (!Number.isFinite(max) || max <= 0) return 0;
    if (globalThis.crypto?.getRandomValues) {
      const maxUint = 0x100000000;
      const limit = maxUint - (maxUint % max);
      const value = new Uint32Array(1);
      do {
        globalThis.crypto.getRandomValues(value);
      } while (value[0] >= limit);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function loaderIsActive() {
    const loader = document.getElementById('boot-loader');
    return Boolean(loader && !loader.classList.contains('done'));
  }

  function isChainedDayCached() {
    try { return localStorage.getItem(CHAINED_DAY_KEY) === 'true'; }
    catch (_) { return false; }
  }

  function isStealDayCached() {
    try { return localStorage.getItem(STEAL_DAY_KEY) === 'true'; }
    catch (_) { return false; }
  }

  function showStealDayLoader() {
    if (!loaderIsActive() || !bootContent) return;
    stopPhraseRotation();
    regularLogoLayer?.classList.remove('is-visible');
    const stage = bootContent.querySelector('.boot-logo-stage');
    if (stage) stage.style.visibility = 'hidden';
    phrase.style.visibility = 'hidden';
    const crazy = bootContent.querySelector('[data-boot-crazy-day]');
    if (crazy) crazy.style.visibility = 'hidden';
    const chained = bootContent.querySelector('[data-boot-chained-day]');
    if (chained) chained.style.visibility = 'hidden';
    const special = bootContent.querySelector('.boot-special-image');
    if (special) special.style.visibility = 'hidden';
    let steal = bootContent.querySelector('[data-boot-steal-day]');
    if (!steal) {
      steal = document.createElement('div');
      steal.setAttribute('data-boot-steal-day', '');
      steal.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;pointer-events:none;';
      const img = document.createElement('img');
      img.src = STEAL_LOGO_URL;
      img.alt = 'TotoWrap Upgraded - Steal the Day';
      img.style.cssText = 'display:block;width:auto;height:auto;max-width:min(88vw,800px);max-height:76vh;object-fit:contain;';
      img.onerror = () => {
        steal.remove();
        if (stage) stage.style.visibility = '';
        phrase.style.visibility = '';
        regularLogoLayer?.classList.add('is-visible');
        if (!phraseTimer) showNextPhrase();
      };
      steal.appendChild(img);
      bootContent.appendChild(steal);
    }
    steal.style.visibility = 'visible';
  }

  function showChainedDayLoader() {
    if (!loaderIsActive() || !bootContent) return;
    stopPhraseRotation();
    regularLogoLayer?.classList.remove('is-visible');
    phrase.style.visibility = 'hidden';
    const crazy = bootContent.querySelector('[data-boot-crazy-day]');
    if (crazy) crazy.style.visibility = 'hidden';
    const special = bootContent.querySelector('.boot-special-image');
    if (special) special.style.visibility = 'hidden';
    const steal = bootContent.querySelector('[data-boot-steal-day]');
    if (steal) steal.style.visibility = 'hidden';
    let chained = bootContent.querySelector('[data-boot-chained-day]');
    if (!chained) {
      chained = document.createElement('div');
      chained.setAttribute('data-boot-chained-day', '');
      chained.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;pointer-events:none;';
      const image = document.createElement('img');
      image.src = CHAINED_LOGO_URL;
      image.alt = 'TotoWrap Upgraded - Chained Together';
      image.style.cssText = 'display:block;width:auto;height:auto;max-width:min(88vw,800px);max-height:76vh;object-fit:contain;';
      image.onerror = () => {
        chained.remove();
        phrase.style.visibility = '';
        if (!bootContent.classList.contains('is-crazy-day')) {
          regularLogoLayer?.classList.add('is-visible');
          if (!phraseTimer) showNextPhrase();
        }
      };
      chained.appendChild(image);
      bootContent.appendChild(chained);
    }
    chained.style.visibility = 'visible';
  }

  function showCrazyDayLoader(detail={}) {
    if (specialImageVisible || isChainedDayCached()) return;
    if (!loaderIsActive() || !bootContent) return;
    stopPhraseRotation();
    regularLogoLayer?.classList.remove('is-visible');
    phrase.classList.remove('is-ready', 'is-exiting');
    phrase.classList.add('is-loading');
    phrase.innerHTML = '';
    let crazy = bootContent.querySelector('[data-boot-crazy-day]');
    if (!crazy) {
      crazy = document.createElement('div');
      crazy.className = 'boot-crazy-day';
      crazy.setAttribute('data-boot-crazy-day', '');
      bootContent.appendChild(crazy);
    }
    const regular = detail.regular || '+0 points';
    const perfect = detail.perfect || '+0 points';
    const penalty = normalizePenaltyText(detail.penalty || '0 points');
    crazy.innerHTML = `
      <div class="boot-crazy-title" aria-label="Crazy Day">
        <span style="--i:0;--wave-color:#5bc8f5">C</span><span style="--i:1;--wave-color:#6dd87a">r</span><span style="--i:2;--wave-color:#e06c6c">a</span><span style="--i:3;--wave-color:#a374f7">z</span><span style="--i:4;--wave-color:#f07dba">y</span><span class="space" style="--i:5"></span><span style="--i:6;--wave-color:#a374f7">D</span><span style="--i:7;--wave-color:#fb8c5f">a</span><span style="--i:8;--wave-color:#40e4e4">y</span>
      </div>
      <div class="boot-crazy-logo-wrap" aria-hidden="true">
        <img class="boot-crazy-logo" src="imgs/crazylogo.png" alt="">
      </div>
      <div class="boot-crazy-rules">
        ${renderCrazyRule('Regular winner', regular)}
        ${renderCrazyRule('Perfect wrap', perfect)}
        ${renderCrazyRule('No bet', penalty)}
        ${renderCrazyRule('Closest bets', penalty)}
      </div>
    `;
    bootContent.classList.add('is-crazy-day');
    requestAnimationFrame(() => {
      if (!loaderIsActive()) return;
      crazy.classList.add('is-visible');
    });
  }

  function renderCrazyRule(label, value) {
    const points = splitPointText(value);
    return `
      <div class="boot-crazy-rule-label">${escapeHTML(label)}</div>
      <div class="boot-crazy-rule-points"><span class="boot-crazy-rule-sign">${escapeHTML(points.sign)}</span><span class="boot-crazy-rule-number">${escapeHTML(points.number)}</span><span class="boot-crazy-rule-word">${escapeHTML(points.word)}</span></div>
    `;
  }

  function splitPointText(value) {
    const text = String(value || '0 points').trim();
    const match = text.match(/^([+-]?)(\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return { sign: '', number: text, word: '' };
    return {
      sign: match[1] || '',
      number: match[2] || '0',
      word: match[3] || ''
    };
  }

  function normalizePenaltyText(value) {
    const points = splitPointText(value);
    const amount = Number(points.number);
    if (!Number.isFinite(amount) || amount === 0) return `0 ${points.word || 'points'}`.trim();
    return `-${Math.abs(amount)} ${points.word || 'points'}`.trim();
  }

  function showRegularLoader() {
    if (specialImageVisible) return;
    if (!loaderIsActive() || !bootContent) return;
    const chained = bootContent.querySelector('[data-boot-chained-day]');
    if (chained) { chained.remove(); phrase.style.visibility = ''; }
    const steal = bootContent.querySelector('[data-boot-steal-day]');
    if (steal) { steal.remove(); phrase.style.visibility = ''; }
    const stage = bootContent.querySelector('.boot-logo-stage');
    if (stage) stage.style.visibility = '';
    if (!bootContent.classList.contains('is-crazy-day')) {
      regularLogoLayer?.classList.add('is-visible');
      if (!phraseTimer) showNextPhrase();
      return;
    }
    const crazy = bootContent.querySelector('[data-boot-crazy-day]');
    crazy?.classList.remove('is-visible');
    bootContent.classList.remove('is-crazy-day');
    regularLogoLayer?.classList.add('is-visible');
    if (!phraseTimer) showNextPhrase();
  }

  function choosePhrase() {
    const available = phrases
      .map((render, index) => ({ index, text: render() }))
      .filter(item => item.text);
    const next = available.filter(item => item.index !== lastChoiceIndex);
    const choices = next.length ? next : available;
    return choices[randomInt(choices.length)] || available[0] || null;
  }

  function showLogoForPhrase() {
    regularLogoLayer?.classList.add('is-visible');
  }

  function showNextPhrase() {
    if (!loaderIsActive()) return;
    const choice = choosePhrase();
    if (!choice) return;

    lastChoiceIndex = choice.index;
    storePhraseIndex(choice.index);
    showLogoForPhrase(choice.text, isFirstPhrase);
    isFirstPhrase = false;
    phrase.innerHTML = `<span class="boot-phrase-text">${choice.text}</span>`;
    phrase.classList.remove('is-loading', 'is-ready', 'is-exiting');

    requestAnimationFrame(() => {
      if (!loaderIsActive()) return;
      phrase.classList.add('is-ready');
    });

    phraseTimer = setTimeout(() => {
      if (!loaderIsActive()) return;
      phrase.classList.add('is-exiting');
      phrase.classList.remove('is-ready');
      phraseTimer = setTimeout(() => {
        if (!loaderIsActive()) return;
        phrase.innerHTML = '';
        phrase.classList.remove('is-exiting');
        phrase.classList.add('is-loading');
        phraseTimer = setTimeout(showNextPhrase, PHRASE_CLEAN_MS);
      }, PHRASE_FADE_MS);
    }, PHRASE_VISIBLE_MS);
  }

  function stopPhraseRotation() {
    if (phraseTimer) clearTimeout(phraseTimer);
    phraseTimer = null;
  }

  const loader = document.getElementById('boot-loader');
  if (loader) {
    new MutationObserver(() => {
      if (!loaderIsActive()) stopPhraseRotation();
    }).observe(loader, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('totowrap:chained-day-loader', showChainedDayLoader);
  document.addEventListener('totowrap:steal-day-loader', showStealDayLoader);
  document.addEventListener('totowrap:crazy-day-loader', event => {
    showCrazyDayLoader(event.detail || {});
  });
  document.addEventListener('totowrap:regular-loader', showRegularLoader);

  const cachedCrazyDay = getCachedCrazyDay();
  if (isChainedDayCached()) showChainedDayLoader();
  else if (isStealDayCached()) showStealDayLoader();
  else if (cachedCrazyDay) showCrazyDayLoader(cachedCrazyDay);
  else { showNextPhrase(); showSpecialImageLoader(); }
})();
