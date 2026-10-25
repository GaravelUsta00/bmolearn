'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfJs, pdfErrorMessage, PDF_DOCUMENT_OPTIONS, type PdfJsModule } from '@/lib/pdf';

// pdf.js tabanlı görüntüleyici (A3, S3): iframe yok; iOS Safari ve Android Chrome'da da çok sayfalı
// belge kaydırılır. Sayfalar görünüme yaklaşınca çizilir, uzaklaşınca bellekten bırakılır.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.2;
const PAGE_GAP = 16;
const MAX_PIXEL_RATIO = 2;

interface PageSize {
  width: number;
  height: number;
}

interface PdfPageProps {
  pdfjs: PdfJsModule;
  doc: PDFDocumentProxy;
  pageNumber: number;
  size: PageSize;
  scale: number;
  root: HTMLElement | null;
}

const PdfPage = memo(({ pdfjs, doc, pageNumber, size, scale, root }: PdfPageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !root) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root,
      rootMargin: '150% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const host = ref.current;
    if (!near || !host) return;
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    let textLayer: { cancel: () => void } | null = null;

    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.className = 'block';
      const task = page.render({ canvas, viewport: page.getViewport({ scale: scale * ratio }) });
      renderTask = task;
      try {
        await task.promise;
      } catch {
        return; // iptal edildi
      }
      if (cancelled) return;

      const textDiv = document.createElement('div');
      textDiv.className = 'textLayer';
      const layer = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textDiv, viewport });
      textLayer = layer;
      host.replaceChildren(canvas, textDiv);
      try {
        await layer.render();
      } catch {
        /* metin katmanı olmadan da sayfa görünür */
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      host.replaceChildren();
    };
  }, [near, pdfjs, doc, pageNumber, scale]);

  return (
    <div
      ref={ref}
      data-page={pageNumber}
      aria-label={`Sayfa ${pageNumber}`}
      role="img"
      className="relative mx-auto bg-pdf-page shadow-page"
      style={
        {
          width: size.width * scale,
          height: size.height * scale,
          '--total-scale-factor': scale,
          '--scale-round-x': '1px',
          '--scale-round-y': '1px',
        } as React.CSSProperties
      }
    />
  );
});
PdfPage.displayName = 'PdfPage';

interface PdfViewerProps {
  url: string;
  title: string;
  onQuote: (text: string, page: number) => void;
}

export const PdfViewer = ({ url, title, onQuote }: PdfViewerProps) => {
  const [pdfjs, setPdfjs] = useState<PdfJsModule | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [fitWidth, setFitWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState<{ text: string; page: number } | null>(null);

  // Belgeyi aç
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    setDoc(null);
    setSizes([]);
    setError(null);
    loadPdfJs()
      .then(async (m) => {
        const task = m.getDocument({ url, ...PDF_DOCUMENT_OPTIONS });
        loadingTask = task;
        const d = await task.promise;
        if (cancelled) return;
        const all: PageSize[] = [];
        for (let i = 1; i <= d.numPages; i++) {
          const p = await d.getPage(i);
          const v = p.getViewport({ scale: 1 });
          all.push({ width: v.width, height: v.height });
          if (cancelled) return;
        }
        setPdfjs(() => m);
        setDoc(d);
        setSizes(all);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(pdfErrorMessage(e));
      });
    return () => {
      cancelled = true;
      // pdf.js 6: belge, yükleme görevi üzerinden kapatılır (worker kaynakları serbest kalır).
      void loadingTask?.destroy();
    };
  }, [url]);

  // Genişliğe sığdır: kaydırma alanının genişliği değişince yeniden hesapla
  useEffect(() => {
    if (!scroller) return;
    const ro = new ResizeObserver(([entry]) => setFitWidth(entry.contentRect.width));
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [scroller]);

  const widest = sizes.reduce((w, s) => Math.max(w, s.width), 0);
  const scale = widest && fitWidth ? ((fitWidth - 2 * PAGE_GAP) / widest) * zoom : 0;

  // Hangi sayfadayız?
  useEffect(() => {
    if (!scroller || !doc) return;
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setCurrentPage(Number((best.target as HTMLElement).dataset.page));
      },
      { root: scroller, threshold: [0.25, 0.5, 0.75] }
    );
    scroller.querySelectorAll('[data-page]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scroller, doc, scale]);

  // Metin seçimi → "Notlara ekle"
  const handlePointerUp = useCallback(() => {
    window.setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      const anchor = sel?.anchorNode instanceof Element ? sel.anchorNode : sel?.anchorNode?.parentElement;
      const pageEl = anchor?.closest('[data-page]') as HTMLElement | null;
      if (text && pageEl && scroller?.contains(pageEl)) setSelection({ text, page: Number(pageEl.dataset.page) });
      else setSelection(null);
    }, 30);
  }, [scroller]);

  const zoomTo = (z: number) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)));

  if (error) {
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 bg-page px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ribbon">PDF açılamadı</p>
        <p className="max-w-md font-serif text-lg leading-snug text-ink">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-page-2">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rule bg-page px-2">
        <span className="px-2 font-mono text-[11px] tabular-nums text-mute" aria-live="polite">
          {doc ? `Sayfa ${currentPage} / ${doc.numPages}` : 'PDF hazırlanıyor…'}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => zoomTo(zoom / ZOOM_STEP)}
            disabled={!doc || zoom <= ZOOM_MIN}
            aria-label="Uzaklaştır"
            className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink disabled:opacity-40"
          >
            <Minus size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={!doc}
            aria-label="Genişliğe sığdır"
            className="min-h-11 px-2 font-mono text-[11px] tabular-nums text-mute hover:text-ink disabled:opacity-40"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => zoomTo(zoom * ZOOM_STEP)}
            disabled={!doc || zoom >= ZOOM_MAX}
            aria-label="Yakınlaştır"
            className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink disabled:opacity-40"
          >
            <Plus size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div
        ref={setScroller}
        onPointerUp={handlePointerUp}
        aria-label={title}
        className="custom-scrollbar relative flex-1 overflow-auto overscroll-contain"
      >
        {selection && (
          <div className="sticky top-2 z-10 flex justify-center">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onQuote(selection.text, selection.page);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink px-4 text-sm text-page shadow-page"
            >
              <Bookmark size={14} strokeWidth={1.5} /> Seçili metni notlara ekle
            </button>
          </div>
        )}
        {doc && pdfjs && scale > 0 ? (
          <div className="flex flex-col py-4" style={{ gap: PAGE_GAP, minWidth: widest * scale + 2 * PAGE_GAP }}>
            {sizes.map((size, i) => (
              <PdfPage key={i} pdfjs={pdfjs} doc={doc} pageNumber={i + 1} size={size} scale={scale} root={scroller} />
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-mute">PDF hazırlanıyor…</p>
        )}
      </div>
    </div>
  );
};
