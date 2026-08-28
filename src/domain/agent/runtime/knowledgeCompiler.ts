/**
 * Knowledge Agent Compiler
 * 将企业知识类智能体的 Agent 定义/草稿编译为 WeKnora Runtime 可加载的投影。
 *
 * 边界约定：
 * - 这里只做"语义投影"：角色指令、知识范围、技能、模型策略、记忆策略；
 * - 检索调参（BM25 weight / Dense weight / rerank threshold / chunk merge threshold）
 *   属于 WeKnora Runtime 内部配置，由 Runtime 自治，不进入 Semovix Domain。
 */

import type { AgentContextSource, AgentDefinition, AgentDraft } from '../agentTypes';
import type { WeKnoraAgentProjection } from './runtimeTypes';

/** AgentDefinition 与 AgentDraft 在编译所需字段上结构兼容 */
export type KnowledgeAgentSource = AgentDefinition | AgentDraft;

export function compileKnowledgeAgent(
  agentDefinition: KnowledgeAgentSource,
  draft?: AgentDraft
): WeKnoraAgentProjection {
  const effective = draft ?? agentDefinition;

  // 知识范围 = 允许的上下文来源枚举（业务真实模型），
  // 实际可达范围仍由 Permission Matrix 与任务范围在运行时收敛。
  const knowledgeScope: AgentContextSource[] = effective.allowedContextSources;

  return {
    projectionKind: 'WEKNORA',
    name: effective.name,
    description: effective.description,
    agentType: 'agentKind' in agentDefinition ? agentDefinition.agentKind : 'MANAGED',
    // TODO(Commit 09 / Runtime Profile Mapping)：改用 effective.roleInstruction
    // （AgentDraft / AgentDefinitionSnapshot 已在 V1.1 Commit 05 落地），
    // 不再把 responsibilitySummary（用户职责摘要）当作 Runtime 角色指令。本 Commit 不改 Compiler。
    roleInstruction: effective.responsibilitySummary,
    knowledgeScope,
    webSearchEnabled: effective.allowedContextSources.includes('WEB'),
    // 技能授权由平台 Skill Registry 下发，编译期不虚构技能清单
    selectedSkills: [],
    modelPolicy: effective.modelPolicyId,
    memoryEnabled: true,
    historyTurns: 10
  };
}
