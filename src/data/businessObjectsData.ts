export interface BusinessObjectRelationship {
  name: string;        // 关系名称，如 "申请人"
  targetName: string;  // 目标业务对象名称，如 "自然人"
  targetId: string;    // 目标业务对象ID，如 "bo_person"
}

export type BusinessObjectStatus = '已发布' | '草稿' | '已停用';

export interface BusinessObjectDataSupport {
  implementationCount: number; // 正式生效的数据实现数量
  hasImplementation: boolean;
  mainAsset?: string;          // 主要数据实现，如 "公共服务热线工单记录表"
  // 详情页数据支撑 Tab 使用，不在列表相加
  attributeExtensionsCount?: number; // 属性扩展数量（服务工单为 1）
  relatedDataCount?: number;          // 相关数据数量（服务工单为 2）
}

export interface BusinessObjectItem {
  id: string;
  name: string;
  aliases: string[];
  definition: string;
  domain: string;
  relationships: BusinessObjectRelationship[];
  moreRelationshipsCount?: number;
  dataSupport: BusinessObjectDataSupport;
  status: BusinessObjectStatus;
  updatedAt: string; // MM-DD HH:mm
}

export const INITIAL_BUSINESS_OBJECTS: BusinessObjectItem[] = [
  {
    id: 'bo_service_ticket',
    name: '服务工单',
    aliases: ['服务诉求单', '公共服务工单', '群众诉求工单'],
    definition: '表示公众通过热线、线上、窗口等公共服务渠道提出诉求，并经过受理、办理和办结的统一业务主体。',
    domain: '公共服务',
    relationships: [
      { name: '申请人', targetName: '自然人', targetId: 'bo_person' },
      { name: '承办部门', targetName: '组织机构', targetId: 'bo_org' },
      { name: '所属区域', targetName: '行政区域', targetId: 'bo_region' }
    ],
    moreRelationshipsCount: 0,
    dataSupport: {
      implementationCount: 2,
      hasImplementation: true,
      mainAsset: '客服工单当前视图',
      attributeExtensionsCount: 1,
      relatedDataCount: 2
    },
    status: '已发布',
    updatedAt: '09-07 10:30'
  },
  {
    id: 'bo_customer_agent',
    name: '客服坐席',
    aliases: ['客户服务坐席', '服务坐席'],
    definition: '表示承担客户咨询、受理和服务处理职责的业务主体。',
    domain: '公共服务',
    relationships: [
      { name: '所属部门', targetName: '组织机构', targetId: 'bo_org' },
      { name: '受理工单', targetName: '服务工单', targetId: 'bo_service_ticket' }
    ],
    dataSupport: {
      implementationCount: 2,
      hasImplementation: true,
      mainAsset: '客服坐席信息表'
    },
    status: '已发布',
    updatedAt: '08-28 11:14'
  },
  {
    id: 'bo_person',
    name: '自然人',
    aliases: ['居民', '个人'],
    definition: '表示企业或政务业务中被稳定识别和关联的自然人主体。',
    domain: '人口服务',
    relationships: [
      { name: '所属区域', targetName: '行政区域', targetId: 'bo_region' },
      { name: '关联工单', targetName: '服务工单', targetId: 'bo_service_ticket' }
    ],
    dataSupport: {
      implementationCount: 3,
      hasImplementation: true,
      mainAsset: '人口基本信息表'
    },
    status: '已发布',
    updatedAt: '08-26 10:12'
  },
  {
    id: 'bo_org',
    name: '组织机构',
    aliases: ['部门', '单位'],
    definition: '表示承担职责、办理业务或参与协同的组织主体。',
    domain: '组织管理',
    relationships: [
      { name: '所属区域', targetName: '行政区域', targetId: 'bo_region' },
      { name: '承办工单', targetName: '服务工单', targetId: 'bo_service_ticket' }
    ],
    dataSupport: {
      implementationCount: 2,
      hasImplementation: true,
      mainAsset: '组织机构主数据表'
    },
    status: '已发布',
    updatedAt: '08-25 18:06'
  },
  {
    id: 'bo_region',
    name: '行政区域',
    aliases: ['辖区', '区域'],
    definition: '表示具有行政边界和业务归属意义的区域主体。',
    domain: '空间治理',
    relationships: [
      { name: '覆盖人口', targetName: '自然人', targetId: 'bo_person' },
      { name: '包含机构', targetName: '组织机构', targetId: 'bo_org' }
    ],
    dataSupport: {
      implementationCount: 2,
      hasImplementation: true,
      mainAsset: '行政区划表'
    },
    status: '已发布',
    updatedAt: '08-24 09:45'
  },
  {
    id: 'bo_service_item',
    name: '服务事项',
    aliases: ['事项', '服务项目'],
    definition: '表示可以被申请、受理和办理的标准化公共服务事项。',
    domain: '公共服务',
    relationships: [
      { name: '承办部门', targetName: '组织机构', targetId: 'bo_org' },
      { name: '形成工单', targetName: '服务工单', targetId: 'bo_service_ticket' }
    ],
    dataSupport: {
      implementationCount: 3,
      hasImplementation: true,
      mainAsset: '服务事项主数据表'
    },
    status: '已发布',
    updatedAt: '08-27 11:22'
  },
  {
    id: 'bo_contract',
    name: '合同',
    aliases: ['协议'],
    definition: '表示业务参与方之间形成权利与义务约束的合约主体。',
    domain: '企业服务',
    relationships: [
      { name: '签署方', targetName: '企业', targetId: 'bo_enterprise' },
      { name: '关联事项', targetName: '服务事项', targetId: 'bo_service_item' }
    ],
    dataSupport: {
      implementationCount: 0,
      hasImplementation: false
    },
    status: '草稿',
    updatedAt: '08-28 09:31'
  },
  {
    id: 'bo_order',
    name: '订单',
    aliases: ['交易订单'],
    definition: '表示一次明确交易或服务请求形成的业务单据主体。',
    domain: '企业服务',
    relationships: [
      { name: '下单方', targetName: '企业', targetId: 'bo_enterprise' },
      { name: '关联事项', targetName: '服务事项', targetId: 'bo_service_item' }
    ],
    dataSupport: {
      implementationCount: 1,
      hasImplementation: true,
      mainAsset: '订单流水表'
    },
    status: '已停用',
    updatedAt: '07-30 17:08'
  }
];

export const DOMAIN_OPTIONS = [
  '全部业务域',
  '公共服务',
  '人口服务',
  '组织管理',
  '空间治理',
  '企业服务'
] as const;

export const STATUS_OPTIONS = [
  '全部状态',
  '已发布',
  '草稿',
  '已停用'
] as const;

export const DATA_SUPPORT_OPTIONS = [
  '全部',
  '有数据实现',
  '暂无数据实现'
] as const;
