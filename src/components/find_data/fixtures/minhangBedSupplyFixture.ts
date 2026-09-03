import {
  FindDataResource,
  FieldMetadata,
  ResourceComparisonRow,
  ResourceComparisonModel,
  DataSolution,
  AskPlan,
  RequirementHypothesis
} from '../model/FindDataTask';

export const R03_FIELDS: FieldMetadata[] = [
  {
    name: 'person_id',
    businessName: '人口唯一标识码',
    type: 'VARCHAR(64)',
    group: '主体标识与时间',
    role: '主键维度',
    goalRelation: '关联常住人口主体标识',
    isKey: true
  },
  {
    name: 'snapshot_month',
    businessName: '快照统计月份',
    type: 'CHAR(6)',
    group: '主体标识与时间',
    role: '时间主键',
    goalRelation: '覆盖 202509-202608 过去 12 个月时间轴',
    isKey: true
  },
  {
    name: 'district_code',
    businessName: '区划编码',
    type: 'VARCHAR(12)',
    group: '空间区划与归属',
    role: '区划过滤',
    goalRelation: '限定上海市闵行区（310112）',
    isKey: false
  },
  {
    name: 'street_town_code',
    businessName: '所属街镇代码',
    type: 'VARCHAR(12)',
    group: '空间区划与归属',
    role: '聚合维度',
    goalRelation: '支持闵行下辖 14 个街镇/园区切片聚合',
    isKey: false
  },
  {
    name: 'community_code',
    businessName: '居村委会代码',
    type: 'VARCHAR(12)',
    group: '空间区划与归属',
    role: '下钻维度',
    goalRelation: '支持街镇下进一步按居村委会穿透分析',
    isKey: false
  },
  {
    name: 'age',
    businessName: '实足年龄',
    type: 'SMALLINT',
    group: '人员与老龄属性',
    role: '度量计算',
    goalRelation: '可按年龄分段精细化分析老龄化结构',
    isKey: false
  },
  {
    name: 'is_60_plus',
    businessName: '是否 60 岁及以上',
    type: 'BOOLEAN',
    group: '人员与老龄属性',
    role: '过滤条件',
    goalRelation: '核心过滤口径（老年人口判定标准）',
    isKey: false
  },
  {
    name: 'is_80_plus',
    businessName: '是否 80 岁及以上高龄',
    type: 'BOOLEAN',
    group: '人员与老龄属性',
    role: '高龄标识',
    goalRelation: '辅助识别高龄失能高风险群体规模',
    isKey: false
  },
  {
    name: 'gender',
    businessName: '性别代码',
    type: 'CHAR(1)',
    group: '人员与老龄属性',
    role: '人群维度',
    goalRelation: '老年人口性别比结构分析',
    isKey: false
  },
  {
    name: 'residence_type',
    businessName: '居住类型',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '常住属性',
    goalRelation: '户籍常住 / 外来常住判定',
    isKey: false
  },
  {
    name: 'living_status',
    businessName: '居住现状',
    type: 'VARCHAR(24)',
    group: '人员与老龄属性',
    role: '家庭结构',
    goalRelation: '独居 / 纯老家庭 / 与子女同住区分',
    isKey: false
  },
  {
    name: 'health_status_level',
    businessName: '自理能力评级',
    type: 'VARCHAR(16)',
    group: '人员与老龄属性',
    role: '照护需求',
    goalRelation: '轻度 / 中度 / 重度失能分级参考',
    isKey: false
  },
  {
    name: 'disability_cert_flag',
    businessName: '持残疾证标识',
    type: 'BOOLEAN',
    group: '人员与老龄属性',
    role: '特殊优待',
    goalRelation: '困难失能老年人叠加补助核验',
    isKey: false
  },
  {
    name: 'etl_time',
    businessName: '加工入库时间',
    type: 'TIMESTAMP',
    group: '治理与有效周期',
    role: '数据治理',
    goalRelation: '数据血缘追踪与溯源核对',
    isKey: false
  },
  {
    name: 'data_status',
    businessName: '数据状态有效性',
    type: 'CHAR(1)',
    group: '治理与有效周期',
    role: '质量过滤',
    goalRelation: '过滤逻辑注销与无效记录',
    isKey: false
  },
  {
    name: 'source_system',
    businessName: '业务数据来源系统',
    type: 'VARCHAR(32)',
    group: '治理与有效周期',
    role: '来源标识',
    goalRelation: '标识来自公安户籍与社区综合排摸底册',
    isKey: false
  },
  {
    name: 'ver_num',
    businessName: '版本批次号',
    type: 'INT',
    group: '治理与有效周期',
    role: '治理校验',
    goalRelation: '月度版本快照一致性控制',
    isKey: false
  },
  {
    name: 'is_current_valid',
    businessName: '当前月度基准有效',
    type: 'BOOLEAN',
    group: '治理与有效周期',
    role: '有效性标记',
    goalRelation: '核验快照当月封存有效性',
    isKey: false
  }
];

export const MINHANG_RESOURCES: Record<string, FindDataResource> = {
  r01: {
    id: 'r01',
    name: '60 岁以上常住人口数',
    type: '正式指标',
    granularity: '街镇 × 月份',
    timeCoverage: '2023.01 — 2026.08',
    department: '统计局 / 大数据中心',
    desc: '按月统计各街镇 60 岁及以上常住人口总数，口径与第七次人口普查基准一致。',
    roleNote: '本次计算核心指标（分母）',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'ALLOWED',
      query: 'ALLOWED',
      export: 'ALLOWED'
    }
  },
  r02: {
    id: 'r02',
    name: '人口基本信息视图',
    type: '数据资产',
    granularity: '一人一行（实时最新）',
    timeCoverage: '当前实时最新状态',
    department: '市公安局 / 大数据中心',
    desc: '全市人口基本身份与户籍视图，实时更新，不保留历史月度快照。',
    roleNote: '人员明细候选，当前聚合分析非必需',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'REQUESTABLE',
      query: 'REQUESTABLE',
      export: 'DENIED'
    },
    fields: [
      {
        name: 'person_id',
        businessName: '人口唯一标识码',
        type: 'VARCHAR(64)',
        group: '主体标识与时间',
        role: '主键维度',
        goalRelation: '人口唯一标识',
        isKey: true
      },
      {
        name: 'age',
        businessName: '实时年龄',
        type: 'SMALLINT',
        group: '人员与老龄属性',
        role: '度量计算',
        goalRelation: '当前实时年龄',
        isKey: false
      }
    ]
  },
  r03: {
    id: 'r03',
    name: '常住人口月度快照',
    type: '数据资产',
    granularity: '一人一月（按月固化）',
    timeCoverage: '2024.01 — 2026.08',
    department: '市大数据中心',
    desc: '常住人口底册按月快照，包含年龄、所属街镇、居住属性及失能分级等明细。',
    roleNote: '可选下钻资源，适合过去 12 个月月度明细下钻分析',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'ALLOWED',
      query: 'ALLOWED',
      export: 'DENIED'
    },
    fields: R03_FIELDS
  },
  r04: {
    id: 'r04',
    name: '在营可用养老床位数',
    type: '正式指标',
    granularity: '街镇 × 月份',
    timeCoverage: '2024.01 — 2026.08',
    department: '市民政局',
    desc: '经民政部门核定且在营、可接收老人入住的养老床位总数（含保基本床位）。',
    roleNote: '本次计算核心指标（分子）',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'ALLOWED',
      query: 'ALLOWED',
      export: 'ALLOWED'
    }
  },
  r05: {
    id: 'r05',
    name: '养老床位核定数',
    type: '正式指标',
    granularity: '街镇 × 月份',
    timeCoverage: '2024.01 — 2026.08',
    department: '市民政局',
    desc: '机构审批核定的设计总床位数，包含筹建与暂未投用床位。',
    roleNote: '可选下钻资源，用于对比核定与在营床位转化率',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'ALLOWED',
      query: 'ALLOWED',
      export: 'ALLOWED'
    }
  },
  r06: {
    id: 'r06',
    name: '养老机构基本信息',
    type: '数据资产',
    granularity: '一家机构一条记录',
    timeCoverage: '在营最新名录',
    department: '市民政局',
    desc: '登记在册的在营养老机构名录，含统一社会信用代码、机构名称、所在街镇、床位核定数。',
    roleNote: '可选下钻资源 · 解释某街镇床位提供机构',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'ALLOWED',
      query: 'ALLOWED',
      export: 'DENIED'
    }
    // Intentionally no fields registered in fixture, to demonstrate credible empty state for AC-06 & AC-07
  },
  r07: {
    id: 'r07',
    name: '居家养老服务订单',
    type: '数据资产',
    granularity: '一次居家养老服务一条记录',
    timeCoverage: '2025.01 — 2026.08',
    department: '市民政局',
    desc: '上门照料、助洁助餐等居家养老服务派单与完成记录。',
    roleNote: '部分匹配 · 仅覆盖居家上门服务，不代表机构养老',
    availabilityByAction: {
      discover: 'ALLOWED',
      viewMetadata: 'ALLOWED',
      preview: 'REQUESTABLE',
      query: 'REQUESTABLE',
      export: 'DENIED'
    }
  },

  // NEGATIVE TEST SAMPLE:
  // Must be strictly filtered out by all discover selectors, catalog, search, and assistant summaries.
  r_neg_rescue: {
    id: 'r_neg_rescue',
    name: '困难老年人救助对象明细',
    type: '数据资产',
    granularity: '一人一行',
    timeCoverage: '2025.01 — 2026.08',
    department: '市民政局社会救助处',
    desc: '包含特困、低保及低收入困难老人的身份证件、住址与银行补贴发放流水。',
    roleNote: '绝密敏感数据 · 未开放目录发现',
    availabilityByAction: {
      discover: 'DENIED',
      viewMetadata: 'DENIED',
      preview: 'DENIED',
      query: 'DENIED',
      export: 'DENIED'
    }
  }
};

export const MINHANG_COMPARISON_ROWS: ResourceComparisonRow[] = [
  {
    dimension: '时间形态',
    values: {
      r02: '当前状态（实时最新）',
      r03: '历史月度快照（按月固化）'
    },
    highlightResourceId: 'r03'
  },
  {
    dimension: '记录粒度',
    values: {
      r02: '一人一行',
      r03: '一人一月（支持时间序列分析）'
    },
    highlightResourceId: 'r03'
  },
  {
    dimension: '适合用途',
    values: {
      r02: '适合查看当前常住人口底册及最新属性明细',
      r03: '适合过去 12 个月人口趋势分析与历史月度明细下钻'
    },
    highlightResourceId: 'r03'
  },
  {
    dimension: '当前限制',
    values: {
      r02: '无历史月度快照；已有正式人口指标时不推荐纳入聚合方案',
      r03: '按月固化数据量级较大，聚合分析建议优先使用正式指标'
    }
  },
  {
    dimension: '问数状态',
    values: {
      r02: '需申请（查询与样本均受限）',
      r03: '当前可查询（可直接问数）'
    },
    highlightResourceId: 'r03'
  }
];

export const MINHANG_COMPARISON_MODEL: ResourceComparisonModel = {
  resourceIds: ['r02', 'r03'],
  recommendedResourceId: 'r03',
  recommendationSummary:
    '本次分析覆盖过去 12 个月（2025.09 — 2026.08），推荐将「常住人口月度快照」作为可选下钻资源；而「实时人员底册」仅含实时最新状态、无历史月度切片，且权限需申请，不建议纳入本次分析方案。',
  rows: MINHANG_COMPARISON_ROWS
};

export const MINHANG_INITIAL_HYPOTHESIS: RequirementHypothesis = {
  region: '上海市闵行区',
  timeRange: {
    start: '2025.09',
    end: '2026.08'
  },
  populationDefinition: '60 岁及以上常住人口',
  bedDefinition: '民政核定且在营可用养老床位数（含保基本床位）',
  dimensions: ['时间（月度）', '空间（全区及下辖街镇）'],
  analysisFocus: ['老年人口规模与分布', '养老床位供给'],
  assumptions: [
    '采用 60 岁及以上常住人口统计口径',
    '床位仅统计经民政核定且在营可用床位',
    '过去 12 个月（2025.09 - 2026.08）按月度切片核算'
  ],
  unresolvedQuestions: [
    {
      id: 'q_focus',
      question: '请确认本次分析的核心聚焦方向：',
      type: 'MULTIPLE',
      options: [
        { id: 'opt_pop', label: '老年人口规模与分布', recommended: true },
        { id: 'opt_bed', label: '养老床位供给', recommended: true },
        { id: 'opt_service', label: '居家养老服务订单与使用情况' },
        { id: 'opt_medical', label: '医养结合签约与门诊记录' }
      ],
      selectedOptionIds: ['opt_pop', 'opt_bed']
    }
  ]
};

export const MINHANG_DATA_SOLUTION: DataSolution = {
  items: [
    {
      resourceId: 'r01',
      role: 'CORE',
      inclusionState: 'SELECTED',
      coverage: ['上海市闵行区及各街镇', '2025.09 — 2026.08 月度序列'],
      limitations: ['为街镇汇总级指标，不支持社区/村居进一步下钻'],
      evidenceRefs: ['官方正式指标 · 统计口径稳定']
    },
    {
      resourceId: 'r04',
      role: 'CORE',
      inclusionState: 'SELECTED',
      coverage: ['闵行区各街镇在营可用床位', '2025.09 — 2026.08 月度数据'],
      limitations: ['不含筹建中或暂停营业的床位数'],
      evidenceRefs: ['市民政局核准在营指标']
    },
    {
      resourceId: 'r03',
      role: 'CONDITIONAL_SUPPORT',
      inclusionState: 'RECOMMENDED',
      coverage: ['全区常住老年人口按月固化底册', '含年龄、失能评级、居村代码'],
      limitations: ['按人月固化，数据量较大；当前基线聚合分析非必需'],
      evidenceRefs: ['可支持未来深入街镇下居村委或高龄结构穿透下钻']
    },
    {
      resourceId: 'r02',
      role: 'CONDITIONAL_SUPPORT',
      inclusionState: 'NOT_INCLUDED',
      coverage: ['实时人员底册'],
      limitations: ['仅含实时最新状态，无历史月度快照；查询需申请'],
      evidenceRefs: ['已被 r03 (常住人口月度快照) 优选替代']
    },
    {
      resourceId: 'r06',
      role: 'OPTIONAL_DRILLDOWN',
      inclusionState: 'RECOMMENDED',
      coverage: ['闵行区登记在册养老机构名录'],
      limitations: ['机构层级名录，缺少实时床位动态占用流'],
      evidenceRefs: ['可用于解释各街镇床位供给主要由哪些具体机构提供']
    },
    {
      resourceId: 'r07',
      role: 'PARTIAL_MATCH',
      inclusionState: 'NOT_INCLUDED',
      coverage: ['居家上门助餐、助洁服务记录'],
      limitations: ['仅反映居家上门服务，不代表机构养老等完整养老服务体系'],
      evidenceRefs: ['已声明为当前方案缺口，不参与本次床位供给基线计算']
    }
  ],
  gaps: [
    {
      id: 'gap_service_depth',
      title: '全面养老服务使用情况缺口',
      description: '当前仅具备在营床位静态供给侧数据与居家服务订单，缺少医养结合、长护险全量使用等完整服务需求侧数据。',
      impactLevel: 'LOW',
      mitigation: '在结果结论中严格注明仅评价“在营床位相对供给水平”，不外推至整体供需不足。',
      status: 'ACKNOWLEDGED'
    }
  ],
  relationshipEvidence: [
    {
      sourceResourceId: 'r04',
      targetResourceId: 'r01',
      relationType: 'CORRELATION',
      description: '同按街镇与统计月份维度关联，构成床位供给比率计算的分子与分母。',
      joinKeys: ['street_town_code', 'snapshot_month']
    }
  ],
  coverageSummary: [
    '区域覆盖：上海市闵行区 14 个街镇/工业区',
    '时间覆盖：2025.09 — 2026.08 过去 12 个完整月度',
    '核心维度：街镇、统计月份、60 岁及以上常住人口数、在营可用床位数'
  ],
  limitationSummary: [
    '未引入实时人员级明细，避免大规模数据扫描与不必要的权限申请',
    '不含筹建或停业床位，真实反映即可使用的供给容量'
  ],
  updatedAt: new Date().toISOString()
};

export const MINHANG_ASK_PLAN: AskPlan = {
  id: 'plan_minhang_bed_supply',
  title: '闵行区老年人口与养老床位供给水平分析计算',
  status: 'READY_TO_RUN',
  coreResourceIds: ['r01', 'r04'],
  conditionalResourceIds: ['r03', 'r06'],
  permissionCheckState: 'NOT_CHECKED',
  calculationSpec: {
    metricName: '每千名 60 岁以上常住人口养老床位数',
    isOfficialMetric: false,
    formula: '( 在营可用养老床位数 ÷ 60 岁以上常住人口数 ) × 1000',
    formulaExplanation: '分子为各街镇在营可用养老床位总数；分母为各街镇 60 岁及以上常住人口总数；乘以 1000 换算为千人床位数。',
    numerator: '在营可用养老床位数（正式指标 r04）',
    denominator: '60 岁以上常住人口数（正式指标 r01）',
    multiplier: 1000,
    benchmarkRule: 'WEIGHTED_DISTRICT_AVERAGE',
    strictConclusionBoundary:
      '分析结论仅表达“床位供给水平相对全区加权平均偏低，建议进一步核查”；严禁直接表达为“供需不足”或“缺少养老资源”，亦不能替代全面养老服务需求调查。'
  }
};
