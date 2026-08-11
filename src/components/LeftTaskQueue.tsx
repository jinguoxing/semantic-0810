import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, AlertCircle, Database, ArrowUpDown, Filter } from 'lucide-react';
import { FieldItem, FieldStatus } from '../types';

interface LeftTaskQueueProps {
  fields: FieldItem[];
  selectedFieldId: string;
  onSelectField: (id: string) => void;
  onBatchConfirm?: () => void;
}

export const LeftTaskQueue: React.FC<LeftTaskQueueProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onBatchConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'risk' | 'confidence' | 'time'>('risk');

  // Stats
  const stats = useMemo(() => {
    const total = fields.length;
    const understood = fields.filter((f) => f.confidenceScore > 0).length;
    const confirmed = fields.filter((f) => f.status === 'confirmed').length;
    const pending = fields.filter((f) => f.status === 'pending').length;
    const conflict = fields.filter((f) => f.status === 'conflict').length;
    const abnormal = fields.filter((f) => f.status === 'abnormal').length;
    return { total, understood, confirmed, pending, conflict, abnormal };
  }, [fields]);

  // Filtered & Sorted fields
  const filteredFields = useMemo(() => {
    return fields
      .filter((f) => {
        // Tab filter
        if (activeTab === 'pending' && f.status !== 'pending') return false;
        if (activeTab === 'conflict' && f.status !== 'conflict') return false;
        if (activeTab === 'confirmed' && f.status !== 'confirmed') return false;
        if (activeTab === 'abnormal' && f.status !== 'abnormal') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            f.name.toLowerCase().includes(q) ||
            f.dataType.toLowerCase().includes(q) ||
            f.currentSemantic.toLowerCase().includes(q) ||
            f.businessName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') {
          const order: Record<FieldStatus, number> = {
            conflict: 0,
            pending: 1,
            abnormal: 2,
            confirmed: 3,
          };
          return order[a.status] - order[b.status];
        }
        if (sortBy === 'confidence') {
          return a.confidenceScore - b.confidenceScore;
        }
        if (sortBy === 'time') {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
        return 0;
      });
  }, [fields, activeTab, searchQuery, sortBy]);

  const renderStatusBadge = (status: FieldStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            <span>已确认</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFFBEB] text-[#D97706] border border-[#D97706]/20 shrink-0">
            <Clock className="w-3 h-3 text-[#D97706]" />
            <span>待确认</span>
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFF1F2] text-[#BE123C] border border-[#BE123C]/20 shrink-0">
            <AlertTriangle className="w-3 h-3 text-[#BE123C]" />
            <span>冲突</span>
          </span>
        );
      case 'abnormal':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] shrink-0">
            <AlertCircle className="w-3 h-3 text-[#64748B]" />
            <span>异常</span>
          </span>
        );
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="w-full lg:w-[320px] bg-white border-r border-[#E2E8F0] flex flex-col h-full shrink-0 select-none">
      {/* Header & Controls Container */}
      <div className="p-3 border-b border-[#E2E8F0] space-y-2.5 bg-[#F8FAFC]">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-xs font-bold text-[#1E293B] tracking-tight">字段理解队列</h2>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] rounded border border-[#4F46E5]/20">
              {stats.total} 字段
            </span>
            {onBatchConfirm && (
              <button
                onClick={onBatchConfirm}
                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded transition-colors flex items-center space-x-1 shadow-2xs shrink-0 cursor-pointer"
                title="高置信度字段一键批量确认"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
                <span>批量确认</span>
              </button>
            )}
          </div>
        </div>

        {/* Total Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-1 text-center bg-white p-1.5 rounded-md border border-[#E2E8F0] shadow-2xs">
          <div>
            <div className="text-[9px] text-[#64748B]">总数 / 已理解</div>
            <div className="text-xs font-mono font-bold text-[#1E293B]">
              {stats.total} / {stats.understood}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[#059669]">已确认</div>
            <div className="text-xs font-mono font-bold text-[#059669]">{stats.confirmed}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#D97706]">待确认 / 冲突</div>
            <div className="text-xs font-mono font-bold text-[#BE123C]">
              {stats.pending} / {stats.conflict}
            </div>
          </div>
        </div>

        {/* Row 2: Search Input + Sort Dropdown */}
        <div className="flex items-center space-x-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="搜索字段…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#1E293B] placeholder-[#94A3B8]"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none text-xs bg-white border border-[#E2E8F0] rounded-md pl-2 pr-5 py-1.5 text-[#475569] font-medium focus:outline-none focus:ring-1 focus:ring-[#4F46E5] cursor-pointer"
            >
              <option value="risk">风险优先</option>
              <option value="confidence">低置信度</option>
              <option value="time">最新变更</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#94A3B8] absolute right-1.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Row 3: Filter Tabs */}
        <div className="flex items-center justify-between text-[11px] gap-1 overflow-x-auto scrollbar-none pt-0.5">
          <button
            onClick={() => setActiveTab('priority')}
            className={`px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
              activeTab === 'priority'
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#4F46E5]/20'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            优先处理
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-[#FFFBEB] text-[#D97706] font-bold border border-[#D97706]/20'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            待确认 ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('conflict')}
            className={`px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
              activeTab === 'conflict'
                ? 'bg-[#FFF1F2] text-[#BE123C] font-bold border border-[#BE123C]/20'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            冲突 ({stats.conflict})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
              activeTab === 'confirmed'
                ? 'bg-[#ECFDF5] text-[#059669] font-bold border border-[#059669]/20'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            已确认
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#F1F5F9] text-[#1E293B] font-bold border border-[#E2E8F0]'
                : 'text-[#64748B] hover:bg-[#F1F5F9]'
            }`}
          >
            全部
          </button>
        </div>
      </div>

      {/* Field List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
        {filteredFields.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#94A3B8] space-y-1">
            <p>未找到符合条件的字段</p>
          </div>
        ) : (
          filteredFields.map((field) => {
            const isSelected = field.id === selectedFieldId;

            return (
              <div
                key={field.id}
                onClick={() => onSelectField(field.id)}
                className={`p-2.5 transition-all duration-150 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[#EEF2FF] border-l-4 border-l-[#4F46E5] pl-2'
                    : 'hover:bg-[#F8FAFC] border-l-4 border-l-transparent'
                }`}
              >
                {/* Field Top Row: Physical Name + Status Badge */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`font-mono text-xs font-bold truncate ${
                      isSelected ? 'text-[#312E81]' : 'text-[#1E293B]'
                    }`}
                  >
                    {field.name}
                  </span>
                  {renderStatusBadge(field.status)}
                </div>

                {/* Field Middle Row: Semantic & Business Name */}
                <div className="flex items-center justify-between text-xs text-[#475569] mb-1">
                  <div className="flex items-center space-x-1 truncate">
                    <span className="text-[#94A3B8] text-[11px]">语义:</span>
                    <span className="font-semibold text-[#1E293B] truncate">
                      {field.currentSemantic}
                    </span>
                    {field.businessName && (
                      <>
                        <span className="text-[#CBD5E1]">/</span>
                        <span className="text-[#64748B] truncate text-[11px]">{field.businessName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Field Bottom Row: Data Type + AI Confidence */}
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="font-mono px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded border border-[#E2E8F0] font-medium">
                    {field.dataType}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span>置信度:</span>
                    <span
                      className={`font-mono font-bold ${
                        field.confidenceScore >= 80
                          ? 'text-[#059669]'
                          : field.confidenceScore >= 65
                          ? 'text-[#D97706]'
                          : 'text-[#BE123C]'
                      }`}
                    >
                      {field.confidenceScore}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Progress Footer */}
      <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1">
        <div className="flex items-center justify-between font-mono font-semibold text-[#1E293B]">
          <span>治理进度:</span>
          <span className="text-[#059669] font-bold">
            {stats.confirmed} / {stats.total} 已确认
          </span>
        </div>
        <div className="w-full h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#059669] transition-all duration-300"
            style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B] truncate pt-0.5">
          <div className="flex items-center space-x-1 truncate">
            <span className="text-[#94A3B8]">当前:</span>
            <span className="font-mono font-bold text-[#4F46E5] truncate">
              {selectedField ? selectedField.name : 'close_time'}
            </span>
          </div>
          {onBatchConfirm && (
            <button
              onClick={onBatchConfirm}
              className="text-[#4F46E5] hover:underline font-semibold text-[11px] shrink-0 ml-1 cursor-pointer"
            >
              一键批量确认 &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


