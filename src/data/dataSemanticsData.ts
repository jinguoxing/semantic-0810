import { DataSemanticsQueueItem } from '../types';

export const MOCK_DATA_SEMANTICS_QUEUE: DataSemanticsQueueItem[] = [
  {
    id: 'sem-1',
    name: '公共服务热线工单记录表',
    technicalName: 'pop_service_hotline',
    qualifiedName: 'hotline_db.service.pop_service_hotline',
    businessDomain: '公共服务',
    assetType: 'Table',
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: '表语义已确认',
      fieldStatus: '核心字段已确认',
      detailNote: '4项非核心字段待完善',
    },
    issuesToHandle: {
      title: '办结时间语义冲突',
      type: 'conflict',
    },
    semanticAssociation: {
      terms: ['服务热线工单', '办结'],
      boundObject: '服务工单',
      objectSuggestions: ['对象建议 2'],
    },
    lastUpdate: {
      time: '今天 17:16',
      action: '语义确认',
    },
    actionButton: {
      label: '处理问题',
      variant: 'danger',
    },
  },
  {
    id: 'sem-2',
    name: '人口基本信息表',
    technicalName: 'person_basic_info',
    qualifiedName: 'population.core.person_basic_info',
    businessDomain: '人口服务',
    assetType: 'Table',
    queueCategory: 'draft_pending',
    currentSemantics: {
      tableStatus: 'AI草稿已生成',
      fieldStatus: '表语义待确认',
      detailNote: '12项核心字段待确认',
    },
    issuesToHandle: {
      title: '对象身份待确认',
      type: 'identity',
    },
    semanticAssociation: {
      terms: ['常住人口', '主身份码'],
      boundObject: '自然人',
      objectSuggestions: ['已有对象匹配'],
    },
    lastUpdate: {
      time: '今天 16:42',
      action: 'AI完成理解',
    },
    actionButton: {
      label: '确认语义',
      variant: 'primary',
    },
  },
  {
    id: 'sem-3',
    name: '企业基本信息',
    technicalName: 'enterprise_info',
    qualifiedName: 'enterprise.core.enterprise_info',
    businessDomain: '企业服务',
    assetType: 'Table',
    queueCategory: 'ai_understanding',
    currentSemantics: {
      tableStatus: '当前无新的有效草稿',
      fieldStatus: 'AI正在理解表与字段语义',
      detailNote: '耗时预计 45 秒',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: [],
      boundObject: undefined,
      objectSuggestions: [],
    },
    lastUpdate: {
      time: '5分钟前',
      action: 'AI理解中',
    },
    actionButton: {
      label: '查看进度',
      variant: 'indigo',
    },
  },
  {
    id: 'sem-4',
    name: '', // Empty display name -> shows technicalName as main heading
    technicalName: 'complaint_detail',
    qualifiedName: 'customer_service.raw.complaint_detail',
    businessDomain: '客户服务',
    assetType: 'Table',
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: '尚未开始语义理解',
      fieldStatus: '无有效草稿',
      detailNote: '等待首次 AI 自动拉取或发起',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: [],
      boundObject: undefined,
      objectSuggestions: [],
    },
    lastUpdate: {
      time: '今天 11:30',
      action: '新纳入语义治理范围',
    },
    actionButton: {
      label: '开始理解',
      variant: 'primary',
    },
  },
  {
    id: 'sem-5',
    name: '自然人家庭关系表',
    technicalName: 'person_family_rel',
    qualifiedName: 'population.relation.person_family_rel',
    businessDomain: '人口服务',
    assetType: 'Table',
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: '核心语义已确认',
      fieldStatus: '2个新增字段正在重新理解',
      detailNote: '底层 DDL 变更衍生',
    },
    issuesToHandle: {
      title: '2 个新增字段语义待确认',
      type: 'field_pending',
    },
    semanticAssociation: {
      terms: ['户籍亲属', '户主关联'],
      boundObject: '自然人家庭',
      objectSuggestions: ['对象建议 1'],
    },
    lastUpdate: {
      time: '今天 15:10',
      action: '增量架构变更',
    },
    actionButton: {
      label: '处理变更',
      variant: 'warning',
    },
  },
  {
    id: 'sem-6',
    name: '城市网格化事件明细',
    technicalName: 'grid_event_record',
    qualifiedName: 'city_governance.grid.grid_event_record',
    businessDomain: '城市治理',
    assetType: 'Table',
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: '表语义已确认',
      fieldStatus: '核心字段已确认',
      detailNote: '单表数据主键存在微小歧义',
    },
    issuesToHandle: {
      title: '表粒度需要确认',
      type: 'grain',
    },
    semanticAssociation: {
      terms: ['网格事件', '一网统管'],
      boundObject: '网格事件',
      objectSuggestions: ['对象建议 1'],
    },
    lastUpdate: {
      time: '今天 14:05',
      action: '语义更新',
    },
    actionButton: {
      label: '处理问题',
      variant: 'danger',
    },
  },
  {
    id: 'sem-7',
    name: '水电气缴费流水数据集',
    technicalName: 'public_utility_payment',
    qualifiedName: 'utility.billing.public_utility_payment',
    businessDomain: '城市治理',
    assetType: 'Dataset',
    queueCategory: 'draft_pending',
    currentSemantics: {
      tableStatus: 'AI草稿已生成',
      fieldStatus: '表语义待确认',
      detailNote: '5项核心字段待确认',
    },
    issuesToHandle: {
      title: '5 个核心字段待确认',
      type: 'field_pending',
    },
    semanticAssociation: {
      terms: ['公用事业账单', '抄表流水'],
      boundObject: undefined,
      objectSuggestions: ['对象建议 2'],
    },
    lastUpdate: {
      time: '昨天 18:40',
      action: 'AI完成理解',
    },
    actionButton: {
      label: '确认语义',
      variant: 'primary',
    },
  },
  {
    id: 'sem-8',
    name: '行政审批事项视图',
    technicalName: 'gov_approval_process_v',
    qualifiedName: 'approval_db.view.gov_approval_process_v',
    businessDomain: '公共服务',
    assetType: 'View',
    queueCategory: 'confirmed',
    currentSemantics: {
      tableStatus: '表语义已确认',
      fieldStatus: '核心字段已确认',
      detailNote: '完全与行政许可业务对象挂钩',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['行政审批', '许可事项'],
      boundObject: '行政许可',
      objectSuggestions: [],
    },
    lastUpdate: {
      time: '昨天 10:15',
      action: '语义确认',
    },
    actionButton: {
      label: '查看语义',
      variant: 'secondary',
    },
  },
  {
    id: 'sem-9',
    name: '居民不动产登记记录',
    technicalName: 'property_registration',
    qualifiedName: 'realestate.core.property_registration',
    businessDomain: '人口服务',
    assetType: 'Table',
    queueCategory: 'confirmed',
    currentSemantics: {
      tableStatus: '表语义已确认',
      fieldStatus: '核心字段已确认',
      detailNote: '全量映射产权产别规范',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['不动产权证', '房屋抵押'],
      boundObject: '不动产权',
      objectSuggestions: [],
    },
    lastUpdate: {
      time: '3天前',
      action: '语义确认',
    },
    actionButton: {
      label: '查看语义',
      variant: 'secondary',
    },
  },
  {
    id: 'sem-10',
    name: '公共卫生防疫监测数据集',
    technicalName: 'epidemic_surveillance_dataset',
    qualifiedName: 'health.stat.epidemic_surveillance_dataset',
    businessDomain: '公共服务',
    assetType: 'Dataset',
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: 'AI草稿已生成',
      fieldStatus: '核心字段待确认',
      detailNote: '存在传染病代码与国家标准冲突',
    },
    issuesToHandle: {
      title: '2 个核心字段存在语义冲突',
      type: 'conflict',
    },
    semanticAssociation: {
      terms: ['公共卫生', '哨点监测'],
      boundObject: undefined,
      objectSuggestions: ['对象建议 1'],
    },
    lastUpdate: {
      time: '3天前',
      action: '发现冲突',
    },
    actionButton: {
      label: '处理问题',
      variant: 'danger',
    },
  },
];
