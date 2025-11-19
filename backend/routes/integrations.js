// Integrations Routes - Gestión de integraciones (Slack, HelloSign, etc.)
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { isSlackConfigured, sendSlackMessage } = require('../utils/slack');
const { isHelloSignConfigured, getSignatureRequestStatus, downloadSignedDocument } = require('../utils/signature');
const router = express.Router();

// Aplicar middleware a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

// Verificar estado de integraciones
router.get('/status', async (req, res) => {
  try {
    res.json({
      slack: {
        configured: isSlackConfigured(),
        status: isSlackConfigured() ? 'active' : 'not_configured'
      },
      hellosign: {
        configured: isHelloSignConfigured(),
        status: isHelloSignConfigured() ? 'active' : 'not_configured'
      }
    });
  } catch (error) {
    console.error('Error checking integrations status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test Slack integration
router.post('/slack/test', async (req, res) => {
  try {
    if (!isSlackConfigured()) {
      return res.status(400).json({ 
        error: 'Slack no está configurado. Configura SLACK_WEBHOOK_URL en las variables de entorno.' 
      });
    }

    const result = await sendSlackMessage({
      text: '🧪 Test de integración con Slack',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Este es un mensaje de prueba desde TechSupport. Si recibes este mensaje, la integración con Slack está funcionando correctamente! ✅'
          }
        }
      ],
      username: 'TechSupport Test',
      icon: ':white_check_mark:'
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Mensaje de prueba enviado a Slack exitosamente' 
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando mensaje a Slack', 
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error testing Slack:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Verificar estado de solicitud de firma
router.get('/signature/:signatureRequestId/status', async (req, res) => {
  try {
    const { signatureRequestId } = req.params;

    if (!isHelloSignConfigured()) {
      return res.status(400).json({ 
        error: 'HelloSign no está configurado' 
      });
    }

    const status = await getSignatureRequestStatus(signatureRequestId);
    res.json(status);
  } catch (error) {
    console.error('Error getting signature status:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Enviar mensaje a usuario específico
router.post('/slack/send-message', async (req, res) => {
  try {
    const { userId, userName, userEmail, message } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ 
        error: 'Nombre y email del usuario son requeridos' 
      });
    }

    if (!isSlackConfigured()) {
      return res.status(400).json({ 
        error: 'Slack no está configurado. Configura SLACK_WEBHOOK_URL en las variables de entorno.' 
      });
    }

    const { sendUserMessage } = require('../utils/slack');
    const result = await sendUserMessage({
      userName,
      userEmail,
      message: message || `Hola ${userName}, este es un mensaje desde TechSupport.`
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Mensaje enviado a Slack exitosamente' 
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando mensaje a Slack', 
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending user message:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Enviar recordatorio de firma a usuario específico
router.post('/slack/send-reminder', async (req, res) => {
  try {
    const { userId, userName, userEmail, signatureUrl } = req.body;

    if (!userName || !userEmail) {
      return res.status(400).json({ 
        error: 'Nombre y email del usuario son requeridos' 
      });
    }

    if (!isSlackConfigured()) {
      return res.status(400).json({ 
        error: 'Slack no está configurado. Configura SLACK_WEBHOOK_URL en las variables de entorno.' 
      });
    }

    const { sendSignatureReminder } = require('../utils/slack');
    const result = await sendSignatureReminder({
      userName,
      userEmail,
      signatureUrl
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Recordatorio de firma enviado a Slack exitosamente' 
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando recordatorio a Slack', 
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending signature reminder:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Descargar documento firmado
router.get('/signature/:signatureRequestId/download', async (req, res) => {
  try {
    const { signatureRequestId } = req.params;
    const path = require('path');
    const fs = require('fs-extra');

    if (!isHelloSignConfigured()) {
      return res.status(400).json({ 
        error: 'HelloSign no está configurado' 
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    await fs.ensureDir(uploadsDir);
    
    const outputPath = path.join(uploadsDir, `signed-${signatureRequestId}.pdf`);
    
    await downloadSignedDocument(signatureRequestId, outputPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="signed-document-${signatureRequestId}.pdf"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      // Opcional: eliminar archivo temporal después de enviarlo
      // fs.unlink(outputPath).catch(console.error);
    });
  } catch (error) {
    console.error('Error downloading signed document:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

module.exports = router;

