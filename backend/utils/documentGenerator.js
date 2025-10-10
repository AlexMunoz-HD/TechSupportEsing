const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
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

module.exports = {
  generateAssignmentDocument,
  generateAuditReport,
  generateResponsibilityLetter
};
