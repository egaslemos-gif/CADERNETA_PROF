/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — Code.gs
 *  Ponto de entrada principal da aplicação web
 * ============================================================
 *  Contém doGet(), doPost(), include() e configuração global.
 *  Suporta chamadas REST via ?action=xxx para o frontend local.
 * ============================================================
 */

/**
 * Configuração global da aplicação.
 * @const {Object}
 */
const CONFIG = {
  /** ID da folha de calculo real. */
  SPREADSHEET_ID: '1AxtTnKLW0F0WR3P7kY7aldMXd_-bYrvcK5bQu8frpNQ',
  /** Propriedade opcional para projectos que nao estejam vinculados a uma folha. */
  SPREADSHEET_ID_PROPERTY: 'SPREADSHEET_ID',
  /** Nome da aplicação */
  APP_NAME: 'Caderneta Escolar Digital',
  /** Versão actual */
  VERSION: '1.0.0',
  /** Ano lectivo */
  SCHOOL_YEAR: 2026,
  /** Duração da cache em segundos (5 min) */
  CACHE_TTL: 300,
  /** Nome da pasta raiz no Drive */
  DRIVE_ROOT_FOLDER: 'Pautas Escolares'
};

// ---------------------------------------------------------------------------
//  doGet  —  ponto de entrada HTTP GET
// ---------------------------------------------------------------------------

/**
 * Serve a interface HTML quando acedido sem parâmetros,
 * ou actua como API REST quando chamado com ?action=xxx.
 *
 * @param {Object} e  Objecto de evento fornecido pelo Apps Script.
 * @return {HtmlOutput|TextOutput}  Página HTML ou resposta JSON.
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : null;

    // ---------- Modo API: ?action=xxx ----------
    if (action) {
      return _handleApiRequest(action, e.parameter);
    }

    // ---------- Modo normal: servir HTML ----------
    const template = HtmlService.createTemplateFromFile('app');
    const output = template.evaluate();

    output
      .setTitle(CONFIG.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    return output;
  } catch (erro) {
    Logger.log('Erro em doGet: ' + erro.message);
    // Se era uma chamada API, devolver erro JSON
    if (e && e.parameter && e.parameter.action) {
      return _jsonOutput({ success: false, error: erro.message });
    }
    return HtmlService.createHtmlOutput(
      '<h1>Erro ao carregar a aplicação</h1><p>' + erro.message + '</p>'
    );
  }
}

// ---------------------------------------------------------------------------
//  doPost  —  ponto de entrada HTTP POST (API JSON)
// ---------------------------------------------------------------------------

/**
 * Processa pedidos POST em formato JSON.
 * Estrutura esperada do body: { action: 'nomeDaFuncao', params: {...} }
 *
 * @param {Object} e  Objecto de evento com postData.
 * @return {TextOutput}  Resposta JSON.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const params = body.params || {};

    return _handleApiRequest(action, params);
  } catch (erro) {
    Logger.log('Erro em doPost: ' + erro.message);
    return _jsonOutput({ success: false, error: erro.message });
  }
}

// ---------------------------------------------------------------------------
//  _handleApiRequest  —  router central para chamadas API
// ---------------------------------------------------------------------------

/**
 * Encaminha chamadas API para as funções correctas.
 *
 * @param {string} action  Nome da acção.
 * @param {Object} params  Parâmetros da chamada.
 * @return {TextOutput}    Resposta JSON.
 * @private
 */
function _handleApiRequest(action, params) {
  /** Mapa de acções permitidas */
  const actions = {
    // Dados gerais
    getSchoolData:              () => getSchoolData(),
    getDisciplines:             () => getDisciplines(),
    getStudentsByDiscipline:    () => getStudentsByDiscipline(params.sheetName),
    getAllStudentsConsolidated:  () => getAllStudentsConsolidated(),
    getDashboardStats:          () => getDashboardStats(),
    getStudentDetail:           () => getStudentDetail(params.studentName),

    // Autenticação
    authenticate:               () => authenticate(params.username, params.password),
    authenticateWithGoogle:      () => authenticateWithGoogle(params.email),

    // Escrita
    updateGrade:    () => updateGrade(params.sheetName, params.studentRow, params.column, params.value),
    updateBehavior: () => updateBehavior(params.sheetName, params.studentRow, params.trimester, params.value),
    batchUpdate:    () => batchUpdate(params.sheetName, params.updates),
    markStudentAsTransferred: () => markStudentAsTransferred(params.studentName, params.isTransferred),

    // PDF / Drive
    generateAndSavePautaPDF:    () => typeof generateAndSavePautaPDF === 'function' ? generateAndSavePautaPDF(params.disciplina, params.trimestre) : { success: false, error: 'PDF service não disponível' },
    generateAndSaveBoletimPDF:  () => typeof generateAndSaveBoletimPDF === 'function' ? generateAndSaveBoletimPDF(params.studentName, params.trimestre) : { success: false, error: 'PDF service não disponível' },
    listSavedPDFs:              () => typeof listSavedPDFs === 'function' ? listSavedPDFs() : [],

    // Cache
    clearAllCache:              () => clearAllCache()
  };

  if (!actions[action]) {
    return _jsonOutput({ success: false, error: 'Acção desconhecida: ' + action });
  }

  const result = actions[action]();
  return _jsonOutput({ success: true, data: result });
}

// ---------------------------------------------------------------------------
//  include  —  inclusão de ficheiros HTML parciais (CSS / JS)
// ---------------------------------------------------------------------------

/**
 * Inclui o conteúdo de um ficheiro HTML no template.
 * Utilizado com a sintaxe <?!= include('ficheiro') ?> nos templates.
 *
 * @param {string} filename  Nome do ficheiro (sem extensão .html).
 * @return {string}  Conteúdo HTML do ficheiro.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ---------------------------------------------------------------------------
//  Utilitários internos
// ---------------------------------------------------------------------------

/**
 * Cria uma resposta JSON para doPost/doGet API.
 * Inclui headers CORS para permitir chamadas do frontend local.
 *
 * @param {Object} data  Objecto a serializar.
 * @return {TextOutput}  Resposta com ContentType JSON.
 * @private
 */
function _jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Retorna o ID configurado por propriedade do script ou por CONFIG.
 *
 * @return {string} ID configurado, ou string vazia para usar a folha vinculada.
 */
function getConfiguredSpreadsheetId() {
  try {
    const propertyId = PropertiesService
      .getScriptProperties()
      .getProperty(CONFIG.SPREADSHEET_ID_PROPERTY);

    return String(propertyId || CONFIG.SPREADSHEET_ID || '').trim();
  } catch (e) {
    // Se PropertiesService não estiver disponível, usar CONFIG directamente
    return String(CONFIG.SPREADSHEET_ID || '').trim();
  }
}

/**
 * Retorna o ID da folha de calculo configurada ou da activa.
 *
 * @return {string}  ID da spreadsheet.
 */
function getSpreadsheetId() {
  const configuredId = getConfiguredSpreadsheetId();
  if (configuredId) {
    return configuredId;
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!activeSpreadsheet) {
    throw new Error(
      'Folha de calculo nao configurada. Defina a propriedade SPREADSHEET_ID.'
    );
  }

  return activeSpreadsheet.getId();
}
