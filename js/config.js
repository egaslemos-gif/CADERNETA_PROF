const Config = {
  init() {
    this.renderConfig();
  },

  renderConfig() {
    if(!App.schoolData) return;
    const sd = App.schoolData;
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    // School Info (Assuming we inject a list of items dynamically or update existing ones)
    // The HTML has hardcoded values, let's update them dynamically
    const configCard = document.querySelector('#config-page .col-lg-6:first-child .config-card');
    if(configCard) {
      configCard.innerHTML = `
        <h6><i class="fas fa-school me-2"></i>Informações da Escola</h6>
        <div class="config-item"><span class="label">Escola</span><span class="value">${sd.escola}</span></div>
        <div class="config-item"><span class="label">Localização</span><span class="value">${sd.endereco}</span></div>
        <div class="config-item"><span class="label">Contacto</span><span class="value">${sd.contacto}</span></div>
        <div class="config-item"><span class="label">Classe</span><span class="value">${sd.classe}</span></div>
        <div class="config-item"><span class="label">Ano Lectivo</span><span class="value">${sd.ano}</span></div>
        <div class="config-item"><span class="label">Professor(a)</span><span class="value">${sd.professor}</span></div>
        <div class="config-item"><span class="label">Dir. Pedagógico</span><span class="value">${sd.directorPedagogico}</span></div>
        <div class="config-item"><span class="label">Directora</span><span class="value">${sd.director}</span></div>
      `;
    }

    // User Profile
    document.getElementById('config-avatar-initials').textContent = user.avatar;
    document.querySelector('.config-avatar').style.background = Utils.getAvatarColor(user.nome || '');
    document.getElementById('config-user-name').textContent = user.nome;
    document.getElementById('config-user-role').textContent = user.role.toUpperCase();
    document.getElementById('config-last-login').textContent = new Date().toLocaleString();

    document.getElementById('btn-change-password').addEventListener('click', () => {
      Swal.fire({
        title: 'Funcionalidade desativada',
        text: 'Nesta versão MVP as senhas são geridas pelo administrador.',
        icon: 'info'
      });
    });
  }
};
