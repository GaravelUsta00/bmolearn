// pdf.js yalnızca bir PDF açılınca yüklenir (ilk paketi büyütmez). Varlıklar public/pdfjs/ altında
// (scripts/copy-pdfjs-assets.mjs). Worker ve wasm aynı kaynaktan gelir; CSP: worker-src 'self',
// script-src 'wasm-unsafe-eval' (bkz. SECURITY.md).
import type * as PdfJs from 'pdfjs-dist';

export type PdfJsModule = typeof PdfJs;

const BASE = '/pdfjs/';
let pdfjsPromise: Promise<PdfJsModule> | null = null;

export const loadPdfJs = (): Promise<PdfJsModule> => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist')
      .then((m) => {
        m.GlobalWorkerOptions.workerSrc = `${BASE}pdf.worker.min.mjs`;
        return m;
      })
      .catch((e) => {
        pdfjsPromise = null;
        throw e;
      });
  }
  return pdfjsPromise;
};

export const PDF_DOCUMENT_OPTIONS = {
  cMapUrl: `${BASE}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${BASE}standard_fonts/`,
  wasmUrl: `${BASE}wasm/`,
  iccUrl: `${BASE}iccs/`,
  enableXfa: false,
} as const;

/** Kullanıcıya gösterilecek açılma hatası. */
export const pdfErrorMessage = (e: unknown): string => {
  const name = e instanceof Error ? e.name : '';
  if (name === 'PasswordException') return 'Bu PDF parola korumalı; parolalı PDF’ler henüz açılamıyor.';
  if (name === 'InvalidPDFException') return 'Bu dosya geçerli bir PDF değil ya da bozuk.';
  return 'PDF açılamadı. Dosya bozuk olabilir; başka bir kopyasını dene.';
};
