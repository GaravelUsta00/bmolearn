// zod'u uygulama genelinde tek yerden yapılandırır. `jitless`: zod 4, hızlandırma için
// `new Function` ile eval desteğini yoklar; CSP'mizde 'unsafe-eval' olmadığı için bu yoklama
// ihlal raporu üretir. JIT'siz çalışma veri boyutlarımızda fark yaratmaz.
import { z } from 'zod';

z.config({ jitless: true });

export { z };
