// PDF Signature Utility - Utilidad para agregar firmas de texto a PDFs existentes
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

/**
 * Agregar firma de texto a un PDF existente
 * @param {Object} params - Parámetros de la firma
 * @param {Buffer|string} params.pdfBuffer - Buffer del PDF o ruta al archivo
 * @param {string} params.signerName - Nombre completo del firmante
 * @param {number} params.x - Coordenada X en puntos (1 punto = 1/72 pulgadas)
 * @param {number} params.y - Coordenada Y en puntos (desde la parte inferior)
 * @param {number} params.pageIndex - Índice de la página (0-based, default: 0)
 * @param {Object} params.options - Opciones adicionales
 * @param {number} params.options.fontSize - Tamaño de fuente (default: 12)
 * @param {string} params.options.fontColor - Color de la fuente en formato RGB (default: '0,0,0' = negro)
 * @param {boolean} params.options.includeDate - Incluir fecha y hora (default: true)
 * @returns {Promise<Buffer>} - Buffer del PDF firmado
 */
async function signPDFWithText(params) {
  const {
    pdfBuffer,
    signerName,
    x,
    y,
    pageIndex = 0,
    options = {}
  } = params;

  const {
    fontSize = 12,
    fontColor = '0,0,0',
    includeDate = true
  } = options;

  try {
    // Cargar el PDF
    let pdfBytes;
    if (Buffer.isBuffer(pdfBuffer)) {
      pdfBytes = pdfBuffer;
    } else if (typeof pdfBuffer === 'string') {
      // Es una ruta de archivo
      if (!fs.existsSync(pdfBuffer)) {
        throw new Error(`Archivo PDF no encontrado: ${pdfBuffer}`);
      }
      pdfBytes = await fs.readFile(pdfBuffer);
    } else {
      throw new Error('pdfBuffer debe ser un Buffer o una ruta de archivo');
    }

    // Cargar el documento PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Obtener la página especificada
    const pages = pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(`Índice de página inválido: ${pageIndex}. El PDF tiene ${pages.length} página(s).`);
    }

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // Validar coordenadas
    if (x < 0 || x > width || y < 0 || y > height) {
      console.warn(`Advertencia: Las coordenadas (${x}, ${y}) están fuera del rango de la página (${width}x${height}). La firma puede no ser visible.`);
    }

    // Crear el texto de la firma
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let signatureText;
    if (includeDate) {
      signatureText = `Firmado por ${signerName} el ${dateStr} a las ${timeStr}h`;
    } else {
      signatureText = `Firmado por ${signerName}`;
    }

    // Obtener o crear la fuente
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Parsear el color RGB
    const [r, g, b] = fontColor.split(',').map(c => parseFloat(c.trim()) / 255);

    // Agregar el texto a la página
    // Nota: En pdf-lib, Y=0 está en la parte inferior, por lo que necesitamos ajustar
    // Si las coordenadas vienen desde arriba, necesitamos convertirlas
    page.drawText(signatureText, {
      x: x,
      y: y, // pdf-lib usa Y desde abajo, así que si recibimos Y desde arriba, necesitamos: height - y
      size: fontSize,
      font: font,
      color: rgb(r, g, b),
    });

    // Guardar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();

    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error('[PDFSignature] Error firmando PDF:', error);
    throw error;
  }
}

/**
 * Agregar múltiples firmas a un PDF
 * @param {Object} params - Parámetros
 * @param {Buffer|string} params.pdfBuffer - Buffer del PDF o ruta al archivo
 * @param {Array} params.signatures - Array de objetos de firma
 * @param {string} params.signatures[].signerName - Nombre del firmante
 * @param {number} params.signatures[].x - Coordenada X
 * @param {number} params.signatures[].y - Coordenada Y
 * @param {number} params.signatures[].pageIndex - Índice de página (default: 0)
 * @param {Object} params.signatures[].options - Opciones de firma
 * @returns {Promise<Buffer>} - Buffer del PDF firmado
 */
async function signPDFWithMultipleSignatures(params) {
  const { pdfBuffer, signatures } = params;

  if (!Array.isArray(signatures) || signatures.length === 0) {
    throw new Error('Se requiere al menos una firma');
  }

  try {
    // Cargar el PDF una vez
    let pdfBytes;
    if (Buffer.isBuffer(pdfBuffer)) {
      pdfBytes = pdfBuffer;
    } else if (typeof pdfBuffer === 'string') {
      if (!fs.existsSync(pdfBuffer)) {
        throw new Error(`Archivo PDF no encontrado: ${pdfBuffer}`);
      }
      pdfBytes = await fs.readFile(pdfBuffer);
    } else {
      throw new Error('pdfBuffer debe ser un Buffer o una ruta de archivo');
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Agregar cada firma
    for (const signature of signatures) {
      const {
        signerName,
        x,
        y,
        pageIndex = 0,
        options = {}
      } = signature;

      const pages = pdfDoc.getPages();
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Índice de página inválido: ${pageIndex}`);
      }

      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      const {
        fontSize = 12,
        fontColor = '0,0,0',
        includeDate = true
      } = options;

      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let signatureText;
      if (includeDate) {
        signatureText = `Firmado por ${signerName} el ${dateStr} a las ${timeStr}h`;
      } else {
        signatureText = `Firmado por ${signerName}`;
      }

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const [r, g, b] = fontColor.split(',').map(c => parseFloat(c.trim()) / 255);

      page.drawText(signatureText, {
        x: x,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(r, g, b),
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error('[PDFSignature] Error firmando PDF con múltiples firmas:', error);
    throw error;
  }
}

/**
 * Obtener información de un PDF (número de páginas, dimensiones)
 * @param {Buffer|string} pdfBuffer - Buffer del PDF o ruta al archivo
 * @returns {Promise<Object>} - Información del PDF
 */
async function getPDFInfo(pdfBuffer) {
  try {
    let pdfBytes;
    if (Buffer.isBuffer(pdfBuffer)) {
      pdfBytes = pdfBuffer;
    } else if (typeof pdfBuffer === 'string') {
      if (!fs.existsSync(pdfBuffer)) {
        throw new Error(`Archivo PDF no encontrado: ${pdfBuffer}`);
      }
      pdfBytes = await fs.readFile(pdfBuffer);
    } else {
      throw new Error('pdfBuffer debe ser un Buffer o una ruta de archivo');
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    const pageInfo = pages.map((page, index) => {
      const { width, height } = page.getSize();
      return {
        pageIndex: index,
        width: width, // En puntos (1 punto = 1/72 pulgadas)
        height: height,
        widthInches: width / 72,
        heightInches: height / 72,
      };
    });

    return {
      pageCount: pages.length,
      pages: pageInfo,
    };
  } catch (error) {
    console.error('[PDFSignature] Error obteniendo información del PDF:', error);
    throw error;
  }
}

module.exports = {
  signPDFWithText,
  signPDFWithMultipleSignatures,
  getPDFInfo,
};

