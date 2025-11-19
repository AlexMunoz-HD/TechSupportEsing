# 📝 Guía de Integración: Firma de Texto en PDF

Esta guía explica cómo funciona la funcionalidad de firma de texto en PDF y cómo se calculan las coordenadas.

## 🏗️ Arquitectura

### Backend
- **Archivo:** `backend/utils/pdfSignature.js` - Utilidades para firmar PDFs
- **Ruta:** `backend/routes/signature.js` - Endpoints de la API
- **Librería:** `pdf-lib` - Para modificar PDFs existentes

### Frontend
- **Archivo:** `frontend/js/pdf-signer.js` - Herramienta de firma
- **Librería:** `pdf.js` (cargada desde CDN) - Para mostrar PDFs en el navegador

## 📍 Sistema de Coordenadas: Explicación Detallada

### 1. Sistema de Coordenadas en PDF.js (Frontend)

**PDF.js** usa un sistema de coordenadas donde:
- **Origen (0,0):** Esquina superior izquierda
- **X:** Aumenta hacia la derecha
- **Y:** Aumenta hacia abajo
- **Unidades:** Píxeles del canvas

### 2. Sistema de Coordenadas en pdf-lib (Backend)

**pdf-lib** usa un sistema de coordenadas donde:
- **Origen (0,0):** Esquina inferior izquierda
- **X:** Aumenta hacia la derecha
- **Y:** Aumenta hacia arriba
- **Unidades:** Puntos (1 punto = 1/72 pulgadas)

### 3. Conversión de Coordenadas

Cuando el usuario hace clic en el canvas del frontend:

```javascript
// 1. Coordenadas del click en el canvas (píxeles)
const clickX = e.clientX - rect.left;
const clickY = e.clientY - rect.top;

// 2. Convertir a coordenadas del PDF (puntos)
const pdfX = (clickX / displayWidth) * pageWidth;
const pdfY = pageHeight - ((clickY / displayHeight) * pageHeight);
```

**Fórmula clave para Y:**
```
pdfY = pageHeight - ((canvasY / displayHeight) * pageHeight)
```

Esto invierte el eje Y porque:
- En el canvas: Y=0 está arriba
- En pdf-lib: Y=0 está abajo

### 4. Escala y Dimensiones

El PDF tiene dimensiones en **puntos** (unidad estándar de PDF):
- **1 punto = 1/72 pulgadas**
- Un PDF A4 típico: 595.28 x 841.89 puntos

El canvas tiene dimensiones en **píxeles** (depende del viewport y escala):
- Se calcula con `page.getViewport({ scale: 1.5 })`
- La escala afecta el tamaño del canvas pero NO las coordenadas del PDF

**Conversión:**
```javascript
// Ancho del PDF en puntos
pageWidth = page.view[2];  // Ej: 595.28

// Ancho del canvas en píxeles
displayWidth = viewport.width;  // Ej: 892.92 (con scale 1.5)

// Factor de conversión
scaleFactor = pageWidth / displayWidth;

// Coordenada X en puntos del PDF
pdfX = canvasX * scaleFactor;
```

## 🔧 Endpoints de la API

### POST `/api/documents/pdf/sign-text`

Firma un PDF con una sola firma.

**Parámetros (multipart/form-data):**
- `pdf` (file): Archivo PDF
- `signerName` (string): Nombre del firmante
- `x` (number): Coordenada X en puntos
- `y` (number): Coordenada Y en puntos
- `pageIndex` (number, opcional): Índice de página (default: 0)
- `fontSize` (number, opcional): Tamaño de fuente (default: 12)
- `fontColor` (string, opcional): Color RGB "r,g,b" (default: "0,0,0")
- `includeDate` (boolean, opcional): Incluir fecha/hora (default: true)

**Query Parameters:**
- `download=true`: Descarga el PDF directamente
- `save=true`: Guarda el PDF en el servidor y devuelve la ruta

**Ejemplo de respuesta (sin download/save):**
```json
{
  "success": true,
  "message": "PDF firmado exitosamente",
  "pdfBase64": "JVBERi0xLjQKJeLjz9MK...",
  "mimeType": "application/pdf"
}
```

### POST `/api/documents/pdf/sign-multiple`

Firma un PDF con múltiples firmas.

**Parámetros:**
- `pdf` (file): Archivo PDF
- `signatures` (JSON string): Array de objetos de firma
  ```json
  [
    {
      "signerName": "Juan Pérez",
      "x": 100,
      "y": 200,
      "pageIndex": 0,
      "fontSize": 12,
      "fontColor": "0,0,0",
      "includeDate": true
    }
  ]
  ```

### POST `/api/documents/pdf/info`

Obtiene información de un PDF (número de páginas, dimensiones).

**Parámetros:**
- `pdf` (file): Archivo PDF

**Respuesta:**
```json
{
  "success": true,
  "info": {
    "pageCount": 3,
    "pages": [
      {
        "pageIndex": 0,
        "width": 595.28,
        "height": 841.89,
        "widthInches": 8.27,
        "heightInches": 11.69
      }
    ]
  }
}
```

## 🎨 Integración en el Frontend

### Opción 1: Sección Dedicada

Agregar una nueva sección en `index.html`:

```html
<section id="pdf-signer-section" class="hidden section">
    <div class="container mx-auto px-6 py-8">
        <div id="pdfSignerContainer"></div>
    </div>
</section>
```

Luego en JavaScript:

```javascript
// Cuando se muestre la sección
if (sectionId === 'pdf-signer-section') {
    const container = document.getElementById('pdfSignerContainer');
    if (container && window.pdfSignerTool) {
        window.pdfSignerTool.render(container);
    }
}
```

### Opción 2: Modal/Dialog

```javascript
function openPdfSignerModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = '<div id="pdfSignerModalContent" class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"></div>';
    document.body.appendChild(modal);
    
    window.pdfSignerTool.render(document.getElementById('pdfSignerModalContent'));
}
```

## 📦 Instalación

### Backend

```bash
cd backend
npm install pdf-lib
```

### Frontend

No requiere instalación adicional. `pdf.js` se carga automáticamente desde CDN cuando se usa la herramienta.

## 🧪 Ejemplo de Uso Completo

### 1. Usuario carga un PDF
- Selecciona archivo → `loadPDF()` se ejecuta
- PDF.js carga el documento
- Se renderiza la primera página en el canvas

### 2. Usuario hace clic en el PDF
- `handleCanvasClick()` captura las coordenadas del click
- Se convierten de píxeles del canvas a puntos del PDF
- Se agrega un punto de firma a la lista

### 3. Usuario ingresa nombre y hace clic en "Firmar"
- Se valida que haya nombre y puntos de firma
- Se crea FormData con el PDF y los datos
- Se envía POST a `/api/documents/pdf/sign-text`
- El backend usa `pdf-lib` para agregar el texto
- Se devuelve el PDF firmado
- Se descarga automáticamente

## ⚠️ Consideraciones Importantes

### 1. Precisión de Coordenadas

Las coordenadas deben estar en **puntos del PDF**, no en píxeles del canvas. La conversión es crítica para que la firma aparezca en el lugar correcto.

### 2. Múltiples Páginas

Cada punto de firma tiene un `pageIndex` asociado. Asegúrate de que el índice corresponda a la página correcta (0-based).

### 3. Tamaño de Fuente

El tamaño de fuente se especifica en puntos. Un tamaño típico es 12 puntos. Ajusta según el tamaño del documento.

### 4. Color de Firma

El color se especifica como "r,g,b" donde cada valor va de 0 a 255. Ejemplo: "0,0,0" = negro, "255,0,0" = rojo.

### 5. Formato de Fecha

La fecha se formatea automáticamente en español (DD/MM/YYYY) y la hora en formato 24h (HH:MM).

## 🔍 Debugging

### Verificar Coordenadas

Agrega logs en `handleCanvasClick()`:

```javascript
console.log('Canvas click:', { clickX, clickY });
console.log('PDF coordinates:', { pdfX, pdfY });
console.log('Page dimensions:', { pageWidth, pageHeight });
console.log('Display dimensions:', { displayWidth, displayHeight });
```

### Verificar Conversión

Compara las dimensiones del PDF:
- Backend: Usa `getPDFInfo()` para obtener dimensiones reales
- Frontend: Compara con `page.view[2]` y `page.view[3]`

## 📚 Referencias

- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [PDF Coordinate System](https://www.pdfa.org/resource/pdf-coordinate-systems/)

