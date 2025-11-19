// Slack Integration - Envío de mensajes a Slack
const axios = require('axios');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Enviar mensaje a Slack
 * @param {Object} options - Opciones del mensaje
 * @param {string} options.text - Texto del mensaje
 * @param {string} options.channel - Canal de Slack (opcional)
 * @param {string} options.username - Nombre del bot (opcional)
 * @param {Array} options.blocks - Bloques de formato avanzado (opcional)
 * @param {Array} options.attachments - Adjuntos (opcional)
 */
async function sendSlackMessage(options) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[Slack] Webhook URL no configurada. Mensaje no enviado.');
    return { success: false, error: 'Slack webhook no configurado' };
  }

  try {
    const payload = {
      text: options.text || 'Notificación de TechSupport',
      channel: options.channel,
      username: options.username || 'TechSupport Bot',
      icon_emoji: options.icon || ':robot_face:',
      blocks: options.blocks,
      attachments: options.attachments
    };

    // Remover campos undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const response = await axios.post(SLACK_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('[Slack] Mensaje enviado exitosamente');
      return { success: true };
    }

    return { success: false, error: 'Respuesta inesperada de Slack' };
  } catch (error) {
    console.error('[Slack] Error enviando mensaje:', error.message);
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
}

/**
 * Enviar notificación de documento de onboarding listo para firma
 * @param {Object} params - Parámetros
 * @param {string} params.employeeName - Nombre del empleado
 * @param {string} params.employeeEmail - Email del empleado
 * @param {string} params.signatureUrl - URL para firmar el documento
 * @param {string} params.managerName - Nombre del manager (opcional)
 * @param {string} params.managerSlackId - ID de Slack del manager (opcional, para mencionar)
 */
async function sendOnboardingSignatureRequest(params) {
  const { employeeName, employeeEmail, signatureUrl, managerName, managerSlackId } = params;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📝 Documento de Onboarding Listo para Firma',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Empleado:*\n${employeeName}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${employeeEmail}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'El documento de onboarding ha sido generado y está listo para ser firmado.'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${signatureUrl}|Firma el documento aquí> 👈*`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `💡 Haz clic en el enlace de arriba para acceder a la plataforma de firma electrónica y completar el proceso.`
        }
      ]
    }
  ];

  // Si hay manager, mencionarlo
  if (managerSlackId) {
    blocks.splice(2, 0, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hola <@${managerSlackId}>! 👋`
      }
    });
  } else if (managerName) {
    blocks.splice(2, 0, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hola ${managerName}! 👋`
      }
    });
  }

  return await sendSlackMessage({
    text: `📝 Documento de Onboarding para ${employeeName} - Firma requerida`,
    blocks: blocks,
    username: 'TechSupport Onboarding',
    icon: ':memo:'
  });
}

/**
 * Enviar notificación de documento firmado
 * @param {Object} params - Parámetros
 * @param {string} params.employeeName - Nombre del empleado
 * @param {string} params.signedBy - Quién firmó
 * @param {string} params.documentUrl - URL del documento firmado
 */
async function sendDocumentSignedNotification(params) {
  const { employeeName, signedBy, documentUrl } = params;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '✅ Documento Firmado Exitosamente',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Empleado:*\n${employeeName}`
        },
        {
          type: 'mrkdwn',
          text: `*Firmado por:*\n${signedBy}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `El documento ha sido firmado correctamente. <${documentUrl}|Ver documento>`
      }
    }
  ];

  return await sendSlackMessage({
    text: `✅ Documento de ${employeeName} firmado por ${signedBy}`,
    blocks: blocks,
    username: 'TechSupport Onboarding',
    icon: ':white_check_mark:'
  });
}

/**
 * Enviar mensaje personalizado a un usuario específico
 * @param {Object} params - Parámetros
 * @param {string} params.userName - Nombre del usuario
 * @param {string} params.userEmail - Email del usuario
 * @param {string} params.message - Mensaje personalizado (opcional)
 */
async function sendUserMessage(params) {
  const { userName, userEmail, message } = params;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '💬 Mensaje de TechSupport',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Usuario:*\n${userName}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${userEmail}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message || `Hola ${userName},\n\nEste es un mensaje desde TechSupport.`
      }
    }
  ];

  return await sendSlackMessage({
    text: `💬 Mensaje para ${userName}`,
    blocks: blocks,
    username: 'TechSupport',
    icon: ':speech_balloon:'
  });
}

/**
 * Enviar recordatorio de firma a un usuario
 * @param {Object} params - Parámetros
 * @param {string} params.userName - Nombre del usuario
 * @param {string} params.userEmail - Email del usuario
 * @param {string} params.signatureUrl - URL para firmar (opcional)
 */
async function sendSignatureReminder(params) {
  const { userName, userEmail, signatureUrl } = params;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 Recordatorio de Firma',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Usuario:*\n${userName}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${userEmail}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hola ${userName},\n\nEste es un recordatorio para que firmes tu documento de onboarding.`
      }
    }
  ];

  // Si hay URL de firma, agregarla
  if (signatureUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${signatureUrl}|Firma el documento aquí> 👈*`
      }
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Por favor, revisa tu email o contacta al equipo de TechSupport para obtener el link de firma.'
      }
    });
  }

  blocks.push({
    type: 'divider'
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `💡 Si ya firmaste el documento, puedes ignorar este mensaje.`
      }
    ]
  });

  return await sendSlackMessage({
    text: `🔔 Recordatorio de firma para ${userName}`,
    blocks: blocks,
    username: 'TechSupport Onboarding',
    icon: ':bell:'
  });
}

/**
 * Verificar si Slack está configurado
 */
function isSlackConfigured() {
  return !!SLACK_WEBHOOK_URL;
}

module.exports = {
  sendSlackMessage,
  sendOnboardingSignatureRequest,
  sendDocumentSignedNotification,
  sendUserMessage,
  sendSignatureReminder,
  isSlackConfigured
};

