/**
 * Agent Runtime Port Layer - Types
 * Agent Domain 与目标运行时 (Runtime) 之间的端口协议。
 *
 * 集成诚实性约定：
 * - 当前仓库没有真实的 WeKnora Backend Integration，也没有生产集群连接；
 * - 所有 Adapter 的 integrationMode 一律如实标注，不把 Mock 当作 Production Connection；
 * - BM25 weight / Dense weight / rerank threshold / chunk merge threshold 等检索调参
 *   属于 WeKnora Runtime 内部实现，不在 Semovix Domain 层出现。
 */

import type {
  AgentRuntimeBinding,
  RuntimeTarget,
  RuntimeIntegrationMode,
  RuntimeHealthStatus
} from '../agentTypes';

/**
 * 集成模式等 Runtime 三维度状态类型定义在 Agent Domain（agentTypes.ts），
 * 此处 re-export 保持 runtime 端口层引用兼容；
 * agentTypes 不反向 import runtimeTypes，避免循环依赖（Commit 08 TASK 1）。
 */
export type { RuntimeIntegrationMode, RuntimeSyncStatus, RuntimeHealthStatus } from '../agentTypes';

/** Semovix 原生运行时的编译产物（平台自有任务执行引擎） */
export interface SemovixNativeProjection {
  projectionKind: 'SEMOVIX_NATIVE';
  name: string;
  description: string;
  supportedTaskTemplates: string[];
  allowedContextSources: string[];
  capabilityPreset: string;
  modelPolicy: string;
  maxAutonomy: string;
}

/** WeKnora 知识智能体投影（见 knowledgeCompiler） */
export interface WeKnoraAgentProjection {
  projectionKind: 'WEKNORA';
  name: string;
  description: string;
  agentType: string;
  roleInstruction: string;
  knowledgeScope: string[];
  webSearchEnabled: boolean;
  selectedSkills: string[];
  modelPolicy: string;
  memoryEnabled: boolean;
  historyTurns?: number;
}

/**
 * Runtime 编译产物（V1.1 §38，Commit 08）：payload 按目标运行时分发。
 * Projection 是 Ephemeral 对象——只用于 Release Validation / Test / Smoke Readiness /
 * Publish 前 Runtime Activation，不进入 AgentRepository.runtimeBindings，
 * 不作为正式持久化运行配置（不建 RuntimeProjectionRepository）。
 * draftId 必填：Projection 必须知道它由哪个 Draft 编译出来。
 */
export interface RuntimeProjection {
  projectionId: string;
  agentId: string;
  draftId: string;
  runtimeTarget: RuntimeTarget;
  integrationMode: RuntimeIntegrationMode;
  compiledAt: string;
  payload: SemovixNativeProjection | WeKnoraAgentProjection;
}

export interface RuntimeValidationCheck {
  name: string;
  status: 'PASSED' | 'FAILED';
  message: string;
}

export interface RuntimeValidationResult {
  passed: boolean;
  integrationMode: RuntimeIntegrationMode;
  checks: RuntimeValidationCheck[];
}

/**
 * Runtime 健康（Commit 08 TASK 12）：三维度独立。
 * healthStatus 只描述目标 Runtime 实例可用性；
 * Mock 是 Integration Mode，绝不能作为 Health Status 出现。
 */
export interface RuntimeHealth {
  healthStatus: RuntimeHealthStatus;
  integrationMode: RuntimeIntegrationMode;
  checkedAt: string;
  message: string;
}

/**
 * Agent Runtime Adapter 端口。
 * Semovix Domain 只依赖此接口，不感知具体 Runtime 的内部实现。
 * 真实 API 接入前，WeKnora 侧仅提供 WeKnoraRuntimeAdapterMock。
 */
export interface AgentRuntimeAdapter {
  /** 将 Agent 草稿编译为目标运行时可执行投影（transient，含 draftId） */
  compile(draft: import('../agentTypes').AgentDraft): Promise<RuntimeProjection>;
  /** 校验投影在目标运行时上的依赖完整性与契约兼容性 */
  validate(projection: RuntimeProjection): Promise<RuntimeValidationResult>;
  /**
   * 在目标运行时上激活投影，返回版本化运行绑定。
   * agentVersion 由 Domain Service 显式传入（它知道 targetVersionNumber），
   * Adapter 不自行猜测 currentPublishedVersion。
   */
  activate(projection: RuntimeProjection, agentVersion: string): Promise<AgentRuntimeBinding>;
  /** 查询运行时绑定健康状态（三维度独立，Mock 环境如实标注 integrationMode） */
  getHealth(binding: AgentRuntimeBinding): Promise<RuntimeHealth>;
}
