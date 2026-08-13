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
      tableStatus: '尚无有效语义',
      fieldStatus: '首次理解',
    },
    issuesToHandle: {
      title: '4 个关键决策',
      type: 'grain',
    },
    semanticAssociation: {
      terms: ['18 项标准继承', '1 项技术字段'],
      boundObject: '服务工单',
    },
    lastUpdate: {
      time: '刚刚',
      action: 'AI 完成分析',
    },
    actionButton: {
      label: '处理 4 项',
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
    queueCategory: 'pending_review',
    currentSemantics: {
      tableStatus: '核心语义已确认',
      fieldStatus: '最近确认：08-12 16:42',
    },
    issuesToHandle: {
      title: '1 个关键决策',
      type: 'conflict',
    },
    semanticAssociation: {
      terms: ['常住人口', '主身份码'],
      boundObject: '自然人',
    },
    lastUpdate: {
      time: '20 分钟前',
      action: '检测到结构变化',
    },
    actionButton: {
      label: '处理变更',
      variant: 'warning',
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
      tableStatus: '尚无有效语义',
      fieldStatus: '等待 AI 理解生成',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: [],
    },
    lastUpdate: {
      time: '5 分钟前',
      action: '开始 AI 理解',
    },
    actionButton: {
      label: '查看进度',
      variant: 'indigo',
    },
  },
  {
    id: 'sem-4',
    name: '行政区划代码表',
    technicalName: 'region_code',
    qualifiedName: 'common.region.region_code',
    businessDomain: '基础数据',
    assetType: 'Table',
    queueCategory: 'draft_pending',
    currentSemantics: {
      tableStatus: '尚无有效语义',
      fieldStatus: '草稿分析完成',
    },
    issuesToHandle: {
      title: '无关键问题',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['行政区划', '标准代码'],
      boundObject: '行政区划',
    },
    lastUpdate: {
      time: '今天 15:26',
      action: 'AI 完成理解',
    },
    actionButton: {
      label: '确认语义',
      variant: 'primary',
    },
  },
  {
    id: 'sem-5',
    name: '服务工单日报',
    technicalName: 'ticket_daily_summary',
    qualifiedName: 'analytics.public_service.ticket_daily_summary',
    businessDomain: '公共服务',
    assetType: 'View',
    queueCategory: 'confirmed',
    currentSemantics: {
      tableStatus: '核心语义已确认',
      fieldStatus: '已生效业务模型',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['工单日报', '工单统计'],
      boundObject: '服务工单',
    },
    lastUpdate: {
      time: '08-12 19:30',
      action: '最近语义确认',
    },
    actionButton: {
      label: '查看语义',
      variant: 'secondary',
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
      tableStatus: '已有有效语义',
      fieldStatus: '当前存在新的语义更新',
    },
    issuesToHandle: {
      title: '1 个字段语义冲突',
      type: 'conflict',
    },
    semanticAssociation: {
      terms: ['网格事件', '一网统管'],
      boundObject: '网格事件',
    },
    lastUpdate: {
      time: '1 小时前',
      action: '检测到标准变更',
    },
    actionButton: {
      label: '处理 1 项',
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
      tableStatus: '尚无有效语义',
      fieldStatus: '草稿待确认',
    },
    issuesToHandle: {
      title: '无关键问题',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['公用事业账单', '抄表流水'],
    },
    lastUpdate: {
      time: '昨天 18:40',
      action: 'AI 完成理解',
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
      tableStatus: '核心语义已确认',
      fieldStatus: '完全映射行政许可',
    },
    issuesToHandle: {
      title: '—',
      type: 'none',
    },
    semanticAssociation: {
      terms: ['行政审批', '许可事项'],
      boundObject: '行政许可',
    },
    lastUpdate: {
      time: '昨天 10:15',
      action: '最近语义确认',
    },
    actionButton: {
      label: '查看语义',
      variant: 'secondary',
    },
  },
];

