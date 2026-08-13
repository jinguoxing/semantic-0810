import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
  BookOpen,
  Tag,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  ChevronRight,
  X,
  ExternalLink,
  Info,
  Database,
  ArrowUpRight,
  Filter,
  Eye,
  History,
  GitCommit,
  Check
} from 'lucide-react';

interface DataSemanticsDetailViewProps {
  onStartCorrection?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DataSemanticsDetailView: React.FC<DataSemanticsDetailViewProps> = ({
  onStartCorrection,
  addToast,
}) => {
  // Drawer & Modal States
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [showValueSemanticsModal, setShowValueSemanticsModal] = useState(false);
  const [selectedFieldDetail, setSelectedFieldDetail] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Field Filter & Search States
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldCategoryFilter, setFieldCategoryFilter] = useState<'all' | 'semantic' | 'tech'>('all');

  // Fields Table Data
  const fields = [
    {
      techName: 'ticket_id',
      businessName: '工单编号',
      semanticKey: '服务工单主体标识',
      standardTerm: '工单编号',
      techInfo: 'VARCHAR(64)',
      type: 'semantic',
      isPrimary: true,
      desc: '热线服务工单的唯一业务识别标识',
    },
    {
      techName: 'status',
      businessName: '处理状态',
      semanticKey: '值语义 · 工单状态代码集',
      standardTerm: '工单状态',
      techInfo: 'VARCHAR(16)',
      type: 'semantic',
      hasValueSemantics: true,
      valueCount: 5,
      values: [
        { code: '01', name: '待受理', desc: '工单已提交，等待派单或认领' },
        { code: '02', name: '已受理', desc: '承办部门已签收并分配处置人' },
        { code: '03', name: '处理中', desc: '承办人员正在核实或现场办理' },
        { code: '04', name: '已办结', desc: '诉求已回复办结并上传反馈' },
        { code: '05', name: '已关闭', desc: '非有效诉求或逾期终结归档' },
      ],
      desc: '工单在流转生命周期中的当前业务处理阶段',
    },
    {
      techName: 'created_time',
      businessName: '创建时间',
      semanticKey: '工单创建',
      standardTerm: '—',
      techInfo: 'DATETIME',
      type: 'semantic',
      isTimestamp: true,
      desc: '诉求人首次发起呼叫或系统生成工单的时间',
    },
    {
      techName: 'accept_time',
      businessName: '受理时间',
      semanticKey: '工单受理',
      standardTerm: '—',
      techInfo: 'DATETIME',
      type: 'semantic',
      isTimestamp: true,
      desc: '承办单位正式接单并开始处置的时间戳',
    },
    {
      techName: 'close_time',
      businessName: '办结时间',
      semanticKey: '工单办结',
      standardTerm: '办结时间',
      techInfo: 'DATETIME',
      type: 'semantic',
      isTimestamp: true,
      desc: '工单办结回复送达诉求人的终结时间',
    },
    {
      techName: 'person_id',
      businessName: '申请人标识',
      semanticKey: '关联自然人',
      standardTerm: '自然人标识',
      techInfo: 'VARCHAR(64)',
      type: 'semantic',
      desc: '发起热线诉求的群众主体唯一身份编码',
    },
    {
      techName: 'completion_rate',
      businessName: '办结率',
      semanticKey: '百分比 · Ratio 0–1',
      standardTerm: '办结率',
      techInfo: 'DECIMAL(5,4)',
      type: 'semantic',
      hoverTooltip: '0.95 = 95%',
      desc: '当月按时办结工单占总受理数的考核比例',
    },
    {
      techName: 'etl_batch_id',
      businessName: '技术字段',
      semanticKey: 'Technical Only',
      standardTerm: '—',
      techInfo: 'VARCHAR(64)',
      type: 'tech',
      isTechField: true,
      desc: '数仓 ETL 批次调度系统自动生成的作业流水号',
    },
    {
      techName: 'ext_flag_3',
      businessName: '尚未明确',
      semanticKey: '未解析',
      standardTerm: '—',
      techInfo: 'VARCHAR(32)',
      type: 'tech',
      isUnresolved: true,
      desc: '业务系统预留扩展字段，当前未定义业务语义',
    },
  ];

  // Filtered fields
  const filteredFields = fields.filter((f) => {
    const matchesSearch =
      f.techName.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.businessName.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.semanticKey.toLowerCase().includes(fieldSearch.toLowerCase());

    if (fieldCategoryFilter === 'semantic') {
      return matchesSearch && f.type === 'semantic';
    }
    if (fieldCategoryFilter === 'tech') {
      return matchesSearch && f.type === 'tech';
    }
    return matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#F8FAFC] text-[#172033] flex flex-col overflow-y-auto">
      
      {/* ========================================================= */}
      {/* 状态区 (Data Semantics Status Bar)                        */}
      {/* ========================================================= */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-3.5 shadow-2xs flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-[#172033]">数据语义</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>核心语义已确认</span>
            </span>
          </div>
          <span className="text-xs text-[#64748B]">
            当前有效语义最近确认于 <strong className="font-mono text-[#334155]">2026-08-12 17:16</strong>
          </span>
        </div>

        {/* Right Secondary CTA */}
        <button
          onClick={() => {
            if (onStartCorrection) {
              onStartCorrection();
            } else {
              addToast?.('info', '发起修正', '进入数据语义修正工作台');
            }
          }}
          className="px-3.5 py-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>发起修正</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MAIN BODY LAYOUT (72% Main Fact Content + 28% Governance) */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* MAIN CONTENT AREA (~72% Width) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-7 bg-[#F8FAFC]">
          
          {/* SECTION 1: 表级语义 */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                表级语义
              </h2>
              <button
                onClick={() => setShowEvidenceDrawer(true)}
                className="text-xs font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>查看依据</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div className="space-y-1">
                <span className="text-[#64748B] font-medium">业务名称</span>
                <p className="font-bold text-[#172033] text-sm">公共服务热线工单记录表</p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] font-medium">主要记录主体</span>
                <p className="font-bold text-[#172033]">服务工单</p>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <span className="text-[#64748B] font-medium">业务定义</span>
                <p className="text-[#334155] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  记录群众通过公共服务热线产生的服务诉求，以及从受理、处理到办结的业务过程。
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] font-medium">记录粒度</span>
                <p className="font-bold text-[#172033] flex items-center space-x-2">
                  <span>一行代表一张服务工单</span>
                  <span className="text-[11px] font-mono font-normal text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                    支撑字段：ticket_id
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] font-medium">主体标识</span>
                <p className="font-bold text-[#2563EB] font-mono flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>ticket_id · 工单编号</span>
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: 关键时间 */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                关键时间
              </h2>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                    <th className="py-2.5 px-4 w-36">业务时间</th>
                    <th className="py-2.5 px-4 w-48">技术字段</th>
                    <th className="py-2.5 px-4">业务语义</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#172033]">创建时间</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#475569]">created_time</td>
                    <td className="py-2.5 px-4 text-[#334155] font-medium">工单创建</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#172033]">受理时间</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#475569]">accept_time</td>
                    <td className="py-2.5 px-4 text-[#334155] font-medium">工单受理</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#172033]">办结时间</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#475569]">close_time</td>
                    <td className="py-2.5 px-4 text-[#334155] font-medium">工单办结</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: 业务关系 */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                业务关系
              </h2>
            </div>

            <div className="space-y-3">
              {/* Relationship 1 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    服务工单
                  </span>
                  <div className="flex items-center space-x-1 text-[#2563EB]">
                    <span className="h-[1px] w-8 bg-[#2563EB]"></span>
                    <span className="px-2 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[11px] font-bold rounded-full">
                      申请人
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    自然人
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B]">主体关系：诉求发起人与工单映射</span>
              </div>

              {/* Relationship 2 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    服务工单
                  </span>
                  <div className="flex items-center space-x-1 text-[#4F46E5]">
                    <span className="h-[1px] w-8 bg-[#4F46E5]"></span>
                    <span className="px-2 py-0.5 bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-[11px] font-bold rounded-full">
                      承办部门
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    组织机构
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B]">主体关系：工单办理与负责单位映射</span>
              </div>

              {/* Relationship 3 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    服务工单
                  </span>
                  <div className="flex items-center space-x-1 text-[#059669]">
                    <span className="h-[1px] w-8 bg-[#059669]"></span>
                    <span className="px-2 py-0.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-bold rounded-full">
                      所属区域
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#059669]" />
                  </div>
                  <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#172033] shadow-2xs">
                    行政区域
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B]">主体关系：工单事件发生地理辖区</span>
              </div>
            </div>
          </section>

          {/* SECTION 4: 标准与业务关联 */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                标准与业务关联
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* 业务术语 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="text-[#64748B] font-medium">业务术语</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md font-bold text-[#172033]">
                    服务工单
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md font-bold text-[#172033]">
                    工单状态
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-md font-bold text-[#172033]">
                    办结时间
                  </span>
                </div>
              </div>

              {/* 数据标准 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="text-[#64748B] font-medium">数据标准</span>
                <div className="flex flex-col space-y-1.5 pt-1 font-semibold text-[#2563EB]">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>工单编号标准数据元</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>工单状态代码集</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>办结时间标准数据元</span>
                  </span>
                </div>
              </div>

              {/* 关联业务对象 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[#64748B] font-medium">关联业务对象</span>
                  <p className="font-bold text-[#172033] text-sm pt-1">服务工单</p>
                  <p className="text-[11px] text-[#64748B] pt-0.5">
                    当前数据资产是“服务工单”的一个正式 Data Binding。
                  </p>
                </div>
                <button
                  onClick={() => addToast?.('info', '查看业务对象', '即将跳转至【服务工单】业务对象模型中心')}
                  className="font-bold text-[#2563EB] hover:underline flex items-center space-x-0.5 text-xs pt-2 cursor-pointer"
                >
                  <span>查看业务对象 →</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5: 字段语义 */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">
                字段语义 · 36
              </h2>

              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="搜索字段或含义..."
                    className="w-full pl-8 pr-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                {/* Light Filter Buttons */}
                <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setFieldCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                      fieldCategoryFilter === 'all'
                        ? 'bg-white text-[#172033] font-bold shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFieldCategoryFilter('semantic')}
                    className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                      fieldCategoryFilter === 'semantic'
                        ? 'bg-white text-[#2563EB] font-bold shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    有业务语义
                  </button>
                  <button
                    onClick={() => setFieldCategoryFilter('tech')}
                    className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                      fieldCategoryFilter === 'tech'
                        ? 'bg-white text-[#475569] font-bold shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    技术字段
                  </button>
                </div>
              </div>
            </div>

            {/* High-density Enterprise Table */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                    <th className="py-2.5 px-4 w-40">字段</th>
                    <th className="py-2.5 px-4 w-32">业务含义</th>
                    <th className="py-2.5 px-4">关键语义</th>
                    <th className="py-2.5 px-4 w-40">标准 / 术语</th>
                    <th className="py-2.5 px-4 w-32 text-right">技术信息</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredFields.map((field) => (
                    <tr
                      key={field.techName}
                      onClick={() => setSelectedFieldDetail(field)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      {/* 字段 */}
                      <td className="py-2.5 px-4 font-mono font-bold text-[#172033]">
                        {field.techName}
                      </td>

                      {/* 业务含义 */}
                      <td className="py-2.5 px-4 font-bold text-[#172033]">
                        {field.isTechField ? (
                          <span className="text-[#64748B] font-normal">技术字段</span>
                        ) : field.isUnresolved ? (
                          <span className="text-[#64748B] font-normal">尚未明确</span>
                        ) : (
                          field.businessName
                        )}
                      </td>

                      {/* 关键语义 */}
                      <td className="py-2.5 px-4 text-[#334155]">
                        {field.hasValueSemantics ? (
                          <div className="flex items-center space-x-2">
                            <span>{field.semanticKey}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowValueSemanticsModal(true);
                              }}
                              className="text-[#2563EB] font-bold hover:underline text-[11px] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] cursor-pointer"
                            >
                              查看值语义 · {field.valueCount} →
                            </button>
                          </div>
                        ) : field.hoverTooltip ? (
                          <span className="title-tooltip" title={field.hoverTooltip}>
                            {field.semanticKey}
                          </span>
                        ) : field.isTechField ? (
                          <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[11px] rounded font-mono">
                            Technical Only
                          </span>
                        ) : field.isUnresolved ? (
                          <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[11px] rounded font-mono">
                            未解析
                          </span>
                        ) : (
                          field.semanticKey
                        )}
                      </td>

                      {/* 标准 / 术语 */}
                      <td className="py-2.5 px-4 text-[#475569]">
                        {field.standardTerm !== '—' ? (
                          <span className="font-semibold text-[#2563EB]">
                            {field.standardTerm}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* 技术信息 */}
                      <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                        {field.techInfo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR: 语义治理信息 (~28% Width)                   */}
        {/* ========================================================= */}
        <aside className="w-[340px] bg-white border-l border-[#E2E8F0] flex flex-col overflow-y-auto shrink-0 p-5 space-y-6">
          
          {/* Header */}
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="text-sm font-bold text-[#172033]">语义治理信息</h2>
          </div>

          {/* 1. 当前状态 */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#172033]">当前状态</span>
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">当前有效语义</span>
                <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-bold rounded">
                  核心语义已确认
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">最近确认</span>
                <span className="font-mono text-[#172033]">2026-08-12 17:16</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">生效方式</span>
                <span className="font-bold text-[#172033]">AI 理解 + 人工确认</span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#E2E8F0]" />

          {/* 2. 语义来源 */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#172033]">语义来源</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#334155]">企业标准</span>
                <span className="font-bold text-[#2563EB]">3 项</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#334155]">业务术语</span>
                <span className="font-bold text-[#172033]">5 项</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#334155]">人工决策</span>
                <span className="font-bold text-[#172033]">2 项关键决策</span>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <span className="text-[#64748B] text-[11px]">数据证据</span>
                <p className="font-mono text-[#172033] font-medium text-[11px]">
                  Technical Metadata · Data Profile · Relationship
                </p>
              </div>

              <button
                onClick={() => setShowEvidenceDrawer(true)}
                className="w-full pt-1 text-center text-xs font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>查看理解依据 →</span>
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[#E2E8F0]" />

          {/* 3. 语义历史 */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#172033]">语义历史</span>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
                <div className="font-bold text-[#172033]">08-12 17:16</div>
                <div className="text-[#64748B]">确认当前数据语义</div>
              </div>

              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
                <div className="font-bold text-[#172033]">08-12 16:52</div>
                <div className="text-[#64748B]">确认 close_time → 办结时间</div>
              </div>

              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-0.5">
                <div className="font-bold text-[#172033]">08-12 16:40</div>
                <div className="text-[#64748B]">AI 完成初次语义分析</div>
              </div>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full pt-1 text-center text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                查看全部历史 →
              </button>
            </div>
          </div>

        </aside>

      </div>

      {/* ========================================================= */}
      {/* DRAWERS & MODALS                                          */}
      {/* ========================================================= */}

      {/* 1. Evidence Drawer (查看依据) */}
      {showEvidenceDrawer && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col p-6 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <h3 className="text-base font-bold text-[#172033] flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <span>语义理解依据</span>
              </h3>
              <button
                onClick={() => setShowEvidenceDrawer(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E40AF] leading-relaxed">
                当前有效语义由 Semovix 基于以下四重数据证据进行归纳与推理确认，满足 100% 规则覆盖。
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033]">1. 元数据 (Technical Metadata)</span>
                <p className="text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] font-mono">
                  Schema: hotline_db.service.pop_service_hotline<br />
                  Engine: MySQL 8.0 · Row Count: 1,284,392
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033]">2. 数据探查样本 (Data Profiling)</span>
                <p className="text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  `ticket_id` 唯一率 100%，无空值；`status` 枚举频次分布包含 01~05 5种合规代码。
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033]">3. 血缘与引用关系 (Lineage Trace)</span>
                <p className="text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  被 `ticket_daily_summary` 等 7 个下游 View 与 BI 报表直接消费。
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#172033]">4. 国家标准映射 (Standards Alignment)</span>
                <p className="text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  绑定 GB/T《公共服务热线工单代码集》规范。
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowEvidenceDrawer(false)}
                className="w-full py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#172033] font-bold text-xs rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Value Semantics Modal (查看值语义 · 5) */}
      {showValueSemanticsModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-[520px] bg-white rounded-xl shadow-2xl p-6 space-y-4 border border-[#E2E8F0] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  值语义 · 工单状态代码集
                </h3>
                <p className="text-[11px] text-[#64748B]">关联标准：工单状态代码集 (5 个枚举值)</p>
              </div>
              <button
                onClick={() => setShowValueSemanticsModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                    <th className="py-2 px-3 w-20">代码</th>
                    <th className="py-2 px-3 w-28">名称</th>
                    <th className="py-2 px-3">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {fields.find((f) => f.techName === 'status')?.values?.map((v) => (
                    <tr key={v.code} className="hover:bg-[#F8FAFC]">
                      <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">{v.code}</td>
                      <td className="py-2 px-3 font-bold text-[#172033]">{v.name}</td>
                      <td className="py-2 px-3 text-[#64748B]">{v.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowValueSemanticsModal(false)}
                className="px-4 py-1.5 bg-[#2563EB] text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Field Detail Drawer */}
      {selectedFieldDetail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col p-6 space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                  {selectedFieldDetail.techInfo}
                </span>
                <h3 className="text-base font-bold text-[#172033] pt-1">
                  {selectedFieldDetail.techName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <span className="text-[#64748B]">业务名称</span>
                <p className="font-bold text-[#172033]">{selectedFieldDetail.businessName}</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <span className="text-[#64748B]">关键语义</span>
                <p className="font-bold text-[#2563EB]">{selectedFieldDetail.semanticKey}</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <span className="text-[#64748B]">业务说明</span>
                <p className="text-[#334155]">{selectedFieldDetail.desc}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setSelectedFieldDetail(null)}
                className="w-full py-2 bg-[#F1F5F9] text-[#172033] font-bold text-xs rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-[500px] bg-white rounded-xl shadow-2xl p-6 space-y-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <span>语义治理完整历史记录</span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#172033] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[320px] overflow-y-auto">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[#172033]">
                  <span>2026-08-12 17:16</span>
                  <span className="text-[#059669]">正式生效</span>
                </div>
                <p className="text-[#64748B]">由张伟 (数据治理主管) 确认表级与全字段语义，正式发布至数据资产服务超市。</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[#172033]">
                  <span>2026-08-12 16:52</span>
                  <span className="text-[#2563EB]">字段修正</span>
                </div>
                <p className="text-[#64748B]">确认 `close_time` 对应的业务语义为“办结时间”，修正原冲突建议。</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[#172033]">
                  <span>2026-08-12 16:40</span>
                  <span className="text-[#4F46E5]">AI 自动分析</span>
                </div>
                <p className="text-[#64748B]">Xino 合作伙伴注入底层逻辑建模元数据，完成全表 36 字段初次语义提取。</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] text-[#172033] font-bold text-xs rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
