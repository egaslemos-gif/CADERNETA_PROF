const Dashboard = {
  stats: null,
  charts: {},

  async init() {
    try {
      this.stats = await API.getDashboardStats();
      this.renderKPIs();
      this.renderCharts();
      this.renderTopBottom();
    } catch (e) {
      console.error(e);
      Utils.showToast('Erro ao carregar Dashboard', 'error');
    }
  },

  renderKPIs() {
    const s = this.stats;
    document.getElementById('kpi-total-alunos').textContent = s.totalAlunos;
    document.getElementById('kpi-total-disciplinas').textContent = s.totalDisciplinas;
    document.getElementById('kpi-media-geral').textContent = Utils.formatNumber(s.mediaGeral);
    document.getElementById('kpi-alunos-criticos').textContent = s.alunosCriticos;
  },

  renderCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#718096";

    this.renderMediasChart();
    this.renderComportamentoChart();
    this.renderSexoChart();
    this.renderEvolucaoChart();
  },

  renderMediasChart() {
    const ctx = document.getElementById('chart-medias-disciplina').getContext('2d');
    const labels = this.stats.mediasPorDisciplina.map(d => d.disciplina);
    const data = this.stats.mediasPorDisciplina.map(d => d.media);
    const bgColors = data.map(v => v >= 14 ? 'rgba(16,185,129,0.8)' : (v >= 10 ? 'rgba(59,130,246,0.8)' : 'rgba(239,68,68,0.8)'));

    this.charts.medias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Média',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 20 }
        }
      }
    });
  },

  renderComportamentoChart() {
    const ctx = document.getElementById('chart-comportamento').getContext('2d');
    const comps = this.stats.distribuicaoComportamento;
    
    this.charts.comportamento = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Excelente', 'Bom', 'Regular', 'Insatisfatório', 'Crítico'],
        datasets: [{
          data: [comps.Excelente, comps.Bom, comps.Regular, comps.Insatisfatório, comps.Crítico],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  renderSexoChart() {
    const ctx = document.getElementById('chart-sexo').getContext('2d');
    const sexos = this.stats.distribuicaoSexo;
    
    this.charts.sexo = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Feminino', 'Masculino'],
        datasets: [{
          data: [sexos.F, sexos.M],
          backgroundColor: ['#ec4899', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  renderEvolucaoChart() {
    const ctx = document.getElementById('chart-evolucao').getContext('2d');
    // Mock data for evolution since we only have T1
    const labels = ['1º Trim.', '2º Trim.', '3º Trim.'];
    const datasets = this.stats.mediasPorDisciplina.map((d, i) => {
      const colors = ['#1a365d', '#d4a843', '#10b981', '#8b5cf6'];
      return {
        label: d.disciplina,
        data: [d.media, null, null], // T2 and T3 are null
        borderColor: colors[i],
        backgroundColor: colors[i],
        tension: 0.4,
        spanGaps: true
      };
    });

    this.charts.evolucao = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 20 } }
      }
    });
  },

  renderTopBottom() {
    const buildRow = (s, i) => `
      <tr>
        <td><strong>${i+1}º</strong></td>
        <td>
          <div class="d-flex align-items-center">
            <div class="student-avatar me-3" style="background: ${Utils.getAvatarColor(s.nome)}">${Utils.getInitials(s.nome)}</div>
            <div>
              <div class="fw-bold">${s.nome}</div>
              <div class="text-secondary small">Nº ${s.numero}</div>
            </div>
          </div>
        </td>
        <td>${Utils.getGradeBadge(s.mediaGeral)}</td>
      </tr>
    `;

    document.getElementById('top-alunos-list').innerHTML = this.stats.topAlunos.map(buildRow).join('');
    
    const buildBottomRow = (s, i) => `
      <tr>
        <td><strong>${i+1}º</strong></td>
        <td>
          <div class="d-flex align-items-center">
            <div class="student-avatar me-3" style="background: ${Utils.getAvatarColor(s.nome)}">${Utils.getInitials(s.nome)}</div>
            <div class="fw-bold">${s.nome}</div>
          </div>
        </td>
        <td>${Utils.getGradeBadge(s.mediaGeral)}</td>
        <td><span class="badge bg-danger">Em Risco</span></td>
      </tr>
    `;
    
    document.getElementById('bottom-alunos-list').innerHTML = this.stats.bottomAlunos.map(buildBottomRow).join('');
  }
};
