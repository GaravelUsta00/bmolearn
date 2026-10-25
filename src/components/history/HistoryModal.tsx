'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Trash2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { findOrphanedContentIds } from '@/store/slices/historySlice';
import { forgetAllDocuments, forgetDocuments, openHistoryDocument } from '@/lib/openDocument';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRetained } from '@/hooks/usePresence';
import type { HistoryItem } from '@/types';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

const typeLabel = (item: HistoryItem) =>
  item.type === 'playlist'
    ? `Koleksiyon · ${item.playlistItems?.length || 0} video`
    : item.type === 'document'
      ? 'PDF'
      : 'Video';

const Thumb = ({ item }: { item: HistoryItem }) =>
  item.type === 'document' ? (
    <div className="flex aspect-video w-full items-center justify-center bg-page-2">
      <FileText size={28} strokeWidth={1.5} className="text-mute" aria-hidden="true" />
    </div>
  ) : (
    <div className="aspect-video w-full overflow-hidden bg-plate">
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube küçük resmi; optimizasyon gerekmez */}
      <img
        src={`https://img.youtube.com/vi/${item.contentId}/mqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );

// Geçmiş penceresi (DESIGN §8.5): kayıtlar, koleksiyon ayrıntısı, onaylı silme ve yetim veri temizliği.
export const HistoryModal = ({ showHistory, setShowHistory }: HistoryModalProps) => (
  <Modal
    open={showHistory}
    onClose={() => setShowHistory(false)}
    labelledBy="history-title"
    className="flex h-[min(85dvh,56rem)] max-w-5xl flex-col overflow-hidden"
  >
    <HistoryBody close={() => setShowHistory(false)} />
  </Modal>
);

type Pending =
  { kind: 'item'; item: HistoryItem } | { kind: 'all'; count: number } | { kind: 'orphans'; count: number } | null;

const HistoryBody = ({ close }: { close: () => void }) => {
  const history = useStore((s) => s.history);
  const orphanCount = useStore((s) => findOrphanedContentIds(s).length);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const shown = useRetained(pending);
  const selected = history.find((h) => h.id === selectedId && h.type === 'playlist') ?? null;

  const openVideo = (contentId: string, title: string, pId?: string | null) => {
    const { setContentConfig, setView } = useStore.getState();
    setContentConfig({ id: contentId, type: 'video', title, pId });
    close();
    setView('app');
  };

  const openItem = (item: HistoryItem) => {
    if (item.type === 'playlist') setSelectedId(item.id);
    else if (item.type === 'video') openVideo(item.contentId, item.title, item.pId);
    else {
      close();
      void openHistoryDocument(item.contentId, item.title);
    }
  };

  const confirm = () => {
    if (!pending) return;
    const st = useStore.getState();
    if (pending.kind === 'item') {
      st.deleteHistoryItem(pending.item.id);
      if (pending.item.type === 'document') void forgetDocuments([pending.item.contentId]);
    } else if (pending.kind === 'all') {
      st.clearHistory();
      void forgetAllDocuments();
    } else {
      void forgetDocuments(st.removeOrphanedData());
    }
    setPending(null);
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rule py-1 pl-2 pr-1 sm:pl-4">
        <div className="flex min-w-0 items-center gap-1">
          {selected && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Geçmişe dön"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-mute hover:text-ink"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>
          )}
          <h2 id="history-title" className="truncate font-serif text-xl">
            {selected ? 'Koleksiyon' : 'Geçmiş'}
          </h2>
          {!selected && <span className="ml-2 font-mono text-xs tabular-nums text-mute">{history.length}</span>}
        </div>
        <div className="flex items-center gap-1">
          {!selected && history.length > 0 && (
            <button
              type="button"
              onClick={() => setPending({ kind: 'all', count: history.length })}
              className="min-h-11 px-2 text-sm text-ribbon underline decoration-rule underline-offset-4 hover:decoration-ribbon"
            >
              Tümünü temizle
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Kapat"
            className="inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
        {selected ? (
          <section aria-labelledby="collection-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">{typeLabel(selected)}</p>
                <h3 id="collection-title" className="mt-1 font-serif text-2xl leading-tight">
                  {selected.title.replace(/^Koleksiyon:\s*/, '')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openVideo(selected.contentId, selected.title, selected.pId)}
                className="min-h-11 shrink-0 rounded-sm bg-ink px-5 text-sm text-page hover:opacity-90"
              >
                Kaldığın yerden devam et
              </button>
            </div>
            <h4 className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">İzlediklerin</h4>
            <ol className="mt-2 divide-y divide-rule border-y border-rule">
              {selected.playlistItems?.map((v, i) => {
                const last = v.contentId === selected.contentId;
                return (
                  <li key={v.contentId + i}>
                    <button
                      type="button"
                      onClick={() => openVideo(v.contentId, v.title, selected.pId)}
                      aria-current={last ? 'true' : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 py-2 text-left hover:bg-page-2 ${last ? 'border-l-2 border-ribbon pl-3' : 'pl-[14px]'}`}
                    >
                      <span className="w-20 shrink-0 sm:w-28">
                        <Thumb item={{ ...selected, contentId: v.contentId, type: 'video' }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${last ? 'italic text-ink' : 'text-ink'}`}>
                          {v.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-mute">
                          {formatDate(v.timestamp)}
                          {last && ' · son izlenen'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : history.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="font-serif text-lg italic">Henüz geçmiş kaydı yok.</p>
            <p className="text-sm text-mute">Açtığın videolar, listeler ve PDF&apos;ler burada birikir.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {history.map((item) => (
              <li key={item.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="group flex gap-3 text-left sm:flex-col sm:gap-0"
                >
                  <span className="w-28 shrink-0 overflow-hidden rounded-sm border border-rule shadow-page sm:w-full">
                    <Thumb item={item} />
                  </span>
                  <span className="min-w-0 flex-1 sm:mt-2">
                    <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                      {typeLabel(item)}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-ink group-hover:text-ribbon">
                      {item.title}
                    </span>
                  </span>
                </button>
                <div className="mt-1 flex items-center justify-between gap-2 pl-31 sm:pl-0">
                  <span className="font-mono text-[11px] text-mute">{formatDate(item.timestamp)}</span>
                  <button
                    type="button"
                    onClick={() => setPending({ kind: 'item', item })}
                    aria-label={`Sil: ${item.title}`}
                    title="Kaydı ve verilerini sil"
                    className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ribbon"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!selected && orphanCount > 0 && (
        <div
          data-orphans
          className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-rule px-4 py-2 sm:px-6"
        >
          <p className="text-sm text-mute">
            Geçmişte görünmeyen <span className="font-mono tabular-nums text-ink">{orphanCount}</span> içeriğe ait
            notlar ya da kartlar var.
          </p>
          <button
            type="button"
            onClick={() => setPending({ kind: 'orphans', count: orphanCount })}
            className="min-h-11 text-sm text-ribbon underline decoration-rule underline-offset-4 hover:decoration-ribbon"
          >
            Sahipsiz verileri temizle
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={
          shown?.kind === 'all'
            ? 'Tüm geçmiş silinsin mi?'
            : shown?.kind === 'orphans'
              ? 'Sahipsiz veriler silinsin mi?'
              : 'Kayıt silinsin mi?'
        }
        confirmLabel={shown?.kind === 'all' ? 'Tümünü sil' : 'Sil'}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        {shown?.kind === 'all' && (
          <p>
            {shown.count} kayıt ve bunlara ait tüm notlar, özetler, kartlar, sorular, video ilerlemesi ve bu cihazda
            saklanan PDF&apos;ler silinir. Görevlerin ve pomodoro geçmişin korunur. Bu işlem geri alınamaz; istersen
            önce Ayarlar&apos;dan yedeği indir.
          </p>
        )}
        {shown?.kind === 'item' && (
          <p>
            <em className="text-ink">{shown.item.title}</em> geçmişten kalkar; ona ait notlar, özet, kartlar ve sorular
            {shown.item.type === 'document' ? ' ile bu cihazda saklanan PDF' : ''} da silinir. Bu işlem geri alınamaz.
          </p>
        )}
        {shown?.kind === 'orphans' && (
          <p>
            Hiçbir geçmiş kaydından açılamayan {shown.count} içeriğin notları, özetleri, kartları ve soruları silinir.
            Bu işlem geri alınamaz.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
};
