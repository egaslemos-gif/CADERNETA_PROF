/**
 * ============================================================
 *  CADERNETA ESCOLAR DIGITAL — PDFService.gs
 *  Serviço de geração e gestão de PDFs
 * ============================================================
 *  Converte HTML em PDF, guarda no Drive e lista ficheiros.
 * ============================================================
 */

// ---------------------------------------------------------------------------
//  Criar PDF a partir de HTML
// ---------------------------------------------------------------------------

/**
 * Cria um blob PDF a partir de conteúdo HTML.
 * Utiliza HtmlService para renderizar e converte para PDF via Blob.
 *
 * @param {string} htmlContent  Conteúdo HTML completo.
 * @param {string} fileName     Nome do ficheiro (sem extensão .pdf).
 * @return {Object}  { blob: Blob, fileName: string }
 */
function createPDFFromHTML(htmlContent, fileName) {
  try {
    if (!htmlContent) {
      throw new Error('Conteúdo HTML não fornecido.');
    }

    const safeName = (fileName || 'documento')
      .replace(/[^a-zA-Z0-9_\-\sáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]/g, '')
      .trim();

    const fullName = safeName + '.pdf';

    // Criar um blob HTML e converter para PDF
    const htmlBlob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    const pdfBlob = htmlBlob.getAs('application/pdf').setName(fullName);

    Logger.log('PDF criado: ' + fullName + ' (' + pdfBlob.getBytes().length + ' bytes)');

    return {
      blob: pdfBlob,
      fileName: fullName
    };
  } catch (erro) {
    Logger.log('Erro ao criar PDF: ' + erro.message);
    throw new Error('Não foi possível criar o PDF: ' + erro.message);
  }
}

// ---------------------------------------------------------------------------
//  Gerar e guardar pauta trimestral em PDF
// ---------------------------------------------------------------------------

/**
 * Gera a pauta HTML de uma disciplina, converte em PDF e guarda no Drive.
 *
 * @param {string} sheetName   Nome da tab da disciplina.
 * @param {number} trimester   Trimestre (1, 2 ou 3).
 * @return {Object}  { success, pdfUrl, fileName, fileId } ou { success: false, error }
 */
function generateAndSavePautaPDF(sheetName, trimester) {
  try {
    if (!sheetName || !trimester) {
      return { success: false, error: 'Disciplina e trimestre são obrigatórios.' };
    }

    Logger.log('A gerar pauta PDF: ' + sheetName + ' T' + trimester);

    // 1. Gerar HTML via PautaService
    const htmlContent = generatePautaHTML(sheetName, trimester);

    // 2. Definir nome do ficheiro
    const dateStr = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
    const fileName = 'Pauta_' + sheetName + '_T' + trimester + '_' + dateStr;

    // 3. Criar PDF
    const pdfResult = createPDFFromHTML(htmlContent, fileName);

    // 4. Garantir estrutura de pastas e guardar
    ensureFolderStructure();
    const driveResult = savePDFToDrive(pdfResult.blob, trimester, pdfResult.fileName);

    if (driveResult.success === false) {
      return driveResult;
    }

    Logger.log('Pauta PDF guardada com sucesso: ' + driveResult.fileName);

    return {
      success: true,
      pdfUrl: driveResult.fileUrl,
      fileName: driveResult.fileName,
      fileId: driveResult.fileId
    };
  } catch (erro) {
    Logger.log('Erro ao gerar/guardar pauta PDF: ' + erro.message);
    return { success: false, error: 'Erro ao gerar PDF da pauta: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Gerar e guardar boletim individual em PDF
// ---------------------------------------------------------------------------

/**
 * Gera o boletim HTML de um aluno, converte em PDF e guarda no Drive.
 *
 * @param {string}      studentName  Nome completo do aluno.
 * @param {number|null} trimester    Trimestre (1-3) ou null para todos.
 * @return {Object}  { success, pdfUrl, fileName, fileId } ou { success: false, error }
 */
function generateAndSaveBoletimPDF(studentName, trimester) {
  try {
    if (!studentName) {
      return { success: false, error: 'Nome do aluno é obrigatório.' };
    }

    Logger.log('A gerar boletim PDF: ' + studentName);

    // 1. Gerar HTML via PautaService
    const htmlContent = generateBoletimHTML(studentName, trimester);

    // 2. Definir nome do ficheiro
    const dateStr = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
    const safeName = studentName
      .replace(/[^a-zA-Z0-9\sáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const trimLabel = trimester ? 'T' + trimester : 'Anual';
    const fileName = 'Boletim_' + safeName + '_' + trimLabel + '_' + dateStr;

    // 3. Criar PDF
    const pdfResult = createPDFFromHTML(htmlContent, fileName);

    // 4. Guardar no Drive (usa trimestre 1 como pasta por defeito se anual)
    const saveTrimester = trimester || 1;
    ensureFolderStructure();
    const driveResult = savePDFToDrive(pdfResult.blob, saveTrimester, pdfResult.fileName);

    if (driveResult.success === false) {
      return driveResult;
    }

    Logger.log('Boletim PDF guardado com sucesso: ' + driveResult.fileName);

    return {
      success: true,
      pdfUrl: driveResult.fileUrl,
      fileName: driveResult.fileName,
      fileId: driveResult.fileId
    };
  } catch (erro) {
    Logger.log('Erro ao gerar/guardar boletim PDF: ' + erro.message);
    return { success: false, error: 'Erro ao gerar PDF do boletim: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Gerar e guardar pauta geral em PDF
// ---------------------------------------------------------------------------

/**
 * Gera a pauta geral consolidada em PDF e guarda no Drive.
 *
 * @param {number} trimester  Trimestre (1, 2 ou 3).
 * @return {Object}  { success, pdfUrl, fileName, fileId } ou { success: false, error }
 */
function generateAndSavePautaGeralPDF(trimester) {
  try {
    if (!trimester) {
      return { success: false, error: 'Trimestre é obrigatório.' };
    }

    Logger.log('A gerar pauta geral PDF: T' + trimester);

    // 1. Gerar HTML
    const htmlContent = generatePautaGeralHTML(trimester);

    // 2. Nome do ficheiro
    const dateStr = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
    const fileName = 'Pauta_Geral_T' + trimester + '_' + dateStr;

    // 3. Criar PDF
    const pdfResult = createPDFFromHTML(htmlContent, fileName);

    // 4. Guardar
    const saveTrimester = trimester === 'anual' ? 3 : trimester;
    ensureFolderStructure();
    const driveResult = savePDFToDrive(pdfResult.blob, saveTrimester, pdfResult.fileName);

    if (driveResult.success === false) {
      return driveResult;
    }

    Logger.log('Pauta geral PDF guardada: ' + driveResult.fileName);

    return {
      success: true,
      pdfUrl: driveResult.fileUrl,
      fileName: driveResult.fileName,
      fileId: driveResult.fileId
    };
  } catch (erro) {
    Logger.log('Erro ao gerar pauta geral PDF: ' + erro.message);
    return { success: false, error: 'Erro ao gerar PDF da pauta geral: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Listar PDFs guardados
// ---------------------------------------------------------------------------

/**
 * Lista todos os PDFs guardados no Drive, de todos os trimestres.
 *
 * @return {Array<Object>}  Lista de { name, url, date, size, trimestre }.
 */
function listSavedPDFs() {
  try {
    return listAllPDFs();
  } catch (erro) {
    Logger.log('Erro ao listar PDFs: ' + erro.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Obter URL de pré-visualização de PDF
// ---------------------------------------------------------------------------

/**
 * Obtém o URL de pré-visualização de um ficheiro no Drive.
 *
 * @param {string} fileId  ID do ficheiro.
 * @return {Object}  { success, previewUrl } ou { success: false, error }
 */
function getPDFPreviewUrl(fileId) {
  try {
    if (!fileId) {
      return { success: false, error: 'ID do ficheiro não fornecido.' };
    }

    const file = DriveApp.getFileById(fileId);
    const previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

    return {
      success: true,
      previewUrl: previewUrl,
      downloadUrl: file.getDownloadUrl(),
      fileName: file.getName()
    };
  } catch (erro) {
    Logger.log('Erro ao obter URL de pré-visualização: ' + erro.message);
    return { success: false, error: 'Ficheiro não encontrado: ' + erro.message };
  }
}

// ---------------------------------------------------------------------------
//  Enviar boletim por e-mail (funcionalidade bónus)
// ---------------------------------------------------------------------------

/**
 * Envia um boletim por e-mail como anexo PDF.
 *
 * @param {string} email        Endereço de e-mail do destinatário.
 * @param {string} studentName  Nome do aluno.
 * @param {number} trimester    Trimestre.
 * @return {Object}  { success: boolean, message?: string, error?: string }
 */
function sendBoletimByEmail(email, studentName, trimester) {
  try {
    if (!email || !studentName) {
      return { success: false, error: 'E-mail e nome do aluno são obrigatórios.' };
    }

    // Gerar HTML e PDF
    const htmlContent = generateBoletimHTML(studentName, trimester);
    const fileName = 'Boletim_' + studentName.replace(/\s+/g, '_');
    const pdfResult = createPDFFromHTML(htmlContent, fileName);

    // Obter dados da escola para o assunto
    const schoolData = getSchoolData();
    const trimLabel = trimester ? trimester + 'º Trimestre' : 'Anual';

    // Enviar e-mail
    MailApp.sendEmail({
      to: email,
      subject: 'Boletim Escolar — ' + studentName + ' — ' + trimLabel,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a3a6e;">${schoolData.escola || 'Escola'}</h2>
          <p>Prezado(a) Encarregado(a) de Educação,</p>
          <p>Segue em anexo o boletim escolar do(a) aluno(a) <strong>${studentName}</strong>
             referente ao <strong>${trimLabel}</strong> do Ano Lectivo ${schoolData.ano || CONFIG.SCHOOL_YEAR}.</p>
          <p>Com os melhores cumprimentos,<br>
          <strong>${schoolData.professor || 'A Direcção'}</strong></p>
          <hr style="border: 1px solid #e0e0e0;">
          <p style="font-size: 11px; color: #888;">
            Este e-mail foi gerado automaticamente pelo sistema Caderneta Escolar Digital.
          </p>
        </div>
      `,
      attachments: [pdfResult.blob]
    });

    Logger.log('Boletim enviado por e-mail: ' + email);

    return {
      success: true,
      message: 'Boletim enviado com sucesso para ' + email
    };
  } catch (erro) {
    Logger.log('Erro ao enviar e-mail: ' + erro.message);
    return { success: false, error: 'Erro ao enviar e-mail: ' + erro.message };
  }
}
