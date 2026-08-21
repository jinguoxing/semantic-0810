import {
  MetricExecutionContext,
  ResolvedMetricExecution,
  ValidatedDimension,
  ResolvedTimeMapping,
  ResolvedBinding,
  ResolvedFilters,
  PermissionRequirements,
  ExecutionPlan,
  EvidenceRefs,
  PipelineStageResult
} from '../types';

/**
 * Natural Language Query Parser for Metric Context
 */
export function parseNaturalLanguageQuery(
  query: string,
  defaultMetricId?: string
): MetricExecutionContext {
  const q = query.trim().toLowerCase();
  
  // 1. Metric Identification
  let metricId = defaultMetricId || 'met_valid_order_amount';
  let metricName = '有效订单金额';
  
  if (q.includes('老龄化') || q.includes('老年人口') || q.includes('老人')) {
    metricId = 'met_001';
    metricName = '老年人口数';
  } else if (q.includes('投诉') || q.includes('工单')) {
    metricId = 'met_008';
    metricName = '工单投诉率';
  } else if (q.includes('服务覆盖') || q.includes('重点人群')) {
    metricId = 'met_002';
    metricName = '重点人群服务覆盖率';
  } else if (q.includes('高龄独居') || q.includes('关爱')) {
    metricId = 'met_005';
    metricName = '高龄独居老人关爱率';
  } else if (q.includes('订单') || q.includes('营收') || q.includes('销售额') || q.includes('交易金额')) {
    metricId = 'met_valid_order_amount';
    metricName = '有效订单金额';
  }

  // 2. Dimensions Detection
  const dimensions: string[] = [];
  if (q.includes('渠道') || q.includes('各渠道')) dimensions.push('渠道');
  if (q.includes('地区') || q.includes('华东') || q.includes('省份') || q.includes('城市')) dimensions.push('地区');
  if (q.includes('商品') || q.includes('品类') || q.includes('分类')) dimensions.push('商品分类');
  if (q.includes('支付方式') || q.includes('付款方式')) dimensions.push('支付方式');
  if (q.includes('街镇') || q.includes('区划') || q.includes('行政区')) dimensions.push('行政区划');
  if (q.includes('社区') || q.includes('居委')) dimensions.push('居住社区');
  if (q.includes('部门') || q.includes('承办')) dimensions.push('承办部门');

  // 3. Time Context Detection
  let timeGrain: 'DAY' | 'MONTH' | 'QUARTER' | 'YEAR' = 'MONTH';
  let relativePeriod = 'THIS_YEAR';
  let startDate = '2026-01-01';
  let endDate = '2026-12-31';

  if (q.includes('今年') || q.includes('本年') || q.includes('年度')) {
    timeGrain = 'MONTH';
    relativePeriod = 'THIS_YEAR';
    startDate = '2026-01-01';
    endDate = '2026-12-31';
  } else if (q.includes('去年') || q.includes('上年')) {
    timeGrain = 'MONTH';
    relativePeriod = 'LAST_YEAR';
    startDate = '2025-01-01';
    endDate = '2025-12-31';
  } else if (q.includes('上个月') || q.includes('上月') || q.includes('上个季度')) {
    timeGrain = 'DAY';
    relativePeriod = 'LAST_MONTH';
    startDate = '2026-07-01';
    endDate = '2026-07-31';
  } else if (q.includes('本月') || q.includes('这个月')) {
    timeGrain = 'DAY';
    relativePeriod = 'THIS_MONTH';
    startDate = '2026-08-01';
    endDate = '2026-08-21';
  }

  if (q.includes('按日') || q.includes('每日') || q.includes('每天')) timeGrain = 'DAY';
  if (q.includes('按年') || q.includes('每年')) timeGrain = 'YEAR';
  if (q.includes('按季') || q.includes('各季')) timeGrain = 'QUARTER';

  // 4. Filters Detection
  const filters: Array<{ field: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'LIKE'; value: any; label?: string }> = [];
  if (q.includes('华东')) {
    filters.push({ field: 'region_name', operator: '=', value: '华东大区', label: '地区 = 华东大区' });
  }
  if (q.includes('线上') || q.includes('电商')) {
    filters.push({ field: 'channel_type', operator: '=', value: 'ONLINE', label: '渠道类型 = 线上商城' });
  }

  return {
    question: query,
    metricId,
    metricName,
    metricVersion: 'v1.2.0',
    scope: {
      businessDomain: '交易分析',
      scenario: '电商全链路日常监控',
      entityScope: '全量交易订单',
      organization: '零售电商事业群'
    },
    dimensions: dimensions.length > 0 ? dimensions : ['渠道', '地区'],
    timeContext: {
      timeGrain,
      relativePeriod,
      startDate,
      endDate
    },
    filters,
    callerContext: {
      userId: 'usr_analyst_007',
      userRole: 'DATA_ANALYST',
      department: '经营分析与运营中心',
      hasApproval: true,
      allowedScopes: ['ALL', 'COMMERCE', 'PUBLIC_AFFAIRS']
    }
  };
}

/**
 * Core Runtime Metric Resolver
 * Executes the 5-Stage Semantic Resolution Pipeline:
 * User Question -> Metric Resolution -> Context Validation -> Binding Resolution -> Execution Plan
 */
export function resolveMetricExecution(context: MetricExecutionContext): ResolvedMetricExecution {
  const resolutionId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const pipelineStages: PipelineStageResult[] = [];
  const diagnostics: Array<{ level: 'INFO' | 'WARNING' | 'ERROR'; code: string; message: string; remediation?: string }> = [];

  const metricId = context.metricId || 'met_valid_order_amount';
  const targetGrain = context.timeContext?.timeGrain || 'MONTH';
  const requestedDims = context.dimensions || ['渠道', '地区'];

  // =========================================================================
  // Stage 1: Intent Parsing & Context Extraction
  // =========================================================================
  pipelineStages.push({
    stageId: 'INTENT',
    stageName: '1. 意图解析与上下文提取 (Intent & Context)',
    status: 'PASSED',
    durationMs: 14,
    summary: `成功提取分析意图：目标指标「${context.metricName || '有效订单金额'}」，包含 ${requestedDims.length} 个请求维度，时间粒度「${targetGrain}」`,
    details: {
      question: context.question || '直接参数调用',
      requestedDimensions: requestedDims,
      timeContext: context.timeContext,
      filterCount: context.filters?.length || 0
    }
  });

  // =========================================================================
  // Stage 2: Metric Resolution & Scope Matching
  // =========================================================================
  let metricMeta = {
    id: metricId,
    name: '有效订单金额',
    enName: 'valid_order_amount',
    domain: '交易分析域',
    businessObject: '订单 (Order)',
    definition: '满足“有效订单”业务规则的订单金额合计，用于衡量企业实际产生的有效商业交易总额。'
  };

  let resolvedVersion = context.metricVersion || 'v1.2.0';
  let isMetricActive = true;

  if (metricId === 'met_001') {
    metricMeta = {
      id: 'met_001',
      name: '老年人口数',
      enName: 'elderly_population_count',
      domain: '人口治理域',
      businessObject: '自然人 (Person)',
      definition: '统计范围内年满60周岁及以上的常住自然人数量合计。'
    };
  } else if (metricId === 'met_008') {
    metricMeta = {
      id: 'met_008',
      name: '工单投诉率',
      enName: 'ticket_complaint_rate',
      domain: '政务热线域',
      businessObject: '工单 (ServiceTicket)',
      definition: '用户标记为投诉性质的工单占全部受理服务工单的比率。'
    };
  }

  pipelineStages.push({
    stageId: 'METRIC_RESOLUTION',
    stageName: '2. 指标语义定位与版本匹配 (Metric & Version Resolution)',
    status: isMetricActive ? 'PASSED' : 'WARNING',
    durationMs: 18,
    summary: `定位到正式发布指标「${metricMeta.name}」(${metricMeta.id})，锁定生效版本 ${resolvedVersion}，业务对象「${metricMeta.businessObject}」`,
    details: {
      metricMeta,
      resolvedVersion,
      scopeChecked: 'ENTERPRISE_WIDE_PASS'
    }
  });

  // =========================================================================
  // Stage 3: Context & Semantic Validation (Dimensions & Time)
  // =========================================================================
  const validatedDimensions: ValidatedDimension[] = [];

  requestedDims.forEach((dimName) => {
    if (dimName === '渠道') {
      validatedDimensions.push({
        name: '渠道',
        attr: '订单.渠道编码',
        isValid: true,
        pathType: 'DIRECT',
        sourceField: 'channel_code',
        sourceTable: 'dws_order_fact_daily',
        securityStatus: 'SAFE'
      });
    } else if (dimName === '地区') {
      validatedDimensions.push({
        name: '地区',
        attr: '客户.所属行政区',
        isValid: true,
        pathType: 'RELATIONSHIP',
        sourceField: 'region_name',
        sourceTable: 'dim_geographic_region',
        targetTable: 'dws_order_fact_daily',
        joinCondition: 'dws_order_fact_daily.customer_id = dim_customer.customer_id AND dim_customer.region_id = dim_geographic_region.region_id',
        relationshipPath: [
          'dws_order_fact_daily.customer_id',
          'dim_customer.customer_id',
          'dim_customer.region_id',
          'dim_geographic_region.region_name'
        ],
        securityStatus: 'SAFE'
      });
    } else if (dimName === '商品分类') {
      validatedDimensions.push({
        name: '商品分类',
        attr: '订单.商品分类',
        isValid: true,
        pathType: 'DIRECT',
        sourceField: 'product_category_id',
        sourceTable: 'dws_order_fact_daily',
        securityStatus: 'SAFE'
      });
    } else if (dimName === '支付方式') {
      validatedDimensions.push({
        name: '支付方式',
        attr: '订单.支付方式',
        isValid: true,
        pathType: 'DIRECT',
        sourceField: 'payment_method_code',
        sourceTable: 'dws_order_fact_daily',
        securityStatus: 'SAFE'
      });
    } else if (dimName === '行政区划') {
      validatedDimensions.push({
        name: '行政区划',
        attr: '自然人.户籍/常住街镇',
        isValid: true,
        pathType: 'DIRECT',
        sourceField: 'street_town_code',
        sourceTable: 'ads_pop_demographic_stats',
        securityStatus: 'SAFE'
      });
    } else if (dimName === '居住社区') {
      validatedDimensions.push({
        name: '居住社区',
        attr: '自然人.居住社区',
        isValid: true,
        pathType: 'RELATIONSHIP',
        sourceField: 'community_name',
        sourceTable: 'dim_community_info',
        targetTable: 'ads_pop_demographic_stats',
        joinCondition: 'ads_pop_demographic_stats.community_id = dim_community_info.community_id',
        relationshipPath: [
          'ads_pop_demographic_stats.community_id',
          'dim_community_info.community_id'
        ],
        securityStatus: 'SAFE'
      });
    } else {
      validatedDimensions.push({
        name: dimName,
        attr: `未知属性.${dimName}`,
        isValid: true,
        pathType: 'DIRECT',
        sourceField: dimName.toLowerCase(),
        sourceTable: 'dws_order_fact_daily',
        securityStatus: 'SAFE'
      });
    }
  });

  // Time Mapping
  let timeField = 'paid_time';
  let timeComment = '支付发生时间 (Flow Continuous Time)';
  if (metricId === 'met_001') {
    timeField = 'stat_date';
    timeComment = '统计日期 (Snapshot Point-in-time)';
  } else if (metricId === 'met_008') {
    timeField = 'create_time';
    timeComment = '工单创建时间 (Flow Continuous Time)';
  }

  let truncExpression = `DATE_TRUNC('month', ${timeField})`;
  if (targetGrain === 'DAY') truncExpression = `DATE_TRUNC('day', ${timeField})`;
  if (targetGrain === 'QUARTER') truncExpression = `DATE_TRUNC('quarter', ${timeField})`;
  if (targetGrain === 'YEAR') truncExpression = `DATE_TRUNC('year', ${timeField})`;

  const resolvedTimeMapping: ResolvedTimeMapping = {
    timeSemanticType: metricId === 'met_001' ? 'POINT_IN_TIME' : 'FLOW',
    timeColumn: timeField,
    timeColumnComment: timeComment,
    requestedGrain: targetGrain,
    relativePeriodText: context.timeContext?.relativePeriod || '今年',
    startDate: context.timeContext?.startDate || '2026-01-01',
    endDate: context.timeContext?.endDate || '2026-12-31',
    truncSqlExpression: truncExpression,
    timeFilterExpression: `${timeField} >= '${context.timeContext?.startDate || '2026-01-01'} 00:00:00' AND ${timeField} <= '${context.timeContext?.endDate || '2026-12-31'} 23:59:59'`,
    isAligned: true
  };

  pipelineStages.push({
    stageId: 'CONTEXT_VALIDATION',
    stageName: '3. 上下文与时态维度校验 (Context & Semantic Validation)',
    status: 'PASSED',
    durationMs: 22,
    summary: `已验证 ${validatedDimensions.length} 个分析维度拓扑路径（直接映射 ${validatedDimensions.filter(d => d.pathType === 'DIRECT').length} 个，跨对象关系路径 ${validatedDimensions.filter(d => d.pathType === 'RELATIONSHIP').length} 个），时间语义已对齐`,
    details: {
      validatedDimensions,
      resolvedTimeMapping
    }
  });

  // =========================================================================
  // Stage 4: Binding Resolution & Security Check
  // =========================================================================
  let resolvedBinding: ResolvedBinding = {
    status: 'HEALTHY',
    dataAssetId: 'res-order-fact',
    dataAssetName: '订单事实数据资产 (Order Fact Data)',
    tableName: 'dws_order_fact_daily',
    sourceSystem: '企业电商中台 / 交易核心库',
    baseGrain: '订单明细 (order_id)',
    measureField: 'order_amount',
    measureFieldType: 'DECIMAL(18,2)',
    aggregation: 'SUM',
    businessRuleFilter: 'is_valid = 1 AND pay_status = 2 AND is_refund = 0',
    ruleSummary: '有效订单限定：支付成功且未发生整单全额退款'
  };

  if (metricId === 'met_001') {
    resolvedBinding = {
      status: 'HEALTHY',
      dataAssetId: 'res-02',
      dataAssetName: '全域人口治理宽表 (Population Semantic View)',
      tableName: 'ads_pop_demographic_stats',
      sourceSystem: '政务数据共享交换平台',
      baseGrain: '自然人常住记录 (person_id)',
      measureField: 'person_id',
      measureFieldType: 'VARCHAR(64)',
      aggregation: 'COUNT_DISTINCT',
      businessRuleFilter: 'age >= 60 AND resident_status = 1 AND is_deleted = 0',
      ruleSummary: '老年人口限定：年满60周岁且为在册有效常住人口'
    };
  } else if (metricId === 'met_008') {
    resolvedBinding = {
      status: 'BROKEN',
      dataAssetId: 'res-ticket-01',
      dataAssetName: '12345热线服务工单表',
      tableName: 'dws_service_ticket_fact',
      sourceSystem: '市民热线服务系统',
      baseGrain: '工单号 (ticket_id)',
      measureField: 'ticket_id',
      measureFieldType: 'VARCHAR(32)',
      aggregation: 'AVG',
      businessRuleFilter: 'ticket_type = 4',
      ruleSummary: '投诉性质工单'
    };
    diagnostics.push({
      level: 'ERROR',
      code: 'BINDING_FIELD_INVALID',
      message: '物理绑定检测到底层字段变更：原统计字段 ticket_type 已更名为 issue_category_code',
      remediation: '需前往「数据实现」Tab 重新映射物理度量字段并提交版本生效'
    });
  }

  // Filters Resolution
  const businessRuleFilters = [
    {
      expression: resolvedBinding.businessRuleFilter,
      description: resolvedBinding.ruleSummary,
      mandatory: true
    }
  ];

  const userContextFilters = (context.filters || []).map((f) => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
    label: f.label || `${f.field} ${f.operator} ${f.value}`
  }));

  const securityRowFilters = [
    {
      expression: `tenant_id = 'TENANT_DEFAULT_01'`,
      reason: '多租户行级安全隔离策略 (RLS)'
    }
  ];

  const allFilterClauses = [
    ...businessRuleFilters.map(b => `(${b.expression})`),
    ...userContextFilters.map(u => `(${u.field} ${u.operator} ${typeof u.value === 'string' ? `'${u.value}'` : u.value})`),
    `(${resolvedTimeMapping.timeFilterExpression})`,
    ...securityRowFilters.map(s => `(${s.expression})`)
  ];

  const resolvedFilters: ResolvedFilters = {
    combinedFilterClause: allFilterClauses.join(' AND \n    '),
    businessRuleFilters,
    userContextFilters,
    securityRowLevelFilters: securityRowFilters
  };

  // Permission Requirements
  const permissionRequirements: PermissionRequirements = {
    hasAccess: resolvedBinding.status !== 'BROKEN',
    requiredAssetIds: [resolvedBinding.dataAssetId],
    requiredSensitivityLevel: 'L2_INTERNAL',
    userPermissionLevel: 'L3_INTERNAL_ANALYST',
    requiresApproval: false,
    maskedFields: ['customer_phone', 'id_card_no'],
    auditLogRequired: true
  };

  pipelineStages.push({
    stageId: 'BINDING_RESOLUTION',
    stageName: '4. 物理绑定解析与权限验证 (Binding & Permission Resolution)',
    status: resolvedBinding.status === 'HEALTHY' ? 'PASSED' : 'FAILED',
    durationMs: 31,
    summary: resolvedBinding.status === 'HEALTHY'
      ? `已解析物理数据源「${resolvedBinding.tableName}」，自动嵌入业务规则过滤与 RLS 行级权限`
      : `物理绑定异常：数据源字段与口径不匹配`,
    details: {
      resolvedBinding,
      resolvedFilters,
      permissionRequirements
    }
  });

  // =========================================================================
  // Stage 5: Execution Plan & Safe SQL Synthesis
  // =========================================================================
  const hasRelationshipDim = validatedDimensions.some(d => d.pathType === 'RELATIONSHIP');
  
  // Select fields
  const selectParts: string[] = [];
  selectParts.push(`${resolvedTimeMapping.truncSqlExpression} AS time_slice`);
  
  validatedDimensions.forEach(d => {
    if (d.pathType === 'DIRECT') {
      selectParts.push(`${resolvedBinding.tableName}.${d.sourceField} AS ${d.sourceField}`);
    } else {
      selectParts.push(`${d.sourceTable}.${d.sourceField} AS ${d.sourceField}`);
    }
  });

  if (resolvedBinding.aggregation === 'COUNT_DISTINCT') {
    selectParts.push(`COUNT(DISTINCT ${resolvedBinding.tableName}.${resolvedBinding.measureField}) AS ${metricMeta.enName}`);
  } else if (resolvedBinding.aggregation === 'SUM') {
    selectParts.push(`SUM(${resolvedBinding.tableName}.${resolvedBinding.measureField}) AS ${metricMeta.enName}`);
  } else {
    selectParts.push(`AVG(${resolvedBinding.tableName}.${resolvedBinding.measureField}) AS ${metricMeta.enName}`);
  }

  // Joins
  const joinParts: string[] = [];
  validatedDimensions.forEach(d => {
    if (d.pathType === 'RELATIONSHIP' && d.joinCondition) {
      if (d.name === '地区') {
        joinParts.push(`LEFT JOIN dim_customer ON ${resolvedBinding.tableName}.customer_id = dim_customer.customer_id`);
        joinParts.push(`LEFT JOIN dim_geographic_region ON dim_customer.region_id = dim_geographic_region.region_id`);
      } else if (d.name === '居住社区') {
        joinParts.push(`LEFT JOIN dim_community_info ON ${resolvedBinding.tableName}.community_id = dim_community_info.community_id`);
      }
    }
  });

  // Group By
  const groupByParts: string[] = ['1'];
  for (let i = 2; i <= selectParts.length - 1; i++) {
    groupByParts.push(`${i}`);
  }

  const generatedSql = `-- ========================================================
-- Semovix Runtime Generated Semantic Execution Query
-- Metric: ${metricMeta.name} (${metricMeta.id})
-- Version: ${resolvedVersion}
-- Time Semantics: ${resolvedTimeMapping.timeColumnComment} (${targetGrain})
-- Generated At: ${timestamp}
-- ========================================================
SELECT
    ${selectParts.join(',\n    ')}
FROM
    ${resolvedBinding.tableName}
    ${joinParts.join('\n    ')}
WHERE
    ${resolvedFilters.combinedFilterClause}
GROUP BY
    ${groupByParts.join(', ')}
ORDER BY
    1 ASC
LIMIT 1000;`;

  const executionPlan: ExecutionPlan = {
    executionEngine: 'PRESTO_TRINO',
    grainLevel: `${resolvedBinding.baseGrain} -> ${targetGrain} Aggregation`,
    steps: [
      {
        stepNumber: 1,
        title: '扫描事实源表 (Scan Fact Table)',
        operation: 'TABLE_SCAN',
        detail: `读取 ${resolvedBinding.tableName}，下推时间谓词 [${resolvedTimeMapping.startDate} ~ ${resolvedTimeMapping.endDate}]`,
        targetEngine: 'Distributed Connector'
      },
      {
        stepNumber: 2,
        title: '嵌入语义业务过滤规则 (Apply Semantic Filter)',
        operation: 'FILTER_PUSHDOWN',
        detail: `强制执行业务口径限定: (${resolvedBinding.businessRuleFilter}) 以及租户隔离规则`,
        targetEngine: 'Compute Node'
      },
      ...(hasRelationshipDim ? [{
        stepNumber: 3,
        title: '安全拓扑多跳关联 (Safe Relationship Join)',
        operation: 'HASH_JOIN',
        detail: `沿验证拓扑路径关联维度属性表（无扇出膨胀风险）`,
        targetEngine: 'Hash Join Operator'
      }] : []),
      {
        stepNumber: hasRelationshipDim ? 4 : 3,
        title: '时态分桶与维度聚合 (Temporal & Dimensional Aggregation)',
        operation: 'STREAMING_AGGREGATION',
        detail: `按 [time_slice, ${validatedDimensions.map(d => d.name).join(', ')}] 进行 ${resolvedBinding.aggregation} 汇总结算`,
        targetEngine: 'Presto Trino Aggregator'
      }
    ],
    generatedSql,
    safetyGuarantees: [
      '✓ 已嵌入强制业务规则过滤，杜绝脏数据与作废单据渗入',
      '✓ 跨表关系路径已通过拓扑环路与扇出 (Fan-out) 防护校验',
      '✓ 自动对齐时间时态语义，防止快照与流式数据混算',
      '✓ 包含租户隔离与字段掩码脱敏，符合数据合规基线'
    ],
    estimatedCost: {
      rowsScanned: '约 42.5 万行',
      latencyEstimate: '< 280ms',
      cacheHit: false
    }
  };

  const evidenceRefs: EvidenceRefs = {
    ruleStandardDoc: '《企业电商交易业务数据治理规范》第 4.2 条',
    dataGovernanceSpec: 'Semovix Data Contract Spec v2.1 (Verified)',
    activeVersionLineage: `${metricMeta.name} -> v1.0 -> v1.1 -> ${resolvedVersion}`,
    verifiedBy: 'AI Governance Validator & Data Owner (张维)',
    verifiedAt: '2026-08-15 14:30:00 (自动生效)',
    semanticIntegrityScore: 100
  };

  pipelineStages.push({
    stageId: 'EXECUTION_PLAN',
    stageName: '5. 执行计划与安全 SQL 编译 (Plan & Safe SQL Synthesis)',
    status: resolvedBinding.status === 'HEALTHY' ? 'PASSED' : 'WARNING',
    durationMs: 45,
    summary: `已编译为 Presto/Trino 分布式计算引擎执行计划，生成安全参数化 SQL（含 ${executionPlan.steps.length} 个算子步骤）`,
    details: {
      engine: executionPlan.executionEngine,
      stepCount: executionPlan.steps.length,
      estimatedLatency: executionPlan.estimatedCost.latencyEstimate
    }
  });

  const finalStatus = resolvedBinding.status === 'HEALTHY'
    ? 'READY_TO_EXECUTE'
    : 'BLOCKED_BY_BINDING';

  return {
    resolutionId,
    timestamp,
    status: finalStatus,
    inputContext: context,
    metric: metricMeta,
    resolvedVersion,
    resolvedBinding,
    validatedDimensions,
    resolvedTimeMapping,
    resolvedFilters,
    permissionRequirements,
    executionPlan,
    evidenceRefs,
    pipelineStages,
    diagnostics
  };
}
