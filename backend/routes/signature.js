// Signature Routes - Rutas para firmar documentos PDF
const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { signPDFWithText, signPDFWithMultipleSignatures, getPDFInfo } = require('../utils/pdfSignature');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Configurar multer para manejar archivos PDF
const storage = multer.memoryStorage(); // Almacenar en memoria para procesamiento
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
});

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// Obtener información de un PDF (número de páginas, dimensiones)
router.post('/pdf/info', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo PDF' });
    }

    const pdfBuffer = req.file.buffer;
    const info = await getPDFInfo(pdfBuffer);

    res.json({
      success: true,
      info: info,
    });
  } catch (error) {
    console.error('Error obteniendo información del PDF:', error);
    res.status(500).json({
      error: 'Error procesando el PDF',
      details: error.message,
    });
  }
});

// Firmar un PDF con texto en una posición específica
router.post('/pdf/sign-text', upload.single('pdf'), async (req, res) => {
  try {
    // Validar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo PDF' });
    }

    // Validar campos requeridos
    const { signerName, x, y, pageIndex } = req.body;

    if (!signerName || signerName.trim() === '') {
      return res.status(400).json({ error: 'El nombre del firmante es requerido' });
    }

    if (x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Las coordenadas X e Y son requeridas' });
    }

    const xCoord = parseFloat(x);
    const yCoord = parseFloat(y);
    const pageIdx = pageIndex ? parseInt(pageIndex) : 0;

    if (isNaN(xCoord) || isNaN(yCoord)) {
      return res.status(400).json({ error: 'Las coordenadas deben ser números válidos' });
    }

    if (isNaN(pageIdx) || pageIdx < 0) {
      return res.status(400).json({ error: 'El índice de página debe ser un número válido mayor o igual a 0' });
    }

    // Opciones adicionales (opcionales)
    const options = {
      fontSize: req.body.fontSize ? parseFloat(req.body.fontSize) : 12,
      fontColor: req.body.fontColor || '0,0,0',
      includeDate: req.body.includeDate !== 'false', // Por defecto true
    };

    // Firmar el PDF
    const pdfBuffer = req.file.buffer;
    const signedPdfBuffer = await signPDFWithText({
      pdfBuffer,
      signerName: signerName.trim(),
      x: xCoord,
      y: yCoord,
      pageIndex: pageIdx,
      options,
    });

    // Opción 1: Devolver el PDF como descarga
    if (req.query.download === 'true') {
      const filename = `signed-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.send(signedPdfBuffer);
    }

    // Opción 2: Guardar el PDF y devolver la ruta (opcional)
    if (req.query.save === 'true') {
      const uploadsDir = path.join(__dirname, '../uploads');
      await fs.ensureDir(uploadsDir);
      const filename = `signed-${Date.now()}-${req.user.id}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, signedPdfBuffer);
      
      return res.json({
        success: true,
        message: 'PDF firmado exitosamente',
        filepath: `/uploads/${filename}`,
        filename: filename,
      });
    }

    // Opción 3: Devolver el PDF como base64 (para usar directamente en el frontend)
    const base64Pdf = signedPdfBuffer.toString('base64');
    res.json({
      success: true,
      message: 'PDF firmado exitosamente',
      pdfBase64: base64Pdf,
      mimeType: 'application/pdf',
    });
  } catch (error) {
    console.error('Error firmando PDF:', error);
    res.status(500).json({
      error: 'Error firmando el PDF',
      details: error.message,
    });
  }
});

// Firmar un PDF con múltiples firmas
router.post('/pdf/sign-multiple', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo PDF' });
    }

    const { signatures } = req.body;

    if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una firma en el array de signatures' });
    }

    // Validar cada firma
    const validatedSignatures = signatures.map((sig, index) => {
      if (!sig.signerName || sig.signerName.trim() === '') {
        throw new Error(`Firma ${index + 1}: El nombre del firmante es requerido`);
      }
      if (sig.x === undefined || sig.y === undefined) {
        throw new Error(`Firma ${index + 1}: Las coordenadas X e Y son requeridas`);
      }
      return {
        signerName: sig.signerName.trim(),
        x: parseFloat(sig.x),
        y: parseFloat(sig.y),
        pageIndex: sig.pageIndex ? parseInt(sig.pageIndex) : 0,
        options: {
          fontSize: sig.fontSize ? parseFloat(sig.fontSize) : 12,
          fontColor: sig.fontColor || '0,0,0',
          includeDate: sig.includeDate !== false,
        },
      };
    });

    const pdfBuffer = req.file.buffer;
    const signedPdfBuffer = await signPDFWithMultipleSignatures({
      pdfBuffer,
      signatures: validatedSignatures,
    });

    // Devolver según el parámetro de query
    if (req.query.download === 'true') {
      const filename = `signed-multiple-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.send(signedPdfBuffer);
    }

    if (req.query.save === 'true') {
      const uploadsDir = path.join(__dirname, '../uploads');
      await fs.ensureDir(uploadsDir);
      const filename = `signed-multiple-${Date.now()}-${req.user.id}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, signedPdfBuffer);
      
      return res.json({
        success: true,
        message: 'PDF firmado exitosamente con múltiples firmas',
        filepath: `/uploads/${filename}`,
        filename: filename,
      });
    }

    const base64Pdf = signedPdfBuffer.toString('base64');
    res.json({
      success: true,
      message: 'PDF firmado exitosamente con múltiples firmas',
      pdfBase64: base64Pdf,
      mimeType: 'application/pdf',
    });
  } catch (error) {
    console.error('Error firmando PDF con múltiples firmas:', error);
    res.status(500).json({
      error: 'Error firmando el PDF',
      details: error.message,
    });
  }
});

module.exports = router;

