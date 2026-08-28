/**
 * Semovix Agent Domain Model - Repository
 * In-memory domain repository managing:
 * - AgentDefinitions
 * - AgentDrafts
 * - AgentVersions (immutable)
 * - AgentRuntimeBindings
 */

import {
  AgentDefinition,
  AgentDraft,
  AgentVersion,
  AgentRuntimeBinding,
  AgentBusinessDiff
} from './agentTypes';

class AgentRepository {
  private definitions: Map<string, AgentDefinition> = new Map();
  private drafts: Map<string, AgentDraft> = new Map();
  private versions: Map<string, AgentVersion[]> = new Map(); // agentId -> immutable AgentVersion[]
  private runtimeBindings: Map<string, AgentRuntimeBinding> = new Map();

  constructor() {
    this.seedInitialDomainData();
  }

  private seedInitialDomainData() {
    // 1. Xino Master System Agent
    const xinoDef: AgentDefinition = {
      agentId: 'xino',
      name: 'Xino｜犀诺',
      description: 'Xino 是 Semovix 平台的主控智能协调角色，负责全局用户意图解析、多 Agent 任务路由协同与上下文串联。',
      responsibilitySummary: '理解用户目标并协调平台任务与智能能力，提供端到端的目标达成体验。',
      agentKind: 'SYSTEM',
      owner: '平台 AI 团队',
      supportedTaskTemplateIds: ['task_intent', 'task_routing', 'task_global_collab'],
      allowedContextSources: [
        { id: 'ctx_caps', name: '平台能力注册表', desc: '包含所有注册智能体与治理工具', type: 'BASE' },
        { id: 'ctx_topo', name: '任务流拓扑编排网', desc: '管理跨智能体长链路执行上下文', type: 'BASE' }
      ],
      capabilityPreset: '系统协调与任务路由中枢',
      capabilityDesc: '多 Agent 全局任务调度与状态机串联',
      modelPolicyId: 'POLICY_BALANCED',
      modelPolicyName: '综合平衡',
      maxAutonomy: 'SUGGEST',
      maxAutonomyDesc: '任务分发与方案协同',
      runtimeTarget: 'SEMOVIX_NATIVE',
      status: 'ACTIVE',
      currentPublishedVersion: 'v1.6',
      createdAt: '2026-08-01 10:00',
      createdBy: '系统管理员',
      updatedAt: '5 天前'
    };
    this.definitions.set(xinoDef.agentId, xinoDef);
    this.runtimeBindings.set(xinoDef.agentId, {
      bindingId: 'bind_xino_01',
      agentId: 'xino',
      runtimeTarget: 'SEMOVIX_NATIVE',
      runtimeInstanceId: 'inst_xino_native',
      runtimeStatus: 'READY',
      syncRevision: 'r48',
      lastSyncedAt: '5 天前'
    });

    // 2. Data Intelligence Agent
    const dataDef: AgentDefinition = {
      agentId: 'data_intelligence',
      name: '数据智能伙伴',
      description: '专注于业务数据消费场景，结合指标语义、数据目录与分析模型，自动执行跨库探查、计算与归因下钻。',
      responsibilitySummary: '面向业务目标完成找数、问数与数据分析，自动解析业务口径与指标语义。',
      agentKind: 'MANAGED',
      owner: '数据智能团队',
      sourcePresetId: 'DATA_INTELLIGENCE',
      supportedTaskTemplateIds: ['task_find_data', 'task_query_data', 'task_analyze_data'],
      allowedContextSources: [
        { id: 'ctx_1', name: '企业指标注册表', desc: '涵盖已发布核心指标与派生维度', type: 'BASE' },
        { id: 'ctx_2', name: '数据资产目录', desc: '挂载 180+ 数据表与逻辑视图元数据', type: 'BASE' },
        { id: 'ctx_3', name: '民生服务主题宽表', desc: '覆盖街镇老龄化照护与热线诉求记录', type: 'BASE' }
      ],
      capabilityPreset: '指标计算与多维归因',
      capabilityDesc: '语义模型与指标下钻计算 (Text-to-SQL + Metric Execution)',
      modelPolicyId: 'POLICY_LOGIC_FIRST',
      modelPolicyName: '代码与逻辑优先',
      maxAutonomy: 'SUGGEST',
      maxAutonomyDesc: '以提供取数方案与下钻归因为主',
      runtimeTarget: 'SEMOVIX_NATIVE',
      status: 'ACTIVE',
      currentPublishedVersion: 'v1.3',
      createdAt: '2026-08-10 14:00',
      createdBy: '数据智能团队',
      updatedAt: '昨天'
    };
    this.definitions.set(dataDef.agentId, dataDef);
    this.runtimeBindings.set(dataDef.agentId, {
      bindingId: 'bind_data_01',
      agentId: 'data_intelligence',
      runtimeTarget: 'SEMOVIX_NATIVE',
      runtimeInstanceId: 'inst_data_native',
      runtimeStatus: 'READY',
      syncRevision: 'r24',
      lastSyncedAt: '昨天'
    });

    // 3. Semantic Governance Agent
    const govDef: AgentDefinition = {
      agentId: 'semantic_governance',
      name: '语义治理伙伴',
      description: '面向数据治理与语义建模专家，提供表/字段语义推理、实体发现、标准映射与口径冲突仲裁能力。',
      responsibilitySummary: '辅助企业完成语义理解、业务对象、标准校验、字段对齐与知识网络治理任务。',
      agentKind: 'MANAGED',
      owner: '语义治理团队',
      sourcePresetId: 'SEMANTIC_GOVERNANCE',
      supportedTaskTemplateIds: ['task_semantic', 'task_obj', 'task_standards', 'task_align', 'task_metric_model'],
      allowedContextSources: [
        { id: 'ctx_1', name: '行业数据标准库', desc: '包含 GB/T 与行业规范标准元素', type: 'BASE' },
        { id: 'ctx_2', name: '核心业务对象拓扑', desc: '涵盖自然人、组织机构、服务事件', type: 'BASE' },
        { id: 'ctx_3', name: '字段语义理解知识库', desc: '记录历史人工确认的映射规则', type: 'BASE' }
      ],
      capabilityPreset: '语义合规审查与标准对齐',
      capabilityDesc: '数据标准比对与对象映射 (Schema Semantic Alignment)',
      modelPolicyId: 'POLICY_STRICT_CONSISTENCY',
      modelPolicyName: '严谨与一致性优先',
      maxAutonomy: 'PROPOSE',
      maxAutonomyDesc: '生成待裁决治理变更提案供专家确认',
      runtimeTarget: 'SEMOVIX_NATIVE',
      status: 'ACTIVE',
      currentPublishedVersion: 'v1.2',
      createdAt: '2026-08-12 09:00',
      createdBy: '语义治理团队',
      updatedAt: '3 天前'
    };
    this.definitions.set(govDef.agentId, govDef);
    this.runtimeBindings.set(govDef.agentId, {
      bindingId: 'bind_gov_01',
      agentId: 'semantic_governance',
      runtimeTarget: 'SEMOVIX_NATIVE',
      runtimeInstanceId: 'inst_gov_native',
      runtimeStatus: 'READY',
      syncRevision: 'r19',
      lastSyncedAt: '3 天前'
    });

    // 4. Enterprise Knowledge Agent (has active draft with clean business-level diffs)
    const entKnowledgeDef: AgentDefinition = {
      agentId: 'enterprise_knowledge',
      name: '企业知识伙伴',
      description: '依托企业级 WeKnora 知识引擎，对结构化与非结构化制度、规范、业务字典进行多跳推理与准确回答。',
      responsibilitySummary: '企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。严禁无依据推测。',
      agentKind: 'MANAGED',
      owner: '企业知识治理组',
      sourcePresetId: 'ENTERPRISE_KNOWLEDGE',
      supportedTaskTemplateIds: ['task_qa', 'task_doc_research', 'task_wiki_research'],
      allowedContextSources: [
        { id: 'ctx_rules', name: '企业制度', desc: '正式基线已有 · 涵盖行政、合规、财务规范', type: 'BASE' },
        { id: 'ctx_product', name: '产品知识', desc: '正式基线已有 · 涵盖产品白皮书、架构规范', type: 'BASE' }
      ],
      capabilityPreset: '精准知识问答',
      capabilityDesc: '企业知识与制度检索增强',
      modelPolicyId: 'POLICY_QUALITY_FIRST',
      modelPolicyName: '质量优先',
      maxAutonomy: 'SUGGEST',
      maxAutonomyDesc: '以提供方案与可追溯依据为主',
      runtimeTarget: 'WEKNORA',
      status: 'ACTIVE',
      currentPublishedVersion: 'v1.4',
      currentDraftId: 'draft_ent_knowledge_v1_5',
      createdAt: '2026-08-15 16:00',
      createdBy: '企业知识治理组',
      updatedAt: '今天 09:42'
    };
    this.definitions.set(entKnowledgeDef.agentId, entKnowledgeDef);

    // Seed Published Version for enterprise_knowledge (Immutable)
    const v1_4: AgentVersion = {
      versionId: 'ver_ent_kno_1_4',
      versionNumber: 'v1.4',
      agentId: 'enterprise_knowledge',
      snapshot: { ...entKnowledgeDef },
      publishedAt: '2026-08-25 16:40',
      publishedBy: '企业知识治理组',
      releaseNotes: '优化知识问答召回精度并完成多文档对比支持',
      runtimeRevision: 'r37'
    };
    this.versions.set('enterprise_knowledge', [v1_4]);

    // Active Draft with Business Diff (Notice: NO low-level WeKnora Dense/BM25 weight parameters!)
    const draftChanges: AgentBusinessDiff[] = [
      {
        field: '知识空间范围',
        changeText: '+ 新增挂载：数据治理规范知识空间 (涵盖数据标准、值域代码与血缘规则)',
        tag: 'CONTEXT ADDED'
      },
      {
        field: '能力预设',
        changeText: '精准知识问答 → Wiki + RAG 混合研究 (支持多跳拓扑推理)',
        tag: 'PRESET UPGRADED'
      },
      {
        field: '支持任务',
        changeText: '新增支持任务：Wiki 研究 (跨企业内部 Wiki 拓扑词条检索)',
        tag: 'TASK ADDED'
      }
    ];

    const entDraft: AgentDraft = {
      draftId: 'draft_ent_knowledge_v1_5',
      agentId: 'enterprise_knowledge',
      baseVersion: 'v1.4',
      name: '企业知识伙伴',
      description: entKnowledgeDef.description,
      responsibilitySummary: entKnowledgeDef.responsibilitySummary,
      supportedTaskTemplateIds: ['task_qa', 'task_doc_research', 'task_wiki_research'],
      allowedContextSources: [
        { id: 'ctx_rules', name: '企业制度', desc: '正式基线已有 · 涵盖行政、合规、财务规范', type: 'BASE' },
        { id: 'ctx_product', name: '产品知识', desc: '正式基线已有 · 涵盖产品白皮书、架构规范', type: 'BASE' },
        { id: 'ctx_gov', name: '数据治理规范', desc: '草稿新增 · 涵盖数据标准、值域代码与血缘规则', type: 'DRAFT_NEW' }
      ],
      capabilityPreset: 'Wiki + RAG 混合',
      capabilityDesc: '多跳语义拓扑检索与混合召回',
      modelPolicyId: 'POLICY_QUALITY_FIRST',
      modelPolicyName: '质量优先',
      maxAutonomy: 'SUGGEST',
      maxAutonomyDesc: '以提供方案与可追溯依据为主',
      runtimeTarget: 'WEKNORA',
      businessDiffs: draftChanges,
      updatedAt: '今天 10:26',
      updatedBy: '王健 (企业知识治理组)'
    };
    this.drafts.set(entDraft.draftId, entDraft);

    this.runtimeBindings.set('enterprise_knowledge', {
      bindingId: 'bind_ent_01',
      agentId: 'enterprise_knowledge',
      runtimeTarget: 'WEKNORA',
      runtimeInstanceId: 'inst_weknora_ent',
      runtimeStatus: 'READY',
      syncRevision: 'r37',
      lastSyncedAt: '今天 10:26'
    });
  }

  // Repository Methods
  public getDefinition(agentId: string): AgentDefinition | undefined {
    return this.definitions.get(agentId);
  }

  public getAllDefinitions(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  public saveDefinition(def: AgentDefinition): void {
    this.definitions.set(def.agentId, { ...def });
  }

  public getDraft(draftId: string): AgentDraft | undefined {
    return this.drafts.get(draftId);
  }

  public getDraftByAgentId(agentId: string): AgentDraft | undefined {
    const def = this.definitions.get(agentId);
    if (def?.currentDraftId) {
      return this.drafts.get(def.currentDraftId);
    }
    // Search by agentId
    for (const draft of this.drafts.values()) {
      if (draft.agentId === agentId) return draft;
    }
    return undefined;
  }

  public saveDraft(draft: AgentDraft): void {
    this.drafts.set(draft.draftId, { ...draft });
  }

  public removeDraft(draftId: string): void {
    this.drafts.delete(draftId);
  }

  public getVersions(agentId: string): AgentVersion[] {
    return this.versions.get(agentId) || [];
  }

  public addVersion(version: AgentVersion): void {
    const list = this.versions.get(version.agentId) || [];
    // Enforce immutability: prepend or append new version
    this.versions.set(version.agentId, [version, ...list]);
  }

  public getRuntimeBinding(agentId: string): AgentRuntimeBinding | undefined {
    return this.runtimeBindings.get(agentId);
  }

  public saveRuntimeBinding(binding: AgentRuntimeBinding): void {
    this.runtimeBindings.set(binding.agentId, { ...binding });
  }
}

export const agentRepository = new AgentRepository();
