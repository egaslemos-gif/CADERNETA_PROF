/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — PautaService.gs
 *  Serviço de geração de pautas e boletins em HTML
 * ============================================================
 *  Gera HTML profissional para pautas trimestrais,
 *  boletins individuais e relatórios consolidados.
 * ============================================================
 */

// ---------------------------------------------------------------------------
//  CSS partilhado para impressão (A4)
// ---------------------------------------------------------------------------

/**
 * Estilos CSS comuns para todos os documentos imprimíveis.
 * Esquema de cores azul/dourado, optimizado para impressão A4.
 *
 * @return {string}  Bloco <style> completo.
 * @private
 */
function _getPrintStyles() {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        font-size: 11px;
        color: #1a1a2e;
        background: #ffffff;
        line-height: 1.4;
      }

      .page-container {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 12mm 15mm;
        background: #ffffff;
      }

      /* --- Cabeçalho --- */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 3px solid #1a3a6e;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header-logo {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: contain;
        background: #f0f4ff;
        padding: 4px;
      }

      .header-logo-placeholder {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        background: linear-gradient(135deg, #1a3a6e, #2d5aa0);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 20px;
        font-weight: 700;
      }

      .header-text h1 {
        font-size: 16px;
        font-weight: 700;
        color: #1a3a6e;
        margin-bottom: 2px;
      }

      .header-text p {
        font-size: 10px;
        color: #666;
      }

      .header-right {
        text-align: right;
      }

      .header-right .badge {
        display: inline-block;
        background: linear-gradient(135deg, #c8a84e, #e8c84e);
        color: #1a3a6e;
        font-weight: 700;
        font-size: 11px;
        padding: 4px 12px;
        border-radius: 20px;
        margin-bottom: 4px;
      }

      .header-right .info {
        font-size: 10px;
        color: #555;
      }

      /* --- Título da pauta --- */
      .pauta-title {
        text-align: center;
        margin: 15px 0;
        padding: 10px;
        background: linear-gradient(135deg, #1a3a6e, #2d5aa0);
        color: #ffffff;
        border-radius: 6px;
      }

      .pauta-title h2 {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .pauta-title p {
        font-size: 10px;
        opacity: 0.9;
        margin-top: 2px;
      }

      /* --- Tabela de notas --- */
      .grades-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 9px;
      }

      .grades-table th {
        background: #1a3a6e;
        color: #ffffff;
        padding: 5px 3px;
        text-align: center;
        font-weight: 600;
        font-size: 8px;
        border: 1px solid #13305a;
        white-space: nowrap;
      }

      .grades-table th.section-header {
        background: #c8a84e;
        color: #1a3a6e;
        font-size: 9px;
        letter-spacing: 0.5px;
      }

      .grades-table td {
        padding: 4px 3px;
        text-align: center;
        border: 1px solid #d0d5dd;
        font-size: 9px;
      }

      .grades-table td.nome {
        text-align: left;
        padding-left: 6px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 160px;
      }

      .grades-table tr:nth-child(even) {
        background: #f7f9fc;
      }

      .grades-table tr:hover {
        background: #eef2ff;
      }

      /* Cores de notas */
      .nota-alta { color: #0d6e3a; font-weight: 600; }
      .nota-media { color: #1a3a6e; }
      .nota-baixa { color: #b54708; font-weight: 600; }
      .nota-critica { color: #d92d20; font-weight: 700; }

      /* Comportamento */
      .comp-excelente { color: #0d6e3a; font-weight: 600; }
      .comp-bom { color: #1a3a6e; }
      .comp-regular { color: #b54708; }
      .comp-insatisfatorio { color: #d92d20; }
      .comp-critico { color: #d92d20; font-weight: 700; }

      /* Resultado */
      .resultado-aprovado {
        color: #0d6e3a;
        font-weight: 700;
        font-size: 8px;
      }
      .resultado-reprovado {
        color: #d92d20;
        font-weight: 700;
        font-size: 8px;
      }

      /* --- Rodapé / Assinaturas --- */
      .footer {
        margin-top: 25px;
        page-break-inside: avoid;
      }

      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        padding-top: 10px;
      }

      .signature-block {
        text-align: center;
        width: 30%;
      }

      .signature-line {
        border-top: 1px solid #333;
        margin-top: 35px;
        padding-top: 5px;
        font-size: 10px;
        font-weight: 600;
        color: #1a3a6e;
      }

      .signature-role {
        font-size: 9px;
        color: #666;
        margin-top: 2px;
      }

      .footer-info {
        text-align: center;
        font-size: 9px;
        color: #888;
        margin-top: 15px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      }

      /* --- Boletim individual --- */
      .boletim-info {
        display: flex;
        justify-content: space-between;
        background: #f7f9fc;
        padding: 10px 15px;
        border-radius: 6px;
        margin: 10px 0;
        border-left: 4px solid #c8a84e;
      }

      .boletim-info .info-group {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .boletim-info .label {
        font-size: 9px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .boletim-info .value {
        font-size: 12px;
        font-weight: 600;
        color: #1a3a6e;
      }

      .summary-box {
        display: flex;
        gap: 15px;
        margin: 15px 0;
      }

      .summary-card {
        flex: 1;
        background: linear-gradient(135deg, #f7f9fc, #eef2ff);
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        border: 1px solid #d0d5dd;
      }

      .summary-card .card-label {
        font-size: 9px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .summary-card .card-value {
        font-size: 20px;
        font-weight: 700;
        color: #1a3a6e;
      }

      /* --- Impressão --- */
      @media print {
        body { margin: 0; }
        .page-container {
          width: 100%;
          padding: 8mm 10mm;
          min-height: auto;
        }
        .no-print { display: none; }
      }

      @page {
        size: A4;
        margin: 10mm;
      }
    </style>
  `;
}

// ---------------------------------------------------------------------------
//  Pauta trimestral por disciplina
// ---------------------------------------------------------------------------

/**
 * Gera o HTML profissional de uma pauta trimestral para uma disciplina.
 *
 * @param {string} sheetName   Nome da tab (ex: 'PORTUGUES').
 * @param {number} trimester   Trimestre (1, 2 ou 3).
 * @return {string}  HTML completo da pauta.
 */
function generatePautaHTML(sheetName, trimester) {
  try {
    if (!sheetName || !trimester) {
      throw new Error('Disciplina e trimestre são obrigatórios.');
    }

    const schoolData = getSchoolData();
    const students = getStudentsByDiscipline(sheetName);
    const trimIndex = trimester - 1; // 0-indexed para acesso ao array

    const trimLabel = trimester + 'º Trimestre';
    const disciplineName = sheetName.replace(/_/g, ' ');

    let html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pauta - ${disciplineName} - ${trimLabel}</title>
        ${_getPrintStyles()}
      </head>
      <body>
        <div class="page-container">
          ${_buildHeader(schoolData)}

          <div class="pauta-title">
            <h2>PAUTA DE AVALIAÇÃO — ${disciplineName}</h2>
            <p>${trimLabel} • Ano Lectivo ${schoolData.ano || CONFIG.SCHOOL_YEAR}</p>
          </div>

          <table class="grades-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:30px;">Nº</th>
                <th rowspan="2" style="width:160px; text-align:left; padding-left:6px;">Nome Completo</th>
                <th rowspan="2" style="width:25px;">Sexo</th>
                <th colspan="4" class="section-header">Avaliações Contínuas</th>
                <th rowspan="2" style="width:35px;">MACS</th>
                <th rowspan="2" style="width:30px;">AT</th>
                <th rowspan="2" style="width:35px;">MT</th>
                <th rowspan="2" style="width:65px;">Comp.</th>
              </tr>
              <tr>
                <th style="width:28px;">1ª</th>
                <th style="width:28px;">2ª</th>
                <th style="width:28px;">3ª</th>
                <th style="width:28px;">4ª</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Linhas de alunos
    students.forEach(student => {
      const trim = student.trimestres[trimIndex];
      if (!trim) return;

      html += `
              <tr>
                <td>${student.numero || ''}</td>
                <td class="nome">${student.nome}</td>
                <td>${student.sexo}</td>
                <td>${_formatGrade(trim.acs[0])}</td>
                <td>${_formatGrade(trim.acs[1])}</td>
                <td>${_formatGrade(trim.acs[2])}</td>
                <td>${_formatGrade(trim.acs[3])}</td>
                <td class="${_getGradeClass(trim.macs)}">${_formatGrade(trim.macs)}</td>
                <td class="${_getGradeClass(trim.at)}">${_formatGrade(trim.at)}</td>
                <td class="${_getGradeClass(trim.mt)}"><strong>${_formatGrade(trim.mt)}</strong></td>
                <td class="${_getCompClass(trim.comp)}">${trim.comp || ''}</td>
              </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          ${_buildFooter(schoolData)}
        </div>
      </body>
      </html>
    `;

    Logger.log('Pauta HTML gerada: ' + sheetName + ' T' + trimester);
    return html;
  } catch (erro) {
    Logger.log('Erro ao gerar pauta HTML: ' + erro.message);
    return '<html><body><h1>Erro</h1><p>' + erro.message + '</p></body></html>';
  }
}

// ---------------------------------------------------------------------------
//  Boletim individual
// ---------------------------------------------------------------------------

/**
 * Gera o HTML do boletim individual de um aluno.
 * Inclui notas de todas as disciplinas para um trimestre (ou todos).
 *
 * @param {string}      studentName  Nome completo do aluno.
 * @param {number|null} trimester    Trimestre (1-3) ou null para todos.
 * @return {string}  HTML completo do boletim.
 */
function generateBoletimHTML(studentName, trimester) {
  try {
    if (!studentName) {
      throw new Error('Nome do aluno é obrigatório.');
    }

    const schoolData = getSchoolData();
    const studentDetail = getStudentDetail(studentName);

    if (!studentDetail) {
      throw new Error('Aluno "' + studentName + '" não encontrado.');
    }

    const discNames = Object.keys(studentDetail.disciplinas);
    const showAll = !trimester || trimester === 0;
    const trimLabel = showAll
      ? 'Todos os Trimestres'
      : trimester + 'º Trimestre';

    let html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boletim - ${studentDetail.nome}</title>
        ${_getPrintStyles()}
      </head>
      <body>
        <div class="page-container">
          ${_buildHeader(schoolData)}

          <div class="pauta-title">
            <h2>BOLETIM ESCOLAR</h2>
            <p>${trimLabel} • Ano Lectivo ${schoolData.ano || CONFIG.SCHOOL_YEAR}</p>
          </div>

          <div class="boletim-info">
            <div class="info-group">
              <span class="label">Aluno(a)</span>
              <span class="value">${studentDetail.nome}</span>
            </div>
            <div class="info-group">
              <span class="label">Nº</span>
              <span class="value">${studentDetail.numero}</span>
            </div>
            <div class="info-group">
              <span class="label">Sexo</span>
              <span class="value">${studentDetail.sexo === 'F' ? 'Feminino' : 'Masculino'}</span>
            </div>
            <div class="info-group">
              <span class="label">Classe</span>
              <span class="value">${schoolData.classe || ''}</span>
            </div>
          </div>
    `;

    if (showAll) {
      // Mostrar tabela resumo com todos os trimestres
      html += `
          <table class="grades-table">
            <thead>
              <tr>
                <th rowspan="2" style="text-align:left; padding-left:6px; width:140px;">Disciplina</th>
                <th colspan="2">1º Trimestre</th>
                <th colspan="2">2º Trimestre</th>
                <th colspan="2">3º Trimestre</th>
                <th rowspan="2" style="width:40px;">MFD</th>
                <th rowspan="2" style="width:75px;">Resultado</th>
              </tr>
              <tr>
                <th style="width:35px;">MT</th>
                <th style="width:60px;">Comp.</th>
                <th style="width:35px;">MT</th>
                <th style="width:60px;">Comp.</th>
                <th style="width:35px;">MT</th>
                <th style="width:60px;">Comp.</th>
              </tr>
            </thead>
            <tbody>
      `;

      discNames.forEach(discName => {
        const disc = studentDetail.disciplinas[discName];
        const t = disc.trimestres;
        const resClass = disc.resultado && disc.resultado.toUpperCase().includes('REPROVADO')
          ? 'resultado-reprovado' : 'resultado-aprovado';

        html += `
              <tr>
                <td class="nome">${discName.replace(/_/g, ' ')}</td>
                <td class="${_getGradeClass(t[0].mt)}">${_formatGrade(t[0].mt)}</td>
                <td class="${_getCompClass(t[0].comp)}">${t[0].comp || ''}</td>
                <td class="${_getGradeClass(t[1].mt)}">${_formatGrade(t[1].mt)}</td>
                <td class="${_getCompClass(t[1].comp)}">${t[1].comp || ''}</td>
                <td class="${_getGradeClass(t[2].mt)}">${_formatGrade(t[2].mt)}</td>
                <td class="${_getCompClass(t[2].comp)}">${t[2].comp || ''}</td>
                <td class="${_getGradeClass(disc.mfd)}"><strong>${_formatGrade(disc.mfd)}</strong></td>
                <td class="${resClass}">${disc.resultado || ''}</td>
              </tr>
        `;
      });

      html += `
            </tbody>
          </table>
      `;

      // Caixas de resumo
      html += `
          <div class="summary-box">
            <div class="summary-card">
              <div class="card-label">Média Geral</div>
              <div class="card-value" style="color:${studentDetail.mediaGeral >= 10 ? '#0d6e3a' : '#d92d20'}">
                ${_formatGrade(studentDetail.mediaGeral)}
              </div>
            </div>
            <div class="summary-card">
              <div class="card-label">Comportamento</div>
              <div class="card-value" style="font-size:14px;">${studentDetail.comportamentoGeral || '—'}</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Disciplinas</div>
              <div class="card-value">${discNames.length}</div>
            </div>
          </div>
      `;
    } else {
      // Um trimestre específico
      const trimIndex = trimester - 1;

      html += `
          <table class="grades-table">
            <thead>
              <tr>
                <th style="text-align:left; padding-left:6px; width:140px;">Disciplina</th>
                <th style="width:28px;">ACS 1ª</th>
                <th style="width:28px;">ACS 2ª</th>
                <th style="width:28px;">ACS 3ª</th>
                <th style="width:28px;">ACS 4ª</th>
                <th style="width:35px;">MACS</th>
                <th style="width:30px;">AT</th>
                <th style="width:35px;">MT</th>
                <th style="width:65px;">Comp.</th>
              </tr>
            </thead>
            <tbody>
      `;

      discNames.forEach(discName => {
        const trim = studentDetail.disciplinas[discName].trimestres[trimIndex];

        html += `
              <tr>
                <td class="nome">${discName.replace(/_/g, ' ')}</td>
                <td>${_formatGrade(trim.acs[0])}</td>
                <td>${_formatGrade(trim.acs[1])}</td>
                <td>${_formatGrade(trim.acs[2])}</td>
                <td>${_formatGrade(trim.acs[3])}</td>
                <td class="${_getGradeClass(trim.macs)}">${_formatGrade(trim.macs)}</td>
                <td class="${_getGradeClass(trim.at)}">${_formatGrade(trim.at)}</td>
                <td class="${_getGradeClass(trim.mt)}"><strong>${_formatGrade(trim.mt)}</strong></td>
                <td class="${_getCompClass(trim.comp)}">${trim.comp || ''}</td>
              </tr>
        `;
      });

      html += `
            </tbody>
          </table>
      `;
    }

    html += `
          ${_buildFooter(schoolData)}
        </div>
      </body>
      </html>
    `;

    Logger.log('Boletim HTML gerado: ' + studentName);
    return html;
  } catch (erro) {
    Logger.log('Erro ao gerar boletim HTML: ' + erro.message);
    return '<html><body><h1>Erro</h1><p>' + erro.message + '</p></body></html>';
  }
}

// ---------------------------------------------------------------------------
//  Pauta geral consolidada
// ---------------------------------------------------------------------------

/**
 * Gera o HTML de uma pauta geral consolidada para todas as disciplinas.
 *
 * @param {number} trimester  Trimestre (1, 2 ou 3).
 * @return {string}  HTML completo da pauta geral.
 */
function generatePautaGeralHTML(trimester) {
  try {
    if (!trimester) {
      throw new Error('Trimestre é obrigatório.');
    }

    const schoolData = getSchoolData();
    const disciplines = getDisciplines();
    const consolidated = getAllStudentsConsolidated();
    
    const isAnual = (trimester === 'anual');
    const trimLabel = isAnual ? 'Anual' : trimester + 'º Trimestre';
    const trimIndex = isAnual ? -1 : trimester - 1;

    let html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pauta Geral - ${trimLabel}</title>
        ${_getPrintStyles()}
        <style>
          .page-container {
            width: ${isAnual ? '297mm' : '210mm'};
            min-height: ${isAnual ? '210mm' : '297mm'};
          }
          .grades-table th, .grades-table td { font-size: 8px; padding: 3px 2px; }
        </style>
      </head>
      <body>
        <div class="page-container">
          ${_buildHeader(schoolData)}

          <div class="pauta-title">
            <h2>PAUTA GERAL DE AVALIAÇÃO</h2>
            <p>${trimLabel} • Ano Lectivo ${schoolData.ano || CONFIG.SCHOOL_YEAR} • Todas as Disciplinas</p>
          </div>

          <table class="grades-table">
            <thead>
    `;

    // Cabeçalhos das disciplinas
    if (isAnual) {
      html += `
        <tr>
          <th rowspan="2" style="width:25px; vertical-align:middle; text-align:center;">Nº</th>
          <th rowspan="2" style="text-align:left; padding-left:6px; vertical-align:middle;">Nome Completo</th>
          <th rowspan="2" style="width:20px; vertical-align:middle; text-align:center;">S</th>
      `;
      disciplines.forEach(disc => {
        html += `<th colspan="4" class="section-header" style="text-align:center;">${disc.name}</th>`;
      });
      html += `
          <th rowspan="2" style="width:35px; vertical-align:middle; text-align:center; background:#c8a84e; color:#1a3a6e;">Média Global</th>
          <th rowspan="2" style="width:55px; vertical-align:middle; text-align:center;">Comp.</th>
          <th rowspan="2" style="width:65px; vertical-align:middle; text-align:center;">Resultado</th>
        </tr>
        <tr>
      `;
      disciplines.forEach(() => {
        html += `
          <th style="width:22px; font-size:7px;">1ºT</th>
          <th style="width:22px; font-size:7px;">2ºT</th>
          <th style="width:22px; font-size:7px;">3ºT</th>
          <th style="width:25px; font-size:7px; font-weight:700; background:#f0f4ff; color:#1a3a6e;">MFD</th>
        `;
      });
      html += `</tr>`;
    } else {
      html += `
        <tr>
          <th style="width:25px;">Nº</th>
          <th style="text-align:left; padding-left:4px; width:130px;">Nome Completo</th>
          <th style="width:20px;">S</th>
      `;
      disciplines.forEach(disc => {
        const shortName = disc.name.substring(0, 4).toUpperCase();
        html += `<th style="width:30px;" title="${disc.name}">${shortName}</th>`;
      });
      html += `
          <th style="width:35px;">Média</th>
          <th style="width:55px;">Comp.</th>
          <th style="width:65px;">Resultado</th>
        </tr>
      `;
    }

    html += `
            </thead>
            <tbody>
    `;

    // Linhas de alunos
    consolidated.forEach(student => {
      html += `
              <tr>
                <td>${student.numero || ''}</td>
                <td class="nome">${student.nome}</td>
                <td>${student.sexo}</td>
      `;

      if (isAnual) {
        disciplines.forEach(disc => {
          const discData = student.disciplinas[disc.sheetName];
          if (discData) {
            const mt1 = discData.mt1 || 0;
            const mt2 = discData.mt2 || 0;
            const mt3 = discData.mt3 || 0;
            const mfd = discData.mfd || 0;
            html += `
              <td>${_formatGrade(mt1)}</td>
              <td>${_formatGrade(mt2)}</td>
              <td>${_formatGrade(mt3)}</td>
              <td class="${_getGradeClass(mfd)}" style="background:#f7f9fc; font-weight:700;">${_formatGrade(mfd)}</td>
            `;
          } else {
            html += '<td>—</td><td>—</td><td>—</td><td style="background:#f7f9fc;">—</td>';
          }
        });
        
        const mg = student.mediaGeral || 0;
        const res = student.resultadoGeral || (mg >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)');
        const resClass = res.toUpperCase().includes('REPROVADO') ? 'resultado-reprovado' : 'resultado-aprovado';
        
        html += `
                <td class="${_getGradeClass(mg)}" style="background:#f7f9fc;"><strong>${_formatGrade(mg)}</strong></td>
                <td class="${_getCompClass(student.comportamentoGeral)}">${student.comportamentoGeral || ''}</td>
                <td class="${resClass}"><strong>${res}</strong></td>
              </tr>
        `;
      } else {
        let rowMedias = [];
        disciplines.forEach(disc => {
          const discData = student.disciplinas[disc.sheetName];
          if (discData && discData.trimestres && discData.trimestres[trimIndex]) {
            const mt = discData.trimestres[trimIndex].mt;
            rowMedias.push(mt);
            html += `<td class="${_getGradeClass(mt)}">${_formatGrade(mt)}</td>`;
          } else {
            html += '<td>—</td>';
          }
        });

        // Média do trimestre
        const mediaValid = rowMedias.filter(m => m > 0);
        const media = mediaValid.length > 0
          ? Math.round((mediaValid.reduce((a, b) => a + b, 0) / mediaValid.length) * 10) / 10
          : 0;

        const res = media >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)';
        const resClass = res.toUpperCase().includes('REPROVADO') ? 'resultado-reprovado' : 'resultado-aprovado';

        html += `
                <td class="${_getGradeClass(media)}"><strong>${_formatGrade(media)}</strong></td>
                <td class="${_getCompClass(student.comportamentoGeral)}">${student.comportamentoGeral || ''}</td>
                <td class="${resClass}"><strong>${res}</strong></td>
              </tr>
        `;
      }
    });

    html += `
            </tbody>
          </table>

          ${_buildFooter(schoolData)}
        </div>
      </body>
      </html>
    `;

    Logger.log('Pauta geral HTML gerada: T' + trimester);
    return html;
  } catch (erro) {
    Logger.log('Erro ao gerar pauta geral: ' + erro.message);
    return '<html><body><h1>Erro</h1><p>' + erro.message + '</p></body></html>';
  }
}

// ---------------------------------------------------------------------------
//  Componentes HTML reutilizáveis (privados)
// ---------------------------------------------------------------------------

/**
 * Constrói o cabeçalho HTML com dados da escola.
 *
 * @param {Object} schoolData  Dados da escola.
 * @return {string}  HTML do cabeçalho.
 * @private
 */
function _buildHeader(schoolData) {
  const logoHtml = schoolData.logotipo
    ? `<img src="${schoolData.logotipo}" alt="Logotipo" class="header-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
       <div class="header-logo-placeholder" style="display:none;">EB</div>`
    : '<div class="header-logo-placeholder">EB</div>';

  return `
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div class="header-text">
          <h1>${schoolData.escola || 'Escola'}</h1>
          <p>${schoolData.endereco || ''}</p>
          <p>Contacto: ${schoolData.contacto || ''}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="badge">${schoolData.classe || ''} Classe</div>
        <div class="info">Período: ${schoolData.periodo || ''}</div>
        <div class="info">Ano Lectivo: ${schoolData.ano || CONFIG.SCHOOL_YEAR}</div>
      </div>
    </div>
  `;
}

/**
 * Constrói o rodapé com assinaturas.
 *
 * @param {Object} schoolData  Dados da escola.
 * @return {string}  HTML do rodapé.
 * @private
 */
function _buildFooter(schoolData) {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  return `
    <div class="footer">
      <div class="signatures">
        <div class="signature-block">
          <div class="signature-line">${schoolData.professor || ''}</div>
          <div class="signature-role">O(A) Professor(a)</div>
        </div>
        <div class="signature-block">
          <div class="signature-line">${schoolData.directorPedagogico || ''}</div>
          <div class="signature-role">O(A) Director(a) Pedagógico(a)</div>
        </div>
        <div class="signature-block">
          <div class="signature-line">${schoolData.director || ''}</div>
          <div class="signature-role">O(A) Director(a)</div>
        </div>
      </div>
      <div class="footer-info">
        Documento gerado automaticamente em ${dateStr} • Caderneta Escolar Digital v${CONFIG.VERSION}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
//  Formatação de notas e comportamento
// ---------------------------------------------------------------------------

/**
 * Formata uma nota numérica para exibição (1 casa decimal, vírgula).
 *
 * @param {number} value  Valor numérico.
 * @return {string}  Nota formatada ou '—' se zero/vazio.
 * @private
 */
function _formatGrade(value) {
  if (value === 0 || value === null || value === undefined) return '—';
  // Usar vírgula como separador decimal (padrão português)
  return String(Number(value).toFixed(1)).replace('.', ',');
}

/**
 * Retorna a classe CSS de acordo com o valor da nota.
 *
 * @param {number} value  Nota numérica.
 * @return {string}  Nome da classe CSS.
 * @private
 */
function _getGradeClass(value) {
  if (!value || value === 0) return '';
  if (value >= 14) return 'nota-alta';
  if (value >= 9.5) return 'nota-media';
  if (value >= 7) return 'nota-baixa';
  return 'nota-critica';
}

/**
 * Retorna a classe CSS de acordo com o nível de comportamento.
 *
 * @param {string} comp  Texto do comportamento.
 * @return {string}  Nome da classe CSS.
 * @private
 */
function _getCompClass(comp) {
  if (!comp) return '';
  const normalised = comp.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalised.includes('excelente')) return 'comp-excelente';
  if (normalised.includes('bom')) return 'comp-bom';
  if (normalised.includes('regular')) return 'comp-regular';
  if (normalised.includes('insatisfatorio')) return 'comp-insatisfatorio';
  if (normalised.includes('critico')) return 'comp-critico';
  return '';
}
