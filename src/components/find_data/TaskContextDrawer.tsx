import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Database, Target, AlertTriangle, Check } from 'lucide-react';
import { RequirementHypothesis } from './model/FindDataTask';

interface TaskContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hypothesis: RequirementHypothesis;
  scenarioKey?: string;
  activeResourceName?: string;
  onApplyChanges: (updated: Partial<RequirementHypothesis>) => void;
}

export const TaskContextDrawer: React.FC<TaskContextDrawerProps> = ({
  isOpen,
  onClose,
  hypothesis,
  scenarioKey,
  activeResourceName,
  onApplyChanges
}) => {
  const [region, setRegion] = useState(hypothesis.region || '');
  const [timeStart, setTimeStart] = useState(hypothesis.timeRange?.start || '');
  const [timeEnd, setTimeEnd] = useState(hypothesis.timeRange?.end || '');
  const [analysisFocus, setAnalysisFocus] = useState(hypothesis.analysisFocus.join('、'));
  const [popDef, setPopDef] = useState(hypothesis.populationDefinition || '');
  const [bedDef, setBedDef] = useState(hypothesis.bedDefinition || '');

  useEffect(() => {
    setRegion(hypothesis.region || '');
    setTimeStart(hypothesis.timeRange?.start || '');
    setTimeEnd(hypothesis.timeRange?.end || '');
    setAnalysisFocus(hypothesis.analysisFocus.join('、'));
    setPopDef(hypothesis.populationDefinition || '');
    setBedDef(hypothesis.bedDefinition || '');
  }, [hypothesis]);

  if (!isOpen) return null;

  const handleSave = () => {
    onApplyChanges({
      region,
      timeRange: timeStart || timeEnd ? {
        start: timeStart,
        end: timeEnd
      } : undefined,
      analysisFocus: analysisFocus.split(/[、,]/).map((value) => value.trim()).filter(Boolean),
      populationDefinition: popDef,
      bedDefinition: bedDef
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">当前任务上下文与口径配置</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Form fields */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-[#2563EB]" />
              <span>分析区域</span>
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#2563EB]" />
                <span>开始时间</span>
              </label>
              <input
                type="text"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#2563EB]" />
                <span>截止时间</span>
              </label>
              <input
                type="text"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
              <Target className="w-3 h-3 text-[#2563EB]" />
              <span>分析方向</span>
            </label>
            <input
              type="text"
              value={analysisFocus}
              onChange={(e) => setAnalysisFocus(e.target.value)}
              placeholder="尚未形成"
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {scenarioKey === 'minhang_bed_supply' && <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
              <Target className="w-3 h-3 text-[#2563EB]" />
              <span>老年人口统计口径定义</span>
            </label>
            <input
              type="text"
              value={popDef}
              onChange={(e) => setPopDef(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>}

          {scenarioKey === 'minhang_bed_supply' && <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#475569] flex items-center space-x-1">
              <Database className="w-3 h-3 text-[#2563EB]" />
              <span>养老床位供给口径定义</span>
            </label>
            <input
              type="text"
              value={bedDef}
              onChange={(e) => setBedDef(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>}

          {activeResourceName && (
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] text-[#64748B]">
              当前聚焦资源：<span className="font-semibold text-[#0F172A]">{activeResourceName}</span>
            </div>
          )}

          {/* Strict Conclusion Boundary Notice */}
          {scenarioKey === 'minhang_bed_supply' && <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1 text-[#92400E]">
            <div className="text-[10px] font-bold flex items-center space-x-1 text-[#B45309]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>结论边界约束（不可变更）</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              分析结论仅表达“床位供给水平相对全区加权平均偏低，建议进一步核查”；严禁直接表达为“供需不足”或“缺少养老资源”。
            </p>
          </div>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>保存并更新口径</span>
          </button>
        </div>
      </div>
    </div>
  );
};
