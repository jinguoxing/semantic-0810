import { FieldItemData, TestResource, DialogueMessage } from './FindDataTypes';

// Fixed Test Resources according to specification
export const TEST_RESOURCES: Record<string, TestResource> = {
  r01: {
    id: 'r01',
    name: '60 岁以上常住人口数',
    type: '正式指标',
    granularity: '街镇 × 月份',
    timeCoverage: '2025.09 — 2026.08',
    status: '可直接问数',
    role: '核心人口口径',
    desc: '覆盖闵行区各街镇每月 60 岁及以上常住人口总数，支持街镇与月份维度。',
    permissions: {
      metadata: '允许',
      query: '可使用',
      samplePreview: '允许',
      export: '允许'
    }
  },
  r02: {
    id: 'r02',
    name: '人口基本信息视图',
    type: '数据资产',
    granularity: '一人一行',
    timeCoverage: '当前状态',
    status: '需申请',
    role: '人员明细候选',
    desc: '全区人口当前最新基础视图，仅在需要人员明细与人群细分时加入，不默认纳入聚合方案。',
    permissions: {
      metadata: '允许',
      query: '可申请',
      samplePreview: '可申请',
      export: '不可用'
    }
  },
  r03: {
    id: 'r03',
    name: '常住人口月度快照',
    type: '数据资产',
    granularity: '一人 × 一月',
    timeCoverage: '历史月度快照 (含 2025.09 — 2026.08)',
    status: '可直接问数',
    role: '人口趋势和人员月度明细下钻',
    desc: '按月固化的常住人口全量快照，适合查看过去 12 个月月度变化趋势与人员下钻。',
    permissions: {
      metadata: '允许',
      query: '可使用',
      samplePreview: '允许',
      export: '允许'
    }
  },
  r04: {
    id: 'r04',
    name: '行政区划',
    type: '数据资产',
    granularity: '一个行政区划编码一条记录',
    timeCoverage: '当前最新版',
    status: '可直接使用',
    role: '条件性维度支撑',
    desc: '仅在街镇编码、名称或层级需要统一时进入执行方案，不默认加入所有计算。',
    permissions: {
      metadata: '允许',
      query: '可使用',
      samplePreview: '允许',
      export: '允许'
    }
  },
  r05: {
    id: 'r05',
    name: '在营可用养老床位数',
    type: '正式指标',
    granularity: '街镇 × 月份',
    timeCoverage: '2025.09 — 2026.08',
    status: '可直接问数',
    role: '核心床位供给口径',
    desc: '只表示在营机构当前可提供使用的养老床位，不是核定床位或历史最大床位。',
    permissions: {
      metadata: '允许',
      query: '可使用',
      samplePreview: '允许',
      export: '允许'
    }
  },
  r06: {
    id: 'r06',
    name: '养老机构基本信息',
    type: '数据资产',
    granularity: '一家机构一条记录',
    timeCoverage: '当前在营状态',
    status: '可直接使用',
    role: '可选下钻资源',
    desc: '用于解释某街镇的床位由哪些机构提供，不参与“每千名老人养老床位数”的核心计算。',
    permissions: {
      metadata: '允许',
      query: '可使用',
      samplePreview: '允许',
      export: '允许'
    }
  },
  r07: {
    id: 'r07',
    name: '居家养老服务订单',
    type: '数据资产',
    granularity: '一次居家养老服务一条记录',
    timeCoverage: '2025.09 — 2026.08',
    status: '需申请',
    role: '部分匹配',
    desc: '覆盖居家上门照护、助餐等服务订单，不能代表机构养老、全口径养老服务使用或全部老年人服务需求。',
    coverageNote: '居家养老服务实际使用记录',
    gapNote: '不代表机构养老与其他全口径养老服务需求',
    permissions: {
      metadata: '允许',
      query: '可申请',
      samplePreview: '可申请',
      export: '不可用'
    }
  }
};

// 18 Fixed Test Fields for 常住人口月度快照 (R03)
export const R03_FIELDS: FieldItemData[] = [
  {
    name: 'person_id',
    businessName: '人员标识',
    type: 'VARCHAR(64)',
    group: '主体标识与时间',
    role: '主体唯一业务主键',
    goalRelation: '人员排重与月度连续性追踪',
    isKey: true
  },
  {
    name: 'snapshot_month',
    businessName: '快照月份',
    type: 'VARCHAR(7)',
    group: '主体标识与时间',
    role: '核心时间分区键',
    goalRelation: '对齐 2025.09 至 2026.08 分析时间窗',
    isKey: true
  },
  {
    name: 'birth_date',
    businessName: '出生日期',
    type: 'DATE',
    group: '人员与老龄属性',
    role: '基础自然人属性',
    goalRelation: '用于周岁精准校验及老龄口径核对',
    isKey: false
  },
  {
    name: 'age',
    businessName: '年龄',
    type: 'INT',
    group: '人员与老龄属性',
    role: '核心老龄过滤属性',
    goalRelation: '筛选 age >= 60 岁老龄常住群体',
    isKey: false
  },
  {
    name: 'age_group',
    businessName: '年龄段',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '统计分析分组维度',
    goalRelation: '支持高龄（80+）或低龄老人结构下钻',
    isKey: false
  },
  {
    name: 'gender_code',
    businessName: '性别代码',
    type: 'VARCHAR(2)',
    group: '人员与老龄属性',
    role: '国家标准分类编码',
    goalRelation: '辅助人口性别结构校验',
    isKey: false
  },
  {
    name: 'household_type',
    businessName: '户籍类型',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '户籍管理分类',
    goalRelation: '区分户籍与非户籍常住老年群体',
    isKey: false
  },
  {
    name: 'residence_status',
    businessName: '常住状态',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '常住人口口径过滤键',
    goalRelation: '限定为稳定常住人口口径',
    isKey: false
  },
  {
    name: 'district_code',
    businessName: '区级行政区划代码',
    type: 'VARCHAR(6)',
    group: '空间区划与归属',
    role: '空间分析宏观范围键',
    goalRelation: '限定闵行区（310112）',
    isKey: false
  },
  {
    name: 'street_code',
    businessName: '街镇代码',
    type: 'VARCHAR(12)',
    group: '空间区划与归属',
    role: '核心空间聚合键',
    goalRelation: '按各街镇汇总计算供给水平的核心关联字段',
    isKey: true
  },
  {
    name: 'community_code',
    businessName: '居村代码',
    type: 'VARCHAR(12)',
    group: '空间区划与归属',
    role: '居村级微观空间代码',
    goalRelation: '用于街镇内居村供给薄弱点下钻',
    isKey: false
  },
  {
    name: 'is_60_plus',
    businessName: '是否 60 岁及以上',
    type: 'VARCHAR(1)',
    group: '人员与老龄属性',
    role: '业务衍生布尔标志',
    goalRelation: '与老龄人口指标口径直接对应（Y/N）',
    isKey: false
  },
  {
    name: 'population_status',
    businessName: '人口状态',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '生命周期状态',
    goalRelation: '剔除注销、迁出等异常状态',
    isKey: false
  },
  {
    name: 'source_system',
    businessName: '来源系统',
    type: 'VARCHAR(32)',
    group: '治理与有效周期',
    role: '数据源血缘溯源',
    goalRelation: '标记公安人口库与网格化采集来源',
    isKey: false
  },
  {
    name: 'valid_from',
    businessName: '生效时间',
    type: 'DATETIME',
    group: '治理与有效周期',
    role: '版本控制生效时间戳',
    goalRelation: '历史快照记录有效性审计',
    isKey: false
  },
  {
    name: 'valid_to',
    businessName: '失效时间',
    type: 'DATETIME',
    group: '治理与有效周期',
    role: '版本控制失效时间戳',
    goalRelation: '历史快照记录失效性审计',
    isKey: false
  },
  {
    name: 'created_time',
    businessName: '创建时间',
    type: 'DATETIME',
    group: '治理与有效周期',
    role: '系统处理时间戳',
    goalRelation: '快照固化批次时间',
    isKey: false
  },
  {
    name: 'updated_time',
    businessName: '更新时间',
    type: 'DATETIME',
    group: '治理与有效周期',
    role: '系统最后维护时间戳',
    goalRelation: '记录最新校验时间',
    isKey: false
  }
];

// 14 Rounds of continuous script
export const DIALOGUE_ROUNDS: DialogueMessage[] = [
  // Round 1
  {
    id: 'msg-01-u',
    sender: 'user',
    text: '帮我看看闵行区老人养老情况。',
    turnIndex: 1
  },
  {
    id: 'msg-01-a',
    sender: 'assistant',
    text: '“养老情况”可能包括人口规模、养老床位供给、实际服务使用或公共服务诉求。你这次想先关注哪两方面？',
    briefType: 'clarify_choice',
    turnIndex: 1
  },

  // Round 2
  {
    id: 'msg-02-u',
    sender: 'user',
    text: '先看过去 12 个月，各街镇 60 岁以上常住人口和养老床位供给。',
    turnIndex: 2
  },
  {
    id: 'msg-02-a',
    sender: 'assistant',
    text: '我先按 2025 年 9 月至 2026 年 8 月、60 岁以上常住人口、在营可用养老床位和街镇维度理解。这个范围已经可以开始找数。',
    actionButtons: {
      weak: { label: '修改当前理解', actionKey: 'modify_understanding' }
    },
    turnIndex: 2
  },

  // Round 3
  {
    id: 'msg-03-u',
    sender: 'user',
    text: '先只看 2026 年 8 月各街镇 60 岁以上常住人口数，用哪项数据？',
    turnIndex: 3
  },
  {
    id: 'msg-03-a',
    sender: 'assistant',
    text: '建议直接使用正式指标“60 岁以上常住人口数”。它支持街镇和月份维度，覆盖 2026 年 8 月，当前可以直接进入问数。',
    briefType: 'single_metric',
    actionButtons: {
      primary: { label: '进入问数', actionKey: 'ask_data_single' },
      secondary: { label: '查看正式口径', actionKey: 'view_metric_spec' }
    },
    turnIndex: 3
  },

  // Round 4
  {
    id: 'msg-04-u',
    sender: 'user',
    text: '我还想看过去 12 个月的人口明细，哪张表更合适？',
    turnIndex: 4
  },
  {
    id: 'msg-04-a',
    sender: 'assistant',
    text: '看当前人口状态，更适合“人口基本信息视图”；看过去 12 个月的人员变化，更适合“常住人口月度快照”。基于你当前的时间范围，我建议使用月度快照。',
    briefType: 'candidate_summary',
    actionButtons: {
      primary: { label: '比较 2 项资源', actionKey: 'open_compare' },
      secondary: { label: '使用月度快照', actionKey: 'choose_snapshot' }
    },
    turnIndex: 4
  },

  // Round 5
  {
    id: 'msg-05-u',
    sender: 'user',
    text: '比较这两张表。',
    turnIndex: 5
  },
  {
    id: 'msg-05-a',
    sender: 'assistant',
    text: '已打开资源对比。这次主要比较时间形态、记录粒度、适合用途和问数状态。',
    turnIndex: 5
  },

  // Round 6
  {
    id: 'msg-06-u',
    sender: 'user',
    text: '这个表有哪些字段？',
    turnIndex: 6
  },
  {
    id: 'msg-06-a',
    sender: 'assistant',
    text: '“常住人口月度快照”当前有 18 个可见字段，主要覆盖人员标识、快照月份、年龄、户籍与常住状态以及所属街镇。其中快照月份、年龄和街镇字段与本次分析最相关。',
    actionButtons: {
      primary: { label: '查看全部 18 个字段', actionKey: 'open_fields' }
    },
    turnIndex: 6
  },

  // Round 7
  {
    id: 'msg-07-u',
    sender: 'user',
    text: '再加入养老服务实际使用情况。',
    turnIndex: 7
  },
  {
    id: 'msg-07-a',
    sender: 'assistant',
    text: '当前找到一项部分匹配资源：“居家养老服务订单”。它只能覆盖居家养老服务，不能完整代表机构养老和其他养老服务使用。现有的人口与床位方案会继续保留。',
    briefType: 'partial_match',
    actionButtons: {
      primary: { label: '查看部分匹配', actionKey: 'view_partial_match' },
      secondary: { label: '保留为方案缺口', actionKey: 'keep_as_gap' }
    },
    turnIndex: 7
  },

  // Round 8
  {
    id: 'msg-08-u',
    sender: 'user',
    text: '还要加入老年人心理咨询服务使用情况。',
    turnIndex: 8
  },
  {
    id: 'msg-08-a',
    sender: 'assistant',
    text: '当前可发现资源尚未覆盖“老年人心理咨询服务使用情况”。已有的人口和床位供给方案保持不变，我已将这一项保留为当前方案缺口。',
    actionButtons: {
      primary: { label: '扩大到卫生健康与社区服务范围', actionKey: 'expand_scope' },
      secondary: { label: '暂时保留缺口', actionKey: 'retain_gap' }
    },
    turnIndex: 8
  },

  // Round 9
  {
    id: 'msg-09-u',
    sender: 'user',
    text: '打开当前数据方案。',
    turnIndex: 9
  },
  {
    id: 'msg-09-a',
    sender: 'assistant',
    text: '已打开当前数据方案。完整资源、覆盖范围和方案缺口可以在右侧查看。',
    turnIndex: 9
  },

  // Round 10
  {
    id: 'msg-10-u',
    sender: 'user',
    text: '把人口基本信息视图和居家养老服务订单也加入，看看能不能直接分析。',
    turnIndex: 10
  },
  {
    id: 'msg-10-a',
    sender: 'assistant',
    text: '“人口基本信息视图”不是当前聚合分析的必需资源，加入后会引入人员级明细。“居家养老服务订单”只覆盖居家服务。这两项资源当前都需要申请查询权限。我建议先保留最小方案，只有确实需要人员细分或服务使用分析时再申请。',
    briefType: 'access_brief',
    actionButtons: {
      primary: { label: '保留最小方案', actionKey: 'keep_minimal_plan' },
      secondary: { label: '查看权限差异', actionKey: 'open_access' },
      weak: { label: '申请并继续', actionKey: 'apply_and_proceed' }
    },
    turnIndex: 10
  },

  // Round 11
  {
    id: 'msg-11-u',
    sender: 'user',
    text: '只使用当前可直接访问的数据。',
    turnIndex: 11
  },
  {
    id: 'msg-11-a',
    sender: 'assistant',
    text: '已按当前查询权限准备可执行范围。老年人口规模和养老床位供给分析可以继续；人员级明细和完整服务使用暂不进入本次执行，但仍保留在推荐与方案缺口中。',
    actionButtons: {
      primary: { label: '查看当前可执行范围', actionKey: 'view_executable_scope' },
      secondary: { label: '继续准备分析', actionKey: 'prepare_analysis' }
    },
    turnIndex: 11
  },

  // Round 12
  {
    id: 'msg-12-u',
    sender: 'user',
    text: '我先看看民政数据源里有哪些表。',
    turnIndex: 12
  },
  {
    id: 'msg-12-a',
    sender: 'assistant',
    text: '已进入民政数据源目录浏览。当前老年人口与床位供给分析任务会继续保留。',
    turnIndex: 12
  },

  // Round 13
  {
    id: 'msg-13-u',
    sender: 'user',
    text: '按当前可用资源，计算各街镇每千名老人养老床位数，并找出相对偏低的街镇。',
    turnIndex: 13
  },
  {
    id: 'msg-13-a',
    sender: 'assistant',
    text: '可以先按“在营可用养老床位数”除以“60 岁以上常住人口数”计算。还需要确认：你希望用什么基准判断“相对偏低”？',
    briefType: 'benchmark_choice',
    turnIndex: 13
  },

  // Round 14
  {
    id: 'msg-14-u',
    sender: 'user',
    text: '用在营可用床位，与全区加权平均比较。',
    turnIndex: 14
  },
  {
    id: 'msg-14-a',
    sender: 'assistant',
    text: '已基于当前数据方案准备分析计划。执行前会再次校验核心资源的查询权限。',
    actionButtons: {
      primary: { label: '查看分析计划', actionKey: 'open_ask_plan' }
    },
    turnIndex: 14
  }
];

export const SCENARIO_MILESTONES = [
  { key: 'clarification', label: '默认对话与最小澄清', maxTurn: 1, defaultSurface: 'CLOSED' as const, activeResource: '' },
  { key: 'direct_metric', label: '正式指标单资源直达', maxTurn: 3, defaultSurface: 'CLOSED' as const, activeResource: '60 岁以上常住人口数' },
  { key: 'candidate_summary', label: '多候选结果摘要', maxTurn: 4, defaultSurface: 'CLOSED' as const, activeResource: '' },
  { key: 'workspace_compare', label: '资源比较工作区', maxTurn: 5, defaultSurface: 'COMPARE' as const, activeResource: '常住人口月度快照' },
  { key: 'workspace_fields', label: '字段工作区', maxTurn: 6, defaultSurface: 'FIELDS' as const, activeResource: '常住人口月度快照' },
  { key: 'partial_match_gap', label: '部分匹配与当前方案缺口', maxTurn: 7, defaultSurface: 'CLOSED' as const, activeResource: '常住人口月度快照' },
  { key: 'workspace_solution', label: '数据方案工作区', maxTurn: 9, defaultSurface: 'SOLUTION' as const, activeResource: '常住人口月度快照' },
  { key: 'workspace_access', label: '权限差异工作区', maxTurn: 10, defaultSurface: 'ACCESS' as const, activeResource: '常住人口月度快照' },
  { key: 'workspace_catalog', label: '目录浏览工作区', maxTurn: 12, defaultSurface: 'CATALOG' as const, activeResource: '常住人口月度快照' },
  { key: 'workspace_ask_plan', label: 'Ask Data 分析计划工作区', maxTurn: 14, defaultSurface: 'ASK_PLAN' as const, activeResource: '常住人口月度快照' }
];
