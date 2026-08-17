// =========================================================
// BrightSteps International School — Site scripts
// =========================================================

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- School Life dropdown (click and tap support) ---------- */
document.querySelectorAll('.nav-dropdown > button').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.toggle('open');
    document.querySelectorAll('.nav-dropdown-menu.open').forEach((otherMenu) => {
      if (otherMenu !== menu) otherMenu.classList.remove('open');
    });
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown-menu.open').forEach((menu) => {
    menu.classList.remove('open');
  });
});

/* ---------- Scroll reveal ---------- */
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  revealItems.forEach((item) => item.classList.add('js-hidden'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealItems.forEach((item) => observer.observe(item));
}
/* If IntersectionObserver is unavailable, elements simply stay visible
   since js-hidden is never added. Content is never dependent on JS
   to be seen. */

/* ---------- Add another child ---------- */
const childrenContainer = document.getElementById('childrenContainer');
const addChildBtn = document.getElementById('addChildBtn');
let childCount = 1;
const isFrench = document.documentElement.lang === 'fr';
const childLabel = isFrench ? 'Enfant' : 'Child';
const removeLabel = isFrench ? 'Supprimer' : 'Remove';

addChildBtn?.addEventListener('click', () => {
  childCount += 1;
  const firstBlock = childrenContainer.querySelector('.child-block');
  const newBlock = firstBlock.cloneNode(true);

  // Every id/name/for in the cloned block still says "_1" at this point,
  // which would create duplicate ids and mis-linked labels/errors once
  // appended. Renumber everything to the new child index before it
  // touches the document.
  const legend = newBlock.querySelector('.child-block-label');
  legend.id = `childLabel_${childCount}`;
  legend.textContent = `${childLabel} ${childCount}`;

  // Drop any error text/state cloned from the template block.
  newBlock.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
  });

  newBlock.querySelectorAll('input, select').forEach((el) => {
    el.value = '';
    el.removeAttribute('aria-invalid');
    const baseName = el.name.replace(/_\d+$/, '');
    const newId = `${baseName}_${childCount}`;
    el.name = newId;
    el.id = newId;
    if (el.hasAttribute('aria-describedby')) {
      el.setAttribute('aria-describedby', `${newId}-error`);
    }
  });

  newBlock.querySelectorAll('label').forEach((label) => {
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const baseFor = forAttr.replace(/_\d+$/, '');
      label.setAttribute('for', `${baseFor}_${childCount}`);
    }
  });

  newBlock.querySelectorAll('.field-error').forEach((el) => {
    const baseId = el.id.replace(/_\d+-error$/, '');
    el.id = `${baseId}_${childCount}-error`;
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'child-block-remove';
  removeBtn.textContent = removeLabel;
  removeBtn.setAttribute('aria-label', `${removeLabel} — ${childLabel} ${childCount}`);
  removeBtn.addEventListener('click', () => newBlock.remove());
  newBlock.appendChild(removeBtn);

  childrenContainer.appendChild(newBlock);
  newBlock.querySelector('input, select')?.focus();
});

/* ---------- Accessible form validation ---------- */
const validationText = {
  required: isFrench ? 'Ce champ est requis.' : 'This field is required.',
  minLength: (n) => (isFrench ? `Veuillez saisir au moins ${n} caractères.` : `Please enter at least ${n} characters.`),
  maxLength: (n) => (isFrench ? `Veuillez saisir au maximum ${n} caractères.` : `Please enter no more than ${n} characters.`),
  email: isFrench ? 'Veuillez saisir une adresse e-mail valide.' : 'Please enter a valid email address.',
  phone: isFrench
    ? 'Veuillez saisir un numéro de téléphone valide (ex. +225 01 23 45 67 89).'
    : 'Please enter a valid phone number (e.g. +225 01 23 45 67 89).',
  select: isFrench ? 'Veuillez sélectionner une option.' : 'Please select an option.',
  dob: isFrench ? 'Veuillez saisir une date de naissance valide.' : 'Please enter a valid date of birth.',
  dobFuture: isFrench ? 'La date de naissance ne peut pas être dans le futur.' : 'Date of birth cannot be in the future.',
  dobRange: isFrench ? 'Veuillez vérifier la date de naissance saisie.' : 'Please double check the date of birth entered.',
  summary: (n) => {
    if (isFrench) return n === 1 ? 'Veuillez corriger 1 champ avant de continuer.' : `Veuillez corriger ${n} champs avant de continuer.`;
    return n === 1 ? 'Please fix 1 field before continuing.' : `Please fix ${n} fields before continuing.`;
  },
};

// Permissive but real: requires a leading + or digit, allows spaces/parens/
// dashes, and checks the underlying digit count lands in a plausible range
// (7-15 digits, per ITU E.164) rather than relying on a country-specific format.
const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,18}[0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(input, message) {
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) errorEl.textContent = message || '';
  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}

function validateRequiredText(input, { min = 2, max = 100 } = {}) {
  const value = input.value.trim();
  input.value = value;
  let message = '';
  if (!value) message = validationText.required;
  else if (value.length < min) message = validationText.minLength(min);
  else if (value.length > max) message = validationText.maxLength(max);
  setFieldError(input, message);
  return !message;
}

function validateEmailField(input) {
  const value = input.value.trim();
  input.value = value;
  let message = '';
  if (!value) message = validationText.required;
  else if (value.length > 254 || !EMAIL_RE.test(value)) message = validationText.email;
  setFieldError(input, message);
  return !message;
}

function validatePhoneField(input, required = true) {
  const value = input.value.trim();
  input.value = value;
  let message = '';
  if (!value) {
    message = required ? validationText.required : '';
  } else {
    const digitCount = value.replace(/[^0-9]/g, '').length;
    if (!PHONE_RE.test(value) || digitCount < 7 || digitCount > 15) message = validationText.phone;
  }
  setFieldError(input, message);
  return !message;
}

function validateSelectField(input) {
  const message = input.value ? '' : validationText.select;
  setFieldError(input, message);
  return !message;
}

function validateDobField(input) {
  const value = input.value;
  let message = '';
  if (value) {
    const dob = new Date(`${value}T00:00:00`);
    const now = new Date();
    if (Number.isNaN(dob.getTime())) message = validationText.dob;
    else if (dob > now) message = validationText.dobFuture;
    else if ((now - dob) / (365.25 * 24 * 3600 * 1000) > 25) message = validationText.dobRange;
  }
  setFieldError(input, message);
  return !message;
}

function validateTextareaField(input, { max = 2000, min = 0, required = false } = {}) {
  const value = input.value.trim();
  input.value = value;
  let message = '';
  if (!value) message = required ? validationText.required : '';
  else if (min && value.length < min) message = validationText.minLength(min);
  else if (value.length > max) message = validationText.maxLength(max);
  setFieldError(input, message);
  return !message;
}

/**
 * Runs every validator in `checks` (each returning true/false), focuses the
 * first invalid field, and shows a summary count in `statusElement`.
 * Returns true only if every check passed.
 */
function runFormValidation(checks, statusElement) {
  const results = checks.map((check) => ({ valid: check.run(), input: check.input }));
  const firstInvalid = results.find((r) => !r.valid);

  if (firstInvalid) {
    if (statusElement) {
      const invalidCount = results.filter((r) => !r.valid).length;
      statusElement.textContent = validationText.summary(invalidCount);
      statusElement.className = 'form-status error';
    }
    firstInvalid.input.focus();
    return false;
  }

  if (statusElement) {
    statusElement.textContent = '';
    statusElement.className = 'form-status';
  }
  return true;
}

/* ---------- Form spam protection: stamp load time for the timing trap ---------- */
const formLoadedAt = Date.now();
document.querySelectorAll('input[name="loaded_at"]').forEach((el) => {
  el.value = String(formLoadedAt);
});

/* ---------- Enrollment form submission ---------- */
const ENROLLMENT_FORM_ENDPOINT = 'https://formspree.io/f/xbgrdaqo';
const MIN_SUBMIT_SECONDS = 3; // submissions faster than this are treated as automated

const form = document.getElementById('enrollForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
let enrollSubmitting = false;

const enrollText = {
  sending: isFrench ? 'Envoi en cours...' : 'Sending...',
  submit: isFrench ? "Envoyer ma demande d'inscription" : 'Send my enrollment inquiry',
  success: isFrench
    ? 'Merci. Nous avons bien reçu votre demande et vous recontacterons prochainement.'
    : 'Thank you. We have received your inquiry and will follow up soon.',
  error: isFrench
    ? "Une erreur s'est produite. Veuillez réessayer, ou contactez-nous directement sur WhatsApp."
    : 'Something went wrong. Please try again, or reach us directly on WhatsApp.',
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (enrollSubmitting) return; // blocks rapid duplicate submissions
  enrollSubmitting = true;

  // Honeypot: a real visitor never fills this field in.
  const honeypot = form.company ? form.company.value.trim() : '';
  // Timing trap: a submission faster than a human could plausibly fill the form.
  const elapsedSeconds = (Date.now() - formLoadedAt) / 1000;

  if (honeypot || elapsedSeconds < MIN_SUBMIT_SECONDS) {
    // Treat as spam: show the normal success state without sending anything,
    // so automated senders get no signal about what was detected.
    form.reset();
    statusEl.textContent = enrollText.success;
    statusEl.classList.add('success');
    enrollSubmitting = false;
    return;
  }

  // Build the validation check list fresh each submit, since children
  // can be added or removed between attempts.
  const checks = [
    { input: form.parentName, run: () => validateRequiredText(form.parentName, { min: 2, max: 100 }) },
    { input: form.parentEmail, run: () => validateEmailField(form.parentEmail) },
    { input: form.parentPhone, run: () => validatePhoneField(form.parentPhone, true) },
  ];

  document.querySelectorAll('#childrenContainer .child-block').forEach((block) => {
    const nameInput = block.querySelector('input[name^="childName"]');
    const dobInput = block.querySelector('input[name^="childDob"]');
    const gradeSelect = block.querySelector('select[name^="gradeLevel"]');
    if (nameInput) checks.push({ input: nameInput, run: () => validateRequiredText(nameInput, { min: 2, max: 100 }) });
    if (dobInput) checks.push({ input: dobInput, run: () => validateDobField(dobInput) });
    if (gradeSelect) checks.push({ input: gradeSelect, run: () => validateSelectField(gradeSelect) });
  });

  if (form.message) {
    checks.push({ input: form.message, run: () => validateTextareaField(form.message, { max: 2000, required: false }) });
  }

  if (!runFormValidation(checks, statusEl)) {
    enrollSubmitting = false;
    return;
  }

  const payload = {
    parent_name: form.parentName.value.trim(),
    parent_email: form.parentEmail.value.trim(),
    parent_phone: form.parentPhone.value.trim(),
    message: form.message.value.trim() || null,
  };

  document.querySelectorAll('#childrenContainer .child-block').forEach((block, idx) => {
    const n = idx + 1;
    const nameInput = block.querySelector('input[name^="childName"]');
    const dobInput = block.querySelector('input[name^="childDob"]');
    const gradeSelect = block.querySelector('select[name^="gradeLevel"]');
    payload[`child_${n}_name`] = nameInput ? nameInput.value.trim() : '';
    payload[`child_${n}_dob`] = dobInput && dobInput.value ? dobInput.value : null;
    payload[`child_${n}_grade`] = gradeSelect ? gradeSelect.value : '';
  });

  submitBtn.disabled = true;
  submitBtn.textContent = enrollText.sending;
  statusEl.textContent = '';
  statusEl.className = 'form-status';

  try {
    const response = await fetch(ENROLLMENT_FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Submission failed.');
    }

    form.reset();
    document.querySelectorAll('#childrenContainer .child-block').forEach((block, idx) => {
      if (idx > 0) block.remove();
    });
    childCount = 1;
    statusEl.textContent = enrollText.success;
    statusEl.classList.add('success');
  } catch (err) {
    statusEl.textContent = enrollText.error;
    statusEl.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = enrollText.submit;
    enrollSubmitting = false;
  }
});

/* ---------- Contact form submission ---------- */
const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/mvkpzbdg';

const contactForm = document.getElementById('contactForm');
const contactStatusEl = document.getElementById('contactFormStatus');
const contactSubmitBtn = document.getElementById('contactSubmitBtn');
let contactSubmitting = false;

const contactText = {
  sending: isFrench ? 'Envoi en cours...' : 'Sending...',
  submit: isFrench ? 'Envoyer le message' : 'Send message',
  success: isFrench
    ? 'Merci. Nous avons bien reçu votre message et vous répondrons prochainement.'
    : 'Thank you. We have received your message and will reply soon.',
  error: isFrench
    ? "Une erreur s'est produite. Veuillez réessayer, ou contactez-nous directement sur WhatsApp."
    : 'Something went wrong. Please try again, or reach us directly on WhatsApp.',
};

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (contactSubmitting) return;
  contactSubmitting = true;

  const honeypot = contactForm.company ? contactForm.company.value.trim() : '';
  const elapsedSeconds = (Date.now() - formLoadedAt) / 1000;

  if (honeypot || elapsedSeconds < MIN_SUBMIT_SECONDS) {
    contactForm.reset();
    contactStatusEl.textContent = contactText.success;
    contactStatusEl.classList.add('success');
    contactSubmitting = false;
    return;
  }

  const contactChecks = [
    { input: contactForm.contactName, run: () => validateRequiredText(contactForm.contactName, { min: 2, max: 100 }) },
    { input: contactForm.contactEmail, run: () => validateEmailField(contactForm.contactEmail) },
    { input: contactForm.contactPhone, run: () => validatePhoneField(contactForm.contactPhone, false) },
    { input: contactForm.contactMessage, run: () => validateTextareaField(contactForm.contactMessage, { min: 5, max: 3000, required: true }) },
  ];

  if (!runFormValidation(contactChecks, contactStatusEl)) {
    contactSubmitting = false;
    return;
  }

  const payload = {
    name: contactForm.contactName.value.trim(),
    email: contactForm.contactEmail.value.trim(),
    phone: contactForm.contactPhone.value.trim() || null,
    message: contactForm.contactMessage.value.trim(),
  };

  contactSubmitBtn.disabled = true;
  contactSubmitBtn.textContent = contactText.sending;
  contactStatusEl.textContent = '';
  contactStatusEl.className = 'form-status';

  try {
    const response = await fetch(CONTACT_FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Submission failed.');
    }

    contactForm.reset();
    contactStatusEl.textContent = contactText.success;
    contactStatusEl.classList.add('success');
  } catch (err) {
    contactStatusEl.textContent = contactText.error;
    contactStatusEl.classList.add('error');
  } finally {
    contactSubmitBtn.disabled = false;
    contactSubmitBtn.textContent = contactText.submit;
    contactSubmitting = false;
  }
});

/* ---------- Hero photo slideshow ---------- */
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
const heroPrev = document.getElementById('heroPrev');
const heroNext = document.getElementById('heroNext');
const heroPlayPause = document.getElementById('heroPlayPause');
const heroBanner = document.getElementById('heroBanner');
let heroIndex = 0;
let heroTimer;
let heroPaused = false;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsImageSet = window.CSS && CSS.supports && CSS.supports('background-image', 'image-set(url(a.jpg) type("image/jpeg"))');

const heroText = {
  pause: isFrench ? 'Mettre le diaporama en pause' : 'Pause slideshow',
  play: isFrench ? 'Reprendre le diaporama' : 'Resume slideshow',
};

// Stage in the AVIF/WebP/JPEG background for every slide beyond the first
// (which is already painted via its plain, dependency-free inline style)
// once the page is idle, rather than downloading all five full-size images
// up front.
function loadHeroBackground(slide) {
  const jpg = slide.dataset.bgJpg;
  if (!jpg) return; // already loaded (or is the eager first slide)
  if (supportsImageSet) {
    const avif = slide.dataset.bgAvif;
    const webp = slide.dataset.bgWebp;
    slide.style.backgroundImage =
      `image-set(url('${avif}') type('image/avif'), url('${webp}') type('image/webp'), url('${jpg}') type('image/jpeg'))`;
  } else {
    slide.style.backgroundImage = `url('${jpg}')`;
  }
  delete slide.dataset.bgJpg;
  delete slide.dataset.bgWebp;
  delete slide.dataset.bgAvif;
}

function loadRemainingHeroBackgrounds() {
  heroSlides.forEach(loadHeroBackground);
}

if (heroSlides.length) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadRemainingHeroBackgrounds, { timeout: 2000 });
  } else {
    setTimeout(loadRemainingHeroBackgrounds, 500);
  }
}

function showHeroSlide(i) {
  if (!heroSlides.length) return;
  heroIndex = (i + heroSlides.length) % heroSlides.length;
  loadHeroBackground(heroSlides[heroIndex]); // ensure the incoming slide is ready even if idle callback hasn't run yet
  heroSlides.forEach((slide, idx) => slide.classList.toggle('active', idx === heroIndex));
  heroDots.forEach((dot, idx) => dot.classList.toggle('active', idx === heroIndex));
}

function startHeroTimer() {
  clearInterval(heroTimer);
  if (prefersReducedMotion || heroPaused) return;
  if (document.hidden) return; // don't run a timer while the tab isn't visible
  heroTimer = setInterval(() => showHeroSlide(heroIndex + 1), 5000);
}

function stopHeroTimer() {
  clearInterval(heroTimer);
}

heroDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    showHeroSlide(parseInt(dot.dataset.slide, 10));
    startHeroTimer();
  });
});

heroPrev?.addEventListener('click', () => {
  showHeroSlide(heroIndex - 1);
  startHeroTimer();
});

heroNext?.addEventListener('click', () => {
  showHeroSlide(heroIndex + 1);
  startHeroTimer();
});

heroPlayPause?.addEventListener('click', () => {
  heroPaused = !heroPaused;
  heroPlayPause.setAttribute('aria-pressed', String(heroPaused));
  heroPlayPause.setAttribute('aria-label', heroPaused ? heroText.play : heroText.pause);
  heroPlayPause.innerHTML = heroPaused ? '&#9654;' : '&#10074;&#10074;';
  if (heroPaused) {
    stopHeroTimer();
  } else {
    startHeroTimer();
  }
});

// Pause the timer while the tab is hidden, resume (respecting the user's own
// pause choice and reduced-motion preference) when it becomes visible again.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHeroTimer();
  } else {
    startHeroTimer();
  }
});

if (heroSlides.length) {
  if (prefersReducedMotion) {
    // Respect the user's OS-level preference: no automatic motion at all.
    // Manual controls (arrows, dots, play/pause) still work normally.
    heroPaused = true;
    if (heroPlayPause) {
      heroPlayPause.setAttribute('aria-pressed', 'true');
      heroPlayPause.setAttribute('aria-label', heroText.play);
      heroPlayPause.innerHTML = '&#9654;';
    }
  } else {
    startHeroTimer();
  }
}

/* ---------- News & Events filter ---------- */
const lifeFilterBtns = document.querySelectorAll('.life-filter-btn');
const lifeCards = document.querySelectorAll('.life-card[data-category]');

lifeFilterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    lifeFilterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    lifeCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? '' : 'none';
    });
  });
});

/* ---------- "Important Dates" — August/September highlights ---------- */
const calDatesBlockEl = document.getElementById('calDatesBlock');

if (calDatesBlockEl) {
  const calLang = calDatesBlockEl.dataset.lang === 'fr' ? 'fr' : 'en';

  // Source: BrightSteps Academic Calendar 2026-2027 (school-provided PDF).
  // type drives the card's color accent: pd (staff/no students), holiday, break.
  const CAL_EVENTS = [
    { start: '2026-08-17', end: '2026-08-25', type: 'pd', en: 'Faculty Orientation', fr: 'Orientation du personnel' },
    { start: '2026-08-26', end: '2026-08-26', type: 'holiday', en: "Prophet's Birthday", fr: 'Anniversaire du Prophète' },
    { start: '2026-08-27', end: '2026-08-27', type: 'pd', en: 'First Day of School', fr: 'Rentrée scolaire' },
    { start: '2026-10-19', end: '2026-10-23', type: 'break', en: 'October Break', fr: "Vacances d'octobre" },
    { start: '2026-11-01', end: '2026-11-01', type: 'holiday', en: "All Saints' Day", fr: 'Toussaint' },
    { start: '2026-11-15', end: '2026-11-15', type: 'holiday', en: 'Peace Day', fr: 'Journée de la paix' },
    { start: '2026-11-16', end: '2026-11-16', type: 'holiday', en: 'School Holiday', fr: 'Jour férié scolaire' },
    { start: '2026-11-26', end: '2026-11-27', type: 'break', en: 'Thanksgiving Break', fr: 'Vacances de Thanksgiving' },
    { start: '2026-12-16', end: '2027-01-08', type: 'break', en: 'December Break', fr: 'Vacances de décembre' },
    { start: '2026-12-25', end: '2026-12-25', type: 'holiday', en: 'Christmas Day', fr: 'Noël' },
    { start: '2027-01-01', end: '2027-01-01', type: 'holiday', en: "New Year's Day", fr: 'Jour de l\u2019An' },
    { start: '2027-01-11', end: '2027-01-11', type: 'pd', en: 'Resume School', fr: 'Reprise des cours' },
    { start: '2027-02-18', end: '2027-02-19', type: 'break', en: 'February Break', fr: 'Vacances de février' },
    { start: '2027-03-06', end: '2027-03-06', type: 'holiday', en: 'Laylat al-Qadr (TBD)', fr: 'Nuit du Destin (à confirmer)' },
    { start: '2027-03-09', end: '2027-03-09', type: 'holiday', en: 'Eid al-Fitr (TBD)', fr: 'Aïd el-Fitr (à confirmer)' },
    { start: '2027-03-22', end: '2027-03-26', type: 'break', en: 'Spring Break', fr: 'Vacances de printemps' },
    { start: '2027-03-28', end: '2027-03-28', type: 'holiday', en: 'Easter', fr: 'Pâques' },
    { start: '2027-03-29', end: '2027-03-29', type: 'holiday', en: 'Easter Monday', fr: 'Lundi de Pâques' },
    { start: '2027-04-05', end: '2027-04-05', type: 'pd', en: 'School Resumes', fr: 'Reprise des cours' },
    { start: '2027-05-01', end: '2027-05-01', type: 'holiday', en: 'Labor Day', fr: 'Fête du Travail' },
    { start: '2027-05-06', end: '2027-05-06', type: 'holiday', en: 'Ascension', fr: 'Ascension' },
    { start: '2027-05-17', end: '2027-05-17', type: 'holiday', en: 'Pentecost Monday', fr: 'Lundi de Pentecôte' },
    { start: '2027-06-08', end: '2027-06-08', type: 'pd', en: 'Last Day of School', fr: "Dernier jour d'école" },
  ];

  // Only show August and September 2026 for now.
  const WINDOW_START = '2026-08-01';
  const WINDOW_END = '2026-09-30';
  const visibleEvents = CAL_EVENTS.filter((ev) => ev.start <= WINDOW_END && ev.end >= WINDOW_START);

  const TYPE_LABEL = {
    pd: { en: 'No Students', fr: 'Pas de cours' },
    holiday: { en: 'Holiday', fr: 'Jour férié' },
    break: { en: 'School Break', fr: 'Congé scolaire' },
  };

  const MONTH_ABBR = {
    en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    fr: ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'],
  };

  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function badgeParts(ev) {
    const start = parseISO(ev.start);
    const end = parseISO(ev.end);
    const month = MONTH_ABBR[calLang][start.getMonth()];
    if (ev.start === ev.end) {
      return { day: String(start.getDate()), month };
    }
    if (start.getMonth() === end.getMonth()) {
      return { day: `${start.getDate()}\u2013${end.getDate()}`, month };
    }
    return { day: String(start.getDate()), month };
  }

  const calDatesList = document.getElementById('calDatesList');
  if (calDatesList) {
    if (!visibleEvents.length) {
      calDatesList.innerHTML = '';
    }
    visibleEvents.forEach((ev) => {
      const { day, month } = badgeParts(ev);
      const li = document.createElement('li');
      li.className = `date-card date-card-${ev.type}`;

      const badge = document.createElement('div');
      badge.className = 'date-badge';
      const dayEl = document.createElement('span');
      dayEl.className = 'date-day';
      dayEl.textContent = day;
      const monthEl = document.createElement('span');
      monthEl.className = 'date-month';
      monthEl.textContent = month;
      badge.appendChild(dayEl);
      badge.appendChild(monthEl);

      const info = document.createElement('div');
      info.className = 'date-info';
      const tag = document.createElement('span');
      tag.className = `date-tag date-tag-${ev.type}`;
      tag.textContent = TYPE_LABEL[ev.type][calLang];
      const title = document.createElement('h3');
      title.textContent = calLang === 'fr' ? ev.fr : ev.en;
      info.appendChild(tag);
      info.appendChild(title);

      li.appendChild(badge);
      li.appendChild(info);
      calDatesList.appendChild(li);
    });
  }
}

/* ---------- Privacy-enhanced YouTube embed (click to load) ---------- */
const videoPosterBtn = document.getElementById('videoPosterBtn');
videoPosterBtn?.addEventListener('click', () => {
  const wrap = videoPosterBtn.closest('.video-wrap');
  if (!wrap) return;
  const videoId = videoPosterBtn.dataset.videoId;
  const videoTitle = videoPosterBtn.dataset.videoTitle || 'Video';
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  iframe.title = videoTitle;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  wrap.innerHTML = '';
  wrap.appendChild(iframe);
});
