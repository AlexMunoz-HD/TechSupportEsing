// PDF Signer Tool - Herramienta para firmar PDFs con texto
class PDFSignerTool {
    constructor() {
        this.pdfFile = null;
        this.pdfUrl = null;
        this.pdfDoc = null;
        this.currentPage = 0;
        this.scale = 1.0;
        this.pageWidth = 0;
        this.pageHeight = 0;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.signaturePoints = [];
        this.init();
    }

    init() {
        this.createUI();
        this.setupEventListeners();
    }

    // Crear la interfaz de usuario
    createUI() {
        // Esta función se llamará cuando se necesite mostrar la herramienta
        // Por ahora, asumimos que se integrará en una sección existente
    }

    // Configurar event listeners
    setupEventListeners() {
        // Se configurarán cuando se cree la UI
    }

    /**
     * Renderizar la sección de firma de PDF en el DOM
     * @param {HTMLElement} container - Contenedor donde se renderizará
     */
    render(container) {
        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-signature text-purple-600 mr-2"></i>
                    Firma de Documento PDF
                </h2>

                <!-- Formulario de carga -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Firmante
                    </label>
                    <input type="text" 
                           id="signerNameInput" 
                           class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                           placeholder="Ingrese el nombre completo del firmante">
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Seleccionar PDF
                    </label>
                    <input type="file" 
                           id="pdfFileInput" 
                           accept=".pdf"
                           class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                </div>

                <!-- Vista previa del PDF -->
                <div id="pdfPreviewContainer" class="mb-6 hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Vista Previa del PDF</h3>
                        <div class="flex items-center gap-2">
                            <button id="prevPageBtn" 
                                    class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="pageInfo" class="text-sm text-gray-600 dark:text-gray-400">Página 1 de 1</span>
                            <button id="nextPageBtn" 
                                    class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        <div id="pdfCanvasContainer" class="flex justify-center items-center min-h-[400px]">
                            <canvas id="pdfCanvas" class="border border-gray-300 dark:border-gray-600 shadow-lg cursor-crosshair"></canvas>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                            Haz clic en el PDF para seleccionar la posición de la firma
                        </p>
                    </div>
                    <div id="signaturePointsList" class="mt-4 space-y-2"></div>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-4">
                    <button id="signPdfBtn" 
                            class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            disabled>
                        <i class="fas fa-signature mr-2"></i>
                        Firmar Documento
                    </button>
                    <button id="clearPointsBtn" 
                            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-eraser mr-2"></i>
                        Limpiar Puntos
                    </button>
                </div>

                <!-- Resultado -->
                <div id="signResult" class="mt-6 hidden"></div>
            </div>
        `;

        this.attachEventListeners();
    }

    // Adjuntar event listeners a los elementos creados
    attachEventListeners() {
        const pdfFileInput = document.getElementById('pdfFileInput');
        const signerNameInput = document.getElementById('signerNameInput');
        const pdfCanvas = document.getElementById('pdfCanvas');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const signPdfBtn = document.getElementById('signPdfBtn');
        const clearPointsBtn = document.getElementById('clearPointsBtn');

        // Cargar PDF cuando se seleccione un archivo
        if (pdfFileInput) {
            pdfFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type === 'application/pdf') {
                    this.loadPDF(file);
                } else {
                    alert('Por favor, seleccione un archivo PDF válido');
                }
            });
        }

        // Click en el canvas para agregar punto de firma
        if (pdfCanvas) {
            pdfCanvas.addEventListener('click', (e) => {
                this.handleCanvasClick(e);
            });
        }

        // Navegación de páginas
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.renderPDFPage();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                if (this.pdfDoc && this.currentPage < this.pdfDoc.numPages - 1) {
                    this.currentPage++;
                    this.renderPDFPage();
                }
            });
        }

        // Firmar PDF
        if (signPdfBtn) {
            signPdfBtn.addEventListener('click', () => {
                this.signPDF();
            });
        }

        // Limpiar puntos
        if (clearPointsBtn) {
            clearPointsBtn.addEventListener('click', () => {
                this.clearSignaturePoints();
            });
        }
    }

    /**
     * Cargar y mostrar el PDF
     * @param {File} file - Archivo PDF
     */
    async loadPDF(file) {
        try {
            this.pdfFile = file;
            this.pdfUrl = URL.createObjectURL(file);

            // Cargar PDF.js si no está disponible
            if (typeof pdfjsLib === 'undefined') {
                await this.loadPDFJS();
            }

            // Cargar el documento PDF
            const loadingTask = pdfjsLib.getDocument({ url: this.pdfUrl });
            this.pdfDoc = await loadingTask.promise;

            this.currentPage = 0;
            this.signaturePoints = [];

            // Mostrar contenedor de preview
            const previewContainer = document.getElementById('pdfPreviewContainer');
            if (previewContainer) {
                previewContainer.classList.remove('hidden');
            }

            // Renderizar primera página
            await this.renderPDFPage();

            // Habilitar botón de firma si hay nombre
            this.updateSignButtonState();
        } catch (error) {
            console.error('Error cargando PDF:', error);
            alert('Error al cargar el PDF: ' + error.message);
        }
    }

    /**
     * Cargar PDF.js desde CDN
     */
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                // Configurar worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Renderizar la página actual del PDF
     */
    async renderPDFPage() {
        if (!this.pdfDoc) return;

        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');

        try {
            const page = await this.pdfDoc.getPage(this.currentPage + 1); // PDF.js usa 1-based index
            const viewport = page.getViewport({ scale: 1.5 });

            // Ajustar tamaño del canvas
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Guardar dimensiones para conversión de coordenadas
            this.pageWidth = page.view[2]; // Ancho en puntos
            this.pageHeight = page.view[3]; // Alto en puntos
            this.displayWidth = viewport.width;
            this.displayHeight = viewport.height;
            this.scale = viewport.scale;

            // Renderizar página
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            // Dibujar puntos de firma existentes en esta página
            this.drawSignaturePoints(ctx);

            // Actualizar información de página
            this.updatePageInfo();

            // Actualizar botones de navegación
            this.updateNavigationButtons();
        } catch (error) {
            console.error('Error renderizando página:', error);
            alert('Error al renderizar la página: ' + error.message);
        }
    }

    /**
     * Manejar click en el canvas para agregar punto de firma
     * @param {MouseEvent} e - Evento de click
     */
    handleCanvasClick(e) {
        const canvas = document.getElementById('pdfCanvas');
        const rect = canvas.getBoundingClientRect();
        
        // Coordenadas del click en el canvas
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convertir coordenadas del canvas a coordenadas del PDF (en puntos)
        const pdfX = (clickX / this.displayWidth) * this.pageWidth;
        // En PDF.js, Y=0 está arriba, pero en pdf-lib Y=0 está abajo
        // Necesitamos invertir Y
        const pdfY = this.pageHeight - ((clickY / this.displayHeight) * this.pageHeight);

        // Agregar punto de firma
        this.signaturePoints.push({
            x: pdfX,
            y: pdfY,
            pageIndex: this.currentPage,
        });

        // Redibujar para mostrar el nuevo punto
        this.renderPDFPage();

        // Actualizar lista de puntos
        this.updateSignaturePointsList();

        // Habilitar botón de firma
        this.updateSignButtonState();
    }

    /**
     * Dibujar puntos de firma en el canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    drawSignaturePoints(ctx) {
        ctx.save();

        // Filtrar puntos de la página actual
        const currentPagePoints = this.signaturePoints.filter(
            point => point.pageIndex === this.currentPage
        );

        currentPagePoints.forEach(point => {
            // Convertir coordenadas PDF a coordenadas canvas
            const canvasX = (point.x / this.pageWidth) * this.displayWidth;
            const canvasY = this.displayHeight - ((point.y / this.pageHeight) * this.displayHeight);

            // Dibujar marcador
            ctx.fillStyle = '#9333EA'; // Color morado
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
            ctx.fill();

            // Borde blanco
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * Actualizar información de página
     */
    updatePageInfo() {
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo && this.pdfDoc) {
            pageInfo.textContent = `Página ${this.currentPage + 1} de ${this.pdfDoc.numPages}`;
        }
    }

    /**
     * Actualizar botones de navegación
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
        }
        if (nextBtn && this.pdfDoc) {
            nextBtn.disabled = this.currentPage >= this.pdfDoc.numPages - 1;
        }
    }

    /**
     * Actualizar lista de puntos de firma
     */
    updateSignaturePointsList() {
        const listContainer = document.getElementById('signaturePointsList');
        if (!listContainer) return;

        if (this.signaturePoints.length === 0) {
            listContainer.innerHTML = '';
            return;
        }

        listContainer.innerHTML = `
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Puntos de Firma (${this.signaturePoints.length}):
            </div>
            <div class="space-y-1">
                ${this.signaturePoints.map((point, index) => `
                    <div class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        <span class="text-gray-700 dark:text-gray-300">
                            Página ${point.pageIndex + 1} - X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}
                        </span>
                        <button onclick="pdfSignerTool.removeSignaturePoint(${index})" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Eliminar un punto de firma
     * @param {number} index - Índice del punto
     */
    removeSignaturePoint(index) {
        this.signaturePoints.splice(index, 1);
        this.renderPDFPage();
        this.updateSignaturePointsList();
        this.updateSignButtonState();
    }

    /**
     * Limpiar todos los puntos de firma
     */
    clearSignaturePoints() {
        this.signaturePoints = [];
        this.renderPDFPage();
        this.updateSignaturePointsList();
        this.updateSignButtonState();
    }

    /**
     * Actualizar estado del botón de firma
     */
    updateSignButtonState() {
        const signBtn = document.getElementById('signPdfBtn');
        const signerNameInput = document.getElementById('signerNameInput');

        if (signBtn && signerNameInput) {
            const hasName = signerNameInput.value.trim() !== '';
            const hasPoints = this.signaturePoints.length > 0;
            const hasFile = this.pdfFile !== null;

            signBtn.disabled = !(hasName && hasPoints && hasFile);
        }
    }

    /**
     * Firmar el PDF
     */
    async signPDF() {
        const signerNameInput = document.getElementById('signerNameInput');
        const signerName = signerNameInput ? signerNameInput.value.trim() : '';

        if (!signerName) {
            alert('Por favor, ingrese el nombre del firmante');
            return;
        }

        if (this.signaturePoints.length === 0) {
            alert('Por favor, seleccione al menos una posición para la firma');
            return;
        }

        if (!this.pdfFile) {
            alert('Por favor, seleccione un archivo PDF');
            return;
        }

        try {
            // Mostrar loading
            const signBtn = document.getElementById('signPdfBtn');
            if (signBtn) {
                signBtn.disabled = true;
                signBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Firmando...';
            }

            // Preparar FormData
            const formData = new FormData();
            formData.append('pdf', this.pdfFile);
            formData.append('signerName', signerName);

            // Si hay múltiples firmas, usar endpoint de múltiples firmas
            if (this.signaturePoints.length > 1) {
                const signatures = this.signaturePoints.map(point => ({
                    signerName: signerName,
                    x: point.x,
                    y: point.y,
                    pageIndex: point.pageIndex,
                }));

                formData.append('signatures', JSON.stringify(signatures));

                const response = await window.auth.apiRequest('/documents/pdf/sign-multiple?download=true', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error firmando el PDF');
                }

                // Descargar el PDF firmado
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `signed-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                // Una sola firma
                const point = this.signaturePoints[0];
                formData.append('x', point.x);
                formData.append('y', point.y);
                formData.append('pageIndex', point.pageIndex);

                const response = await window.auth.apiRequest('/documents/pdf/sign-text?download=true', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error firmando el PDF');
                }

                // Descargar el PDF firmado
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `signed-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }

            // Mostrar éxito
            if (window.showNotification) {
                window.showNotification('success', 'Éxito', 'PDF firmado y descargado exitosamente');
            } else {
                alert('✅ PDF firmado y descargado exitosamente');
            }

            // Resetear estado
            if (signBtn) {
                signBtn.disabled = false;
                signBtn.innerHTML = '<i class="fas fa-signature mr-2"></i>Firmar Documento';
            }
        } catch (error) {
            console.error('Error firmando PDF:', error);
            if (window.showNotification) {
                window.showNotification('error', 'Error', error.message || 'Error al firmar el PDF');
            } else {
                alert('❌ Error: ' + (error.message || 'Error al firmar el PDF'));
            }

            const signBtn = document.getElementById('signPdfBtn');
            if (signBtn) {
                signBtn.disabled = false;
                signBtn.innerHTML = '<i class="fas fa-signature mr-2"></i>Firmar Documento';
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pdfSignerTool = new PDFSignerTool();
    });
} else {
    window.pdfSignerTool = new PDFSignerTool();
}

