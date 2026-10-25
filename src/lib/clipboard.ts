/**
 * Metni panoya kopyalar (B17). Clipboard API yoksa ya da izin verilmezse (http, eski Safari, iframe)
 * gizli bir textarea ile `execCommand('copy')` denenir. İkisi de başarısızsa false döner; çağıran
 * metni seçilebilir biçimde göstermelidir.
 */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // aşağıdaki yedek yönteme geç
  }
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  active?.focus();
  return ok;
};
