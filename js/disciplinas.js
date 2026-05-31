const Disciplinas = {
  disciplinesList: [],
  currentSheetData: null,
  table: null,

  async init() {
    try {
      this.disciplinesList = await API.getDisciplines();
      this.renderGrid();
      this.setupEventHandlers();
    } catch (e) {
      console.error(e);
      Utils.showToast('Erro ao carregar disciplinas', 'error');
    }
  },

  renderGrid() {
    const grid = document.getElementById('disciplinas-grid');
    grid.innerHTML = '';

    const icons = {
      'PORTUGUES': 'fa-book-open text-primary',
      'MATEMATICA': 'fa-calculator text-success',
      'CIENCIAS NATURAIS': 'fa-leaf text-info',
      'CIENCIAS SOCIAIS': 'fa-globe-africa text-warning'
    };

    this.disciplinesList.forEach((disc, index) => {
      const icon = icons[disc.name] || 'fa-book text-primary';
      const delay = index * 0.1;
      
      const html = `
        <div class="col-xl-3 col-md-6" style="animation: fadeIn 0.5s ease forwards; animation-delay: ${delay}s; opacity: 0;">
          <div class="card h-100 disc-card cursor-pointer" data-sheet="${disc.sheetName}">
            <div class="card-body text-center py-4">
              <div class="mb-3" style="font-size: 3rem;">
                <i class="fas ${icon}"></i>
              </div>
              <h5 class="fw-bold mb-3">${disc.name}</h5>
              <button class="btn btn-outline-custom btn-sm w-100">Ver Pauta</button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });

    // Add click listeners to cards
    document.querySelectorAll('.disc-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showDisciplineDetail(card.getAttribute('data-sheet'));
      });
    });
  },

  async showDisciplineDetail(sheetName) {
    Utils.showLoading();
    try {
      const students = await API.getStudentsByDiscipline(sheetName);
      this.currentSheetData = { sheetName, students };
      
      // Update header
      document.getElementById('disc-detail-name').textContent = sheetName;
      document.getElementById('disc-detail-total').textContent = students.length;
      
      const validMt = students.map(s => s.mtFinal[0]).filter(v => v > 0);
      const media = validMt.reduce((a,b)=>a+b,0) / (validMt.length || 1);
      
      document.getElementById('disc-detail-media').textContent = Utils.formatNumber(media);
      document.getElementById('disc-detail-max').textContent = Math.round(Math.max(...validMt, 0));
      document.getElementById('disc-detail-min').textContent = Math.round(Math.min(...validMt, 20));

      // Switch view
      document.getElementById('disciplinas-grid').style.display = 'none';
      document.getElementById('disciplina-detail').style.display = 'block';

      this.renderGradesTable(1); // Default to Trimester 1
    } catch (e) {
      console.error(e);
      Utils.showToast('Erro ao carregar dados da disciplina', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  renderGradesTable(trimester) {
    const tIndex = trimester - 1; // 0-indexed
    
    if (this.table) {
      this.table.destroy();
    }

    this.table = $('#table-disciplina-notas').DataTable({
      data: this.currentSheetData.students,
      pageLength: 20,
      language: Utils.dataTablesPT,
      columns: [
        { data: 'numero' },
        { 
          data: 'nome',
          render: (data) => `<span class="fw-bold">${data}</span>`
        },
        { 
          data: `trimestres.${tIndex}.acs.0`, 
          render: (v, type, row) => `<input type="number" min="0" max="20" class="form-control form-control-sm grade-input" data-col="0" data-num="${row.numero}" data-row="${row.rowIndex}" value="${v||''}">` 
        },
        { 
          data: `trimestres.${tIndex}.acs.1`, 
          render: (v, type, row) => `<input type="number" min="0" max="20" class="form-control form-control-sm grade-input" data-col="1" data-num="${row.numero}" data-row="${row.rowIndex}" value="${v||''}">` 
        },
        { 
          data: `trimestres.${tIndex}.acs.2`, 
          render: (v, type, row) => `<input type="number" min="0" max="20" class="form-control form-control-sm grade-input" data-col="2" data-num="${row.numero}" data-row="${row.rowIndex}" value="${v||''}">` 
        },
        { 
          data: `trimestres.${tIndex}.acs.3`, 
          render: (v, type, row) => `<input type="number" min="0" max="20" class="form-control form-control-sm grade-input" data-col="3" data-num="${row.numero}" data-row="${row.rowIndex}" value="${v||''}">` 
        },
        { 
          data: `trimestres.${tIndex}.macs`, 
          render: (v, type, row) => `<span class="text-info fw-medium macs-display" data-num="${row.numero}">${Utils.formatNumber(v)}</span>` 
        },
        { 
          data: `trimestres.${tIndex}.at`, 
          render: (v, type, row) => `<input type="number" min="0" max="20" class="form-control form-control-sm grade-input" data-col="at" data-num="${row.numero}" data-row="${row.rowIndex}" value="${v||''}">` 
        },
        { 
          data: `trimestres.${tIndex}.mt`, 
          render: (v, type, row) => `<span class="fw-bold mt-display ${v>=10?'text-success':'text-danger'}" data-num="${row.numero}">${Utils.formatNumber(v)}</span>` 
        },
        { 
          data: `trimestres.${tIndex}.comp`,
          render: (v, type, row) => `
            <select class="form-select form-select-sm comp-select" data-num="${row.numero}" data-row="${row.rowIndex}">
              <option value="Excelente" ${v==='Excelente'?'selected':''}>Excelente</option>
              <option value="Bom" ${v==='Bom'?'selected':''}>Bom</option>
              <option value="Regular" ${v==='Regular'||!v?'selected':''}>Regular</option>
              <option value="Insatisfatório" ${v==='Insatisfatório'?'selected':''}>Insatisfatório</option>
              <option value="Crítico" ${v==='Crítico'?'selected':''}>Crítico</option>
            </select>
          `
        }
      ],
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rt<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      drawCallback: () => {
        // Auto-save logic on input change
        const gradeInputs = document.querySelectorAll('#table-disciplina-notas .grade-input');
        const compSelects = document.querySelectorAll('#table-disciplina-notas .comp-select');
        const activeTrim = parseInt(document.querySelector('.trimester-tab.active').getAttribute('data-trimester'));
        const sheetName = this.currentSheetData.sheetName;

        gradeInputs.forEach(input => {
          // 1. Real-time visual calculation
          input.addEventListener('input', (e) => {
            const tr = e.target.closest('tr');
            if(!tr) return;
            const acsInputs = tr.querySelectorAll('.grade-input[data-col="0"], .grade-input[data-col="1"], .grade-input[data-col="2"], .grade-input[data-col="3"]');
            const atInput = tr.querySelector('.grade-input[data-col="at"]');
            
            // Preview reflects spreadsheet: MACS = (E5 + F5) / 2
            const acs1 = acsInputs[0] && !isNaN(parseFloat(acsInputs[0].value)) ? parseFloat(acsInputs[0].value) : 0;
            const acs2 = acsInputs[1] && !isNaN(parseFloat(acsInputs[1].value)) ? parseFloat(acsInputs[1].value) : 0;
            const macs = (acs1 + acs2) / 2;
            
            const macsDisplay = tr.querySelector('.macs-display');
            if(macsDisplay) macsDisplay.textContent = Utils.formatNumber(macs);
            
            const atVal = atInput && !isNaN(parseFloat(atInput.value)) ? parseFloat(atInput.value) : 0;
            // Official Formula: MT = (2*MACS + AT) / 3
            const mt = (2 * macs + atVal) / 3;
            const mtDisplay = tr.querySelector('.mt-display');
            if(mtDisplay) {
               mtDisplay.textContent = Utils.formatNumber(mt);
               mtDisplay.className = `fw-bold mt-display ${Math.round(mt)>=10?'text-success':'text-danger'}`;
            }
          });

          // 2. Save only on 'Enter' key
          input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.target.blur(); // Remove focus to show completion
              
              const rowIndex = parseInt(e.target.getAttribute('data-row'));
              const col = e.target.getAttribute('data-col');
              const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
              
              const offsets = {
                1: { "0": 4, "1": 5, "2": 6, "3": 7, "at": 9 },
                2: { "0": 13, "1": 14, "2": 15, "3": 16, "at": 18 },
                3: { "0": 22, "1": 23, "2": 24, "3": 25, "at": 27 }
              };
              const physCol = offsets[activeTrim][col];
              
              e.target.classList.add('bg-warning', 'bg-opacity-25');
              try {
                await API.updateGrade(sheetName, rowIndex, physCol, val);
                e.target.classList.remove('bg-warning', 'bg-opacity-25');
                e.target.classList.add('bg-success', 'bg-opacity-25');
                setTimeout(() => e.target.classList.remove('bg-success', 'bg-opacity-25'), 1000);
              } catch (err) {
                console.error(err);
                e.target.classList.remove('bg-warning', 'bg-opacity-25');
                e.target.classList.add('bg-danger', 'bg-opacity-25');
              }
            }
          });
        });

        compSelects.forEach(select => {
          select.addEventListener('change', async (e) => {
            const rowIndex = parseInt(e.target.getAttribute('data-row'));
            const val = e.target.value;
            
            e.target.classList.add('bg-warning', 'bg-opacity-25');
            try {
              await API.updateBehavior(sheetName, rowIndex, activeTrim, val);
              e.target.classList.remove('bg-warning', 'bg-opacity-25');
              e.target.classList.add('bg-success', 'bg-opacity-25');
              setTimeout(() => e.target.classList.remove('bg-success', 'bg-opacity-25'), 1000);
            } catch (err) {
              console.error(err);
              e.target.classList.remove('bg-warning', 'bg-opacity-25');
              e.target.classList.add('bg-danger', 'bg-opacity-25');
            }
          });
        });
      }
    });
  },

  setupEventHandlers() {
    document.getElementById('btn-back-disciplinas').addEventListener('click', () => {
      document.getElementById('disciplina-detail').style.display = 'none';
      document.getElementById('disciplinas-grid').style.display = 'flex';
    });

    document.querySelectorAll('.trimester-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.trimester-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const trim = parseInt(e.target.getAttribute('data-trimester'));
        this.renderGradesTable(trim);
      });
    });
    
    document.getElementById('btn-save-notas').addEventListener('click', async () => {
      const activeTrim = parseInt(document.querySelector('.trimester-tab.active').getAttribute('data-trimester'));
      
      Utils.showLoading();
      try {
        const gradeInputs = document.querySelectorAll('.grade-input');
        const compInputs = document.querySelectorAll('.comp-select');
        
        let updates = [];
        
        const offsets = {
          1: { "0": 4, "1": 5, "2": 6, "3": 7, "at": 9 },
          2: { "0": 13, "1": 14, "2": 15, "3": 16, "at": 18 },
          3: { "0": 22, "1": 23, "2": 24, "3": 25, "at": 27 }
        };

        const compColumns = { 1: 11, 2: 20, 3: 29 };

        gradeInputs.forEach(input => {
          const rowIndex = parseInt(input.getAttribute('data-row'));
          const col = input.getAttribute('data-col'); // 0, 1, 2, 3, at
          const val = input.value === '' ? '' : (parseFloat(input.value) || 0);
          const physCol = offsets[activeTrim][col];
          updates.push({ row: rowIndex, col: physCol, val: val });
        });

        compInputs.forEach(select => {
           const rowIndex = parseInt(select.getAttribute('data-row'));
           const val = select.value;
           const physCol = compColumns[activeTrim];
           updates.push({ row: rowIndex, col: physCol, val: val });
        });

        await API.batchUpdate(this.currentSheetData.sheetName, updates);
        Swal.fire('Guardado', 'Lote de notas sincronizado com sucesso.', 'success');
        
        // Refresh local data model
        const students = await API.getStudentsByDiscipline(this.currentSheetData.sheetName);
        this.currentSheetData.students = students;
        
      } catch (e) {
        console.error(e);
        Swal.fire('Erro', 'Não foi possível guardar as notas.', 'error');
      } finally {
        Utils.hideLoading();
      }
    });

    document.getElementById('btn-export-notas').addEventListener('click', () => {
      const activeTrim = parseInt(document.querySelector('.trimester-tab.active').getAttribute('data-trimester'));
      const tIndex = activeTrim - 1;
      const sheetName = this.currentSheetData.sheetName;
      const students = this.currentSheetData.students;

      let csvContent = 'Nº,Nome,ACS1,ACS2,ACS3,ACS4,MACS,AT,MT,Comportamento\n';

      students.forEach(s => {
        const t = s.trimestres[tIndex] || {};
        csvContent += `${s.numero},"${s.nome}",${t.acs?.[0]||0},${t.acs?.[1]||0},${t.acs?.[2]||0},${t.acs?.[3]||0},${t.macs||0},${t.at||0},${t.mt||0},"${t.comp||'Regular'}"\n`;
      });

      const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Notas_${sheetName}_T${activeTrim}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
};
