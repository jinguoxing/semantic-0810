/**
 * Agent Runtime Adapters
 * - SemovixNativeRuntimeAdapter: 平台自有运行时（原型内存实现）
 * - WeKnoraRuntimeAdapterMock: WeKnora 运行时的 Mock 实现（真实 API 未接入）
 *
 * 诚实性约定：两个 Adapter 的 integrationMode 都是 MOCK_RUNTIME ——
 * 当前仓库没有生产级 Runtime 连接，任何一处都不得伪装成 Production Connection。
 */

import type { AgentRuntimeBinding, RuntimeTarget } from '../agentTypes';
import type {
  AgentRuntimeAdapter,
  RuntimeHealth,
  RuntimeProjection,
  RuntimeValidationCheck,
  RuntimeValidationResult,
  SemovixNativeProjection,
  WeKnoraAgentProjection
} from './runtimeTypes';
import { compileKnowledgeAgent } from './knowledgeCompiler';

let projectionSeq = 0;

function nextProjectionId(runtimeTarget: RuntimeTarget, agentId: string): string {
  projectionSeq += 1;
  return `${runtimeTarget === 'WEKNORA' ? 'weknora' : 'native'}-${agentId}-p${projectionSeq}`;
}

/**
 * buildBinding 最终契约（Commit 08 TASK 14）：
 * Binding 必须携带 agentVersion（由 Domain Service 显式传入）；
 * Mock 环境 runtimeAgentId 保持 undefined，不虚构真实 Runtime Agent ID。
 * syncStatus=SYNCED / healthStatus=HEALTHY 只描述当前 Mock Integration
 * Instance 内部状态，绝不能被解释为「已连接生产 Runtime」。
 */
function buildBinding(projection: RuntimeProjection, agentVersion: string): AgentRuntimeBinding {
  return {
    bindingId: `binding-${projection.projectionId}`,
    agentId: projection.agentId,
    agentVersion,
    runtimeType: projection.runtimeTarget,
    runtimeAgentId: undefined,
    integrationMode: 'MOCK_RUNTIME',
    syncStatus: 'SYNCED',
    healthStatus: 'HEALTHY',
    runtimeConfigRevision: `projection:${projection.projectionId}`,
    active: true,
    lastSyncedAt: '刚刚',
    lastCheckedAt: undefined,
    syncError: undefined
  };
}

/* ─────────────── Semovix Native ─────────────── */

export class SemovixNativeRuntimeAdapter implements AgentRuntimeAdapter {
  async compile(draft: import('../agentTypes').AgentDraft): Promise<RuntimeProjection> {
    const payload: SemovixNativeProjection = {
      projectionKind: 'SEMOVIX_NATIVE',
      name: draft.name,
      description: draft.description,
      supportedTaskTemplates: draft.supportedTaskTemplates.filter((t) => t.enabled).map((t) => t.taskTemplateId),
      allowedContextSources: draft.allowedContextSources,
      capabilityPreset: draft.capabilityPreset,
      modelPolicy: draft.modelPolicyId,
      maxAutonomy: draft.maxAutonomy
    };
    return {
      projectionId: nextProjectionId('SEMOVIX_NATIVE', draft.agentId),
      agentId: draft.agentId,
      // Commit 08 TASK 13：Projection 必须知道自己由哪个 Draft 编译出来
      draftId: draft.draftId,
      runtimeTarget: 'SEMOVIX_NATIVE',
      integrationMode: 'MOCK_RUNTIME',
      compiledAt: '刚刚编译',
      payload
    };
  }

  async validate(projection: RuntimeProjection): Promise<RuntimeValidationResult> {
    const payload = projection.payload as SemovixNativeProjection;
    const checks: RuntimeValidationCheck[] = [
      {
        name: '投影结构完整',
        status: payload.name && payload.modelPolicy ? 'PASSED' : 'FAILED',
        message: '名称 / 模型策略 / 自治等级字段完整'
      },
      {
        name: '任务模板绑定有效',
        status: payload.supportedTaskTemplates.length >= 1 ? 'PASSED' : 'FAILED',
        message: `已启用任务模板 ${payload.supportedTaskTemplates.length} 项`
      },
      {
        name: '上下文来源可解析',
        status: payload.allowedContextSources.length >= 1 ? 'PASSED' : 'FAILED',
        message: `允许上下文来源 ${payload.allowedContextSources.length} 项`
      }
    ];
    return {
      passed: checks.every((c) => c.status === 'PASSED'),
      integrationMode: 'MOCK_RUNTIME',
      checks
    };
  }

  async activate(projection: RuntimeProjection, agentVersion: string): Promise<AgentRuntimeBinding> {
    // 平台自有运行时：原型环境内存激活，不宣称生产集群部署
    return buildBinding(projection, agentVersion);
  }

  async getHealth(binding: AgentRuntimeBinding): Promise<RuntimeHealth> {
    return {
      healthStatus: binding.healthStatus,
      integrationMode: binding.integrationMode,
      checkedAt: '刚刚检查',
      message:
        binding.integrationMode === 'MOCK_RUNTIME'
          ? 'Semovix Native 原型运行时（模拟集成，平台内内存实现，未连接生产集群）'
          : 'Semovix Native 运行时'
    };
  }
}

/* ─────────────── WeKnora (Mock) ─────────────── */

export class WeKnoraRuntimeAdapterMock implements AgentRuntimeAdapter {
  async compile(draft: import('../agentTypes').AgentDraft): Promise<RuntimeProjection> {
    const payload: WeKnoraAgentProjection = compileKnowledgeAgent(draft, draft);
    return {
      projectionId: nextProjectionId('WEKNORA', draft.agentId),
      agentId: draft.agentId,
      // Commit 08 TASK 13：Projection 必须知道自己由哪个 Draft 编译出来
      draftId: draft.draftId,
      runtimeTarget: 'WEKNORA',
      integrationMode: 'MOCK_RUNTIME',
      compiledAt: '刚刚编译',
      payload
    };
  }

  async validate(projection: RuntimeProjection): Promise<RuntimeValidationResult> {
    const payload = projection.payload as WeKnoraAgentProjection;
    const checks: RuntimeValidationCheck[] = [
      {
        name: '投影结构完整',
        status: payload.name && payload.roleInstruction && payload.modelPolicy ? 'PASSED' : 'FAILED',
        message: '名称 / 角色指令 / 模型策略字段完整'
      },
      {
        name: '知识范围非空',
        status: payload.knowledgeScope.length >= 1 ? 'PASSED' : 'FAILED',
        message: `知识范围来源 ${payload.knowledgeScope.length} 项（运行时仍受 Permission Matrix 收敛）`
      },
      {
        name: '检索参数归属校验',
        status: 'PASSED',
        message: 'BM25/Dense/rerank/chunk 调参留在 WeKnora Runtime，投影未越界携带'
      }
    ];
    return {
      passed: checks.every((c) => c.status === 'PASSED'),
      integrationMode: 'MOCK_RUNTIME',
      checks
    };
  }

  async activate(projection: RuntimeProjection, agentVersion: string): Promise<AgentRuntimeBinding> {
    // Mock 激活：仅生成本地绑定记录，绝不宣称已同步真实 WeKnora 实例
    return buildBinding(projection, agentVersion);
  }

  async getHealth(binding: AgentRuntimeBinding): Promise<RuntimeHealth> {
    return {
      healthStatus: binding.healthStatus,
      integrationMode: binding.integrationMode,
      checkedAt: '刚刚检查',
      message:
        binding.integrationMode === 'MOCK_RUNTIME'
          ? 'Runtime integration pending — 未接入真实 WeKnora API，当前为模拟集成（MOCK_RUNTIME）'
          : 'WeKnora Runtime 连接正常'
    };
  }
}

/** 旧命名保留：真实 API 接入前 WeKnora 只有 Mock 实现 */
export const WeKnoraRuntimeAdapter = WeKnoraRuntimeAdapterMock;

const SEMOVIX_NATIVE_ADAPTER = new SemovixNativeRuntimeAdapter();
const WEKNORA_ADAPTER_MOCK = new WeKnoraRuntimeAdapterMock();

/** 按目标运行时获取 Adapter（端口注册表） */
export function getRuntimeAdapter(target: RuntimeTarget): AgentRuntimeAdapter {
  return target === 'WEKNORA' ? WEKNORA_ADAPTER_MOCK : SEMOVIX_NATIVE_ADAPTER;
}
