'use client';

import { useRef } from 'react';
import { X, Download } from 'lucide-react';

type Props = {
  content: string;
  name?: string;
  onClose: () => void;
};

function parseResume(content: string) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections: { heading?: string; items: string[] }[] = [];
  let current: { heading?: string; items: string[] } = { items: [] };

  for (const line of lines) {
    if (line.startsWith('# ')) {
      current = { heading: undefined, items: [line.replace(/^# /, '')] };
      sections.push(current);
    } else if (line.startsWith('## ')) {
      current = { heading: line.replace(/^## /, ''), items: [] };
      sections.push(current);
    } else {
      current.items.push(line);
    }
  }
  return sections;
}

function renderInline(text: string) {
  // Bold **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  );
}

function ResumeTemplate({ content }: { content: string }) {
  const sections = parseResume(content);
  const header = sections.find((s) => !s.heading);
  const rest = sections.filter((s) => s.heading);

  const headerLines = header?.items || [];
  const name = headerLines[0] || '';
  const contactLine = headerLines[1] || '';
  const contacts = contactLine.split('|').map((c) => c.trim());

  return (
    <div
      id="resume-template"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 48px',
        background: '#fff',
        color: '#1a1a1a',
        fontSize: '11pt',
        lineHeight: '1.5',
        minHeight: '1056px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #1a1a1a', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '22pt', fontWeight: 'bold', margin: '0 0 6px', letterSpacing: '1px', textTransform: 'uppercase' }}>{name}</h1>
        <div style={{ fontSize: '10pt', color: '#444', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 16px' }}>
          {contacts.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>

      {/* Sections */}
      {rest.map((section, si) => (
        <div key={si} style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '11pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '1px solid #1a1a1a',
            paddingBottom: '3px',
            marginBottom: '8px',
            color: '#1a1a1a',
          }}>
            {section.heading}
          </h2>

          <div>
            {section.items.map((item, ii) => {
              if (item.startsWith('### ')) {
                return (
                  <p key={ii} style={{ fontWeight: 'bold', margin: '8px 0 2px', fontSize: '10.5pt' }}>
                    {renderInline(item.replace(/^### /, ''))}
                  </p>
                );
              }
              if (item.startsWith('- ') || item.startsWith('* ')) {
                return (
                  <div key={ii} style={{ display: 'flex', gap: '8px', marginBottom: '2px', paddingLeft: '8px' }}>
                    <span style={{ marginTop: '4px', fontSize: '8pt' }}>●</span>
                    <span style={{ fontSize: '10pt' }}>{renderInline(item.slice(2))}</span>
                  </div>
                );
              }
              return (
                <p key={ii} style={{ margin: '2px 0', fontSize: '10pt', color: '#333' }}>
                  {renderInline(item)}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResumePreview({ content, name, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const style = `
      <style>
        @page { margin: 0; size: A4; }
        body { margin: 0; padding: 0; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    `;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${style}</head><body>${printRef.current?.innerHTML || ''}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Resume Preview</p>
            {name && <p className="text-xs text-zinc-500 dark:text-zinc-400">{name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resume content */}
        <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-800 p-6">
          <div ref={printRef} className="shadow-lg">
            <ResumeTemplate content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
