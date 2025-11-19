// Signature Integration - Integración con HelloSign (Dropbox Sign) para firma electrónica
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const HELLOSIGN_API_KEY = process.env.HELLOSIGN_API_KEY;
const HELLOSIGN_CLIENT_ID = process.env.HELLOSIGN_CLIENT_ID;
const HELLOSIGN_API_URL = 'https://api.hellosign.com/v3';

/**
 * Verificar si HelloSign está configurado
 */
function isHelloSignConfigured() {
  return !!(HELLOSIGN_API_KEY && HELLOSIGN_CLIENT_ID);
}

/**
 * Subir documento a HelloSign y crear solicitud de firma
 * @param {Object} params - Parámetros
 * @param {string} params.filePath - Ruta del archivo PDF
 * @param {string} params.employeeName - Nombre del empleado
 * @param {string} params.employeeEmail - Email del empleado para firmar
 * @param {string} params.title - Título del documento
 * @param {string} params.subject - Asunto del email
 * @param {string} params.message - Mensaje personalizado
 * @returns {Promise<Object>} - Información de la solicitud de firma
 */
async function createSignatureRequest(params) {
  if (!isHelloSignConfigured()) {
    throw new Error('HelloSign no está configurado. Verifica HELLOSIGN_API_KEY y HELLOSIGN_CLIENT_ID');
  }

  const { filePath, employeeName, employeeEmail, title, subject, message } = params;

  try {
    // Leer el archivo
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath);
    const fileName = require('path').basename(filePath);

    // Crear FormData
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    // Título del documento
    formData.append('title', title || `Documento de Onboarding - ${employeeName}`);
    
    // Asunto del email
    formData.append('subject', subject || 'Por favor firma este documento');
    
    // Mensaje personalizado
    formData.append('message', message || `Hola ${employeeName},\n\nPor favor revisa y firma el documento de onboarding adjunto.\n\nGracias.`);

    // Signer (firmante)
    formData.append('signers[0][name]', employeeName);
    formData.append('signers[0][email_address]', employeeEmail);
    formData.append('signers[0][order]', '0');

    // Campos de firma (opcional - HelloSign puede detectarlos automáticamente)
    // formData.append('signing_options[draw]', '1');
    // formData.append('signing_options[type]', '1');
    // formData.append('signing_options[upload]', '1');
    // formData.append('signing_options[phone]', '1');
    // formData.append('signing_options[default_type]', 'draw');

    // Opciones adicionales
    formData.append('test_mode', process.env.NODE_ENV !== 'production' ? '1' : '0'); // Modo test en desarrollo
    formData.append('allow_decline', '0'); // No permitir rechazar
    formData.append('use_text_tags', '0'); // No usar text tags

    // Realizar petición a HelloSign
    const response = await axios.post(
      `${HELLOSIGN_API_URL}/signature_request/send`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Basic ${Buffer.from(HELLOSIGN_API_KEY + ':').toString('base64')}`
        },
        timeout: 60000, // 60 segundos para archivos grandes
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (response.data && response.data.signature_request) {
      const signatureRequest = response.data.signature_request;
      
      // Obtener URL de firma
      const signatureUrl = signatureRequest.signatures && signatureRequest.signatures[0] 
        ? signatureRequest.signatures[0].sign_url 
        : null;

      return {
        success: true,
        signatureRequestId: signatureRequest.signature_request_id,
        signatureUrl: signatureUrl,
        status: signatureRequest.status,
        details: signatureRequest
      };
    }

    throw new Error('Respuesta inesperada de HelloSign');
  } catch (error) {
    console.error('[HelloSign] Error creando solicitud de firma:', error.message);
    
    if (error.response) {
      console.error('[HelloSign] Respuesta de error:', error.response.data);
      throw new Error(`HelloSign API Error: ${error.response.data?.error?.error_msg || error.message}`);
    }
    
    throw error;
  }
}

/**
 * Obtener estado de una solicitud de firma
 * @param {string} signatureRequestId - ID de la solicitud
 * @returns {Promise<Object>} - Estado de la solicitud
 */
async function getSignatureRequestStatus(signatureRequestId) {
  if (!isHelloSignConfigured()) {
    throw new Error('HelloSign no está configurado');
  }

  try {
    const response = await axios.get(
      `${HELLOSIGN_API_URL}/signature_request/${signatureRequestId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(HELLOSIGN_API_KEY + ':').toString('base64')}`
        }
      }
    );

    if (response.data && response.data.signature_request) {
      return {
        success: true,
        status: response.data.signature_request.status,
        isComplete: response.data.signature_request.is_complete,
        details: response.data.signature_request
      };
    }

    throw new Error('Respuesta inesperada de HelloSign');
  } catch (error) {
    console.error('[HelloSign] Error obteniendo estado:', error.message);
    throw error;
  }
}

/**
 * Descargar documento firmado
 * @param {string} signatureRequestId - ID de la solicitud
 * @param {string} outputPath - Ruta donde guardar el archivo
 * @returns {Promise<string>} - Ruta del archivo descargado
 */
async function downloadSignedDocument(signatureRequestId, outputPath) {
  if (!isHelloSignConfigured()) {
    throw new Error('HelloSign no está configurado');
  }

  try {
    const response = await axios.get(
      `${HELLOSIGN_API_URL}/signature_request/files/${signatureRequestId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(HELLOSIGN_API_KEY + ':').toString('base64')}`
        },
        responseType: 'stream'
      }
    );

    // Guardar archivo
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('[HelloSign] Error descargando documento:', error.message);
    throw error;
  }
}

/**
 * Cancelar solicitud de firma
 * @param {string} signatureRequestId - ID de la solicitud
 * @returns {Promise<Object>} - Resultado de la cancelación
 */
async function cancelSignatureRequest(signatureRequestId) {
  if (!isHelloSignConfigured()) {
    throw new Error('HelloSign no está configurado');
  }

  try {
    const response = await axios.post(
      `${HELLOSIGN_API_URL}/signature_request/cancel/${signatureRequestId}`,
      {},
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(HELLOSIGN_API_KEY + ':').toString('base64')}`
        }
      }
    );

    return {
      success: true,
      details: response.data
    };
  } catch (error) {
    console.error('[HelloSign] Error cancelando solicitud:', error.message);
    throw error;
  }
}

module.exports = {
  isHelloSignConfigured,
  createSignatureRequest,
  getSignatureRequestStatus,
  downloadSignedDocument,
  cancelSignatureRequest
};

