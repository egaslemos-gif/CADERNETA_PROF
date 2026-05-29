/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — DriveService.gs
 *  Serviço de integração com o Google Drive
 * ============================================================
 *  Gere a estrutura de pastas e o armazenamento de PDFs.
 * ============================================================
 */

// ---------------------------------------------------------------------------
//  Constantes internas
// ---------------------------------------------------------------------------

/** @const {string} Nome da pasta raiz no Drive */
const DRIVE_ROOT_NAME = 'Pautas Escolares';

// ---------------------------------------------------------------------------
//  Estrutura de pastas
// ---------------------------------------------------------------------------

/**
 * Garante que toda a estrutura de pastas existe no Drive.
 * Cria: /Pautas Escolares/<ano>/1_Trimestre, 2_Trimestre, 3_Trimestre
 *
 * @param {number} [year]  Ano lectivo (defeito: CONFIG.SCHOOL_YEAR).
 * @return {Object}  Referências às pastas { root, year, trimestres: [folder1, folder2, folder3] }.
 */
function ensureFolderStructure(year) {
  try {
    const ano = year || CONFIG.SCHOOL_YEAR;
    const rootFolder = getRootFolder();
    const yearFolder = getYearFolder(ano);

    const trimestres = [1, 2, 3].map(t => getTrimesterFolder(ano, t));

    Logger.log('Estrutura de pastas garantida para ' + ano);

    return {
      root: rootFolder,
      year: yearFolder,
      trimestres: trimestres
    };
  } catch (erro) {
    Logger.log('Erro ao criar estrutura de pastas: ' + erro.message);
    throw new Error('Não foi possível criar a estrutura de pastas: ' + erro.message);
  }
}

// ---------------------------------------------------------------------------
//  Pasta raiz
// ---------------------------------------------------------------------------

/**
 * Obtém ou cria a pasta raiz 'Pautas Escolares' no Drive.
 *
 * @return {Folder}  Referência à pasta raiz.
 */
function getRootFolder() {
  try {
    const folders = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);

    if (folders.hasNext()) {
      const folder = folders.next();
      Logger.log('Pasta raiz encontrada: ' + folder.getId());
      return folder;
    }

    // Criar pasta raiz
    const newFolder = DriveApp.createFolder(DRIVE_ROOT_NAME);
    Logger.log('Pasta raiz criada: ' + newFolder.getId());
    return newFolder;
  } catch (erro) {
    Logger.log('Erro ao obter pasta raiz: ' + erro.message);
    throw erro;
  }
}

// ---------------------------------------------------------------------------
//  Pasta do ano
// ---------------------------------------------------------------------------

/**
 * Obtém ou cria a subpasta do ano lectivo.
 *
 * @param {number} year  Ano lectivo.
 * @return {Folder}  Referência à pasta do ano.
 */
function getYearFolder(year) {
  try {
    const rootFolder = getRootFolder();
    const yearName = String(year);
    const subFolders = rootFolder.getFoldersByName(yearName);

    if (subFolders.hasNext()) {
      return subFolders.next();
    }

    const newFolder = rootFolder.createFolder(yearName);
    Logger.log('Pasta do ano criada: ' + yearName);
    return newFolder;
  } catch (erro) {
    Logger.log('Erro ao obter pasta do ano: ' + erro.message);
    throw erro;
  }
}

// ---------------------------------------------------------------------------
//  Pasta do trimestre
// ---------------------------------------------------------------------------

/**
 * Obtém ou cria a subpasta de um trimestre dentro do ano.
 *
 * @param {number} year       Ano lectivo.
 * @param {number} trimester  Número do trimestre (1, 2 ou 3).
 * @return {Folder}  Referência à pasta do trimestre.
 */
function getTrimesterFolder(year, trimester) {
  try {
    const yearFolder = getYearFolder(year);
    const trimName = trimester + '_Trimestre';
    const subFolders = yearFolder.getFoldersByName(trimName);

    if (subFolders.hasNext()) {
      return subFolders.next();
    }

    const newFolder = yearFolder.createFolder(trimName);
    Logger.log('Pasta do trimestre criada: ' + trimName);
    return newFolder;
  } catch (erro) {
    Logger.log('Erro ao obter pasta do trimestre: ' + erro.message);
    throw erro;
  }
}

// ---------------------------------------------------------------------------
//  Guardar PDF no Drive
// ---------------------------------------------------------------------------

/**
 * Guarda um blob PDF na pasta do trimestre correspondente.
 * Define partilha: qualquer pessoa com o link pode ver.
 *
 * @param {Blob}   blob       Blob do PDF.
 * @param {number} trimester  Número do trimestre (1, 2 ou 3).
 * @param {string} fileName   Nome do ficheiro.
 * @return {Object}  { fileId, fileUrl, fileName }
 */
function savePDFToDrive(blob, trimester, fileName) {
  try {
    const folder = getTrimesterFolder(CONFIG.SCHOOL_YEAR, trimester);

    // Verificar se já existe um ficheiro com o mesmo nome e remover
    const existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) {
      const oldFile = existing.next();
      Logger.log('A substituir ficheiro existente: ' + oldFile.getName());
      oldFile.setTrashed(true);
    }

    // Criar o ficheiro
    const file = folder.createFile(blob.setName(fileName));

    // Definir partilha — qualquer pessoa com o link pode ver
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();
    const fileId = file.getId();

    Logger.log('PDF guardado: ' + fileName + ' (' + fileId + ')');

    return {
      fileId: fileId,
      fileUrl: fileUrl,
      fileName: fileName
    };
  } catch (erro) {
    Logger.log('Erro ao guardar PDF: ' + erro.message);
    return { success: false, error: 'Erro ao guardar PDF: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Listar PDFs de um trimestre
// ---------------------------------------------------------------------------

/**
 * Lista todos os PDFs na pasta de um trimestre.
 *
 * @param {number} trimester  Número do trimestre (1, 2 ou 3).
 * @return {Array<Object>}  Lista de { id, name, url, date, size }.
 */
function listPDFsInFolder(trimester) {
  try {
    const folder = getTrimesterFolder(CONFIG.SCHOOL_YEAR, trimester);
    const files = folder.getFilesByType(MimeType.PDF);
    const result = [];

    while (files.hasNext()) {
      const file = files.next();
      result.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        date: Utilities.formatDate(
          file.getDateCreated(),
          Session.getScriptTimeZone(),
          'dd/MM/yyyy HH:mm'
        ),
        size: _formatFileSize(file.getSize())
      });
    }

    // Ordenar por data de criação (mais recentes primeiro)
    result.sort((a, b) => b.date.localeCompare(a.date));

    Logger.log('PDFs listados no ' + trimester + 'º Trimestre: ' + result.length);
    return result;
  } catch (erro) {
    Logger.log('Erro ao listar PDFs: ' + erro.message);
    return [];
  }
}

/**
 * Lista todos os PDFs guardados em todos os trimestres.
 *
 * @return {Array<Object>}  Lista combinada de PDFs.
 */
function listAllPDFs() {
  try {
    const allPDFs = [];

    for (let t = 1; t <= 3; t++) {
      const pdfs = listPDFsInFolder(t);
      pdfs.forEach(pdf => {
        pdf.trimestre = t;
        allPDFs.push(pdf);
      });
    }

    return allPDFs;
  } catch (erro) {
    Logger.log('Erro ao listar todos os PDFs: ' + erro.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Eliminar PDF
// ---------------------------------------------------------------------------

/**
 * Move um ficheiro para o lixo pelo seu ID.
 *
 * @param {string} fileId  ID do ficheiro no Drive.
 * @return {Object}  { success: boolean, message?: string, error?: string }
 */
function deletePDF(fileId) {
  try {
    if (!fileId) {
      return { success: false, error: 'ID do ficheiro não fornecido.' };
    }

    const file = DriveApp.getFileById(fileId);
    const fileName = file.getName();
    file.setTrashed(true);

    Logger.log('PDF eliminado: ' + fileName + ' (' + fileId + ')');

    return {
      success: true,
      message: 'Ficheiro "' + fileName + '" movido para o lixo.'
    };
  } catch (erro) {
    Logger.log('Erro ao eliminar PDF: ' + erro.message);
    return { success: false, error: 'Erro ao eliminar ficheiro: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Funções auxiliares (privadas)
// ---------------------------------------------------------------------------

/**
 * Formata o tamanho de um ficheiro em unidades legíveis.
 *
 * @param {number} bytes  Tamanho em bytes.
 * @return {string}  Tamanho formatado (ex: '1.5 MB').
 * @private
 */
function _formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(1);

  return size + ' ' + units[i];
}
