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
  AvailabilityByAction,
  PermissionRequestRef,
  DataSolutionItem
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
  MINHANG_ASK_PLAN,
  MINHANG_COMPARISON_MODEL
} from '../fixtures/minhangBedSupplyFixture';

/**
 * P0-03: Strict scenario matching:
 * Matches ONLY when:
 * 1. scenarioKey === 'minhang_pension' or 'minhang_bed_supply'
 * OR
 * 2. Natural language text simultaneously satisfies:
 *    - Region intent: contains '上海' or '闵行'
 *    AND
 *    - Core business intent: contains '养老' or '床位'
 *    AND
 *    - Population intent: contains '人口' or '老年'
 */
export function isMinhangAgingScenario(query?: string, scenarioKey?: string): boolean {
  if (scenarioKey === 'minhang_pension' || scenarioKey === 'minhang_bed_supply') {
    return true;
  }
  if (!query) return false;
  const q = query.toLowerCase();

  const hasRegion = q.includes('上海') || q.includes('闵行');
  const hasBusiness = q.includes('养老') || q.includes('床位');
  const hasPopulation = q.includes('人口') || q.includes('老年') || q.includes('老人') || q.includes('老龄');

  return hasRegion && hasBusiness && hasPopulation;
}

export class MockFindDataService implements FindDataService {
  /**
   * P0-01 & P0-02: Clean empty task creation
   * Does NOT pre-fill assistant or user turns in createTask.
   * Does NOT load Minhang fixtures into clean empty task.
   */
  async createTask(input?: { initialQuery?: string }): Promise<FindDataTaskState> {
    const taskId = `task_${Date.now()}`;
    const initialQuery = input?.initialQuery?.trim() || '';
    const now = new Date().toISOString();

    const title = initialQuery
      ? (initialQuery.length > 24 ? `${initialQuery.slice(0, 24)}...` : initialQuery)
      : '新建找数据任务';

    return {
      taskId,
      title,
      status: 'IDLE',
      scenarioKey: 'generic',
      goal: initialQuery || '',
      requirementHypothesis: {
        dimensions: [],
        analysisFocus: [],
        assumptions: [],
        unresolvedQuestions: []
      },
      searchScope: {
        domains: [],
        includeCrossDepartment: true
      },
      turns: [],
      resources: {},
      searchResult: {
        totalMatches: 0,
        candidateIds: [],
        returnedCount: 0,
        query: ''
      },
      dataSolution: {
        items: [],
        gaps: [],
        relationshipEvidence: [],
        coverageSummary: [],
        limitationSummary: [],
        updatedAt: now
      },
      permissionRequests: {},
      activeResourceId: undefined,
      activeSurface: {
        type: 'CLOSED',
        mode: 'QUICK_PREVIEW'
      },
      requirementRevision: 0,
      searchRevision: 0,
      runtimeStatus: {
        active: false,
        message: ''
      },
      askPlan: undefined,
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
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
    const norm = text.toLowerCase();

    // 1. Check if user triggers Minhang Bed Supply scenario
    const isMinhang = isMinhangAgingScenario(text, task.scenarioKey);

    if (isMinhang) {
      // Full Minhang bed supply flow
      const nextReqRev = task.requirementRevision === 0 ? 1 : task.requirementRevision;
      const nextSearchRev = task.searchRevision === 0 ? 1 : task.searchRevision + 1;

      // Update requirement hypothesis
      events.push({
        type: 'REQUIREMENT_UPDATED',
        payload: {
          hypothesis: MINHANG_INITIAL_HYPOTHESIS,
          bumpRevision: task.requirementRevision === 0
        }
      });

      // Search started
      events.push({
        type: 'SEARCH_STARTED',
        payload: {
          searchRevision: nextSearchRev,
          scope: {
            domains: ['人口与统计', '民政与社会保障']
          },
          statusMessage: '正在检索匹配的数据资产与指标…'
        }
      });

      // Filter out negative sample r_neg_rescue from upserts
      const discoverableResources = Object.values(MINHANG_RESOURCES).filter(
        (res) => res.availabilityByAction.discover !== 'DENIED'
      );

      // Search results received
      events.push({
        type: 'SEARCH_RESULTS_RECEIVED',
        payload: {
          requirementRevision: nextReqRev,
          searchRevision: nextSearchRev,
          query: text,
          totalMatches: 2,
          candidateSnapshot: [
            { resourceId: 'r01', title: '60 岁以上常住人口数', score: 0.98, reason: '官方正式指标 · 统计口径稳定' },
            { resourceId: 'r04', title: '在营可用养老床位数', score: 0.96, reason: '市民政局核准在营指标' }
          ],
          resourceUpserts: discoverableResources,
          discoveredResourceIds: ['r01', 'r04'],
          solutionItems: MINHANG_DATA_SOLUTION.items,
          gaps: MINHANG_DATA_SOLUTION.gaps
        }
      });

      // Prepare Ask Plan
      events.push({
        type: 'ASK_PLAN_PREPARED',
        payload: {
          askPlan: MINHANG_ASK_PLAN
        }
      });

      // Set comparison model
      events.push({
        type: 'TASK_HYDRATED',
        payload: {
          task: {
            ...task,
            scenarioKey: 'minhang_pension',
            comparisonModel: MINHANG_COMPARISON_MODEL
          }
        }
      });

      // Assistant conversation blocks
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}_intro`,
        content:
          '已为您梳理闵行区养老服务评估的业务意图。根据上海市统计与民政指标规范，过去 12 个月（2025.09 — 2026.08）的核心基线核算建议聚焦在「60 岁及以上常住人口」与「在营可用养老床位」。'
      });

      blocks.push({
        type: 'CLARIFICATION',
        id: `clar_${Date.now()}`,
        question: MINHANG_INITIAL_HYPOTHESIS.unresolvedQuestions[0]
      });

      blocks.push({
        type: 'RESULT_BRIEF',
        id: `rb_${Date.now()}`,
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
      });
    } else if (norm === '养老' || (norm.includes('养老') && !norm.includes('闵行') && !norm.includes('上海'))) {
      // Single keyword '养老': triggers clarification question without loading Minhang fixtures
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: '您好！已接收关于「养老」领域的找数据诉求。为了准确定位官方数据资产与统计指标，需要进一步明确具体的空间范围与业务维度：'
      });

      blocks.push({
        type: 'CLARIFICATION',
        id: `clar_${Date.now()}`,
        question: {
          id: 'q_pension_scope',
          question: '您关注的是哪个区县或业务维度的养老数据？',
          type: 'SINGLE',
          options: [
            { id: 'opt_minhang', label: '上海市闵行区老年人口与养老床位（已预置高保真方案）' },
            { id: 'opt_citywide', label: '上海市全市养老机构与综合服务数据' },
            { id: 'opt_homecare', label: '社区居家养老服务与长护险' }
          ]
        }
      });
    } else if (norm === '人口' || (norm.includes('人口') && !norm.includes('闵行') && !norm.includes('养老'))) {
      // Single keyword '人口': generic clarification without loading Minhang fixtures
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: '已接收关于「人口」主题的检索需求。请明确您关注的人口统计范围与分析维度：'
      });

      blocks.push({
        type: 'CLARIFICATION',
        id: `clar_${Date.now()}`,
        question: {
          id: 'q_pop_scope',
          question: '请明确您关注的人口统计口径与分析方向：',
          type: 'MULTIPLE',
          options: [
            { id: 'opt_resident_aging', label: '常住人口与老龄化分布（60岁以上）' },
            { id: 'opt_household', label: '户籍人口与家庭结构变动' },
            { id: 'opt_migrant', label: '流动人口与就业动态' }
          ]
        }
      });
    } else if (norm.includes('字段') && intent === 'QUESTION') {
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
        content: '已为您在右侧工作区打开相应视图。'
      });
    } else {
      // Generic non-matching query
      blocks.push({
        type: 'TEXT',
        id: `txt_${Date.now()}`,
        content: `已接收您的诉求：「${text}」。\n\n语义分析引擎未在当前默认业务域内匹配到直接关联的已上线数据方案。您可以进一步提供具体的区县范围、时间跨度或指标名称，以便系统定位适合的数据资产。`
      });
      blocks.push({
        type: 'ACTION_GROUP',
        id: `act_${Date.now()}`,
        actions: [
          {
            id: 'act_demo_minhang',
            label: '查看演示场景：闵行区老年人口与养老床位供给分析',
            actionCode: 'LOAD_MINHANG_SCENARIO',
            variant: 'primary'
          }
        ]
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
          openedBy: surfaceCommand.openedBy,
          mode: surfaceCommand.surface === 'COMPARE' ? 'QUICK_PREVIEW' : 'WORKBENCH'
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
      case 'OPEN_COMPARE': {
        const compareIds = (action.payload?.resourceIds as string[]) || task.comparisonModel?.resourceIds || ['r02', 'r03'];
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'COMPARE',
            mode: 'QUICK_PREVIEW',
            resourceIds: compareIds,
            openedBy: 'ACTION_CLICK'
          }
        });
        break;
      }

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
        const resourceId = (action.payload?.resourceId as string) || task.activeResourceId || Object.keys(task.resources)[0];
        if (resourceId) {
          events.push({
            type: 'SURFACE_OPENED',
            payload: {
              type: 'FIELDS',
              mode: 'WORKBENCH',
              resourceIds: [resourceId],
              openedBy: 'ACTION_CLICK'
            }
          });
        }
        break;
      }

      case 'OPEN_SOLUTION':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'SOLUTION',
            mode: 'WORKBENCH',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'OPEN_ACCESS':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'ACCESS',
            mode: 'WORKBENCH',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'OPEN_CATALOG':
        events.push({
          type: 'SURFACE_OPENED',
          payload: {
            type: 'CATALOG',
            mode: 'WORKBENCH',
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
            mode: 'WORKBENCH',
            openedBy: 'ACTION_CLICK'
          }
        });
        break;

      case 'KEEP_AS_GAP': {
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
                evidenceRefs: ['可用于计算核定床位转化为在营床位的利用率']
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

      case 'SUBMIT_CLARIFICATION': {
        // P0-04: Submit clarification question answer
        const questionId = action.payload?.questionId as string;
        const selectedOptionIds = (action.payload?.selectedOptionIds as string[]) || [];

        // If user chose Minhang in single-choice clarification
        if (selectedOptionIds.includes('opt_minhang')) {
          const result = await this.submitTurn(task, '请帮我评估过去一年闵行区老年人口规模与养老床位供给水平');
          return result;
        }

        events.push({
          type: 'REQUIREMENT_UPDATED',
          payload: {
            hypothesis: {
              analysisFocus: selectedOptionIds
            },
            bumpRevision: true
          }
        });

        blocks.push({
          type: 'TEXT',
          id: `txt_${Date.now()}`,
          content: `已记录您的澄清确认。分析焦点已聚焦于选定的核心业务维度，当前方案已相应校准。`
        });
        break;
      }

      case 'EVALUATE_AND_ADD': {
        // P0-10: Catalog "Evaluate and Add"
        const resId = action.payload?.resourceId as string;
        const res = task.resources[resId] || MINHANG_RESOURCES[resId];

        if (resId === 'r06') {
          const newItem: DataSolutionItem = {
            resourceId: 'r06',
            role: 'OPTIONAL_DRILLDOWN',
            inclusionState: 'RECOMMENDED',
            coverage: ['闵行区登记在册养老机构名录'],
            limitations: ['机构层级名录，缺少实时床位动态占用流'],
            evidenceRefs: ['可用于解释各街镇床位供给主要由哪些具体机构提供']
          };
          events.push({
            type: 'SOLUTION_ITEM_UPSERTED',
            payload: { item: newItem }
          });
          blocks.push({
            type: 'TEXT',
            id: `txt_${Date.now()}`,
            content: '已完成对「养老机构名录 (r06)」的语义适配度评估，并将其作为「可选下钻资源」加入数据方案。'
          });
        } else if (resId === 'r07') {
          const newItem: DataSolutionItem = {
            resourceId: 'r07',
            role: 'PARTIAL_MATCH',
            inclusionState: 'NOT_INCLUDED',
            coverage: ['居家上门助餐、助洁服务记录'],
            limitations: ['仅反映居家上门服务，不代表机构养老等完整养老服务体系'],
            evidenceRefs: ['已声明为当前方案缺口，不参与本次床位供给基线计算']
          };
          events.push({
            type: 'SOLUTION_ITEM_UPSERTED',
            payload: { item: newItem }
          });
          events.push({
            type: 'SOLUTION_GAP_UPSERTED',
            payload: {
              gap: {
                id: 'gap_homecare_partial',
                title: '居家服务订单非完全覆盖缺口',
                description: '该资源仅反映居家上门服务，已作为方案缺口纳管。',
                impactLevel: 'LOW',
                mitigation: '在分析中保持分立说明。',
                status: 'ACKNOWLEDGED'
              }
            }
          });
          blocks.push({
            type: 'TEXT',
            id: `txt_${Date.now()}`,
            content: '已评估「居家养老服务记录 (r07)」，识别为部分匹配资源，作为业务缺口补充纳管，不强行合并入床位供给基线。'
          });
        } else if (res) {
          const newItem: DataSolutionItem = {
            resourceId: resId,
            role: 'OPTIONAL_DRILLDOWN',
            inclusionState: 'RECOMMENDED',
            coverage: [res.name],
            limitations: ['需根据具体分析下钻路径进一步确定口径'],
            evidenceRefs: ['用户在资产目录中主动关联']
          };
          events.push({
            type: 'SOLUTION_ITEM_UPSERTED',
            payload: { item: newItem }
          });
          blocks.push({
            type: 'TEXT',
            id: `txt_${Date.now()}`,
            content: `已完成对「${res.name}」的适配度评估并加入数据方案。`
          });
        } else {
          blocks.push({
            type: 'SYSTEM_NOTICE',
            id: `sn_${Date.now()}`,
            level: 'warning',
            title: '暂未纳入方案',
            message: '当前尚无足够语义与关系证据将该资源加入方案。'
          });
        }
        break;
      }

      case 'CREATE_PERMISSION_REQUEST': {
        // P0-09: Permission application creation
        const resourceIds = (action.payload?.resourceIds as string[]) || [];
        const actionType = (action.payload?.actionType as 'query' | 'preview' | 'export') || 'query';
        const requestId = `req_${Date.now().toString(36)}`;

        const requestRef: PermissionRequestRef = {
          requestId,
          resourceIds,
          actionType,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString()
        };

        events.push({
          type: 'PERMISSION_REQUEST_CREATED',
          payload: { request: requestRef }
        });

        blocks.push({
          type: 'SYSTEM_NOTICE',
          id: `sn_${Date.now()}`,
          level: 'success',
          title: '权限申请已提交',
          message: `申请单已生成（单号：${requestId}），包含 ${resourceIds.length} 项资源的 ${actionType === 'query' ? '查询' : actionType} 权限，请等待审核审批。`
        });
        break;
      }

      case 'REVISE_REQUIREMENT': {
        // P0-12: Requirement revision
        const patch = action.payload?.hypothesisPatch || {};
        const nextReqRev = task.requirementRevision + 1;
        const nextSearchRev = task.searchRevision + 1;

        events.push({
          type: 'REQUIREMENT_UPDATED',
          payload: {
            hypothesis: patch,
            bumpRevision: true
          }
        });

        events.push({
          type: 'SEARCH_STARTED',
          payload: {
            searchRevision: nextSearchRev,
            statusMessage: '根据修订后的口径重新检索方案…'
          }
        });

        events.push({
          type: 'SEARCH_RESULTS_RECEIVED',
          payload: {
            requirementRevision: nextReqRev,
            searchRevision: nextSearchRev,
            discoveredResourceIds: Object.keys(task.resources),
            solutionItems: task.dataSolution.items,
            gaps: task.dataSolution.gaps
          }
        });

        blocks.push({
          type: 'TEXT',
          id: `txt_${Date.now()}`,
          content: '已根据修订后的业务假设与口径重新完成数据方案评估与检索。'
        });
        break;
      }

      case 'LOAD_MINHANG_SCENARIO': {
        // Submit the canonical Minhang prompt
        const res = await this.submitTurn(task, '请帮我评估过去一年闵行区老年人口规模与养老床位供给水平，看看各街镇供给是否均衡，哪些街镇需要重点关注。');
        return res;
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
      dataOrigin: 'MOCK_FIXTURE',
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
