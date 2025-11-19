-- PDF Templates Table for Onboarding PDFs
CREATE TABLE IF NOT EXISTS pdf_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSON NOT NULL COMMENT 'Configuration for PDF layout, fields, images, etc.',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_name (name),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active)
);

-- Template config JSON structure:
-- {
--   "title": {
--     "text": "Certificado de Asignación de Activos",
--     "fontSize": 22,
--     "fontFamily": "Helvetica-Bold",
--     "align": "center",
--     "position": { "x": 0, "y": 50 }
--   },
--   "fields": [
--     {
--       "type": "text",
--       "label": "Fecha:",
--       "key": "date",
--       "position": { "x": 40, "y": 100 },
--       "fontSize": 11,
--       "fontFamily": "Helvetica-Bold",
--       "showLine": true
--     },
--     {
--       "type": "text",
--       "label": "Nombre Colaborador:",
--       "key": "employeeName",
--       "position": { "x": 40, "y": 130 },
--       "fontSize": 11,
--       "fontFamily": "Helvetica-Bold",
--       "showLine": true
--     }
--   ],
--   "images": [
--     {
--       "type": "logo",
--       "path": "/uploads/logos/company-logo.png",
--       "position": { "x": 450, "y": 30 },
--       "width": 100,
--       "height": 50
--     }
--   ],
--   "table": {
--     "enabled": true,
--     "position": { "x": 40, "y": 180 },
--     "columns": [
--       { "name": "ITEM", "width": 50, "align": "center" },
--       { "name": "S/N", "width": 100, "align": "center" },
--       { "name": "DESCRIPCIÓN DEL ÍTEM", "width": 180, "align": "left" },
--       { "name": "Accesorios", "width": 120, "align": "center" },
--       { "name": "Observación", "width": 100, "align": "left" }
--     ],
--     "headerStyle": {
--       "backgroundColor": "#808080",
--       "textColor": "#FFFFFF",
--       "fontSize": 10,
--       "fontFamily": "Helvetica-Bold"
--     },
--     "rowStyle": {
--       "fontSize": 9,
--       "fontFamily": "Helvetica"
--     }
--   },
--   "signatures": {
--     "enabled": true,
--     "position": { "x": 40, "y": 700 },
--     "fields": [
--       { "label": "Helpdesk __________________", "position": { "x": 40, "y": 0 } },
--       { "label": "Colaborador ________________", "position": { "x": 350, "y": 0 } }
--     ]
--   },
--   "margins": {
--     "top": 50,
--     "bottom": 50,
--     "left": 40,
--     "right": 60
--   }
-- }

-- Insert default template
INSERT INTO pdf_templates (name, description, template_config, is_default, is_active, created_by) VALUES
('Template por Defecto', 'Template estándar para PDFs de onboarding', 
 JSON_OBJECT(
   'title', JSON_OBJECT('text', 'Certificado de Asignación de Activos', 'fontSize', 22, 'fontFamily', 'Helvetica-Bold', 'align', 'center', 'position', JSON_OBJECT('x', 0, 'y', 50)),
   'fields', JSON_ARRAY(
     JSON_OBJECT('type', 'text', 'label', 'Fecha:', 'key', 'date', 'position', JSON_OBJECT('x', 40, 'y', 100), 'fontSize', 11, 'fontFamily', 'Helvetica-Bold', 'showLine', true),
     JSON_OBJECT('type', 'text', 'label', 'Nombre Colaborador:', 'key', 'employeeName', 'position', JSON_OBJECT('x', 40, 'y', 130), 'fontSize', 11, 'fontFamily', 'Helvetica-Bold', 'showLine', true)
   ),
   'table', JSON_OBJECT(
     'enabled', true,
     'position', JSON_OBJECT('x', 40, 'y', 180),
     'columns', JSON_ARRAY(
       JSON_OBJECT('name', 'ITEM', 'width', 50, 'align', 'center'),
       JSON_OBJECT('name', 'S/N', 'width', 100, 'align', 'center'),
       JSON_OBJECT('name', 'DESCRIPCIÓN DEL ÍTEM', 'width', 180, 'align', 'left'),
       JSON_OBJECT('name', 'Accesorios', 'width', 120, 'align', 'center'),
       JSON_OBJECT('name', 'Observación', 'width', 100, 'align', 'left')
     ),
     'headerStyle', JSON_OBJECT('backgroundColor', '#808080', 'textColor', '#FFFFFF', 'fontSize', 10, 'fontFamily', 'Helvetica-Bold'),
     'rowStyle', JSON_OBJECT('fontSize', 9, 'fontFamily', 'Helvetica')
   ),
   'signatures', JSON_OBJECT(
     'enabled', true,
     'position', JSON_OBJECT('x', 40, 'y', 700),
     'fields', JSON_ARRAY(
       JSON_OBJECT('label', 'Helpdesk __________________', 'position', JSON_OBJECT('x', 40, 'y', 0)),
       JSON_OBJECT('label', 'Colaborador ________________', 'position', JSON_OBJECT('x', 350, 'y', 0))
     )
   ),
   'margins', JSON_OBJECT('top', 50, 'bottom', 50, 'left', 40, 'right', 60)
 ),
 TRUE, TRUE, 1);

