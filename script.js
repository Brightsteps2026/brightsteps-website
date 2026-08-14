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

  newBlock.querySelector('.child-block-label').textContent = `${childLabel} ${childCount}`;
  newBlock.querySelectorAll('input, select').forEach((el) => {
    el.value = '';
    const baseName = el.name.replace(/_\d+$/, '');
    el.name = `${baseName}_${childCount}`;
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'child-block-remove';
  removeBtn.textContent = removeLabel;
  removeBtn.addEventListener('click', () => newBlock.remove());
  newBlock.appendChild(removeBtn);

  childrenContainer.appendChild(newBlock);
});

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
let heroIndex = 0;
let heroTimer;

function showHeroSlide(i) {
  if (!heroSlides.length) return;
  heroIndex = (i + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, idx) => slide.classList.toggle('active', idx === heroIndex));
  heroDots.forEach((dot, idx) => dot.classList.toggle('active', idx === heroIndex));
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHeroSlide(heroIndex + 1), 5000);
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

if (heroSlides.length) {
  startHeroTimer();
}

/* ---------- Static academic-year "Important Dates" list ---------- */
const calDatesBlockEl = document.getElementById('calDatesBlock');

if (calDatesBlockEl) {
  const calLang = calDatesBlockEl.dataset.lang === 'fr' ? 'fr' : 'en';

  // Source: BrightSteps Academic Calendar 2026-2027 (school-provided PDF).
  const CAL_EVENTS = [
    { start: '2026-08-17', end: '2026-08-25', en: 'Faculty Orientation', fr: 'Orientation du personnel' },
    { start: '2026-08-26', end: '2026-08-26', en: "Prophet's Birthday", fr: 'Anniversaire du Prophète' },
    { start: '2026-08-27', end: '2026-08-27', en: 'First Day of School', fr: 'Rentrée scolaire' },
    { start: '2026-10-19', end: '2026-10-23', en: 'October Break', fr: "Vacances d'octobre" },
    { start: '2026-11-01', end: '2026-11-01', en: "All Saints' Day", fr: 'Toussaint' },
    { start: '2026-11-15', end: '2026-11-15', en: 'Peace Day', fr: 'Journée de la paix' },
    { start: '2026-11-16', end: '2026-11-16', en: 'School Holiday', fr: 'Jour férié scolaire' },
    { start: '2026-11-26', end: '2026-11-27', en: 'Thanksgiving Break', fr: 'Vacances de Thanksgiving' },
    { start: '2026-12-16', end: '2027-01-08', en: 'December Break', fr: 'Vacances de décembre' },
    { start: '2026-12-25', end: '2026-12-25', en: 'Christmas Day', fr: 'Noël' },
    { start: '2027-01-01', end: '2027-01-01', en: "New Year's Day", fr: 'Jour de l\u2019An' },
    { start: '2027-01-11', end: '2027-01-11', en: 'Resume School', fr: 'Reprise des cours' },
    { start: '2027-02-18', end: '2027-02-19', en: 'February Break', fr: 'Vacances de février' },
    { start: '2027-03-06', end: '2027-03-06', en: 'Laylat al-Qadr (TBD)', fr: 'Nuit du Destin (à confirmer)' },
    { start: '2027-03-09', end: '2027-03-09', en: 'Eid al-Fitr (TBD)', fr: 'Aïd el-Fitr (à confirmer)' },
    { start: '2027-03-22', end: '2027-03-26', en: 'Spring Break', fr: 'Vacances de printemps' },
    { start: '2027-03-28', end: '2027-03-28', en: 'Easter', fr: 'Pâques' },
    { start: '2027-03-29', end: '2027-03-29', en: 'Easter Monday', fr: 'Lundi de Pâques' },
    { start: '2027-04-05', end: '2027-04-05', en: 'School Resumes', fr: 'Reprise des cours' },
    { start: '2027-05-01', end: '2027-05-01', en: 'Labor Day', fr: 'Fête du Travail' },
    { start: '2027-05-06', end: '2027-05-06', en: 'Ascension', fr: 'Ascension' },
    { start: '2027-05-17', end: '2027-05-17', en: 'Pentecost Monday', fr: 'Lundi de Pentecôte' },
    { start: '2027-06-08', end: '2027-06-08', en: 'Last Day of School', fr: "Dernier jour d'école" },
  ];

  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatRange(ev) {
    const start = parseISO(ev.start);
    const end = parseISO(ev.end);
    const opts = { day: 'numeric', month: 'short' };
    const locale = calLang === 'fr' ? 'fr-FR' : 'en-US';
    if (ev.start === ev.end) {
      return start.toLocaleDateString(locale, opts);
    }
    return `${start.toLocaleDateString(locale, opts)} \u2013 ${end.toLocaleDateString(locale, opts)}`;
  }

  const calDatesList = document.getElementById('calDatesList');
  if (calDatesList) {
    CAL_EVENTS.forEach((ev) => {
      const li = document.createElement('li');
      const dateSpan = document.createElement('span');
      dateSpan.className = 'cal-date';
      dateSpan.textContent = formatRange(ev);
      const labelSpan = document.createElement('span');
      labelSpan.textContent = calLang === 'fr' ? ev.fr : ev.en;
      li.appendChild(dateSpan);
      li.appendChild(labelSpan);
      calDatesList.appendChild(li);
    });
  }
}
