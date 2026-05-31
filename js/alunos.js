const Alunos = {
  students: [],
  table: null,

  async init() {
    try {
      this.students = await API.getAllStudentsConsolidated();
      this.updateStats();
      this.setupFilters();
      this.renderTable();
      this.setupEventHandlers();
    } catch (e) {
      console.error(e);
      Utils.showToast('Erro ao carregar alunos', 'error');
    }
  },

  updateStats() {
    document.getElementById('stat-total').textContent = this.students.length;
    document.getElementById('stat-masculino').textContent = this.students.filter(s => s.sexo === 'M').length;
    document.getElementById('stat-feminino').textContent = this.students.filter(s => s.sexo === 'F').length;
    
    const media = this.students.reduce((acc, s) => acc + s.mediaGeral, 0) / this.students.length;
    document.getElementById('stat-media').textContent = Utils.formatNumber(media);
  },

  setupFilters() {
    const discSelect = document.getElementById('filter-disciplina');
    const disciplines = Object.keys(this.students[0].disciplinas);
    disciplines.forEach(d => {
      discSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });

    const searchInput = document.getElementById('search-alunos');
    const compSelect = document.getElementById('filter-comportamento');
    const sexoSelect = document.getElementById('filter-sexo');
    const btnReset = document.getElementById('btn-reset-filters');

    const triggerFilter = () => {
      this.table.search(searchInput.value).draw();
      // Custom filtering logic could be added here for the dropdowns
    };

    searchInput.addEventListener('input', triggerFilter);
    compSelect.addEventListener('change', triggerFilter);
    sexoSelect.addEventListener('change', triggerFilter);

    btnReset.addEventListener('click', () => {
      searchInput.value = '';
      compSelect.value = '';
      sexoSelect.value = '';
      discSelect.value = '';
      this.table.search('').columns().search('').draw();
    });
  },

  renderTable() {
    // Custom search function for DataTables
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
      if (settings.nTable.id !== 'table-alunos') return true;
      
      const compFilter = document.getElementById('filter-comportamento').value;
      const sexoFilter = document.getElementById('filter-sexo').value;
      
      const sexo = data[2]; // Sexo column
      const comp = data[4]; // Comportamento column (contains HTML badge, need to check text)

      if (sexoFilter && sexo !== sexoFilter) return false;
      if (compFilter && !comp.includes(compFilter)) return false;
      
      return true;
    });

    this.table = $('#table-alunos').DataTable({
      data: this.students,
      pageLength: 15,
      language: Utils.dataTablesPT,
      columns: [
        { data: 'numero' },
        { 
          data: 'nome',
          render: (data, type, row) => `
            <div class="d-flex align-items-center">
              <div class="student-avatar me-3" style="background: ${Utils.getAvatarColor(data)}">${Utils.getInitials(data)}</div>
              <div class="d-flex flex-column">
                <span class="fw-bold ${row.isTransferido ? 'text-muted text-decoration-line-through' : ''}">${data}</span>
                ${row.isTransferido ? '<span class="badge bg-secondary" style="font-size:0.6rem;width:fit-content">TRANSFERIDO</span>' : ''}
              </div>
            </div>
          `
        },
        { data: 'sexo' },
        { 
          data: 'mediaGeral',
          render: (data) => Utils.getGradeBadge(data)
        },
        { 
          data: 'comportamentoGeral',
          render: (data) => Utils.getBehaviorBadge(data)
        },
        {
          data: null,
          orderable: false,
          render: (data) => `
            <button class="btn btn-sm btn-outline-custom view-student" data-name="${data.nome}">
              <i class="fas fa-eye"></i> Perfil
            </button>
          `
        }
      ],
      dom: '<"row"<"col-sm-12"tr>><"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    });
  },

  setupEventHandlers() {
    $('#table-alunos tbody').on('click', '.view-student', (e) => {
      const name = e.currentTarget.getAttribute('data-name');
      this.openStudentModal(name);
    });
    
    document.getElementById('btn-export-alunos').addEventListener('click', () => {
      Utils.showToast('Exportando dados para Excel...', 'info');
      // Dummy export logic
    });
  },

  openStudentModal(name) {
    const student = this.students.find(s => s.nome === name);
    if(!student) return;
    
    const html = `
      <div class="text-center mb-4">
        <div class="student-avatar mx-auto mb-2" style="width:80px;height:80px;font-size:2rem;background:${Utils.getAvatarColor(student.nome)}">${Utils.getInitials(student.nome)}</div>
        <h5>${student.nome} ${student.isTransferido ? '<span class="badge bg-secondary fs-6 align-middle ms-2">TRANSFERIDO</span>' : ''}</h5>
        <p class="text-secondary mb-2">Nº ${student.numero} | Sexo: ${student.sexo}</p>
        <div class="d-flex justify-content-center gap-2 mb-3">
          ${Utils.getGradeBadge(student.mediaGeral)}
          ${Utils.getBehaviorBadge(student.comportamentoGeral)}
        </div>
        <button id="btn-toggle-transfer" class="btn btn-sm ${student.isTransferido ? 'btn-outline-success' : 'btn-outline-secondary'}">
          <i class="fa-solid ${student.isTransferido ? 'fa-check' : 'fa-right-from-bracket'} me-1"></i>
          ${student.isTransferido ? 'Desmarcar Transferência' : 'Marcar como Transferido'}
        </button>
      </div>
      <hr>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>Disciplina</th><th>Média</th><th>Situação</th></tr></thead>
          <tbody>
            ${Object.entries(student.disciplinas).map(([disc, data]) => `
              <tr>
                <td class="text-start">${disc}</td>
                <td>${Utils.getGradeBadge(data.mfd)}</td>
                <td>${data.resultado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: 'Perfil do Aluno',
      html: html,
      width: '600px',
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        document.getElementById('btn-toggle-transfer').addEventListener('click', async () => {
          const newState = !student.isTransferido;
          const confirmMsg = newState 
            ? `Tem a certeza que deseja marcar <b>${student.nome}</b> como TRANSFERIDO? O aluno será removido das estatísticas gerais.`
            : `Tem a certeza que deseja remover o estado de TRANSFERIDO de <b>${student.nome}</b>? O aluno voltará às estatísticas.`;
            
          const confirm = await Swal.fire({
            title: 'Confirmar Acção',
            html: confirmMsg,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, prosseguir',
            cancelButtonText: 'Cancelar'
          });

          if (confirm.isConfirmed) {
            try {
              Swal.fire({
                title: 'A processar...',
                text: 'A actualizar dados nas folhas de disciplina. Isto pode demorar alguns segundos.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
              });
              
              const res = await API.markStudentAsTransferred(student.nome, newState);
              
              if (res.success) {
                Utils.showToast(`Estado actualizado com sucesso em ${res.updatedSheets} disciplinas!`, 'success');
                // Refresh the table data
                this.loadData();
              } else {
                Utils.showToast(res.error || 'Erro ao actualizar estado', 'error');
              }
            } catch (e) {
              console.error(e);
              Utils.showToast('Ocorreu um erro inesperado.', 'error');
            }
          }
        });
      }
    });
  }
};
