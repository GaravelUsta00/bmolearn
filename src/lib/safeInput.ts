// Kullanıcının verdiği dosyaların doğrulanması (S3).
// (Web adresi dalı kaldırıldığı için URL doğrulama yardımcısına gerek kalmadı; bağlantılar yalnızca
// YouTube kimliği olarak ayrıştırılır, bkz. lib/youtube.ts.)

/**
 * Dosyanın gerçekten PDF olup olmadığını denetler: uzantı ya da MIME tipi PDF olmalı VE
 * dosyanın ilk 1 KB'ı içinde `%PDF-` imzası bulunmalı (yeniden adlandırılmış dosyalara karşı).
 */
export const isPdfFile = async (file: File): Promise<boolean> => {
  const declared = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!declared) return false;
  try {
    const head = await file.slice(0, 1024).text();
    return head.includes('%PDF-');
  } catch {
    return false;
  }
};
