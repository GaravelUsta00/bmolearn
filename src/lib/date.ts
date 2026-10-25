// Takvim günleri kullanıcının YEREL saatine göre (B4). Eskiden `toISOString()` (UTC) kullanılıyordu;
// Türkiye'de (UTC+3) 00:00–02:59 arası tamamlanan pomodorolar önceki güne yazılıyordu.
// Eski kayıtlar olduğu gibi kalır (karar: migrasyon yok).
export const localDateKey = (d: Date | number = new Date()): string => {
  const date = typeof d === 'number' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Bugünden geriye `count` günün yerel anahtarları (en eskiden bugüne). */
export const lastLocalDays = (count: number, today = new Date()): string[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return localDateKey(d);
  });
