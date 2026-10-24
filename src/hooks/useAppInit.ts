import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { loadPersistedData, startPersistence } from '@/store/persistence';
import { NotificationManager } from '@/lib/notifications';
import { runMigration } from '@/lib/migration';

export const useAppInit = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Tema <head>'deki script tarafından ilk boyamadan önce uygulandı (constants/theme.ts);
    // burada yalnızca store senkronlanır, seçim kullanıcı değiştirene kadar kaydedilmez.
    useStore.setState({ theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' });

    // bmo_* → belearn_* güvenli kopya (bir kez); başarısızsa uygulama boş açılır ve uyarı gösterilir.
    const migration = runMigration();
    if (migration.status === 'failed') useStore.getState().addStorageNotice({ kind: 'migration-failed' });
    if (migration.status === 'unavailable') useStore.getState().addStorageNotice({ kind: 'unavailable' });

    useStore.getState().initData(loadPersistedData());
    // Yükleme bittikten sonra abone ol: okunan veri geri yazılmasın.
    const stopPersistence = startPersistence(useStore);

    NotificationManager.requestPermission();
    setIsInitializing(false);
    return stopPersistence;
  }, []);

  return isInitializing;
};
