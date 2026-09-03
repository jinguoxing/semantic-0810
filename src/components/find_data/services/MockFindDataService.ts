import {
  FindDataService,
  FindDataEngineResult,
  PermissionRecheckResult
} from './FindDataService';
import {
  FindDataTaskState,
  ResourceId,
  TaskAction,
  AskPlan,
  AskRunResult,
  ConversationBlock,
  AvailabilityByAction
} from '../model/FindDataTask';
import { FindDataEvent } from '../model/findDataEvents';
import {
  determineInteractionIntent,
  evaluateSurfacePolicy,
  SurfaceCommand
} from '../policy/surfacePolicy';
import {
  MINHANG_RESOURCES,
  MINHANG_INITIAL_HYPOTHESIS,
  MINHANG_DATA_SOLUTION,
  MINHANG_ASK_PLAN
} from '../fixtures/minhangBedSupplyFixture';

function isMinhangAgingScenario(query?: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    q.includes('闵行') ||
    q.includes('养老') ||
    q.includes('老龄') ||
    q.includes('床位') ||
    q.includes('老人') ||
    q.includes('人口') ||
    q.includes('供给')
  );
}

export class MockFindDataService implements FindDataService {
  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    const taskId = `task_${Date.now()}`;
    const initialQuery = input?.initialQuery?.trim();
    const isScenario = isMinhangAgingScenario(initialQuery);

    const now = new Date().toISOString();

    if (!isScenario && initialQuery) {
      // General/Unknown scenario fallback (AC-17: distinct query handling)
      return {
        taskId,
        title: initialQuery.length > 24 ? `${initialQuery.slice(0, 24)}...` : initialQuery,
        status: 'IDLE',
        scenarioKey: 'generic',
        goal: initialQuery,
        requirementHypothesis: {
          dimensions: [],
          analysisFocus: [],
          assumptions: [],
          unresolvedQuestions: []
        },
        searchScope: {
          domains: ['业务全域'],
          includeCrossDepartment: true
        },
        turns: [
          {
            turnId: `turn_${Date.now()}_u`,
            sender: 'USER',
            createdAt: now,
            blocks: [
              {
                type: 'TEXT',
                id: `txt_${Date.now()}_u`,
                content: initialQuery
              }
            ]
          },
          {
            turnId: `turn_${Date.now()}_a`,
            sender: 'ASSISTANT',
            createdAt: now,
            blocks: [
              {
                type: 'TEXT',
                id: `txt_${Date.now()}_a`,
                content: `您好！已接收您的找数据诉求：「${initialQuery}」。\n\n当前原型系统已完整预置「闵行区老年人口与养老床位供给水平分析」端到端高保真语义推理与问数闭环。\n\n针对当前输入的自定义领域，语义引擎已完成意图提取，如需快速验证完整的多轮协同与问数工作区联动，可点击下方推荐场景，或直接输入您的具体分析维度。`
              },
              {
                type: 'ACTION_GROUP',
                id: `act_${Date.now()}`,
                actions: [
                  {
                    id: 'act_load_minhang',
                    label: '进入：闵行区老年人口与床位分析',
                    actionCode: 'LOAD_MINHANG_SCENARIO',
                    variant: 'primary'
                  }
                ]
              }
            ]
          }
        ],
        resources: {},
        dataSolution: {
          items: [],
          gaps: [],
          relationshipEvidence: [],
          coverageSummary: [],
          limitationSummary: [],
          updatedAt: now
        },
        activeSurface: {
          type: 'CLOSED'
        },
        requirementRevision: 1,
        searchRevision: 0,
        createdAt: now,
        updatedAt: now
      };
    }

    // Minhang Bed Supply Scenario
    const task: FindDataTaskState = {
      taskId,
      title: '闵行区老年人口与养老床位供给水平分析',
      status: 'READY',
      scenarioKey: 'minhang_bed_supply',
      goal: '评估 2025 年 9 月至 2026 年 8 月，闵行区各街镇 60 岁及以上常住人口规模与在营养老床位供给水平，识别相对偏低街镇。',
      requirementHypothesis: MINHANG_INITIAL_HYPOTHESIS,
      searchScope: {
        domains: ['人口与统计', '民政与社会保障'],
        includeCrossDepartment: true
      },
      turns: [
        {
          turnId: 'turn_01_user',
          sender: 'USER',
          createdAt: now,
          blocks: [
            {
              type: 'TEXT',
              id: 'b_u01',
              content: initialQuery || '请帮我评估过去一年闵行区老年人口规模与养老床位供给水平，看看各街镇供给是否均衡，哪些街镇需要重点关注。'
            }
          ]
        },
        {
          turnId: 'turn_01_assistant',
          sender: 'ASSISTANT',
          createdAt: now,
          blocks: [
            {
              type: 'TEXT',
              id: 'b_a01',
              content:
                '已为您梳理闵行区养老服务评估的业务意图。根据上海市统计与民政指标规范，过去 12 个月（2025.09 — 2026.08）的核心基线核算建议聚焦在「60 岁及以上常住人口」与「在营可用养老床位」。'
            },
            {
              type: 'CLARIFICATION',
              id: 'b_c01',
              question: MINHANG_INITIAL_HYPOTHESIS.unresolvedQuestions[0]
            },
            {
              type: 'RESULT_BRIEF',
              id: 'b_rb01',
              briefKind: 'DIRECT_METRIC',
              title: '已定位 2 项高置信度官方指标（可直接用于问数）',
              candidates: [
                {
                  resourceId: 'r01',
                  title: '60 岁以上常住人口数',
                  typeBadge: '正式指标',
                  statusBadge: '可用于问数',
                  description: '按月统计各街镇 60 岁及以上常住人口总数，统计局/大数据中心官方口径。',
                  granularity: '街镇 × 月份'
                },
                {
                  resourceId: 'r04',
                  title: '在营可用养老床位数',
                  typeBadge: '正式指标',
                  statusBadge: '可用于问数',
                  description: '民政核定在营可用养老床位总数，按街镇月度统计。',
                  granularity: '街镇 × 月份'
                }
              ],
              primaryAction: {
                label: '打开当前数据方案',
                actionCode: 'OPEN_SOLUTION'
              },
              secondaryAction: {
                label: '展开底册与快照对比',
                actionCode: 'OPEN_COMPARE'
              }
            }
          ]
        }
      ],
      resources: MINHANG_RESOURCES,
      dataSolution: MINHANG_DATA_SOLUTION,
      activeResourceId: 'r03',
      activeSurface: {
        type: 'CLOSED'
      },
      requirementRevision: 1,
      searchRevision: 1,
      askPlan: MINHANG_ASK_PLAN,
      createdAt: now,
      updatedAt: now
    };

    return task;
  }

  async submitTurn(
    task: FindDataTaskState,
    text: string
  ): Promise<FindDataEngineResult> {
    const intent = determineInteractionIntent(text, task.activeSurface, task);
    const surfaceCommand: SurfaceCommand = evaluateSurfacePolicy(
      intent,
      undefined,
      task.activeSurface,
      task,
      text
    );

    const turnId = `turn_${Date.now()}_assistant`;
    const events: FindDataEvent[] = [];
    const blocks: ConversationBlock[] = [];

    // Check what the user asked
    const norm = text.toLowerCase();

    // 1. Question about fields without explicitly asking to open GUI
    if (norm.includes('字段') && intent === 'QUESTION') {
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `常住人口月度快照 (r03) 包含 18 个治理字段，重点字段包括：\n• **主体与空间**：人口唯一标识码 (person_id)、快照统计月份 (snapshot_month)、所属街镇代码 (street_town_code)、居村委会代码 (community_code)；\n• **老龄属性**：实足年龄 (age)、是否 60 岁及以上 (is_60_plus)、是否 80 岁高龄 (is_80_plus)、自理能力评级 (health_status_level)；\n• **治理有效性**：加工入库时间 (etl_time)、当前月度基准有效 (is_current_valid)。\n\n如需在右侧检视全部 18 个字段的详细物理类型与业务定义，可点击下方操作。`
      });
      blocks.push({
        type: 'ACTION_GROUP',
        id: `act_${Date.now()}`,
        actions: [
          {
            id: 'a_open_fields',
            label: '打开完整字段列表',
            actionCode: 'OPEN_FIELDS',
            variant: 'primary'
          }
        ]
      });
    } else if (norm.includes('适合') || norm.includes('为什么推荐')) {
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `针对您的问题：\n• **正式指标 (r01 / r04)**：是当前基线比率分析的最优解，因为它们按月度和街镇固化，口径稳定、开箱即查，不需要经过复杂的人口明细关联，能够以极低开销回答全区各街镇的加权供给水平。\n• **月度快照 (r03)**：作为“可选下钻资源”，主要在您需要探究某街镇内部“不同年龄段”或“轻中重度失能”老年人分布时提供明细支撑。`
      });
    } else if (norm.includes('缺什么') || norm.includes('不足') || norm.includes('局限')) {
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `当前方案已识别 1 项业务缺口：\n• **全面养老服务使用情况缺口**：当前仅掌握床位供给与居家订单，尚未纳入门诊医养结合与长护险日常结算数据。\n• **应对控制**：在分析结果中严格限定为「在营床位相对供给水平评价」，严禁直接下定论为整体养老供需不足。`
      });
    } else if (intent === 'OPEN_SURFACE') {
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `已为您在右侧工作区打开相应视图。`
      });
    } else {
      // General assistant reply
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `已根据您的指示更新任务上下文。当前数据方案已就绪，核心指标已完成权限预检，可随时由找数据转入分析计划。`
      });
    }

    events.push({
      type: 'ASSISTANT_TURN_RECEIVED',
      payload: {
        turnId,
        blocks
      }
    });

    if (surfaceCommand.action === 'OPEN' || surfaceCommand.action === 'REPLACE') {
      events.push({
        type: 'SURFACE_OPENED',
        payload: {
          type: surfaceCommand.surface || 'SOLUTION',
          resourceIds: surfaceCommand.resourceIds,
          openedBy: surfaceCommand.openedBy
        }
      });
    } else if (surfaceCommand.action === 'CLOSE') {
      events.push({
        type: 'SURFACE_CLOSED'
      });
    }

    return {
      events,
      assistantBlocks: blocks,
      surfaceCommand
    };
  }

  async executeAction(
    task: FindDataTaskState,
    action: TaskAction
  ): Promise<FindDataEngineResult> {
    const events: FindDataEvent[] = [];
    const blocks: ConversationBlock[] = [];
    const turnId = `turn_act_${Date.now()}`;

    const surfaceCommand = evaluateSurfacePolicy(
      'TASK_ACTION',
      action.actionCode,
      task.activeSurface,
      task
    );

    switch (action.actionCode) {
      case 'OPEN_COMPARE':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'COMPARE',
            resourceIds: ['r02', 'r03'],
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'SELECT_RESOURCE': {
        const resourceId = (action.payload?.resourceId as string) || 'r03';
        events.push({
          type: 'RESOURCE_SELECTED',
          payload: { resourceId }
        });
        blocks.push({
          type: 'SYSTEM_NOTICE',
          id: `sn_${Date.now()}`,
          level: 'success',
          title: '已确认优选资源',
          message: `已锁定「${task.resources[resourceId]?.name || resourceId}」作为候选人口明细下钻资源，并更新至当前数据方案。`
        });
        break;
      }

      case 'OPEN_FIELDS': {
        const resourceId = (action.payload?.resourceId as string) || task.activeResourceId || 'r03';
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'FIELDS',
            resourceIds: [resourceId],
            openedBy: 'ACTION_CLICK'
          }
        });
        break;
      }

      case 'OPEN_SOLUTION':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'SOLUTION',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'OPEN_ACCESS':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'ACCESS',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'OPEN_CATALOG':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'CATALOG',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'PREPARE_ASK_PLAN':
      case 'OPEN_ASK_PLAN':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'ASK_PLAN',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'KEEP_AS_GAP': {
        // AC-08: KEEP_AS_GAP only updates DataSolution.gaps, does NOT open SOLUTION!
        events.push({
          type: 'SOLUTION_GAP_UPSERTED',
          payload: {
            gap: {
              id: 'gap_home_care',
              title: '居家养老服务深度明细缺口',
              description: '仅保留床位供给核心指标，将居家上门服务作为缺口说明留存，不在本次供给基线中强行合并。',
              impactLevel: 'LOW',
              mitigation: '在分析报告中注明床位供给与居家服务分立说明。',
              status: 'ACKNOWLEDGED'
            }
          }
        });
        blocks.push({
          type: 'SYSTEM_NOTICE',
          id: `sn_${Date.now()}`,
          level: 'info',
          title: '缺口留存',
          message: '已将「居家养老服务订单」作为缺口补充留存至数据方案，不引入本次床位供给基线计算。'
        });
        break;
      }

      case 'EXPAND_SCOPE': {
        // AC-09: EXPAND_SCOPE updates searchScope and bumps searchRevision
        const nextRevision = task.searchRevision + 1;
        events.push({
          type: 'SEARCH_STARTED',
          payload: {
            searchRevision: nextRevision,
            scope: {
              expandedDomains: ['卫生健康', '社区综合服务', '民政养老']
            },
            statusMessage: '正在扩展检索范围至卫生健康与社区综合服务…'
          }
        });
        // Results
        events.push({
          type: 'SEARCH_RESULTS_RECEIVED',
          payload: {
            requirementRevision: task.requirementRevision,
            searchRevision: nextRevision,
            discoveredResourceIds: ['r05', 'r06'],
            solutionItems: [
              {
                resourceId: 'r05',
                role: 'OPTIONAL_DRILLDOWN',
                inclusionState: 'RECOMMENDED',
                coverage: ['全区在编审批核定床位数'],
                limitations: ['不代表当前已开营可用床位'],
                evidenceRefs: ['可用于计算核定床位转化为在营床位的利用率'],
                availabilityByAction: MINHANG_RESOURCES.r05.availabilityByAction
              }
            ]
          }
        });
        blocks.push({
          type: 'TEXT',
          id: `txt_${Date.now()}`,
          content: '已将检索范围拓展至民政与社区服务领域，补充发现 1 项官方指标「养老床位核定数 (r05)」，可用于对比核定与在营转化率。'
        });
        break;
      }

      case 'LOAD_MINHANG_SCENARIO': {
        const minhangTask = await this.createTask({ initialQuery: '闵行区老年人口与养老床位供给水平分析' });
        events.push({
          type: 'TASK_HYDRATED',
          payload: { task: minhangTask }
        });
        break;
      }

      default:
        break;
    }

    if (blocks.length > 0) {
      events.push({
        type: 'ASSISTANT_TURN_RECEIVED',
        payload: {
          turnId,
          blocks
        }
      });
    }

    return {
      events,
      assistantBlocks: blocks,
      surfaceCommand
    };
  }

  async recheckPermissions(
    task: FindDataTaskState,
    resourceIds: ResourceId[],
    _action: 'query' | 'preview' | 'export'
  ): Promise<PermissionRecheckResult> {
    const updatedPermissions: Record<ResourceId, AvailabilityByAction> = {};
    for (const id of resourceIds) {
      const res = task.resources[id];
      if (res) {
        updatedPermissions[id] = {
          ...res.availabilityByAction
        };
      }
    }

    // In Minhang fixture, core resources r01 and r04 are fully ALLOWED for query
    return {
      decision: 'ALLOWED',
      updatedPermissions,
      details: '核心计算指标「60 岁以上常住人口数」与「在营可用养老床位数」均具备直接查询权限，权限重校验通过。'
    };
  }

  async runAskPlan(
    _task: FindDataTaskState,
    askPlan: AskPlan
  ): Promise<AskRunResult> {
    const executedAt = new Date().toISOString();

    return {
      success: true,
      executedAt,
      permissionSnapshot: {
        r01: MINHANG_RESOURCES.r01.availabilityByAction,
        r04: MINHANG_RESOURCES.r04.availabilityByAction
      },
      resultArtifact: {
        districtWeightedAverage: '24.8 张 / 千人',
        totalPopulation: '41.2 万人',
        totalBeds: '10,218 张',
        lowSupplyTowns: [
          {
            townName: '浦锦街道',
            supplyRatio: '14.2 张 / 千人',
            differencePct: '低于全区 -42.7%'
          },
          {
            townName: '七宝镇',
            supplyRatio: '16.5 张 / 千人',
            differencePct: '低于全区 -33.5%'
          }
        ],
        boundaryNotice: askPlan.calculationSpec.strictConclusionBoundary
      }
    };
  }
}

export const defaultFindDataService = new MockFindDataService();
