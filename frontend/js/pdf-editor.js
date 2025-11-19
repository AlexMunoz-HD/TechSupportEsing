// PDF Template Editor Module
class PDFTemplateEditor {
    constructor() {
        this.currentTemplate = null;
        this.apiBase = '/onboarding/pdf-templates';
        this.canvas = null;
        this.ctx = null;
        this.elements = [];
        this.selectedElement = null;
        this.scale = 1;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.wasDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.templates = [];
        this.imageCache = {};
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Canvas will be created when the editor is opened
    }

    setupEventListeners() {
        // Event listeners will be set up when editor is opened
    }

    // Open editor modal with template selector
    async openEditor(templateId = null) {
        // If no templateId, show template selector
        if (!templateId) {
            await this.showTemplateSelector();
        } else {
            this.createEditorModal(templateId);
        }
    }

    // Show template selector modal
    async showTemplateSelector() {
        try {
            // Load all templates
            const response = await window.auth.apiRequest(this.apiBase);
            if (response.ok) {
                const data = await response.json();
                this.templates = data.templates || [];
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = [];
        }

        // Remove existing modal if any
        const existingModal = document.getElementById('pdf-editor-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create selector modal
        const modal = document.createElement('div');
        modal.id = 'pdf-template-selector-modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            z-index: 10000000 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-family: Arial, sans-serif !important;
        `;

        let templatesList = '';
        this.templates.forEach(template => {
            templatesList += `
                <div onclick="pdfEditor.createEditorModal(${template.id})" style="
                    padding: 15px !important;
                    margin-bottom: 10px !important;
                    background: white !important;
                    border: 2px solid #E5E7EB !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                " onmouseover="this.style.borderColor='#3B82F6'; this.style.transform='translateY(-2px)'" 
                   onmouseout="this.style.borderColor='#E5E7EB'; this.style.transform='translateY(0)'">
                    <strong style="color: #1F2937; font-size: 16px;">${template.name}</strong>
                    ${template.is_default ? '<span style="color: #059669; font-size: 12px; margin-left: 10px;">(Por defecto)</span>' : ''}
                    ${template.description ? `<p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">${template.description}</p>` : ''}
                </div>
            `;
        });

        modal.innerHTML = `
            <div style="
                background: white !important;
                border-radius: 12px !important;
                width: 90vw !important;
                max-width: 600px !important;
                padding: 30px !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 0;">
                        Seleccionar o Crear Template
                    </h2>
                    <button onclick="document.getElementById('pdf-template-selector-modal').remove()" style="
                        background: #EF4444 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 12px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 16px !important;
                    ">✕</button>
                </div>
                <div style="margin-bottom: 20px;">
                    <button onclick="pdfEditor.createEditorModal(null)" style="
                        background: linear-gradient(to right, #3B82F6, #2563EB) !important;
                        color: white !important;
                        border: none !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        cursor: pointer !important;
                        font-size: 16px !important;
                        font-weight: bold !important;
                        width: 100% !important;
                        margin-bottom: 20px !important;
                    ">
                        ➕ Crear Nuevo Template
                    </button>
                </div>
                ${this.templates.length > 0 ? `
                    <h3 style="color: #374151; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                        Templates Existentes
                    </h3>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${templatesList}
                    </div>
                ` : '<p style="color: #6B7280; text-align: center; padding: 20px;">No hay templates guardados</p>'}
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Create editor modal
    async createEditorModal(templateId = null) {
        // Remove existing modals if any
        const existingModal = document.getElementById('pdf-editor-modal');
        if (existingModal) {
            existingModal.remove();
        }
        const selectorModal = document.getElementById('pdf-template-selector-modal');
        if (selectorModal) {
            selectorModal.remove();
        }

        // Load template if editing
        if (templateId) {
            try {
                const response = await window.auth.apiRequest(`${this.apiBase}/${templateId}`);
                if (response.ok) {
                    this.currentTemplate = await response.json();
                }
            } catch (error) {
                console.error('Error loading template:', error);
            }
        } else {
            // Create new template with default config
            this.currentTemplate = {
                name: 'Nuevo Template',
                description: '',
                template_config: this.getDefaultConfig()
            };
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'pdf-editor-modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.7) !important;
            z-index: 10000000 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-family: Arial, sans-serif !important;
        `;

        modal.innerHTML = `
            <div style="
                background: white !important;
                border-radius: 12px !important;
                width: 95vw !important;
                height: 95vh !important;
                max-width: 1400px !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
            ">
                <!-- Header -->
                <div style="
                    padding: 20px !important;
                    border-bottom: 2px solid #E5E7EB !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                ">
                    <div>
                        <h2 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 0;">
                            📄 Editor de Plantilla PDF
                        </h2>
                        <p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">
                            Edita el diseño, posiciones y contenido del PDF de onboarding
                        </p>
                    </div>
                    <button onclick="pdfEditor.closeEditor()" style="
                        background: #EF4444 !important;
                        color: white !important;
                        border: none !important;
                        padding: 10px 15px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 16px !important;
                        font-weight: bold !important;
                    ">✕ Cerrar</button>
                </div>

                <!-- Main Content -->
                <div style="
                    flex: 1 !important;
                    display: flex !important;
                    overflow: hidden !important;
                ">
                    <!-- Left Sidebar - Properties -->
                    <div style="
                        width: 300px !important;
                        border-right: 2px solid #E5E7EB !important;
                        overflow-y: auto !important;
                        padding: 20px !important;
                        background: #F9FAFB !important;
                    ">
                        <div id="pdf-editor-properties">
                            <!-- Properties will be populated here -->
                        </div>
                    </div>

                    <!-- Center - Canvas/Preview -->
                    <div style="
                        flex: 1 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        overflow: hidden !important;
                        background: #F3F4F6 !important;
                    ">
                        <!-- Toolbar -->
                        <div style="
                            padding: 15px 20px !important;
                            border-bottom: 2px solid #E5E7EB !important;
                            background: white !important;
                            display: flex !important;
                            gap: 10px !important;
                            flex-wrap: wrap !important;
                        ">
                            <button onclick="pdfEditor.addTextField()" style="
                                background: #3B82F6 !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 16px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                font-size: 14px !important;
                            ">➕ Agregar Campo de Texto</button>
                            <button onclick="pdfEditor.addImage()" style="
                                background: #10B981 !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 16px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                font-size: 14px !important;
                            ">🖼️ Agregar Imagen</button>
                        <button onclick="pdfEditor.previewPDF()" style="
                            background: #8B5CF6 !important;
                            color: white !important;
                            border: none !important;
                            padding: 8px 16px !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            font-size: 14px !important;
                        ">👁️ Vista Previa</button>
                        <button onclick="pdfEditor.saveTemplate()" style="
                            background: #059669 !important;
                            color: white !important;
                            border: none !important;
                            padding: 8px 16px !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            font-size: 14px !important;
                            font-weight: bold !important;
                        ">💾 Guardar Template</button>
                        <div style="
                            padding: 8px 16px !important;
                            background: #F3F4F6 !important;
                            border-radius: 6px !important;
                            font-size: 12px !important;
                            color: #6B7280 !important;
                        ">
                            💡 Arrastra elementos con el mouse para moverlos
                        </div>
                        </div>

                        <!-- Canvas Container -->
                        <div style="
                            flex: 1 !important;
                            overflow: auto !important;
                            padding: 20px !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: flex-start !important;
                        ">
                            <div id="pdf-editor-canvas-container" style="
                                background: white !important;
                                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                                position: relative !important;
                            ">
                                <canvas id="pdf-editor-canvas" style="
                                    border: 1px solid #D1D5DB !important;
                                    cursor: crosshair !important;
                                    user-select: none !important;
                                "></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Right Sidebar - Elements List -->
                    <div style="
                        width: 280px !important;
                        border-left: 2px solid #E5E7EB !important;
                        overflow-y: auto !important;
                        padding: 20px !important;
                        background: #F9FAFB !important;
                        display: flex !important;
                        flex-direction: column !important;
                    ">
                        <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                            Agregar Elementos
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                            <button onclick="pdfEditor.addElement('title')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">1. Título</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('date')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">2. Fecha</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('employeeName')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">3. Nombre Colaborador</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('table')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">4. Tabla</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('signatureHelpdesk')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">5. Firma Helpdesk</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('signatureEmployee')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">6. Firma Colaborador</strong>
                            </button>
                            <button onclick="pdfEditor.addElement('logo')" style="
                                background: white !important;
                                border: 2px solid #D1D5DB !important;
                                padding: 12px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                text-align: left !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF'" 
                               onmouseout="this.style.borderColor='#D1D5DB'; this.style.background='white'">
                                <strong style="color: #1F2937;">7. Logo</strong>
                            </button>
                        </div>
                        <div style="border-top: 2px solid #E5E7EB; padding-top: 15px;">
                            <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                                Elementos en el PDF
                            </h3>
                            <div id="pdf-editor-elements-list">
                                <!-- Elements list will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Initialize canvas
        this.initializeCanvas();
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Get default template configuration - blank page
    getDefaultConfig() {
        return {
            title: null,
            fields: [],
            images: [],
            table: {
                enabled: false,
                position: { x: 40, y: 200 },
                columns: [],
                rows: 0,
                headerStyle: {
                    backgroundColor: '#808080',
                    textColor: '#FFFFFF',
                    fontSize: 10,
                    fontFamily: 'Helvetica-Bold'
                },
                rowStyle: {
                    fontSize: 9,
                    fontFamily: 'Helvetica'
                }
            },
            signatures: {
                enabled: false,
                position: { x: 40, y: 700 },
                fields: []
            },
            margins: {
                top: 50,
                bottom: 50,
                left: 40,
                right: 60
            }
        };
    }

    // Initialize canvas
    initializeCanvas() {
        const canvas = document.getElementById('pdf-editor-canvas');
        if (!canvas) return;

        // A4 size at 72 DPI (595 x 842 points)
        const scale = 0.8; // Scale down to fit in viewport
        canvas.width = 595 * scale;
        canvas.height = 842 * scale;
        canvas.style.width = (595 * scale) + 'px';
        canvas.style.height = (842 * scale) + 'px';

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = scale;

        // Add event handlers for selecting and dragging elements
        canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });
        canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
        canvas.addEventListener('click', (e) => {
            // Only handle click if we weren't dragging
            if (!this.isDragging && !this.wasDragging) {
                this.handleCanvasClick(e);
            }
            this.wasDragging = false;
        });
        canvas.addEventListener('mouseleave', (e) => {
            this.handleMouseUp(e);
        });
    }

    // Render template on canvas
    renderTemplate() {
        if (!this.ctx || !this.currentTemplate) return;

        const config = this.currentTemplate.template_config;
        const scale = this.scale;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw margins
        this.ctx.strokeStyle = '#E5E7EB';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            config.margins.left * scale,
            config.margins.top * scale,
            (595 - config.margins.left - config.margins.right) * scale,
            (842 - config.margins.top - config.margins.bottom) * scale
        );

        // Draw title
        if (config.title) {
            this.ctx.font = `${config.title.fontSize * scale}px ${config.title.fontFamily}`;
            this.ctx.fillStyle = config.title.color || '#000000';
            this.ctx.textAlign = config.title.align || 'center';
            const titleX = config.title.align === 'center' 
                ? (this.canvas.width / 2) 
                : (config.title.position.x * scale);
            const titleY = config.title.position.y * scale;
            this.ctx.fillText(
                config.title.text,
                titleX,
                titleY
            );
            
            // Draw selection border if selected
            if (this.selectedElement && this.selectedElement.type === 'title') {
                this.ctx.strokeStyle = '#3B82F6';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(0, titleY - 15, this.canvas.width, 30);
            }
        }

        // Draw fields
        if (config.fields) {
            config.fields.forEach((field, index) => {
                this.drawField(field, index);
            });
        }

        // Draw images
        if (config.images) {
            config.images.forEach((image, index) => {
                this.drawImage(image, index);
            });
        }

        // Draw table preview
        if (config.table && config.table.enabled) {
            this.drawTablePreview(config.table);
        }

        // Draw signatures
        if (config.signatures && config.signatures.enabled) {
            this.drawSignatures(config.signatures);
        }
    }

    // Draw a field on canvas
    drawField(field, index) {
        const scale = this.scale;
        const x = field.position.x * scale;
        const y = field.position.y * scale;

        // Draw label
        this.ctx.font = `${field.fontSize * scale}px ${field.fontFamily}`;
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(field.label, x, y);

        // Draw line if enabled
        if (field.showLine) {
            const lineX = x + (field.label.length * 6 * scale);
            const lineY = y + 2;
            const lineLength = (field.lineLength || 100) * scale;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, lineY);
            this.ctx.lineTo(lineX + lineLength, lineY);
            this.ctx.stroke();
        }

        // Draw selection border if selected
        if (this.selectedElement && this.selectedElement.type === 'field' && this.selectedElement.index === index) {
            this.ctx.strokeStyle = '#3B82F6';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 5, y - 15, 400, 20);
        }
    }

    // Draw image on canvas
    drawImage(image, index) {
        const scale = this.scale;
        const x = image.position.x * scale;
        const y = image.position.y * scale;
        const width = (image.width || 100) * scale;
        const height = (image.height || 50) * scale;

        // Try to load and draw actual image if path exists
        if (image.path && image.path.trim() !== '') {
            // Set image source - handle both absolute and relative paths
            let imageSrc = image.path;
            console.log('🔍 Ruta original de imagen:', imageSrc);
            
            if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://')) {
                // Normalize path - ensure it starts with /api/uploads/
                if (imageSrc.startsWith('/api/uploads/')) {
                    // Already correct
                    imageSrc = imageSrc;
                } else if (imageSrc.startsWith('/uploads/')) {
                    imageSrc = '/api' + imageSrc;
                } else if (imageSrc.startsWith('/api/')) {
                    // Already has /api but might need /uploads
                    imageSrc = imageSrc;
                } else if (!imageSrc.startsWith('/')) {
                    // Relative path, assume it's in uploads
                    imageSrc = '/api/uploads/' + imageSrc;
                } else {
                    // Absolute path without /api
                    imageSrc = '/api' + imageSrc;
                }
            }
            
            console.log('🖼️ Ruta final de imagen:', imageSrc);
            
            // Check cache first
            if (this.imageCache[imageSrc] && this.imageCache[imageSrc].complete && this.imageCache[imageSrc].naturalWidth > 0) {
                // Image already loaded, draw it
                const img = this.imageCache[imageSrc];
                try {
                    this.ctx.drawImage(img, x, y, width, height);
                    
                    // Draw border
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x, y, width, height);
                    
                    // Draw selection border and resize handles if selected
                    if (this.selectedElement && this.selectedElement.type === 'image' && this.selectedElement.index === index) {
                        this.ctx.strokeStyle = '#3B82F6';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
                        
                        // Draw resize handles at corners
                        const handleSize = 8;
                        this.ctx.fillStyle = '#3B82F6';
                        this.ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize); // top-left
                        this.ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize); // top-right
                        this.ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // bottom-left
                        this.ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // bottom-right
                    }
                } catch (drawError) {
                    console.error('Error drawing cached image:', drawError);
                    this.drawImagePlaceholder(x, y, width, height, index);
                }
            } else {
                // Load image
                const img = new Image();
                // Don't set crossOrigin - we're loading from same origin through nginx proxy
                
                // Add timeout to detect if image fails to load
                let loadTimeout;
                
                // Define onload handler BEFORE setting src (important for cached images)
                img.onload = () => {
                    if (loadTimeout) clearTimeout(loadTimeout);
                    console.log('✅ Imagen cargada exitosamente:', imageSrc, 'Dimensiones:', img.width, 'x', img.height);
                    console.log('📊 Estado imagen - complete:', img.complete, 'naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);
                    
                    // Cache the image
                    this.imageCache[imageSrc] = img;
                    
                    // Re-render entire template to show the image
                    setTimeout(() => {
                        console.log('🎨 Re-renderizando después de cargar imagen...');
                        this.renderTemplate();
                    }, 50);
                };
                
                // Define onerror handler BEFORE setting src
                img.onerror = (err) => {
                    if (loadTimeout) clearTimeout(loadTimeout);
                    console.error('❌ Error loading image:', imageSrc);
                    console.error('Error details:', err);
                    console.error('Image path:', image.path);
                    console.error('Image element state:', {
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight
                    });
                    
                    // Try alternative paths
                    const altPaths = [
                        '/api' + image.path,
                        image.path,
                        '/api/uploads/images/' + image.path.split('/').pop(),
                        '/uploads/images/' + image.path.split('/').pop()
                    ];
                    
                    let altIndex = 0;
                    const tryNextPath = () => {
                        if (altIndex >= altPaths.length) {
                            console.error('❌ Todas las rutas alternativas fallaron');
                            this.drawImagePlaceholder(x, y, width, height, index);
                            return;
                        }
                        
                        const altSrc = altPaths[altIndex];
                        console.log(`🔄 Intentando ruta alternativa ${altIndex + 1}/${altPaths.length}:`, altSrc);
                        
                        const altImg = new Image();
                        altImg.onload = () => {
                            console.log('✅ Imagen cargada desde ruta alternativa:', altSrc);
                            this.imageCache[altSrc] = altImg;
                            this.imageCache[imageSrc] = altImg; // Also cache with original path
                            setTimeout(() => {
                                this.renderTemplate();
                            }, 50);
                        };
                        altImg.onerror = () => {
                            altIndex++;
                            tryNextPath();
                        };
                        altImg.src = altSrc;
                    };
                    
                    if (!imageSrc.includes('/api/')) {
                        tryNextPath();
                    } else {
                        this.drawImagePlaceholder(x, y, width, height, index);
                    }
                };
                
                console.log('🖼️ Cargando imagen desde:', imageSrc);
                
                // Set timeout BEFORE setting src
                loadTimeout = setTimeout(() => {
                    if (!img.complete || img.naturalWidth === 0) {
                        console.error('⏱️ Timeout cargando imagen después de 5 segundos:', imageSrc);
                        console.error('Estado de imagen - complete:', img.complete, 'naturalWidth:', img.naturalWidth);
                        // Try to trigger error handler
                        img.onerror(new Error('Image load timeout'));
                    }
                }, 5000);
                
                // Set image source LAST (after all handlers are defined)
                img.src = imageSrc;
                
                // Draw placeholder while loading
                this.drawImagePlaceholder(x, y, width, height, index);
            }
        } else {
            // Draw placeholder if no path
            this.drawImagePlaceholder(x, y, width, height, index);
        }
    }

    // Draw image placeholder
    drawImagePlaceholder(x, y, width, height, index) {
        // Draw placeholder rectangle
        this.ctx.strokeStyle = '#9CA3AF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);

        // Draw image icon
        this.ctx.font = `${12 * this.scale}px Arial`;
        this.ctx.fillStyle = '#9CA3AF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🖼️', x + width / 2, y + height / 2);

        // Draw selection border and resize handles if selected
        if (this.selectedElement && this.selectedElement.type === 'image' && this.selectedElement.index === index) {
            this.ctx.strokeStyle = '#3B82F6';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
            
            // Draw resize handles at corners
            const handleSize = 8;
            this.ctx.fillStyle = '#3B82F6';
            this.ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize); // top-left
            this.ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize); // top-right
            this.ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // bottom-left
            this.ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // bottom-right
        }
    }

    // Draw table preview
    drawTablePreview(table) {
        const scale = this.scale;
        const startX = table.position.x * scale;
        const startY = table.position.y * scale;
        let currentX = startX;

        // Calculate total table width
        const totalWidth = table.columns ? table.columns.reduce((sum, col) => sum + (col.width || 50), 0) * scale : 500 * scale;
        const headerHeight = 25 * scale;
        const rowHeight = 20 * scale;
        const numRows = table.rows || 5;
        const totalHeight = headerHeight + (numRows * rowHeight);

        // Draw header background
        this.ctx.fillStyle = table.headerStyle.backgroundColor || '#808080';
        this.ctx.fillRect(startX, startY, totalWidth, headerHeight);

        // Draw column headers with vertical lines
        this.ctx.font = `${table.headerStyle.fontSize * scale}px ${table.headerStyle.fontFamily}`;
        this.ctx.fillStyle = table.headerStyle.textColor || '#FFFFFF';
        this.ctx.textAlign = 'center';

        // Draw vertical lines for columns
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        
        // Left border
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(startX, startY + totalHeight);
        this.ctx.stroke();

        table.columns.forEach((col, index) => {
            const colWidth = (col.width || 50) * scale;
            const colX = currentX + (colWidth / 2);
            
            // Draw column header text
            this.ctx.fillText(col.name, colX, startY + (headerHeight / 2) + 5);
            
            // Draw vertical line after column
            currentX += colWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, startY);
            this.ctx.lineTo(currentX, startY + totalHeight);
            this.ctx.stroke();
        });

        // Draw horizontal lines (header bottom and rows)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        
        // Header bottom line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY + headerHeight);
        this.ctx.lineTo(startX + totalWidth, startY + headerHeight);
        this.ctx.stroke();

        // Draw rows with horizontal lines
        for (let i = 0; i < numRows; i++) {
            const rowY = startY + headerHeight + (i * rowHeight);
            
            // Draw row border (top line)
            this.ctx.beginPath();
            this.ctx.moveTo(startX, rowY);
            this.ctx.lineTo(startX + totalWidth, rowY);
            this.ctx.stroke();
            
            // Draw bottom line of last row
            if (i === numRows - 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(startX, rowY + rowHeight);
                this.ctx.lineTo(startX + totalWidth, rowY + rowHeight);
                this.ctx.stroke();
            }
        }

        // Draw selection border and resize handles if selected
        if (this.selectedElement && this.selectedElement.type === 'table') {
            // Selection border
            this.ctx.strokeStyle = '#3B82F6';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(startX - 2, startY - 2, totalWidth + 4, totalHeight + 4);
            
            // Resize handles at corners
            const handleSize = 8;
            const handles = [
                { x: startX - handleSize/2, y: startY - handleSize/2, corner: 'top-left' },
                { x: startX + totalWidth - handleSize/2, y: startY - handleSize/2, corner: 'top-right' },
                { x: startX - handleSize/2, y: startY + totalHeight - handleSize/2, corner: 'bottom-left' },
                { x: startX + totalWidth - handleSize/2, y: startY + totalHeight - handleSize/2, corner: 'bottom-right' }
            ];
            
            handles.forEach(handle => {
                this.ctx.fillStyle = '#3B82F6';
                this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
            });
        }
    }

    // Draw signatures
    drawSignatures(signatures) {
        const scale = this.scale;
        const baseX = signatures.position.x * scale;
        const baseY = signatures.position.y * scale;

        this.ctx.font = `${11 * scale}px Helvetica`;
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'left';

        signatures.fields.forEach(field => {
            this.ctx.fillText(
                field.label,
                baseX + (field.position.x * scale),
                baseY + (field.position.y * scale)
            );
        });
    }

    // Handle mouse down - start dragging
    handleMouseDown(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        const config = this.currentTemplate.template_config;
        this.isDragging = false;

        // Check if clicked on a field
        if (config.fields && config.fields.length > 0) {
            config.fields.forEach((field, index) => {
                const fieldX = field.position.x;
                const fieldY = field.position.y;
                const fieldWidth = field.lineLength || 200;
                const fieldHeight = 20;
                if (x >= fieldX - 5 && x <= fieldX + fieldWidth + 5 && y >= fieldY - 15 && y <= fieldY + fieldHeight) {
                    this.selectedElement = { type: 'field', index };
                    this.isDragging = true;
                    this.dragOffset = {
                        x: x - fieldX,
                        y: y - fieldY
                    };
                    this.canvas.style.cursor = 'grabbing';
                    this.renderTemplate();
                    this.renderProperties();
                    return;
                }
            });
        }

        // Check if clicked on an image
        if (config.images && config.images.length > 0) {
            config.images.forEach((image, index) => {
                const imgX = image.position.x;
                const imgY = image.position.y;
                const imgWidth = image.width || 100;
                const imgHeight = image.height || 50;
                const handleSize = 8 / this.scale;
                
                // Check resize handles first
                const handles = [
                    { x: imgX - handleSize, y: imgY - handleSize, corner: 'top-left' },
                    { x: imgX + imgWidth - handleSize, y: imgY - handleSize, corner: 'top-right' },
                    { x: imgX - handleSize, y: imgY + imgHeight - handleSize, corner: 'bottom-left' },
                    { x: imgX + imgWidth - handleSize, y: imgY + imgHeight - handleSize, corner: 'bottom-right' }
                ];
                
                for (const handle of handles) {
                    if (x >= handle.x && x <= handle.x + (handleSize * 2) && 
                        y >= handle.y && y <= handle.y + (handleSize * 2)) {
                        this.selectedElement = { type: 'image', index };
                        this.isResizing = true;
                        this.resizeHandle = handle.corner;
                        this.dragOffset = {
                            x: x - imgX,
                            y: y - imgY
                        };
                        this.canvas.style.cursor = this.getResizeCursor(handle.corner);
                        this.renderTemplate();
                        this.renderProperties();
                        return;
                    }
                }
                
                // Check if clicked on image body
                if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
                    this.selectedElement = { type: 'image', index };
                    this.isDragging = true;
                    this.dragOffset = {
                        x: x - imgX,
                        y: y - imgY
                    };
                    this.canvas.style.cursor = 'grabbing';
                    this.renderTemplate();
                    this.renderProperties();
                    return;
                }
            });
        }

        // Check if clicked on title
        if (config.title) {
            const titleY = config.title.position.y;
            const titleHeight = (config.title.fontSize || 22) * 1.2;
            if (x >= 0 && x <= 595 && y >= titleY - titleHeight && y <= titleY + 10) {
                this.selectedElement = { type: 'title' };
                this.isDragging = true;
                this.dragOffset = {
                    x: x - (config.title.position.x || 0),
                    y: y - titleY
                };
                this.canvas.style.cursor = 'grabbing';
                this.renderTemplate();
                this.renderProperties();
                return;
            }
        }

        // Check if clicked on table or resize handles
        if (config.table && config.table.enabled) {
            const tableX = config.table.position?.x || 40;
            const tableY = config.table.position?.y || 200;
            const tableWidth = config.table.columns ? config.table.columns.reduce((sum, col) => sum + (col.width || 50), 0) : 500;
            const tableHeight = 25 + ((config.table.rows || 5) * 20);
            const scale = this.scale;
            const handleSize = 8 / scale;
            
            // Check resize handles first
            const handles = [
                { x: tableX - handleSize, y: tableY - handleSize, corner: 'top-left' },
                { x: tableX + tableWidth - handleSize, y: tableY - handleSize, corner: 'top-right' },
                { x: tableX - handleSize, y: tableY + tableHeight - handleSize, corner: 'bottom-left' },
                { x: tableX + tableWidth - handleSize, y: tableY + tableHeight - handleSize, corner: 'bottom-right' }
            ];
            
            for (const handle of handles) {
                if (x >= handle.x && x <= handle.x + (handleSize * 2) && 
                    y >= handle.y && y <= handle.y + (handleSize * 2)) {
                    this.selectedElement = { type: 'table' };
                    this.isResizing = true;
                    this.resizeHandle = handle.corner;
                    this.dragOffset = {
                        x: x - tableX,
                        y: y - tableY
                    };
                    this.canvas.style.cursor = this.getResizeCursor(handle.corner);
                    this.renderTemplate();
                    this.renderProperties();
                    return;
                }
            }
            
            // Check if clicked on table body
            if (x >= tableX && x <= tableX + tableWidth && y >= tableY && y <= tableY + tableHeight) {
                this.selectedElement = { type: 'table' };
                this.isDragging = true;
                this.dragOffset = {
                    x: x - tableX,
                    y: y - tableY
                };
                this.canvas.style.cursor = 'grabbing';
                this.renderTemplate();
                this.renderProperties();
                return;
            }
        }

        // Check if clicked on signatures
        if (config.signatures && config.signatures.enabled && config.signatures.fields) {
            config.signatures.fields.forEach((sig, index) => {
                const sigX = (config.signatures.position.x || 40) + (sig.position?.x || 0);
                const sigY = (config.signatures.position.y || 700) + (sig.position?.y || 0);
                if (x >= sigX - 5 && x <= sigX + 200 && y >= sigY - 10 && y <= sigY + 15) {
                    this.selectedElement = { type: 'signature', index };
                    this.isDragging = true;
                    this.dragOffset = {
                        x: x - sigX,
                        y: y - sigY
                    };
                    this.canvas.style.cursor = 'grabbing';
                    this.renderTemplate();
                    this.renderProperties();
                    return;
                }
            });
        }
    }

    // Get resize cursor based on corner
    getResizeCursor(corner) {
        const cursors = {
            'top-left': 'nw-resize',
            'top-right': 'ne-resize',
            'bottom-left': 'sw-resize',
            'bottom-right': 'se-resize'
        };
        return cursors[corner] || 'se-resize';
    }

    // Handle mouse move - drag element or resize table
    handleMouseMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;
        const config = this.currentTemplate.template_config;

        // Handle image resizing
        if (this.isResizing && this.selectedElement && this.selectedElement.type === 'image') {
            const image = config.images[this.selectedElement.index];
            const imgX = image.position.x;
            const imgY = image.position.y;
            const currentWidth = image.width || 100;
            const currentHeight = image.height || 50;
            
            let newX = imgX;
            let newY = imgY;
            let newWidth = currentWidth;
            let newHeight = currentHeight;
            
            switch (this.resizeHandle) {
                case 'top-left':
                    newWidth = currentWidth + (imgX - x);
                    newHeight = currentHeight + (imgY - y);
                    newX = Math.max(0, x);
                    newY = Math.max(0, y);
                    break;
                case 'top-right':
                    newWidth = x - imgX;
                    newHeight = currentHeight + (imgY - y);
                    newY = Math.max(0, y);
                    break;
                case 'bottom-left':
                    newWidth = currentWidth + (imgX - x);
                    newHeight = y - imgY;
                    newX = Math.max(0, x);
                    break;
                case 'bottom-right':
                    newWidth = x - imgX;
                    newHeight = y - imgY;
                    break;
            }
            
            // Constrain to page bounds and minimum size
            newWidth = Math.max(20, Math.min(555 - newX, newWidth));
            newHeight = Math.max(20, Math.min(842 - newY, newHeight));
            
            // Update image position and size
            image.position.x = newX;
            image.position.y = newY;
            image.width = newWidth;
            image.height = newHeight;
            
            this.renderTemplate();
            this.renderProperties();
            this.renderElementsList();
            return;
        }

        // Handle table resizing
        if (this.isResizing && this.selectedElement && this.selectedElement.type === 'table') {
            const table = config.table;
            const tableX = table.position?.x || 40;
            const tableY = table.position?.y || 200;
            const currentWidth = table.columns ? table.columns.reduce((sum, col) => sum + (col.width || 50), 0) : 500;
            const currentHeight = 25 + ((table.rows || 5) * 20);
            
            let newX = tableX;
            let newY = tableY;
            let newWidth = currentWidth;
            let newHeight = currentHeight;
            
            switch (this.resizeHandle) {
                case 'top-left':
                    newWidth = currentWidth + (tableX - x);
                    newHeight = currentHeight + (tableY - y);
                    newX = Math.max(0, x);
                    newY = Math.max(0, y);
                    break;
                case 'top-right':
                    newWidth = x - tableX;
                    newHeight = currentHeight + (tableY - y);
                    newY = Math.max(0, y);
                    break;
                case 'bottom-left':
                    newWidth = currentWidth + (tableX - x);
                    newHeight = y - tableY;
                    newX = Math.max(0, x);
                    break;
                case 'bottom-right':
                    newWidth = x - tableX;
                    newHeight = y - tableY;
                    break;
            }
            
            // Constrain to page bounds
            newWidth = Math.max(100, Math.min(555 - newX, newWidth));
            newHeight = Math.max(50, Math.min(842 - newY, newHeight));
            
            // Update table position
            table.position.x = newX;
            table.position.y = newY;
            
            // Adjust column widths proportionally
            if (table.columns && table.columns.length > 0) {
                const widthRatio = newWidth / currentWidth;
                table.columns.forEach(col => {
                    col.width = Math.max(20, Math.round((col.width || 50) * widthRatio));
                });
            }
            
            // Adjust number of rows based on height
            const headerHeight = 25;
            const rowHeight = 20;
            const availableHeight = newHeight - headerHeight;
            const newRows = Math.max(1, Math.floor(availableHeight / rowHeight));
            table.rows = newRows;
            
            this.renderTemplate();
            this.renderProperties();
            this.renderElementsList();
            return;
        }

        if (!this.isDragging || !this.selectedElement) {
            // Update cursor on hover
            let isOverElement = false;
            let isOverResizeHandle = false;
            
            if (config.fields && config.fields.length > 0) {
                config.fields.forEach(field => {
                    const fieldX = field.position.x;
                    const fieldY = field.position.y;
                    const fieldWidth = field.lineLength || 200;
                    if (x >= fieldX - 5 && x <= fieldX + fieldWidth + 5 && y >= fieldY - 15 && y <= fieldY + 20) {
                        isOverElement = true;
                    }
                });
            }
            if (config.images && config.images.length > 0) {
                config.images.forEach(image => {
                    const imgX = image.position.x;
                    const imgY = image.position.y;
                    const imgWidth = image.width || 100;
                    const imgHeight = image.height || 50;
                    const handleSize = 8 / this.scale;
                    
                    // Check resize handles
                    const handles = [
                        { x: imgX - handleSize, y: imgY - handleSize, corner: 'top-left' },
                        { x: imgX + imgWidth - handleSize, y: imgY - handleSize, corner: 'top-right' },
                        { x: imgX - handleSize, y: imgY + imgHeight - handleSize, corner: 'bottom-left' },
                        { x: imgX + imgWidth - handleSize, y: imgY + imgHeight - handleSize, corner: 'bottom-right' }
                    ];
                    
                    for (const handle of handles) {
                        if (x >= handle.x && x <= handle.x + (handleSize * 2) && 
                            y >= handle.y && y <= handle.y + (handleSize * 2)) {
                            isOverResizeHandle = true;
                            this.canvas.style.cursor = this.getResizeCursor(handle.corner);
                            return;
                        }
                    }
                    
                    if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
                        isOverElement = true;
                    }
                });
            }
            if (config.title) {
                const titleY = config.title.position.y;
                const titleHeight = (config.title.fontSize || 22) * 1.2;
                if (x >= 0 && x <= 595 && y >= titleY - titleHeight && y <= titleY + 10) {
                    isOverElement = true;
                }
            }
            if (config.table && config.table.enabled) {
                const tableX = config.table.position?.x || 40;
                const tableY = config.table.position?.y || 200;
                const tableWidth = config.table.columns ? config.table.columns.reduce((sum, col) => sum + (col.width || 50), 0) : 500;
                const tableHeight = 25 + ((config.table.rows || 5) * 20);
                const handleSize = 8 / this.scale;
                
                // Check resize handles
                const handles = [
                    { x: tableX - handleSize, y: tableY - handleSize, corner: 'top-left' },
                    { x: tableX + tableWidth - handleSize, y: tableY - handleSize, corner: 'top-right' },
                    { x: tableX - handleSize, y: tableY + tableHeight - handleSize, corner: 'bottom-left' },
                    { x: tableX + tableWidth - handleSize, y: tableY + tableHeight - handleSize, corner: 'bottom-right' }
                ];
                
                for (const handle of handles) {
                    if (x >= handle.x && x <= handle.x + (handleSize * 2) && 
                        y >= handle.y && y <= handle.y + (handleSize * 2)) {
                        isOverResizeHandle = true;
                        this.canvas.style.cursor = this.getResizeCursor(handle.corner);
                        return;
                    }
                }
                
                if (x >= tableX && x <= tableX + tableWidth && y >= tableY && y <= tableY + tableHeight) {
                    isOverElement = true;
                }
            }
            if (config.signatures && config.signatures.enabled && config.signatures.fields) {
                config.signatures.fields.forEach(sig => {
                    const sigX = (config.signatures.position.x || 40) + (sig.position?.x || 0);
                    const sigY = (config.signatures.position.y || 700) + (sig.position?.y || 0);
                    if (x >= sigX - 5 && x <= sigX + 200 && y >= sigY - 10 && y <= sigY + 15) {
                        isOverElement = true;
                    }
                });
            }
            this.canvas.style.cursor = isOverResizeHandle ? this.getResizeCursor('bottom-right') : (isOverElement ? 'grab' : 'crosshair');
            return;
        }

        // Update position based on drag
        if (this.selectedElement.type === 'field') {
            const field = config.fields[this.selectedElement.index];
            const fieldWidth = field.lineLength || 200;
            field.position.x = Math.max(0, Math.min(595 - fieldWidth, x - this.dragOffset.x));
            field.position.y = Math.max(0, Math.min(842 - 20, y - this.dragOffset.y));
        } else if (this.selectedElement.type === 'image') {
            const image = config.images[this.selectedElement.index];
            const imgWidth = image.width || 100;
            const imgHeight = image.height || 50;
            image.position.x = Math.max(0, Math.min(595 - imgWidth, x - this.dragOffset.x));
            image.position.y = Math.max(0, Math.min(842 - imgHeight, y - this.dragOffset.y));
        } else if (this.selectedElement.type === 'title') {
            config.title.position.x = Math.max(0, Math.min(595, x - this.dragOffset.x));
            config.title.position.y = Math.max(0, Math.min(842 - 20, y - this.dragOffset.y));
        } else if (this.selectedElement.type === 'table') {
            const table = config.table;
            if (!table.position) table.position = { x: 40, y: 200 };
            const tableWidth = table.columns ? table.columns.reduce((sum, col) => sum + (col.width || 50), 0) : 500;
            const tableHeight = 25 + ((table.rows || 5) * 20);
            table.position.x = Math.max(0, Math.min(595 - tableWidth, x - this.dragOffset.x));
            table.position.y = Math.max(0, Math.min(842 - tableHeight, y - this.dragOffset.y));
        } else if (this.selectedElement.type === 'signature') {
            const sig = config.signatures.fields[this.selectedElement.index];
            if (!sig.position) sig.position = { x: 0, y: 0 };
            const baseX = config.signatures.position.x || 40;
            const baseY = config.signatures.position.y || 700;
            sig.position.x = Math.max(-baseX, Math.min(555 - baseX, x - this.dragOffset.x - baseX));
            sig.position.y = Math.max(-baseY, Math.min(832 - baseY, y - this.dragOffset.y - baseY));
        }

        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Handle mouse up - stop dragging or resizing
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'crosshair';
            // Small delay to prevent click event after drag
            setTimeout(() => {
                this.wasDragging = false;
            }, 100);
        }
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
            this.canvas.style.cursor = 'crosshair';
            // Small delay to prevent click event after resize
            setTimeout(() => {
                this.wasDragging = false;
            }, 100);
        }
    }

    // Handle canvas click (only when not dragging)
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;

        const config = this.currentTemplate.template_config;

        // Check if clicked on a field
        if (config.fields) {
            config.fields.forEach((field, index) => {
                const fieldX = field.position.x;
                const fieldY = field.position.y;
                if (x >= fieldX - 10 && x <= fieldX + 400 && y >= fieldY - 20 && y <= fieldY + 10) {
                    this.selectedElement = { type: 'field', index };
                    this.renderTemplate();
                    this.renderProperties();
                    this.renderElementsList();
                    return;
                }
            });
        }

        // Check if clicked on an image
        if (config.images) {
            config.images.forEach((image, index) => {
                const imgX = image.position.x;
                const imgY = image.position.y;
                const imgWidth = image.width || 100;
                const imgHeight = image.height || 50;
                if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
                    this.selectedElement = { type: 'image', index };
                    this.renderTemplate();
                    this.renderProperties();
                    this.renderElementsList();
                    return;
                }
            });
        }

        // Check if clicked on title
        if (config.title) {
            const titleY = config.title.position.y;
            const titleHeight = (config.title.fontSize || 22) * 1.2;
            if (x >= 0 && x <= 595 && y >= titleY - titleHeight && y <= titleY + 10) {
                this.selectedElement = { type: 'title' };
                this.renderTemplate();
                this.renderProperties();
                this.renderElementsList();
                return;
            }
        }

        // Check if clicked on table
        if (config.table && config.table.enabled) {
            const tableX = config.table.position?.x || 40;
            const tableY = config.table.position?.y || 200;
            const tableWidth = config.table.columns ? config.table.columns.reduce((sum, col) => sum + (col.width || 50), 0) : 500;
            const tableHeight = 25 + ((config.table.rows || 5) * 20);
            if (x >= tableX && x <= tableX + tableWidth && y >= tableY && y <= tableY + tableHeight) {
                this.selectedElement = { type: 'table' };
                this.renderTemplate();
                this.renderProperties();
                this.renderElementsList();
                return;
            }
        }

        // Check if clicked on signatures
        if (config.signatures && config.signatures.enabled && config.signatures.fields) {
            config.signatures.fields.forEach((sig, index) => {
                const sigX = (config.signatures.position.x || 40) + (sig.position?.x || 0);
                const sigY = (config.signatures.position.y || 700) + (sig.position?.y || 0);
                if (x >= sigX - 5 && x <= sigX + 200 && y >= sigY - 10 && y <= sigY + 15) {
                    this.selectedElement = { type: 'signature', index };
                    this.renderTemplate();
                    this.renderProperties();
                    this.renderElementsList();
                    return;
                }
            });
        }

        // Deselect if clicked on empty space
        this.selectedElement = null;
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Render properties panel
    renderProperties() {
        const propsContainer = document.getElementById('pdf-editor-properties');
        if (!propsContainer) return;

        if (!this.selectedElement) {
            propsContainer.innerHTML = `
                <div style="color: #6B7280; font-size: 14px; text-align: center; padding: 20px;">
                    Selecciona un elemento para editar sus propiedades<br>
                    <small style="font-size: 12px; margin-top: 10px; display: block;">
                        💡 Arrastra elementos con el mouse para moverlos
                    </small>
                </div>
            `;
            return;
        }

        const config = this.currentTemplate.template_config;
        let element = null;

        if (this.selectedElement.type === 'title') {
            element = config.title;
            propsContainer.innerHTML = `
                <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                    Propiedades del Título
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Texto
                        </label>
                        <input type="text" id="prop-title-text" value="${element.text || ''}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTitleProperty('text', this.value)">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición X
                        </label>
                        <input type="number" id="prop-title-x" value="${element.position.x || 0}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTitleProperty('x', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición Y
                        </label>
                        <input type="number" id="prop-title-y" value="${element.position.y || 50}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTitleProperty('y', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Tamaño de Fuente
                        </label>
                        <input type="number" id="prop-title-fontSize" value="${element.fontSize || 22}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTitleProperty('fontSize', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Alineación
                        </label>
                        <select id="prop-title-align" value="${element.align || 'center'}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTitleProperty('align', this.value)">
                            <option value="left" ${element.align === 'left' ? 'selected' : ''}>Izquierda</option>
                            <option value="center" ${element.align === 'center' ? 'selected' : ''}>Centro</option>
                            <option value="right" ${element.align === 'right' ? 'selected' : ''}>Derecha</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (this.selectedElement.type === 'field') {
            element = config.fields[this.selectedElement.index];
            propsContainer.innerHTML = `
                <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                    Propiedades del Campo
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Etiqueta
                        </label>
                        <input type="text" id="prop-label" value="${element.label || ''}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateFieldProperty('label', this.value)">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición X
                        </label>
                        <input type="number" id="prop-x" value="${element.position.x}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateFieldProperty('x', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición Y
                        </label>
                        <input type="number" id="prop-y" value="${element.position.y}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateFieldProperty('y', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Tamaño de Fuente
                        </label>
                        <input type="number" id="prop-fontSize" value="${element.fontSize}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateFieldProperty('fontSize', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Mostrar Línea
                        </label>
                        <input type="checkbox" id="prop-showLine" ${element.showLine ? 'checked' : ''} style="
                            width: 20px !important;
                            height: 20px !important;
                        " onchange="pdfEditor.updateFieldProperty('showLine', this.checked)">
                    </div>
                    ${element.showLine ? `
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Longitud de Línea
                        </label>
                        <input type="number" id="prop-lineLength" value="${element.lineLength || 100}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateFieldProperty('lineLength', parseInt(this.value))">
                    </div>
                    ` : ''}
                </div>
            `;
        } else if (this.selectedElement.type === 'image') {
            element = config.images[this.selectedElement.index];
            propsContainer.innerHTML = `
                <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                    Propiedades de la Imagen
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Ruta de Imagen
                        </label>
                        <div style="margin-bottom: 10px;">
                            <button onclick="pdfEditor.uploadAndSetImage()" style="
                                background: linear-gradient(to right, #3B82F6, #2563EB) !important;
                                color: white !important;
                                border: none !important;
                                padding: 12px 24px !important;
                                border-radius: 8px !important;
                                cursor: pointer !important;
                                font-size: 14px !important;
                                font-weight: bold !important;
                                width: 100% !important;
                                margin-bottom: 10px !important;
                            ">📤 Subir Imagen</button>
                            <input type="text" id="prop-image-path" value="${element.path || ''}" placeholder="Ruta de la imagen (o usa el botón para subir)" style="
                                width: 100% !important;
                                padding: 8px !important;
                                border: 2px solid #D1D5DB !important;
                                border-radius: 6px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            " onchange="pdfEditor.updateImageProperty('path', this.value)">
                        </div>
                        <div style="
                            font-size: 12px !important;
                            color: #6B7280 !important;
                            margin-top: -5px !important;
                            margin-bottom: 10px !important;
                            padding: 8px !important;
                            background: #F3F4F6 !important;
                            border-radius: 6px !important;
                        ">
                            ${element.path ? '✅ Imagen cargada: ' + element.path.split('/').pop() : '💡 Haz clic en "Subir Imagen" para seleccionar y cargar un archivo'}
                        </div>
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición X
                        </label>
                        <input type="number" id="prop-img-x" value="${element.position.x}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateImageProperty('x', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición Y
                        </label>
                        <input type="number" id="prop-img-y" value="${element.position.y}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateImageProperty('y', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Ancho
                        </label>
                        <input type="number" id="prop-img-width" value="${element.width || 100}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateImageProperty('width', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Alto
                        </label>
                        <input type="number" id="prop-img-height" value="${element.height || 50}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateImageProperty('height', parseInt(this.value))">
                    </div>
                    <button onclick="pdfEditor.removeImage()" style="
                        background: #EF4444 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 16px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 14px !important;
                        margin-top: 10px !important;
                    ">🗑️ Eliminar Imagen</button>
                </div>
            `;
        } else if (this.selectedElement.type === 'table') {
            const table = config.table;
            let columnsHtml = '';
            if (table.columns) {
                table.columns.forEach((col, index) => {
                    columnsHtml += `
                        <div style="padding: 8px; background: #F3F4F6; border-radius: 4px; margin-bottom: 5px;">
                            <input type="text" value="${col.name}" placeholder="Nombre columna" style="
                                width: 100% !important;
                                padding: 6px !important;
                                border: 1px solid #D1D5DB !important;
                                border-radius: 4px !important;
                                margin-bottom: 5px !important;
                                font-size: 12px !important;
                            " onchange="pdfEditor.updateTableColumn(${index}, 'name', this.value)">
                            <div style="display: flex; gap: 5px;">
                                <input type="number" value="${col.width}" placeholder="Ancho" style="
                                    flex: 1 !important;
                                    padding: 6px !important;
                                    border: 1px solid #D1D5DB !important;
                                    border-radius: 4px !important;
                                    font-size: 12px !important;
                                " onchange="pdfEditor.updateTableColumn(${index}, 'width', parseInt(this.value))">
                                <select onchange="pdfEditor.updateTableColumn(${index}, 'align', this.value)" style="
                                    flex: 1 !important;
                                    padding: 6px !important;
                                    border: 1px solid #D1D5DB !important;
                                    border-radius: 4px !important;
                                    font-size: 12px !important;
                                ">
                                    <option value="left" ${col.align === 'left' ? 'selected' : ''}>Izq</option>
                                    <option value="center" ${col.align === 'center' ? 'selected' : ''}>Centro</option>
                                    <option value="right" ${col.align === 'right' ? 'selected' : ''}>Der</option>
                                </select>
                                <button onclick="pdfEditor.removeTableColumn(${index})" style="
                                    background: #EF4444 !important;
                                    color: white !important;
                                    border: none !important;
                                    padding: 6px 10px !important;
                                    border-radius: 4px !important;
                                    cursor: pointer !important;
                                    font-size: 12px !important;
                                ">✕</button>
                            </div>
                        </div>
                    `;
                });
            }
            
            propsContainer.innerHTML = `
                <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                    Propiedades de la Tabla
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición X
                        </label>
                        <input type="number" value="${table.position?.x || 40}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTableProperty('x', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición Y
                        </label>
                        <input type="number" value="${table.position?.y || 200}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTableProperty('y', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Número de Filas
                        </label>
                        <input type="number" value="${table.rows || 5}" min="1" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateTableProperty('rows', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Columnas
                        </label>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #D1D5DB; border-radius: 6px; padding: 10px;">
                            ${columnsHtml || '<p style="color: #6B7280; font-size: 12px;">No hay columnas</p>'}
                        </div>
                        <button onclick="pdfEditor.addTableColumn()" style="
                            background: #10B981 !important;
                            color: white !important;
                            border: none !important;
                            padding: 8px 16px !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            font-size: 14px !important;
                            margin-top: 10px !important;
                            width: 100% !important;
                        ">➕ Agregar Columna</button>
                    </div>
                </div>
            `;
        } else if (this.selectedElement.type === 'signature') {
            const sig = config.signatures.fields[this.selectedElement.index];
            propsContainer.innerHTML = `
                <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                    Propiedades de la Firma
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Texto
                        </label>
                        <input type="text" value="${sig.label || ''}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateSignatureProperty('label', this.value)">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición X (relativa)
                        </label>
                        <input type="number" value="${sig.position?.x || 0}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateSignatureProperty('x', parseInt(this.value))">
                    </div>
                    <div>
                        <label style="display: block; color: #374151; font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                            Posición Y (relativa)
                        </label>
                        <input type="number" value="${sig.position?.y || 0}" style="
                            width: 100% !important;
                            padding: 8px !important;
                            border: 2px solid #D1D5DB !important;
                            border-radius: 6px !important;
                            font-size: 14px !important;
                            box-sizing: border-box !important;
                        " onchange="pdfEditor.updateSignatureProperty('y', parseInt(this.value))">
                    </div>
                    <button onclick="pdfEditor.removeSignature()" style="
                        background: #EF4444 !important;
                        color: white !important;
                        border: none !important;
                        padding: 8px 16px !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        font-size: 14px !important;
                        margin-top: 10px !important;
                    ">🗑️ Eliminar Firma</button>
                </div>
            `;
        }
    }

    // Render elements list
    renderElementsList() {
        const listContainer = document.getElementById('pdf-editor-elements-list');
        if (!listContainer) return;

        const config = this.currentTemplate.template_config;
        let html = '';

        // Title
        if (config.title) {
            html += `
                <div style="
                    padding: 10px !important;
                    margin-bottom: 10px !important;
                    background: ${this.selectedElement?.type === 'title' ? '#DBEAFE' : '#FFFFFF'} !important;
                    border: 2px solid ${this.selectedElement?.type === 'title' ? '#3B82F6' : '#E5E7EB'} !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                " onclick="pdfEditor.selectElement({type: 'title'})">
                    <strong>Título</strong><br>
                    <small style="color: #6B7280;">${config.title.text}</small>
                </div>
            `;
        }

        // Fields
        if (config.fields) {
            config.fields.forEach((field, index) => {
                html += `
                    <div style="
                        padding: 10px !important;
                        margin-bottom: 10px !important;
                        background: ${this.selectedElement?.type === 'field' && this.selectedElement?.index === index ? '#DBEAFE' : '#FFFFFF'} !important;
                        border: 2px solid ${this.selectedElement?.type === 'field' && this.selectedElement?.index === index ? '#3B82F6' : '#E5E7EB'} !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                    " onclick="pdfEditor.selectElement({type: 'field', index: ${index}})">
                        <strong>Campo: ${field.label}</strong><br>
                        <small style="color: #6B7280;">X: ${field.position.x}, Y: ${field.position.y}</small>
                    </div>
                `;
            });
        }

        // Images
        if (config.images) {
            config.images.forEach((image, index) => {
                html += `
                    <div style="
                        padding: 10px !important;
                        margin-bottom: 10px !important;
                        background: ${this.selectedElement?.type === 'image' && this.selectedElement?.index === index ? '#DBEAFE' : '#FFFFFF'} !important;
                        border: 2px solid ${this.selectedElement?.type === 'image' && this.selectedElement?.index === index ? '#3B82F6' : '#E5E7EB'} !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                    " onclick="pdfEditor.selectElement({type: 'image', index: ${index}})">
                        <strong>🖼️ Logo ${index + 1}</strong><br>
                        <small style="color: #6B7280;">X: ${image.position.x}, Y: ${image.position.y}</small>
                    </div>
                `;
            });
        }

        // Table
        if (config.table && config.table.enabled) {
            html += `
                <div style="
                    padding: 10px !important;
                    margin-bottom: 10px !important;
                    background: ${this.selectedElement?.type === 'table' ? '#DBEAFE' : '#FFFFFF'} !important;
                    border: 2px solid ${this.selectedElement?.type === 'table' ? '#3B82F6' : '#E5E7EB'} !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                " onclick="pdfEditor.selectElement({type: 'table'})">
                    <strong>📊 Tabla</strong><br>
                    <small style="color: #6B7280;">${config.table.columns?.length || 0} columnas, ${config.table.rows || 0} filas</small>
                </div>
            `;
        }

        // Signatures
        if (config.signatures && config.signatures.enabled && config.signatures.fields) {
            config.signatures.fields.forEach((sig, index) => {
                html += `
                    <div style="
                        padding: 10px !important;
                        margin-bottom: 10px !important;
                        background: ${this.selectedElement?.type === 'signature' && this.selectedElement?.index === index ? '#DBEAFE' : '#FFFFFF'} !important;
                        border: 2px solid ${this.selectedElement?.type === 'signature' && this.selectedElement?.index === index ? '#3B82F6' : '#E5E7EB'} !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                    " onclick="pdfEditor.selectElement({type: 'signature', index: ${index}})">
                        <strong>✍️ ${sig.label}</strong><br>
                        <small style="color: #6B7280;">X: ${(config.signatures.position.x || 40) + (sig.position?.x || 0)}, Y: ${(config.signatures.position.y || 700) + (sig.position?.y || 0)}</small>
                    </div>
                `;
            });
        }

        listContainer.innerHTML = html || '<p style="color: #6B7280; font-size: 14px;">No hay elementos. Usa los botones de arriba para agregar elementos.</p>';
    }

    // Select element
    selectElement(element) {
        this.selectedElement = element;
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Update field property
    updateFieldProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'field') return;

        const field = this.currentTemplate.template_config.fields[this.selectedElement.index];
        
        if (property === 'x' || property === 'y') {
            field.position[property] = value;
        } else {
            field[property] = value;
        }

        this.renderTemplate();
        this.renderElementsList();
    }

    // Update image property
    updateImageProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'image') return;

        const image = this.currentTemplate.template_config.images[this.selectedElement.index];
        
        if (property === 'x' || property === 'y') {
            image.position[property] = value;
        } else {
            image[property] = value;
        }

        this.renderTemplate();
        this.renderElementsList();
    }

    // Update title property
    updateTitleProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'title') return;

        const title = this.currentTemplate.template_config.title;
        
        if (property === 'x' || property === 'y') {
            title.position[property] = value;
        } else {
            title[property] = value;
        }

        this.renderTemplate();
        this.renderElementsList();
    }

    // Update table property
    updateTableProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'table') return;

        const table = this.currentTemplate.template_config.table;
        
        if (property === 'x' || property === 'y') {
            if (!table.position) table.position = { x: 40, y: 200 };
            table.position[property] = value;
        } else {
            table[property] = value;
        }

        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Update table column
    updateTableColumn(index, property, value) {
        const table = this.currentTemplate.template_config.table;
        if (!table.columns || !table.columns[index]) return;
        
        table.columns[index][property] = value;
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Add table column
    addTableColumn() {
        const table = this.currentTemplate.template_config.table;
        if (!table.columns) table.columns = [];
        
        const totalWidth = table.columns.reduce((sum, col) => sum + (col.width || 50), 0);
        const avgWidth = totalWidth > 0 ? Math.floor(totalWidth / table.columns.length) : 100;
        
        table.columns.push({
            name: `Columna ${table.columns.length + 1}`,
            width: avgWidth,
            align: 'left'
        });
        
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Remove table column
    removeTableColumn(index) {
        const table = this.currentTemplate.template_config.table;
        if (table.columns && table.columns[index]) {
            table.columns.splice(index, 1);
            this.renderTemplate();
            this.renderProperties();
            this.renderElementsList();
        }
    }

    // Update signature property
    updateSignatureProperty(property, value) {
        if (!this.selectedElement || this.selectedElement.type !== 'signature') return;

        const sig = this.currentTemplate.template_config.signatures.fields[this.selectedElement.index];
        
        if (property === 'x' || property === 'y') {
            if (!sig.position) sig.position = { x: 0, y: 0 };
            sig.position[property] = value;
        } else {
            sig[property] = value;
        }

        this.renderTemplate();
        this.renderElementsList();
    }

    // Remove signature
    removeSignature() {
        if (!this.selectedElement || this.selectedElement.type !== 'signature') return;
        
        const config = this.currentTemplate.template_config;
        config.signatures.fields.splice(this.selectedElement.index, 1);
        
        if (config.signatures.fields.length === 0) {
            config.signatures.enabled = false;
        }
        
        this.selectedElement = null;
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Add element based on type
    addElement(type) {
        const config = this.currentTemplate.template_config;
        
        switch(type) {
            case 'title':
                if (!config.title) {
                    config.title = {
                        text: 'Certificado de Asignación de Activos',
                        fontSize: 22,
                        fontFamily: 'Helvetica-Bold',
                        align: 'center',
                        position: { x: 0, y: 50 },
                        color: '#000000'
                    };
                    this.selectedElement = { type: 'title' };
                }
                break;
                
            case 'date':
                if (!config.fields) config.fields = [];
                const dateField = {
                    type: 'text',
                    label: 'Fecha:',
                    key: 'date',
                    position: { x: 40, y: 100 + (config.fields.length * 30) },
                    fontSize: 11,
                    fontFamily: 'Helvetica-Bold',
                    showLine: true,
                    lineLength: 110
                };
                config.fields.push(dateField);
                this.selectedElement = { type: 'field', index: config.fields.length - 1 };
                break;
                
            case 'employeeName':
                if (!config.fields) config.fields = [];
                const nameField = {
                    type: 'text',
                    label: 'Nombre Colaborador:',
                    key: 'employeeName',
                    position: { x: 40, y: 100 + (config.fields.length * 30) },
                    fontSize: 11,
                    fontFamily: 'Helvetica-Bold',
                    showLine: true,
                    lineLength: 360
                };
                config.fields.push(nameField);
                this.selectedElement = { type: 'field', index: config.fields.length - 1 };
                break;
                
            case 'table':
                config.table.enabled = true;
                if (!config.table.columns || config.table.columns.length === 0) {
                    config.table.columns = [
                        { name: 'ITEM', width: 50, align: 'center' },
                        { name: 'S/N', width: 100, align: 'center' },
                        { name: 'DESCRIPCIÓN DEL ÍTEM', width: 180, align: 'left' },
                        { name: 'Accesorios', width: 120, align: 'center' },
                        { name: 'Observación', width: 100, align: 'left' }
                    ];
                    config.table.rows = 5;
                }
                this.selectedElement = { type: 'table' };
                break;
                
            case 'signatureHelpdesk':
                if (!config.signatures) {
                    config.signatures = {
                        enabled: true,
                        position: { x: 40, y: 700 },
                        fields: []
                    };
                }
                config.signatures.enabled = true;
                if (!config.signatures.fields) config.signatures.fields = [];
                const helpdeskSig = {
                    label: 'Helpdesk __________________',
                    position: { x: 40, y: 0 }
                };
                config.signatures.fields.push(helpdeskSig);
                this.selectedElement = { type: 'signature', index: config.signatures.fields.length - 1 };
                break;
                
            case 'signatureEmployee':
                if (!config.signatures) {
                    config.signatures = {
                        enabled: true,
                        position: { x: 40, y: 700 },
                        fields: []
                    };
                }
                config.signatures.enabled = true;
                if (!config.signatures.fields) config.signatures.fields = [];
                const employeeSig = {
                    label: 'Colaborador ________________',
                    position: { x: 350, y: 0 }
                };
                config.signatures.fields.push(employeeSig);
                this.selectedElement = { type: 'signature', index: config.signatures.fields.length - 1 };
                break;
                
            case 'logo':
                // Create file input and trigger upload
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                fileInput.onchange = async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        // Add image element first
                        if (!config.images) config.images = [];
                        const newLogo = {
                            type: 'logo',
                            path: '',
                            position: { x: 450, y: 30 },
                            width: 100,
                            height: 50
                        };
                        config.images.push(newLogo);
                        this.selectedElement = { type: 'image', index: config.images.length - 1 };
                        
                        // Upload the image
                        await this.handleImageUpload(e.target);
                        
                        // Clean up
                        document.body.removeChild(fileInput);
                    }
                };
                document.body.appendChild(fileInput);
                fileInput.click();
                break;
        }
        
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Add text field (legacy method)
    addTextField() {
        this.addElement('date');
    }

    // Add image
    addImage() {
        const config = this.currentTemplate.template_config;
        if (!config.images) config.images = [];

        const newImage = {
            type: 'logo',
            path: '',
            position: { x: 450, y: 30 },
            width: 100,
            height: 50
        };

        config.images.push(newImage);
        this.selectedElement = { type: 'image', index: config.images.length - 1 };
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Upload and set image (opens file picker)
    uploadAndSetImage() {
        // If no image is selected, create a new one first
        if (!this.selectedElement || this.selectedElement.type !== 'image') {
            this.addElement('logo');
            return;
        }
        
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                await this.handleImageUpload(e.target);
            }
            document.body.removeChild(fileInput);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    // Handle image upload
    async handleImageUpload(input) {
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            console.log('📤 Subiendo imagen:', file.name);
            
            // Upload image to server using fetch directly (FormData needs no Content-Type header)
            const token = window.auth?.token || localStorage.getItem('token');
            const response = await fetch('/api/onboarding/upload-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type - browser will set it automatically with boundary for FormData
                },
                body: formData
            });

            console.log('📥 Respuesta del servidor:', response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Imagen subida, ruta recibida:', data.path);
                console.log('📦 Datos completos:', data);
                
                // Update image path
                if (this.selectedElement && this.selectedElement.type === 'image') {
                    const image = this.currentTemplate.template_config.images[this.selectedElement.index];
                    const oldPath = image.path;
                    image.path = data.path;
                    
                    console.log('🔄 Ruta actualizada de', oldPath, 'a', image.path);
                    
                    // Update the input field
                    const pathInput = document.getElementById('prop-image-path');
                    if (pathInput) {
                        pathInput.value = data.path;
                    }
                    
                    // Clear image cache for this specific path to force reload
                    const imageSrc = '/api' + data.path;
                    console.log('🗑️ Limpiando caché para ruta:', imageSrc);
                    
                    // Clear all possible cache entries
                    Object.keys(this.imageCache).forEach(key => {
                        if (key.includes(data.path) || key.includes(data.filename)) {
                            delete this.imageCache[key];
                        }
                    });
                    
                    // Force a small delay to ensure server has processed the file
                    setTimeout(() => {
                        console.log('🔄 Re-renderizando template con nueva imagen...');
                        // Re-render template to show the image
                        this.renderTemplate();
                        this.renderProperties();
                        this.renderElementsList();
                        
                        // Force another render after a bit more time to ensure image loads
                        setTimeout(() => {
                            console.log('🔄 Segundo re-render para asegurar carga de imagen...');
                            this.renderTemplate();
                        }, 500);
                        
                        console.log('🎨 Template re-renderizado');
                    }, 200);
                    
                    if (typeof showNotification === 'function') {
                        showNotification('success', 'Éxito', 'Imagen subida y agregada correctamente');
                    } else {
                        alert('✅ Imagen subida y agregada correctamente');
                    }
                } else {
                    console.error('No hay imagen seleccionada para actualizar');
                    alert('Error: No hay imagen seleccionada');
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', response.status, errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Error subiendo imagen' };
                }
                throw new Error(errorData.error || 'Error subiendo imagen');
            }
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message || 'No se pudo subir la imagen');
            } else {
                alert('Error: ' + (error.message || 'No se pudo subir la imagen'));
            }
        }
    }

    // Remove image
    removeImage() {
        if (!this.selectedElement || this.selectedElement.type !== 'image') return;

        const config = this.currentTemplate.template_config;
        config.images.splice(this.selectedElement.index, 1);
        this.selectedElement = null;
        this.renderTemplate();
        this.renderProperties();
        this.renderElementsList();
    }

    // Preview PDF
    async previewPDF() {
        // Generate a preview PDF with sample data
        try {
            const response = await window.auth.apiRequest('/onboarding/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employeeName: 'Ejemplo Usuario',
                    employeeId: '12345',
                    email: 'ejemplo@xepelin.com',
                    position: 'Desarrollador',
                    department: 'IT',
                    location: 'MX',
                    startDate: new Date().toISOString().split('T')[0],
                    templateId: this.currentTemplate.id || null,
                    templateConfig: this.currentTemplate.template_config
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error generando preview');
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message || 'Error generando vista previa');
            }
        }
    }

    // Save template
    async saveTemplate() {
        try {
            // Get template name
            const name = prompt('Nombre del template:', this.currentTemplate.name || 'Nuevo Template');
            if (!name) return;

            const templateData = {
                name: name,
                description: this.currentTemplate.description || '',
                template_config: this.currentTemplate.template_config,
                is_default: false
            };

            let response;
            if (this.currentTemplate.id) {
                // Update existing
                response = await window.auth.apiRequest(`${this.apiBase}/${this.currentTemplate.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateData)
                });
            } else {
                // Create new
                response = await window.auth.apiRequest(this.apiBase, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateData)
                });
            }

            if (response.ok) {
                const data = await response.json();
                if (data.templateId) {
                    this.currentTemplate.id = data.templateId;
                }
                if (typeof showNotification === 'function') {
                    showNotification('success', 'Éxito', 'Template guardado correctamente');
                } else {
                    alert('Template guardado correctamente');
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error guardando template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', 'Error', error.message || 'Error guardando template');
            } else {
                alert('Error: ' + error.message);
            }
        }
    }

    // Close editor
    closeEditor() {
        const modal = document.getElementById('pdf-editor-modal');
        if (modal) {
            modal.remove();
        }
        this.currentTemplate = null;
        this.selectedElement = null;
    }
}

// Initialize PDF editor
const pdfEditor = new PDFTemplateEditor();
window.pdfEditor = pdfEditor;

// Global function to open PDF editor
function openPDFEditor(templateId = null) {
    if (window.pdfEditor) {
        window.pdfEditor.openEditor(templateId);
    }
}

