import React from 'react';

interface AssistantTextBlockProps {
  content: string;
}

export const AssistantTextBlock: React.FC<AssistantTextBlockProps> = ({ content }) => {
  // Support simple markdown rendering: bold, bullet lists, paragraphs
  const paragraphs = content.split('\n\n');

  return (
    <div className="text-xs text-[#1E293B] leading-relaxed space-y-2.5">
      {paragraphs.map((p, idx) => {
        const lines = p.split('\n');
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const isH3 = line.trim().startsWith('### ');
              const cleanLine = isH3 ? line.trim().replace(/^###\s*/, '') : line;
              // Parse bold **text**
              const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
              const isBullet = cleanLine.trim().startsWith('•') || cleanLine.trim().startsWith('-');

              if (isH3) {
                return (
                  <div key={lIdx} className="font-bold text-sm text-[#0F172A] pt-1.5 pb-0.5">
                    {parts.map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <span key={pIdx}>{part.slice(2, -2)}</span>;
                      }
                      return <span key={pIdx}>{part}</span>;
                    })}
                  </div>
                );
              }

              return (
                <div
                  key={lIdx}
                  className={isBullet ? 'pl-2 text-[#334155]' : ''}
                >
                  {parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="font-bold text-[#0F172A]">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
