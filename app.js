/**
 * LUXMARKET - Modern E-Commerce JavaScript
 */

(function() {
  'use strict';

  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);

  const AUTH_STORAGE_KEY = 'luxmarket-current-user';
  const CART_STORAGE_KEY = 'luxmarket-cart';

  const productCatalog = {
    '1': {
      id: '1',
      title: 'ساعة فاخرة',
      category: 'الساعات',
      price: 299,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=600&fit=crop',
      color: 'أبيض',
      url: 'product.html?id=1'
    },
    '2': {
      id: '2',
      title: 'حقيبة جلدية',
      category: 'الحقائب',
      price: 449,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=600&fit=crop',
      color: 'بني',
      url: 'product.html?id=2'
    },
    '3': {
      id: '3',
      title: 'عطر حصري',
      category: 'العطور',
      price: 189,
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop',
      color: 'شفاف',
      url: 'product.html?id=3'
    },
    '4': {
      id: '4',
      title: 'نظارات شمسية',
      category: 'النظارات',
      price: 159,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=600&fit=crop',
      color: 'أسود',
      url: 'product.html?id=4'
    }
  };

  const state = {
    cart: loadCart(),
    wishlist: [],
    theme: localStorage.getItem('theme') || 'light',
    menuOpen: false,
    searchOpen: false
  };

  function init() {
    setTheme(state.theme);
    renderAuthState();
    syncCartBadges();
    bindEvents();
    initCounters();
    initSearch();
    initMobileMenu();
    initScrollEffects();
    initQuickAdd();
    initProductPage();
    initCartPage();
    initCheckoutPage();
    initPaymentPage();
    initNewsletter();
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && item.id) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    syncCartBadges();
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function clearCurrentUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    renderAuthState();
  }

  function formatPrice(amount) {
    return `${Number(amount || 0).toLocaleString('ar-KW')} د.ك`;
  }

  function getCartCount() {
    return state.cart.reduce((total, item) => total + item.quantity, 0);
  }

  function getCartSubtotal() {
    return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  function getCartSummary() {
    const subtotal = getCartSubtotal();
    const shipping = subtotal === 0 ? 0 : subtotal >= 100 ? 0 : 15;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  function bindEvents() {
    $('.theme-toggle')?.addEventListener('click', toggleTheme);
    $('.search-trigger')?.addEventListener('click', openSearch);
    $('.search-backdrop')?.addEventListener('click', closeSearch);
    $('#searchInput')?.addEventListener('keydown', handleSearchKeydown);
    $('.menu-toggle')?.addEventListener('click', toggleMobileMenu);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', handleStorageSync);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleDocumentClick);

    $$('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', handleWishlistClick);
    });

    $$('.tab').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });

    $$('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', handleColorSwatch);
    });
  }

  function handleStorageSync(event) {
    if (!event.key || event.key === CART_STORAGE_KEY) {
      state.cart = loadCart();
      syncCartBadges();
      renderCartPage();
      renderCheckoutSummary();
      renderPaymentSummary();
    }

    if (!event.key || event.key === AUTH_STORAGE_KEY) {
      renderAuthState();
      renderCheckoutSummary();
      renderPaymentSummary();
    }
  }

  function handleDocumentClick(event) {
    const logoutButton = event.target.closest('[data-action="logout"]');
    if (logoutButton) {
      event.preventDefault();
      clearCurrentUser();
      showToast('تم تسجيل الخروج بنجاح', 'success');
      return;
    }

    const suggestion = event.target.closest('.suggestion-tag');
    if (suggestion) {
      const input = $('#searchInput');
      if (input) {
        input.value = suggestion.textContent.trim();
      }
      window.location.href = `shop.html?search=${encodeURIComponent(suggestion.textContent.trim())}`;
    }
  }

  function renderAuthState() {
    const user = getCurrentUser();
    const returnTo = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search || ''}`;

    $$('.auth-links').forEach(container => {
      if (user) {
        container.innerHTML = `
          <div class="auth-user-pill" title="${user.email || ''}">
            <span class="auth-user-greeting">مرحباً، ${escapeHtml((user.full_name || user.name || 'عميل').split(' ')[0])}</span>
            <button type="button" class="auth-link auth-link-logout" data-action="logout">تسجيل الخروج</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <a href="login.html?returnTo=${encodeURIComponent(returnTo)}" class="auth-link">تسجيل الدخول</a>
          <a href="register.html?returnTo=${encodeURIComponent(returnTo)}" class="auth-link">إنشاء حساب</a>
        `;
      }
    });

    $$('.mobile-nav-footer').forEach(container => {
      if (user) {
        container.innerHTML = `
          <div class="mobile-user-block">
            <strong>مرحباً، ${escapeHtml(user.full_name || user.name || 'عميل')}</strong>
            <span>${escapeHtml(user.email || '')}</span>
            <button type="button" class="mobile-nav-link mobile-logout-btn" data-action="logout">تسجيل الخروج</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <a href="login.html?returnTo=${encodeURIComponent(returnTo)}" class="mobile-nav-link">تسجيل الدخول</a>
          <a href="register.html?returnTo=${encodeURIComponent(returnTo)}" class="mobile-nav-link">إنشاء حساب</a>
        `;
      }
    });
  }

  function initMobileMenu() {
    const menu = $('#mobileMenu');
    const toggle = $('.menu-toggle');
    if (!menu || !toggle) return;
  }

  function toggleMobileMenu() {
    const menu = $('#mobileMenu');
    const toggle = $('.menu-toggle');

    if (!menu || !toggle) return;

    state.menuOpen = !state.menuOpen;
    menu.classList.toggle('active', state.menuOpen);
    toggle.setAttribute('aria-expanded', state.menuOpen);
    menu.setAttribute('aria-hidden', String(!state.menuOpen));
    document.body.style.overflow = state.menuOpen ? 'hidden' : '';
  }

  function initSearch() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  function openSearch() {
    const modal = $('#searchModal');
    if (!modal) return;

    state.searchOpen = true;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      $('#searchInput')?.focus();
    }, 100);
  }

  function closeSearch() {
    const modal = $('#searchModal');
    if (!modal) return;

    state.searchOpen = false;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
      closeSearch();
      return;
    }

    if (e.key === 'Enter') {
      const term = e.currentTarget.value.trim();
      if (term) {
        window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
      }
    }
  }

  function initScrollEffects() {
    handleScroll();
  }

  function handleScroll() {
    const header = $('#header');
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 50);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      if (state.searchOpen) closeSearch();
      if (state.menuOpen) toggleMobileMenu();
    }
  }

  function initCounters() {
    const counters = $$('.stat-number[data-count]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(element) {
    const target = parseInt(element.dataset.count, 10);
    const duration = 2000;
    const start = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * easeOut);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  function initQuickAdd() {
    $$('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', handleQuickAdd);
    });
  }

  function handleQuickAdd(e) {
    e.preventDefault();
    e.stopPropagation();

    const card = e.currentTarget.closest('.product-card');
    const product = inferProductFromCard(card);
    if (!product) return;

    addToCart(product, 1);
    showToast(`تمت إضافة "${product.title}" إلى السلة`, 'success');
  }

  function initProductPage() {
    const addButton = $('.btn-add-cart');
    if (!addButton) return;

    const quantityValue = $('.quantity-selector span');

    $$('.quantity-selector button').forEach(button => {
      button.addEventListener('click', () => {
        const current = parseInt(quantityValue?.textContent || '1', 10) || 1;
        const next = button.textContent.trim() === '+' ? current + 1 : Math.max(1, current - 1);
        if (quantityValue) quantityValue.textContent = String(next);
      });
    });

    $$('.color-btn').forEach(button => {
      button.addEventListener('click', () => {
        $$('.color-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const label = $('.option-value');
        if (label) label.textContent = button.getAttribute('aria-label') || 'افتراضي';
      });
    });

    $$('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        $$('.tab-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');

        const target = button.dataset.tab;
        $$('.tab-content').forEach(panel => {
          panel.classList.toggle('active', panel.id === target);
        });
      });
    });

    addButton.addEventListener('click', () => {
      const product = inferProductFromProductPage();
      const quantity = parseInt(quantityValue?.textContent || '1', 10) || 1;
      if (!product) return;

      addToCart(product, quantity);
      showToast(`تمت إضافة "${product.title}" إلى السلة`, 'success');
    });
  }

  function inferProductFromCard(card) {
    if (!card) return null;

    const id = card.dataset.productId || extractIdFromHref(card.querySelector('a[href*="product.html"]')?.getAttribute('href'));
    if (id && productCatalog[id]) return productCatalog[id];

    const title = card.querySelector('.product-title a, .product-title')?.textContent?.trim() || 'منتج';
    const category = card.querySelector('.product-category')?.textContent?.trim() || 'منتجات';
    const image = card.querySelector('img')?.getAttribute('src') || '';
    const href = card.querySelector('a[href*="product.html"]')?.getAttribute('href') || 'product.html';
    const priceText = card.querySelector('.price-current')?.textContent || '0';

    return {
      id: id || slugify(title),
      title,
      category,
      price: parseArabicNumber(priceText),
      image,
      color: 'افتراضي',
      url: href
    };
  }

  function inferProductFromProductPage() {
    const id = extractIdFromHref(window.location.search) || '1';
    if (productCatalog[id]) {
      return {
        ...productCatalog[id],
        color: $('.option-value')?.textContent?.trim() || productCatalog[id].color
      };
    }

    const title = $('.product-title')?.textContent?.trim() || 'منتج';
    return {
      id,
      title,
      category: $('.product-category')?.textContent?.trim() || 'منتجات',
      price: parseArabicNumber($('.price-current')?.textContent || '0'),
      image: $('#mainImage')?.getAttribute('src') || '',
      color: $('.option-value')?.textContent?.trim() || 'افتراضي',
      url: `product.html?id=${id}`
    };
  }

  function addToCart(product, quantity) {
    const existing = state.cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += quantity;
      if (product.color) {
        existing.color = product.color;
      }
    } else {
      state.cart.push({
        ...product,
        quantity
      });
    }

    saveCart();
    renderCartPage();
    renderCheckoutSummary();
    renderPaymentSummary();
  }

  function updateCartItemQuantity(id, nextQuantity) {
    const item = state.cart.find(entry => entry.id === id);
    if (!item) return;

    if (nextQuantity <= 0) {
      state.cart = state.cart.filter(entry => entry.id !== id);
    } else {
      item.quantity = nextQuantity;
    }

    saveCart();
    renderCartPage();
    renderCheckoutSummary();
    renderPaymentSummary();
  }

  function syncCartBadges() {
    const count = getCartCount();
    $$('.cart-count').forEach(badge => {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function handleWishlistClick(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const svg = btn.querySelector('svg');
    const isAdded = btn.classList.contains('active');

    btn.classList.toggle('active');

    if (!isAdded) {
      if (svg) svg.style.fill = 'currentColor';
      showToast('تمت الإضافة إلى المفضلة', 'success');
    } else {
      if (svg) svg.style.fill = 'none';
      showToast('تمت الإزالة من المفضلة', 'error');
    }
  }

  function handleTabClick(e) {
    const tabs = $$('.tab');
    const clickedTab = e.target;
    const tabName = clickedTab.dataset.tab;

    tabs.forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    filterProducts(tabName);
  }

  function filterProducts(tabName) {
    const products = $$('.product-card');
    const categoryMap = {
      watches: 'الساعات',
      bags: 'الحقائب',
      perfumes: 'العطور'
    };

    products.forEach(product => {
      if (tabName === 'all') {
        product.style.display = '';
        return;
      }

      const category = product.querySelector('.product-category')?.textContent.trim();
      product.style.display = category === categoryMap[tabName] ? '' : 'none';
    });
  }

  function handleColorSwatch(e) {
    const swatches = e.target.closest('.product-colors')?.querySelectorAll('.color-swatch');
    if (!swatches) return;

    swatches.forEach(swatch => swatch.classList.remove('active'));
    e.target.classList.add('active');
  }

  function initNewsletter() {
    $('#newsletterForm')?.addEventListener('submit', handleNewsletterSubmit);
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]')?.value;
    if (!email) return;

    showToast('شكراً لاشتراكك في النشرة البريدية', 'success');
    e.target.reset();
  }

  function initCartPage() {
    if (!$('.cart-section')) return;

    $('.cart-items')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cart-action]');
      if (!button) return;

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-cart-action');
      const item = state.cart.find(entry => entry.id === id);
      if (!item) return;

      if (action === 'decrease') updateCartItemQuantity(id, item.quantity - 1);
      if (action === 'increase') updateCartItemQuantity(id, item.quantity + 1);
      if (action === 'remove') updateCartItemQuantity(id, 0);
    });

    renderCartPage();
  }

  function renderCartPage() {
    const list = $('.cart-items');
    if (!list) return;

    if (state.cart.length === 0) {
      list.innerHTML = `
        <div class="cart-empty-state">
          <h2>سلتك فارغة حالياً</h2>
          <p>ابدأ بإضافة منتجات فاخرة من المتجر ثم عد لإكمال الطلب.</p>
          <a href="shop.html" class="btn btn-primary">اذهب إلى المتجر</a>
        </div>
      `;
    } else {
      list.innerHTML = state.cart.map(item => `
        <div class="cart-item">
          <a href="${escapeAttribute(item.url || `product.html?id=${item.id}`)}" class="cart-item-image">
            <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}">
          </a>
          <div class="cart-item-details">
            <span class="cart-item-category">${escapeHtml(item.category)}</span>
            <h3 class="cart-item-title">
              <a href="${escapeAttribute(item.url || `product.html?id=${item.id}`)}">${escapeHtml(item.title)}</a>
            </h3>
            <div class="cart-item-color">اللون: ${escapeHtml(item.color || 'افتراضي')}</div>
          </div>
          <div class="cart-item-quantity">
            <button class="qty-btn" aria-label="نقص" data-cart-action="decrease" data-id="${escapeAttribute(item.id)}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" aria-label="زيادة" data-cart-action="increase" data-id="${escapeAttribute(item.id)}">+</button>
          </div>
          <div class="cart-item-price">
            <span class="price-current">${formatPrice(item.price * item.quantity)}</span>
          </div>
          <button class="cart-item-remove" aria-label="إزالة" data-cart-action="remove" data-id="${escapeAttribute(item.id)}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `).join('');
    }

    const summary = getCartSummary();
    const subtotalEl = $('[data-cart-subtotal]');
    const shippingEl = $('[data-cart-shipping]');
    const taxEl = $('[data-cart-tax]');
    const totalEl = $('[data-cart-total]');
    const checkoutBtn = $('.btn-checkout');

    if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
    if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'مجاني' : formatPrice(summary.shipping);
    if (taxEl) taxEl.textContent = formatPrice(summary.tax);
    if (totalEl) totalEl.textContent = formatPrice(summary.total);

    if (checkoutBtn) {
      if (state.cart.length === 0) {
        checkoutBtn.classList.add('is-disabled');
        checkoutBtn.setAttribute('aria-disabled', 'true');
        checkoutBtn.href = 'shop.html';
        checkoutBtn.textContent = 'أضف منتجات أولاً';
      } else {
        checkoutBtn.classList.remove('is-disabled');
        checkoutBtn.removeAttribute('aria-disabled');
        checkoutBtn.href = 'checkout.html';
        checkoutBtn.textContent = 'إتمام الشراء';
      }
    }
  }

  function initCheckoutPage() {
    if (!$('.checkout-section')) return;
    renderCheckoutSummary();
  }

  function renderCheckoutSummary() {
    if (!$('.checkout-section')) return;

    const user = getCurrentUser();
    const summary = getCartSummary();
    const count = getCartCount();
    const lead = $('.checkout-lead');
    const note = $('.checkout-note');
    const options = $('.checkout-options');

    const subtotalEl = $('[data-checkout-subtotal]');
    const shippingEl = $('[data-checkout-shipping]');
    const taxEl = $('[data-checkout-tax]');
    const totalEl = $('[data-checkout-total]');

    if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
    if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'مجاني' : formatPrice(summary.shipping);
    if (taxEl) taxEl.textContent = formatPrice(summary.tax);
    if (totalEl) totalEl.textContent = formatPrice(summary.total);

    if (lead) {
      if (count === 0) {
        lead.textContent = 'سلتك فارغة حالياً. أضف منتجات أولاً قبل متابعة الشراء أو الدفع.';
      } else if (user) {
        lead.textContent = `أهلاً ${user.full_name || 'بك'}، لديك ${count} منتج في السلة ويمكنك المتابعة مباشرة إلى صفحة الدفع أو الخروج من الحساب واستخدام وضع الزائر.`;
      } else {
        lead.textContent = `لديك ${count} منتج في السلة. يمكنك المتابعة كزائر أو تسجيل الدخول أو إنشاء حساب جديد ثم الانتقال إلى صفحة الدفع.`;
      }
    }

    if (note) {
      note.textContent = count === 0
        ? 'بعد إضافة منتجات إلى السلة، ستظهر هنا قيمة الطلب النهائية مع خيارات المتابعة المناسبة.'
        : 'بعد اختيار الطريقة المناسبة، سيتم توجيه العميل إلى صفحة الدفع لاختيار PayPal أو Stripe أو Visa أو بطاقة ائتمان.';
    }

    if (options) {
      options.querySelectorAll('a').forEach(link => {
        if (count === 0) {
          link.href = 'shop.html';
          link.classList.add('checkout-option-disabled');
        } else {
          link.classList.remove('checkout-option-disabled');
        }
      });
    }
  }

  function initPaymentPage() {
    if (!$('.payment-section')) return;

    const methodCards = $$('.method-card');
    const panels = $$('.payment-panel');
    const payButton = $('#payButton');
    const paymentMessage = $('#paymentMessage');
    let activeMethod = 'paypal';

    function setActiveMethod(method) {
      activeMethod = method;
      methodCards.forEach((card) => {
        card.classList.toggle('active', card.dataset.method === method);
      });
      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.panel === method);
      });
      paymentMessage.textContent = '';
      paymentMessage.className = 'payment-message';
    }

    methodCards.forEach((card) => {
      card.addEventListener('click', () => setActiveMethod(card.dataset.method));
    });

    payButton?.addEventListener('click', () => {
      if (state.cart.length === 0) {
        paymentMessage.className = 'payment-message error';
        paymentMessage.textContent = 'لا يمكن متابعة الدفع بدون منتجات في السلة.';
        return;
      }

      paymentMessage.className = 'payment-message success';
      if (activeMethod === 'paypal') {
        paymentMessage.textContent = 'تم اختيار PayPal. الخطوة التالية هي ربط الزر بجلسة PayPal الحقيقية.';
        return;
      }

      if (activeMethod === 'stripe') {
        paymentMessage.textContent = 'تم اختيار Stripe. الخطوة التالية هي ربط الزر بجلسة Stripe Checkout الفعلية.';
        return;
      }

      paymentMessage.textContent = 'تم تجهيز نموذج البطاقة. الخطوة التالية هي ربط هذا النموذج ببوابة دفع حقيقية لمعالجة العملية بأمان.';
    });

    renderPaymentSummary();
  }

  function renderPaymentSummary() {
    if (!$('.payment-section')) return;

    const user = getCurrentUser();
    const summary = getCartSummary();
    const title = $('.payment-subtitle');
    const subtotalEl = $('[data-payment-subtotal]');
    const shippingEl = $('[data-payment-shipping]');
    const taxEl = $('[data-payment-tax]');
    const totalEl = $('[data-payment-total]');
    const payButton = $('#payButton');

    if (title) {
      if (state.cart.length === 0) {
        title.textContent = 'سلتك فارغة حالياً. عد إلى المتجر لإضافة منتجات ثم ارجع إلى هذه الصفحة لإتمام الدفع.';
      } else if (user) {
        title.textContent = `الدفع باسم ${user.full_name || 'العميل'} متاح الآن عبر PayPal أو Stripe أو Visa أو بطاقة ائتمان مباشرة.`;
      } else {
        title.textContent = 'يمكنك الدفع الآن عبر PayPal أو Stripe أو Visa أو بطاقة ائتمان مباشرة.';
      }
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
    if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'مجاني' : formatPrice(summary.shipping);
    if (taxEl) taxEl.textContent = formatPrice(summary.tax);
    if (totalEl) totalEl.textContent = formatPrice(summary.total);

    if (payButton) {
      payButton.disabled = state.cart.length === 0;
      payButton.textContent = state.cart.length === 0 ? 'السلة فارغة' : 'تأكيد الدفع الآن';
    }
  }

  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success'
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        }
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function extractIdFromHref(value) {
    if (!value) return '';
    const match = String(value).match(/id=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function parseArabicNumber(value) {
    const normalized = String(value || '')
      .replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
      .replace(/[^\d.]/g, '');

    return Number(normalized || '0');
  }

  function slugify(value) {
    return String(value || 'product')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
