export interface AgentDraftChange {
  title: string;
  description: string;
}

export interface AgentDraftDetails {
  author: string;
  updatedAt: string;
  changesCount: number;
  changes: AgentDraftChange[];
}

export interface AgentItem {
  id: string;
  name: string;
  responsibility: string;
  agentType: '系统智能体' | '受管智能体';
  category: 'SYSTEM' | 'MANAGED';
  tasks: string[];
  extraTasksCount: number;
  allTasks: string[];
  runtimeEngine: 'Semovix' | 'Semovix Native' | 'WeKnora';
  engineSyncStatus?: string;
  formalVersion: string;
  releaseTime: string;
  status: 'ACTIVE';
  statusLabel: string;
  owner: string;
  hasDraft: boolean;
  draftNote?: string;
  draftDetails?: AgentDraftDetails;
  description: string;
  avatarType: 'xino' | 'data' | 'governance' | 'knowledge';
  skillsCount: number;
  toolsCount: number;
}

export const INITIAL_AGENTS: AgentItem[] = [
  {
    id: 'xino',
    name: 'Xino｜犀诺',
    responsibility: '理解用户目标并协调平台任务与智能能力',
    agentType: '系统智能体',
    category: 'SYSTEM',
    tasks: ['意图理解', '任务路由'],
    extraTasksCount: 1,
    allTasks: ['意图理解', '任务路由', '全局协同'],
    runtimeEngine: 'Semovix',
    formalVersion: 'v1.6',
    releaseTime: '5 天前发布',
    status: 'ACTIVE',
    statusLabel: '正常',
    owner: '平台 AI 团队',
    hasDraft: false,
    description: 'Xino 是 Semovix 平台的主控智能协调角色，负责全局用户意图解析、多 Agent 任务路由协同与上下文串联。',
    avatarType: 'xino',
    skillsCount: 8,
    toolsCount: 14,
  },
  {
    id: 'data_intelligence',
    name: '数据智能伙伴',
    responsibility: '面向业务目标完成找数、问数与数据分析',
    agentType: '受管智能体',
    category: 'MANAGED',
    tasks: ['找数据', '问数据'],
    extraTasksCount: 1,
    allTasks: ['找数据', '问数据', '数据分析'],
    runtimeEngine: 'Semovix Native',
    formalVersion: 'v1.3',
    releaseTime: '昨天发布',
    status: 'ACTIVE',
    statusLabel: '正常',
    owner: '数据智能团队',
    hasDraft: false,
    description: '专注于业务数据消费场景，结合指标语义、数据目录与分析模型，自动执行跨库探查、计算与归因下钻。',
    avatarType: 'data',
    skillsCount: 6,
    toolsCount: 12,
  },
  {
    id: 'semantic_governance',
    name: '语义治理伙伴',
    responsibility: '辅助企业完成语义理解、业务对象与治理任务',
    agentType: '受管智能体',
    category: 'MANAGED',
    tasks: ['语义理解', '业务对象'],
    extraTasksCount: 5,
    allTasks: ['语义理解', '业务对象', '标准校验', '字段对齐', '指标建模', '值域映射', '冲突审阅'],
    runtimeEngine: 'Semovix Native',
    formalVersion: 'v1.2',
    releaseTime: '3 天前发布',
    status: 'ACTIVE',
    statusLabel: '正常',
    owner: '语义治理团队',
    hasDraft: false,
    description: '面向数据治理与语义建模专家，提供表/字段语义推理、实体发现、标准映射与口径冲突仲裁能力。',
    avatarType: 'governance',
    skillsCount: 9,
    toolsCount: 16,
  },
  {
    id: 'enterprise_knowledge',
    name: '企业知识伙伴',
    responsibility: '基于企业正式知识回答问题并开展跨文档研究',
    agentType: '受管智能体',
    category: 'MANAGED',
    tasks: ['知识问答', '文档研究'],
    extraTasksCount: 1,
    allTasks: ['知识问答', '文档研究', '跨库检索'],
    runtimeEngine: 'WeKnora',
    engineSyncStatus: '已同步',
    formalVersion: 'v1.4',
    releaseTime: '今天 09:42 发布',
    status: 'ACTIVE',
    statusLabel: '正常',
    owner: '企业知识治理组',
    hasDraft: true,
    draftNote: '草稿有修改',
    draftDetails: {
      author: '王健 (企业知识治理组)',
      updatedAt: '今天 10:15',
      changesCount: 2,
      changes: [
        {
          title: '混合检索召回策略优化',
          description: '调整稠密向量 (Dense) 与 BM25 稀疏检索权重配比至 0.7 : 0.3，提升政务及业务缩写术语检索召回率。',
        },
        {
          title: '领域专有名词与实体词库更新',
          description: '挂载「政务与民政老龄化服务领域专有名词库 V2.1」，新增 28 个核心词条及其同义词扩展。',
        },
      ],
    },
    description: '依托企业级 WeKnora 知识引擎，对结构化与非结构化制度、规范、业务字典进行多跳推理与准确回答。',
    avatarType: 'knowledge',
    skillsCount: 5,
    toolsCount: 9,
  },
];

export interface AgentTemplateItem {
  id: string;
  name: string;
  description: string;
  engine: string;
  category: string;
  recommendedTasks: string[];
  skillsIncluded: string[];
}

export const AGENT_TEMPLATES: AgentTemplateItem[] = [
  {
    id: 'tpl_metric_analyst',
    name: '指标分析专家模板',
    description: '预置指标语义模型关联、同环比归因、多维下钻与自动解读能力。',
    engine: 'Semovix Native',
    category: '数据分析',
    recommendedTasks: ['指标问数', '异常归因', '趋势洞察'],
    skillsIncluded: ['Metric Calculation Engine', 'Anomaly Decomposition', 'SQL Synthesis'],
  },
  {
    id: 'tpl_data_cleaner',
    name: '数据清洗与探查专家',
    description: '自动化数据剖析、质量规则校验、空值异常定位与清洗方案推荐。',
    engine: 'Semovix Native',
    category: '数据治理',
    recommendedTasks: ['质量探查', '规则推导', '清洗建议'],
    skillsIncluded: ['Data Profiler', 'Rule Synthesizer', 'Semantic Matcher'],
  },
  {
    id: 'tpl_compliance_auditor',
    name: '合规与安全审计伙伴',
    description: '负责数据分级分类、敏感字段识别、权限申请安全合规性自动核验。',
    engine: 'Semovix',
    category: '合规安全',
    recommendedTasks: ['敏感识别', '合规评估', '审计追踪'],
    skillsIncluded: ['PII Classifier', 'Access Policy Evaluator', 'Audit Trail Logger'],
  },
  {
    id: 'tpl_knowledge_extractor',
    name: '制度与知识抽取助手',
    description: '面向企业 PDF/Word/Wiki 规范文档，自动结构化提取实体、关系与标准定义。',
    engine: 'WeKnora',
    category: '知识治理',
    recommendedTasks: ['文档解析', '实体抽取', '知识入库'],
    skillsIncluded: ['Document OCR & Parser', 'Relation Extractor', 'WeKnora Bridge'],
  },
];
