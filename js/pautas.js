const Pautas = {
  async init() {
    this.setupForm();
    await this.loadSavedPDFs();
  },

  setupForm() {
    const discSelect = document.getElementById('select-pauta-disciplina');
    const tipoSelect = document.getElementById('select-pauta-tipo');
    const alunoWrapper = document.getElementById('pauta-aluno-wrapper');
    const alunoSelect = document.getElementById('select-pauta-aluno');
    const btnGenerate = document.getElementById('btn-generate-pauta');
    const btnPreview = document.getElementById('btn-preview-pauta');

    // Populate disciplines
    API.getDisciplines().then(disciplines => {
      disciplines.forEach(d => {
        discSelect.innerHTML += `<option value="${d.sheetName}">${d.name}</option>`;
      });
    });

    // Populate students (for Boletim Individual)
    API.getAllStudentsConsolidated().then(students => {
      students.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(s => {
        alunoSelect.innerHTML += `<option value="${s.nome}">${s.numero} - ${s.nome}</option>`;
      });
    });

    // Handle type change
    tipoSelect.addEventListener('change', (e) => {
      if (e.target.value === 'individual') {
        alunoWrapper.classList.remove('d-none');
        discSelect.disabled = true;
      } else if (e.target.value === 'geral') {
        alunoWrapper.classList.add('d-none');
        discSelect.disabled = true;
      } else {
        alunoWrapper.classList.add('d-none');
        discSelect.disabled = false;
      }
    });

    btnGenerate.addEventListener('click', this.generatePauta.bind(this));
    btnPreview.addEventListener('click', this.previewPauta.bind(this));
    
    // Bind print/download buttons of the existing modal
    const printHandler = () => {
      const content = document.getElementById('pauta-preview-content').innerHTML;
      const w = window.open('', '_blank');
      w.document.write('<html><head><title>Imprimir Pauta</title></head><body onload="window.print()">' + content + '</body></html>');
      w.document.close();
    };
    
    const downloadHandler = () => {
      const element = document.getElementById('pauta-preview-content');
      const opt = {
        margin:       10,
        filename:     'Pauta_Exportada.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(element).save();
    };
    
    document.getElementById('btn-print-pauta')?.addEventListener('click', printHandler);
    document.getElementById('btn-print-pauta-footer')?.addEventListener('click', printHandler);
    document.getElementById('btn-download-pauta')?.addEventListener('click', downloadHandler);
    document.getElementById('btn-download-pauta-footer')?.addEventListener('click', downloadHandler);
  },

  async buildPautaHTML(tipo, trim, disc, aluno) {
      let html = `<style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        h2 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 5px; }
        .text-center { text-align: center; }
      </style>`;
      
      const sd = App.schoolData || await API.getSchoolData();
      
      html += `
        <div class="text-center">
          <h2>${sd.escola}</h2>
          <p>${sd.endereco} | Ano Lectivo: ${sd.ano}</p>
        </div>
      `;

      if (tipo === 'trimestral') {
        html += `<h3>Pauta Trimestral - ${disc} - ${trim}º Trimestre</h3>`;
        const students = await API.getStudentsByDiscipline(disc);
        html += `<table><thead><tr><th>Nº</th><th>Nome</th><th>MACS</th><th>AT</th><th>MT</th><th>Comportamento</th></tr></thead><tbody>`;
        students.forEach(s => {
          const tData = s.trimestres[parseInt(trim)-1] || {};
          html += `<tr><td>${s.numero}</td><td>${s.nome}</td><td>${tData.macs||0}</td><td>${tData.at||0}</td><td><strong>${tData.mt||0}</strong></td><td>${tData.comp||'Regular'}</td></tr>`;
        });
        html += `</tbody></table>`;
      } else if (tipo === 'individual') {
        html += `<h3>Boletim Escolar Individual</h3>`;
        html += `<p><strong>Aluno:</strong> ${aluno}</p>`;
        const allStudents = await API.getAllStudentsConsolidated();
        const student = allStudents.find(s => s.nome === aluno);
        if (student) {
          html += `<table><thead><tr><th>Disciplina</th><th>Média Final</th><th>Comportamento</th><th>Situação</th></tr></thead><tbody>`;
          Object.keys(student.disciplinas).forEach(d => {
             const data = student.disciplinas[d];
             html += `<tr><td>${d}</td><td><strong>${data.mfd}</strong></td><td>${data.comp}</td><td>${data.resultado}</td></tr>`;
          });
          html += `</tbody></table>`;
        }
      } else {
        const isAnual = (trim === 'anual');
        html += `<h3 style="margin-bottom:5px">Pauta Geral - ${isAnual ? 'Anual' : trim + 'º Trimestre'}</h3>`;
        html += `<p style="font-size:0.9em;color:#666;margin-bottom:15px">Classe: ${sd.classe} | Professor(a): ${sd.professor}</p>`;
        
        const allStudents = await API.getAllStudentsConsolidated();
        const discNames = Object.keys(allStudents[0].disciplinas);

        let thead = '';
        if (isAnual) {
          thead += '<tr>';
          thead += '<th rowspan="2" style="vertical-align:middle;text-align:center;min-width:30px">Nº</th>';
          thead += '<th rowspan="2" style="vertical-align:middle;min-width:120px">Nome do Aluno</th>';
          discNames.forEach(d => {
            thead += `<th colspan="4" style="text-align:center;background:#e8edf3;border-bottom:2px solid #1a365d">${d}</th>`;
          });
          thead += '<th rowspan="2" style="vertical-align:middle;text-align:center;background:#d4edda;min-width:50px">Média<br>Global</th>';
          thead += '<th rowspan="2" style="vertical-align:middle;text-align:center;min-width:60px">Comp.</th>';
          thead += '<th rowspan="2" style="vertical-align:middle;text-align:center;min-width:80px">Resultado</th>';
          thead += '</tr><tr>';
          discNames.forEach(() => {
            thead += '<th style="text-align:center;font-size:0.75em;padding:4px">1ºT</th>';
            thead += '<th style="text-align:center;font-size:0.75em;padding:4px">2ºT</th>';
            thead += '<th style="text-align:center;font-size:0.75em;padding:4px">3ºT</th>';
            thead += '<th style="text-align:center;font-size:0.75em;padding:4px;background:#f0f0f0;font-weight:700">MFD</th>';
          });
          thead += '</tr>';
        } else {
          thead += '<tr>';
          thead += '<th style="vertical-align:middle;text-align:center;min-width:30px">Nº</th>';
          thead += '<th style="vertical-align:middle;min-width:120px">Nome do Aluno</th>';
          discNames.forEach(d => {
            thead += `<th style="text-align:center;background:#e8edf3;border-bottom:2px solid #1a365d">${d}</th>`;
          });
          thead += '<th style="vertical-align:middle;text-align:center;background:#d4edda;min-width:50px">Média</th>';
          thead += '<th style="vertical-align:middle;text-align:center;min-width:60px">Comp.</th>';
          thead += '<th style="vertical-align:middle;text-align:center;min-width:80px">Resultado</th>';
          thead += '</tr>';
        }

        html += `<table style="font-size:0.78em;width:100%"><thead>${thead}</thead><tbody>`;

        allStudents.forEach(s => {
          let row = `<td style="text-align:center">${s.numero}</td>`;
          row += `<td style="white-space:nowrap;font-weight:500">${s.nome}</td>`;

          if (isAnual) {
            discNames.forEach(d => {
              const data = s.disciplinas[d];
              const vals = [data.mt1, data.mt2, data.mt3];
              const mfd = data.mfd || 0;
              vals.forEach(v => {
                const val = v || 0;
                const display = val > 0 ? val.toFixed(1) : '—';
                const clr = val > 0 ? (val >= 9.5 ? '#10b981' : '#ef4444') : '#aaa';
                row += `<td style="text-align:center;color:${clr};padding:4px">${display}</td>`;
              });
              const mfdDisplay = mfd > 0 ? mfd.toFixed(1) : '—';
              const mfdClr = mfd > 0 ? (mfd >= 9.5 ? '#10b981' : '#ef4444') : '#aaa';
              row += `<td style="text-align:center;font-weight:700;color:${mfdClr};background:#f9f9f9;padding:4px">${mfdDisplay}</td>`;
            });
            const mg = s.mediaGeral;
            const mgClr = mg >= 9.5 ? '#10b981' : '#ef4444';
            const res = s.resultadoGeral || (mg >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)');
            const resClr = res.toUpperCase().includes('REPROVADO') ? '#ef4444' : '#10b981';
            row += `<td style="text-align:center;font-weight:700;color:${mgClr};background:#d4edda;padding:4px">${mg.toFixed(1)}</td>`;
            row += `<td style="text-align:center;padding:4px">${s.comportamentoGeral}</td>`;
            row += `<td style="text-align:center;font-weight:700;color:${resClr};padding:4px;font-size:0.9em">${res}</td>`;
          } else {
            let rowMedias = [];
            const trimIndex = parseInt(trim) - 1;
            discNames.forEach(d => {
              const data = s.disciplinas[d];
              const tData = data.trimestres && data.trimestres[trimIndex] ? data.trimestres[trimIndex] : {};
              const mt = tData.mt || 0;
              rowMedias.push(mt);
              const display = mt > 0 ? mt.toFixed(1) : '—';
              const clr = mt > 0 ? (mt >= 9.5 ? '#10b981' : '#ef4444') : '#aaa';
              row += `<td style="text-align:center;color:${clr};padding:4px">${display}</td>`;
            });
            const mediaValid = rowMedias.filter(m => m > 0);
            const media = mediaValid.length > 0
              ? (mediaValid.reduce((a, b) => a + b, 0) / mediaValid.length)
              : 0;
            const mediaClr = media >= 9.5 ? '#10b981' : '#ef4444';
            const res = media >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)';
            const resClr = res.includes('REPROVADO') ? '#ef4444' : '#10b981';
            row += `<td style="text-align:center;font-weight:700;color:${mediaClr};background:#d4edda;padding:4px">${media.toFixed(1)}</td>`;
            row += `<td style="text-align:center;padding:4px">${s.comportamentoGeral}</td>`;
            row += `<td style="text-align:center;font-weight:700;color:${resClr};padding:4px;font-size:0.9em">${res}</td>`;
          }

          html += `<tr>${row}</tr>`;
        });

        html += '</tbody></table>';
      }
      return html;
  },

  async generatePauta() {
    const tipo = document.getElementById('select-pauta-tipo').value;
    const trim = document.getElementById('select-pauta-trimestre').value;
    const disc = document.getElementById('select-pauta-disciplina').value;
    const aluno = document.getElementById('select-pauta-aluno').value;

    if (tipo === 'individual' && !aluno) {
      return Swal.fire('Atenção', 'Selecione um aluno para gerar o boletim.', 'warning');
    }

    Swal.fire({
      title: 'Gerando Pauta...',
      html: 'A comunicar com o Google Drive para criar o PDF.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const html = await this.buildPautaHTML(tipo, trim, disc, aluno);
      
      // Inject into a hidden element to generate PDF
      const container = document.createElement('div');
      container.innerHTML = html;
      
      const fileName = tipo === 'individual' ? `Boletim_${aluno}.pdf` : `Pauta_${disc||'Geral'}_T${trim}.pdf`;

      const opt = {
        margin:       10,
        filename:     fileName.replace(/\s+/g, '_'),
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(container).save();

      Swal.fire({
        icon: 'success',
        title: 'PDF Gerado e Baixado!',
        text: `Arquivo: ${opt.filename}`,
        confirmButtonText: 'Fechar'
      });
      
      // Mock saving to list
      this.loadSavedPDFs();
    } catch (e) {
      console.error(e);
      Swal.fire('Erro', 'Não foi possível gerar a pauta: ' + e.message, 'error');
    }
  },

  async previewPauta() {
    const tipo = document.getElementById('select-pauta-tipo').value;
    const trim = document.getElementById('select-pauta-trimestre').value;
    const disc = document.getElementById('select-pauta-disciplina').value;
    const aluno = document.getElementById('select-pauta-aluno').value;

    if (tipo === 'individual' && !aluno) {
      return Swal.fire('Atenção', 'Selecione um aluno para gerar o boletim.', 'warning');
    }

    Utils.showLoading();
    try {
      const html = await this.buildPautaHTML(tipo, trim, disc, aluno);
      const container = document.getElementById('pauta-preview-content');
      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-pauta-preview'));
      
      container.innerHTML = html;
      modal.show();

    } catch (e) {
      console.error(e);
      Swal.fire('Erro', 'Não foi possível gerar a pré-visualização.', 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  async loadSavedPDFs() {
    try {
      const pdfs = await API.listPDFs();
      this.renderPDFList(pdfs);
    } catch (e) {
      console.error(e);
    }
  },

  renderPDFList(pdfs) {
    const list = document.getElementById('pautas-list');
    const empty = document.getElementById('pautas-empty');
    document.getElementById('pautas-count').textContent = pdfs.length;

    if (pdfs.length === 0) {
      empty.style.display = 'block';
      // list.innerHTML is handled by HTML template
      return;
    }

    empty.style.display = 'none';
    let html = '';
    
    // Fallback Mock items if real list is empty but we want to show something
    const mockPdfs = [
      { name: 'Pauta_Trimestral_PORTUGUES_1_Trimestre.pdf', date: 'Hoje', size: '124 KB' },
      { name: 'Boletim_ZINIA_1_Trimestre.pdf', date: 'Ontem', size: '45 KB' }
    ];
    
    const items = pdfs.length ? pdfs : mockPdfs;

    items.forEach(pdf => {
      html += `
        <div class="card mb-2">
          <div class="card-body p-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <i class="fas fa-file-pdf text-danger fa-2x me-3"></i>
              <div>
                <h6 class="mb-0 text-dark">${pdf.name}</h6>
                <small class="text-secondary">${pdf.date} • ${pdf.size}</small>
              </div>
            </div>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
              <button class="btn btn-sm btn-outline-success"><i class="fas fa-download"></i></button>
              <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    });

    // Replace everything except the empty div
    list.innerHTML = empty.outerHTML + html;
  }
};
