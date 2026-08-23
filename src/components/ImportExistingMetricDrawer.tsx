import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Database,
  Table,
  Layers,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  ChevronRight,
  Clock,
  Sliders,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ExistingMetricCandidate } from '../types';

interface ImportExistingMetricDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMetric?: (candidate: ExistingMetricCandidate) => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const CANDIDATES_DATA: ExistingMetricCandidate[] = [
  {
    id: 'cand_001',
    sourceType: 'BI_REPORT',
    sourceName: '财务营收分析大屏 (FineBI)',
    sourceLocation: 'Dashboard_Revenue_2025 / 组件 #4',
    originalName: '实付有效订单额',
    originalExpression: 'SUM(CASE WHEN order_status IN (2, 3, 4) AND is_refund = 0 THEN pay_amount ELSE 0 END)',
    suggestedName: '有效订单金额',
    suggestedDomain: '交易分析',
    suggestedBusinessObject: '订单',
    suggestedScope: '线上零售业务全渠道有效交易',
    suggestedGrain: '订单',
    suggestedTime: '支付时间 · 日',
    suggestedDefinition: '满足“有效订单”业务规则的订单金额合计，用于衡量一定统计周期内形成的有效订单交易规模。',
    suggestedAggregation: 'SUM',
    suggestedMeasureField: 'pay_amount',
    suggestedFilter: 'order_status IN (2, 3, 4) AND is_refund = 0',
    suggestedTimeField: 'pay_time',
    suggestedTableName: 'dwd_order_pay_detail_di',
    suggestedDataAssetName: '全渠道订单支付明细表',
    suggestedDimensions: ['渠道', '商品分类', '地区', '客户等级'],
    parseStatus: 'COMPLETE',
    supplementNeeds: [],
  },
  {
    id: 'cand_002',
    sourceType: 'DATA_WAREHOUSE',
    sourceName: '数仓主题表 dws_cust_retention_m',
    sourceLocation: 'Hive DB: dw_market.dws_cust_retention_m.rep_rate',
    originalName: 'm_repurchase_rate',
    originalExpression: 'rep_cust_cnt / total_active_cust_cnt',
    suggestedName: '月度客户复购率',
    suggestedDomain: '客户运营',
    suggestedBusinessObject: '客户',
    suggestedScope: '活跃购买客户群体 · 零售电商',
    suggestedGrain: '客户',
    suggestedTime: '统计月份 · 月',
    suggestedDefinition: '统计周期内产生2次及以上有效购买的客户数占全部活跃购买客户数的比例。',
    suggestedAggregation: 'AVG',
    suggestedMeasureField: 'rep_rate',
    suggestedTimeField: 'stat_month',
    suggestedTableName: 'dws_cust_retention_m',
    suggestedDataAssetName: '月度客户留存复购聚合表',
    suggestedDimensions: ['会员等级', '地域', '首购渠道'],
    parseStatus: 'NEEDS_SUPPLEMENT',
    supplementNeeds: ['Scope 业务范围', 'Binding 主键映射'],
  },
  {
    id: 'cand_003',
    sourceType: 'ETL_SCRIPT',
    sourceName: '客服质检离线计算任务 (Airflow)',
    sourceLocation: 'dags/customer_service_daily.py :: calc_finish_rate',
    originalName: 'ticket_done_ratio',
    originalExpression: 'COUNT(CASE WHEN finish_time IS NOT NULL THEN 1 END) / COUNT(1)',
    suggestedName: '工单办结率',
    suggestedDomain: '公共服务',
    suggestedBusinessObject: '服务工单',
    suggestedScope: '12345 承办中心已受理日常政务工单',
    suggestedGrain: '服务工单',
    suggestedTime: '办结时间 · 月',
    suggestedDefinition: '统计周期内已完成办结归档的工单总数占已受理有效工单总数的比率。',
    suggestedAggregation: 'AVG',
    suggestedMeasureField: 'ticket_id',
    suggestedFilter: 'finish_time IS NOT NULL',
    suggestedTimeField: 'finish_time',
    suggestedTableName: 'dwd_gov_service_ticket_df',
    suggestedDataAssetName: '政务热线工单办结明细表',
    suggestedDimensions: ['工单类型', '承办部门', '紧急程度'],
    parseStatus: 'COMPLETE',
    supplementNeeds: [],
  }
];

export const ImportExistingMetricDrawer: React.FC<ImportExistingMetricDrawerProps> = ({
  isOpen,
  onClose,
  onImportMetric,
  addToast,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<ExistingMetricCandidate>(CANDIDATES_DATA[0]);
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [manualSql, setManualSql] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyCandidate = (candidate: ExistingMetricCandidate) => {
    if (onImportMetric) {
      onImportMetric(candidate);
    }
    if (addToast) {
      addToast('success', '指标导入已结构化', `已将「${candidate.originalName}」成功结构化并载入 Semovix V1.2 草稿编辑空间`);
    }
    onClose();
  };

  const handleManualAnalyze = () => {
    if (!manualName.trim()) {
      addToast?.('error', '请填写原指标名称', '原指标或字段名称为必填项');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const generated: ExistingMetricCandidate = {
        id: `cand_${Date.now()}`,
        sourceType: 'DATA_WAREHOUSE',
        sourceName: '手动录入存量口径',
        sourceLocation: 'Custom SQL Input',
        originalName: manualName,
        originalExpression: manualSql || 'SUM(amount)',
        suggestedName: manualName,
        suggestedDomain: '综合分析',
        suggestedBusinessObject: '业务事实',
        suggestedScope: '全域企业数据',
        suggestedGrain: '事实事件',
        suggestedTime: '业务发生时间 · 日',
        suggestedDefinition: `由存量 SQL 逆向解析推导出的业务度量口径：${manualName}。`,
        suggestedAggregation: 'SUM',
        suggestedMeasureField: 'amount',
        suggestedTimeField: 'create_time',
        suggestedTableName: 'dwd_business_fact_di',
        suggestedDataAssetName: '业务事实明细表',
        suggestedDimensions: ['组织架构', '业务类型', '区域'],
        parseStatus: manualSql ? 'COMPLETE' : 'NEEDS_SUPPLEMENT',
        supplementNeeds: manualSql ? [] : ['Binding 数据绑定', 'Time 时间口径'],
      };
      setSelectedCandidate(generated);
      addToast?.('success', '语义逆向解析完成', '已推导业务对象、计算粒度、时间语义与基础数据绑定候选');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
      <aside
        className="w-[620px] bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        aria-label="导入已有指标抽屉"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between bg-white shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-3.5 bg-[#2563EB] rounded-xs" />
              <h2 className="text-sm font-bold text-[#172033]">
                导入已有指标
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                Semovix V1.2
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              将报表/SQL/数仓中的存量指标口径逆向解析并结构化为语义层规范指标
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#98A2B3] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 border-b border-[#EEF2F6] flex space-x-6 text-xs font-semibold shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'scan'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            自动扫描发现的候选 ({CANDIDATES_DATA.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'manual'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            手动粘贴 SQL / 报表口径
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 divide-y divide-[#EEF2F6]">
          {activeTab === 'scan' ? (
            <div className="space-y-4">
              <div className="text-xs text-[#64748B] flex items-center justify-between">
                <span>系统已扫描识别出以下具备明确 SQL / 报表定义的存量指标：</span>
              </div>

              {/* Candidate List */}
              <div className="space-y-2.5">
                {CANDIDATES_DATA.map((c) => {
                  const isSelected = selectedCandidate.id === c.id;
                  const isComplete = c.parseStatus === 'COMPLETE';
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#2563EB] bg-[#F8FAFC] ring-1 ring-[#2563EB]'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0F172A]">{c.originalName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[#CBD5E1] text-[#475569]">
                            {c.sourceType}
                          </span>
                        </div>
                        <div>
                          {isComplete ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                              <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                              <span>解析状态：信息完整</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              <AlertCircle className="w-3 h-3 text-[#D97706]" />
                              <span>需要补充：{c.supplementNeeds?.join(' / ') || 'Scope / Time / Binding'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#64748B] mt-1">
                        来源：{c.sourceName} · {c.sourceLocation}
                      </div>

                      <div className="mt-2 p-2 bg-white rounded border border-[#E2E8F0] font-mono text-[11px] text-[#334155] truncate">
                        {c.originalExpression}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Semantic Analysis Preview of Selected Candidate */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      语义逆向解析预览 (Semovix V1.2)
                    </h3>
                  </div>
                  {selectedCandidate.parseStatus === 'COMPLETE' ? (
                    <span className="text-[11px] text-[#16A36A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                      <span>语义要素已齐备</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#D97706] font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>导入后需在草稿空间补充要素</span>
                    </span>
                  )}
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#64748B]">标准化指标名称：</span>
                      <div className="font-bold text-[#0F172A] mt-0.5">{selectedCandidate.suggestedName}</div>
                    </div>
                    <div>
                      <span className="text-[#64748B]">所属业务域：</span>
                      <div className="font-bold text-[#0F172A] mt-0.5">{selectedCandidate.suggestedDomain}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#64748B]">核心业务对象：</span>
                      <div className="font-bold text-[#0F172A] mt-0.5">{selectedCandidate.suggestedBusinessObject}</div>
                    </div>
                    <div>
                      <span className="text-[#64748B]">计算基础粒度：</span>
                      <div className="font-bold text-[#0F172A] mt-0.5">{selectedCandidate.suggestedGrain}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#64748B]">默认时间语义：</span>
                    <div className="font-bold text-[#0F172A] mt-0.5">{selectedCandidate.suggestedTime}</div>
                  </div>

                  <div>
                    <span className="text-[#64748B]">适用业务范围 (Scope)：</span>
                    <div className="font-medium text-[#334155] mt-0.5">{selectedCandidate.suggestedScope}</div>
                  </div>

                  {selectedCandidate.suggestedTableName && (
                    <div className="pt-2 border-t border-[#EEF2F6] grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#64748B]">推荐绑定物理表：</span>
                        <div className="font-mono text-[11px] text-[#0F172A] mt-0.5">{selectedCandidate.suggestedTableName}</div>
                      </div>
                      <div>
                        <span className="text-[#64748B]">度量字段 / 过滤条件：</span>
                        <div className="font-mono text-[11px] text-[#0F172A] mt-0.5">
                          {selectedCandidate.suggestedMeasureField} {selectedCandidate.suggestedFilter ? `(${selectedCandidate.suggestedFilter})` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">原指标名称 / 业务简称</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="例如：GMV 或 实付有效金额"
                  className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-[#0F172A] focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">SQL 计算表达式 / 聚合公式</label>
                <textarea
                  rows={4}
                  value={manualSql}
                  onChange={(e) => setManualSql(e.target.value)}
                  placeholder="例如：SUM(CASE WHEN status = 2 THEN order_amt ELSE 0 END) FROM dwd_order"
                  className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs font-mono text-[#0F172A] focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing}
                className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#94A3B8] text-white rounded-md text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Xino 正在逆向解析业务语义…' : '执行 AI 逆向解析'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EEF2F6] bg-white flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] rounded-md font-semibold text-xs transition-colors cursor-pointer"
          >
            取消
          </button>

          <button
            onClick={() => handleApplyCandidate(selectedCandidate)}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <span>导入并生成 V1.2 指标草稿</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </div>
  );
};
