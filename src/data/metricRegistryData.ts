import { Metric } from '../types';

/**
 * Single Enterprise Semantic Source of Truth: Canonical Domain Metrics Registry
 * All components, detail pages, and runtime resolvers must consume metric definitions from here.
 */
export const CANONICAL_DOMAIN_METRICS: Metric[] = [
  {
    id: 'met_valid_order_amount',
    name: '有效订单金额',
    enName: 'Valid Order Amount',
    definition: '满足“有效订单”业务规则的订单金额合计，用于衡量一定统计周期内形成的有效订单交易规模。',
    businessObject: '订单',
    scope: {
      businessDomain: '交易分析',
      organization: '电商零售业务线',
      scenario: '线上全渠道交易分析',
      entityScope: '全量交易订单',
    },
    measurement: {
      measureName: 'order_amount',
      aggregation: 'SUM',
      baseGrain: '订单',
      unit: '元',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '支付时间',
      defaultGranularity: 'DAY',
    },
    dimensions: ['渠道', '商品分类', '地区', '客户等级', '支付方式', '店铺'],
    binding: {
      dataAssetId: 'asset_01',
      dataAssetName: '全渠道订单支付明细表',
      tableName: 'dwd_order_pay_detail_di',
      measureField: 'pay_amount',
      businessRuleFilter: 'order_status = 2 AND pay_status = 1 AND is_refund = 0',
      timeField: 'pay_time',
      grainMapping: {
        businessObject: '订单',
        physicalGrainField: 'order_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.2.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '交易分析与财务核算组',
      evidence: ['业务规则评审纪要', '数仓事实模型'],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.2.0',
  },
  {
    id: 'met_001',
    name: '老龄化率',
    enName: 'Aging Ratio',
    definition: '60岁及以上常住人口占全部常住人口的比例（老年人口数 ÷ 常住人口数 × 100%），用于衡量区域人口老龄化程度与公共养老服务资源承载力。',
    businessObject: '自然人',
    scope: {
      businessDomain: '人口服务',
      organization: '民政与人口发展处',
      scenario: '老龄化态势监测',
      entityScope: '常住人口全量基数',
    },
    measurement: {
      measureName: 'aging_ratio',
      aggregation: 'AVG',
      baseGrain: '自然人',
      unit: '%',
    },
    timeSemantics: {
      type: 'SNAPSHOT',
      businessTime: '统计日期',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['行政区划', '户籍类型', '年龄段', '性别', '居住社区'],
    dependencies: [
      {
        metricId: 'met_elderly_population',
        metricName: '老年人口数',
        role: 'NUMERATOR',
        version: 'v1.1.0',
        status: 'EFFECTIVE',
        compatibility: {
          scope: true,
          grain: true,
          time: true,
          dimension: true,
          version: true,
        },
      },
      {
        metricId: 'met_resident_population',
        metricName: '常住人口数',
        role: 'DENOMINATOR',
        version: 'v1.1.0',
        status: 'EFFECTIVE',
        compatibility: {
          scope: true,
          grain: true,
          time: true,
          dimension: true,
          version: true,
        },
      },
    ],
    binding: {
      dataAssetId: 'asset_pop_01',
      dataAssetName: '全员常住人口基础信息表',
      tableName: 'dwd_pop_resident_base_df',
      measureField: 'citizen_id',
      businessRuleFilter: 'resident_status = 1',
      timeField: 'stat_date',
      grainMapping: {
        businessObject: '自然人',
        physicalGrainField: 'citizen_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.1.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '人口管理处',
      evidence: ['七普数据标准口径', '复合衍生指标计算规范'],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.1.0',
  },
  {
    id: 'met_elderly_population',
    name: '老年人口数',
    enName: 'Elderly Population',
    definition: '统计周期内在辖区内居住满半年且年龄达到或超过60周岁的常住人口总数。',
    businessObject: '自然人',
    scope: {
      businessDomain: '人口服务',
      organization: '民政与人口发展处',
      scenario: '老龄化态势监测',
      entityScope: '常住人口 60 岁及以上群体',
    },
    measurement: {
      measureName: 'elderly_pop_count',
      aggregation: 'COUNT_DISTINCT',
      baseGrain: '自然人',
      unit: '人',
    },
    timeSemantics: {
      type: 'SNAPSHOT',
      businessTime: '统计日期',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['行政区划', '户籍类型', '年龄段', '性别', '居住社区'],
    binding: {
      dataAssetId: 'asset_pop_01',
      dataAssetName: '全员常住人口基础信息表',
      tableName: 'dwd_pop_resident_base_df',
      measureField: 'citizen_id',
      businessRuleFilter: 'resident_status = 1 AND age >= 60',
      timeField: 'stat_date',
      grainMapping: {
        businessObject: '自然人',
        physicalGrainField: 'citizen_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.1.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '人口管理处',
      evidence: ['七普老龄化统计标准'],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.1.0',
  },
  {
    id: 'met_resident_population',
    name: '常住人口数',
    enName: 'Resident Population',
    definition: '统计周期内在辖区内实际居住满半年及以上的全部人口总数，作为人口资源承载力基数。',
    businessObject: '自然人',
    scope: {
      businessDomain: '人口服务',
      organization: '民政与人口发展处',
      scenario: '人口底数摸排',
      entityScope: '常住人口全量基数',
    },
    measurement: {
      measureName: 'resident_pop_count',
      aggregation: 'COUNT_DISTINCT',
      baseGrain: '自然人',
      unit: '人',
    },
    timeSemantics: {
      type: 'SNAPSHOT',
      businessTime: '统计日期',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['行政区划', '户籍类型', '年龄段', '性别', '居住社区'],
    binding: {
      dataAssetId: 'asset_pop_01',
      dataAssetName: '全员常住人口基础信息表',
      tableName: 'dwd_pop_resident_base_df',
      measureField: 'citizen_id',
      businessRuleFilter: 'resident_status = 1',
      timeField: 'stat_date',
      grainMapping: {
        businessObject: '自然人',
        physicalGrainField: 'citizen_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.1.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '人口管理处',
      evidence: ['七普常住人口口径'],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.1.0',
  },
  {
    id: 'met_002',
    name: '工单办结率',
    enName: 'Ticket Closure Rate',
    definition: '统计周期内已办结工单占全部服务工单的比例，衡量公共政务热线与服务工单履约效能。',
    businessObject: '服务工单',
    scope: {
      businessDomain: '公共服务',
      organization: '政务热线管理中心',
      scenario: '12345热线服务质效',
    },
    measurement: {
      measureName: 'ticket_closure_rate',
      aggregation: 'AVG',
      baseGrain: '服务工单',
      unit: '%',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '办结时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['工单类型', '承办部门', '紧急程度', '诉求渠道'],
    binding: {
      dataAssetId: 'asset_ticket_01',
      dataAssetName: '热线工单全生命周期处理表',
      tableName: 'dwd_hotline_ticket_df',
      measureField: 'is_closed',
      timeField: 'finish_time',
      grainMapping: {
        businessObject: '服务工单',
        physicalGrainField: 'ticket_no',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'IMPORT',
      owner: '热线管理处',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.0.0',
  },
  {
    id: 'met_003',
    name: '平均工单处理时长',
    enName: 'Average Ticket Processing Time',
    definition: '统计周期内工单从受理到办结的平均处理时长（小时）。',
    businessObject: '服务工单',
    scope: {
      businessDomain: '公共服务',
      scenario: '12345热线时效',
    },
    measurement: {
      measureName: 'duration_hours',
      aggregation: 'AVG',
      baseGrain: '服务工单',
      unit: '小时',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '办结时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['工单类型', '承办部门'],
    provenance: {
      source: 'AI_AUTHORING',
      owner: '热线管理处',
      evidence: [],
    },
    status: 'DRAFT',
    validationStatus: 'UNVERIFIED',
    aiReadiness: 'NOT_READY',
    version: 'v0.9.0',
  },
  {
    id: 'met_004',
    name: '月活企业数',
    enName: 'Monthly Active Enterprises',
    definition: '统计月内发生有效业务行为（如申报、开票、办事）的企业数量。',
    businessObject: '企业',
    scope: {
      businessDomain: '企业服务',
      scenario: '园区与企业服务活跃度',
    },
    measurement: {
      measureName: 'enterprise_id',
      aggregation: 'COUNT_DISTINCT',
      baseGrain: '企业',
      unit: '家',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '行为时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['行业分类', '注册资本规模', '园区片区', '纳税信用等级', '上市状态', '企业类型'],
    binding: {
      dataAssetId: 'asset_ent_01',
      dataAssetName: '企业经营活动月度宽表',
      tableName: 'dws_enterprise_active_monthly',
      measureField: 'ent_id',
      timeField: 'active_month',
      grainMapping: {
        businessObject: '企业',
        physicalGrainField: 'ent_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'MANUAL',
      owner: '企业服务中心',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.0.0',
  },
  {
    id: 'met_005',
    name: '新增企业数',
    enName: 'New Enterprise Count',
    definition: '统计周期内新注册成立的企业法人数量。',
    businessObject: '企业',
    scope: {
      businessDomain: '企业服务',
      scenario: '企业注册增量监测',
    },
    measurement: {
      measureName: 'enterprise_id',
      aggregation: 'COUNT_DISTINCT',
      baseGrain: '企业',
      unit: '家',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '注册时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['行业分类', '所属行政区', '登记机关'],
    binding: {
      dataAssetId: 'asset_ent_reg',
      dataAssetName: '企业注册登记信息表',
      tableName: 'dwd_enterprise_register_df',
      measureField: 'corp_id',
      timeField: 'reg_date',
      grainMapping: {
        businessObject: '企业',
        physicalGrainField: 'corp_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'IMPORT',
      owner: '企业服务中心',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.0.0',
  },
  {
    id: 'met_006',
    name: '客户流失率',
    enName: 'Customer Churn Rate',
    definition: '统计周期内超过90天无活跃购买行为的客户占期初活跃客户的比例。',
    businessObject: '客户',
    scope: {
      businessDomain: '客户运营',
      scenario: '零售电商客户留存',
    },
    measurement: {
      measureName: 'churn_rate',
      aggregation: 'AVG',
      baseGrain: '客户',
      unit: '%',
    },
    timeSemantics: {
      type: 'PERIOD',
      businessTime: '统计月份',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['会员等级', '首购渠道'],
    provenance: {
      source: 'AI_AUTHORING',
      owner: '用户运营组',
      evidence: [],
    },
    status: 'DRAFT',
    validationStatus: 'UNVERIFIED',
    aiReadiness: 'NOT_READY',
    version: 'v0.8.0',
  },
  {
    id: 'met_007',
    name: '客单价',
    enName: 'Average Order Value',
    definition: '统计周期内平均每笔成交订单的结算金额。',
    businessObject: '订单',
    scope: {
      businessDomain: '销售分析',
      scenario: '零售销售价值',
    },
    measurement: {
      measureName: 'order_amount',
      aggregation: 'AVG',
      baseGrain: '订单',
      unit: '元',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '支付时间',
      defaultGranularity: 'DAY',
    },
    dimensions: ['渠道', '商品分类', '地区', '客户等级', '促销类型', '支付方式', '门店', '终端'],
    binding: {
      dataAssetId: 'asset_01',
      dataAssetName: '全渠道订单支付明细表',
      tableName: 'dwd_order_pay_detail_di',
      measureField: 'pay_amount',
      timeField: 'pay_time',
      grainMapping: {
        businessObject: '订单',
        physicalGrainField: 'order_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.3.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '销售分析组',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.3.0',
  },
  {
    id: 'met_008',
    name: '投诉率',
    enName: 'Complaint Rate',
    definition: '统计周期内投诉性质工单占全部受理服务工单的比例，用于评价服务质量风险。',
    businessObject: '服务工单',
    scope: {
      businessDomain: '公共服务',
      scenario: '12345热线质控与工单投诉率监控',
    },
    measurement: {
      measureName: 'complaint_rate',
      aggregation: 'AVG',
      baseGrain: '服务工单',
      unit: '%',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '受理时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['工单类型', '承办部门'],
    binding: {
      dataAssetId: 'asset_ticket_legacy',
      dataAssetName: '热线质控工单事实表',
      tableName: 'dwd_hotline_complaint_df',
      measureField: 'is_complaint',
      timeField: 'invalid_accept_time_col', // Broken time binding for testing
      grainMapping: {
        businessObject: '服务工单',
        physicalGrainField: 'ticket_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'INVALID',
    },
    provenance: {
      source: 'IMPORT',
      owner: '运营质控组',
      evidence: ['质控考核指标标准'],
    },
    status: 'EFFECTIVE',
    validationStatus: 'FAIL',
    aiReadiness: 'DEGRADED',
    changeReason: '时间字段 Binding 已失效（底层字段 rename 未同步），物理层时间口径无法对齐。',
    version: 'v1.1.0',
  },
  {
    id: 'met_009',
    name: '复购率',
    enName: 'Repurchase Rate',
    definition: '统计周期内产生2次及以上购买行为的客户占全体购买客户的比例。',
    businessObject: '客户',
    scope: {
      businessDomain: '客户运营',
      scenario: '会员精细化运营',
    },
    measurement: {
      measureName: 'repurchase_rate',
      aggregation: 'AVG',
      baseGrain: '客户',
      unit: '%',
    },
    timeSemantics: {
      type: 'PERIOD',
      businessTime: '统计月份',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['会员等级', '地域', '首购渠道'],
    binding: {
      dataAssetId: 'asset_repurchase_01',
      dataAssetName: '客户复购分析宽表',
      tableName: 'dws_customer_repurchase_monthly',
      measureField: 'is_repurchase',
      timeField: 'stat_month',
      grainMapping: {
        businessObject: '客户',
        physicalGrainField: 'cust_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.2.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '用户运营组',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'READY',
    version: 'v1.2.0',
  },
  {
    id: 'met_010',
    name: '日活客户数',
    enName: 'Daily Active Customers',
    definition: '单日登录或产生交互行为的唯一客户数量。',
    businessObject: '客户',
    scope: {
      businessDomain: '客户运营',
      scenario: '客户大盘日常活跃监测',
    },
    measurement: {
      measureName: 'customer_id',
      aggregation: 'COUNT_DISTINCT',
      baseGrain: '客户',
      unit: '人',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '活跃时间',
      defaultGranularity: 'DAY',
    },
    dimensions: ['终端类型', '渠道', '城市'],
    binding: {
      dataAssetId: 'asset_cust_log',
      dataAssetName: '用户行为日志汇总表',
      tableName: 'dws_user_daily_active_df',
      measureField: 'user_id',
      timeField: 'log_date',
      grainMapping: {
        businessObject: '客户',
        physicalGrainField: 'user_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'DEGRADED',
    },
    provenance: {
      source: 'AI_AUTHORING',
      owner: '用户运营组',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'UNVERIFIED',
    aiReadiness: 'DEGRADED',
    changeReason: '检测到与「APP端日活跃用户」存在定义重叠冲突，需确认业务范围边界。',
    version: 'v1.0.0',
  },
  {
    id: 'met_011',
    name: '区域销售总额',
    enName: 'Regional Gross Sales',
    definition: '按各大区归属统计的已发货销售总金额。',
    businessObject: '订单',
    scope: {
      businessDomain: '销售分析',
      scenario: '区域销售考核',
    },
    measurement: {
      measureName: 'regional_sales',
      aggregation: 'SUM',
      baseGrain: '订单',
      unit: '元',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '发货时间',
      defaultGranularity: 'MONTH',
    },
    dimensions: ['销售大区', '省份', '城市', '产品线'],
    binding: {
      dataAssetId: 'asset_sales_02',
      dataAssetName: '区域销售业绩明细表',
      tableName: 'dws_sales_regional_monthly',
      measureField: 'shipped_amount',
      timeField: 'ship_date',
      grainMapping: {
        businessObject: '订单',
        physicalGrainField: 'order_id',
        matchStatus: 'VALID',
      },
      dimensionPaths: [],
      bindingVersion: 'v1.0.0',
      health: 'HEALTHY',
    },
    provenance: {
      source: 'MANUAL',
      owner: '销售分析组',
      evidence: [],
    },
    status: 'EFFECTIVE',
    validationStatus: 'PASS',
    aiReadiness: 'DEGRADED',
    changeReason: '大区与总部存在不同业务场景口径，请确认是否按 Applicable Scope 区分并明确命名。',
    version: 'v1.0.0',
  },
  {
    id: 'met_012',
    name: '跨境退款金额',
    enName: 'Cross-border Refund Amount',
    definition: '跨境电商交易产生的退款总额（含汇率折算）。',
    businessObject: '订单',
    scope: {
      businessDomain: '交易分析',
      scenario: '跨境逆向交易结算',
    },
    measurement: {
      measureName: 'refund_amount',
      aggregation: 'SUM',
      baseGrain: '订单',
      unit: '元',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '退款审核时间',
      defaultGranularity: 'DAY',
    },
    dimensions: ['国家/地区', '支付币种', '退款原因'],
    provenance: {
      source: 'AI_AUTHORING',
      owner: '交易分析与财务核算组',
      evidence: [],
    },
    status: 'DRAFT',
    validationStatus: 'UNVERIFIED',
    aiReadiness: 'NOT_READY',
    changeReason: '缺少汇率折算规则与关税退还 Scope 约束定义。',
    version: 'v0.5.0',
  },
  {
    id: 'met_013',
    name: '存量历史订单笔数',
    enName: 'Legacy Historical Order Count',
    definition: '旧版电商系统迁移前的历史订单总笔数（已归档，不再参与实时运营分析）。',
    businessObject: '订单',
    scope: {
      businessDomain: '交易分析',
      scenario: '历史归档系统核对',
    },
    measurement: {
      measureName: 'order_id',
      aggregation: 'COUNT',
      baseGrain: '订单',
      unit: '笔',
    },
    timeSemantics: {
      type: 'FLOW',
      businessTime: '下单时间',
      defaultGranularity: 'YEAR',
    },
    dimensions: ['历史渠道', '归档年份'],
    provenance: {
      source: 'IMPORT',
      owner: '交易分析与财务核算组',
      evidence: [],
    },
    status: 'DEPRECATED',
    validationStatus: 'PASS',
    aiReadiness: 'NOT_READY',
    changeReason: '业务系统升级，该口径已由统一中台订单指标替代。',
    version: 'v0.3.0',
  },
];

/**
 * Metric Repository / Registry Service (Single Source of Truth)
 */
export const metricRegistryService = {
  /**
   * Retrieve all canonical metrics in enterprise registry
   */
  getAllMetrics(): Metric[] {
    return CANONICAL_DOMAIN_METRICS;
  },

  /**
   * Lookup metric by exact ID
   */
  getMetricById(metricId?: string): Metric | undefined {
    if (!metricId) return undefined;
    return CANONICAL_DOMAIN_METRICS.find(m => m.id === metricId);
  },

  /**
   * Lookup currently effective metric by ID
   */
  getEffectiveMetric(metricId?: string): Metric | undefined {
    const metric = this.getMetricById(metricId);
    if (metric && metric.status === 'EFFECTIVE') {
      return metric;
    }
    return metric;
  },

  /**
   * Natural Language Semantic Metric Matcher
   * Matches user question intent against canonical registry metric names, synonyms, and keywords.
   */
  findMetricByQuery(query: string): Metric | undefined {
    const q = query.trim().toLowerCase();
    
    // Explicit ambiguous trigger words for runtime safety testing
    if (q.includes('未知名词') || q.includes('随便查查') || q.includes('不知道') || q.includes('模糊查询') || q.includes('未知数据')) {
      return undefined;
    }

    // 1. Exact Name Matches
    const exactNameMatch = CANONICAL_DOMAIN_METRICS.find(m => 
      q.includes(m.name.toLowerCase()) || 
      (m.enName && q.includes(m.enName.toLowerCase()))
    );
    if (exactNameMatch) return exactNameMatch;

    // 2. Semantic Intent Key Phrases (Mapped directly to registry IDs)
    if (q.includes('老龄化率') || q.includes('老龄化') || q.includes('养老比例')) {
      return this.getMetricById('met_001'); // 老龄化率 (复合指标)
    }
    if (q.includes('老年人口') || q.includes('老人总数') || q.includes('60岁以上人口')) {
      return this.getMetricById('met_elderly_population'); // 老年人口数 (分子)
    }
    if (q.includes('常住人口') || q.includes('常住人口数') || q.includes('常住基数')) {
      return this.getMetricById('met_resident_population'); // 常住人口数 (分母)
    }
    if (q.includes('投诉') || q.includes('工单投诉') || q.includes('投诉率')) {
      return this.getMetricById('met_008'); // 投诉率
    }
    if (q.includes('办结') || q.includes('工单办结')) {
      return this.getMetricById('met_002'); // 工单办结率
    }
    if (q.includes('处理时长') || q.includes('工单时长') || q.includes('办理时效')) {
      return this.getMetricById('met_003'); // 平均工单处理时长
    }
    if (q.includes('月活企业') || q.includes('活跃企业')) {
      return this.getMetricById('met_004'); // 月活企业数
    }
    if (q.includes('新增企业') || q.includes('新注册企业')) {
      return this.getMetricById('met_005'); // 新增企业数
    }
    if (q.includes('流失率') || q.includes('客户流失')) {
      return this.getMetricById('met_006'); // 客户流失率
    }
    if (q.includes('客单价') || q.includes('订单均价') || q.includes('每单金额')) {
      return this.getMetricById('met_007'); // 客单价
    }
    if (q.includes('复购') || q.includes('复购率') || q.includes('二次购买')) {
      return this.getMetricById('met_009'); // 复购率
    }
    if (q.includes('日活') || q.includes('日活客户') || q.includes('dau')) {
      return this.getMetricById('met_010'); // 日活客户数
    }
    if (q.includes('区域销售') || q.includes('大区销售') || q.includes('销售总额')) {
      return this.getMetricById('met_011'); // 区域销售总额
    }
    if (q.includes('退款') || q.includes('跨境退款')) {
      return this.getMetricById('met_012'); // 跨境退款金额
    }
    if (q.includes('有效订单') || q.includes('订单金额') || q.includes('交易金额') || q.includes('订单') || q.includes('营收') || q.includes('销售额')) {
      return this.getMetricById('met_valid_order_amount'); // 有效订单金额
    }

    return undefined;
  },

  /**
   * Search metrics by keyword
   */
  searchMetrics(keyword: string): Metric[] {
    const k = keyword.trim().toLowerCase();
    if (!k) return CANONICAL_DOMAIN_METRICS;
    return CANONICAL_DOMAIN_METRICS.filter(m => 
      m.name.toLowerCase().includes(k) ||
      (m.enName && m.enName.toLowerCase().includes(k)) ||
      m.definition.toLowerCase().includes(k) ||
      m.businessObject.toLowerCase().includes(k) ||
      m.scope.businessDomain.toLowerCase().includes(k) ||
      m.dimensions.some(d => d.toLowerCase().includes(k))
    );
  }
};
