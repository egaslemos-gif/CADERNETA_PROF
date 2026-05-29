/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — Code.gs
 *  Ponto de entrada principal da aplicação web
 * ============================================================
 *  Contém doGet(), doPost(), include() e configuração global.
 * ============================================================
 */

/**
 * Configuração global da aplicação.
 * @const {Object}
 */
const CONFIG = {
  /** ID da folha de calculo privada. Vazio ate receber o link original valido. */
  SPREADSHEET_ID: null,
  /** Propriedade opcional para projectos que nao estejam vinculados a uma folha. */
  SPREADSHEET_ID_PROPERTY: 'SPREADSHEET_ID',
  /** Fonte temporaria, somente leitura, para login enquanto a folha privada e configurada. */
  AUTH_USERS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuj9HZFNSEYujihqPlMPY8xX-2NoqGMAqLUXum2ON_ZU3yvhSI6_PbqugcdnHFw5O8dI6fyc0aCLc/pub?gid=1315794932&single=true&output=csv',
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
 * Serve a interface HTML quando o utilizador acede ao URL da web app.
 *
 * @param {Object} e  Objecto de evento fornecido pelo Apps Script.
 * @return {HtmlOutput}  Página HTML renderizada.
 */
function doGet(e) {
  try {
    const template = HtmlService.createTemplateFromFile('index');
    const output = template.evaluate();

    output
      .setTitle(CONFIG.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    return output;
  } catch (erro) {
    Logger.log('Erro em doGet: ' + erro.message);
    return HtmlService.createHtmlOutput(
      '<h1>Erro ao carregar a aplicação</h1><p>' + erro.message + '</p>'
    );
  }
}

// ---------------------------------------------------------------------------
//  doPost  —  ponto de entrada HTTP POST (API JSON, uso futuro)
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

    /** Mapa de acções permitidas via POST */
    const actions = {
      getSchoolData: () => getSchoolData(),
      getDisciplines: () => getDisciplines(),
      getStudentsByDiscipline: () => getStudentsByDiscipline(params.sheetName),
      getAllStudentsConsolidated: () => getAllStudentsConsolidated(),
      getDashboardStats: () => getDashboardStats(),
      getStudentDetail: () => getStudentDetail(params.studentName),
      updateGrade: () => updateGrade(params.sheetName, params.studentRow, params.column, params.value),
      updateBehavior: () => updateBehavior(params.sheetName, params.studentRow, params.trimester, params.value),
      authenticate: () => authenticate(params.username, params.password)
    };

    if (!actions[action]) {
      return _jsonOutput({ success: false, error: 'Acção desconhecida: ' + action });
    }

    const result = actions[action]();
    return _jsonOutput({ success: true, data: result });
  } catch (erro) {
    Logger.log('Erro em doPost: ' + erro.message);
    return _jsonOutput({ success: false, error: erro.message });
  }
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
 * Cria uma resposta JSON para doPost.
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
  const propertyId = PropertiesService
    .getScriptProperties()
    .getProperty(CONFIG.SPREADSHEET_ID_PROPERTY);

  return String(propertyId || CONFIG.SPREADSHEET_ID || '').trim();
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
