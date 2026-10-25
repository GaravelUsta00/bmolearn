'use client';

import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DATA_KEY_LABELS, isDataKey } from '@/lib/storageKeys';
import type { StorageNotice } from '@/store/types';

const message = (n: StorageNotice): string => {
  switch (n.kind) {
    case 'quota':
      return 'Cihazdaki depolama alanı dolu: son değişikliklerin kaydedilemedi. Ayarlar > Yedeği indir ile verini kaydedip tarayıcıda yer açmayı dene.';
    case 'unavailable':
      return 'Tarayıcı depolamasına erişilemiyor (gizli pencere ya da engellenmiş site verisi). Değişikliklerin sayfa kapanınca kaybolacak.';
    case 'corrupt': {
      const names = n.keys.map((k) => (isDataKey(k) ? DATA_KEY_LABELS[k] : k)).join(', ');
      return `Bazı kayıtlar okunamadı ve atlandı (${names}). Okunamayan ham veri cihazında saklandı; Ayarlar > Yedeği indir ile onu da içeren bir yedek alabilirsin.`;
    }
    case 'pdf-not-saved': {
      const after = 'Yine de açıldı, ama sayfayı yenileyince ya da geçmişten açınca dosyayı yeniden seçmen gerekir.';
      if (n.reason === 'too-large') return `"${n.name}" 50 MB'tan büyük olduğu için bu cihazda saklanmadı. ${after}`;
      if (n.reason === 'quota')
        return `"${n.name}" bu cihazda saklanamadı: tarayıcının depolama alanı dolu ya da sınırlı (Safari'de sık görülür). Ayarlar'dan saklanan PDF'leri silerek yer açabilirsin. ${after}`;
      return `"${n.name}" bu tarayıcıda saklanamıyor (gizli pencere ya da engellenmiş site verisi olabilir). ${after}`;
    }
    case 'migration-failed':
      return 'Eski BMO Learn verilerin aktarılamadı. Eski veriler silinmedi; Ayarlar > Yedeği yükle ile bir yedek dosyasından yükleyebilirsin.';
  }
};

export const StorageNotices = () => {
  const { storageNotices, dismissStorageNotices } = useStore();
  if (storageNotices.length === 0) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-[70] animate-fade rounded-sm border border-rule border-l-2 border-l-ribbon bg-page p-4 pr-12 text-sm text-ink shadow-page sm:right-auto sm:max-w-md"
    >
      <ul className="space-y-2">
        {storageNotices.map((n, i) => (
          <li key={i}>{message(n)}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={dismissStorageNotices}
        aria-label="Uyarıyı kapat"
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center text-mute hover:text-ink"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
};
