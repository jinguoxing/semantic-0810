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
              // Parse bold **text**
              const parts = line.split(/(\*\*.*?\*\*)/g);
              const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');

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
