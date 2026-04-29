const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 110, 360)}ms`;
  observer.observe(element);
});

const yearElement = document.querySelector('#year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ===== CART MANAGEMENT =====
const cartStorage = {
  key: 'brightenLightingCart',
  getCart() {
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  },
  saveCart(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
  },
  addItem(product) {
    const cart = this.getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      cart.push({ ...product, quantity: product.quantity || 1 });
    }
    this.saveCart(cart);
    this.updateCartUI();
  },
  removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter((item) => item.id !== productId);
    this.saveCart(cart);
    this.updateCartUI();
  },
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find((item) => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.saveCart(cart);
        this.updateCartUI();
      }
    }
  },
  clearCart() {
    localStorage.removeItem(this.key);
    this.updateCartUI();
  },
  getTotal() {
    return this.getCart().reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  },
  getItemCount() {
    return this.getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
  },
  updateCartUI() {
    const cartBadge = document.querySelector('[data-cart-badge]');
    if (cartBadge) {
      const count = this.getItemCount();
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }
};

// Update cart UI on page load
document.addEventListener('DOMContentLoaded', () => cartStorage.updateCartUI());

const applyQueryPrefill = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) {
    return;
  }

  const entries = ['plan', 'service', 'name', 'phone', 'location', 'budget', 'message'];
  entries.forEach((key) => {
    const value = params.get(key);
    if (!value) {
      return;
    }

    const field = document.querySelector(`[name="${key}"]`);
    if (!field) {
      return;
    }

    if (field.tagName === 'SELECT') {
      const optionExists = Array.from(field.options).some((option) => option.value === value || option.text === value);
      if (!optionExists) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        field.appendChild(option);
      }
    }

    field.value = value;
  });
};

const bindConversionForms = () => {
  const forms = document.querySelectorAll('form[data-conversion-form="true"]');
  if (!forms.length) {
    return;
  }

  const whatsappNumber = '254722339377';

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name') || 'Not provided',
        phone: formData.get('phone') || 'Not provided',
        service: formData.get('service') || 'Not provided',
        plan: formData.get('plan') || 'Not specified',
        location: formData.get('location') || 'Not provided',
        budget: formData.get('budget') || 'Not provided',
        message: formData.get('message') || 'No message',
      };

      const text =
        `Brighten Lighting Quote Request\n` +
        `Name: ${payload.name}\n` +
        `Phone: ${payload.phone}\n` +
        `Service: ${payload.service}\n` +
        `Plan: ${payload.plan}\n` +
        `Location: ${payload.location}\n` +
        `Budget: ${payload.budget}\n` +
        `Details: ${payload.message}`;

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
      const popup = window.open(whatsappUrl, '_blank');

      // Some browsers block new tabs; fallback to same-tab redirect so the flow still works.
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }

      const status = form.querySelector('.form-status');
      if (status) {
        status.textContent = 'WhatsApp message is ready. If WhatsApp opens, press Send to complete your request.';
      }
    });
  });
};

const normalizeKenyanPhone = (raw) => {
  const cleaned = String(raw || '').replace(/\D/g, '');

  if (/^2547\d{8}$/.test(cleaned) || /^2541\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^07\d{8}$/.test(cleaned) || /^01\d{8}$/.test(cleaned)) {
    return `254${cleaned.slice(1)}`;
  }

  return null;
};

const bindMpesaForms = () => {
  const forms = document.querySelectorAll('form[data-mpesa-form="true"]');
  if (!forms.length) {
    return;
  }

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const normalizedPhone = normalizeKenyanPhone(data.get('phone'));
      const amount = String(data.get('amount') || '').trim();
      const reference = String(data.get('reference') || '').trim();
      const note = String(data.get('message') || '').trim();
      const status = form.querySelector('.form-status');

      if (!normalizedPhone) {
        if (status) {
          status.textContent = 'Enter a valid Kenyan M-Pesa number (07XXXXXXXX or 2547XXXXXXXX).';
        }
        return;
      }

      if (!amount || Number(amount) <= 0) {
        if (status) {
          status.textContent = 'Enter a valid amount above 0.';
        }
        return;
      }

      const message =
        `M-Pesa Prompt Request\n` +
        `Phone: ${normalizedPhone}\n` +
        `Amount: KES ${amount}\n` +
        `Reference: ${reference || 'Not provided'}\n` +
        `Note: ${note || 'No note'}`;

      const whatsappUrl = `https://wa.me/254722339377?text=${encodeURIComponent(message)}`;
      const popup = window.open(whatsappUrl, '_blank');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }

      if (status) {
        status.textContent = 'M-Pesa prompt request prepared. Complete by sending the opened WhatsApp message.';
      }
    });
  });
};

const tryLoadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = () => resolve(null);
    image.src = `${src}?v=${Date.now()}`;
  });

const findFirstAvailableImage = async (paths) => {
  for (const path of paths) {
    const loaded = await tryLoadImage(path);
    if (loaded) {
      return loaded.split('?')[0];
    }
  }

  return null;
};

const initializeImageSources = async () => {
  const pageBackgroundCandidates = [
    'assets/whatsapp-background.jpg',
    'assets/whatsapp-background.jpeg',
    'assets/whatsapp-background.png',
  ];

  const coverCandidates = [
    'assets/cover-page.jpg',
    'assets/cover-page.jpeg',
    'assets/cover-page.png',
    'assets/cover-page.webp',
  ];

  const collageCandidates = [
    'assets/lights-collage.jpg',
    'assets/lights-collage.jpeg',
    'assets/lights-collage.png',
    'assets/lights-collage.webp',
  ];

  const bulbCandidates = [
    'assets/hanging-bulbs.jpg',
    'assets/hanging-bulbs.jpeg',
    'assets/hanging-bulbs.png',
    'assets/pendant-bulbs.jpg',
    'assets/pendant-bulbs.png',
    'assets/bulb-wall.jpg',
    'assets/bulb-wall.png',
  ];

  const wallCandidates = [
    'assets/wall-light.jpg',
    'assets/wall-light.jpeg',
    'assets/wall-light.png',
    'assets/wall-sconce.jpg',
    'assets/wall-sconce.png',
  ];

  const ceilingCandidates = [
    'assets/ceiling-light.jpg',
    'assets/ceiling-light.jpeg',
    'assets/ceiling-light.png',
    'assets/ceiling-lights.jpg',
    'assets/ceiling-lights.png',
  ];

  const pendantCandidates = [
    'assets/pendant-light.jpg',
    'assets/pendant-light.jpeg',
    'assets/pendant-light.png',
    'assets/pendant-lights.jpg',
    'assets/pendant-lights.png',
  ];

  const outdoorCandidates = [
    'assets/outdoor-light.jpg',
    'assets/outdoor-light.jpeg',
    'assets/outdoor-light.png',
    'assets/outdoor-lights.jpg',
    'assets/outdoor-lights.png',
  ];

  const decorCandidates = [
    'assets/decorative-bulb.jpg',
    'assets/decorative-bulb.jpeg',
    'assets/decorative-bulb.png',
    'assets/decorative-bulbs.jpg',
    'assets/decorative-bulbs.png',
  ];

  const [pageBackgroundImage, coverImage, collageImage, bulbImage, wallImage, ceilingImage, pendantImage, outdoorImage, decorImage] = await Promise.all([
    findFirstAvailableImage(pageBackgroundCandidates),
    findFirstAvailableImage(coverCandidates),
    findFirstAvailableImage(collageCandidates),
    findFirstAvailableImage(bulbCandidates),
    findFirstAvailableImage(wallCandidates),
    findFirstAvailableImage(ceilingCandidates),
    findFirstAvailableImage(pendantCandidates),
    findFirstAvailableImage(outdoorCandidates),
    findFirstAvailableImage(decorCandidates),
  ]);

  const resolvedPageBackgroundImage = pageBackgroundImage || collageImage || bulbImage;
  const resolvedCoverImage = coverImage || bulbImage;
  const resolvedCollageImage = collageImage || bulbImage;

  if (resolvedPageBackgroundImage) {
    document.documentElement.style.setProperty('--page-background-image', `url("${resolvedPageBackgroundImage}")`);
  }

  if (resolvedCoverImage) {
    document.documentElement.style.setProperty('--cover-image', `url("${resolvedCoverImage}")`);
    document.body.classList.remove('missing-cover');
  } else {
    document.body.classList.add('missing-cover');
  }

  if (resolvedCollageImage) {
    document.documentElement.style.setProperty('--collage-image', `url("${resolvedCollageImage}")`);
    document.body.classList.remove('missing-collage');
  } else {
    document.body.classList.add('missing-collage');
  }

  if (bulbImage) {
    document.documentElement.style.setProperty('--bulb-image', `url("${bulbImage}")`);
  }

  if (wallImage) {
    document.documentElement.style.setProperty('--wall-image', `url("${wallImage}")`);
  }

  if (ceilingImage) {
    document.documentElement.style.setProperty('--ceiling-image', `url("${ceilingImage}")`);
  }

  if (pendantImage) {
    document.documentElement.style.setProperty('--pendant-image', `url("${pendantImage}")`);
  }

  if (outdoorImage) {
    document.documentElement.style.setProperty('--outdoor-image', `url("${outdoorImage}")`);
  }

  if (decorImage) {
    document.documentElement.style.setProperty('--decor-image', `url("${decorImage}")`);
  }
};

initializeImageSources();
applyQueryPrefill();
bindConversionForms();
bindMpesaForms();
