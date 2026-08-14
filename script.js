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
