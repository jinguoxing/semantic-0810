import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Calendar,
  Clock,
  Play,
  RotateCcw,
  Save,
  ChevronRight,
  ChevronDown,
  Sliders,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  BookOpen,
  User,
  Activity,
  Compass,
  ShoppingBag,
  Network,
  Bot,
  BarChart3,
  ShieldCheck,
  FolderTree,
  Edit3,
  Search,
  CheckCircle,
  HelpCircle,
  Info,
  ArrowLeft,
  Loader2,
  Filter,
  Cpu,
  CornerDownRight
} from 'lucide-react';

interface MetricAuthoringWorkspaceProps {
  onBackToRegistry?: () => void;
  onNavigateToBusinessObject?: () => void;
  onNavigateToDataStandards?: () => void;
  onNavigateToDataSemantics?: () => void;
  onNavigateToDataAssets?: () => void;
  onNavigateToMarketplace?: () => void;
  onNavigateToHome?: () => void;
  addToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MetricAuthoringWorkspace: React.FC<MetricAuthoringWorkspaceProps> = ({
  onBackToRegistry,
  onNavigateToBusinessObject,
  onNavigateToDataStandards,
  onNavigateToDataSemantics,
  onNavigateToDataAssets,
  onNavigateToMarketplace,
  onNavigateToHome,
  addToast,
}) => {
  // Authoring Mode:
  // - 'ai_prompt': Default AI creation entry workspace ("描述我想衡量什么" / AI 辅助创建入口)
  // - 'blank': Blank Create · 初始定义状态 ("从空白开始定义")
  // - 'constructing': In-place AI draft generation animation
  // - 'draft': AI Draft Ready (Full Metric Draft with validation & confirmation lifecycle)
  const [authoringMode, setAuthoringMode] = useState<'ai_prompt' | 'blank' | 'constructing' | 'draft'>('ai_prompt');

  // Blank Create Form States (Initially empty to represent real initial state)
  const [blankMetricName, setBlankMetricName] = useState<string>('');
  const [blankBusinessDefinition, setBlankBusinessDefinition] = useState<string>('');
  const [blankBusinessObject, setBlankBusinessObject] = useState<string>('');
  const [blankBusinessDomain, setBlankBusinessDomain] = useState<string>('');
  const [blankBusinessScenario, setBlankBusinessScenario] = useState<string>('');
  const [blankStatisticalScope, setBlankStatisticalScope] = useState<string>('');

  // Search filter inside Business Object selector
  const [isObjectDropdownOpen, setIsObjectDropdownOpen] = useState<boolean>(false);
  const [objectSearchTerm, setObjectSearchTerm] = useState<string>('');

  // AI Prompt mode natural language text
  const [aiIntentText, setAiIntentText] = useState<string>(
    '创建“老龄化率”，定义为 60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。'
  );

  // Construction sequence progress
  const [constructionStepIndex, setConstructionStepIndex] = useState<number>(0);
  const constructionSteps = [
    '理解业务定义',
    '匹配 Business Object',
    '寻找已有正式 Metric / Rule',
    '构建 Measurement',
    '推断 Grain / Time',
    '推荐 Dimensions',
    '寻找 Data Binding',
    '生成 Metric Draft'
  ];

  // Workspace States for Draft Ready:
  // - 'DRAFT_READY': AI Create · Draft Ready
  // - 'VALIDATING': Running verification
  // - 'VALIDATION_PASSED': Ready for Owner Confirm
  // - 'NEEDS_CONFIRM': Needs business confirmation
  // - 'DECISION_REQUIRED': Conflict resolution required
  const [workspaceState, setWorkspaceState] = useState<
    'DRAFT_READY' | 'VALIDATING' | 'VALIDATION_PASSED' | 'NEEDS_CONFIRM' | 'DECISION_REQUIRED'
  >('DRAFT_READY');

  // Editable Draft Data for the Full Metric Draft
  const [metricName, setMetricName] = useState('老龄化率');
  const [businessDefinition, setBusinessDefinition] = useState(
    '指定统计范围和统计时点下，60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。'
  );
  const [businessObject, setBusinessObject] = useState('自然人');
  const [scopeText, setScopeText] = useState('人口服务 · 人口结构分析 · 有效常住人口 · 上海市');
  const [timeSemanticsText, setTimeSemanticsText] = useState('快照 · 统计日期');
  const [timeGrains, setTimeGrains] = useState<string[]>(['月', '季', '年']);
  const [dimensions, setDimensions] = useState<string[]>(['街镇', '性别', '户籍类型']);
  const [isSaved, setIsSaved] = useState(true);

  // Modals & Drawers in Draft Ready State
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState<null | 'meaning' | 'scope' | 'time_dim'>(null);
  const [isDependencyDrawerOpen, setIsDependencyDrawerOpen] = useState<boolean>(false);
  const [isValidatingModalOpen, setIsValidatingModalOpen] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationSteps, setValidationSteps] = useState<
    Array<{ name: string; status: 'waiting' | 'running' | 'passed' | 'failed' }>
  >([
    { name: '计算依赖拓扑与循环依赖检测', status: 'waiting' },
    { name: '基础粒度对齐 (Grain Alignment)', status: 'waiting' },
    { name: '时间语义一致性 (Temporal Consistency)', status: 'waiting' },
    { name: '可分析维度兼容性校验', status: 'waiting' },
    { name: '底层数据资产物理 Binding 探活', status: 'waiting' },
  ]);

  // Adjust Drawer Temp State
  const [tempDefinition, setTempDefinition] = useState(businessDefinition);
  const [tempScope, setTempScope] = useState(scopeText);
  const [tempDimensions, setTempDimensions] = useState(dimensions.join('、'));

  // Quick fill sample data for fast testing & evaluation
  const handleFillSample = () => {
    setBlankMetricName('老龄化率');
    setBlankBusinessDefinition(
      '60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。'
    );
    setBlankBusinessObject('自然人');
    setBlankBusinessDomain('人口服务');
    setBlankBusinessScenario('人口结构分析');
    setBlankStatisticalScope('有效常住人口');
    if (addToast) {
      addToast('info', '已填入示例数据', '已填入「老龄化率」的基础业务定义与适用范围');
    }
  };

  // Reset blank form
  const handleResetBlank = () => {
    setBlankMetricName('');
    setBlankBusinessDefinition('');
    setBlankBusinessObject('');
    setBlankBusinessDomain('');
    setBlankBusinessScenario('');
    setBlankStatisticalScope('');
  };

  // Trigger AI Assisted Draft Construction
  const handleStartConstructing = () => {
    if (!blankMetricName.trim() || !blankBusinessDefinition.trim()) return;

    setAuthoringMode('constructing');
    setConstructionStepIndex(0);

    // Sync input values to full draft
    setMetricName(blankMetricName);
    setBusinessDefinition(blankBusinessDefinition);
    if (blankBusinessObject) setBusinessObject(blankBusinessObject);
    const calculatedScope = [
      blankBusinessDomain || '人口服务',
      blankBusinessScenario || '人口结构分析',
      blankStatisticalScope || '有效常住人口',
    ].filter(Boolean).join(' · ');
    setScopeText(calculatedScope || '人口服务 · 人口结构分析 · 有效常住人口');

    // Run progressive steps
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < constructionSteps.length) {
        setConstructionStepIndex(currentStep);
      } else {
        clearInterval(interval);
        setAuthoringMode('draft');
        setWorkspaceState('DRAFT_READY');
        if (addToast) {
          addToast('success', '指标草稿构建完成', 'Xino 已基于业务定义成功构建计算关系、时间粒度与数据绑定');
        }
      }
    }, 380);
  };

  // Trigger AI Draft from natural language prompt
  const handleStartConstructingFromPrompt = () => {
    setAuthoringMode('constructing');
    setConstructionStepIndex(0);
    setMetricName('老龄化率');
    setBusinessDefinition('指定统计范围和统计时点下，60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。');
    setBusinessObject('自然人');
    setScopeText('人口服务 · 人口结构分析 · 有效常住人口 · 上海市');

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < constructionSteps.length) {
        setConstructionStepIndex(currentStep);
      } else {
        clearInterval(interval);
        setAuthoringMode('draft');
        setWorkspaceState('DRAFT_READY');
        if (addToast) {
          addToast('success', '指标草稿构建完成', 'Xino 已基于描述成功构建计算关系、时间粒度与数据绑定');
        }
      }
    }, 380);
  };

  // Handler for running validation in Draft mode
  const handleRunValidation = () => {
    setIsValidatingModalOpen(true);
    setValidationProgress(10);
    setValidationSteps([
      { name: '计算依赖拓扑与循环依赖检测', status: 'running' },
      { name: '基础粒度对齐 (Grain Alignment)', status: 'waiting' },
      { name: '时间语义一致性 (Temporal Consistency)', status: 'waiting' },
      { name: '可分析维度兼容性校验', status: 'waiting' },
      { name: '底层数据资产物理 Binding 探活', status: 'waiting' },
    ]);

    setTimeout(() => {
      setValidationProgress(30);
      setValidationSteps((prev) => [
        { ...prev[0], status: 'passed' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3],
        prev[4],
      ]);
    }, 600);

    setTimeout(() => {
      setValidationProgress(55);
      setValidationSteps((prev) => [
        prev[0],
        { ...prev[1], status: 'passed' },
        { ...prev[2], status: 'running' },
        prev[3],
        prev[4],
      ]);
    }, 1200);

    setTimeout(() => {
      setValidationProgress(75);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: 'passed' },
        { ...prev[3], status: 'running' },
        prev[4],
      ]);
    }, 1700);

    setTimeout(() => {
      setValidationProgress(90);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        { ...prev[3], status: 'passed' },
        { ...prev[4], status: 'running' },
      ]);
    }, 2200);

    setTimeout(() => {
      setValidationProgress(100);
      setValidationSteps((prev) => [
        prev[0],
        prev[1],
        prev[2],
        prev[3],
        { ...prev[4], status: 'passed' },
      ]);
      setWorkspaceState('VALIDATION_PASSED');
      if (addToast) {
        addToast('success', '指标系统验证通过', '所有依赖、粒度、时间语义与 Data Binding 均通过安全性证明');
      }
    }, 2800);
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    if (addToast) {
      addToast('success', '草稿已保存', '当前指标草稿已同步至语义版本库');
    }
  };

  const handleConfirmEffective = () => {
    if (addToast) {
      addToast('success', '指标已确认生效', `「${metricName}」已进入正式指标库，可供全域问数与分析消费`);
    }
    if (onBackToRegistry) {
      onBackToRegistry();
    }
  };

  // Readiness status for Blank Create state
  const isMeaningReady = blankMetricName.trim().length > 0 && blankBusinessDefinition.trim().length > 0;
  const isScopeSpecified = Boolean(blankBusinessDomain || blankBusinessScenario || blankStatisticalScope);
  const canStartConstructing = isMeaningReady;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F7F9FC] text-[#172033] font-sans antialiased select-none overflow-hidden">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB                                */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#E6EAF0] px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-2xs">
        <div className="space-y-0.5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-[#667085]">
            <button 
              onClick={onBackToRegistry} 
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              业务语义
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <button 
              onClick={onBackToRegistry} 
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              指标
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#172033] font-semibold">创建指标</span>
          </nav>

          {/* Title & Lightweight Status */}
          <div className="flex items-center space-x-3 pt-0.5">
            <h1 className="text-lg font-bold text-[#172033] tracking-tight">
              {authoringMode === 'draft' ? `创建指标 · ${metricName}` : '创建指标'}
            </h1>
            
            {/* Lightweight Status Badge: 草稿 */}
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              草稿
            </span>

            {authoringMode === 'draft' && workspaceState === 'VALIDATION_PASSED' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#16A36A]" />
                <span>验证通过</span>
              </span>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-xs text-[#667085] leading-normal">
            先定义你已经明确的业务含义，Semovix 将帮助补全计算方式、粒度、时间语义、分析维度与数据实现。
          </p>
        </div>

        {/* Right Actions: 保存草稿 + 已自动保存 */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#D0D5DD] hover:border-[#98A2B3] rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#667085]" />
              <span>保存草稿</span>
            </button>
            <div className="text-[11px] text-[#94A3B8] mt-0.5 font-normal">
              已自动保存
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN BODY: LEFT SIDEBAR + 3-COLUMN WORKSPACE           */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ======================================================= */}
        {/* 2.1 LEFT PLATFORM NAVIGATION SIDEBAR (210px)            */}
        {/* ======================================================= */}
        <aside className="w-[210px] bg-white border-r border-[#E6EAF0] flex flex-col shrink-0 select-none overflow-y-auto">
          <div className="p-3 space-y-6">
            
            {/* Primary Platform Menus */}
            <div className="space-y-0.5">
              <button
                onClick={onNavigateToHome}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#64748B]" />
                <span>首页</span>
              </button>

              <button
                onClick={() => {
                  if (addToast) addToast('info', '数据连接', '已进入多源异构数据源连接与接入管理');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-[#64748B]" />
                <span>数据连接</span>
              </button>

              <button
                onClick={onNavigateToDataAssets}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#64748B]" />
                <span>数据资产</span>
              </button>

              <button
                onClick={onNavigateToDataStandards}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#64748B]" />
                <span>数据标准</span>
              </button>

              <button
                onClick={() => {
                  if (addToast) addToast('info', '数据质量', '已进入全链路数据质量与监控中心');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#64748B]" />
                <span>数据质量</span>
              </button>

              <button
                onClick={onNavigateToDataSemantics}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-[#64748B]" />
                <span>数据语义</span>
              </button>
            </div>

            {/* Business Semantics Group (Active Group) */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase">
                业务语义
              </div>
              
              <button
                onClick={onNavigateToBusinessObject}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#64748B]" />
                <span>业务对象</span>
              </button>

              {/* 指标 · 当前高亮 */}
              <button
                onClick={onBackToRegistry}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] transition-colors cursor-pointer shadow-2xs"
              >
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <span>指标</span>
              </button>
            </div>

            {/* Bottom Group */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-0.5">
              <button
                onClick={onNavigateToMarketplace}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#64748B]" />
                <span>服务超市</span>
              </button>

              <button
                onClick={() => {
                  if (addToast) addToast('info', '知识网络', '已进入知识网络拓扑与实体关系图谱');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Network className="w-4 h-4 text-[#64748B]" />
                <span>知识网络</span>
              </button>

              <button
                onClick={onNavigateToHome}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#64748B]" />
                <span>AI 工作台</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* 2.2 THREE-COLUMN WORKSPACE: BLANK CREATE / DRAFT READY   */}
        {/* ======================================================= */}
        {authoringMode === 'blank' ? (
          /* ===================================================== */
          /* BLANK CREATE WORKSPACE (SEMovix V1.2 Blank Create)   */
          /* ===================================================== */
          <div className="flex-1 flex overflow-hidden bg-[#F7F9FC]">
            
            {/* --------------------------------------------------- */}
            {/* LEFT COLUMN: 创建方式 + XINO 能帮什么 (~280px)       */}
            {/* --------------------------------------------------- */}
            <div className="w-[280px] border-r border-[#E6EAF0] bg-[#FAFCFF] flex flex-col shrink-0 overflow-y-auto">
              <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
                
                <div className="space-y-6">
                  {/* 1. 创建方式 */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                      创建方式
                    </h2>
                    
                    <div className="p-3 bg-white border border-[#D0D5DD] rounded-md shadow-2xs space-y-1">
                      <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                        <span>从空白开始定义</span>
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                      </div>
                      <p className="text-[11px] text-[#667085] leading-relaxed">
                        已经明确指标含义时，可以先直接定义核心业务信息。
                      </p>
                    </div>

                    {/* Return to Natural Language Prompt Entry */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setAuthoringMode('ai_prompt');
                          if (addToast) addToast('info', '切换创建方式', '已切换至自然语言意图描述入口');
                        }}
                        className="text-xs text-[#667085] hover:text-[#2563EB] transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>改为描述我想衡量什么</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. 后续可由 Xino 帮助构建 */}
                  <div className="pt-4 border-t border-[#EEF2F6] space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                      <h2 className="text-xs font-bold text-[#172033]">
                        后续可由 Xino 帮助构建
                      </h2>
                    </div>

                    {/* Helper List: 6 Core capabilities */}
                    <ul className="space-y-2 text-xs text-[#334155]">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>计算关系</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>基础粒度</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>时间语义</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>分析维度</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>正式指标复用</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                        <span>Data Binding</span>
                      </li>
                    </ul>

                    {/* Crucial psychological relief message */}
                    <div className="pt-2">
                      <p className="text-[11px] font-medium text-[#667085] leading-relaxed">
                        你不需要现在填写这些内容。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Fill Sample Helper for easy UI testing */}
                <div className="pt-4 border-t border-[#EEF2F6] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>快速体验示例</span>
                    {blankMetricName && (
                      <button
                        onClick={handleResetBlank}
                        className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleFillSample}
                    className="w-full py-1.5 px-2.5 bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded text-xs text-[#2563EB] font-medium text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>填入「老龄化率」示例</span>
                    <Sparkles className="w-3 h-3 text-[#2563EB]" />
                  </button>
                </div>

              </div>
            </div>

            {/* --------------------------------------------------- */}
            {/* MIDDLE COLUMN: 基础定义 (主工作区域 · 视觉中心)       */}
            {/* --------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-[760px] space-y-6">

                {/* Single Continuous White Content Container */}
                <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-2xs overflow-hidden">
                  
                  {/* Top Header inside Container */}
                  <div className="px-7 pt-6 pb-4 border-b border-[#EEF2F6]">
                    <h2 className="text-base font-bold text-[#172033] tracking-tight">
                      基础定义
                    </h2>
                    <p className="text-xs text-[#667085] mt-1">
                      先告诉 Semovix 这个指标在业务上是什么意思。
                    </p>
                  </div>

                  {/* Section 1: 指标核心信息 */}
                  <div className="p-7 space-y-6">
                    
                    {/* 1. 指标名称 */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033]">
                        指标名称
                      </label>
                      <div className="w-full max-w-md">
                        <input
                          type="text"
                          value={blankMetricName}
                          onChange={(e) => setBlankMetricName(e.target.value)}
                          placeholder="例如：老龄化率"
                          className="w-full px-3.5 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] placeholder-[#94A3B8] transition-all outline-hidden"
                        />
                      </div>
                      <p className="text-[11px] text-[#667085]">
                        使用业务人员能够理解的名称。
                      </p>
                    </div>

                    {/* 2. 业务定义 (Most Important Input) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033]">
                        业务定义
                      </label>
                      <textarea
                        rows={4}
                        value={blankBusinessDefinition}
                        onChange={(e) => setBlankBusinessDefinition(e.target.value)}
                        placeholder="例如：60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] placeholder-[#94A3B8] transition-all outline-hidden leading-relaxed resize-none"
                      />
                      <p className="text-[11px] text-[#667085]">
                        描述“衡量什么”和“用于什么”，无需填写计算公式。
                      </p>
                    </div>

                    {/* 3. 关联业务对象 */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#172033]">
                        关联业务对象
                      </label>
                      
                      <div className="relative w-full max-w-md">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                          <input
                            type="text"
                            value={blankBusinessObject}
                            onChange={(e) => setBlankBusinessObject(e.target.value)}
                            onFocus={() => setIsObjectDropdownOpen(true)}
                            placeholder="搜索业务对象"
                            className="w-full pl-9 pr-8 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] placeholder-[#94A3B8] transition-all outline-hidden"
                          />
                          {blankBusinessObject && (
                            <button
                              onClick={() => setBlankBusinessObject('')}
                              className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#64748B]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Options */}
                        {isObjectDropdownOpen && (
                          <div 
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-md shadow-lg z-20 py-1 text-xs"
                            onMouseLeave={() => setIsObjectDropdownOpen(false)}
                          >
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8]">
                              可选业务实体
                            </div>
                            {['自然人', '行政区域', '养老机构', '服务工单', '企业'].map((item) => (
                              <button
                                key={item}
                                onClick={() => {
                                  setBlankBusinessObject(item);
                                  setIsObjectDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] text-[#172033] flex items-center justify-between cursor-pointer"
                              >
                                <span>{item}</span>
                                {blankBusinessObject === item && (
                                  <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Lightweight Candidate Chips */}
                      <div className="flex items-center space-x-2 text-xs pt-0.5">
                        <span className="text-[11px] text-[#667085]">推荐对象：</span>
                        {['自然人', '行政区域', '养老机构'].map((cand) => (
                          <button
                            key={cand}
                            onClick={() => setBlankBusinessObject(cand)}
                            className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer border ${
                              blankBusinessObject === cand
                                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-semibold'
                                : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                            }`}
                          >
                            {cand}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-[#667085]">
                        用于明确该指标所衡量的主要业务主体。允许暂时不选。
                      </p>
                    </div>

                    {/* Divider */}
                    <hr className="border-[#EEF2F6] my-6" />

                    {/* Section 2: 适用范围 */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#172033]">
                          适用范围
                        </h3>
                        <p className="text-[11px] text-[#667085] mt-0.5">
                          只填写会影响指标定义成立条件的范围。
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* 1. 业务域 */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#172033]">
                            业务域
                          </label>
                          <div className="w-full max-w-md relative">
                            <select
                              value={blankBusinessDomain}
                              onChange={(e) => setBlankBusinessDomain(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] appearance-none pr-8 cursor-pointer outline-hidden"
                            >
                              <option value="">选择业务域</option>
                              <option value="人口服务">人口服务</option>
                              <option value="经济运行">经济运行</option>
                              <option value="公共服务">公共服务</option>
                              <option value="客户运营">客户运营</option>
                              <option value="医疗健康">医疗健康</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-[#64748B] pointer-events-none" />
                          </div>
                        </div>

                        {/* 2. 业务场景 */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#172033]">
                            业务场景 <span className="font-normal text-[#94A3B8]">（可选）</span>
                          </label>
                          <div className="w-full max-w-md">
                            <input
                              type="text"
                              value={blankBusinessScenario}
                              onChange={(e) => setBlankBusinessScenario(e.target.value)}
                              placeholder="例如：人口结构分析"
                              className="w-full px-3.5 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] placeholder-[#94A3B8] transition-all outline-hidden"
                            />
                          </div>
                        </div>

                        {/* 3. 统计对象 / 范围 */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#172033]">
                            统计对象 / 范围 <span className="font-normal text-[#94A3B8]">（可选）</span>
                          </label>
                          <div className="w-full max-w-md">
                            <input
                              type="text"
                              value={blankStatisticalScope}
                              onChange={(e) => setBlankStatisticalScope(e.target.value)}
                              placeholder="例如：有效常住人口"
                              className="w-full px-3.5 py-2 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] placeholder-[#94A3B8] transition-all outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-[#EEF2F6] my-6" />

                    {/* Main Bottom Action: 让 Xino 帮我构建指标草稿 */}
                    <div className="space-y-3 pt-2">
                      {/* Lightweight tip above button */}
                      {!canStartConstructing && (
                        <p className="text-[11px] text-[#667085] text-left">
                          至少填写指标名称和业务定义后即可开始构建。
                        </p>
                      )}

                      <button
                        onClick={handleStartConstructing}
                        disabled={!canStartConstructing}
                        className={`w-full max-w-md py-3 px-6 rounded-md font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2 ${
                          canStartConstructing
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white cursor-pointer shadow-blue-500/10'
                            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-current" />
                        <span>让 Xino 帮我构建指标草稿</span>
                      </button>

                      {/* Explicit helper note below button */}
                      <p className="text-[11px] text-[#667085] leading-relaxed max-w-lg">
                        Semovix 将基于当前定义查找已有业务对象、正式指标、规则和数据实现，并生成完整 Metric Draft。
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* --------------------------------------------------- */}
            {/* RIGHT COLUMN: 准备情况 (~310px)                     */}
            {/* --------------------------------------------------- */}
            <div className="w-[310px] border-l border-[#E6EAF0] bg-white flex flex-col shrink-0 overflow-y-auto">
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h2 className="text-sm font-bold text-[#172033]">
                      准备情况
                    </h2>
                    <p className="text-xs text-[#667085] mt-0.5">
                      基础业务定义就绪度
                    </p>
                  </div>

                  {/* 3 Status Groups (Neutral, Non-alarmist) */}
                  <div className="space-y-4">
                    {/* Item 1: 业务含义 */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isMeaningReady
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                          : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8]'
                      }`}>
                        {isMeaningReady ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          业务含义
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          {isMeaningReady ? '已填写业务名称与口径' : '等待定义'}
                        </div>
                      </div>
                    </div>

                    {/* Item 2: 适用上下文 */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isScopeSpecified
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                          : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8]'
                      }`}>
                        {isScopeSpecified ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          适用上下文
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          {isScopeSpecified ? '已指定业务域与场景' : '尚未明确'}
                        </div>
                      </div>
                    </div>

                    {/* Item 3: 指标草稿 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center shrink-0 mt-0.5 text-[#94A3B8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          指标草稿
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          尚未构建
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Bottom Guidance Card */}
                <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#172033]">
                    <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                    <span>从业务定义开始即可</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    你不需要预先知道公式、SQL、字段或聚合方式。
                  </p>
                  <p className="text-[10.5px] text-[#94A3B8] leading-relaxed pt-1 border-t border-[#EEF2F6]">
                    Xino 会优先复用已有正式业务语义，而不是重新定义已有口径。
                  </p>
                </div>

              </div>
            </div>

          </div>
        ) : authoringMode === 'ai_prompt' ? (
          /* ===================================================== */
          /* AI PROMPT INTENT ENTRY WORKSPACE (DEFAULT ENTRY)      */
          /* ===================================================== */
          <div className="flex-1 flex overflow-hidden bg-[#F7F9FC]">
            {/* Left Column: 创建方式 + Xino 能帮什么 */}
            <div className="w-[280px] border-r border-[#E6EAF0] bg-[#FAFCFF] p-5 space-y-6 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-6">
                {/* 1. 创建方式 */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                    创建方式
                  </h2>
                  <div className="p-3 bg-white border border-[#D0D5DD] rounded-md shadow-2xs space-y-1">
                    <div className="text-xs font-bold text-[#172033] flex items-center justify-between">
                      <span>描述我想衡量什么</span>
                      <span className="w-2 h-2 rounded-full bg-[#6366F1]"></span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      用自然语言描述业务目标，AI 自动理解并推断指标语义结构。
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setAuthoringMode('blank');
                        if (addToast) addToast('info', '切换创建方式', '已切换至从空白开始定义');
                      }}
                      className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>切换到从空白开始定义 →</span>
                    </button>
                  </div>
                </div>

                {/* 2. Xino 辅助构建能力 */}
                <div className="pt-4 border-t border-[#EEF2F6] space-y-3">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                    <h2 className="text-xs font-bold text-[#172033]">
                      Xino 能够自动推断
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs text-[#334155]">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                      <span>业务对象与核心衡量主体</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                      <span>分子/分母与计算关系</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                      <span>基础粒度与时间语义</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                      <span>推荐分析维度与下钻路径</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                      <span>匹配底层数据资产物理 Binding</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-[#667085] leading-relaxed pt-1">
                    构建完成后将生成完整草稿，供业务与技术人员审核确认。
                  </p>
                </div>
              </div>

              {/* Quick Sample Prompts */}
              <div className="pt-4 border-t border-[#EEF2F6] space-y-2">
                <span className="text-[11px] font-semibold text-[#94A3B8]">常用业务指标示例</span>
                <div className="space-y-1.5">
                  {[
                    { title: '老龄化率', text: '创建“老龄化率”，定义为 60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。' },
                    { title: '高龄关爱巡访率', text: '统计本月度 80 岁以上独居高龄老人完成线下巡访或电话关爱的主体比例。' },
                    { title: '养老服务覆盖率', text: '本辖区内享受基本养老照护服务的人数占符合保障条件总人数的比率。' },
                  ].map((sample) => (
                    <button
                      key={sample.title}
                      onClick={() => {
                        setAiIntentText(sample.text);
                        if (addToast) addToast('info', '已填入描述', `已填入「${sample.title}」业务衡量意图`);
                      }}
                      className="w-full text-left p-2 rounded bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs text-[#334155] transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-[#172033] flex items-center justify-between">
                        <span>{sample.title}</span>
                        <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                      <div className="text-[11px] text-[#667085] truncate mt-0.5">{sample.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column: 主自然语言输入区域 */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-[760px] space-y-6">
                <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-2xs overflow-hidden">
                  <div className="px-7 pt-6 pb-4 border-b border-[#EEF2F6]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-[#172033] tracking-tight">
                          你想衡量什么？
                        </h2>
                        <p className="text-xs text-[#667085] mt-1">
                          用自然语言描述业务目标或衡量口径，Xino 将自动构建完整指标模型、计算逻辑与数据绑定。
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#6366F1]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="p-7 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#172033]">
                          业务意图描述
                        </label>
                        {aiIntentText && (
                          <button
                            onClick={() => setAiIntentText('')}
                            className="text-[11px] text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                          >
                            清空内容
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        value={aiIntentText}
                        onChange={(e) => setAiIntentText(e.target.value)}
                        placeholder="例如：创建老龄化率，定义为 60 周岁及以上常住人口占全部常住人口的比例，用于衡量区域人口老龄化程度。"
                        className="w-full px-4 py-3 bg-white border border-[#D0D5DD] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-md text-xs text-[#172033] leading-relaxed outline-hidden resize-none placeholder-[#94A3B8]"
                      />
                    </div>

                    {/* Action Area: Main button + alternative entry to Blank Create */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[#EEF2F6]">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleStartConstructingFromPrompt}
                          disabled={!aiIntentText.trim()}
                          className={`py-2.5 px-6 rounded-md font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2 ${
                            aiIntentText.trim()
                              ? 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white cursor-pointer shadow-blue-500/10'
                              : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-current" />
                          <span>让 Xino 解析并构建草稿</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setAuthoringMode('blank');
                          if (addToast) addToast('info', '切换创建方式', '已切换至从空白开始定义');
                        }}
                        className="text-xs text-[#667085] hover:text-[#2563EB] transition-colors cursor-pointer flex items-center justify-end space-x-1"
                      >
                        <span>或者：从空白开始定义</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 准备情况 */}
            <div className="w-[310px] border-l border-[#E6EAF0] bg-white p-6 space-y-6 flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">
                    准备情况
                  </h2>
                  <p className="text-xs text-[#667085] mt-0.5">
                    AI 意图解析就绪度
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      aiIntentText.trim().length > 0
                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                        : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8]'
                    }`}>
                      {aiIntentText.trim().length > 0 ? (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172033]">
                        业务意图输入
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        {aiIntentText.trim().length > 0 ? '已输入业务描述' : '等待输入'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center shrink-0 mt-0.5 text-[#94A3B8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172033]">
                        语义结构推导
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        将在点击构建后运行
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center shrink-0 mt-0.5 text-[#94A3B8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172033]">
                        数据实现绑定
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        自动探活企业数据资产
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#FAFCFF] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#172033]">
                  <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Xino 智能解析优势</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  优先对齐企业正式业务对象，并寻找已有的复用规则与原子度量。
                </p>
                <div className="pt-2 border-t border-[#EEF2F6]">
                  <button
                    onClick={() => {
                      setAuthoringMode('blank');
                      if (addToast) addToast('info', '切换创建方式', '已切换至从空白开始定义');
                    }}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <span>切换为从空白开始定义 →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : authoringMode === 'constructing' ? (
          /* ===================================================== */
          /* IN-PLACE AI DRAFT CONSTRUCTION ANIMATION SEQUENCE    */
          /* ===================================================== */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F7F9FC]">
            <div className="w-full max-w-[560px] bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-md space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mx-auto text-[#2563EB]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h2 className="text-base font-bold text-[#172033]">
                  Xino 正在构建指标草稿
                </h2>
                <p className="text-xs text-[#667085]">
                  基于「{blankMetricName || '老龄化率'}」业务定义进行全局语义对齐与实现推导
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2.5 pt-2">
                {constructionSteps.map((step, idx) => {
                  const isDone = idx < constructionStepIndex;
                  const isCurrent = idx === constructionStepIndex;
                  return (
                    <div 
                      key={step}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-md text-xs transition-all ${
                        isCurrent 
                          ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold shadow-2xs' 
                          : isDone 
                            ? 'bg-[#F8FAFC] text-[#334155] font-medium' 
                            : 'text-[#94A3B8] opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-[#16A36A]" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </div>
                        )}
                        <span>{step}</span>
                      </div>
                      <span className="text-[11px]">
                        {isDone ? '已完成' : isCurrent ? '推导中...' : '等待'}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        ) : (
          /* ===================================================== */
          /* DRAFT READY WORKSPACE (Full Metric Draft Workspace)   */
          /* ===================================================== */
          <div className="flex-1 flex overflow-hidden bg-[#F7F9FC]">

            {/* --------------------------------------------------- */}
            {/* COLUMN 1: LEFT INTENT & AI UNDERSTANDING (280px)   */}
            {/* --------------------------------------------------- */}
            <div className="w-[280px] border-r border-[#E6EAF0] bg-[#FAFCFF] flex flex-col shrink-0 overflow-y-auto">
              <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
                
                <div className="space-y-5">
                  {/* 1.1 业务定义概述 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        业务定义
                      </h2>
                      <button
                        onClick={() => {
                          setAuthoringMode('blank');
                          if (addToast) addToast('info', '编辑基础定义', '已返回基础定义调整页面');
                        }}
                        className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold cursor-pointer flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>修改</span>
                      </button>
                    </div>

                    {/* Natural Language Box */}
                    <div className="p-3 bg-white border border-[#D0D5DD] rounded-md shadow-2xs text-xs text-[#172033] leading-relaxed font-normal">
                      {businessDefinition}
                    </div>

                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      已建立核心业务含义，无需直接手写公式或 SQL。
                    </p>
                  </div>

                  {/* 1.2 AI 理解 */}
                  <div className="pt-4 border-t border-[#EEF2F6] space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                      <h3 className="text-xs font-bold text-[#172033]">
                        AI 语义解析结果
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[11px] text-[#667085]">业务对象</div>
                        <div className="font-semibold text-[#172033] mt-0.5">{businessObject}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[#667085]">度量方式</div>
                        <div className="font-semibold text-[#172033] mt-0.5">比例 (%)</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[#667085]">核心业务概念</div>
                        <div className="font-semibold text-[#172033] mt-0.5">老年人口 / 常住人口</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-[#667085]">业务目的</div>
                        <div className="font-semibold text-[#172033] mt-0.5">衡量区域人口老龄化程度</div>
                      </div>
                    </div>

                    {/* Light hint */}
                    <div className="pt-2 text-[11px] text-[#166534] bg-[#F0FDF4] p-2 rounded border border-[#DCFCE7] flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-[#16A36A] shrink-0" />
                      <span>已关联现有业务语义与正式指标</span>
                    </div>
                  </div>
                </div>

                {/* 1.3 Bottom Return to Blank Create */}
                <div className="pt-4 border-t border-[#EEF2F6] space-y-1">
                  <button
                    onClick={() => {
                      setAuthoringMode('blank');
                      if (addToast) addToast('info', '从空白开始定义', '已返回从空白开始定义视图');
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>← 返回基础定义模式</span>
                  </button>
                  <p className="text-[11px] text-[#667085]">
                    支持随时重新校准基础定义字段。
                  </p>
                </div>

              </div>
            </div>

            {/* --------------------------------------------------- */}
            {/* COLUMN 2: MIDDLE MAIN METRIC DRAFT (800px)         */}
            {/* --------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-[800px] space-y-6">

                {/* SINGLE CONTINUOUS WHITE DOCUMENT CONTAINER */}
                <div className="bg-white border border-[#E6EAF0] rounded-lg shadow-xs overflow-hidden">
                  
                  {/* Header: 指标草稿 */}
                  <div className="px-6 py-4.5 bg-[#FAFCFF] border-b border-[#EEF2F6] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="text-base font-bold text-[#172033] tracking-tight">
                          指标草稿
                        </h2>
                        <div className="flex items-center space-x-1 text-[11px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#E0E7FF]">
                          <Sparkles className="w-3 h-3 text-[#6366F1]" />
                          <span>AI 已完成语义构建</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#667085] mt-1">
                        已优先复用现有正式业务语义与指标定义。
                      </p>
                    </div>
                  </div>

                  {/* 2.2 业务含义 */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        业务含义
                      </h3>
                      <button
                        onClick={() => {
                          setTempDefinition(businessDefinition);
                          setIsAdjustDrawerOpen('meaning');
                        }}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        调整
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-lg font-bold text-[#172033]">
                        {metricName}
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">
                        {businessDefinition}
                      </p>
                      <div className="text-xs text-[#667085] pt-1">
                        业务对象：<span className="font-semibold text-[#172033]">{businessObject}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-[#EEF2F6] mx-6" />

                  {/* 2.3 适用范围 */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        适用范围
                      </h3>
                      <button
                        onClick={() => {
                          setTempScope(scopeText);
                          setIsAdjustDrawerOpen('scope');
                        }}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        调整
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-[#172033] tracking-wide">
                        {scopeText}
                      </div>
                      <p className="text-[11px] text-[#667085]">
                        用于明确该指标定义在哪个业务上下文下成立。
                      </p>
                    </div>
                  </div>

                  <hr className="border-[#EEF2F6] mx-6" />

                  {/* 2.4 如何衡量 */}
                  <div className="p-6 space-y-5 bg-[#FAFCFF]/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        如何衡量
                      </h3>
                    </div>

                    {/* Formula Box */}
                    <div className="p-4 bg-white border border-[#D8E2ED] rounded-md shadow-2xs text-center">
                      <div className="text-xs text-[#667085] font-medium mb-1">
                        计算关系公式
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-[#172033] tracking-tight py-1">
                        {metricName} = 老年人口数 ÷ 常住人口数 × 100%
                      </div>
                    </div>

                    {/* Formal Metric Dependencies */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-[#667085]">
                        依赖正式指标
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="p-3 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-[#172033]">
                              老年人口数
                            </div>
                            <div className="text-[11px] text-[#667085]">
                              60岁及以上常住人口总数
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                            正式有效
                          </span>
                        </div>

                        <div className="p-3 bg-white border border-[#E2E8F0] rounded-md flex items-center justify-between shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-[#172033]">
                              常住人口数
                            </div>
                            <div className="text-[11px] text-[#667085]">
                              辖区内全部有效常住人口
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                            正式有效
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#667085] pt-0.5">
                        复用当前正式指标，无需重新定义底层统计口径。
                      </p>
                    </div>

                    {/* Compact Measurement Summary Row */}
                    <div className="pt-2 border-t border-[#EEF2F6] flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-[#475569]">
                        <span className="font-semibold text-[#172033]">度量特征：</span>
                        <span>比例 · 人口统计快照 · %</span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        基础粒度：人 / 统计期
                      </div>
                    </div>
                  </div>

                  <hr className="border-[#EEF2F6] mx-6" />

                  {/* 2.5 时间与分析 */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        时间与分析
                      </h3>
                      <button
                        onClick={() => {
                          setTempDimensions(dimensions.join('、'));
                          setIsAdjustDrawerOpen('time_dim');
                        }}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        调整
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-[#667085] font-semibold">
                          时间语义
                        </div>
                        <div className="text-xs font-bold text-[#172033]">
                          {timeSemanticsText}
                        </div>
                        <div className="text-xs text-[#475569]">
                          支持周期：<span className="font-semibold text-[#172033]">{timeGrains.join(' / ')}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[11px] text-[#667085] font-semibold">
                          可分析维度
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {dimensions.map((dim) => (
                            <span
                              key={dim}
                              className="px-2.5 py-1 bg-[#F1F5F9] text-[#334155] rounded text-xs font-semibold border border-[#E2E8F0]"
                            >
                              {dim}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#667085] pt-1">
                      当前依赖指标支持以上分析范围。
                    </p>
                  </div>

                  <hr className="border-[#EEF2F6] mx-6" />

                  {/* 2.6 数据实现 */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                        数据实现
                      </h3>
                      <button
                        onClick={() => setIsDependencyDrawerOpen(true)}
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <span>查看依赖实现 →</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs font-bold text-[#172033]">
                          基于 2 个正式指标的数据实现
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7] flex items-center space-x-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Binding 正常</span>
                        </span>
                      </div>
                      <div className="text-xs text-[#667085]">
                        老年人口数 · 常住人口数
                      </div>
                    </div>
                  </div>

                  <hr className="border-[#EEF2F6] mx-6" />

                  {/* 2.7 来源与依据 */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xs font-bold text-[#667085] tracking-wider uppercase">
                      来源与依据
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[#667085] mr-2">来源：</span>
                        <span className="font-semibold text-[#172033]">
                          Semovix AI 辅助构建 · 人口服务中心 · 张敏
                        </span>
                      </div>

                      <div className="flex items-start space-x-2">
                        <span className="text-[#667085] shrink-0 mt-0.5">依据：</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded text-[11px]">
                            《人口统计业务规范》
                          </span>
                          <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded text-[11px]">
                            老年人口数
                          </span>
                          <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded text-[11px]">
                            常住人口数
                          </span>
                          <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded text-[11px]">
                            业务对象 · 自然人
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* --------------------------------------------------- */}
            {/* COLUMN 3: RIGHT READINESS & VALIDATION ACTION (310px)*/}
            {/* --------------------------------------------------- */}
            <div className="w-[310px] border-l border-[#E6EAF0] bg-white flex flex-col shrink-0 overflow-y-auto">
              <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
                
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-[#172033]">
                      指标准备情况
                    </h2>
                    <div className="text-xs text-[#667085] mt-0.5">
                      草稿完整性
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#16A36A]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          定义已完整
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          业务含义和适用范围已明确
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#16A36A]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          计算已完整
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          计算关系、粒度与时间语义已明确
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#16A36A]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          分析范围已确定
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          所需分析维度已明确
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#16A36A]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">
                          数据实现已就绪
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5">
                          依赖与 Data Binding 可以进入验证
                        </div>
                      </div>
                    </div>
                  </div>

                  {workspaceState === 'DRAFT_READY' && (
                    <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-md space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                        <span className="text-xs font-bold text-[#166534]">
                          已具备验证条件
                        </span>
                      </div>
                      <p className="text-[11px] text-[#15803D] leading-relaxed">
                        当前指标草稿定义完整，未发现阻断级业务问题，可以进入正式验证。
                      </p>
                    </div>
                  )}

                  {workspaceState === 'VALIDATION_PASSED' && (
                    <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-xs font-bold text-[#1E40AF]">
                          已具备生效条件
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1D4ED8] leading-relaxed">
                        已通过全项语义安全证明。确认生效后将正式发布至指标注册表。
                      </p>
                      <div className="text-[11px] text-[#475569] pt-1">
                        责任 Owner：<span className="font-bold text-[#0F172A]">人口服务中心 · 张敏</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-[#EEF2F6]">
                  {workspaceState === 'DRAFT_READY' ? (
                    <>
                      <button
                        onClick={handleRunValidation}
                        className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold rounded-md shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>运行验证</span>
                      </button>
                      <p className="text-[11px] text-[#667085] leading-relaxed text-center">
                        将验证计算依赖、粒度、时间语义、分析范围与数据实现。
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleConfirmEffective}
                        className="w-full py-2.5 px-4 bg-[#16A36A] hover:bg-[#15803D] text-white font-bold rounded-md shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>确认生效</span>
                      </button>
                      <p className="text-[11px] text-[#667085] leading-relaxed text-center">
                        将使「{metricName}」作为正式指标生效并分发给问数与分析工具。
                      </p>
                    </>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 3. MODALS & SLIDE-OVER DRAWERS                            */}
      {/* ========================================================= */}

      {/* 3.1 ADJUSTMENT DRAWER */}
      {isAdjustDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[460px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div>
                <div className="text-[11px] font-semibold text-[#667085]">
                  指标草稿调整
                </div>
                <div className="text-base font-bold text-[#172033]">
                  {isAdjustDrawerOpen === 'meaning' && '调整业务含义'}
                  {isAdjustDrawerOpen === 'scope' && '调整适用范围'}
                  {isAdjustDrawerOpen === 'time_dim' && '调整时间与分析范围'}
                </div>
              </div>
              <button
                onClick={() => setIsAdjustDrawerOpen(null)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {isAdjustDrawerOpen === 'meaning' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#667085]">指标名称</label>
                    <input
                      type="text"
                      value={metricName}
                      onChange={(e) => setMetricName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#667085]">业务定义口径</label>
                    <textarea
                      rows={4}
                      value={tempDefinition}
                      onChange={(e) => setTempDefinition(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB] leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {isAdjustDrawerOpen === 'scope' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#667085]">适用业务域与空间范围</label>
                    <input
                      type="text"
                      value={tempScope}
                      onChange={(e) => setTempScope(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              )}

              {isAdjustDrawerOpen === 'time_dim' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#667085]">可分析维度（以顿号分隔）</label>
                    <input
                      type="text"
                      value={tempDimensions}
                      onChange={(e) => setTempDimensions(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-xs focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsAdjustDrawerOpen(null)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-semibold rounded-md transition-colors cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (isAdjustDrawerOpen === 'meaning') {
                    setBusinessDefinition(tempDefinition);
                  } else if (isAdjustDrawerOpen === 'scope') {
                    setScopeText(tempScope);
                  } else if (isAdjustDrawerOpen === 'time_dim') {
                    const parsed = tempDimensions.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
                    if (parsed.length > 0) setDimensions(parsed);
                  }
                  setIsAdjustDrawerOpen(null);
                  if (addToast) addToast('success', '已更新指标草稿', '指标口径调整已即时生效并同步完整性检查');
                }}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-md transition-colors cursor-pointer text-xs shadow-2xs"
              >
                保存调整
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.2 DEPENDENCY & DATA BINDING INSPECTION DRAWER */}
      {isDependencyDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[540px] bg-white h-full shadow-2xl border-l border-[#E6EAF0] flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between shrink-0 bg-[#FAFCFF]">
              <div>
                <div className="text-[11px] font-semibold text-[#667085]">
                  数据实现与物理 Binding
                </div>
                <div className="text-base font-bold text-[#172033]">
                  依赖指标与底层资产实现
                </div>
              </div>
              <button
                onClick={() => setIsDependencyDrawerOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="p-4 border border-[#E2E8F0] rounded-md bg-[#FAFCFF] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#172033] text-sm">
                    1. 老年人口数
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                    正式指标
                  </span>
                </div>
                <div className="text-xs text-[#475569]">
                  物理表映射：<code className="bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-[11px]">dws_pop_base_info_d</code>
                </div>
              </div>

              <div className="p-4 border border-[#E2E8F0] rounded-md bg-[#FAFCFF] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#172033] text-sm">
                    2. 常住人口数
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#16A36A] border border-[#DCFCE7]">
                    正式指标
                  </span>
                </div>
                <div className="text-xs text-[#475569]">
                  物理表映射：<code className="bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-[11px]">dws_pop_base_info_d</code>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-end">
              <button
                onClick={() => setIsDependencyDrawerOpen(false)}
                className="px-4 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-semibold rounded-md transition-colors cursor-pointer text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.3 VALIDATING PROGRESS MODAL */}
      {isValidatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 p-4">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E6EAF0] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#EEF2F6] flex items-center justify-between bg-[#FAFCFF]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  {validationProgress < 100 ? (
                    <Play className="w-4 h-4 fill-current animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    {validationProgress < 100 ? '正在执行指标系统级验证' : '验证已全部完成并生成证明'}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {validationProgress < 100 ? '校验计算依赖、粒度、时间一致性与物理探活' : '未发现阻断级语义冲突与计算错误'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#475569]">总体验证进度</span>
                  <span className="text-[#2563EB] font-mono">{validationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#EEF2F6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {validationSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-md border border-[#F1F5F9] bg-[#FAFCFF] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {step.status === 'passed' && <CheckCircle className="w-4 h-4 text-[#16A36A]" />}
                      {step.status === 'running' && <Play className="w-3.5 h-3.5 text-[#2563EB] fill-current animate-pulse" />}
                      {step.status === 'waiting' && <div className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1]" />}
                      <span className={`font-medium ${step.status === 'passed' ? 'text-[#172033]' : 'text-[#64748B]'}`}>
                        {step.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono">
                      {step.status === 'passed' && <span className="text-[#16A36A]">通过</span>}
                      {step.status === 'running' && <span className="text-[#2563EB]">校验中</span>}
                      {step.status === 'waiting' && <span className="text-[#94A3B8]">等待</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#EEF2F6] bg-[#FAFCFF] flex items-center justify-end space-x-3">
              {validationProgress < 100 ? (
                <button
                  disabled
                  className="px-4 py-2 bg-[#F1F5F9] text-[#94A3B8] font-bold text-xs rounded-md cursor-not-allowed"
                >
                  正在验证中...
                </button>
              ) : (
                <button
                  onClick={() => setIsValidatingModalOpen(false)}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  完成并查看就绪状态
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
