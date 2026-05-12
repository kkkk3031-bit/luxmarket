(function() {
  const AUTH_STORAGE_KEY = 'luxmarket-current-user';
  const ALLOWED_RETURN_PAGES = new Set([
    'index.html',
    'shop.html',
    'product.html',
    'collections.html',
    'about.html',
    'contact.html',
    'cart.html',
    'checkout.html',
    'payment.html'
  ]);

  function setMessage(text, type) {
    const box = document.getElementById('authMessage');
    if (!box) return;

    box.textContent = text || '';
    box.className = `auth-message ${type || ''}`;
  }

  function saveUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo') || 'index.html';
    return ALLOWED_RETURN_PAGES.has(returnTo) ? returnTo : 'index.html';
  }

  function redirectIfAuthenticated() {
    if (!getUser()) return;

    const currentPage = window.location.pathname.split('/').pop() || 'login.html';
    if (currentPage === 'login.html' || currentPage === 'register.html') {
      window.location.replace(getReturnUrl());
    }
  }

  function fillRememberedEmail() {
    const email = localStorage.getItem('luxmarket-last-email');
    const loginEmail = document.querySelector('#loginForm input[name="email"]');
    if (email && loginEmail && !loginEmail.value) {
      loginEmail.value = email;
    }
  }

  async function submitJson(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ غير متوقع.');
    }

    return data;
  }

  function bindTabs() {
    const tabs = document.querySelectorAll('.login-tab');
    const forms = document.querySelectorAll('.login-form');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(item => item.classList.remove('active'));
        forms.forEach(form => form.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${target}Form`)?.classList.add('active');
        setMessage('', '');
      });
    });
  }

  function bindLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage('جاري تسجيل الدخول...', 'info');

      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '');

      try {
        const data = await submitJson('/api/login', { email, password });
        localStorage.setItem('luxmarket-last-email', email);
        saveUser(data.user);
        setMessage('تم تسجيل الدخول. جارٍ التحويل...', 'success');
        window.location.href = getReturnUrl();
      } catch (error) {
        setMessage(error.message, 'error');
      }
    });
  }

  function bindRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage('جاري إنشاء الحساب...', 'info');

      const formData = new FormData(form);
      const payload = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        password: String(formData.get('password') || ''),
        phone: String(formData.get('phone') || '').trim()
      };

      try {
        const data = await submitJson('/api/register', payload);
        localStorage.setItem('luxmarket-last-email', payload.email);
        saveUser(data.user);
        setMessage('تم إنشاء الحساب وحفظه في قاعدة البيانات. جارٍ التحويل...', 'success');
        window.location.href = getReturnUrl();
      } catch (error) {
        setMessage(error.message, 'error');
      }
    });
  }

  redirectIfAuthenticated();
  bindTabs();
  fillRememberedEmail();
  bindLogin();
  bindRegister();
})();
