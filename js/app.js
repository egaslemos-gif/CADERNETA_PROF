const App = {
  schoolData: null,
  syncTimer: 300,
  syncInterval: null,
  
  async start() {
    Utils.showLoading();
    try {
      this.schoolData = await API.getSchoolData();
      document.querySelector('.login-school').textContent = this.schoolData.escola;
      document.querySelector('.sidebar-title').textContent = 'Caderneta Escolar';
      document.querySelector('.sidebar-subtitle').textContent = `${this.schoolData.classe} · ${this.schoolData.ano}`;
      
      this.initTheme();
      this.initRouter();
      
      // Init modules
      await Dashboard.init();
      Alunos.init();
      Disciplinas.init();
      Pautas.init();
      Relatorios.init();
      Config.init();
      
      this.navigate('dashboard');
      
      // Start 5-minute auto-sync timer
      this.startSyncTimer();
    } catch (e) {
      console.error(e);
      Utils.showToast('Erro ao carregar dados iniciais', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  startSyncTimer() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncTimer = 300;
    this.updateTimerDisplay();
    
    this.syncInterval = setInterval(() => {
      this.syncTimer--;
      if (this.syncTimer <= 0) {
        this.performAutoSync();
      } else {
        this.updateTimerDisplay();
      }
    }, 1000);
  },
  
  updateTimerDisplay() {
    const percentage = (this.syncTimer / 300) * 100;
    const circle = document.getElementById('sync-progress-circle');
    if (circle) {
      circle.style.background = `conic-gradient(var(--primary) ${percentage}%, #e2e8f0 0)`;
    }
  },
  
  async performAutoSync() {
    const spinner = document.getElementById('sync-spinner');
    if (spinner) spinner.classList.add('fa-spin', 'text-primary');
    
    try {
      // Re-fetch core data
      this.schoolData = await API.getSchoolData();
      
      // Refresh current page if it is Dashboard or Relatorios to show updated data instantly
      // (avoid refreshing active tables if user is typing)
      const currentPage = document.querySelector('.sidebar-item.active').getAttribute('data-page');
      if (currentPage === 'dashboard') {
        await Dashboard.loadDashboard();
      } else if (currentPage === 'relatorios') {
        await Relatorios.loadData();
      }
      
      Utils.showToast('Dados sincronizados com o servidor.', 'success');
    } catch (e) {
      console.error('Auto-sync failed', e);
      Utils.showToast('Falha na sincronização automática', 'warning');
    } finally {
      if (spinner) spinner.classList.remove('fa-spin', 'text-primary');
      this.syncTimer = 300; // Reset timer
      this.updateTimerDisplay();
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
      localStorage.setItem('theme', 'light');
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const icon = document.getElementById('theme-icon');
    
    if (current === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    }
    
    // Reload charts if on the Relatorios page
    const currentPage = document.querySelector('.sidebar-item.active').getAttribute('data-page');
    if (currentPage === 'relatorios' && typeof Relatorios !== 'undefined') {
      Relatorios.loadReport(Relatorios.currentType);
    }
  },

  initRouter() {
    const btnSync = document.getElementById('btn-manual-sync');
    if (btnSync) {
      btnSync.addEventListener('click', () => {
        this.syncTimer = 0; // Trigger sync on next tick
        this.performAutoSync();
      });
    }

    const items = document.querySelectorAll('.sidebar-nav .sidebar-item[data-page]');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        this.navigate(page);
        
        // Mobile sidebar close
        if(window.innerWidth <= 992) {
          document.getElementById('sidebar').classList.remove('show');
          document.getElementById('sidebar-overlay').classList.remove('show');
        }
      });
    });

    // Mobile toggle
    const toggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    if(toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('show');
        overlay.classList.add('show');
      });
    }
    if(overlay) {
      overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
        overlay.classList.remove('show');
      });
    }
  },

  navigate(pageId) {
    let targetPage = pageId;
    let reportSubPage = null;
    if (pageId.startsWith('relatorios-')) {
      targetPage = 'relatorios';
      reportSubPage = pageId.split('-')[1];
    }

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(sec => sec.style.display = 'none');
    
    // Show target page
    const pageEl = document.getElementById(`${targetPage}-page`);
    if (pageEl) pageEl.style.display = 'block';
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.sidebar-item[data-page="${pageId}"]`);
    if(activeItem) activeItem.classList.add('active');

    // Update Header
    const titles = {
      dashboard: 'Dashboard',
      alunos: 'Gestão de Alunos',
      disciplinas: 'Disciplinas',
      pautas: 'Geração de Pautas',
      relatorios: 'Relatórios',
      'relatorios-acta': 'Acta do Conselho',
      config: 'Configurações do Sistema'
    };
    
    document.getElementById('page-title').textContent = titles[pageId] || 'Página';
    document.getElementById('breadcrumb-current').textContent = titles[pageId] || 'Página';

    if (reportSubPage && typeof Relatorios !== 'undefined') {
      const tabBtn = document.getElementById(`report-${reportSubPage}`);
      if (tabBtn) {
        document.querySelectorAll('.report-type-card').forEach(t => t.classList.remove('active'));
        tabBtn.classList.add('active');
        Relatorios.currentType = reportSubPage;
        Relatorios.loadReport(reportSubPage);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  if (!Auth.checkSession()) {
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
  }
});
