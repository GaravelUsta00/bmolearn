import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from '@/components/ui/Markdown';

const html = (md: string, variant?: 'note') => renderToStaticMarkup(<Markdown variant={variant}>{md}</Markdown>);

describe('Markdown güvenliği (S5)', () => {
  it('ham HTML düz metin olarak kalır: <img onerror>, <script>, <iframe> eleman olmaz', () => {
    const out = html(
      '<img src=x onerror="alert(1)">\n\n<script>alert(2)</script>\n\n<iframe src="https://x"></iframe>'
    );
    expect(out).not.toMatch(/<img|<script|<iframe/i);
    expect(out).toContain('&lt;img src=x onerror=');
    expect(out).toContain('&lt;script&gt;');
  });

  it('bağlantılar: yalnızca https korunur, rel="noopener noreferrer nofollow"', () => {
    const out = html('[a](https://example.com) [b](javascript:alert(1)) [c](data:text/html,x) [d](http://x.com)');
    const hrefs = [...out.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(['https://example.com']);
    expect(out).toMatch(/rel="noopener noreferrer nofollow"/);
    expect(out).not.toMatch(/javascript:|data:text/);
  });

  it('markdown görselleri gösterilmez', () => {
    expect(html('![x](https://example.com/a.png)')).not.toMatch(/<img/);
  });

  it('biçimlendirme çalışır: kalın, liste, alıntı, satır sonu', () => {
    const out = html('**kalın**\n- bir\n- iki\n\n> alıntı\nsatır1\nsatır2', 'note');
    expect(out).toMatch(/<strong[^>]*>kalın<\/strong>/);
    expect(out).toMatch(/<li[^>]*>bir<\/li>/);
    expect(out).toMatch(/<blockquote/);
    expect(out).toMatch(/<br\/?>/);
  });
});
