'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// Güvenli markdown (S1, B12): ham HTML düz metin olarak gösterilir (rehype-raw YOK),
// yalnızca aşağıdaki elemanlar üretilir, bağlantılar yalnızca https:, görsel yok.
const ALLOWED = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

export const safeUrl = (url: string): string => (/^https:\/\//i.test(url.trim()) ? url : '');

const components = (variant: 'reading' | 'note'): Components => {
  const note = variant === 'note';
  return {
    h1: ({ children }) => (
      <h1 className={note ? 'font-semibold' : 'mb-3 mt-6 font-serif text-2xl leading-tight first:mt-0'}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={note ? 'font-semibold' : 'mb-2 mt-5 font-serif text-xl leading-snug first:mt-0'}>{children}</h2>
    ),
    h3: ({ children }) => <h3 className={note ? 'font-semibold' : 'mb-2 mt-4 text-lg font-semibold'}>{children}</h3>,
    h4: ({ children }) => <h4 className={note ? 'font-semibold' : 'mb-2 mt-4 font-semibold'}>{children}</h4>,
    h5: ({ children }) => <h5 className="font-semibold">{children}</h5>,
    h6: ({ children }) => <h6 className="font-semibold">{children}</h6>,
    p: ({ children }) => <p className={note ? 'mb-1 last:mb-0' : 'mb-4 last:mb-0'}>{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    del: ({ children }) => <del className="text-mute">{children}</del>,
    ul: ({ children }) => <ul className={`list-disc pl-5 ${note ? 'mb-1' : 'mb-4 space-y-1'}`}>{children}</ul>,
    ol: ({ children }) => <ol className={`list-decimal pl-5 ${note ? 'mb-1' : 'mb-4 space-y-1'}`}>{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className={`border-l-2 border-ribbon pl-3 italic text-mute ${note ? '' : 'my-4'}`}>
        {children}
      </blockquote>
    ),
    code: ({ children }) => <code className="rounded-sm bg-page-2 px-1 font-mono text-[0.9em]">{children}</code>,
    pre: ({ children }) => (
      <pre className="custom-scrollbar mb-4 overflow-x-auto rounded-sm bg-page-2 p-3 font-mono text-sm">{children}</pre>
    ),
    hr: () => <hr className="my-6 border-rule" />,
    table: ({ children }) => (
      <div className="custom-scrollbar mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-mute px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-rule px-2 py-1 align-top">{children}</td>,
    a: ({ href, children }) =>
      href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-ribbon underline decoration-rule underline-offset-2 hover:decoration-ribbon"
        >
          {children}
        </a>
      ) : (
        <span>{children}</span>
      ),
  };
};

interface MarkdownProps {
  children: string;
  /** `reading`: özet (16.5px / 1.75); `note`: kısa not satırı. */
  variant?: 'reading' | 'note';
  className?: string;
}

export const Markdown = ({ children, variant = 'reading', className = '' }: MarkdownProps) => (
  <div className={`${variant === 'reading' ? 'md-reading text-[16.5px] leading-[1.75]' : 'md-note'} ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      allowedElements={ALLOWED}
      unwrapDisallowed
      urlTransform={safeUrl}
      components={components(variant)}
    >
      {children}
    </ReactMarkdown>
  </div>
);
