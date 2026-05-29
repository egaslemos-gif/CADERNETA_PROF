const MockData = {
  getSchoolData: () => ({
    escola: 'ESCOLA BASICA DE MACURUNCO',
    endereco: 'Beira, Sofala',
    contacto: '258 861234567',
    professor: 'Pascoa da Graca Ramim',
    directorPedagogico: 'Mario Lacerda',
    director: 'Maria Manuela',
    logotipo: 'https://drive.google.com/file/d/1IMeX9UMP7mTmgi1X4gwjM315SQa5ofvE/view?usp=drive_link',
    classe: '4ª',
    periodo: 'manhã',
    ano: '2026',
    comportamentos: [
      { nivel: 'Excelente', significado: 'comportamento exemplar e consistente' },
      { nivel: 'Bom', significado: 'comportamento adequado' },
      { nivel: 'Regular', significado: 'comportamento aceitável' },
      { nivel: 'Insatisfatório', significado: 'comportamento precisa melhorar' },
      { nivel: 'Crítico', significado: 'comportamento inaceitável' }
    ]
  }),

  getDisciplines: () => [
    { name: 'PORTUGUES', sheetName: 'PORTUGUES' },
    { name: 'MATEMATICA', sheetName: 'MATEMATICA' },
    { name: 'CIENCIAS NATURAIS', sheetName: 'CIENCIAS NATURAIS' },
    { name: 'CIENCIAS SOCIAIS', sheetName: 'CIENCIAS SOCIAIS' }
  ],

  _rawStudents: [
    { n: 1, nome: "ALICIA CONSTANT", p: 10, m: 10, cn: 9, cs: 8, sx: "F" },
    { n: 2, nome: "ALICIA OLIVA", p: 16, m: 15, cn: 15, cs: 15, sx: "F", comp: "Excelente" },
    { n: 3, nome: "ALICIA GIGANTE", p: 7, m: 12, cn: 6, cs: 10, sx: "F" },
    { n: 4, nome: "ALIMO ALDO", p: 8, m: 14, cn: 9, cs: 11, sx: "M" },
    { n: 5, nome: "AGELINA ANDRE", p: 11, m: 12, cn: 7, cs: 8, sx: "F" },
    { n: 6, nome: "ANTONIA MARAUSSA", p: 13, m: 15, cn: 13, cs: 11, sx: "F" },
    { n: 7, nome: "ANTONIA MARCOS", p: 8, m: 11, cn: 10, cs: 6, sx: "F" },
    { n: 8, nome: "AUZENDA", p: 9, m: 14, cn: 9, cs: 10, sx: "F" },
    { n: 9, nome: "CHAQUILA", p: 14, m: 15, cn: 14, cs: 12, sx: "F" },
    { n: 10, nome: "CHAULANA", p: 13, m: 11, cn: 9, cs: 9, sx: "F" },
    { n: 11, nome: "CHELSEA", p: 8, m: 11, cn: 6, cs: 5, sx: "F" },
    { n: 12, nome: "CRISTOVAO", p: 11, m: 15, cn: 11, cs: 10, sx: "M" },
    { n: 13, nome: "DANIEL ANTONIO", p: 14, m: 17, cn: 14, cs: 10, sx: "M" },
    { n: 14, nome: "DANIEL FLAVIO", p: 11, m: 12, cn: 10, cs: 13, sx: "M" },
    { n: 15, nome: "DIANA", p: 10, m: 13, cn: 9, cs: 12, sx: "F" },
    { n: 16, nome: "DORA", p: 9, m: 12, cn: 11, cs: 13, sx: "F" },
    { n: 17, nome: "ELIDIO", p: 14, m: 14, cn: 14, cs: 15, sx: "M" },
    { n: 18, nome: "ELISABETH", p: 7, m: 10, cn: 6, cs: 8, sx: "F" },
    { n: 19, nome: "EMA", p: 11, m: 13, cn: 8, cs: 9, sx: "F" },
    { n: 20, nome: "ESTER FERNADO", p: 15, m: 13, cn: 15, cs: 15, sx: "F", comp: "Bom" },
    { n: 21, nome: "ESTER FIBIONE", p: 7, m: 11, cn: 6, cs: 5, sx: "F" },
    { n: 22, nome: "EUGENIO", p: 13, m: 16, cn: 15, cs: 17, sx: "M" },
    { n: 23, nome: "FANIA", p: 14, m: 16, cn: 15, cs: 15, sx: "F" },
    { n: 24, nome: "FERNANDO", p: 13, m: 17, cn: 14, cs: 16, sx: "M" },
    { n: 25, nome: "GABRIEL", p: 10, m: 14, cn: 11, cs: 13, sx: "M" },
    { n: 26, nome: "GINA", p: 14, m: 13, cn: 13, cs: 15, sx: "F", comp: "Bom" },
    { n: 27, nome: "GRAÇA", p: 7, m: 9, cn: 7, cs: 7, sx: "F" },
    { n: 28, nome: "HELIANDRA", p: 12, m: 14, cn: 14, cs: 11, sx: "F" },
    { n: 29, nome: "ISABEL", p: 8, m: 14, cn: 8, cs: 8, sx: "F" },
    { n: 30, nome: "ISAQUE", p: 12, m: 10, cn: 11, cs: 10, sx: "M" },
    { n: 31, nome: "IBRAIMO", p: 7, m: 12, cn: 12, cs: 7, sx: "M" },
    { n: 32, nome: "JOSE", p: 11, m: 14, cn: 13, cs: 8, sx: "M" },
    { n: 33, nome: "JOYCE", p: 7, m: 9, cn: 8, cs: 9, sx: "F" },
    { n: 34, nome: "JULIA JULIO", p: 8, m: 11, cn: 9, cs: 7, sx: "F" },
    { n: 35, nome: "JULIETA MAGUMISSE", p: 11, m: 13, cn: 13, cs: 13, sx: "F" },
    { n: 36, nome: "JULIETA MAHANHICE", p: 7, m: 8, cn: 7, cs: 6, sx: "F" },
    { n: 37, nome: "KEYLLEN", p: 9, m: 10, cn: 9, cs: 10, sx: "F" },
    { n: 38, nome: "KENIUSIA", p: 12, m: 11, cn: 7, cs: 12, sx: "F" },
    { n: 39, nome: "LASMI", p: 8, m: 10, cn: 8, cs: 7, sx: "F" },
    { n: 40, nome: "LAURA DAVID", p: 11, m: 13, cn: 9, cs: 9, sx: "F" },
    { n: 41, nome: "LAURA ZITO", p: 7, m: 10, cn: 5, cs: 8, sx: "F" },
    { n: 42, nome: "LUCRECIA", p: 7, m: 6, cn: 7, cs: 8, sx: "F" },
    { n: 43, nome: "LUIS", p: 12, m: 16, cn: 15, cs: 14, sx: "M" },
    { n: 44, nome: "MANUEL JOAO", p: 12, m: 16, cn: 10, cs: 13, sx: "M" },
    { n: 45, nome: "MANUELA RESPEITO", p: 15, m: 13, cn: 13, cs: 16, sx: "F" },
    { n: 46, nome: "MARLON", p: 9, m: 15, cn: 9, cs: 9, sx: "M" },
    { n: 47, nome: "MIGUEL", p: 9, m: 11, cn: 10, cs: 12, sx: "M" },
    { n: 48, nome: "MODESTO", p: 7, m: 14, cn: 7, cs: 10, sx: "M" },
    { n: 49, nome: "NELITO", p: 7, m: 13, cn: 5, cs: 7, sx: "M" },
    { n: 50, nome: "ORLANDO", p: 13, m: 16, cn: 11, cs: 9, sx: "M" },
    { n: 51, nome: "OTILIA", p: 16, m: 15, cn: 16, cs: 15, sx: "F" },
    { n: 52, nome: "ROSETA", p: 15, m: 17, cn: 15, cs: 16, sx: "F" },
    { n: 53, nome: "ROSITA", p: 7, m: 8, cn: 6, cs: 8, sx: "F" },
    { n: 54, nome: "RUTE", p: 9, m: 12, cn: 9, cs: 5, sx: "F" },
    { n: 55, nome: "TERESA", p: 10, m: 8, cn: 8, cs: 11, sx: "F" },
    { n: 56, nome: "VERNIA", p: 10, m: 13, cn: 14, cs: 11, sx: "F" },
    { n: 57, nome: "YOLAIM", p: 12, m: 13, cn: 11, cs: 14, sx: "F" },
    { n: 58, nome: "YUMI", p: 7, m: 7, cn: 6, cs: 7, sx: "F" },
    { n: 59, nome: "JONATAS", p: 17, m: 18, cn: 17, cs: 13, sx: "M" },
    { n: 60, nome: "ZINIA", p: 19, m: 17, cn: 18, cs: 18, sx: "F" },
    { n: 61, nome: "JULIANA", p: 7, m: 9, cn: 7, cs: 8, sx: "F" }
  ],

  _mapDisciplineData(sheetName) {
    const fieldMap = { 'PORTUGUES': 'p', 'MATEMATICA': 'm', 'CIENCIAS NATURAIS': 'cn', 'CIENCIAS SOCIAIS': 'cs' };
    const field = fieldMap[sheetName];
    return this._rawStudents.map(s => {
      const mt = s[field];
      const comp = s.comp || 'Regular';
      return {
        numero: s.n,
        nome: s.nome,
        sexo: s.sx,
        trimestres: [
          { acs: [mt-1, mt, mt+1, mt], macs: mt, at: mt, mt: mt, comp: comp },
          { acs: [], macs: 0, at: 0, mt: 0, comp: '' },
          { acs: [], macs: 0, at: 0, mt: 0, comp: '' }
        ],
        mtFinal: [mt, 0, 0],
        mfd: mt,
        resultado: mt >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)'
      };
    });
  },

  getStudentsByDiscipline: function(sheetName) {
    return this._mapDisciplineData(sheetName);
  },

  getAllStudentsConsolidated: function() {
    return this._rawStudents.map(s => {
      const p = s.p, m = s.m, cn = s.cn, cs = s.cs;
      const media = (p + m + cn + cs) / 4;
      const comp = s.comp || 'Regular';
      return {
        numero: s.n,
        nome: s.nome,
        sexo: s.sx,
        disciplinas: {
          'PORTUGUES': { mt1: p, mt2: 0, mt3: 0, mfd: p, comp: comp, resultado: p >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)' },
          'MATEMATICA': { mt1: m, mt2: 0, mt3: 0, mfd: m, comp: comp, resultado: m >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)' },
          'CIENCIAS NATURAIS': { mt1: cn, mt2: 0, mt3: 0, mfd: cn, comp: comp, resultado: cn >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)' },
          'CIENCIAS SOCIAIS': { mt1: cs, mt2: 0, mt3: 0, mfd: cs, comp: comp, resultado: cs >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)' }
        },
        mediaGeral: media,
        comportamentoGeral: comp,
        resultadoGeral: media >= 9.5 ? 'APROVADO(A)' : 'REPROVADO(A)'
      };
    });
  },

  getDashboardStats: function() {
    const students = this.getAllStudentsConsolidated();
    const mediaGeral = students.reduce((acc, s) => acc + s.mediaGeral, 0) / students.length;
    const criticos = students.filter(s => s.mediaGeral < 9.5).length;

    const comps = { Excelente: 0, Bom: 0, Regular: 0, Insatisfatório: 0, Crítico: 0 };
    const sexos = { M: 0, F: 0 };
    let p_total = 0, m_total = 0, cn_total = 0, cs_total = 0;

    students.forEach(s => {
      comps[s.comportamentoGeral]++;
      sexos[s.sexo]++;
      p_total += s.disciplinas['PORTUGUES'].mfd;
      m_total += s.disciplinas['MATEMATICA'].mfd;
      cn_total += s.disciplinas['CIENCIAS NATURAIS'].mfd;
      cs_total += s.disciplinas['CIENCIAS SOCIAIS'].mfd;
    });

    const sorted = [...students].sort((a, b) => b.mediaGeral - a.mediaGeral);

    return {
      totalAlunos: students.length,
      totalDisciplinas: 4,
      mediaGeral: mediaGeral,
      alunosCriticos: criticos,
      mediasPorDisciplina: [
        { disciplina: 'PORTUGUES', media: p_total / students.length },
        { disciplina: 'MATEMATICA', media: m_total / students.length },
        { disciplina: 'CIENCIAS NATURAIS', media: cn_total / students.length },
        { disciplina: 'CIENCIAS SOCIAIS', media: cs_total / students.length }
      ],
      distribuicaoComportamento: comps,
      distribuicaoSexo: sexos,
      topAlunos: sorted.slice(0, 5),
      bottomAlunos: sorted.slice(-5).reverse()
    };
  },

  _mockUsers: [
    { username: 'admin', email: 'admin@gmail.com', password: 'admin2026', nome: 'admin', roleStr: 'Administrador(a)' },
    { username: 'diretor', email: 'dir@gmail.com', password: 'dir2026', nome: 'diretor', roleStr: 'Director(a)' },
    { username: 'professor', email: 'prof@gmail.com', password: 'prof2026', nome: 'professor', roleStr: 'Professor(a)' },
    { username: 'pramim', email: 'pascoaramim409@gmail.com', password: 'prof2026', nome: 'Pascoa Ramim', roleStr: 'Professor(a)' }
  ],
  
  _mapRole(roleStr) {
    const s = String(roleStr).toLowerCase();
    if (s.includes('admin')) return 'admin';
    if (s.includes('direct') || s.includes('diret')) return 'direcao';
    return 'professor';
  },

  authenticate: function(u, p) {
    const user = this._mockUsers.find(x => x.username === u && x.password === p);
    if (user) {
      const role = this._mapRole(user.roleStr);
      return { success: true, user: { nome: user.nome, role: role, avatar: Utils.getInitials(user.nome) } };
    }
    return { success: false, message: 'Credenciais inválidas' };
  },

  authenticateWithGoogle: function(email) {
    const user = this._mockUsers.find(x => x.email === email);
    if (user) {
      const role = this._mapRole(user.roleStr);
      return { success: true, user: { nome: user.nome, role: role, avatar: Utils.getInitials(user.nome) } };
    }
    return { success: false, message: 'Este email não está autorizado no sistema. Contacte a direção.' };
  },

  updateGrade: function(sheetName, numero, trimester, column, value) {
    const student = this._rawStudents.find(s => s.n === numero);
    if (!student) return { success: false, message: 'Aluno não encontrado' };
    
    // In a real app we'd map this better, but for mock let's just update the main mfd field loosely
    // The real implementation in GAS will do the proper cell update
    const fieldMap = { 'PORTUGUES': 'p', 'MATEMATICA': 'm', 'CIENCIAS NATURAIS': 'cn', 'CIENCIAS SOCIAIS': 'cs' };
    const field = fieldMap[sheetName];
    if (column === 'mt') {
      student[field] = value;
    }
    return { success: true };
  },

  updateBehavior: function(sheetName, numero, trimester, value) {
    const student = this._rawStudents.find(s => s.n === numero);
    if (!student) return { success: false, message: 'Aluno não encontrado' };
    student.comp = value;
    return { success: true };
  },

  generateAndSavePautaPDF: () => ({ success: true, pdfUrl: '#', fileName: 'Pauta_Mock.pdf' }),
  generateAndSaveBoletimPDF: () => ({ success: true, pdfUrl: '#', fileName: 'Boletim_Mock.pdf' }),
  listSavedPDFs: () => []
};

// ================= GLOBAL API AND UTILS =================

const API = {
  isGAS: typeof google !== 'undefined' && google.script,
  
  call(functionName, ...args) {
    return new Promise((resolve, reject) => {
      if (this.isGAS) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          [functionName](...args);
      } else {
        const mockFn = MockData[functionName];
        if(!mockFn) return reject(new Error('Mock fn not found: ' + functionName));
        setTimeout(() => resolve(mockFn.apply(MockData, args)), 300 + Math.random() * 500);
      }
    });
  },

  authenticate: (u, p) => API.call('authenticate', u, p),
  authenticateWithGoogle: (email) => API.call('authenticateWithGoogle', email),
  getSchoolData: () => API.call('getSchoolData'),
  getDisciplines: () => API.call('getDisciplines'),
  getStudentsByDiscipline: (s) => API.call('getStudentsByDiscipline', s),
  getAllStudentsConsolidated: () => API.call('getAllStudentsConsolidated'),
  getDashboardStats: () => API.call('getDashboardStats'),
  generatePautaPDF: (d, t) => API.call('generateAndSavePautaPDF', d, t),
  generateBoletimPDF: (s, t) => API.call('generateAndSaveBoletimPDF', s, t),
  listPDFs: () => API.call('listSavedPDFs'),
  updateGrade: (s, num, t, c, v) => API.call('updateGrade', s, num, t, c, v),
  updateBehavior: (s, num, t, v) => API.call('updateBehavior', s, num, t, v)
};

// Utilities
const Utils = {
  dataTablesPT: {
    emptyTable: "Não foi encontrado nenhum registo",
    info: "A mostrar _START_ até _END_ de _TOTAL_ registos",
    infoEmpty: "A mostrar 0 até 0 de 0 registos",
    infoFiltered: "(filtrado de _MAX_ registos no total)",
    infoPostFix: "",
    thousands: ".",
    lengthMenu: "Mostrar _MENU_ registos",
    loadingRecords: "A carregar...",
    processing: "A processar...",
    search: "Pesquisar:",
    zeroRecords: "Não foram encontrados registos compatíveis",
    paginate: {
      first: "Primeiro",
      last: "Último",
      next: "Seguinte",
      previous: "Anterior"
    },
    aria: {
      sortAscending: ": ativar para ordenar a coluna de forma ascendente",
      sortDescending: ": ativar para ordenar a coluna de forma descendente"
    }
  },

  getInitials: (name) => {
    if(!name) return '??';
    const parts = name.trim().split(' ');
    if(parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  },
  
  getAvatarColor: (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 65%, 45%)`;
  },
  
  getBehaviorBadge: (comp) => {
    const map = {
      'Excelente': 'badge-excelente',
      'Bom': 'badge-bom',
      'Regular': 'badge-regular',
      'Insatisfatório': 'badge-insatisfatorio',
      'Crítico': 'badge-critico'
    };
    return `<span class="badge ${map[comp] || 'badge-regular'}">${comp}</span>`;
  },
  
  getGradeBadge: (grade) => {
    const val = parseFloat(grade) || 0;
    let cls = val >= 14 ? 'bg-success' : (val >= 9.5 ? 'bg-info text-dark' : 'bg-danger');
    return `<span class="badge ${cls}">${val.toFixed(1)}</span>`;
  },
  
  formatNumber: (n) => parseFloat(n).toFixed(1).replace('.', ','),
  
  showLoading: () => document.getElementById('loading-overlay').style.display = 'flex',
  hideLoading: () => document.getElementById('loading-overlay').style.display = 'none',
  
  showToast: (title, icon='success') => {
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title, icon });
  }
};
