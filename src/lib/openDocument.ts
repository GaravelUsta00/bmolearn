// Belge (PDF) açmanın tek yolu (B14). Landing, çalışma ekranı, geçmiş ve "yeniden yükle" modalı
// hepsi buradan geçer; böylece geçmişe ekleme, cihazda saklama ve blob URL yönetimi tek yerde.
import { useStore } from '@/store/useStore';
import { isPdfFile } from '@/lib/safeInput';
import { clearDocuments, deleteDocuments, loadDocument, saveDocument } from '@/lib/idb';

export const UNSUPPORTED_FILE = 'Desteklenmeyen dosya: yalnızca PDF açılabilir.';
export const UNSUPPORTED_LINK = 'Yalnızca YouTube bağlantısı ya da PDF açılabilir.';

const persist = async (id: string, file: Blob, name: string) => {
  const st = useStore.getState();
  if (!st.documentSettings.storePdfs) return;
  const r = await saveDocument(id, file, name);
  if (!r.ok) st.addStorageNotice({ kind: 'pdf-not-saved', reason: r.reason, name });
};

const show = (id: string, title: string, blob: Blob) => {
  const st = useStore.getState();
  st.setInputError(null);
  st.setPlaylistItems([]);
  st.setContentConfig({ id, type: 'document', title, url: URL.createObjectURL(blob), fileType: 'pdf' });
  st.setView('app');
};

/** Yeni seçilen dosya. PDF değilse yalnızca uyarı gösterilir, mevcut içerik değişmez (karar #4). */
export const openDocumentFile = async (file: File): Promise<boolean> => {
  if (!(await isPdfFile(file))) {
    useStore.getState().setInputError(UNSUPPORTED_FILE);
    return false;
  }
  const id = 'doc_' + Date.now();
  show(id, file.name, file);
  useStore.getState().addToHistory({ contentId: id, title: file.name, timestamp: Date.now(), type: 'document' });
  void persist(id, file, file.name);
  return true;
};

/** Geçmişten açma: cihazda saklıysa doğrudan açılır, değilse dosyayı yeniden seçme modalı. */
export const openHistoryDocument = async (id: string, title: string) => {
  const blob = await loadDocument(id);
  if (blob) {
    show(id, title, blob);
    return;
  }
  const st = useStore.getState();
  st.setPlaylistItems([]);
  st.setContentConfig({ id, type: 'document', title, url: undefined, fileType: undefined });
  st.setPendingDocReload({ id, title });
  st.setView('app');
};

/** "Dokümanı yeniden yükle" modalında seçilen dosya: aynı kimlikle açılır ve saklanır. */
export const reloadDocumentFile = async (file: File, pending: { id: string; title: string }): Promise<boolean> => {
  if (!(await isPdfFile(file))) {
    useStore.getState().setInputError(UNSUPPORTED_FILE);
    return false;
  }
  show(pending.id, pending.title, file);
  useStore.getState().setPendingDocReload(null);
  void persist(pending.id, file, pending.title);
  return true;
};

/** Geçmişten silinen belgelerin cihazdaki kopyaları da silinir. */
export const forgetDocuments = (ids: string[]) => deleteDocuments(ids.filter((id) => id.startsWith('doc_')));
export const forgetAllDocuments = () => clearDocuments();
