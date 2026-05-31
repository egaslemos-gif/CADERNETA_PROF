/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — DataService.gs
 *  Serviço de leitura e escrita de dados da spreadsheet
 * ============================================================
 *  Lê dados da escola, disciplinas, alunos e estatísticas.
 *  Todas as funções são chamáveis via google.script.run.
 * ============================================================
 */

// ---------------------------------------------------------------------------
//  Referência à spreadsheet (com cache interna)
// ---------------------------------------------------------------------------

/** @type {Spreadsheet|null} Cache interna da spreadsheet */
let _spreadsheetCache = null;

/**
 * Obtém a referência à spreadsheet, com cache em memória.
 *
 * @return {Spreadsheet}  Referência ao Google Sheets.
 */
function getSpreadsheet() {
  if (_spreadsheetCache) return _spreadsheetCache;

  try {
    const configuredId = getConfiguredSpreadsheetId();
    if (configuredId) {
      _spreadsheetCache = SpreadsheetApp.openById(configuredId);
    } else {
      _spreadsheetCache = SpreadsheetApp.getActiveSpreadsheet();
      if (!_spreadsheetCache) {
        throw new Error('Nao existe folha vinculada ao projecto.');
      }
    }
    return _spreadsheetCache;
  } catch (erro) {
    Logger.log('Erro ao abrir spreadsheet: ' + erro.message);
    throw new Error(
      'Nao foi possivel abrir a folha de calculo. Verifique SPREADSHEET_ID e as permissoes.'
    );
  }
}

// ---------------------------------------------------------------------------
//  parseNumber  —  conversão de números com vírgula decimal
// ---------------------------------------------------------------------------

/**
 * Converte um valor para número, tratando vírgulas decimais.
 * Exemplos: '8,5' → 8.5, '' → 0, undefined → 0, 10 → 10
 *
 * @param {*} value  Valor a converter.
 * @return {number}  Valor numérico.
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  // Se já é número, devolver directamente
  if (typeof value === 'number') return value;

  // Converter para string e substituir vírgula por ponto
  let str = String(value).trim();
  if (str === '') return 0;

  // Remover espaços e substituir vírgula por ponto
  str = str.replace(/\s/g, '').replace(',', '.');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ---------------------------------------------------------------------------
//  Dados da escola
// ---------------------------------------------------------------------------

/**
 * Lê os dados da escola a partir da tab 'DADOS DA ESCOLA'.
 * Utiliza CacheService para evitar leituras repetidas.
 *
 * @return {Object}  Dados da escola e tabela de comportamentos.
 */
function getSchoolData() {
  try {
    // Verificar cache
    const cache = CacheService.getScriptCache();
    const cached = cache.get('schoolData');
    if (cached) {
      Logger.log('Dados da escola lidos da cache.');
      return JSON.parse(cached);
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DADOS DA ESCOLA');

    if (!sheet) {
      throw new Error('Tab "DADOS DA ESCOLA" não encontrada.');
    }

    const data = sheet.getDataRange().getValues();

    // Linha 1 (índice 1) contém os dados principais
    const row = data[1] || [];

    // Linhas 2-5 (índices 2-5) contêm comportamentos adicionais
    const comportamentos = [
      { nivel: String(row[3] || ''), significado: String(row[4] || '') }
    ];

    for (let i = 2; i < Math.min(data.length, 6); i++) {
      const r = data[i];
      if (r[3] && String(r[3]).trim() !== '') {
        comportamentos.push({
          nivel: String(r[3]).trim(),
          significado: String(r[4] || '').trim()
        });
      }
    }

    const result = {
      escola: String(row[0] || ''),
      endereco: String(row[1] || ''),
      contacto: String(row[2] || ''),
      professor: String(row[5] || ''),
      directorPedagogico: String(row[6] || ''),
      director: String(row[7] || ''),
      logotipo: String(row[8] || ''),
      classe: String(row[9] || ''),
      periodo: String(row[10] || ''),
      ano: String(row[11] || ''),
      comportamentos: comportamentos
    };

    // Guardar na cache (5 minutos)
    cache.put('schoolData', JSON.stringify(result), CONFIG.CACHE_TTL);

    Logger.log('Dados da escola lidos com sucesso: ' + result.escola);
    return result;
  } catch (erro) {
    Logger.log('Erro ao ler dados da escola: ' + erro.message);
    return {
      success: false,
      error: 'Erro ao ler dados da escola: ' + erro.message
    };
  }
}

// ---------------------------------------------------------------------------
//  Utilizadores
// ---------------------------------------------------------------------------

/**
 * Lê os utilizadores da aba 'USERS'
 * Colunas: Nome, Usuario, Email, Senha, perfil
 * @return {Array<Object>} Lista de utilizadores
 */
function getUsers() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('usersData');
    if (cached) {
      return JSON.parse(cached);
    }

    const data = _getUsersData();
    const users = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        users.push({
          nome: String(row[0]).trim(),
          username: String(row[1]).trim(),
          email: String(row[2]).trim(),
          password: String(row[3]).trim(),
          roleStr: String(row[4]).trim()
        });
      }
    }

    cache.put('usersData', JSON.stringify(users), CONFIG.CACHE_TTL);
    return users;
  } catch (e) {
    Logger.log('Erro ao ler utilizadores: ' + e.message);
    throw new Error('Nao foi possivel ler utilizadores. ' + e.message);
  }
}

/**
 * Lê os utilizadores directamente da tab USERS na spreadsheet configurada.
 * Colunas esperadas: Nome (A), Usuário (B), Email (C), Senha (D), Perfil (E)
 *
 * @return {Array<Array<*>>} Linhas da tabela USERS.
 * @private
 */
function _getUsersData() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('USERS');
  if (!sheet) {
    throw new Error('Tab "USERS" nao encontrada na spreadsheet.');
  }

  return sheet.getDataRange().getValues();
}

// ---------------------------------------------------------------------------
//  Disciplinas disponíveis
// ---------------------------------------------------------------------------

/**
 * Detecta dinamicamente as tabs de disciplinas
 * (exclui 'DADOS DA ESCOLA').
 *
 * @return {Array<Object>}  Lista de { name, sheetName }.
 */
function getDisciplines() {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const disciplines = [];

    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (name !== 'DADOS DA ESCOLA' && name !== 'USERS') {
        disciplines.push({
          name: name,
          sheetName: name
        });
      }
    });

    Logger.log('Disciplinas encontradas: ' + disciplines.length);
    return disciplines;
  } catch (erro) {
    Logger.log('Erro ao obter disciplinas: ' + erro.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Alunos por disciplina
// ---------------------------------------------------------------------------

/**
 * Lê todos os alunos de uma tab de disciplina.
 * Salta as 4 linhas de cabeçalho. Usa CacheService.
 *
 * Estrutura de cada trimestre:
 *   1.º Trim: colunas 4-11  (ACS 4-7, MACS 8, AT 9, MT 10, COMP 11)
 *   2.º Trim: colunas 13-20 (ACS 13-16, MACS 17, AT 18, MT 19, COMP 20)
 *   3.º Trim: colunas 22-29 (ACS 22-25, MACS 26, AT 27, MT 28, COMP 29)
 *   Finais:   colunas 30-34 (MT1 30, MT2 31, MT3 32, MFD 33, RESULTADO 34)
 *
 * @param {string} sheetName  Nome da tab (ex: 'PORTUGUES').
 * @return {Array<Object>}  Lista de objectos de alunos.
 */
function getStudentsByDiscipline(sheetName) {
  try {
    if (!sheetName) {
      throw new Error('Nome da disciplina não fornecido.');
    }

    // Verificar cache
    const cache = CacheService.getScriptCache();
    const cacheKey = 'students_' + sheetName;
    const cached = cache.get(cacheKey);
    if (cached) {
      Logger.log('Alunos de ' + sheetName + ' lidos da cache.');
      return JSON.parse(cached);
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Tab "' + sheetName + '" não encontrada.');
    }

    const allData = sheet.getDataRange().getValues();

    // Saltar 4 linhas de cabeçalho (índice 0-3), dados a partir do índice 4
    const HEADER_ROWS = 4;
    const students = [];

    for (let i = HEADER_ROWS; i < allData.length; i++) {
      const row = allData[i];

      // Ignorar linhas sem número ou nome
      const numero = row[0];
      let nomeRaw = String(row[1] || '').trim();

      if (!nomeRaw || nomeRaw === '') continue;

      const isTransferido = nomeRaw.toUpperCase().includes('TRANSFERIDO');
      const nome = nomeRaw.replace(/\(?TRANSFERIDO\)?/gi, '').trim();

      // Sexo
      const sexoF = row[2] === true || String(row[2]).toUpperCase() === 'TRUE';
      const sexoM = row[3] === true || String(row[3]).toUpperCase() === 'TRUE';
      const sexo = sexoF ? 'F' : (sexoM ? 'M' : '');

      // 1.º Trimestre (cols 4-11)
      const trim1 = {
        acs: [
          parseNumber(row[4]),
          parseNumber(row[5]),
          parseNumber(row[6]),
          parseNumber(row[7])
        ],
        macs: parseNumber(row[8]),
        at: parseNumber(row[9]),
        mt: parseNumber(row[10]),
        comp: String(row[11] || '').trim()
      };

      // 2.º Trimestre (cols 13-20)
      const trim2 = {
        acs: [
          parseNumber(row[13]),
          parseNumber(row[14]),
          parseNumber(row[15]),
          parseNumber(row[16])
        ],
        macs: parseNumber(row[17]),
        at: parseNumber(row[18]),
        mt: parseNumber(row[19]),
        comp: String(row[20] || '').trim()
      };

      // 3.º Trimestre (cols 22-29)
      const trim3 = {
        acs: [
          parseNumber(row[22]),
          parseNumber(row[23]),
          parseNumber(row[24]),
          parseNumber(row[25])
        ],
        macs: parseNumber(row[26]),
        at: parseNumber(row[27]),
        mt: parseNumber(row[28]),
        comp: String(row[29] || '').trim()
      };

      // Finais (cols 30-34)
      const mt1 = parseNumber(row[30]);
      const mt2 = parseNumber(row[31]);
      const mt3 = parseNumber(row[32]);
      const mfd = parseNumber(row[33]);
      const resultado = String(row[34] || '').trim();

      students.push({
        numero: numero,
        nome: nome,
        sexo: sexo,
        isTransferido: isTransferido,
        rowIndex: i + 1, // 1-indexed (para uso em updateGrade)
        trimestres: [trim1, trim2, trim3],
        mtFinal: [mt1, mt2, mt3],
        mfd: mfd,
        resultado: resultado
      });
    }

    // Guardar na cache
    const jsonStr = JSON.stringify(students);
    // CacheService tem limite de 100KB por chave
    if (jsonStr.length < 90000) {
      cache.put(cacheKey, jsonStr, CONFIG.CACHE_TTL);
    }

    Logger.log('Alunos de ' + sheetName + ' lidos: ' + students.length);
    return students;
  } catch (erro) {
    Logger.log('Erro ao ler alunos de ' + sheetName + ': ' + erro.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Todos os alunos consolidados
// ---------------------------------------------------------------------------

/**
 * Consolida todos os alunos de todas as disciplinas.
 * Junta por nome, calcula média geral e comportamento geral.
 *
 * @return {Array<Object>}  Lista consolidada de alunos.
 */
function getAllStudentsConsolidated() {
  try {
    // Verificar cache
    const cache = CacheService.getScriptCache();
    const cached = cache.get('allStudentsConsolidated');
    if (cached) {
      Logger.log('Alunos consolidados lidos da cache.');
      return JSON.parse(cached);
    }

    const disciplines = getDisciplines();
    /** @type {Object<string, Object>} Mapa nome → dados consolidados */
    const studentMap = {};

    disciplines.forEach(disc => {
      const students = getStudentsByDiscipline(disc.sheetName);

      students.forEach(student => {
        const key = student.nome.toUpperCase().trim();

        if (!studentMap[key]) {
          studentMap[key] = {
            numero: student.numero,
            nome: student.nome,
            sexo: student.sexo,
            isTransferido: false,
            disciplinas: {},
            _mfds: [],
            _comportamentos: []
          };
        }

        if (student.isTransferido) { studentMap[key].isTransferido = true; }

          // Adicionar dados da disciplina
        studentMap[key].disciplinas[disc.sheetName] = {
          mt1: student.mtFinal[0],
          mt2: student.mtFinal[1],
          mt3: student.mtFinal[2],
          mfd: student.mfd,
          resultado: student.resultado,
          trimestres: student.trimestres
        };

        // Acumular para cálculos gerais
        if (student.mfd > 0) {
          studentMap[key]._mfds.push(student.mfd);
        }

        // Recolher comportamentos de todos os trimestres
        student.trimestres.forEach(t => {
          if (t.comp && t.comp !== '') {
            studentMap[key]._comportamentos.push(t.comp);
          }
        });
      });
    });

    // Converter mapa em array e calcular médias
    const consolidated = Object.values(studentMap).map(student => {
      // Média geral: média dos MFD de todas as disciplinas
      const mediaGeral = student._mfds.length > 0
        ? Math.round((student._mfds.reduce((a, b) => a + b, 0) / student._mfds.length) * 10) / 10
        : 0;

      // Comportamento geral: o mais frequente
      const comportamentoGeral = _getMostFrequent(student._comportamentos) || '';
      
      // Resultado geral: aprovado se média >= 9.5
      const resultadoGeral = mediaGeral >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)';

      return {
        numero: student.numero,
        nome: student.nome,
        sexo: student.sexo,
        disciplinas: student.disciplinas,
        mediaGeral: mediaGeral,
        comportamentoGeral: comportamentoGeral,
        resultadoGeral: resultadoGeral
      };
    });

    // Ordenar por número
    consolidated.sort((a, b) => {
      const nA = parseNumber(a.numero);
      const nB = parseNumber(b.numero);
      return nA - nB;
    });

    // Guardar na cache
    const jsonStr = JSON.stringify(consolidated);
    if (jsonStr.length < 90000) {
      cache.put('allStudentsConsolidated', jsonStr, CONFIG.CACHE_TTL);
    }

    Logger.log('Alunos consolidados: ' + consolidated.length);
    return consolidated;
  } catch (erro) {
    Logger.log('Erro ao consolidar alunos: ' + erro.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Estatísticas do dashboard
// ---------------------------------------------------------------------------

/**
 * Calcula estatísticas agregadas para o dashboard.
 *
 * @return {Object}  Objecto com todas as estatísticas.
 */
function getDashboardStats() {
  try {
    // Verificar cache
    const cache = CacheService.getScriptCache();
    const cached = cache.get('dashboardStats');
    if (cached) {
      Logger.log('Estatísticas lidas da cache.');
      return JSON.parse(cached);
    }

    const disciplines = getDisciplines();
    const consolidated = getAllStudentsConsolidated().filter(s => !s.isTransferido);

    // --- Totais ---
    const totalAlunos = consolidated.length;
    const totalDisciplinas = disciplines.length;

    // --- Média geral de todas as disciplinas ---
    const mfdsValidos = consolidated
      .filter(a => a.mediaGeral > 0)
      .map(a => a.mediaGeral);

    const mediaGeral = mfdsValidos.length > 0
      ? Math.round((mfdsValidos.reduce((a, b) => a + b, 0) / mfdsValidos.length) * 10) / 10
      : 0;

    // --- Alunos críticos (MFD < 9.5) ---
    const alunosCriticos = consolidated.filter(a => a.mediaGeral > 0 && a.mediaGeral < 9.5).length;

    // --- Médias por disciplina ---
    const mediasPorDisciplina = disciplines.map(disc => {
      const students = getStudentsByDiscipline(disc.sheetName);
      const mfds = students.filter(s => !s.isTransferido && s.mfd > 0).map(s => s.mfd);
      const media = mfds.length > 0
        ? Math.round((mfds.reduce((a, b) => a + b, 0) / mfds.length) * 10) / 10
        : 0;

      return {
        disciplina: disc.name,
        media: media
      };
    });

    // --- Distribuição de comportamento ---
    const distribuicaoComportamento = {
      'Excelente': 0,
      'Bom': 0,
      'Regular': 0,
      'Insatisfatório': 0,
      'Crítico': 0
    };

    consolidated.forEach(a => {
      const comp = a.comportamentoGeral;
      if (comp && distribuicaoComportamento.hasOwnProperty(comp)) {
        distribuicaoComportamento[comp]++;
      }
    });

    // --- Distribuição por sexo ---
    const distribuicaoSexo = { F: 0, M: 0 };
    consolidated.forEach(a => {
      if (a.sexo === 'F') distribuicaoSexo.F++;
      else if (a.sexo === 'M') distribuicaoSexo.M++;
    });

    // --- Distribuição de resultados (1.ª disciplina como referência) ---
    const distribuicaoResultado = { aprovados: 0, reprovados: 0 };
    consolidated.forEach(a => {
      // Verificar resultado em qualquer disciplina
      const discs = Object.values(a.disciplinas);
      const temReprovacao = discs.some(d =>
        d.resultado && d.resultado.toUpperCase().includes('REPROVADO')
      );

      if (temReprovacao) {
        distribuicaoResultado.reprovados++;
      } else if (discs.some(d => d.resultado && d.resultado !== '')) {
        distribuicaoResultado.aprovados++;
      }
    });

    // --- Top 5 e Bottom 5 alunos ---
    const alunosComMedia = consolidated
      .filter(a => a.mediaGeral > 0)
      .sort((a, b) => b.mediaGeral - a.mediaGeral);

    const topAlunos = alunosComMedia.slice(0, 5).map(a => ({
      nome: a.nome,
      media: a.mediaGeral,
      sexo: a.sexo
    }));

    const bottomAlunos = alunosComMedia.slice(-5).reverse().map(a => ({
      nome: a.nome,
      media: a.mediaGeral,
      sexo: a.sexo
    }));

    const stats = {
      totalAlunos,
      totalDisciplinas,
      mediaGeral,
      alunosCriticos,
      mediasPorDisciplina,
      distribuicaoComportamento,
      distribuicaoSexo,
      distribuicaoResultado,
      topAlunos,
      bottomAlunos
    };

    // Guardar na cache
    cache.put('dashboardStats', JSON.stringify(stats), CONFIG.CACHE_TTL);

    Logger.log('Estatísticas calculadas com sucesso.');
    return stats;
  } catch (erro) {
    Logger.log('Erro ao calcular estatísticas: ' + erro.message);
    return { success: false, error: 'Erro ao calcular estatísticas: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Detalhe de um aluno
// ---------------------------------------------------------------------------

/**
 * Obtém o perfil completo de um aluno em todas as disciplinas.
 *
 * @param {string} studentName  Nome completo do aluno.
 * @return {Object|null}  Perfil detalhado ou null se não encontrado.
 */
function getStudentDetail(studentName) {
  try {
    if (!studentName) {
      return { success: false, error: 'Nome do aluno não fornecido.' };
    }

    const nameUpper = String(studentName).toUpperCase().trim();
    const disciplines = getDisciplines();
    let studentInfo = null;
    const disciplineData = {};

    disciplines.forEach(disc => {
      const students = getStudentsByDiscipline(disc.sheetName);
      const found = students.find(s => s.nome.toUpperCase().trim() === nameUpper);

      if (found) {
        if (!studentInfo) {
          studentInfo = {
            numero: found.numero,
            nome: found.nome,
            sexo: found.sexo
          };
        }

        disciplineData[disc.sheetName] = {
          trimestres: found.trimestres,
          mtFinal: found.mtFinal,
          mfd: found.mfd,
          resultado: found.resultado
        };
      }
    });

    if (!studentInfo) {
      Logger.log('Aluno não encontrado: ' + studentName);
      return null;
    }

    // Calcular média geral
    const mfds = Object.values(disciplineData)
      .filter(d => d.mfd > 0)
      .map(d => d.mfd);

    const mediaGeral = mfds.length > 0
      ? Math.round((mfds.reduce((a, b) => a + b, 0) / mfds.length) * 10) / 10
      : 0;

    // Comportamento geral
    const comps = [];
    Object.values(disciplineData).forEach(d => {
      d.trimestres.forEach(t => {
        if (t.comp) comps.push(t.comp);
      });
    });

    const comportamentoGeral = _getMostFrequent(comps) || '';

    // Dados da escola
    const schoolData = getSchoolData();

    const result = {
      ...studentInfo,
      disciplinas: disciplineData,
      mediaGeral,
      comportamentoGeral,
      escola: schoolData.escola || '',
      classe: schoolData.classe || '',
      ano: schoolData.ano || ''
    };

    Logger.log('Detalhe do aluno obtido: ' + studentName);
    return result;
  } catch (erro) {
    Logger.log('Erro ao obter detalhe do aluno: ' + erro.message);
    return { success: false, error: 'Erro ao obter detalhe: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Actualização de notas
// ---------------------------------------------------------------------------

/**
 * Actualiza uma nota específica numa célula da spreadsheet.
 *
 * @param {string} sheetName   Nome da tab da disciplina.
 * @param {number} studentRow  Linha do aluno (1-indexed, inclui offset do cabeçalho).
 * @param {number} column      Coluna (0-indexed).
 * @param {*}      value       Novo valor da nota.
 * @return {Object}  { success: boolean, error?: string }
 */
function updateGrade(sheetName, studentRow, column, value) {
  try {
    if (!sheetName || !studentRow || column === undefined || column === null) {
      return { success: false, error: 'Parâmetros insuficientes.' };
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: false, error: 'Tab "' + sheetName + '" não encontrada.' };
    }

    // studentRow já inclui o offset de cabeçalho (1-indexed)
    // column é 0-indexed, a API do Sheets usa 1-indexed
    const cell = sheet.getRange(studentRow, column + 1);
    cell.setValue(value);

    // Invalidar cache
    _invalidateCache(sheetName);

    Logger.log('Nota actualizada: ' + sheetName + ' [' + studentRow + ',' + column + '] = ' + value);
    return { success: true };
  } catch (erro) {
    Logger.log('Erro ao actualizar nota: ' + erro.message);
    return { success: false, error: 'Erro ao actualizar nota: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Actualização de comportamento
// ---------------------------------------------------------------------------

/**
 * Actualiza o comportamento de um aluno num trimestre específico.
 *
 * @param {string} sheetName   Nome da tab da disciplina.
 * @param {number} studentRow  Linha do aluno (1-indexed, inclui offset do cabeçalho).
 * @param {number} trimester   Trimestre (1, 2 ou 3).
 * @param {string} value       Valor do comportamento.
 * @return {Object}  { success: boolean, error?: string }
 */
function updateBehavior(sheetName, studentRow, trimester, value) {
  try {
    if (!sheetName || !studentRow || !trimester || !value) {
      return { success: false, error: 'Parâmetros insuficientes.' };
    }

    // Mapear trimestre → coluna de comportamento (0-indexed)
    const compColumns = { 1: 11, 2: 20, 3: 29 };
    const col = compColumns[trimester];

    if (col === undefined) {
      return { success: false, error: 'Trimestre inválido: ' + trimester };
    }

    // Validar valor
    const valoresValidos = ['Excelente', 'Bom', 'Regular', 'Insatisfatório', 'Crítico'];
    if (!valoresValidos.includes(value)) {
      return {
        success: false,
        error: 'Comportamento inválido. Valores aceites: ' + valoresValidos.join(', ')
      };
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: false, error: 'Tab "' + sheetName + '" não encontrada.' };
    }

    // A API do Sheets usa colunas 1-indexed
    const cell = sheet.getRange(studentRow, col + 1);
    cell.setValue(value);

    // Invalidar cache
    _invalidateCache(sheetName);

    Logger.log('Comportamento actualizado: ' + sheetName + ' [' + studentRow + '] T' + trimester + ' = ' + value);
    return { success: true };
  } catch (erro) {
    Logger.log('Erro ao actualizar comportamento: ' + erro.message);
    return { success: false, error: 'Erro ao actualizar comportamento: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Limpar cache
// ---------------------------------------------------------------------------

/**
 * Limpa toda a cache de dados.
 * Útil após edições para forçar releitura.
 *
 * @return {Object}  { success: true }
 */
function clearAllCache() {
  try {
    const cache = CacheService.getScriptCache();
    const keys = [
      'schoolData',
      'dashboardStats',
      'allStudentsConsolidated'
    ];

    // Também limpar cache das disciplinas
    const disciplines = getDisciplines();
    disciplines.forEach(d => {
      keys.push('students_' + d.sheetName);
    });

    cache.removeAll(keys);
    Logger.log('Cache limpa: ' + keys.length + ' chaves removidas.');
    return { success: true };
  } catch (erro) {
    Logger.log('Erro ao limpar cache: ' + erro.message);
    return { success: false, error: erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Funções auxiliares (privadas)
// ---------------------------------------------------------------------------

/**
 * Encontra o valor mais frequente num array.
 *
 * @param {Array<string>} arr  Array de strings.
 * @return {string|null}  Valor mais frequente ou null.
 * @private
 */
function _getMostFrequent(arr) {
  if (!arr || arr.length === 0) return null;

  const freq = {};
  let maxCount = 0;
  let maxVal = null;

  arr.forEach(val => {
    if (!val) return;
    freq[val] = (freq[val] || 0) + 1;
    if (freq[val] > maxCount) {
      maxCount = freq[val];
      maxVal = val;
    }
  });

  return maxVal;
}

/**
 * Invalida a cache relacionada com uma disciplina.
 *
 * @param {string} sheetName  Nome da tab modificada.
 * @private
 */
function _invalidateCache(sheetName) {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll([
      'students_' + sheetName,
      'allStudentsConsolidated',
      'dashboardStats'
    ]);
    Logger.log('Cache invalidada para: ' + sheetName);
  } catch (e) {
    Logger.log('Aviso: não foi possível invalidar cache: ' + e.message);
  }
}

/**
 * Marca ou desmarca um aluno como Transferido em TODAS as disciplinas.
 * @param {string} studentName Nome do aluno (limpo)
 * @param {boolean} isTransferred true se foi transferido, false caso contr�rio
 */
function markStudentAsTransferred(studentName, isTransferred) {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const searchName = String(studentName || "").toUpperCase().trim();

    if (!searchName) throw new Error("Nome do aluno n�o fornecido.");

    let updated = 0;

    sheets.forEach(sheet => {
      // Ignorar abas ocultas ou que n�o sejam disciplinas
      const name = sheet.getName();
      if (name.includes("Pauta") || name.includes("Dashboard") || name.includes("Acta")) return;

      const data = sheet.getDataRange().getValues();
      for (let i = 4; i < data.length; i++) {
        let currentName = String(data[i][1] || "").trim();
        if (!currentName) continue;

        let cleanName = currentName.replace(/\(?TRANSFERIDO\)?/gi, "").trim().toUpperCase();

        if (cleanName === searchName) {
          if (isTransferred) {
            if (!currentName.toUpperCase().includes("TRANSFERIDO")) {
              sheet.getRange(i + 1, 2).setValue(currentName + " (TRANSFERIDO)");
              updated++;
            }
          } else {
            if (currentName.toUpperCase().includes("TRANSFERIDO")) {
              let restoredName = currentName.replace(/\s*\(?TRANSFERIDO\)?/gi, "").trim();
              sheet.getRange(i + 1, 2).setValue(restoredName);
              updated++;
            }
          }
          break; // Avan�ar para a pr�xima disciplina
        }
      }
    });

    // Limpar as caches
    clearAllCache();

    return { success: true, updatedSheets: updated };
  } catch (error) {
    Logger.log("Erro em markStudentAsTransferred: " + error.message);
    throw error;
  }
}

