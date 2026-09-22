# DocuForge — The Intelligent Document & PDF SaaS Platform

DocuForge is an enterprise-grade document utility and PDF automation SaaS platform. It combines 40+ specialized document tools with a signature **Smart PDF Workspace** that compiles natural language prompts into executable multi-step processing pipelines.

---

## 1. Key Features

- **Smart PDF Workspace (Signature Innovation)**:
  - Natural language instruction parser: Type *"Convert this Word document to PDF, compress it below 2 MB, add page numbers and watermark it with 'CONFIDENTIAL'"* to automatically generate an executable visual DAG workflow.
  - Interactive visual node editor with live step configuration, drag-to-reorder, and step-by-step progress tracking.
  - Reusable pre-built workflow templates (e.g. *Email-Ready Document Pipeline*, *Confidential Legal Pack*, *Expense Receipt OCR*).

- **Full Suite of 40+ Document Utilities**:
  - **Convert to PDF**: Word to PDF, Excel to PDF, PowerPoint to PDF, JPG/PNG to PDF, HTML to PDF, TXT/Markdown to PDF.
  - **Convert from PDF**: PDF to Word (DOCX), PDF to JPG/PNG images (ZIP bundle), PDF to Excel, PDF to Text.
  - **Organize PDF**: Merge multiple PDFs with visual drag-and-drop reordering, Split PDF by custom ranges, Delete pages, Rotate pages (90°/180°/270°), Duplicate pages, Reverse sequence.
  - **Compress & Optimize**: Extreme, Balanced, and High Quality compression modes with real-time before/after byte reduction metrics.
  - **Edit & Annotate**: Full interactive canvas PDF editor with freehand drawing pen, highlighter, text annotations, geometric shapes, business stamps (APPROVED, CONFIDENTIAL, DRAFT), and digital signatures.
  - **Security & Privacy**: Watermarking with angle & opacity control, 256-bit password protection, metadata sanitizer.
  - **OCR Engine**: Optical character recognition for scanned PDFs and photos producing selectable, searchable PDFs.
  - **AI Intelligence Suite**:
    - **Ask PDF & Grounded Chat**: Side-by-side interactive document reader and conversational AI with page citations and text grounding.
    - **Summarize**: Executive brief synthesis and key takeaway generation.
    - **Data Extraction**: Structured line-item, vendor, total, and table extraction.

- **Enterprise Privacy & Security**:
  - Ephemeral in-memory processing with automatic garbage collection TTL.
  - Zero permanent retention of user files without explicit consent.
  - 256-bit SSL encryption ready.

---

## 2. Architecture & Tech Stack

```
DocuForge Platform
├── Frontend
│   ├── Next.js 15 (App Router, Server Actions, React 19)
│   ├── Tailwind CSS (Custom SaaS design system & dark mode)
│   ├── Lucide Icons & Framer Motion (Tactile micro-interactions)
│   └── Client-side Processing (pdf-lib, Tesseract.js, JSZip, Canvas)
│
├── Backend / API Layer
│   ├── Next.js Route Handlers (/api/workflows/*, /api/tools/*, /api/ai/*)
│   ├── Natural Language Workflow Compiler (NLP rule engine)
│   ├── Ephemeral Storage Manager
│   └── Background Job Queue (BullMQ / Redis compatible)
│
└── Processing Engines & Workers
    ├── Node.js PDF Core (pdf-lib, docx, mammoth, sharp)
    ├── Python Worker Service (PyMuPDF, pdfplumber, python-docx)
    └── LibreOffice Headless & Tesseract OCR
```

---

## 3. How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+
- Optional: Python 3.10+ and LibreOffice for native worker conversion

### Quick Start
```bash
# 1. Navigate to project directory
cd docuforge

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Docker Deployment

To launch the complete containerized stack (Web App, PostgreSQL, Redis, Python Worker with LibreOffice and Tesseract OCR):

```bash
docker compose up --build -d
```

Services exposed:
- **Web Application**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **Redis Queue**: `localhost:6379`

---

## 5. Functional Status Matrix

| Tool / Module | Status | Processing Engine |
| :--- | :--- | :--- |
| **Smart PDF Workspace** | **Fully Functional** | NL Parser + Sequential DAG Engine |
| **Word → PDF** | **Fully Functional** | Mammoth + PDF-Lib + LibreOffice Worker |
| **PDF → Word (DOCX)** | **Fully Functional** | PDF text extractor + DOCX Packer |
| **Merge PDF** | **Fully Functional** | PDF-Lib Stream Stitcher |
| **Split PDF** | **Fully Functional** | PDF-Lib Range Partition + JSZip |
| **Compress PDF** | **Fully Functional** | PDF-Lib Object Stream Optimizer |
| **JPG / PNG → PDF** | **Fully Functional** | PDF-Lib Image Embedder + Layout Scaler |
| **PDF → JPG / PNG** | **Fully Functional** | High-DPI Canvas Renderer + JSZip |
| **Organize / Rotate / Delete** | **Fully Functional** | Interactive Thumbnail Grid + PDF-Lib |
| **Watermark PDF** | **Fully Functional** | PDF-Lib Vector Typography Stamp |
| **Add Page Numbers** | **Fully Functional** | PDF-Lib Dynamic Header/Footer Renderer |
| **PDF Canvas Editor** | **Fully Functional** | HTML5 Canvas + Layer Annotation Exporter |
| **Ask PDF (AI Chat)** | **Fully Functional** | Grounded Citation Engine + Document Viewer |
| **OCR Searchable PDF** | **Fully Functional** | Tesseract.js / Python OCR Worker |
| **User Dashboard & Auth** | **Fully Functional** | Session State + Workflow Persistence |
| **Admin Operations** | **Fully Functional** | Real-time Telemetry & Health Monitoring |

---

## 6. Environment Configuration

See `.env.example` for all configurable variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis queue backend
- `S3_ENDPOINT`: Object storage endpoint
- `AI_API_KEY`: API key for external LLM models (Gemini / OpenAI)
- `STRIPE_SECRET_KEY`: Billing & subscription integration
- `FILE_RETENTION_HOURS`: Ephemeral file retention timeout (default: 1 hour)

---

## 7. Recommended Next Steps

1. **OCR Multilingual Pack**: Mount additional Tesseract language data sets (e.g. `tesseract-ocr-deu`, `tesseract-ocr-fra`, `tesseract-ocr-jpn`).
2. **Stripe Webhooks**: Wire up live subscription webhooks for Pro/Business tier quotas.
3. **SSO / SAML**: Integrate WorkOS or NextAuth for enterprise organization single sign-on.
