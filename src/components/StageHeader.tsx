import React, { useState } from 'react';
import { ChevronRight, RotateCw, FileText, ArrowLeft, Check } from 'lucide-react';

interface StageHeaderProps {
  tableName: string;
  onBatchConfirm?: () => void;
  activeTab?: 'field' | 'table' | 'discovery' | 'modeling' | 'assets';
  setActiveTab?: (tab: 'field' | 'table' | 'discovery' | 'modeling' | 'assets') => void;
  onBackToSemantic?: () => void;
  onReanalyze?: () => void;
}

export const StageHeader: React.FC<StageHeaderProps> = ({ 
  tableName, 
  activeTab = 'discovery',
  setActiveTab,
  onBackToSemantic,
  onReanalyze
}) => {
  const [internalTab, setInternalTab] = useState<'field' | 'table' | 'discovery' | 'modeling' | 'assets'>('discovery');
  const currentTab = activeTab ?? internalTab;

  const handleTabClick = (tab: 'field' | 'table' | 'discovery' | 'modeling' | 'assets') => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  return (
    <div className="bg-white border-b border-[#E2E8F0] shrink-0 divide-y divide-[#F1F5F9] shadow-2xs">
      {/* Sub-header Bar: Breadcrumb + Action Buttons */}
      <div className="px-6 py-2 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-[#64748B]">
          <span>语义治理</span>
          <span className="text-[#CBD5E1]">/</span>
          <span>语义工作台</span>
          <span className="text-[#CBD5E1]">/</span>
          <span className="font-semibold text-[#1E293B]">
            {currentTab === 'discovery'
              ? '业务对象发现'
              : currentTab === 'modeling'
              ? '业务对象建模'
              : currentTab === 'table'
              ? '表语义理解'
              : '字段语义理解'}
          </span>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center space-x-4 text-xs font-medium text-[#475569]">
          <button
            onClick={onReanalyze}
            className="flex items-center space-x-1 hover:text-[#2563EB] cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#64748B]" />
            <span>重新发现</span>
          </button>
          <button
            onClick={() => alert('查看语义依据：已关联 pop_service_hotline 表数据治理模型凭证链')}
            className="flex items-center space-x-1 hover:text-[#2563EB] cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span>查看语义依据</span>
          </button>
          <button
            onClick={onBackToSemantic || (() => handleTabClick('table'))}
            className="flex items-center space-x-1 hover:text-[#2563EB] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
            <span>返回语义理解</span>
          </button>
        </div>
      </div>

      {/* Semantic Lifecycle Stepper Row */}
      <div className="px-6 py-2.5 flex items-center justify-between">
        {/* Left Section Title */}
        <div className="text-xs font-bold text-[#1E293B] tracking-tight">
          Semantic Lifecycle
        </div>

        {/* Right Stepper Steps */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Step 1: 语义理解 (表理解 / 字段理解) */}
          <div className="flex items-center space-x-1.5 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
            <div
              onClick={() => handleTabClick('table')}
              className="flex items-center space-x-1.5 cursor-pointer px-1.5"
            >
              <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-[9px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="font-bold text-[#1E293B] text-xs">① 语义理解:</span>
            </div>

            <div className="flex items-center bg-white p-0.5 rounded border border-[#CBD5E1] shadow-2xs">
              <button
                onClick={() => handleTabClick('table')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  currentTab === 'table'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                表理解
              </button>
              <button
                onClick={() => handleTabClick('field')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  currentTab === 'field'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                字段理解
              </button>
            </div>
          </div>

          <div className="w-8 md:w-12 h-px bg-[#E2E8F0]" />

          {/* Step 2: 对象发现 (Current) */}
          <div
            onClick={() => handleTabClick('discovery')}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
              2
            </div>
            <div>
              <div className="font-bold text-[#2563EB]">对象发现</div>
              <div className="text-[10px] text-[#2563EB] font-medium">进行中</div>
            </div>
          </div>

          <div className="w-8 md:w-12 h-px bg-[#E2E8F0]" />

          {/* Step 3: 对象建模 (Waiting) */}
          <div
            onClick={() => handleTabClick('modeling')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] text-[#64748B] flex items-center justify-center font-bold text-[10px]">
              3
            </div>
            <div>
              <div className="font-medium text-[#64748B] group-hover:text-[#1E293B]">对象建模</div>
              <div className="text-[10px] text-[#94A3B8]">等待中</div>
            </div>
          </div>

          <div className="w-8 md:w-12 h-px bg-[#E2E8F0]" />

          {/* Step 4: 语义资产 */}
          <div
            onClick={() => handleTabClick('assets')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              currentTab === 'assets'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'border-2 border-[#CBD5E1] text-[#64748B]'
            }`}>
              4
            </div>
            <div>
              <div className={`font-medium ${currentTab === 'assets' ? 'text-[#2563EB] font-bold' : 'text-[#64748B] group-hover:text-[#1E293B]'}`}>
                语义资产
              </div>
              <div className={`text-[10px] ${currentTab === 'assets' ? 'text-[#2563EB] font-medium' : 'text-[#94A3B8]'}`}>
                {currentTab === 'assets' ? '目录浏览' : '可查看'}
              </div>
            </div>
          </div>

          <div className="w-8 md:w-12 h-px bg-[#E2E8F0]" />

          {/* Step 5: 发布验证 */}
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full border-2 border-[#E2E8F0] text-[#94A3B8] flex items-center justify-center font-bold text-[10px]">
              5
            </div>
            <div>
              <div className="font-medium text-[#94A3B8]">发布验证</div>
              <div className="text-[10px] text-[#CBD5E1]">未开始</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


