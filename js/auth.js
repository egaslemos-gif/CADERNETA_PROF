const Auth = {
  init() {
    const loginForm = document.getElementById('login-form');
    const togglePwd = document.getElementById('toggle-password');
    const logoutBtn = document.getElementById('nav-logout');
    const menuLogoutBtn = document.getElementById('menu-logout');

    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
    
    if (togglePwd) {
      togglePwd.addEventListener('click', () => {
        const input = document.getElementById('login-password');
        const icon = togglePwd.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', this.logout.bind(this));
    if (menuLogoutBtn) menuLogoutBtn.addEventListener('click', this.logout.bind(this));

    this.initGoogleAuth();
  },

  initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '50630855932-6tm8a6138keml9mb4j6r4tmsvci7djl0.apps.googleusercontent.com',
        callback: this.handleGoogleCallback.bind(this)
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-btn-container'),
        { theme: 'outline', size: 'large', text: 'continue_with', width: '300' }
      );
    } else {
      setTimeout(this.initGoogleAuth.bind(this), 500);
    }
  },

  async handleGoogleCallback(response) {
    const errorMsg = document.getElementById('login-error');
    errorMsg.classList.add('d-none');
    
    try {
      // Parse JWT token
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      const email = payload.email;
      
      Utils.showLoading();
      
      const res = await API.authenticateWithGoogle(email);
      if (res.success) {
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.completeLogin(res.user);
      } else {
        errorMsg.classList.remove('d-none');
        document.getElementById('login-error-text').textContent = res.message;
      }
    } catch (error) {
      console.error("Login falhou com exceção:", error);
      this.showError(error.message || 'Erro ao conectar ao servidor. Verifique a consola.');
    } finally {
      Utils.hideLoading();
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    const errorMsg = document.getElementById('login-error');

    btnText.classList.add('d-none');
    btnLoader.classList.remove('d-none');
    errorMsg.classList.add('d-none');

    try {
      const res = await API.authenticate(u, p);
      if (res.success) {
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.completeLogin(res.user);
      } else {
        errorMsg.classList.remove('d-none');
        document.getElementById('login-error-text').textContent = res.message;
      }
    } catch (err) {
      console.error(err);
      Utils.showToast('Erro: ' + (err.message || 'Falha de conexão'), 'error');
    } finally {
      btnText.classList.remove('d-none');
      btnLoader.classList.add('d-none');
    }
  },

  completeLogin(user) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    
    // Update UI profile
    document.getElementById('user-display-name').textContent = user.nome;
    document.getElementById('user-display-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    document.getElementById('user-avatar-initials').textContent = user.avatar;
    document.querySelector('.user-avatar').style.background = Utils.getAvatarColor(user.nome);

    App.start();
  },

  checkSession() {
    const session = sessionStorage.getItem('user');
    if (session) {
      this.completeLogin(JSON.parse(session));
      return true;
    }
    return false;
  },

  logout(e) {
    if(e) e.preventDefault();
    sessionStorage.removeItem('user');
    window.location.reload();
  }
};
