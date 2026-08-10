import React, { useState } from 'react';
import { ChevronRight, Database, Sparkles } from 'lucide-react';

interface StageHeaderProps {
  tableName: string;
  onBatchConfirm?: () => void;
  activeTab?: 'field' | 'table' | 'relation';
  setActiveTab?: (tab: 'field' | 'table' | 'relation') => void;
}

export const StageHeader: React.FC<StageHeaderProps> = ({ 
  tableName, 
  onBatchConfirm,
  activeTab = 'table',
  setActiveTab
}) => {
  const [internalTab, setInternalTab] = useState<'field' | 'table' | 'relation'>('table');
  const currentTab = activeTab ?? internalTab;

  const handleTabClick = (tab: 'field' | 'table' | 'relation') => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const stages = [
    { id: '1', name: '① 语义理解', statusText: '当前阶段', status: 'current' },
    { id: '2', name: '② 对象建模', statusText: '待生成', status: 'pending' },
    { id: '3', name: '③ 语义资产', statusText: '待完善', status: 'pending' },
    { id: '4', name: '④ 发布验证', statusText: '未开始', status: 'upcoming' },
  ];

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-6 py-2 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
      {/* Left: Breadcrumb + Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
          <span>语义治理</span>
          <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
          <span>语义工作台</span>
          <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
          <span className="font-mono font-bold text-[#1E293B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
            {tableName}
          </span>
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block h-4 w-px bg-[#E2E8F0]" />

        {/* View Tabs */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => handleTabClick('field')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              currentTab === 'field'
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#4F46E5]/30'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
            }`}
          >
            字段理解
          </button>
          <button
            onClick={() => handleTabClick('table')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              currentTab === 'table'
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#4F46E5]/30'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
            }`}
          >
            表理解
          </button>
          <button
            onClick={() => handleTabClick('relation')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              currentTab === 'relation'
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#4F46E5]/30'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
            }`}
          >
            关系理解
          </button>
        </div>
      </div>

      {/* Right: Workflow Steps Bar */}
      <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto scrollbar-none text-xs">
        {stages.map((st, idx) => {
          const isCurrent = st.status === 'current';
          return (
            <React.Fragment key={st.id}>
              {idx > 0 && <span className="text-[#CBD5E1] font-mono text-[10px]">→</span>}
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all ${
                  isCurrent
                    ? 'bg-[#4F46E5] text-white font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                <span>{st.name}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                    isCurrent ? 'bg-white/20 text-white' : 'text-[#94A3B8]'
                  }`}
                >
                  {st.statusText}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};


