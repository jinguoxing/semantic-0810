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
  AgentBusinessDiff,
  buildAgentDefinitionSnapshot
} from './agentTypes';

class AgentRepository {
  private definitions: Map<string, AgentDefinition> = new Map();
  private drafts: Map<string, AgentDraft> = new Map();
  private versions: Map<string, AgentVersion[]> = new Map(); // agentId -> immutable AgentVersion[]
  /**
   * Version-scoped Runtime Binding 历史（Commit 08 §39）：
   * agentId -> AgentRuntimeBinding[]，同一 Agent 最多一个 active=true，
   * 旧版本 Binding 以 active=false 保留为历史，不物理覆盖。
   */
  private runtimeBindings: Map<string, AgentRuntimeBinding[]> = new Map();

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
      // V1.1：内置智能体显式携带 roleInstruction（Runtime 角色行为说明），不依赖 undefined fallback
      roleInstruction:
        '作为企业数据分析智能体（数据智能伙伴），围绕业务目标使用当前用户有权的数据、指标与业务语义完成找数、问数与分析；优先采用正式指标与已发布语义；证据不足时明确说明；不得绕过权限或自行扩大数据访问范围。',
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
      // V1.1：内置已发布智能体是版本化的独立配置，不随能力模板默认 Context 变化自动同步
      contextBindings: [],
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
    // Version-scoped Binding（Commit 08 TASK 18）：绑定正式 v1.3；
    // integrationMode 如实 MOCK_RUNTIME，不虚构生产连接与 Runtime Agent ID
    this.runtimeBindings.set(dataDef.agentId, [
      {
        bindingId: 'bind_data_01',
        agentId: 'data_intelligence',
        agentVersion: 'v1.3',
        runtimeType: 'SEMOVIX_NATIVE',
        runtimeAgentId: undefined,
        integrationMode: 'MOCK_RUNTIME',
        syncStatus: 'SYNCED',
        healthStatus: 'HEALTHY',
        runtimeConfigRevision: 'r24', // 迁移自原 syncRevision
        active: true,
        lastSyncedAt: '昨天',
        lastCheckedAt: '昨天',
        syncError: undefined
      }
    ]);

    // 2. Semantic Governance Agent
    const govDef: AgentDefinition = {
      agentId: 'semantic_governance',
      name: '语义治理伙伴',
      description: '面向数据治理与语义建模专家，提供表/字段语义推理、实体发现、标准映射与口径冲突仲裁能力。',
      responsibilitySummary: '辅助企业完成语义理解、业务对象、标准校验、字段对齐与知识网络治理任务。',
      roleInstruction:
        '作为企业语义治理智能体（语义治理伙伴），基于数据事实、业务语义与治理规范生成治理判断与候选方案；冲突或低确定性事项形成待确认提案；不得绕过治理流程直接发布正式语义或治理变更。',
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
      contextBindings: [],
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
    this.runtimeBindings.set(govDef.agentId, [
      {
        bindingId: 'bind_gov_01',
        agentId: 'semantic_governance',
        agentVersion: 'v1.2',
        runtimeType: 'SEMOVIX_NATIVE',
        runtimeAgentId: undefined,
        integrationMode: 'MOCK_RUNTIME',
        syncStatus: 'SYNCED',
        healthStatus: 'HEALTHY',
        runtimeConfigRevision: 'r19', // 迁移自原 syncRevision
        active: true,
        lastSyncedAt: '3 天前',
        lastCheckedAt: '3 天前',
        syncError: undefined
      }
    ]);

    // 3. Enterprise Knowledge Agent (has active draft with clean business-level diffs)
    const entKnowledgeDef: AgentDefinition = {
      agentId: 'enterprise_knowledge',
      name: '企业知识伙伴',
      description: '依托企业级 WeKnora 知识引擎，对结构化与非结构化制度、规范、业务字典进行多跳推理与准确回答。',
      responsibilitySummary: '企业知识伙伴负责基于当前用户有权访问的企业正式知识回答问题，并支持跨文档、Wiki 与知识空间开展深入研究。严禁无依据推测。',
      roleInstruction:
        '作为企业知识智能体（企业知识伙伴），只依据当前用户有权访问的企业正式知识回答与研究，支持跨文档、Wiki 与知识空间的多跳检索；回答优先提供可追溯依据；知识冲突、缺失或无法确认时必须说明；不得把推测表达为企业正式事实。',
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
      contextBindings: [],
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
    // V1.1：种子版本一律经 canonical Snapshot Builder，快照不含 currentDraftId 等生命周期字段
    const v1_4: AgentVersion = {
      versionId: 'ver_ent_kno_1_4',
      versionNumber: 'v1.4',
      agentId: 'enterprise_knowledge',
      snapshot: buildAgentDefinitionSnapshot(entKnowledgeDef),
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
      // 草稿继承正式定义的 roleInstruction；owner 为当前正式 Owner（≠ updatedBy 编辑人）
      roleInstruction: entKnowledgeDef.roleInstruction,
      origin: entKnowledgeDef.origin,
      owner: entKnowledgeDef.owner,
      supportedTaskTemplates: [
        { taskTemplateId: 'KNOWLEDGE_QA_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'DOCUMENT_RESEARCH_V1', version: 'V1', enabled: true },
        { taskTemplateId: 'WIKI_RESEARCH_V1', version: 'V1', enabled: true }
      ],
      allowedContextSources: ['KNOWLEDGE_SPACE', 'DOCUMENT', 'WIKI'],
      contextBindings: [],
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

    // WeKnora 绑定：真实 API 未接入，如实标注 MOCK_RUNTIME。
    // Commit 08 TASK 19：Binding 只绑定正式 v1.4；
    // draft_ent_knowledge_v1_5 不建立任何 RuntimeBinding，
    // Draft 仅在 A04 发布验证时产生 transient RuntimeProjection。
    this.runtimeBindings.set('enterprise_knowledge', [
      {
        bindingId: 'bind_ent_01',
        agentId: 'enterprise_knowledge',
        agentVersion: 'v1.4',
        runtimeType: 'WEKNORA',
        runtimeAgentId: undefined,
        integrationMode: 'MOCK_RUNTIME',
        syncStatus: 'SYNCED',
        healthStatus: 'HEALTHY',
        runtimeConfigRevision: undefined,
        active: true,
        lastSyncedAt: undefined,
        lastCheckedAt: undefined,
        syncError: undefined
      }
    ]);

    // 补齐各智能体的历史版本种子，使 A04 发布记录统一从 Repository 读取
    this.versions.set('data_intelligence', [
      {
        versionId: 'ver_data_1_3',
        versionNumber: 'v1.3',
        agentId: 'data_intelligence',
        snapshot: buildAgentDefinitionSnapshot(dataDef),
        publishedAt: '2026-08-24 10:15',
        publishedBy: '数据智能团队',
        releaseNotes: '问数据链路支持指标口径自动校验',
        runtimeRevision: 'native'
      },
      {
        versionId: 'ver_data_1_2',
        versionNumber: 'v1.2',
        agentId: 'data_intelligence',
        snapshot: buildAgentDefinitionSnapshot(dataDef),
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
        snapshot: buildAgentDefinitionSnapshot(govDef),
        publishedAt: '2026-08-21 09:40',
        publishedBy: '语义治理团队',
        releaseNotes: '标准治理任务接入行业标准对齐库',
        runtimeRevision: 'native'
      },
      {
        versionId: 'ver_gov_1_1',
        versionNumber: 'v1.1',
        agentId: 'semantic_governance',
        snapshot: buildAgentDefinitionSnapshot(govDef),
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
    // 不可变实现：返回深拷贝，外部引用修改不会反向改写历史 Snapshot
    return (this.versions.get(agentId) || []).map((version) => ({
      ...version,
      snapshot: buildAgentDefinitionSnapshot(version.snapshot)
    }));
  }

  /** 按版本号取单个已发布版本（同样返回深拷贝） */
  public getVersion(agentId: string, versionNumber: string): AgentVersion | undefined {
    const found = (this.versions.get(agentId) || []).find(
      (version) => version.versionNumber === versionNumber
    );
    return found ? { ...found, snapshot: buildAgentDefinitionSnapshot(found.snapshot) } : undefined;
  }

  public addVersion(version: AgentVersion): void {
    const list = this.versions.get(version.agentId) || [];
    // Enforce immutability: 入库前对 Snapshot 深拷贝，prepend 新版本
    this.versions.set(version.agentId, [
      { ...version, snapshot: buildAgentDefinitionSnapshot(version.snapshot) },
      ...list
    ]);
  }

  /* ─────────────────────────────────────────────────────────────
     Version-scoped Runtime Binding API（Commit 08 §39）
     返回值一律浅拷贝（{ ...binding }）：字段基本为 primitive，
     仍不泄露内部可变引用，外部修改无法反向篡改 Binding 历史。
     旧的单一 getRuntimeBinding / saveRuntimeBinding 已删除，
     不保留第二套语义（调用方全部迁移到下列 API）。
     ───────────────────────────────────────────────────────────── */

  /** 某智能体的全部 Binding 历史（含 active=false 旧版本），按入库顺序 */
  public getRuntimeBindings(agentId: string): AgentRuntimeBinding[] {
    return (this.runtimeBindings.get(agentId) || []).map((binding) => ({ ...binding }));
  }

  /** 当前 active Binding（同一 agentId 最多一个） */
  public getActiveRuntimeBinding(agentId: string): AgentRuntimeBinding | undefined {
    const found = (this.runtimeBindings.get(agentId) || []).find((b) => b.active);
    return found ? { ...found } : undefined;
  }

  /** 按正式版本号取 Binding（历史版本查询） */
  public getRuntimeBindingForVersion(agentId: string, versionNumber: string): AgentRuntimeBinding | undefined {
    const found = (this.runtimeBindings.get(agentId) || []).find(
      (b) => b.agentVersion === versionNumber
    );
    return found ? { ...found } : undefined;
  }

  /**
   * 切换 Active Binding（发布成功的最后一步才调用）：
   * 1. 旧 active Binding 标记 active=false（保留历史，不物理覆盖）；
   * 2. 保存新 Binding（active=true）；
   * 3. 保证同一 agentId 最多一个 active=true。
   */
  public activateRuntimeBinding(binding: AgentRuntimeBinding): void {
    const list = this.runtimeBindings.get(binding.agentId) || [];
    const next = list.map((b) => (b.active ? { ...b, active: false } : b));
    // 同一版本重复激活：替换旧记录而不是产生第二个 active
    const withoutSameVersion = next.filter((b) => b.agentVersion !== binding.agentVersion);
    this.runtimeBindings.set(binding.agentId, [
      ...withoutSameVersion,
      { ...binding, active: true }
    ]);
  }
}

export const agentRepository = new AgentRepository();
