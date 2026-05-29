const Relatorios = {
  students: [],
  chart: null,
  currentType: 'ranking',

  async init() {
    try {
      this.students = await API.getAllStudentsConsolidated();
      this.setupTabs();
      this.setupFilters();
      this.loadData();
    } catch (e) {
      console.error('Erro Relatorios', e);
    }
  },
  
  async loadData() {
    // If called by auto-sync, fetch fresh data
    if (this.students.length === 0 || document.querySelector('.sidebar-item.active').getAttribute('data-page') === 'relatorios') {
       this.students = await App.schoolData ? await API.getAllStudentsConsolidated() : this.students;
    }
    this.loadReport(this.currentType);
  },

  setupTabs() {
    const tabs = document.querySelectorAll('.report-type-card');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        const current = e.currentTarget;
        current.classList.add('active');
        
        this.currentType = current.getAttribute('data-report');
        this.loadReport(this.currentType);
      });
    });
    
    document.getElementById('btn-print-relatorio').addEventListener('click', () => window.print());
    
    // Export CSV hook
    const btnCsv = document.getElementById('btn-export-excel');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        Utils.showToast('Exportando dados do relatório para Excel...', 'info');
        // Simple mock of export
      });
    }
    // Export PDF hook
    const btnPdf = document.getElementById('btn-export-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        Utils.showToast('Gerando PDF do relatório...', 'info');
        // Simple mock of export
      });
    }
  },
  
  setupFilters() {
    const discSelect = document.getElementById('filter-relatorio-disciplina');
    if (discSelect && this.students.length > 0) {
      const disciplines = Object.keys(this.students[0].disciplinas);
      discSelect.innerHTML = '<option value="">Todas as Disciplinas</option>';
      disciplines.forEach(d => {
        discSelect.innerHTML += `<option value="${d}">${d}</option>`;
      });
      
      discSelect.addEventListener('change', () => this.loadReport(this.currentType));
    }
    
    const trimSelect = document.getElementById('filter-relatorio-trimestre');
    if (trimSelect) {
      trimSelect.addEventListener('change', () => this.loadReport(this.currentType));
    }
    
    const btnGen = document.getElementById('btn-generate-relatorio');
    if (btnGen) {
      btnGen.addEventListener('click', () => this.loadReport(this.currentType));
    }
  },

  getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#f8fafc' : '#718096',
      grid: isDark ? '#334155' : '#e2e8f0',
      bgPrimary: isDark ? '#3b82f6' : '#1a365d',
      bgSecondary: isDark ? '#ec4899' : '#ec4899',
      bgSuccess: '#10b981',
      bgWarning: '#f59e0b',
      bgDanger: '#ef4444'
    };
  },

  loadReport(type) {
    if (this.chart) this.chart.destroy();
    
    // Reset standard areas visibility
    document.getElementById('relatorio-chart-area').style.display = 'block';
    document.getElementById('relatorio-table-area').style.display = 'block';
    const actaArea = document.getElementById('relatorio-acta-area');
    if (actaArea) actaArea.style.display = 'none';

    const discFilter = document.getElementById('filter-relatorio-disciplina');
    if (discFilter) {
      if (type === 'acta') {
        discFilter.setAttribute('disabled', 'disabled');
      } else {
        discFilter.removeAttribute('disabled');
      }
    }

    switch (type) {
      case 'ranking':
        document.getElementById('relatorio-chart-area').style.display = 'none';
        this.renderRanking();
        break;
      case 'disciplina':
        this.renderDisciplinaAnalysis();
        break;
      case 'comportamento':
        this.renderBehaviorAnalysis();
        break;
      case 'sexo':
        this.renderSexAnalysis();
        break;
      case 'acta':
        document.getElementById('relatorio-chart-area').style.display = 'none';
        document.getElementById('relatorio-table-area').style.display = 'none';
        if (actaArea) actaArea.style.display = 'block';
        this.renderActa();
        break;
    }
  },

  renderRanking() {
    const sorted = [...this.students].sort((a,b) => b.mediaGeral - a.mediaGeral);
    
    let html = '';
    sorted.forEach((s, i) => {
      html += `
        <tr>
          <td><strong>${i+1}º</strong></td>
          <td>
            <div class="d-flex align-items-center">
              <div class="student-avatar me-3" style="background:${Utils.getAvatarColor(s.nome)}">${Utils.getInitials(s.nome)}</div>
              <div>
                <span class="fw-bold d-block">${s.nome}</span>
                <small class="text-secondary">Nº ${s.numero} | Sexo: ${s.sexo}</small>
              </div>
            </div>
          </td>
          <td class="text-center align-middle">${Utils.getGradeBadge(s.mediaGeral)}</td>
          <td class="text-center align-middle"><span class="badge ${s.resultadoGeral === 'APROVADO(A)' ? 'bg-success' : 'bg-danger'}">${s.resultadoGeral}</span></td>
          <td class="text-center align-middle">${Utils.getBehaviorBadge(s.comportamentoGeral)}</td>
        </tr>
      `;
    });
    
    document.querySelector('#table-relatorio thead').innerHTML = `
      <tr>
        <th style="width: 50px;">Pos.</th>
        <th>Aluno</th>
        <th class="text-center">Média Global</th>
        <th class="text-center">Resultado</th>
        <th class="text-center">Comportamento</th>
      </tr>
    `;
    document.querySelector('#table-relatorio tbody').innerHTML = html;
  },

  renderDisciplinaAnalysis() {
    const discFilter = document.getElementById('filter-relatorio-disciplina').value;
    const colors = this.getChartColors();
    
    if (discFilter) {
      // Show details for one specific discipline
      const vals = this.students.map(s => s.disciplinas[discFilter].mfd);
      const mediaTurma = vals.reduce((a,b)=>a+b,0) / vals.length;
      const positivas = vals.filter(v => v >= 10).length;
      const negativas = vals.filter(v => v < 10).length;

      const ctx = document.getElementById('chart-relatorio').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Positivas (>=10)', 'Negativas (<10)'],
          datasets: [{
            data: [positivas, negativas],
            backgroundColor: [colors.bgSuccess, colors.bgDanger]
          }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: colors.text } } }
        }
      });

      let html = '';
      this.students.forEach((s, i) => {
        const nota = s.disciplinas[discFilter].mfd;
        const result = s.disciplinas[discFilter].resultado;
        const comp = s.disciplinas[discFilter].comp;
        html += `
          <tr>
            <td>${s.numero}</td>
            <td>
              <div class="d-flex align-items-center">
                <div class="student-avatar me-3" style="background:${Utils.getAvatarColor(s.nome)}">${Utils.getInitials(s.nome)}</div>
                <span class="fw-bold">${s.nome}</span>
              </div>
            </td>
            <td class="text-center align-middle"><span class="fw-bold ${nota>=10?'text-success':'text-danger'}">${Utils.formatNumber(nota)}</span></td>
            <td class="text-center align-middle">${result}</td>
            <td class="text-center align-middle">${Utils.getBehaviorBadge(comp)}</td>
          </tr>
        `;
      });
      
      document.querySelector('#table-relatorio thead').innerHTML = `
        <tr><th style="width: 50px;">Nº</th><th>Aluno</th><th class="text-center">Nota Exacta</th><th class="text-center">Situação</th><th class="text-center">Comportamento</th></tr>
      `;
      document.querySelector('#table-relatorio tbody').innerHTML = html;

    } else {
      // General discipline overview
      const labels = ['PORTUGUES', 'MATEMATICA', 'CIENCIAS NATURAIS', 'CIENCIAS SOCIAIS'];
      const medias = labels.map(disc => {
        const sum = this.students.reduce((acc, s) => acc + s.disciplinas[disc].mfd, 0);
        return sum / this.students.length;
      });

      const ctx = document.getElementById('chart-relatorio').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Média da Turma',
            data: medias,
            backgroundColor: colors.bgPrimary,
            borderRadius: 4
          }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          scales: { 
            y: { max: 20, grid: { color: colors.grid }, ticks: { color: colors.text } },
            x: { grid: { display: false }, ticks: { color: colors.text } }
          },
          plugins: { legend: { labels: { color: colors.text } } }
        }
      });

      let html = '';
      labels.forEach((disc, i) => {
        const vals = this.students.map(s => s.disciplinas[disc].mfd);
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        html += `
          <tr>
            <td>${i+1}</td>
            <td><strong>${disc}</strong></td>
            <td class="text-center align-middle">${Utils.getGradeBadge(medias[i])}</td>
            <td class="text-center align-middle text-success fw-bold">${Utils.formatNumber(max)}</td>
            <td class="text-center align-middle text-danger fw-bold">${Utils.formatNumber(min)}</td>
          </tr>
        `;
      });
      
      document.querySelector('#table-relatorio thead').innerHTML = `
        <tr><th>#</th><th>Disciplina</th><th class="text-center">Média Geral</th><th class="text-center">Nota Máxima</th><th class="text-center">Nota Mínima</th></tr>
      `;
      document.querySelector('#table-relatorio tbody').innerHTML = html;
    }
  },

  renderBehaviorAnalysis() {
    const colors = this.getChartColors();
    const comps = { Excelente: 0, Bom: 0, Regular: 0, Insatisfatório: 0, Crítico: 0 };
    this.students.forEach(s => {
      if (comps[s.comportamentoGeral] !== undefined) comps[s.comportamentoGeral]++;
    });

    const ctx = document.getElementById('chart-relatorio').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(comps),
        datasets: [{
          data: Object.values(comps),
          backgroundColor: [colors.bgSuccess, colors.bgPrimary, colors.bgWarning, '#f97316', colors.bgDanger],
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#fff'
        }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: colors.text } } }
      }
    });

    let html = '';
    Object.keys(comps).forEach((k, i) => {
      html += `
        <tr>
          <td>${i+1}</td>
          <td><strong>${k}</strong></td>
          <td class="text-center align-middle">${comps[k]} alunos</td>
          <td class="text-center align-middle">${Utils.getBehaviorBadge(k)}</td>
        </tr>
      `;
    });
    
    document.querySelector('#table-relatorio thead').innerHTML = `
      <tr><th>#</th><th>Comportamento</th><th class="text-center">Quantidade</th><th class="text-center">Status</th></tr>
    `;
    document.querySelector('#table-relatorio tbody').innerHTML = html;
  },
  
  renderSexAnalysis() {
    const colors = this.getChartColors();
    const m = this.students.filter(s => s.sexo === 'M');
    const f = this.students.filter(s => s.sexo === 'F');

    const mMedia = m.length ? m.reduce((a,s) => a+s.mediaGeral, 0) / m.length : 0;
    const fMedia = f.length ? f.reduce((a,s) => a+s.mediaGeral, 0) / f.length : 0;

    const ctx = document.getElementById('chart-relatorio').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Masculino', 'Feminino'],
        datasets: [{
          data: [m.length, f.length],
          backgroundColor: [colors.bgPrimary, colors.bgSecondary],
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#fff'
        }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: colors.text } } }
      }
    });

    let html = `
      <tr>
        <td>1</td>
        <td><strong>Masculino</strong></td>
        <td class="text-center align-middle">${m.length} alunos</td>
        <td class="text-center align-middle">${Utils.getGradeBadge(mMedia)}</td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Feminino</strong></td>
        <td class="text-center align-middle">${f.length} alunas</td>
        <td class="text-center align-middle">${Utils.getGradeBadge(fMedia)}</td>
      </tr>
    `;
    
    document.querySelector('#table-relatorio thead').innerHTML = `
      <tr><th>#</th><th>Sexo</th><th class="text-center">Total Alunos</th><th class="text-center">Média Global</th></tr>
    `;
    document.querySelector('#table-relatorio tbody').innerHTML = html;
  },

  async renderActa() {
    let trimVal = document.getElementById('filter-relatorio-trimestre').value;
    if (!trimVal) {
      trimVal = '1';
      document.getElementById('filter-relatorio-trimestre').value = '1';
      Utils.showToast('Selecione um trimestre específico para a Acta do Conselho. Mostrando o 1º Trimestre.', 'warning');
    }

    try {
      const school = await API.getSchoolData();
      
      // Update basic fields
      document.getElementById('acta-turma-nome').textContent = school.classe ? (school.classe + ' Classe') : '---';
      document.getElementById('acta-trimestre-nome').textContent = trimVal + 'º';
      document.getElementById('acta-director-nome').textContent = school.director || 'Maria Manuela';
      document.getElementById('acta-professor-nome').textContent = school.professor || 'Pascoa da Graca Ramim';

      // Set date defaults if empty
      const dayInput = document.getElementById('acta-dia');
      const monthInput = document.getElementById('acta-mes');
      const yearInput = document.getElementById('acta-ano');
      const roomInput = document.getElementById('acta-sala');

      const now = new Date();
      if (!dayInput.value) dayInput.value = now.getDate();
      if (!monthInput.value) {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        monthInput.value = months[now.getMonth()];
      }
      if (!yearInput.value) yearInput.value = now.getFullYear();
      if (!roomInput.value) roomInput.value = 'Sala 1';

      // Statistics calculations
      const students = this.students;
      const activeStudents = students.filter(s => s.nome && s.nome.trim() !== '');

      // Gender counts
      const totalM = activeStudents.filter(s => s.sexo === 'F').length; // M stands for Mulheres (Female)
      const totalHM = activeStudents.length; // HM stands for Homens + Mulheres (Total)

      // Set Turma Indicators defaults
      document.getElementById('ind-mat-m').value = totalM;
      document.getElementById('ind-mat-hm').value = totalHM;
      document.getElementById('ind-ini-m').value = totalM;
      document.getElementById('ind-ini-hm').value = totalHM;

      // Compute quarterly average and positive students count
      const trimKey = 'mt' + trimVal;
      let posM = 0;
      let posHM = 0;

      activeStudents.forEach(s => {
        let sum = 0;
        let count = 0;
        const discNames = Object.keys(s.disciplinas);
        discNames.forEach(d => {
          const val = s.disciplinas[d] ? s.disciplinas[d][trimKey] : null;
          if (val !== null && val !== undefined && val !== '' && !isNaN(val)) {
            sum += Number(val);
            count++;
          }
        });
        const avg = count > 0 ? (sum / count) : 0;
        if (avg >= 9.5) {
          posHM++;
          if (s.sexo === 'F') {
            posM++;
          }
        }
      });

      document.getElementById('ind-pos-m').textContent = posM;
      document.getElementById('ind-pos-hm').textContent = posHM;

      // Add event listeners for inputs to update Fim do Trimestre and Aproveitamento % dynamically
      const updateFrequencia = () => {
        const iniM = parseInt(document.getElementById('ind-ini-m').value) || 0;
        const iniHM = parseInt(document.getElementById('ind-ini-hm').value) || 0;
        const desM = parseInt(document.getElementById('ind-des-m').value) || 0;
        const desHM = parseInt(document.getElementById('ind-des-hm').value) || 0;
        const entM = parseInt(document.getElementById('ind-ent-m').value) || 0;
        const entHM = parseInt(document.getElementById('ind-ent-hm').value) || 0;
        const saiM = parseInt(document.getElementById('ind-sai-m').value) || 0;
        const saiHM = parseInt(document.getElementById('ind-sai-hm').value) || 0;

        const fimM = iniM - desM - saiM + entM;
        const fimHM = iniHM - desHM - saiHM + entHM;

        document.getElementById('ind-fim-m').textContent = fimM;
        document.getElementById('ind-fim-hm').textContent = fimHM;

        const aprovM = fimM > 0 ? ((posM / fimM) * 100).toFixed(1) + '%' : '0%';
        const aprovHM = fimHM > 0 ? ((posHM / fimHM) * 100).toFixed(1) + '%' : '0%';

        document.getElementById('ind-aprov-m').textContent = aprovM;
        document.getElementById('ind-aprov-hm').textContent = aprovHM;
      };

      // Register input change listeners
      const inputs = [
        'ind-mat-m', 'ind-mat-hm',
        'ind-ini-m', 'ind-ini-hm',
        'ind-des-m', 'ind-des-hm',
        'ind-ent-m', 'ind-ent-hm',
        'ind-sai-m', 'ind-sai-hm'
      ];
      inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.removeEventListener('input', updateFrequencia);
          el.addEventListener('input', updateFrequencia);
        }
      });

      // Run once initially
      updateFrequencia();

      // Populate Pedagogical Achievement Table
      const disciplinesToRender = [
        { label: 'Português', key: 'PORTUGUES' },
        { label: 'C. sociais', key: 'CIENCIAS SOCIAIS' },
        { label: 'Matemática', key: 'MATEMATICA' },
        { label: 'C. naturais', key: 'CIENCIAS NATURAIS' },
        { label: 'Ed. Visual', key: 'ED. VISUAL' },
        { label: 'Ed. Física', key: 'ED. FISICA' }
      ];

      let tableHtml = '';
      disciplinesToRender.forEach(d => {
        let evalH = 0, evalM = 0, evalHM = 0;
        let posH = 0, posM = 0, posHM = 0;
        let negH = 0, negM = 0, negHM = 0;
        
        let span0_9 = 0;   // Não Satisfatório (0-9)
        let span10_13 = 0; // Satisfatório (10-13)
        let span14_16 = 0; // Bom (14-16)
        let span17_18 = 0; // Muito Bom (17-18)
        let span19_20 = 0; // Excelente (19-20)

        activeStudents.forEach(s => {
          const discData = s.disciplinas[d.key];
          const rawGrade = discData ? discData[trimKey] : null;

          if (rawGrade !== null && rawGrade !== undefined && rawGrade !== '' && !isNaN(rawGrade)) {
            const grade = Number(rawGrade);
            
            // Count evaluated
            evalHM++;
            if (s.sexo === 'F') {
              evalM++;
            } else {
              evalH++;
            }

            // Count positive and negative
            if (grade >= 9.5) {
              posHM++;
              if (s.sexo === 'F') {
                posM++;
              } else {
                posH++;
              }
            } else {
              negHM++;
              if (s.sexo === 'F') {
                negM++;
              } else {
                negH++;
              }
            }

            // Distribution
            if (grade < 9.5) {
              span0_9++;
            } else if (grade < 13.5) {
              span10_13++;
            } else if (grade < 16.5) {
              span14_16++;
            } else if (grade < 18.5) {
              span17_18++;
            } else {
              span19_20++;
            }
          }
        });

        const pctH = evalH > 0 ? ((posH / evalH) * 100).toFixed(1) : '0.0';
        const pctM = evalM > 0 ? ((posM / evalM) * 100).toFixed(1) : '0.0';
        const pctHM = evalHM > 0 ? ((posHM / evalHM) * 100).toFixed(1) : '0.0';

        tableHtml += `
          <tr>
            <td class="text-left fw-bold">${d.label}</td>
            <td>${evalH}</td>
            <td>${evalM}</td>
            <td class="fw-bold">${evalHM}</td>
            <td>${posH}</td>
            <td>${posM}</td>
            <td class="fw-bold text-success">${posHM}</td>
            <td>${negH}</td>
            <td>${negM}</td>
            <td class="fw-bold text-danger">${negHM}</td>
            <td>${pctH}%</td>
            <td>${pctM}%</td>
            <td class="fw-bold">${pctHM}%</td>
            <td>${span0_9}</td>
            <td>${span10_13}</td>
            <td>${span14_16}</td>
            <td>${span17_18}</td>
            <td>${span19_20}</td>
          </tr>
        `;
      });

      document.getElementById('acta-aproveitamento-body').innerHTML = tableHtml;

      // Print button click handler
      const printBtn = document.getElementById('btn-print-acta');
      if (printBtn) {
        printBtn.onclick = () => window.print();
      }

      // PDF download button handler
      const downloadBtn = document.getElementById('btn-download-acta');
      if (downloadBtn) {
        downloadBtn.onclick = () => {
          Utils.showToast('Gerando PDF da Acta...', 'info');
          const element = document.querySelector('.printable-acta');
          const opt = {
            margin:       10,
            filename:     `Acta_Conselho_Trimestre_${trimVal}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(element).save();
        };
      }

    } catch (e) {
      console.error('Erro renderActa', e);
      Utils.showToast('Erro ao carregar dados para a Acta do Conselho.', 'danger');
    }
  }
};
