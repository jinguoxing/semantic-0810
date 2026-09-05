import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, FileText, Info } from 'lucide-react';
import { FindDataResource, ResourceComparisonRow, ResourceId } from './model/FindDataTask';

interface RightWorkspaceCompareProps {
  resources: FindDataResource[];
  comparisonRows?: ResourceComparisonRow[];
  recommendationConclusion?: string;
  recommendedResourceId?: ResourceId;
  selectedResourceId?: ResourceId;
  onSelectionChange?: (resourceId: ResourceId) => void;
  onConfirmSelection: (resourceId: ResourceId) => void;
  onViewFields: (resourceId: ResourceId) => void;
  onClose: () => void;
}

export const RightWorkspaceCompare: React.FC<RightWorkspaceCompareProps> = ({
  resources,
  comparisonRows = [],
  recommendationConclusion,
  recommendedResourceId,
  selectedResourceId,
  onSelectionChange,
  onConfirmSelection,
  onViewFields,
  onClose
}) => {
  const resA = resources[0];
  const resB = resources[1];

  const comparisonKey = [resA?.id, resB?.id].filter((id): id is ResourceId => !!id).sort().join('|');
  const defaultSelectedId = selectedResourceId && [resA?.id, resB?.id].includes(selectedResourceId)
    ? selectedResourceId
    : recommendedResourceId && [resA?.id, resB?.id].includes(recommendedResourceId)
    ? recommendedResourceId
    : resA?.id;
  const [selectedId, setSelectedId] = useState<ResourceId | undefined>(defaultSelectedId);
  const comparisonKeyRef = useRef(comparisonKey);

  useEffect(() => {
    const ids = [resA?.id, resB?.id].filter((id): id is ResourceId => !!id);
    const selectionIsValid = selectedId !== undefined && ids.includes(selectedId);
    if (comparisonKeyRef.current !== comparisonKey || !selectionIsValid) {
      comparisonKeyRef.current = comparisonKey;
      setSelectedId(defaultSelectedId);
    }
  }, [comparisonKey, defaultSelectedId, resA?.id, resB?.id, selectedId]);

  const selectCandidate = (resourceId: ResourceId) => {
    setSelectedId(resourceId);
    onSelectionChange?.(resourceId);
  };

  if (!resA || !resB) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 text-xs text-[#64748B] space-y-2">
        <FileText className="w-10 h-10 text-[#CBD5E1]" />
        <span className="font-semibold text-sm text-[#0F172A]">暂无可比对的资源项</span>
        <p className="text-center text-[#64748B] max-w-xs">
          请在检索结果或方案中选择至少两项候选数据资产进行深度选型对比。
        </p>
        <button
          onClick={onClose}
          aria-label="关闭右侧工作区"
          className="mt-2 px-3 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded text-[#475569] cursor-pointer"
        >
          关闭工作区
        </button>
      </div>
    );
  }

  // Dynamic conclusion text if none provided
  const conclusionText =
    recommendationConclusion ||
    `对比「${resA.name}」与「${resB.name}」：建议结合时效性、时间切片粒度以及权限可获取度进行选型。`;

  // Fallback comparison rows if none provided
  const rows: ResourceComparisonRow[] =
    comparisonRows.length > 0
      ? comparisonRows
      : [
          {
            dimension: '资产类型与归属',
            values: {
              [resA.id]: `${resA.type} (${resA.department || '未注明'})`,
              [resB.id]: `${resB.type} (${resB.department || '未注明'})`
            }
          },
          {
            dimension: '记录粒度',
            values: { [resA.id]: resA.granularity, [resB.id]: resB.granularity }
          },
          {
            dimension: '覆盖范围/时效',
            values: { [resA.id]: resA.timeCoverage, [resB.id]: resB.timeCoverage }
          },
          {
            dimension: '查询权限',
            values: {
              [resA.id]: resA.availabilityByAction.query === 'ALLOWED' ? '可直接查询' : '查询需申请',
              [resB.id]: resB.availabilityByAction.query === 'ALLOWED' ? '可直接查询' : '查询需申请'
            },
            highlightResourceId:
              resA.availabilityByAction.query === 'ALLOWED' && resB.availabilityByAction.query !== 'ALLOWED'
                ? resA.id
                : resB.availabilityByAction.query === 'ALLOWED' && resA.availabilityByAction.query !== 'ALLOWED'
                ? resB.id
                : undefined
          }
        ];

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">资源选型对比</h3>
            <p className="text-[11px] text-[#64748B]">比对候选资源的业务维度与口径差异</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭资源比较"
          className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
          title="关闭工作区"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
        {/* Recommendation & Conclusion */}
        <div className="space-y-1 text-xs text-[#334155] leading-relaxed pb-2 border-b border-[#F1F5F9]">
          <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>比对结论与建议：</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#475569] pl-5">
            {conclusionText}
          </p>
        </div>

        {/* 2 Candidate Cards */}
        <fieldset className="grid grid-cols-2 gap-3" aria-label="选择要加入方案的候选资源">
          <legend className="sr-only">选择要加入方案的候选资源</legend>
          {/* Resource A */}
          <div
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
              selectedId === resA.id
                ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/40'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                {resA.type}
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[#334155] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2563EB] rounded">
                <input
                  type="radio"
                  name="comparison-candidate"
                  aria-label={`选择 ${resA.name}`}
                  checked={selectedId === resA.id}
                  onChange={() => selectCandidate(resA.id)}
                  className="h-4 w-4 accent-[#2563EB]"
                />
                <span>选择</span>
              </label>
            </div>
            <div className="font-bold text-xs text-[#0F172A] break-words">{resA.name}</div>
            <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{resA.desc}</p>
            <div className="pt-1 border-t border-[#F1F5F9] flex justify-between items-center text-[10px] text-[#64748B]">
              <span>权限：{resA.availabilityByAction.query === 'ALLOWED' ? '可直接查询' : '需申请'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFields(resA.id);
                }}
                aria-label={`查看${resA.name}字段`}
                className="text-[#2563EB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                查看字段
              </button>
            </div>
          </div>

          {/* Resource B */}
          <div
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
              selectedId === resB.id
                ? 'border-[#2563EB] bg-[#EFF6FF]/20 ring-1 ring-[#2563EB]/40'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium border border-[#E2E8F0]">
                {resB.type}
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[#334155] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2563EB] rounded">
                <input
                  type="radio"
                  name="comparison-candidate"
                  aria-label={`选择 ${resB.name}`}
                  checked={selectedId === resB.id}
                  onChange={() => selectCandidate(resB.id)}
                  className="h-4 w-4 accent-[#2563EB]"
                />
                <span>选择</span>
              </label>
            </div>
            <div className="font-bold text-xs text-[#0F172A] break-words">{resB.name}</div>
            <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{resB.desc}</p>
            <div className="pt-1 border-t border-[#F1F5F9] flex justify-between items-center text-[10px] text-[#64748B]">
              <span>权限：{resB.availabilityByAction.query === 'ALLOWED' ? '可直接查询' : '需申请'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFields(resB.id);
                }}
                aria-label={`查看${resB.name}字段`}
                className="text-[#2563EB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                查看字段
              </button>
            </div>
          </div>
        </fieldset>

        {/* Detailed Comparison Table */}
        <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto shadow-2xs">
          <table className="min-w-[620px] w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#475569]">
                <th className="py-2.5 px-3 font-semibold w-1/4">比对维度</th>
                <th className="py-2.5 px-3 font-semibold w-[37.5%] truncate">{resA.name}</th>
                <th className="py-2.5 px-3 font-semibold w-[37.5%] truncate">{resB.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-[#475569]">{row.dimension}</td>
                  <td
                    className={`py-2 px-3 text-[11px] leading-relaxed ${
                      row.highlightResourceId === resA.id ? 'text-[#16A34A] font-semibold' : 'text-[#334155]'
                    }`}
                  >
                    {row.values[resA.id]}
                  </td>
                  <td
                    className={`py-2 px-3 text-[11px] leading-relaxed ${
                      row.highlightResourceId === resB.id ? 'text-[#16A34A] font-semibold' : 'text-[#334155]'
                    }`}
                  >
                    {row.values[resB.id]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          aria-label="关闭右侧工作区"
          className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
        >
          取消
        </button>

        <button
          onClick={() => selectedId && onConfirmSelection(selectedId)}
          disabled={!selectedId}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
            selectedId
              ? 'text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-2xs'
              : 'text-[#94A3B8] bg-[#F1F5F9] cursor-not-allowed'
          }`}
        >
          <span>将所选资源加入方案</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
