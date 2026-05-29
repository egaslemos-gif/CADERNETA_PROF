      } else {
        html += `<h3 style="margin-bottom:5px">Pauta Geral - ${trim === 'anual' ? 'Anual' : trim + 'º Trimestre'}</h3>`;
        html += `<p style="font-size:0.9em;color:#666;margin-bottom:15px">Classe: ${sd.classe} | Professor(a): ${sd.professor}</p>`;
        const allStudents = await API.getAllStudentsConsolidated();
        const discNames = Object.keys(allStudents[0].disciplinas);

        let thead = '<tr>';
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

        html += `<table style="font-size:0.78em;width:100%"><thead>${thead}</thead><tbody>`;

        allStudents.forEach(s => {
          let row = `<td style="text-align:center">${s.numero}</td>`;
          row += `<td style="white-space:nowrap;font-weight:500">${s.nome}</td>`;
          discNames.forEach(d => {
            const data = s.disciplinas[d];
            const vals = [data.mt1, data.mt2, data.mt3];
            const mfd = data.mfd || 0;
            vals.forEach(v => {
              const val = v || 0;
              const display = val > 0 ? val.toFixed(1) : '\u2014';
              const clr = val > 0 ? (val >= 9.5 ? '#10b981' : '#ef4444') : '#aaa';
              row += `<td style="text-align:center;color:${clr};padding:4px">${display}</td>`;
            });
            const mfdDisplay = mfd > 0 ? mfd.toFixed(1) : '\u2014';
            const mfdClr = mfd > 0 ? (mfd >= 9.5 ? '#10b981' : '#ef4444') : '#aaa';
            row += `<td style="text-align:center;font-weight:700;color:${mfdClr};background:#f9f9f9;padding:4px">${mfdDisplay}</td>`;
          });
          const mg = s.mediaGeral;
          const mgClr = mg >= 9.5 ? '#10b981' : '#ef4444';
          const resClr = s.resultadoGeral === 'APROVADO(A)' ? '#10b981' : '#ef4444';
          row += `<td style="text-align:center;font-weight:700;color:${mgClr};background:#d4edda;padding:4px">${mg.toFixed(1)}</td>`;
          row += `<td style="text-align:center;padding:4px">${s.comportamentoGeral}</td>`;
          row += `<td style="text-align:center;font-weight:700;color:${resClr};padding:4px;font-size:0.9em">${s.resultadoGeral}</td>`;
          html += `<tr>${row}</tr>`;
        });

        html += '</tbody></table>';
      }
