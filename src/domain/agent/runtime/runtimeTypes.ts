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

import type { AgentRuntimeBinding, RuntimeTarget } from '../agentTypes';

/** 集成模式：MOCK_RUNTIME = 原型内存模拟；PRODUCTION = 真实后端连接（当前未接入） */
export type RuntimeIntegrationMode = 'MOCK_RUNTIME' | 'PRODUCTION';

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

/** Runtime 编译产物：payload 按目标运行时分发 */
export interface RuntimeProjection {
  projectionId: string;
  agentId: string;
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

export interface RuntimeHealth {
  status: 'READY' | 'MOCK_RUNTIME' | 'ERROR';
  integrationMode: RuntimeIntegrationMode;
  message: string;
}

/**
 * Agent Runtime Adapter 端口。
 * Semovix Domain 只依赖此接口，不感知具体 Runtime 的内部实现。
 * 真实 API 接入前，WeKnora 侧仅提供 WeKnoraRuntimeAdapterMock。
 */
export interface AgentRuntimeAdapter {
  /** 将 Agent 草稿编译为目标运行时可执行投影 */
  compile(draft: import('../agentTypes').AgentDraft): Promise<RuntimeProjection>;
  /** 校验投影在目标运行时上的依赖完整性与契约兼容性 */
  validate(projection: RuntimeProjection): Promise<RuntimeValidationResult>;
  /** 在目标运行时上激活投影，返回运行时绑定 */
  activate(projection: RuntimeProjection): Promise<AgentRuntimeBinding>;
  /** 查询运行时绑定健康状态（Mock 环境如实返回 MOCK_RUNTIME） */
  getHealth(binding: AgentRuntimeBinding): Promise<RuntimeHealth>;
}
