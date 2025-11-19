const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

/**
 * Generate assignment document in DOCX format
 * @param {Object} data - Assignment data
 * @param {string} data.assetName - Name of the asset
 * @param {string} data.assetTag - Asset tag
 * @param {string} data.userName - Name of the user
 * @param {string} data.userLocation - Location of the user (MX, CL, REMOTO)
 * @param {string} data.assignedBy - Name of the person assigning
 * @param {Date} data.assignmentDate - Date of assignment
 * @param {string} data.notes - Additional notes
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateAssignmentDocument(data) {
  try {
    const {
      assetName,
      assetTag,
      userName,
      userLocation,
      assignedBy,
      assignmentDate,
      notes
    } = data;

    // Format date
    const formattedDate = assignmentDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format location
    const locationMap = {
      'MX': 'México',
      'CL': 'Chile',
      'REMOTO': 'Remoto'
    };
    const formattedLocation = locationMap[userLocation] || userLocation;

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "DOCUMENTO DE ASIGNACIÓN DE ASSET",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Company info
          new Paragraph({
            children: [
              new TextRun({
                text: "TechSupport - Sistema de Orquestación y Auditoría",
                italics: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha: ${formattedDate}`,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Assignment details
          new Paragraph({
            children: [
              new TextRun({
                text: "DETALLES DE LA ASIGNACIÓN",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Asset Asignado: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: `${assetName} (${assetTag})`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Empleado: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: userName,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Ubicación: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: formattedLocation,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Asignado por: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: assignedBy,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Terms and conditions
          new Paragraph({
            children: [
              new TextRun({
                text: "TÉRMINOS Y CONDICIONES",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. El empleado es responsable del cuidado y uso adecuado del asset asignado.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. En caso de pérdida, daño o robo, el empleado debe reportar inmediatamente al departamento de TI.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "3. El asset debe ser devuelto al finalizar la relación laboral o cuando sea solicitado.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "4. El uso del asset está sujeto a las políticas de seguridad de la empresa.",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Notes section
          ...(notes ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "NOTAS ADICIONALES",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: notes,
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
          ] : []),

          // Signatures
          new Paragraph({
            children: [
              new TextRun({
                text: "FIRMAS",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Empleado: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Asignado por: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Este documento fue generado automáticamente por el sistema TechSupport.",
                italics: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      }],
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `assignment-${assetTag}-${timestamp}.docx`;
    const filepath = path.join(uploadsDir, filename);

    // Save document
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filepath, buffer);

    console.log(`Assignment document generated: ${filepath}`);
    return filepath;

  } catch (error) {
    console.error('Error generating assignment document:', error);
    throw new Error('Failed to generate assignment document');
  }
}

/**
 * Generate audit report document
 * @param {Object} data - Audit data
 * @param {Array} data.logs - Audit logs
 * @param {Object} data.filters - Applied filters
 * @param {Date} data.generatedAt - Generation timestamp
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateAuditReport(data) {
  try {
    const { logs, filters, generatedAt } = data;

    const formattedDate = generatedAt.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "REPORTE DE AUDITORÍA",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generado el: ${formattedDate}`,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Filters applied
          new Paragraph({
            children: [
              new TextRun({
                text: "FILTROS APLICADOS",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          ...Object.entries(filters).map(([key, value]) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `${key}: ${value}`,
                  size: 20,
                }),
              ],
              spacing: { after: 150 },
            })
          ),

          // Summary
          new Paragraph({
            children: [
              new TextRun({
                text: `Total de registros: ${logs.length}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          // Logs table header
          new Paragraph({
            children: [
              new TextRun({
                text: "REGISTROS DE AUDITORÍA",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          // Logs
          ...logs.slice(0, 100).map(log => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${log.created_at} - ${log.action}`,
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Usuario: ${log.full_name || 'N/A'} (${log.username || 'N/A'})`,
                  size: 18,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Recurso: ${log.resource_type} - ${log.resource_id || 'N/A'}`,
                  size: 18,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Ubicación: ${log.location}`,
                  size: 18,
                }),
              ],
              spacing: { after: 200 },
            }),
          ]).flat(),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Este reporte fue generado automáticamente por el sistema TechSupport.",
                italics: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      }],
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-report-${timestamp}.docx`;
    const filepath = path.join(uploadsDir, filename);

    // Save document
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filepath, buffer);

    console.log(`Audit report generated: ${filepath}`);
    return filepath;

  } catch (error) {
    console.error('Error generating audit report:', error);
    throw new Error('Failed to generate audit report');
  }
}

/**
 * Generate responsibility letter document
 * @param {Object} data - Responsibility letter data
 * @param {string} data.employeeName - Name of the employee
 * @param {string} data.employeeId - Employee ID
 * @param {string} data.position - Position/role
 * @param {string} data.department - Department
 * @param {string} data.location - Location (MX, CL, REMOTO)
 * @param {Date} data.startDate - Start date
 * @param {Array} data.assets - List of assets assigned
 * @param {string} data.additionalTerms - Additional terms
 * @param {string} data.generatedBy - Name of person generating the letter
 * @param {Date} data.generatedAt - Generation timestamp
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateResponsibilityLetter(data) {
  try {
    const {
      employeeName,
      employeeId,
      position,
      department,
      location,
      startDate,
      assets,
      additionalTerms,
      generatedBy,
      generatedAt
    } = data;

    // Format date
    const formattedDate = startDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const generatedDate = generatedAt.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format location
    const locationMap = {
      'MX': 'México',
      'CL': 'Chile',
      'REMOTO': 'Remoto'
    };
    const formattedLocation = locationMap[location] || location;

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "CARTA DE RESPONSABILIDAD",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Company info
          new Paragraph({
            children: [
              new TextRun({
                text: "TechSupport - Sistema de Orquestación y Auditoría",
                italics: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Date and location
          new Paragraph({
            children: [
              new TextRun({
                text: `${formattedLocation}, ${generatedDate}`,
                size: 22,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Employee information
          new Paragraph({
            children: [
              new TextRun({
                text: "INFORMACIÓN DEL EMPLEADO",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Nombre: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: employeeName,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "ID de Empleado: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: employeeId || 'N/A',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Posición: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: position,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Departamento: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: department,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Ubicación: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: formattedLocation,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha de Inicio: ",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: formattedDate,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Assets section
          ...(assets && assets.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "ASSETS ASIGNADOS",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 300 },
            }),
            ...assets.map(asset => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${asset.name || asset.asset_name} (${asset.asset_tag || asset.tag})`,
                    size: 20,
                  }),
                ],
                spacing: { after: 150 },
              })
            ),
          ] : []),

          // Terms and conditions
          new Paragraph({
            children: [
              new TextRun({
                text: "TÉRMINOS Y CONDICIONES",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. El empleado es responsable del cuidado y uso adecuado de todos los assets asignados.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. En caso de pérdida, daño o robo, el empleado debe reportar inmediatamente al departamento de TI.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "3. Los assets deben ser devueltos al finalizar la relación laboral o cuando sea solicitado.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "4. El uso de los assets está sujeto a las políticas de seguridad de la empresa.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "5. El empleado se compromete a mantener la confidencialidad de la información corporativa.",
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "6. Cualquier uso indebido de los assets puede resultar en medidas disciplinarias.",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Additional terms
          ...(additionalTerms ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "TÉRMINOS ADICIONALES",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: additionalTerms,
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
          ] : []),

          // Signatures
          new Paragraph({
            children: [
              new TextRun({
                text: "FIRMAS",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Empleado: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Supervisor: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha: _________________________",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generado por: ${generatedBy}`,
                size: 18,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de generación: ${generatedDate}`,
                size: 18,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Este documento fue generado automáticamente por el sistema TechSupport.",
                italics: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),
        ],
      }],
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `responsibility-letter-${employeeName.replace(/\s+/g, '-')}-${timestamp}.docx`;
    const filepath = path.join(uploadsDir, filename);

    // Save document
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filepath, buffer);

    console.log(`Responsibility letter generated: ${filepath}`);
    return filepath;

  } catch (error) {
    console.error('Error generating responsibility letter:', error);
    throw new Error('Failed to generate responsibility letter');
  }
}

/**
 * Generate onboarding PDF document with Snipe IT assets data
 * @param {Object} data - Onboarding PDF data
 * @param {string} data.employeeName - Name of the employee
 * @param {string} data.employeeId - Employee ID
 * @param {string} data.email - Employee email
 * @param {string} data.position - Position/role
 * @param {string} data.department - Department
 * @param {string} data.location - Location (MX, CL, REMOTO)
 * @param {Date} data.startDate - Start date
 * @param {Array} data.assets - List of assets from Snipe IT
 * @param {string} data.generatedBy - Name of person generating the PDF
 * @param {Date} data.generatedAt - Generation timestamp
 * @returns {Promise<string>} - Path to the generated PDF
 */
async function generateOnboardingPDF(data) {
  try {
    const {
      employeeName,
      employeeId,
      email,
      position,
      department,
      location,
      startDate,
      assets = [],
      generatedBy,
      generatedAt,
      templateConfig
    } = data;

    // Format dates - simple format matching doc.docx
    const formattedGeneratedDate = generatedAt.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format location
    const locationMap = {
      'MX': 'México',
      'CL': 'Chile',
      'REMOTO': 'Remoto'
    };
    const formattedLocation = locationMap[location] || location;

    // Use template config if provided, otherwise use default
    const config = templateConfig || {
      title: {
        text: 'Certificado de Asignación de Activos',
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        align: 'center',
        position: { x: 0, y: 50 }
      },
      fields: [
        {
          type: 'text',
          label: 'Fecha:',
          key: 'date',
          position: { x: 40, y: 100 },
          fontSize: 11,
          fontFamily: 'Helvetica-Bold',
          showLine: true,
          lineLength: 110
        },
        {
          type: 'text',
          label: 'Nombre Colaborador:',
          key: 'employeeName',
          position: { x: 40, y: 130 },
          fontSize: 11,
          fontFamily: 'Helvetica-Bold',
          showLine: true,
          lineLength: 360
        }
      ],
      margins: {
        top: 50,
        bottom: 50,
        left: 40,
        right: 60
      }
    };

    // Create PDF document - A4 size
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: config.margins?.top || 50,
        bottom: config.margins?.bottom || 50,
        left: config.margins?.left || 40,
        right: config.margins?.right || 60
      }
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `onboarding-${employeeName.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Create write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Draw title
    if (config.title) {
      const margins = config.margins || { left: 40, right: 40, top: 50, bottom: 50 };
      const pageWidth = 595;
      const contentWidth = pageWidth - margins.left - margins.right;
      
      let titleX, titleWidth, titleAlign;
      
      if (config.title.align === 'center') {
        // Center alignment: use margins and center within content area
        titleX = margins.left;
        titleWidth = contentWidth;
        titleAlign = 'center';
      } else if (config.title.align === 'right') {
        // Right alignment
        titleX = margins.left;
        titleWidth = contentWidth;
        titleAlign = 'right';
      } else {
        // Left alignment or default
        titleX = Math.max(margins.left, Math.min(config.title.position.x || margins.left, pageWidth - margins.right));
        titleWidth = pageWidth - titleX - margins.right;
        titleAlign = 'left';
      }
      
      doc.fontSize(config.title.fontSize || 22)
         .font(config.title.fontFamily || 'Helvetica-Bold')
         .fillColor(config.title.color || '#000000')
         .text(config.title.text || '', titleX, config.title.position.y || 50, {
           align: titleAlign,
           width: titleWidth
         });
    }

    // Draw fields
    if (config.fields && Array.isArray(config.fields)) {
      config.fields.forEach(field => {
        // Get field value based on key
        let fieldValue = '';
        switch (field.key) {
          case 'date':
            fieldValue = formattedGeneratedDate;
            break;
          case 'employeeName':
            fieldValue = employeeName;
            break;
          case 'employeeId':
            fieldValue = employeeId || '';
            break;
          case 'email':
            fieldValue = email || '';
            break;
          case 'position':
            fieldValue = position || '';
            break;
          case 'department':
            fieldValue = department || '';
            break;
          case 'location':
            fieldValue = formattedLocation;
            break;
          default:
            fieldValue = '';
        }

        // Draw label
        doc.fontSize(field.fontSize || 11)
           .font(field.fontFamily || 'Helvetica-Bold')
           .fillColor('#000000')
           .text(field.label || '', field.position.x || 40, field.position.y || 100);

        // Draw value and line if enabled
        if (field.showLine) {
          const lineX = field.position.x + (field.label ? field.label.length * 6 : 0);
          const lineY = field.position.y + 12;
          const lineLength = field.lineLength || 100;
          
          // Draw value
          doc.font(field.fontFamily?.replace('-Bold', '') || 'Helvetica')
             .text(fieldValue, lineX, field.position.y);
          
          // Draw line
          doc.moveTo(lineX, lineY)
             .lineTo(lineX + lineLength, lineY)
             .stroke();
        } else {
          // Just draw value without line
          doc.font(field.fontFamily?.replace('-Bold', '') || 'Helvetica')
             .text(fieldValue, field.position.x + (field.label ? field.label.length * 6 : 0), field.position.y);
        }
      });
    }

    // Draw images
    if (config.images && Array.isArray(config.images)) {
      for (const image of config.images) {
        if (image.path) {
          const imagePath = path.join(__dirname, '..', image.path);
          if (await fs.pathExists(imagePath)) {
            try {
              doc.image(imagePath, image.position.x || 450, image.position.y || 30, {
                width: image.width || 100,
                height: image.height || 50
              });
            } catch (imgError) {
              console.error('Error adding image:', imgError);
            }
          }
        }
      }
    }

    // Set Y position for table (after fields)
    let tableStartY = 180;
    if (config.fields && config.fields.length > 0) {
      const lastField = config.fields[config.fields.length - 1];
      tableStartY = lastField.position.y + 50;
    }
    if (config.table && config.table.position) {
      tableStartY = config.table.position.y;
    }
    doc.y = tableStartY;

    // Description text (if not in template)
    if (!config.table || !config.table.enabled || config.table.showDescription !== false) {
      doc.fontSize(11)
         .font('Helvetica')
         .text('Descripción de activos asignados por Helpdesk:', 40, doc.y)
         .moveDown(0.5);
    }

    // Assets Table - use template config if available
    if (config.table && config.table.enabled && assets && assets.length > 0) {
      const tableConfig = config.table;
      const tableStartY = doc.y;
      const leftMargin = tableConfig.position?.x || 40;
      const pageWidth = 595;
      const rightMargin = pageWidth - (config.margins?.right || 60);
      const tableWidth = rightMargin - leftMargin;
      
      // Use column widths from template or default
      const columns = tableConfig.columns || [
        { name: 'ITEM', width: 50, align: 'center' },
        { name: 'S/N', width: 100, align: 'center' },
        { name: 'DESCRIPCIÓN DEL ÍTEM', width: 180, align: 'left' },
        { name: 'Accesorios', width: 120, align: 'center' },
        { name: 'Observación', width: 100, align: 'left' }
      ];

      // Table header with style from template
      const headerStyle = tableConfig.headerStyle || {
        backgroundColor: '#808080',
        textColor: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'Helvetica-Bold'
      };
      const headerY = tableStartY;
      doc.rect(leftMargin, headerY, tableWidth, 25)
         .fillAndStroke(headerStyle.backgroundColor, '#000000');

      // Draw vertical lines for columns
      doc.strokeColor('#000000');
      doc.lineWidth(1);
      
      // Left border
      doc.moveTo(leftMargin, headerY)
         .lineTo(leftMargin, headerY + 25 + (assets.length * 20))
         .stroke();
      
      // Header text and vertical lines
      let currentX = leftMargin;
      doc.fontSize(headerStyle.fontSize)
         .font(headerStyle.fontFamily)
         .fillColor(headerStyle.textColor);
      
      columns.forEach((col, index) => {
        const colWidth = col.width;
        const textX = currentX + (colWidth / 2);
        
        // Draw column header text
        doc.text(col.name, textX, headerY + 8, { 
          width: colWidth, 
          align: col.align || 'left' 
        });
        
        // Draw vertical line after column
        currentX += colWidth;
        doc.moveTo(currentX, headerY)
           .lineTo(currentX, headerY + 25 + (assets.length * 20))
           .stroke();
      });
      
      doc.fillColor('#000000');

      // Draw horizontal lines
      // Header bottom line
      doc.moveTo(leftMargin, headerY + 25)
         .lineTo(leftMargin + tableWidth, headerY + 25)
         .stroke();

      // Table rows
      const rowStyle = tableConfig.rowStyle || {
        fontSize: 9,
        fontFamily: 'Helvetica'
      };
      
      let currentY = headerY + 25;
      assets.forEach((asset, index) => {
        // Check if we need a new page
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          // Redraw vertical lines on new page
          doc.moveTo(leftMargin, currentY - 25)
             .lineTo(leftMargin, currentY + 20)
             .stroke();
          let colX = leftMargin;
          columns.forEach(col => {
            colX += col.width;
            doc.moveTo(colX, currentY - 25)
               .lineTo(colX, currentY + 20)
               .stroke();
          });
        }

        // Draw row top border (horizontal line)
        doc.moveTo(leftMargin, currentY)
           .lineTo(leftMargin + tableWidth, currentY)
           .stroke();

        // Row content - map asset data to columns
        let cellX = leftMargin + 5;
        doc.fontSize(rowStyle.fontSize)
           .font(rowStyle.fontFamily);
        
        columns.forEach((col, colIndex) => {
          let cellValue = '';
          // Map column names to asset properties
          if (col.name === 'ITEM' || col.name.includes('ITEM')) {
            cellValue = (index + 1).toString();
          } else if (col.name === 'S/N' || col.name.includes('S/N')) {
            cellValue = asset.serial || asset.asset_tag || '-';
          } else if (col.name.includes('DESCRIPCIÓN') || col.name.includes('DESCRIPCION')) {
            cellValue = asset.name || '-';
          } else if (col.name === 'Accesorios') {
            cellValue = asset.category || '-';
          } else if (col.name === 'Observación') {
            cellValue = asset.notes || '-';
          } else {
            cellValue = '-';
          }
          
          doc.text(cellValue, cellX, currentY + 6, { 
            width: col.width, 
            align: col.align || 'left' 
          });
          cellX += col.width;
        });

        currentY += 20;
        
        // Draw row bottom border (horizontal line)
        doc.moveTo(leftMargin, currentY)
           .lineTo(leftMargin + tableWidth, currentY)
           .stroke();
      });

      doc.y = currentY + 10;
    } else if (!config.table || config.table.enabled !== false) {
      // Default table if no template or template doesn't disable it
      const tableStartY = doc.y;
      const leftMargin = 40;
      const pageWidth = 595;
      const rightMargin = pageWidth - 60;
      const tableWidth = rightMargin - leftMargin;
      
      const colWidths = {
        item: 50,
        sn: 100,
        desc: 180,
        acc: 120,
        obs: 100
      };

      // Header
      const headerY = tableStartY;
      doc.rect(leftMargin, headerY, tableWidth, 25)
         .fillAndStroke('#808080', '#000000');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('ITEM', leftMargin + 5, headerY + 8, { width: colWidths.item, align: 'center' })
         .text('S/N', leftMargin + colWidths.item + 5, headerY + 8, { width: colWidths.sn, align: 'center' })
         .text('DESCRIPCIÓN DEL ÍTEM', leftMargin + colWidths.item + colWidths.sn + 5, headerY + 8, { width: colWidths.desc, align: 'center' })
         .text('Accesorios', leftMargin + colWidths.item + colWidths.sn + colWidths.desc + 5, headerY + 8, { width: colWidths.acc, align: 'center' })
         .text('Observación', leftMargin + colWidths.item + colWidths.sn + colWidths.desc + colWidths.acc + 5, headerY + 8, { width: colWidths.obs, align: 'center' })
         .fillColor('#000000');

      // Empty row
      doc.rect(leftMargin, headerY + 25, tableWidth, 20)
         .stroke();

      doc.y = headerY + 50;
    }

    // Signatures section - use template config if available
    if (config.signatures && config.signatures.enabled) {
      const sigConfig = config.signatures;
      const baseX = sigConfig.position?.x || 40;
      const baseY = sigConfig.position?.y || doc.y + 20;
      
      doc.fontSize(11)
         .font('Helvetica');
      
      if (sigConfig.fields && Array.isArray(sigConfig.fields)) {
        sigConfig.fields.forEach(field => {
          doc.text(
            field.label || '',
            baseX + (field.position?.x || 0),
            baseY + (field.position?.y || 0)
          );
        });
      }
    } else {
      // Default signatures
      doc.moveDown(2);
      const signatureY = doc.y;
      doc.fontSize(11)
         .font('Helvetica')
         .text('Helpdesk __________________', 40, signatureY)
         .text('Colaborador ________________', 350, signatureY);
    }

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log(`Onboarding PDF generated: ${filepath}`);
        resolve();
      });
      stream.on('error', reject);
    });

    return filepath;

  } catch (error) {
    console.error('Error generating onboarding PDF:', error);
    throw new Error('Failed to generate onboarding PDF');
  }
}

module.exports = {
  generateAssignmentDocument,
  generateAuditReport,
  generateResponsibilityLetter,
  generateOnboardingPDF
};
