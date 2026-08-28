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
    // V1.1: Xino 不再作为 Agent Center 内置智能体播种（Xino 属于 AI Workbench /
    // Orchestration 产品能力，不进入 Registry / Draft 生命周期 / Version 列表）。
    // Registry 只固定播种三个内置智能体，origin = 'BUILT_IN'。

    // 1. Data Intelligence Agent
    const dataDef: AgentDefinition = {
      agentId: 'data_intelligence',
      name: '数据智能伙伴',
      description: '专注于业务数据消费场景，结合指标语义、数据目录与分析模型，自动执行跨库探查、计算与归因下钻。',
      responsibilitySummary: '面向业务目标完成找数、问数与数据分析，自动解析业务口径与指标语义。',
      agentKind: 'MANAGED',
      origin: 'BUILT_IN',
      owner: '数据智能团队',
      sourcePresetId: 'DATA_INTELLIGENCE',
      supportedTaskTemplates: [
        { taskTemplateId: 'FIND_DATA_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'QUERY_DATA_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'ANALYZE_DATA_V1', version: 'V1', enabled: true }
      ],
      allowedContextSources: ['METRIC', 'MARKETPLACE', 'DATA_SEMANTICS'],
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

    // 2. Semantic Governance Agent
    const govDef: AgentDefinition = {
      agentId: 'semantic_governance',
      name: '语义治理伙伴',
      description: '面向数据治理与语义建模专家，提供表/字段语义推理、实体发现、标准映射与口径冲突仲裁能力。',
      responsibilitySummary: '辅助企业完成语义理解、业务对象、标准校验、字段对齐与知识网络治理任务。',
      agentKind: 'MANAGED',
      origin: 'BUILT_IN',
      owner: '语义治理团队',
      sourcePresetId: 'SEMANTIC_GOVERNANCE',
      supportedTaskTemplates: [
        { taskTemplateId: 'SEMANTIC_UNDERSTANDING_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'BUSINESS_OBJECT_DISCOVERY_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'OBJECT_MERGE_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'STANDARD_MATCHING_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'METRIC_GOVERNANCE_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'DRKN_BUILD_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'DKN_BUILD_V1', version: 'V1', enabled: true }
      ],
      allowedContextSources: ['BUSINESS_TERM', 'BUSINESS_OBJECT', 'DATA_SEMANTICS'],
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

    // 3. Enterprise Knowledge Agent (has active draft with clean business-level diffs)
    const entKnowledgeDef: AgentDefinition = {
      agentId: 'enterprise_knowledge',
      name: '企业知识伙伴',
      description: '依托企业级 WeKnora 知识引擎，对结构化与非结构化制度、规范、业务字典进行多跳推理与准确回答。',
      responsibilitySummary: '企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。严禁无依据推测。',
      agentKind: 'MANAGED',
      origin: 'BUILT_IN',
      owner: '企业知识治理组',
      sourcePresetId: 'ENTERPRISE_KNOWLEDGE',
      supportedTaskTemplates: [
        { taskTemplateId: 'KNOWLEDGE_QA_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'DOCUMENT_RESEARCH_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'WIKI_RESEARCH_V1', version: 'V1', enabled: false }
      ],
      allowedContextSources: ['KNOWLEDGE_SPACE', 'DOCUMENT'],
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
      runtimeRevision: 'MOCK_RUNTIME'
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
      origin: entKnowledgeDef.origin,
      supportedTaskTemplates: [
        { taskTemplateId: 'KNOWLEDGE_QA_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'DOCUMENT_RESEARCH_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'WIKI_RESEARCH_V1', version: 'V1', enabled: true }
      ],
      allowedContextSources: ['KNOWLEDGE_SPACE', 'DOCUMENT', 'WIKI'],
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

    // WeKnora 绑定：真实 API 未接入，如实标注 MOCK_RUNTIME，
    // 不再宣称 inst_weknora_ent / r37 / 已同步。
    this.runtimeBindings.set('enterprise_knowledge', {
      bindingId: 'bind_ent_01',
      agentId: 'enterprise_knowledge',
      runtimeTarget: 'WEKNORA',
      runtimeInstanceId: undefined,
      runtimeStatus: 'MOCK_RUNTIME',
      integrationMode: 'MOCK_RUNTIME',
      syncRevision: undefined,
      lastSyncedAt: undefined
    });

    // 补齐各智能体的历史版本种子，使 A04 发布记录统一从 Repository 读取
    this.versions.set('data_intelligence', [
      {
        versionId: 'ver_data_1_3',
        versionNumber: 'v1.3',
        agentId: 'data_intelligence',
        snapshot: { ...dataDef },
        publishedAt: '2026-08-24 10:15',
        publishedBy: '数据智能团队',
        releaseNotes: '问数据链路支持指标口径自动校验',
        runtimeRevision: 'native'
      },
      {
        versionId: 'ver_data_1_2',
        versionNumber: 'v1.2',
        agentId: 'data_intelligence',
        snapshot: { ...dataDef, currentPublishedVersion: 'v1.2' },
        publishedAt: '2026-08-11 14:20',
        publishedBy: '数据智能团队',
        releaseNotes: '新增数据分析任务的归因下钻能力',
        runtimeRevision: 'native'
      }
    ]);
    this.versions.set('semantic_governance', [
      {
        versionId: 'ver_gov_1_2',
        versionNumber: 'v1.2',
        agentId: 'semantic_governance',
        snapshot: { ...govDef },
        publishedAt: '2026-08-21 09:40',
        publishedBy: '语义治理团队',
        releaseNotes: '标准治理任务接入行业标准对齐库',
        runtimeRevision: 'native'
      },
      {
        versionId: 'ver_gov_1_1',
        versionNumber: 'v1.1',
        agentId: 'semantic_governance',
        snapshot: { ...govDef, currentPublishedVersion: 'v1.1' },
        publishedAt: '2026-08-13 16:05',
        publishedBy: '语义治理团队',
        releaseNotes: '业务对象发现算法与语义对齐基线版本',
        runtimeRevision: 'native'
      }
    ]);
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
