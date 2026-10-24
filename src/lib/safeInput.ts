// Kullanıcının verdiği adres ve dosyaların doğrulanması (S2, S3).

/** Yalnızca geçerli bir https: adresini döndürür; `javascript:`, `data:`, `http:` vb. reddedilir. */
export const toHttpsUrl = (input: string): string | undefined => {
  try {
    const url = new URL(input.trim());
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};

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

/** Görüntüleyicinin beklediği dosya türü: geçerli PDF için 'pdf', aksi halde uzantı. */
export const documentFileType = async (file: File): Promise<string> => {
  if (await isPdfFile(file)) return 'pdf';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  // Uzantısı .pdf olup imzası tutmayan dosya PDF olarak gösterilmez.
  return ext === 'pdf' ? 'gecersiz-pdf' : ext;
};
