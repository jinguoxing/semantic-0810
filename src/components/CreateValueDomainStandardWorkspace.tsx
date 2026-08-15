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
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Copy,
  ArrowRight,
  Eye,
  Edit2
} from 'lucide-react';

interface ValueCodeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'EFFECTIVE' | 'DISABLED';
}

interface CreateValueDomainStandardWorkspaceProps {
  onBackToCatalog: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToDataSemantics?: () => void;
}

export const CreateValueDomainStandardWorkspace: React.FC<CreateValueDomainStandardWorkspaceProps> = ({
  onBackToCatalog,
  addToast,
  onNavigateToDataSemantics,
}) => {
  // Navigation State
  const [activeSubNav, setActiveSubNav] = useState<'standards' | 'connections' | 'probing' | 'quality' | 'views' | 'semantics'>('standards');

  // Form Field States
  const [name, setName] = useState('性别代码');
  const [code, setCode] = useState('GENDER_CODE');
  const [definition, setDefinition] = useState('用于统一表示自然人的性别分类代码。');

  // Value Codes (Table Items)
  const [valueCodes, setValueCodes] = useState<ValueCodeItem[]>([
    { id: '1', code: '01', name: '男', description: '男性', status: 'EFFECTIVE' },
    { id: '2', code: '02', name: '女', description: '女性', status: 'EFFECTIVE' },
    { id: '3', code: '09', name: '未说明', description: '未声明或无法确认性别', status: 'EFFECTIVE' },
  ]);

  // Business Context
  const [businessTerm, setBusinessTerm] = useState('性别');
  const [businessObjectAttr, setBusinessObjectAttr] = useState('自然人 · 性别');
  const [domain, setDomain] = useState('人口服务');
  const [relatedDataElements, setRelatedDataElements] = useState<string[]>(['性别代码 (DE_PERSON_GENDER_CODE)']);

  // Standard Basis & Governance
  const [sourceType, setSourceType] = useState('国家标准');
  const [standardNo, setStandardNo] = useState('GB/T XXXXX—2026');
  const [standardFile, setStandardFile] = useState('《人口基础信息分类与代码》');
  const [originalLocation, setOriginalLocation] = useState('第 4.2 条 · P38');
  const [sourceNote, setSourceNote] = useState('用于统一人口业务系统中的性别分类编码。');
  const [ownerGroup, setOwnerGroup] = useState('数据标准管理组');
  const [scope, setScope] = useState('人口服务');
  const [effectiveType, setEffectiveType] = useState('治理确认并发布后生效');

  // Interactive UI Modals & Panels
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [isBatchPasteModalOpen, setIsBatchPasteModalOpen] = useState(false);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSpecFileModalOpen, setIsSpecFileModalOpen] = useState(false);
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [aiPasteMessage, setAiPasteMessage] = useState<string | null>(null);

  // Add new blank row
  const handleAddValueCode = () => {
    const newId = Date.now().toString();
    setValueCodes((prev) => [
      ...prev,
      { id: newId, code: `0${prev.length + 1}`, name: '', description: '', status: 'EFFECTIVE' },
    ]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (valueCodes.length <= 1) {
      addToast?.('error', '删除失败', '码表标准至少保留一个有效码值');
      return;
    }
    setValueCodes((prev) => prev.filter((item) => item.id !== id));
  };

  // Update row fields
  const handleUpdateRow = (id: string, field: keyof ValueCodeItem, value: string) => {
    setValueCodes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // AI Refine Definition
  const handleAiRefineDefinition = () => {
    setIsAiEnhancing(true);
    setTimeout(() => {
      setDefinition('用于统一表示自然人的性别分类规范代码，包含男、女及未说明等国家标准合规取值。');
      setIsAiEnhancing(false);
      addToast?.('success', 'AI 补充完善成功', '已根据《人口基础信息分类与代码》对业务定义进行语义标准化');
    }, 600);
  };

  // Handle Batch Paste Parse
  const handleExecuteBatchPaste = () => {
    if (!batchPasteText.trim()) return;
    const lines = batchPasteText.trim().split('\n');
    const parsed: ValueCodeItem[] = lines.map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      const c = parts[0] || `0${idx + 1}`;
      const n = parts[1] || `码值 ${idx + 1}`;
      const d = parts.slice(2).join(' ') || `${n}描述`;
      return {
        id: `paste-${Date.now()}-${idx}`,
        code: c,
        name: n,
        description: d,
        status: 'EFFECTIVE',
      };
    });

    setValueCodes(parsed);
    setIsBatchPasteModalOpen(false);
    setBatchPasteText('');
    setAiPasteMessage(`已成功智能识别 ${parsed.length} 个标准码值`);
    addToast?.('success', '批量解析成功', `AI 已自动提取并解析 ${parsed.length} 个码值代码与说明`);
  };

  // Submit Handler
  const handleFinalSubmit = () => {
    setIsReviewModalOpen(false);
    addToast?.('success', '已提交治理确认', `码表/值域标准提议【${name} (${code})】已成功提交至数据标准管理组`);
    onBackToCatalog();
  };

  // Filtered Value Codes
  const filteredCodes = valueCodes.filter(
    (item) =>
      item.code.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(codeSearchQuery.toLowerCase())
  );

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
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Database className="w-4 h-4" />
            <span>数据连接</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('probing');
              addToast?.('info', '数据探查', '字段数据分布与探查视图');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Search className="w-4 h-4" />
            <span>数据探查</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('quality');
              addToast?.('info', '数据质量', '数据质量校验规则与监控指标');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据质量</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('views');
              addToast?.('info', '逻辑视图', '逻辑建模架构');
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <FolderTree className="w-4 h-4" />
            <span>逻辑视图</span>
          </button>

          <button
            onClick={() => {
              setActiveSubNav('semantics');
              onNavigateToDataSemantics?.();
            }}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <Sparkles className="w-4 h-4" />
            <span>数据语义</span>
          </button>

          {/* Current Selected Menu Item */}
          <button
            onClick={() => setActiveSubNav('standards')}
            className="w-full px-3 py-2 rounded-md flex items-center space-x-2.5 transition-all text-left cursor-pointer bg-[#EFF6FF] text-[#2563EB] font-bold border-l-2 border-[#2563EB]"
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
        <header className="bg-white border-b border-[#E6EAF0] px-6 py-3.5 shadow-2xs shrink-0">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb + Return Link */}
              <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
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
                <span className="font-semibold text-[#172033]">新建码表 / 值域标准</span>
              </div>

              {/* Title & Subtitle */}
              <div className="flex items-baseline space-x-3">
                <h1 className="text-base font-bold text-[#172033] tracking-tight">
                  新建码表 / 值域标准
                </h1>
                <span className="text-xs font-mono text-[#64748B]">
                  Create Value Domain Standard
                </span>
              </div>

              <p className="text-xs text-[#64748B] mt-0.5">
                定义企业统一的标准代码和值域，AI 将帮助检查重复并关联已有业务语义。
              </p>
            </div>

            {/* Right Status Badge */}
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-[#F1F5F9] text-[#64748B] font-bold text-xs rounded-full border border-[#CBD5E1]">
                草稿
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE BODY (Left Main Editor + Right AI Panel) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========================================================= */}
          {/* MAIN EDITOR AREA                                          */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9FC]">
            
            {/* Integrated Main Panel */}
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
                      placeholder="请输入码表名称..."
                    />
                  </div>

                  {/* 标准编码 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033]">
                        标准编码
                      </label>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
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

                {/* 标准定义 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#172033]">
                      标准定义 <span className="text-[#DC2626]">*</span>
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
                    placeholder="请输入对该码表 / 值域允许使用的表达范围及含义定义..."
                  />
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 02: 标准码值 (页面绝对主体 P0)                       */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
                  <div>
                    <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>02 · 标准码值</span>
                    </h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      定义该值域允许使用的标准代码及含义。
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddValueCode}
                      className="px-3 py-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-md transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加码值</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsBatchPasteModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-[#172033] bg-white hover:bg-[#F8FAFC] border border-[#E6EAF0] rounded-md transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>批量粘贴</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-[#172033] bg-white hover:bg-[#F8FAFC] border border-[#E6EAF0] rounded-md transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
                      <span>从 Excel / CSV 导入</span>
                    </button>
                  </div>
                </div>

                {/* AI Recognition Feedback Badge */}
                {aiPasteMessage && (
                  <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-xs text-[#1E40AF] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-bold">{aiPasteMessage}</span>
                    </div>
                    <button onClick={() => setAiPasteMessage(null)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Filter & Table Search Row */}
                <div className="flex items-center justify-between">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={codeSearchQuery}
                      onChange={(e) => setCodeSearchQuery(e.target.value)}
                      placeholder="搜索代码、名称或说明..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#64748B]">
                    共 <strong className="text-[#2563EB]">{valueCodes.length}</strong> 个有效码值
                  </span>
                </div>

                {/* Compact Editable Table */}
                <div className="border border-[#E6EAF0] rounded-md overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#64748B] font-bold">
                        <th className="py-2.5 px-3.5 w-28">代码 (Code)</th>
                        <th className="py-2.5 px-3.5 w-36">名称 (Name)</th>
                        <th className="py-2.5 px-3.5">说明 (Description)</th>
                        <th className="py-2.5 px-3.5 w-24">状态</th>
                        <th className="py-2.5 px-3.5 w-20 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EAF0]">
                      {filteredCodes.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors group">
                          {/* Code */}
                          <td className="py-2 px-3.5">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) => handleUpdateRow(item.id, 'code', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-[#E6EAF0] rounded-md font-mono font-bold text-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            />
                          </td>

                          {/* Name */}
                          <td className="py-2 px-3.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateRow(item.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-[#E6EAF0] rounded-md font-bold text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            />
                          </td>

                          {/* Description */}
                          <td className="py-2 px-3.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateRow(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-[#E6EAF0] rounded-md text-[#475569] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            />
                          </td>

                          {/* Status */}
                          <td className="py-2 px-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                              有效
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item.id)}
                              className="p-1 text-[#94A3B8] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                              title="删除码值"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Summary */}
                <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5">
                  <span>提示：双击单元格或可直接在线修改代码含义，变更将于提交审核后生效。</span>
                  <span className="font-bold text-[#172033]">{valueCodes.length} 个有效码值</span>
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 03: 业务关联                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="pb-1">
                  <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>03 · 业务关联</span>
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    关联已有业务语义，不在这里重复维护术语或业务对象。
                  </p>
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
                    <p className="text-[11px] text-[#64748B]">自然人的性别分类</p>
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
                    <p className="text-[11px] text-[#64748B]">核心实体：自然人</p>
                  </div>

                  {/* 所属业务域 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">所属业务域</label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] cursor-pointer"
                    >
                      <option value="人口服务">人口服务</option>
                      <option value="公共服务">公共服务</option>
                      <option value="公共基础">公共基础</option>
                      <option value="法人服务">法人服务</option>
                    </select>
                  </div>

                  {/* 关联数据元标准 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033]">关联数据元标准</label>
                      <span className="text-[11px] text-[#64748B]">建立集合引用关系</span>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                      {relatedDataElements.map((de, i) => (
                        <div key={i} className="text-xs font-semibold text-[#2563EB] flex items-center space-x-1">
                          <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{de}</span>
                        </div>
                      ))}
                      <p className="text-[10px] text-[#64748B] pt-0.5">
                        当前值域将作为这些数据元的标准允许值集合。
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* --------------------------------------------------------- */}
              {/* BLOCK 04: 标准依据                                         */}
              {/* --------------------------------------------------------- */}
              <section className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-xs font-bold text-[#172033] flex items-center space-x-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>04 · 标准依据</span>
                  </h2>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#2563EB]" />
                    <span>AI 标准文件自动识别</span>
                  </span>
                </div>

                {/* AI Auto-extract Banner */}
                <div className="p-3 bg-[#EFF6FF]/70 border border-[#BFDBFE] rounded-md text-xs text-[#1E40AF] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>
                      以下内容由 AI 根据 <strong className="font-bold">《人口基础信息分类与代码》第 4.2 条</strong> 提取，请确认。
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSpecFileModalOpen(true)}
                    className="font-bold text-[#2563EB] hover:underline flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <span>查看原文位置</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 来源类型 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">来源类型</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033] cursor-pointer"
                    >
                      <option value="国家标准">国家标准</option>
                      <option value="企业自主制定">企业自主制定</option>
                      <option value="行业标准">行业标准</option>
                      <option value="地方标准">地方标准</option>
                    </select>
                  </div>

                  {/* 标准号 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">标准号</label>
                    <input
                      type="text"
                      value={standardNo}
                      onChange={(e) => setStandardNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033]"
                    />
                  </div>

                  {/* 标准文件 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">标准文件</label>
                    <div className="px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                      <span>{standardFile}</span>
                      <button className="text-[11px] font-normal text-[#64748B] hover:text-[#2563EB] cursor-pointer">
                        更换文件
                      </button>
                    </div>
                  </div>

                  {/* 原文位置 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033]">原文位置</label>
                    <div className="px-3 py-2 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md text-xs font-mono text-[#172033] flex items-center justify-between">
                      <span>{originalLocation}</span>
                      <button
                        onClick={() => setIsSpecFileModalOpen(true)}
                        className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>查看原文 →</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 制定说明 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033]">制定说明</label>
                  <input
                    type="text"
                    value={sourceNote}
                    onChange={(e) => setSourceNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#172033]"
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
          {/* RIGHT SIDEBAR: AI 辅助面板 (~360px Width)                 */}
          {/* ========================================================= */}
          <aside className="w-[360px] bg-white border-l border-[#E6EAF0] flex flex-col overflow-y-auto shrink-0 p-4 space-y-4">
            
            {/* Title */}
            <div className="flex items-center space-x-2 border-b border-[#E6EAF0] pb-2.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-bold text-[#172033]">AI 辅助</h2>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 模块 1 · 相似码表检查 + 与“人员性别代码 V2”比较              */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033]">1. 相似码表检查</span>
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                  发现 2 个相关值域
                </span>
              </div>

              {/* Risk Alert Box */}
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#D97706]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>存在较高重复风险</span>
                </div>
                <p className="text-[11px] text-[#78350F] leading-normal">
                  当前码表与已存在的 <strong className="font-bold">“人员性别代码 V2”</strong> 码值内容完全一致。
                </p>
                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#2563EB] bg-white hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-md transition-all cursor-pointer"
                  >
                    查看差异
                  </button>
                  <button
                    onClick={() => {
                      addToast?.('info', '已采纳现有值域', '已关联使用【人员性别代码 V2 GENDER_CODE_V2】');
                      onBackToCatalog();
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#D97706] bg-white hover:bg-[#FFFBEB] border border-[#FDE68A] rounded-md transition-all cursor-pointer"
                  >
                    使用现有值域
                  </button>
                </div>
              </div>

              {/* Inline Comparison Diff Box */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] border-b border-[#E6EAF0] pb-1.5">
                  <span>与“人员性别代码 V2”比较</span>
                  <span className="text-[#059669]">100% 重合</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="space-y-1">
                    <p className="font-bold text-[#64748B] font-sans">当前值域</p>
                    <p className="text-[#172033]">01 男</p>
                    <p className="text-[#172033]">02 女</p>
                    <p className="text-[#172033]">09 未说明</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[#64748B] font-sans">已有值域</p>
                    <p className="text-[#059669]">01 男 ✓</p>
                    <p className="text-[#059669]">02 女 ✓</p>
                    <p className="text-[#059669]">09 未说明 ✓</p>
                  </div>
                </div>

                <p className="text-[10px] text-[#64748B] pt-0.5">
                  建议优先复用已有“人员性别代码 V2”，而不是创建新的值域标准。
                </p>
              </div>

              {/* Similar Items List */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033]">人员性别代码 V2</span>
                    <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.2 rounded border border-[#FECACA]">
                      高度相似
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>3 个有效码值 · 82 个字段在使用</span>
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      查看
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033]">性别分类代码</span>
                    <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                      部分相似
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>4 个有效码值 · 12 个字段在使用</span>
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      查看
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#E6EAF0]" />

            {/* --------------------------------------------------------- */}
            {/* 模块 2 · AI 推荐                                          */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172033]">2. AI 推荐</span>
              <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-md space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>业务术语：<strong className="font-bold">性别</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>业务对象：<strong className="font-bold">自然人 · 性别</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>业务域：<strong className="font-bold">人口服务</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-[#1E40AF]">
                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>关联数据元：<strong className="font-bold">性别代码</strong></span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#E6EAF0]" />

            {/* --------------------------------------------------------- */}
            {/* 模块 3 · 码值检查                                         */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172033]">3. 码值检查</span>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">无重复代码</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">所有码值均有名称说明</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">无空代码值</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-md">
                  <span className="text-[#D97706] font-bold">与已有值域高度重复</span>
                  <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#E6EAF0]" />

            {/* --------------------------------------------------------- */}
            {/* 模块 4 · 完整性                                           */}
            {/* --------------------------------------------------------- */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#172033]">4. 完整性检查</span>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">标准定义</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">标准码值</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">业务关联</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">标准依据</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-md">
                  <span className="text-[#334155]">治理信息</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                </div>
              </div>
            </div>

          </aside>

        </div>

        {/* ========================================================= */}
        {/* BOTTOM FIXED ACTION BAR                                   */}
        {/* ========================================================= */}
        <footer className="bg-white border-t border-[#E6EAF0] px-6 py-3 shadow-2xs flex items-center justify-between shrink-0">
          <button
            onClick={onBackToCatalog}
            className="px-3.5 py-1.5 text-xs font-bold text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-all cursor-pointer"
          >
            取消
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => addToast?.('info', '草稿已保存', '码表标准草稿已成功保存')}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E6EAF0] text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs"
            >
              保存草稿
            </button>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <span>提交治理确认</span>
            </button>
          </div>
        </footer>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: 批量粘贴 Modal                                    */}
      {/* ========================================================= */}
      {isBatchPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[520px] shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <Copy className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#172033]">批量粘贴码值代码</h3>
              </div>
              <button onClick={() => setIsBatchPasteModalOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              每行粘贴一条，格式示例：<code className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono text-[#2563EB]">代码 名称 说明</code>。AI 将自动识别结构。
            </p>

            <textarea
              rows={6}
              value={batchPasteText}
              onChange={(e) => setBatchPasteText(e.target.value)}
              placeholder={`01 男 男性\n02 女 女性\n09 未说明 未声明或无法确认性别`}
              className="w-full px-3 py-2 text-xs font-mono bg-[#F8FAFC] border border-[#E6EAF0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#E6EAF0]">
              <span className="text-[11px] text-[#94A3B8]">AI 将按空格或制表符智能切分属性</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsBatchPasteModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleExecuteBatchPaste}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md shadow-2xs cursor-pointer"
                >
                  解析并导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Excel / CSV 导入 Modal                            */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[480px] shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-[#059669]" />
                <h3 className="text-xs font-bold text-[#172033]">从 Excel / CSV 导入码值</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-[#64748B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-2 border-dashed border-[#CBD5E1] rounded-md bg-[#F8FAFC] flex flex-col items-center justify-center space-y-2 cursor-pointer hover:border-[#2563EB] transition-colors">
              <Upload className="w-7 h-7 text-[#2563EB]" />
              <div className="text-center space-y-0.5">
                <p className="text-xs font-bold text-[#172033]">点击或拖拽 Excel/CSV 文件至此处</p>
                <p className="text-[11px] text-[#64748B]">支持 .xlsx, .xls, .csv 模板格式</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E6EAF0]">
              <button className="text-[#2563EB] hover:underline font-bold cursor-pointer">下载标准码表模板.xlsx</button>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  addToast?.('success', '导入成功', '已根据标准 CSV 文件成功装载码值数据');
                }}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white font-bold rounded-md cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: 码值 Diff 对比 Modal                             */}
      {/* ========================================================= */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[720px] shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <h3 className="text-xs font-bold text-[#172033]">与已有“人员性别代码 V2”完全比对</h3>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              {/* Draft */}
              <div className="p-3.5 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-md space-y-2.5">
                <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                  当前新建草稿 ({name})
                </span>
                <p className="font-mono text-[#2563EB] font-bold">{code}</p>
                <div className="space-y-1 font-mono text-[11px]">
                  {valueCodes.map((c) => (
                    <div key={c.id} className="p-1.5 bg-white rounded-md border border-[#E6EAF0] flex justify-between">
                      <span className="font-bold">{c.code} {c.name}</span>
                      <span className="text-[#64748B]">{c.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Existing */}
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-2.5">
                <span className="text-[10px] font-bold text-[#D97706] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">
                  已有企业标准 (人员性别代码 V2)
                </span>
                <p className="font-mono text-[#D97706] font-bold">GENDER_CODE_V2</p>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-1.5 bg-white rounded-md border border-[#FDE68A] flex justify-between">
                    <span className="font-bold text-[#059669]">01 男 ✓</span>
                    <span className="text-[#64748B]">男性</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-md border border-[#FDE68A] flex justify-between">
                    <span className="font-bold text-[#059669]">02 女 ✓</span>
                    <span className="text-[#64748B]">女性</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-md border border-[#FDE68A] flex justify-between">
                    <span className="font-bold text-[#059669]">09 未说明 ✓</span>
                    <span className="text-[#64748B]">未声明或无法确认性别</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#78350F] bg-[#FFFBEB] p-3 rounded-md border border-[#FDE68A]">
              诊断提示：两个值域代码集 100% 相同。强烈建议使用企业现有正式标准，避免重复发布造成系统元数据冗余。
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
              >
                仍需新建 (忽略提醒)
              </button>
              <button
                onClick={() => {
                  setIsCompareModalOpen(false);
                  addToast?.('info', '已采纳现有值域', '已放弃草稿，关联现有标准【GENDER_CODE_V2】');
                  onBackToCatalog();
                }}
                className="px-4 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-md cursor-pointer shadow-2xs"
              >
                使用现有值域
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: 提交前 Review 轻量确认层                         */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[540px] shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Title */}
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#172033]">准备提交治理确认</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
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
                <div className="pt-2 border-t border-[#E6EAF0] flex items-center justify-between text-[#64748B]">
                  <span>有效码值: <strong className="text-[#172033]">{valueCodes.length} 个</strong></span>
                  <span>来源: <strong className="text-[#172033]">{standardNo}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#64748B]">关联术语:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{businessTerm}</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#64748B]">关联业务对象:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{businessObjectAttr}</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#64748B]">关联数据元:</span>
                  <p className="font-bold text-[#2563EB] mt-0.5">性别代码 (DE_PERSON_GENDER_CODE)</p>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-md border border-[#E6EAF0]">
                  <span className="text-[#64748B]">适用范围:</span>
                  <p className="font-bold text-[#172033] mt-0.5">{scope}</p>
                </div>
              </div>

              {/* AI Check Result High Risk Warning */}
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1 text-[#78350F]">
                <div className="flex items-center space-x-1.5 font-bold text-[#D97706]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>AI 检查结果：存在高重复风险</span>
                </div>
                <p className="text-[11px] leading-normal">
                  已有 <strong className="font-bold">人员性别代码 V2</strong> 码值内容完全一致（01男、02女、09未说明）。建议优先复用已有企业标准。
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#E6EAF0]">
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setIsCompareModalOpen(true);
                }}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                ← 返回查看已有标准
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-md cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md cursor-pointer shadow-2xs"
                >
                  补充差异说明并继续提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: 查看标准文件原文 Modal                            */}
      {/* ========================================================= */}
      {isSpecFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6EAF0] rounded-lg w-[580px] shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-2.5">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#172033]">标准文件原文摘录</h3>
              </div>
              <button onClick={() => setIsSpecFileModalOpen(false)} className="text-[#64748B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E6EAF0] rounded-md space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#172033]">
                <span>《GB/T XXXXX—2026 人口基础信息分类与代码》</span>
                <span className="text-[#2563EB] font-mono">第 4.2 条 · P38</span>
              </div>
              <div className="p-2.5 bg-white border border-[#E6EAF0] rounded-md space-y-1.5 text-[#334155] leading-relaxed font-mono text-[11px]">
                <p className="font-sans font-bold text-[#172033]">4.2 自然人性别代码规范</p>
                <p>4.2.1 编码规则：采用 2 位数字代码表达自然人性别基本分类。</p>
                <p>4.2.2 允许码值取值如下：</p>
                <ul className="list-disc list-inside space-y-0.5 pl-2">
                  <li><strong>01</strong> — 男（Male）</li>
                  <li><strong>02</strong> — 女（Female）</li>
                  <li><strong>09</strong> — 未说明（Unspecified）</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 text-right border-t border-[#E6EAF0]">
              <button
                onClick={() => setIsSpecFileModalOpen(false)}
                className="px-3.5 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-md cursor-pointer"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
