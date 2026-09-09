/**
 * Business Object 领域种子数据
 *
 * 来源：
 * - src/data/businessObjectsData.ts 的 8 个目录对象
 * - 原 BusinessObjectDetailWorkspace 内的 SERVICE_TICKET_* 常量
 * 并为其余对象补齐详情级数据（属性 / 关系 / 数据实现 / 术语 / 指标），
 * 保证 Detail 页对任何对象都不串数据。
 */
import { BusinessObjectStoreState } from './store';
import {
  BusinessObject,
  DataImplementation,
  DataSupportBinding
} from './types';

const SEED_TIMESTAMP = '2026-09-07T10:30:00.000Z';

function attr(id: string, name: string, meaning: string, isIdentifier = false) {
  return { id, name, meaning, ...(isIdentifier ? { isIdentifier: true } : {}) };
}

function rel(id: string, relationName: string, targetObjectId: string, targetObjectName: string, meaning: string) {
  return { id, relationName, targetObjectId, targetObjectName, meaning };
}

const SERVICE_TICKET: BusinessObject = {
  id: 'bo_service_ticket',
  name: '服务工单',
  aliases: ['服务诉求单', '公共服务工单', '群众诉求工单'],
  definition: '表示公众通过热线、线上、窗口等公共服务渠道提出诉求，并经过受理、办理和办结的统一业务主体。',
  domain: '公共服务',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '工单编号', meaning: '用于稳定识别一张服务工单。' },
  attributes: [
    attr('attr_ticket_no', '工单编号', '用于稳定识别一张服务工单。', true),
    attr('attr_status', '处理状态', '表示服务工单当前所处的办理状态。'),
    attr('attr_created_time', '创建时间', '表示服务工单正式形成的业务时间。'),
    attr('attr_accept_time', '受理时间', '表示服务工单被正式受理的时间。'),
    attr('attr_close_time', '办结时间', '表示服务工单完成办理的实际时间。'),
    attr('attr_appeal_type', '诉求类型', '表示当前服务诉求所属的业务分类。'),
    attr('attr_source_channel', '来源渠道', '表示当前服务工单由热线、线上、窗口等哪个公共服务渠道形成。')
  ],
  relationships: [
    rel('rel_st_applicant', '申请人', 'bo_person', '自然人', '表示当前服务工单由哪个自然人提出。'),
    rel('rel_st_dept', '承办部门', 'bo_org', '组织机构', '表示当前服务工单由哪个组织机构承担办理职责。'),
    rel('rel_st_region', '所属区域', 'bo_region', '行政区域', '表示当前服务工单在业务上归属的行政区域。')
  ],
  evidence: [
    {
      id: 'ev_st_identity',
      kind: 'TABLE',
      title: '公共服务热线工单记录表',
      source: 'hotline_db.service.pop_service_hotline',
      version: 'v3.2',
      location: 'ticket_id',
      adoptedDecision: '采用工单编号作为服务工单的稳定身份标识。'
    },
    {
      id: 'ev_st_scope',
      kind: 'DECISION',
      title: '服务工单范围界定评审',
      source: '业务语义评审',
      adoptedDecision: '热线、线上、窗口渠道的诉求均归入服务工单主体。'
    }
  ],
  terms: [
    { id: 'term-st', name: '服务工单', definition: '公众通过公共服务渠道提出的诉求记录单据', domain: '公共服务' },
    { id: 'term-accept', name: '受理', definition: '服务机构审核公众诉求并正式立案接单的业务环节', domain: '公共服务' },
    { id: 'term-finish', name: '办结', definition: '承办部门完成诉求办理并形成答复结果的归档状态', domain: '公共服务' },
    { id: 'term-status', name: '工单状态', definition: '工单在整个生命周期中的流转环节与责任标识', domain: '公共服务' }
  ],
  metrics: [
    { id: 'met-count', name: '工单数量', definition: '统计期内公共服务渠道正式生成的工单总量', domain: '公共服务' },
    { id: 'met-rate', name: '办结率', definition: '在承诺办理期限内完成办结的工单占受理总量的比重', domain: '公共服务' },
    { id: 'met-duration', name: '平均办理时长', definition: '工单自正式受理至最终完成办结所耗费的平均工作小时数', domain: '公共服务' }
  ],
  relatedData: [
    {
      name: '工单状态历史表',
      role: '事件 / 历史数据',
      scope: '公共服务热线渠道',
      note: '一行记录一次热线服务工单状态变化，用于过程追溯。'
    },
    {
      name: '工单月度汇总表',
      role: '分析数据',
      scope: '服务工单整体分析',
      note: '按月份、区域和诉求类型形成聚合统计，不表示具体服务工单实例。'
    }
  ],
  updatedAt: SEED_TIMESTAMP
};

const PERSON: BusinessObject = {
  id: 'bo_person',
  name: '自然人',
  aliases: ['居民', '个人'],
  definition: '表示企业或政务业务中被稳定识别和关联的自然人主体。',
  domain: '人口服务',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '身份标识', meaning: '用于在约定的业务身份范围内稳定识别一个自然人。' },
  attributes: [
    attr('attr_person_id', '身份标识', '用于在约定的业务身份范围内稳定识别一个自然人。', true),
    attr('attr_person_name', '姓名', '表示自然人在业务中的正式核准姓名。'),
    attr('attr_person_birth', '出生日期', '表示自然人的出生时间，用于年龄与生命周期统计。'),
    attr('attr_person_gender', '性别', '表示人口生理或社会性别属性。'),
    attr('attr_person_resident', '常住状态', '表示当前是否属于常住人口统计范围。'),
    attr('attr_person_household', '户籍状态', '表示自然人当前的户籍登记业务状态。'),
    attr('attr_person_region', '所属行政区域', '表示自然人当前所属或统计归属的行政区域。')
  ],
  relationships: [
    rel('rel_person_region', '所属区域', 'bo_region', '行政区域', '表示自然人当前所属或统计归属的行政区域。'),
    rel('rel_person_ticket', '关联工单', 'bo_service_ticket', '服务工单', '表示自然人提出或关联的服务工单。')
  ],
  evidence: [
    {
      id: 'ev_person_identity',
      kind: 'TABLE',
      title: '人口基本信息表',
      source: 'pop_db.person.pop_person_base',
      version: 'v2.4',
      location: 'person_id',
      adoptedDecision: '采用约定业务身份范围内的身份标识识别自然人。'
    }
  ],
  terms: [
    { id: 'term-person', name: '自然人', definition: '在业务中被稳定识别和关联的个人主体', domain: '人口服务' },
    { id: 'term-resident', name: '常住人口', definition: '在统计周期内经常居住在特定区域的自然人群体', domain: '人口服务' }
  ],
  metrics: [
    { id: 'met-population', name: '常住人口数', definition: '统计周期内特定区域常住人口总量', domain: '人口服务' },
    { id: 'met-aging-rate', name: '老龄化率', definition: '60 岁以上常住人口占总常住人口比重', domain: '人口服务' }
  ],
  relatedData: [
    {
      name: '人口变动流水表',
      role: '事件 / 历史数据',
      scope: '人口服务',
      note: '一行记录一次自然人登记信息变动，用于变动追溯。'
    }
  ],
  updatedAt: '2026-08-26T10:12:00.000Z'
};

const ORG: BusinessObject = {
  id: 'bo_org',
  name: '组织机构',
  aliases: ['部门', '单位'],
  definition: '表示承担职责、办理业务或参与协同的组织主体。',
  domain: '组织管理',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '统一社会信用代码', meaning: '用于法定稳定识别一家组织机构主体。' },
  attributes: [
    attr('attr_org_code', '统一社会信用代码', '用于法定稳定识别一家组织机构主体。', true),
    attr('attr_org_name', '机构名称', '组织机构在政务登记中的正式法定名称。'),
    attr('attr_org_level', '机构级别', '组织机构在行政或权责体系中的层级分类。'),
    attr('attr_org_region', '所在区域', '组织机构法定注册或履职所在的空间行政区划。')
  ],
  relationships: [
    rel('rel_org_region', '所属区域', 'bo_region', '行政区域', '表示组织机构注册或履职所在的行政区域。'),
    rel('rel_org_ticket', '承办工单', 'bo_service_ticket', '服务工单', '表示组织机构承担办理职责的服务工单。')
  ],
  evidence: [
    {
      id: 'ev_org_identity',
      kind: 'TABLE',
      title: '组织机构主数据表',
      source: 'org_db.master.org_master',
      version: 'v1.8',
      location: 'uscc_code',
      adoptedDecision: '采用统一社会信用代码作为组织机构法定身份标识。'
    }
  ],
  terms: [
    { id: 'term-org', name: '组织机构', definition: '承担职责、办理业务或参与协同的组织主体', domain: '组织管理' },
    { id: 'term-undertake', name: '承办', definition: '组织机构承担具体业务办理职责的责任关系', domain: '组织管理' }
  ],
  metrics: [
    { id: 'met-org-count', name: '机构数量', definition: '统计期内登记在册的组织机构总数', domain: '组织管理' }
  ],
  relatedData: [
    {
      name: '机构职责事项对照表',
      role: '参考数据',
      scope: '组织管理',
      note: '描述组织机构与职责事项的对应关系，用于职责追溯。'
    }
  ],
  updatedAt: '2026-08-25T18:06:00.000Z'
};

const REGION: BusinessObject = {
  id: 'bo_region',
  name: '行政区域',
  aliases: ['辖区', '区域'],
  definition: '表示具有行政边界和业务归属意义的区域主体。',
  domain: '空间治理',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '行政区划代码', meaning: '用于国家标准体系下稳定识别一个行政区域。' },
  attributes: [
    attr('attr_region_code', '行政区划代码', '用于国家标准体系下稳定识别一个行政区域。', true),
    attr('attr_region_name', '区域名称', '行政区域的标准规范全称。'),
    attr('attr_region_level', '行政层级', '省、市、区县、街道镇等行政层级划分。'),
    attr('attr_region_population', '常住人口总数', '该行政区域统计周期的常住人口总量。')
  ],
  relationships: [
    rel('rel_region_person', '覆盖人口', 'bo_person', '自然人', '表示该行政区域统计覆盖的自然人。'),
    rel('rel_region_org', '包含机构', 'bo_org', '组织机构', '表示该行政区域管辖的组织机构。')
  ],
  evidence: [
    {
      id: 'ev_region_identity',
      kind: 'TABLE',
      title: '行政区划表',
      source: 'space_db.ref.admin_region',
      version: '2026',
      location: 'region_code',
      adoptedDecision: '采用国家标准的行政区划代码识别行政区域。'
    }
  ],
  terms: [
    { id: 'term-region', name: '行政区域', definition: '具有行政边界和业务归属意义的区域主体', domain: '空间治理' }
  ],
  metrics: [
    { id: 'met-region-density', name: '人口密度', definition: '单位面积的常住人口数量', domain: '空间治理' }
  ],
  relatedData: [
    {
      name: '区域边界矢量数据',
      role: '参考数据',
      scope: '空间治理',
      note: '行政区域的空间边界定义，用于地图呈现与空间计算。'
    }
  ],
  updatedAt: '2026-08-24T09:45:00.000Z'
};

const CUSTOMER_AGENT: BusinessObject = {
  id: 'bo_customer_agent',
  name: '客服坐席',
  aliases: ['客户服务坐席', '服务坐席'],
  definition: '表示承担客户咨询、受理和服务处理职责的业务主体。',
  domain: '公共服务',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '坐席工号', meaning: '用于在客服体系中稳定识别一名坐席。' },
  attributes: [
    attr('attr_agent_no', '坐席工号', '用于在客服体系中稳定识别一名坐席。', true),
    attr('attr_agent_name', '坐席姓名', '坐席在客服体系中的正式登记姓名。'),
    attr('attr_agent_dept', '所属部门', '坐席所属的组织机构部门。'),
    attr('attr_agent_skill', '技能组', '坐席承担的咨询技能分组。')
  ],
  relationships: [
    rel('rel_agent_dept', '所属部门', 'bo_org', '组织机构', '表示坐席所属的组织机构部门。'),
    rel('rel_agent_ticket', '受理工单', 'bo_service_ticket', '服务工单', '表示坐席受理的服务工单。')
  ],
  evidence: [
    {
      id: 'ev_agent_identity',
      kind: 'TABLE',
      title: '客服坐席信息表',
      source: 'cs_db.service.agent_info',
      version: 'v1.3',
      location: 'agent_no',
      adoptedDecision: '采用坐席工号识别客服坐席。'
    }
  ],
  terms: [
    { id: 'term-agent', name: '客服坐席', definition: '承担客户咨询、受理和服务处理职责的人员主体', domain: '公共服务' }
  ],
  metrics: [
    { id: 'met-agent-throughput', name: '坐席受理量', definition: '统计期内坐席受理的工单与咨询总量', domain: '公共服务' }
  ],
  relatedData: [
    {
      name: '坐席排班记录表',
      role: '事件 / 历史数据',
      scope: '客服运营',
      note: '一行记录一次坐席排班，用于在岗状态回溯。'
    }
  ],
  updatedAt: '2026-08-28T11:14:00.000Z'
};

const SERVICE_ITEM: BusinessObject = {
  id: 'bo_service_item',
  name: '服务事项',
  aliases: ['事项', '服务项目'],
  definition: '表示可以被申请、受理和办理的标准化公共服务事项。',
  domain: '公共服务',
  status: 'PUBLISHED',
  currentRevision: 'R1',
  identity: { name: '事项编码', meaning: '用于在事项体系中稳定识别一个服务事项。' },
  attributes: [
    attr('attr_item_code', '事项编码', '用于在事项体系中稳定识别一个服务事项。', true),
    attr('attr_item_name', '事项名称', '服务事项的标准化法定名称。'),
    attr('attr_item_type', '事项类型', '服务事项的行政审批或公共服务分类。'),
    attr('attr_item_dept', '实施部门', '承担该事项办理职责的组织机构。')
  ],
  relationships: [
    rel('rel_item_dept', '承办部门', 'bo_org', '组织机构', '表示承担该事项办理职责的组织机构。'),
    rel('rel_item_ticket', '形成工单', 'bo_service_ticket', '服务工单', '表示办理该事项形成的服务工单。')
  ],
  evidence: [
    {
      id: 'ev_item_identity',
      kind: 'TABLE',
      title: '服务事项主数据表',
      source: 'gov_db.master.service_item',
      version: 'v2.0',
      location: 'item_code',
      adoptedDecision: '采用事项编码识别服务事项。'
    }
  ],
  terms: [
    { id: 'term-item', name: '服务事项', definition: '可以被申请、受理和办理的标准化公共服务事项', domain: '公共服务' }
  ],
  metrics: [
    { id: 'met-item-count', name: '事项办件量', definition: '统计期内该服务事项的办件总数', domain: '公共服务' }
  ],
  relatedData: [
    {
      name: '事项办理指南表',
      role: '参考数据',
      scope: '公共服务',
      note: '描述服务事项的办理条件、材料与流程，面向公众公开。'
    }
  ],
  updatedAt: '2026-08-27T11:22:00.000Z'
};

const CONTRACT: BusinessObject = {
  id: 'bo_contract',
  name: '合同',
  aliases: ['协议'],
  definition: '表示业务参与方之间形成权利与义务约束的合约主体。',
  domain: '企业服务',
  status: 'DRAFT',
  currentRevision: 'R0',
  identity: { name: '合同编号', meaning: '用于稳定识别一份合同（草稿阶段待确认）。' },
  attributes: [
    attr('attr_contract_no', '合同编号', '用于稳定识别一份合同（草稿阶段待确认）。', true),
    attr('attr_contract_party', '签署方', '形成合约关系的业务参与方。'),
    attr('attr_contract_amount', '合同金额', '合约约定的权利义务对价。'),
    attr('attr_contract_date', '签订日期', '合同正式签署生效的业务日期。')
  ],
  relationships: [
    rel('rel_contract_party', '签署方', 'bo_enterprise', '企业', '表示合同的签署企业主体（对象建设中）。'),
    rel('rel_contract_item', '关联事项', 'bo_service_item', '服务事项', '表示合同关联的服务事项。')
  ],
  evidence: [],
  terms: [
    { id: 'term-contract', name: '合同', definition: '业务参与方之间形成权利与义务约束的合约', domain: '企业服务' }
  ],
  metrics: [],
  relatedData: [],
  updatedAt: '2026-08-28T09:31:00.000Z'
};

const ORDER: BusinessObject = {
  id: 'bo_order',
  name: '订单',
  aliases: ['交易订单'],
  definition: '表示一次明确交易或服务请求形成的业务单据主体。',
  domain: '企业服务',
  status: 'RETIRED',
  currentRevision: 'R1',
  identity: { name: '订单号', meaning: '用于稳定识别一笔订单。' },
  attributes: [
    attr('attr_order_no', '订单号', '用于稳定识别一笔订单。', true),
    attr('attr_order_amount', '订单金额', '该笔交易的成交金额。'),
    attr('attr_order_time', '下单时间', '订单正式形成的时间。')
  ],
  relationships: [
    rel('rel_order_party', '下单方', 'bo_enterprise', '企业', '表示发起订单的企业主体（对象建设中）。'),
    rel('rel_order_item', '关联事项', 'bo_service_item', '服务事项', '表示订单关联的服务事项。')
  ],
  evidence: [],
  terms: [
    { id: 'term-order', name: '订单', definition: '一次明确交易或服务请求形成的业务单据', domain: '企业服务' }
  ],
  metrics: [],
  relatedData: [],
  updatedAt: '2026-07-30T17:08:00.000Z'
};

export const SEED_OBJECTS: BusinessObject[] = [
  SERVICE_TICKET,
  CUSTOMER_AGENT,
  PERSON,
  ORG,
  REGION,
  SERVICE_ITEM,
  CONTRACT,
  ORDER
];

const SERVICE_TICKET_CURR_VIEW: DataImplementation = {
  id: 'impl_st_curr_view',
  businessObjectId: 'bo_service_ticket',
  name: '客服工单当前视图',
  techName: 'cs_db.service.ticket_curr_view',
  warehouseTable: 'dwd_pub_service_ticket_curr_view_df',
  assetId: 'res-01',
  scope: '客服业务当前工单',
  granularity: '一行一张服务工单',
  identity: '工单编号 · ticket_id',
  scopeRelationText: '基准主要数据实现',
  scopeRelationNote: '承载客服业务当前工单全生命周期核心数据，作为服务工单最优先的数据查询与语义映射基准实现。',
  attributes: [
    { attributeName: '工单编号', sourceName: '客服工单当前视图', field: 'ticket_id', semantics: '服务工单主体标识', isSupported: true, isIdentifier: true },
    { attributeName: '处理状态', sourceName: '客服工单当前视图', field: 'status', semantics: '服务工单处理状态', isSupported: true },
    { attributeName: '创建时间', sourceName: '客服工单当前视图', field: 'created_time', semantics: '服务工单创建时间', isSupported: true },
    { attributeName: '受理时间', sourceName: '客服工单当前视图', field: 'accept_time', semantics: '服务工单受理时间', isSupported: true },
    {
      attributeName: '办结时间',
      sourceName: '客服工单当前视图',
      field: 'finished_time',
      semantics: '表示服务工单完成处理时间。',
      isSupported: true,
      needsCorrection: true,
      correctionReason: '数据语义修订：finished_time 实际表示最后更新时间，需修正为服务工单实际办结时间'
    },
    { attributeName: '诉求类型', sourceName: '客服工单当前视图', field: 'appeal_type', semantics: '服务工单诉求类型', isSupported: true },
    { attributeName: '来源渠道', sourceName: '客服工单当前视图', field: 'source_channel', semantics: '服务工单来源渠道', isSupported: true }
  ],
  relationships: [
    { relationName: '申请人', targetObjectId: 'bo_person', targetObjectName: '自然人', sourceField: '客服工单当前视图 · applicant_id', targetIdentity: '自然人 · 主体标识' },
    { relationName: '承办部门', targetObjectId: 'bo_org', targetObjectName: '组织机构', sourceField: '客服工单当前视图 · handle_dept_id', targetIdentity: '组织机构 · 机构标识' },
    { relationName: '所属区域', targetObjectId: 'bo_region', targetObjectName: '行政区域', sourceField: '客服工单当前视图 · administrative_code', targetIdentity: '行政区域 · 区域标识' }
  ],
  extension: null
};

const SERVICE_TICKET_HOTLINE: DataImplementation = {
  id: 'impl_st_hotline',
  businessObjectId: 'bo_service_ticket',
  name: '公共服务热线工单记录表',
  techName: 'hotline_db.service.pop_service_hotline',
  warehouseTable: 'dwd_pub_service_hotline_ticket_df',
  assetId: 'res-02',
  scope: '公共服务热线渠道',
  granularity: '一行一张服务工单',
  identity: '工单编号 · ticket_id',
  scopeRelationText: '与“客服工单当前视图”存在部分范围重叠',
  scopeRelationNote: '两套实现可能包含部分相同的服务工单。本页只展示已经确认的语义范围关系，不执行跨来源合并、去重或优先级配置。',
  attributes: [
    { attributeName: '工单编号', sourceName: '公共服务热线工单记录表', field: 'ticket_id', semantics: '服务工单主体标识', isSupported: true, isIdentifier: true },
    { attributeName: '处理状态', sourceName: '公共服务热线工单记录表', field: 'status', semantics: '服务工单处理状态', isSupported: true },
    { attributeName: '创建时间', sourceName: '公共服务热线工单记录表', field: 'created_time', semantics: '服务工单创建时间', isSupported: true },
    { attributeName: '受理时间', sourceName: '公共服务热线工单记录表', field: 'accept_time', semantics: '服务工单受理时间', isSupported: true },
    { attributeName: '办结时间', sourceName: '公共服务热线工单记录表', field: 'close_time', semantics: '服务工单办结时间', isSupported: true },
    { attributeName: '诉求类型', sourceName: '工单扩展信息表', isExtension: true, field: 'appeal_type', semantics: '服务工单诉求类型', isSupported: true },
    { attributeName: '来源渠道', sourceName: '—', field: '—', semantics: '当前实现暂无正式支撑', isSupported: false }
  ],
  relationships: [
    { relationName: '申请人', targetObjectId: 'bo_person', targetObjectName: '自然人', sourceField: '公共服务热线工单记录表 · person_id', targetIdentity: '自然人 · 主体标识' },
    { relationName: '承办部门', targetObjectId: 'bo_org', targetObjectName: '组织机构', sourceField: '公共服务热线工单记录表 · dept_id', targetIdentity: '组织机构 · 机构标识' },
    { relationName: '所属区域', targetObjectId: 'bo_region', targetObjectName: '行政区域', sourceField: '公共服务热线工单记录表 · region_code', targetIdentity: '行政区域 · 区域标识' }
  ],
  extension: {
    name: '工单扩展信息表',
    techName: 'hotline_db.service.ticket_extension',
    status: '当前有效',
    parentImplementation: '公共服务热线工单记录表',
    identityMapping: '工单编号 · ticket_id',
    providedAttr: '诉求类型 → appeal_type',
    providedField: 'appeal_type',
    note: '通过相同的工单身份空间，为当前数据实现中的同一服务工单补充业务属性。'
  }
};

function impl(
  id: string,
  businessObjectId: string,
  name: string,
  techName: string,
  warehouseTable: string,
  assetId: string,
  scope: string,
  granularity: string,
  identity: string,
  attributes: DataImplementation['attributes'],
  relationships: DataImplementation['relationships']
): DataImplementation {
  return {
    id,
    businessObjectId,
    name,
    techName,
    warehouseTable,
    assetId,
    scope,
    granularity,
    identity,
    scopeRelationText: '正式数据实现',
    scopeRelationNote: '承载该业务对象核心业务数据的正式实现。',
    attributes,
    relationships,
    extension: null
  };
}

const PERSON_IMPLS: DataImplementation[] = [
  impl(
    'impl_person_base',
    'bo_person',
    '人口基本信息表',
    'pop_db.person.pop_person_base',
    'dwd_pop_person_base_df',
    'res-11',
    '人口基础登记',
    '一行一个自然人',
    '身份标识 · person_id',
    [
      { attributeName: '身份标识', sourceName: '人口基本信息表', field: 'person_id', semantics: '自然人主体标识', isSupported: true, isIdentifier: true },
      { attributeName: '姓名', sourceName: '人口基本信息表', field: 'person_name', semantics: '自然人核准姓名', isSupported: true },
      { attributeName: '出生日期', sourceName: '人口基本信息表', field: 'birth_date', semantics: '自然人出生日期', isSupported: true },
      { attributeName: '性别', sourceName: '人口基本信息表', field: 'gender_code', semantics: '自然人性别', isSupported: true },
      { attributeName: '户籍状态', sourceName: '人口基本信息表', field: 'household_status', semantics: '户籍登记状态', isSupported: true },
      { attributeName: '所属行政区域', sourceName: '人口基本信息表', field: 'region_code', semantics: '统计归属行政区域', isSupported: true }
    ],
    [
      { relationName: '所属区域', targetObjectId: 'bo_region', targetObjectName: '行政区域', sourceField: '人口基本信息表 · region_code', targetIdentity: '行政区域 · 区域标识' },
      { relationName: '关联工单', targetObjectId: 'bo_service_ticket', targetObjectName: '服务工单', sourceField: '人口基本信息表 · person_id', targetIdentity: '服务工单 · 申请人标识' }
    ]
  ),
  impl(
    'impl_person_ext',
    'bo_person',
    '人口扩展信息',
    'pop_db.person.pop_person_ext',
    'dwd_pop_person_ext_df',
    'res-12',
    '人口扩展登记',
    '一行一个自然人',
    '身份标识 · person_id',
    [
      { attributeName: '身份标识', sourceName: '人口扩展信息', field: 'person_id', semantics: '自然人主体标识', isSupported: true, isIdentifier: true },
      { attributeName: '常住状态', sourceName: '人口扩展信息', field: 'resident_flag', semantics: '是否常住人口', isSupported: true },
      { attributeName: '所属行政区域', sourceName: '人口扩展信息', field: 'resident_region_code', semantics: '常住归属行政区域', isSupported: true }
    ],
    [
      { relationName: '所属区域', targetObjectId: 'bo_region', targetObjectName: '行政区域', sourceField: '人口扩展信息 · resident_region_code', targetIdentity: '行政区域 · 区域标识' }
    ]
  ),
  impl(
    'impl_person_stat',
    'bo_person',
    '常住人口统计表',
    'pop_db.stat.pop_resident_stat',
    'dws_pop_resident_stat_df',
    'res-13',
    '人口统计分析',
    '一行一个区域统计周期',
    '区域 · stat_region_code',
    [
      { attributeName: '所属行政区域', sourceName: '常住人口统计表', field: 'stat_region_code', semantics: '统计行政区域', isSupported: true }
    ],
    []
  )
];

const ORG_IMPLS: DataImplementation[] = [
  impl(
    'impl_org_master',
    'bo_org',
    '组织机构主数据表',
    'org_db.master.org_master',
    'dim_org_master_df',
    'res-21',
    '组织机构全量',
    '一行一个组织机构',
    '统一社会信用代码 · uscc_code',
    [
      { attributeName: '统一社会信用代码', sourceName: '组织机构主数据表', field: 'uscc_code', semantics: '组织机构法定标识', isSupported: true, isIdentifier: true },
      { attributeName: '机构名称', sourceName: '组织机构主数据表', field: 'org_name', semantics: '组织机构法定名称', isSupported: true },
      { attributeName: '机构级别', sourceName: '组织机构主数据表', field: 'org_level', semantics: '组织机构层级', isSupported: true },
      { attributeName: '所在区域', sourceName: '组织机构主数据表', field: 'region_code', semantics: '注册或履职行政区域', isSupported: true }
    ],
    [
      { relationName: '所属区域', targetObjectId: 'bo_region', targetObjectName: '行政区域', sourceField: '组织机构主数据表 · region_code', targetIdentity: '行政区域 · 区域标识' },
      { relationName: '承办工单', targetObjectId: 'bo_service_ticket', targetObjectName: '服务工单', sourceField: '组织机构主数据表 · uscc_code', targetIdentity: '服务工单 · 承办部门标识' }
    ]
  ),
  impl(
    'impl_org_duty',
    'bo_org',
    '机构职责对照表',
    'org_db.master.org_duty',
    'dim_org_duty_df',
    'res-22',
    '机构职责管理',
    '一行一个机构事项职责',
    '职责编码 · duty_code',
    [
      { attributeName: '机构名称', sourceName: '机构职责对照表', field: 'org_name', semantics: '承办机构名称', isSupported: true }
    ],
    []
  )
];

const REGION_IMPLS: DataImplementation[] = [
  impl(
    'impl_region_admin',
    'bo_region',
    '行政区划表',
    'space_db.ref.admin_region',
    'dim_admin_region_df',
    'res-31',
    '国家标准行政区划',
    '一行一个行政区域',
    '行政区划代码 · region_code',
    [
      { attributeName: '行政区划代码', sourceName: '行政区划表', field: 'region_code', semantics: '行政区域法定标识', isSupported: true, isIdentifier: true },
      { attributeName: '区域名称', sourceName: '行政区划表', field: 'region_name', semantics: '行政区域规范全称', isSupported: true },
      { attributeName: '行政层级', sourceName: '行政区划表', field: 'region_level', semantics: '行政层级划分', isSupported: true }
    ],
    [
      { relationName: '覆盖人口', targetObjectId: 'bo_person', targetObjectName: '自然人', sourceField: '行政区划表 · region_code', targetIdentity: '自然人 · 所属区域' },
      { relationName: '包含机构', targetObjectId: 'bo_org', targetObjectName: '组织机构', sourceField: '行政区划表 · region_code', targetIdentity: '组织机构 · 所在区域' }
    ]
  ),
  impl(
    'impl_region_stat',
    'bo_region',
    '区域人口统计表',
    'space_db.stat.region_pop_stat',
    'dws_region_pop_stat_df',
    'res-32',
    '区域人口统计',
    '一行一个区域统计周期',
    '区域 · stat_region_code',
    [
      { attributeName: '常住人口总数', sourceName: '区域人口统计表', field: 'resident_total', semantics: '常住人口总量', isSupported: true }
    ],
    []
  )
];

const AGENT_IMPLS: DataImplementation[] = [
  impl(
    'impl_agent_info',
    'bo_customer_agent',
    '客服坐席信息表',
    'cs_db.service.agent_info',
    'dim_cs_agent_df',
    'res-41',
    '客服坐席全量',
    '一行一名坐席',
    '坐席工号 · agent_no',
    [
      { attributeName: '坐席工号', sourceName: '客服坐席信息表', field: 'agent_no', semantics: '坐席主体标识', isSupported: true, isIdentifier: true },
      { attributeName: '坐席姓名', sourceName: '客服坐席信息表', field: 'agent_name', semantics: '坐席登记姓名', isSupported: true },
      { attributeName: '所属部门', sourceName: '客服坐席信息表', field: 'dept_id', semantics: '坐席所属部门', isSupported: true },
      { attributeName: '技能组', sourceName: '客服坐席信息表', field: 'skill_group', semantics: '坐席技能分组', isSupported: true }
    ],
    [
      { relationName: '所属部门', targetObjectId: 'bo_org', targetObjectName: '组织机构', sourceField: '客服坐席信息表 · dept_id', targetIdentity: '组织机构 · 机构标识' },
      { relationName: '受理工单', targetObjectId: 'bo_service_ticket', targetObjectName: '服务工单', sourceField: '客服坐席信息表 · agent_no', targetIdentity: '服务工单 · 受理坐席' }
    ]
  ),
  impl(
    'impl_agent_schedule',
    'bo_customer_agent',
    '坐席排班记录表',
    'cs_db.service.agent_schedule',
    'dwd_cs_agent_schedule_df',
    'res-42',
    '客服排班运营',
    '一行一次排班',
    '排班编码 · schedule_id',
    [
      { attributeName: '坐席工号', sourceName: '坐席排班记录表', field: 'agent_no', semantics: '坐席主体标识', isSupported: true }
    ],
    []
  )
];

const ITEM_IMPLS: DataImplementation[] = [
  impl(
    'impl_item_master',
    'bo_service_item',
    '服务事项主数据表',
    'gov_db.master.service_item',
    'dim_service_item_df',
    'res-51',
    '服务事项全量',
    '一行一个服务事项',
    '事项编码 · item_code',
    [
      { attributeName: '事项编码', sourceName: '服务事项主数据表', field: 'item_code', semantics: '服务事项标识', isSupported: true, isIdentifier: true },
      { attributeName: '事项名称', sourceName: '服务事项主数据表', field: 'item_name', semantics: '服务事项法定名称', isSupported: true },
      { attributeName: '事项类型', sourceName: '服务事项主数据表', field: 'item_type', semantics: '事项分类', isSupported: true },
      { attributeName: '实施部门', sourceName: '服务事项主数据表', field: 'dept_id', semantics: '实施部门标识', isSupported: true }
    ],
    [
      { relationName: '承办部门', targetObjectId: 'bo_org', targetObjectName: '组织机构', sourceField: '服务事项主数据表 · dept_id', targetIdentity: '组织机构 · 机构标识' },
      { relationName: '形成工单', targetObjectId: 'bo_service_ticket', targetObjectName: '服务工单', sourceField: '服务事项主数据表 · item_code', targetIdentity: '服务工单 · 关联事项' }
    ]
  ),
  impl(
    'impl_item_guide',
    'bo_service_item',
    '事项办理指南表',
    'gov_db.master.service_item_guide',
    'dim_service_item_guide_df',
    'res-52',
    '事项办理指引',
    '一行一个事项指南',
    '指南编码 · guide_id',
    [
      { attributeName: '事项编码', sourceName: '事项办理指南表', field: 'item_code', semantics: '服务事项标识', isSupported: true }
    ],
    []
  ),
  impl(
    'impl_item_material',
    'bo_service_item',
    '事项材料清单表',
    'gov_db.master.service_item_material',
    'dim_service_item_material_df',
    'res-53',
    '事项材料管理',
    '一行一项材料',
    '材料编码 · material_id',
    [
      { attributeName: '事项编码', sourceName: '事项材料清单表', field: 'item_code', semantics: '服务事项标识', isSupported: true }
    ],
    []
  )
];

const ORDER_IMPL: DataImplementation[] = [
  impl(
    'impl_order_flow',
    'bo_order',
    '订单流水表',
    'biz_db.trade.order_flow',
    'dwd_biz_order_flow_df',
    'res-61',
    '历史交易订单',
    '一行一笔订单',
    '订单号 · order_no',
    [
      { attributeName: '订单号', sourceName: '订单流水表', field: 'order_no', semantics: '订单标识', isSupported: true, isIdentifier: true },
      { attributeName: '订单金额', sourceName: '订单流水表', field: 'order_amount', semantics: '成交金额', isSupported: true },
      { attributeName: '下单时间', sourceName: '订单流水表', field: 'order_time', semantics: '订单形成时间', isSupported: true }
    ],
    []
  )
];

export const SEED_IMPLEMENTATIONS: DataImplementation[] = [
  SERVICE_TICKET_CURR_VIEW,
  SERVICE_TICKET_HOTLINE,
  ...PERSON_IMPLS,
  ...ORG_IMPLS,
  ...REGION_IMPLS,
  ...AGENT_IMPLS,
  ...ITEM_IMPLS,
  ...ORDER_IMPL
];

function binding(
  id: string,
  businessObjectId: string,
  implementationId: string,
  status: DataSupportBinding['status'],
  role: BindingRoleSeed,
  scope: string,
  revision = 'R1'
): DataSupportBinding {
  return {
    id,
    businessObjectId,
    implementationId,
    status,
    role,
    scope,
    evidence: [],
    revision,
    createdAt: SEED_TIMESTAMP,
    ...(status === 'CANDIDATE' ? {} : { confirmedAt: SEED_TIMESTAMP })
  };
}

type BindingRoleSeed = DataSupportBinding['role'];

export const SEED_BINDINGS: DataSupportBinding[] = [
  binding('bind_st_curr_view', 'bo_service_ticket', 'impl_st_curr_view', 'EFFECTIVE', 'PRIMARY', '客服业务当前工单'),
  binding('bind_st_hotline', 'bo_service_ticket', 'impl_st_hotline', 'CANDIDATE', 'SECONDARY', '公共服务热线渠道'),
  binding('bind_person_base', 'bo_person', 'impl_person_base', 'EFFECTIVE', 'PRIMARY', '人口基础登记'),
  // 语义修订触发复核示例：自然人 R2 修订调整「常住状态」口径，人口扩展信息绑定需复核
  {
    ...binding('bind_person_ext', 'bo_person', 'impl_person_ext', 'NEEDS_REVALIDATION', 'SECONDARY', '人口扩展登记', 'R2'),
    revalidation: {
      reason: '「自然人」业务对象 R2 修订调整了「常住状态」属性的业务口径，需要复核该实现是否仍满足数据支撑要求。',
      sourceRevision: 'R2',
      affectedTargets: ['常住状态', '户籍类型'],
      raisedAt: '2026-09-08T09:00:00.000Z'
    }
  },
  binding('bind_person_stat', 'bo_person', 'impl_person_stat', 'EFFECTIVE', 'SECONDARY', '人口统计分析'),
  binding('bind_org_master', 'bo_org', 'impl_org_master', 'EFFECTIVE', 'PRIMARY', '组织机构全量'),
  binding('bind_org_duty', 'bo_org', 'impl_org_duty', 'EFFECTIVE', 'SECONDARY', '机构职责管理'),
  binding('bind_region_admin', 'bo_region', 'impl_region_admin', 'EFFECTIVE', 'PRIMARY', '国家标准行政区划'),
  binding('bind_region_stat', 'bo_region', 'impl_region_stat', 'EFFECTIVE', 'SECONDARY', '区域人口统计'),
  binding('bind_agent_info', 'bo_customer_agent', 'impl_agent_info', 'EFFECTIVE', 'PRIMARY', '客服坐席全量'),
  binding('bind_agent_schedule', 'bo_customer_agent', 'impl_agent_schedule', 'EFFECTIVE', 'SECONDARY', '客服排班运营'),
  binding('bind_item_master', 'bo_service_item', 'impl_item_master', 'EFFECTIVE', 'PRIMARY', '服务事项全量'),
  binding('bind_item_guide', 'bo_service_item', 'impl_item_guide', 'EFFECTIVE', 'SECONDARY', '事项办理指引'),
  binding('bind_item_material', 'bo_service_item', 'impl_item_material', 'EFFECTIVE', 'SECONDARY', '事项材料管理'),
  binding('bind_order_flow', 'bo_order', 'impl_order_flow', 'RETIRED', 'SECONDARY', '历史交易订单')
];

export function buildSeedState(): BusinessObjectStoreState {
  // 深拷贝种子：领域服务会原地修改状态对象，若与模块级种子常量共享引用，
  // 写入会污染种子，导致 resetState 后无法恢复初始状态
  const objects = structuredClone(SEED_OBJECTS);
  const implementations = structuredClone(SEED_IMPLEMENTATIONS);
  const bindings = structuredClone(SEED_BINDINGS);
  return {
    version: 1,
    objects: Object.fromEntries(objects.map((object) => [object.id, object])),
    implementations: Object.fromEntries(implementations.map((implementation) => [implementation.id, implementation])),
    bindings: Object.fromEntries(bindings.map((bindingItem) => [bindingItem.id, bindingItem])),
    groundingRevisions: {},
    revisions: {},
    taskContexts: {}
  };
}
