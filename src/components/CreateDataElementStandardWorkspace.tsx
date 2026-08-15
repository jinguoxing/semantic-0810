import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  Database,
  Search,
  ShieldCheck,
  FolderTree,
  Tag,
  FileText,
  Clock,
  Check,
  ChevronDown,
  X,
  ExternalLink,
  HelpCircle,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface CreateDataElementStandardWorkspaceProps {
  onBackToCatalog: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToDataSemantics?: () => void;
}

export const CreateDataElementStandardWorkspace: React.FC<CreateDataElementStandardWorkspaceProps> = ({
  onBackToCatalog,
  addToast,
  onNavigateToDataSemantics,
}) => {
  // Navigation State
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Form Field States
  const [name, setName] = useState('业务办结时间');
  const [code, setCode] = useState('DE_CASE_CLOSE_TIME');
  const [definition, setDefinition] = useState('业务事项实际完成办理的时间点，用于表达事项业务生命周期中的办结时刻。');
  
  // Business Context
  const [businessTerm, setBusinessTerm] = useState('办结时间');
  const [businessObjectAttr, setBusinessObjectAttr] = useState('工单 · 办结时间');
  const [domain, setDomain] = useState('公共服务');
  const [semanticType, setSemanticType] = useState('事件时间');

  // Standard Requirements
  const [dataType, setDataType] = useState('DATETIME');
  const [formatStr, setFormatStr] = useState('yyyy-MM-dd HH:mm:ss');
  const [allowNull, setAllowNull] = useState('否');
  const [timezone, setTimezone] = useState('Asia/Shanghai');

  // Basis & Governance
  const [sourceType, setSourceType] = useState('企业自主制定');
  const [sourceDescription, setSourceDescription] = useState('用于统一公共服务事项办结时间在不同业务系统中的数据表达。');
  const [standardDoc, setStandardDoc] = useState('《公共服务基础数据元规范》');
  const [ownerGroup, setOwnerGroup] = useState('数据标准管理组');
  const [scope, setScope] = useState('公共服务');
  const [effectiveType, setEffectiveType] = useState('治理确认并发布后生效');

  // UI Interactive States
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedSimilarStandard, setSelectedSimilarStandard] = useState<{
    name: string;
    code: string;
    similarity: string;
    usage: number;
    definition: string;
  } | null>(null);

  // AI Refine Action
  const handleAiRefineDefinition = () => {
    setIsAiEnhancing(true);
    setTimeout(() => {
      setDefinition('业务事项或服务工单实际经由承办部门处理完毕并关单的系统时间节点，属于工单全生命周期的核心时效考核依据。');
      setIsAiEnhancing(false);
      addToast?.('success', 'AI 补充完善成功', '已根据公共服务领域术语规范对业务定义进行语义优化');
    }, 600);
  };

  // Submit Handler
  const handleFinalSubmit = () => {
    setIsReviewModalOpen(false);
    addToast?.('success', '已提交治理确认', `数据元标准提议【${name} (${code})】已成功提交至数据标准管理组`);
    onBackToCatalog();
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-[#F7F9FC] text-[#172033] overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* LEFT SIDEBAR: 二级导航 (~208px)                            */}
      {/* ========================================================= */}
      <aside className="w-[208px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#E6EAF0]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>数据治理</span>
          </div>
        </div>

        <nav className="p-2 space-y-1 text-xs font-medium">
          <button
            onClick={() => {
              setActiveSubNav('connections');
              addToast?.('info', '数据连接', '查看企业异构数据源节点');
            }}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Database className="w-4 h-4" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('probing');
              addToast?.('info', '数据探查', '字段数据分布与探查视图');
            }}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Search className="w-4 h-4" />
            <span>数据探查</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('quality');
              addToast?.('info', '数据质量', '数据质量校验规则与监控指标');
            }}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据质量</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('views');
              addToast?.('info', '逻辑视图', '逻辑建模架构');
            }}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <FolderTree className="w-4 h-4" />
            <span>逻辑视图</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('semantics');
              onNavigateToDataSemantics?.();
            }}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Sparkles className="w-4 h-4" />
            <span>数据语义</span>
          </button>

          {/* Current Selected Menu Item */}
          <button
            onClick={() => setActiveSubNav('standards')}
            className="w-[#192px] px-3 py-2.5 rounded-lg flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-4 border-[#2563EB]"
          >
            <BookOpen className="w-4 h-4" />
            <span>数据标准</span>
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-[#E6EAF0] text-[11px] text-[#94A3B8]">
          <p className="font-semibold text-[#64748B]">Semovix Platform</p>
          <p>数据语义治理平台 V2.6</p>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN LAYOUT CONTAINER (Header + Scrollable Editor + Footer)*/}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER SECTION */}
        <header className="bg-white border-b border-[#E6EAF0] px-8 py-4 shadow-2xs shrink-0">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb + Return Link */}
              <div className="flex items-center space-x-3 text-xs text-[#64748B] mb-1">
                <button
                  onClick={onBackToCatalog}
                  className="font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回标准库</span>
                </button>
                <span>/</span>
                <span>数据标准</span>
                <span>/</span>
                <span>标准库</span>
                <span>/</span>
                <span className="font-semibold text-[#172033]">新建数据元标准</span>
              </div>

              {/* Title & Subtitle */}
              <div className="flex items-baseline space-x-3">
                <h1 className="text-lg font-bold text-[#172033] tracking-tight">
                  新建数据元标准
                </h1>
                <span className="text-xs font-mono text-[#64748B]">
                  Create Data Element Standard
                </span>
              </div>

              <p className="text-xs text-[#64748B] mt-0.5">
                定义企业统一的数据表达规范，AI 将帮助检查重复标准并推荐业务关联。
              </p>
            </div>

            {/* Right Status Badge */}
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#F1F5F9] text-[#64748B] font-bold text-xs rounded-full border border-[#CBD5E1]">
                草稿
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE BODY (Main Editor + AI Panel) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========================================================= */}
          {/* MAIN EDITOR AREA (Cohesive Specification Form Panel)      */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9FC]">
            
            {/* Unified Specification Card Container */}
            <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-2xs divide-y divide-[#E6EAF0]">
              
              {/* --------------------------------------------------------- */}
              {/* BLOCK 01: 标准定义                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>01 · 标准定义</span>
                  </h2>
                  <span className="text-[11px] text-[#64748B]">标 * 为必填项</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 标准名称 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">
                      标准名称 <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] font-semibold"
                      placeholder="请输入标准名称..."
                    />
                  </div>

                  {/* 标准编码 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033]">
                        标准编码
                      </label>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                        系统生成
                      </span>
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E6EAF0] rounded-md font-mono text-[#475569] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* 业务定义 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#172033]">
                      业务定义 <span className="text-[#DC2626]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAiRefineDefinition}
                      disabled={isAiEnhancing}
                      className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2.5 py-1 rounded-md border border-[#BFDBFE] transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{isAiEnhancing ? 'AI 正在分析完善...' : 'AI 完善'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] leading-relaxed"
                    placeholder="说明该数据元代表的具体业务语义与取值含义..."
                  />
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 02: 业务关联                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>02 · 业务关联</span>
                    </h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      关联已有业务语义，不在这里重复维护术语或业务对象。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 业务术语 */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B]">业务术语</span>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE] flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-[#2563EB]" />
                        <span>AI 推荐</span>
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#172033]">{businessTerm}</p>
                    <p className="text-[11px] text-[#64748B]">业务事项完成办理的时间</p>
                  </div>

                  {/* 业务对象属性 */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B]">业务对象属性</span>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE] flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-[#2563EB]" />
                        <span>AI 推荐</span>
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#172033]">{businessObjectAttr}</p>
                    <p className="text-[11px] text-[#64748B]">核心实体：工单</p>
                  </div>

                  {/* 所属业务域 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">所属业务域</label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] cursor-pointer"
                    >
                      <option value="公共服务">公共服务</option>
                      <option value="人口服务">人口服务</option>
                      <option value="公共基础">公共基础</option>
                      <option value="法人服务">法人服务</option>
                    </select>
                  </div>

                  {/* 语义类型 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#64748B]">语义类型</label>
                    <div className="px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs font-medium text-[#475569]">
                      {semanticType}
                    </div>
                  </div>
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 03: 标准要求                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>03 · 标准要求</span>
                    </h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      定义该数据元在数据系统中的标准表达方式。
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#2563EB]" />
                    <span>AI 推荐规范</span>
                  </span>
                </div>

                {/* 2-column Requirement Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">数据类型</span>
                    <p className="font-mono font-bold text-[#172033]">{dataType}</p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">格式规范</span>
                    <p className="font-mono font-bold text-[#172033]">{formatStr}</p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">允许为空</span>
                    <p className="font-bold text-[#172033]">{allowNull}</p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">时区</span>
                    <p className="font-mono font-bold text-[#172033]">{timezone}</p>
                  </div>
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 04: 标准依据                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="pb-1">
                  <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>04 · 标准依据</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">来源类型</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] cursor-pointer"
                    >
                      <option value="企业自主制定">企业自主制定</option>
                      <option value="国家标准 (GB)">国家标准 (GB)</option>
                      <option value="行业标准">行业标准</option>
                      <option value="地方标准">地方标准</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">关联标准文件</label>
                    <div className="px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                      <span>{standardDoc}</span>
                      <button className="text-[11px] font-normal text-[#64748B] hover:text-[#2563EB]">
                        更换文件
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033]">制定说明</label>
                  <input
                    type="text"
                    value={sourceDescription}
                    onChange={(e) => setSourceDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033]"
                    placeholder="补充关于该标准制定的背景或说明..."
                  />
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 05: 治理信息                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="pb-1">
                  <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>05 · 治理信息</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">Owner</span>
                    <p className="font-bold text-[#172033]">{ownerGroup}</p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">适用范围</span>
                    <p className="font-bold text-[#172033]">{scope}</p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                    <span className="text-[#64748B] text-[11px]">生效方式</span>
                    <p className="font-bold text-[#172033]">{effectiveType}</p>
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDEBAR: AI 辅助面板 (Restrained & High-Density)       */}
          {/* ========================================================= */}
          <aside className="w-[360px] bg-white border-l border-[#E6EAF0] flex flex-col overflow-y-auto shrink-0 p-4 space-y-5">
            
            {/* Title */}
            <div className="flex items-center space-x-2 border-b border-[#E6EAF0] pb-2.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-bold text-[#172033]">AI 辅助检查与建议</h2>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 1. 相似标准检查 + 重复风险提示                            */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033]">1. 相似标准检查</span>
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                  发现 2 个相似标准
                </span>
              </div>

              {/* Risk Alert Banner */}
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#D97706]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>存在较高重复风险</span>
                </div>
                <p className="text-[11px] text-[#78350F] leading-normal">
                  当前标准与已存在的 <strong className="font-bold">“事项办结时间”</strong> 定义和业务上下文高度相似。
                </p>
                <div className="pt-0.5 flex items-center space-x-2">
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-2 py-1 text-[11px] font-bold text-[#2563EB] bg-white hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded transition-all cursor-pointer"
                  >
                    查看对比
                  </button>
                  <button
                    onClick={() => {
                      addToast?.('info', '已采纳现有标准', '已切换使用【事项办结时间 DE_FINISH_TIME】');
                      onBackToCatalog();
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-[#D97706] bg-white hover:bg-[#FFFBEB] border border-[#FDE68A] rounded transition-all cursor-pointer"
                  >
                    使用现有标准
                  </button>
                </div>
              </div>

              {/* Similar Items List */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033]">事项办结时间</span>
                    <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.2 rounded border border-[#FECACA]">
                      高度相似
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>47 个字段正在使用</span>
                    <button
                      onClick={() => {
                        setSelectedSimilarStandard({
                          name: '事项办结时间',
                          code: 'DE_FINISH_TIME',
                          similarity: '94.2%',
                          usage: 47,
                          definition: '业务办结事项完成的具体系统记录时间点。'
                        });
                      }}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      查看
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033]">流程关闭时间</span>
                    <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                      部分相似
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>19 个字段正在使用</span>
                    <button
                      onClick={() => {
                        setSelectedSimilarStandard({
                          name: '流程关闭时间',
                          code: 'DE_PROC_CLOSE_TIME',
                          similarity: '71.5%',
                          usage: 19,
                          definition: '工作流引擎状态关单的时间点。'
                        });
                      }}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      查看
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B]">
                建议确认是否可以复用现有标准，避免重复建设。
              </p>
            </div>

            <div className="h-[1px] bg-[#E6EAF0]" />

            {/* --------------------------------------------------------- */}
            {/* 2. AI 推荐                                                */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172033]">2. AI 推荐</span>
              <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-md space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>业务术语：<strong className="font-bold">办结时间</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>业务对象：<strong className="font-bold">工单 · 办结时间</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>语义类型：<strong className="font-bold">事件时间</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>数据类型：<strong className="font-bold">DATETIME</strong></span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#E6EAF0]" />

            {/* --------------------------------------------------------- */}
            {/* 3. 完整性检查                                              */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-[#172033]">3. 完整性检查</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#334155]">标准定义</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#334155]">业务关联</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#334155]">标准要求</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-md">
                  <span className="text-[#D97706] font-bold">标准依据</span>
                  <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#334155]">治理信息</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
              </div>

              <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md text-[11px] text-[#78350F] flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
                <span>建议补充标准来源依据规范号。</span>
              </div>
            </div>

          </aside>

        </div>

        {/* ========================================================= */}
        {/* BOTTOM FIXED ACTION BAR                                   */}
        {/* ========================================================= */}
        <footer className="bg-white border-t border-[#E6EAF0] px-8 py-3.5 shadow-md flex items-center justify-between shrink-0">
          <button
            onClick={onBackToCatalog}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-lg transition-all cursor-pointer"
          >
            取消
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => addToast?.('info', '草稿已保存', '草稿数据已自动保存至个人工作台')}
              className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E6EAF0] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              保存草稿
            </button>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <span>提交治理确认</span>
            </button>
          </div>
        </footer>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: 提交前 Review 轻量确认层                         */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[540px] shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Title */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033]">准备提交治理确认</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Summary */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#F8FAFC] border border-[#E6EAF0] p-3.5 rounded-md space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#172033]">{name}</span>
                  <span className="font-mono text-[#2563EB] font-bold bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {code}
                  </span>
                </div>
                <p className="text-[#475569]">{definition}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md">
                  <span className="text-[#64748B] text-[11px]">数据类型:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{dataType}</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md">
                  <span className="text-[#64748B] text-[11px]">关联术语:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{businessTerm}</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md">
                  <span className="text-[#64748B] text-[11px]">关联业务对象:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{businessObjectAttr}</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md">
                  <span className="text-[#64748B] text-[11px]">适用范围:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{scope}</p>
                </div>
              </div>

              {/* AI Check Result */}
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
                <span className="font-bold text-[#1E40AF]">AI 智能诊断结果：</span>
                <ul className="space-y-0.5 text-[#334155] list-disc list-inside text-[11px]">
                  <li>未发现完全重复标准</li>
                  <li>存在 1 个较相似标准（事项办结时间）</li>
                  <li>标准主体信息表达完整</li>
                  <li>建议补充来源依据规范号</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
              >
                返回修改
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md cursor-pointer shadow-2xs"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: 相似标准对比 Modal                               */}
      {/* ========================================================= */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[720px] shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
              <h3 className="text-sm font-bold text-[#172033]">标准查重与侧边对比</h3>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-[#64748B] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              {/* Draft standard */}
              <div className="p-3.5 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                  当前新建草稿
                </span>
                <h4 className="font-bold text-sm text-[#172033]">{name}</h4>
                <p className="font-mono text-[#2563EB]">{code}</p>
                <p className="text-[#334155] mt-1">{definition}</p>
                <div className="pt-2 border-t border-[#BFDBFE]/60 text-[#64748B] text-[11px]">
                  <span>类型: DATETIME · 业务域: 公共服务</span>
                </div>
              </div>

              {/* Existing standard */}
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-[#D97706] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">
                  已有正式标准
                </span>
                <h4 className="font-bold text-sm text-[#172033]">事项办结时间</h4>
                <p className="font-mono text-[#D97706]">DE_FINISH_TIME</p>
                <p className="text-[#78350F] mt-1">业务办结事项完成的具体系统记录时间点。</p>
                <div className="pt-2 border-t border-[#FDE68A]/60 text-[#78350F] text-[11px]">
                  <span>47 个字段正在使用 · 相似度 94.2%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E6EAF0]">
              <span className="text-xs text-[#64748B]">确认是否可以复用现有标准或继续提交新建</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-md"
                >
                  继续编辑草稿
                </button>
                <button
                  onClick={() => {
                    setIsCompareModalOpen(false);
                    addToast?.('info', '已采纳现有标准', '已放弃草稿，关联现有标准【DE_FINISH_TIME】');
                    onBackToCatalog();
                  }}
                  className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  复用现有标准
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing single similar standard detail */}
      {selectedSimilarStandard && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[480px] shadow-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <h3 className="text-xs font-bold text-[#172033]">相似标准详情</h3>
              <button onClick={() => setSelectedSimilarStandard(null)} className="text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#172033]">{selectedSimilarStandard.name}</span>
                <span className="font-mono text-[#2563EB] font-bold">{selectedSimilarStandard.code}</span>
              </div>

              <p className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-[#334155]">
                {selectedSimilarStandard.definition}
              </p>

              <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                <span>相似度：<strong className="text-[#DC2626]">{selectedSimilarStandard.similarity}</strong></span>
                <span>使用情况：<strong className="text-[#2563EB]">{selectedSimilarStandard.usage} 个字段</strong></span>
              </div>
            </div>

            <div className="pt-2 text-right border-t border-[#E6EAF0]">
              <button
                onClick={() => setSelectedSimilarStandard(null)}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-md"
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
