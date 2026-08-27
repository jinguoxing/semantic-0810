/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StageHeader } from './components/StageHeader';
import { LeftTaskQueue } from './components/LeftTaskQueue';
import { MiddleWorkspace } from './components/MiddleWorkspace';
import { RightAssetPanel } from './components/RightAssetPanel';
import { BottomImpactAnalysis } from './components/BottomImpactAnalysis';
import { LeftTableContextPanel } from './components/LeftTableContextPanel';
import { MiddleTableWorkspace } from './components/MiddleTableWorkspace';
import { RightTableProfilePanel } from './components/RightTableProfilePanel';
import { BottomTableContextPanel } from './components/BottomTableContextPanel';
import { BatchConfirmModal } from './components/BatchConfirmModal';
import { LineageModal } from './components/LineageModal';
import { ObjectModelingModal } from './components/ObjectModelingModal';
import { EnterpriseLauncher } from './components/EnterpriseLauncher';
import { PersonalCenterPanel } from './components/PersonalCenterPanel';
import { XinoHomeWorkspace } from './components/XinoHomeWorkspace';
import { BusinessObjectDiscoveryWorkspace } from './components/BusinessObjectDiscoveryWorkspace';
import { BusinessObjectModelingWorkspace } from './components/BusinessObjectModelingWorkspace';
import { DataAssetsCatalogWorkspace } from './components/DataAssetsCatalogWorkspace';
import { DataSemanticsQueueWorkspace } from './components/DataSemanticsQueueWorkspace';
import { DataAssetDetailWorkspace } from './components/DataAssetDetailWorkspace';
import { TableSemanticWorkspace } from './components/TableSemanticWorkspace';
import { FieldSemanticWorkspace } from './components/FieldSemanticWorkspace';
import { DataStandardsWorkspace } from './components/DataStandardsWorkspace';
import { CreateDataElementStandardWorkspace } from './components/CreateDataElementStandardWorkspace';
import { CreateValueDomainStandardWorkspace } from './components/CreateValueDomainStandardWorkspace';
import { ImportStandardsWorkspace } from './components/ImportStandardsWorkspace';
import { MappingConflictReviewWorkspace } from './components/MappingConflictReviewWorkspace';
import { StandardMatchingWorkspace } from './components/StandardMatchingWorkspace';
import { StandardProposalReviewWorkspace } from './components/StandardProposalReviewWorkspace';
import { StandardCheckWorkspace } from './components/StandardCheckWorkspace';
import { StandardCheckIssueDetailWorkspace } from './components/StandardCheckIssueDetailWorkspace';
import { StandardDetailWorkspace } from './components/StandardDetailWorkspace';
import { MetricRegistryWorkspace } from './components/MetricRegistryWorkspace';
import { metricRegistryService } from './data/metricRegistryData';
import { MetricAuthoringWorkspace } from './components/MetricAuthoringWorkspace';
import { MetricDetailWorkspace } from './components/MetricDetailWorkspace';
import { BusinessObjectDetailWorkspace } from './components/BusinessObjectDetailWorkspace';
import { AccessReviewWorkspace } from './components/AccessReviewWorkspace';
import { AccessReviewDetailWorkspace } from './components/AccessReviewDetailWorkspace';
import { DataServiceMarketplaceWorkspace } from './components/DataServiceMarketplaceWorkspace';
import { ResourceExplorerWorkspace } from './components/ResourceExplorerWorkspace';
import { MultiResourceAccessRequestWorkspace } from './components/MultiResourceAccessRequestWorkspace';
import { MyAccessRequestsWorkspace } from './components/MyAccessRequestsWorkspace';
import { AgentRegistryWorkspace } from './components/AgentRegistryWorkspace';
import { AgentDefinitionWorkspace } from './components/AgentDefinitionWorkspace';
import { AgentPublishWorkspace } from './components/AgentPublishWorkspace';
import { ToastContainer, ToastMessage } from './components/Toast';
import { INITIAL_FIELDS_QUEUE, GOVERNANCE_DATA_MAP } from './data/mockData';
import { FieldItem, CompleteFieldGovernanceData, MetricDraftInitialData } from './types';

export default function App() {
  const [currentNav, setCurrentNav] = useState<'home' | 'governance' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'business_object_detail' | 'table_workspace' | 'field_workspace' | 'data_standards' | 'standard_detail' | 'standard_matching' | 'standard_proposal_review' | 'standard_check' | 'standard_check_issue_detail' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'metrics' | 'create_metric' | 'metric_change_draft' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request' | 'my_requests' | 'access_review' | 'access_review_detail' | 'agents' | 'agent_center' | 'agent_definition' | 'agent_detail' | 'agent_publish'>('agent_publish');
  const [viewTab, setViewTab] = useState<'field' | 'table' | 'discovery' | 'modeling' | 'assets' | 'semantics' | 'asset_detail' | 'metric_detail' | 'business_object_detail' | 'table_workspace' | 'field_workspace' | 'data_standards' | 'standard_detail' | 'standard_matching' | 'standard_proposal_review' | 'standard_check' | 'standard_check_issue_detail' | 'create_data_element_standard' | 'create_value_domain_standard' | 'import_standards' | 'mapping_conflict_review' | 'metrics' | 'create_metric' | 'metric_change_draft' | 'marketplace' | 'marketplace_resources' | 'multi_resource_request' | 'my_requests' | 'access_review' | 'access_review_detail' | 'agents' | 'agent_center' | 'agent_definition' | 'agent_detail' | 'agent_publish'>('agent_publish');
  const [authoringMode, setAuthoringMode] = useState<'ai_prompt' | 'blank' | 'constructing' | 'draft' | 'imported_draft' | 'change_draft'>('ai_prompt');
  const [authoringInitialDraft, setAuthoringInitialDraft] = useState<MetricDraftInitialData | undefined>(undefined);
  const [resourceSearchQuery, setResourceSearchQuery] = useState<string>('');
  const [assetDetailContext, setAssetDetailContext] = useState<{ assetId?: string; fromGoalSearch?: boolean; goalQuery?: string }>({ assetId: 'res-02', fromGoalSearch: false, goalQuery: '' });
  const [metricDetailContext, setMetricDetailContext] = useState<{ metricId?: string; fromGoalSearch?: boolean; goalQuery?: string }>({ metricId: 'res-03', fromGoalSearch: false, goalQuery: '' });
  const [selectedChangeMetricId, setSelectedChangeMetricId] = useState<string>('met_001');
  const [businessObjectDetailContext, setBusinessObjectDetailContext] = useState<{ objectId?: string; fromGoalSearch?: boolean; goalQuery?: string }>({ objectId: 'bo_person', fromGoalSearch: false, goalQuery: '' });
  const [fields, setFields] = useState<FieldItem[]>(INITIAL_FIELDS_QUEUE);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('person_id');
  const [activeRightTab, setActiveRightTab] = useState<'result' | 'adjust' | 'history'>('result');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isLineageModalOpen, setIsLineageModalOpen] = useState<boolean>(false);
  const [isModelingModalOpen, setIsModelingModalOpen] = useState<boolean>(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [currentModule, setCurrentModule] = useState<string>('xino_partner');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  // Helper to trigger toast
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectModule = (moduleKey: string, moduleName: string) => {
    setCurrentModule(moduleKey);
    if (moduleKey === 'xino_partner') {
      setCurrentNav('home');
      addToast('success', '已切换至 Xino 智能伙伴', '已进入 AI 智能协同工作台');
    } else if (moduleKey === 'data_governance') {
      setCurrentNav('governance');
      setViewTab('table');
      addToast('success', '已切换至 数据治理', '已载入 pop_service_hotline 表语义理解与治理工作台');
    } else if (moduleKey === 'business_semantics') {
      setCurrentNav('metrics');
      setViewTab('metrics');
      addToast('success', '已切换至 业务语义 · 指标', '已载入 Metric Registry 指标语义注册表');
    } else if (moduleKey === 'data_market' || moduleKey === 'data_marketplace') {
      setCurrentNav('marketplace');
      setViewTab('marketplace');
      addToast('success', '已切换至 数据服务超市', '已进入数据服务超市 · 发现首页');
    } else if (moduleKey === 'admin_center') {
      setCurrentNav('access_review');
      setViewTab('access_review');
      addToast('success', '已切换至 管理中心', '已进入访问审核队列 (Access Review Queue)');
    } else if (moduleKey === 'agent_center' || moduleKey === 'agents') {
      setCurrentNav('agents');
      setViewTab('agents');
      addToast('success', '已切换至 智能体中心', '已载入 Semovix Agent Registry 受管智能体注册表');
    } else {
      addToast('info', `已选择【${moduleName}】`, `即将为你路由至 ${moduleName} 工作空间`);
    }
  };

  // Get current governance data for the selected field
  const currentGovernanceData: CompleteFieldGovernanceData = useMemo(() => {
    const currentField = fields.find((f) => f.id === selectedFieldId) || fields[0];
    const baseData = GOVERNANCE_DATA_MAP[currentField.id];

    if (baseData) {
      return {
        ...baseData,
        fieldItem: currentField,
      };
    }

    // Generic fallback for fields without full unique mock objects
    return {
      fieldItem: currentField,
      aiResult: {
        recommendedSemantic: currentField.recommendedSemantic,
        businessNameSuggestion: currentField.businessName,
        dataType: currentField.dataType,
        confidenceLevel: currentField.confidenceLevel,
        confidenceScore: currentField.confidenceScore,
        summary: `经系统画像识别与算法比对，字段 ${currentField.name} 具有较高的语义确定性，建议采用规范语义 ${currentField.recommendedSemantic}。`,
      },
      evidences: [
        {
          id: `ev-gen-1`,
          type: 'naming',
          title: '命名规则比对',
          params: [{ label: '字段名', value: currentField.name }],
          explanation: `字段名符合国标政务数据字典中 ${currentField.recommendedSemantic} 的命名准则`,
          supportLevel: '强支持',
        },
        {
          id: `ev-gen-2`,
          type: 'profiling',
          title: '采样数据分布',
          params: [
            { label: '数据类型', value: currentField.dataType },
            { label: '基数比率', value: '0.94' },
          ],
          explanation: '字段分布格式完全满足该语义的标准约束要求',
          supportLevel: '中支持',
        },
        {
          id: `ev-gen-3`,
          type: 'structure',
          title: '物理关系约束',
          params: [{ label: '关联逻辑', value: '主表核心属性' }],
          explanation: '在关联视图与逻辑建模中具备强上下游关系',
          supportLevel: '辅助支持',
        },
        {
          id: `ev-gen-4`,
          type: 'standard',
          title: '标准规范库',
          params: [{ label: '匹配标准', value: 'GB/T 38637' }],
          explanation: '匹配政务语义治理目录规范要求',
          supportLevel: '辅助支持',
        },
      ],
      cotReasoning: {
        targetField: currentField.name,
        candidateCluster: [currentField.recommendedSemantic, '通用属性', '维度标识'],
        currentRecommendation: currentField.recommendedSemantic,
        latencyMs: 245,
        sourceTable: currentField.tableName,
        rulesVersion: 'semantic_rules_v2.3',
        securityLevel: 'C2 脱敏可用',
        hashStamp: '0x' + Math.random().toString(16).substring(2, 12).toUpperCase(),
        steps: [
          {
            step: 1,
            title: '提取物理字段元数据',
            detail: `校验数据类型 ${currentField.dataType} 与字符长度分布`,
            status: 'passed',
          },
          {
            step: 2,
            title: '比对词根与标准规范',
            detail: `与标准库比对得到推荐语义: ${currentField.recommendedSemantic}`,
            status: 'passed',
          },
          {
            step: 3,
            title: '生成多维证据凭证链',
            detail: `评估可信度分为 ${currentField.confidenceScore} 分`,
            status: 'passed',
          },
        ],
      },
      candidates: [
        {
          id: `cand-gen-1`,
          semantic: currentField.recommendedSemantic,
          confidenceScore: currentField.confidenceScore,
          isRecommended: true,
          businessNameSuggestion: currentField.businessName,
          reasoningBrief: `最佳匹配语义类型，置信度高`,
        },
        {
          id: `cand-gen-2`,
          semantic: '通用扩展属性',
          confidenceScore: 48,
          isRecommended: false,
          businessNameSuggestion: '扩展辅助属性',
          reasoningBrief: '备选备用类型',
        },
      ],
      generatedAssets: {
        businessObject: {
          targetObject: '政务数据主体',
          newAttribute: `${currentField.businessName} (${currentField.name})`,
          lifecycleUsage: '用于扩充核心数据对象定义',
        },
        terminologyAndAnalytics: {
          term: currentField.businessName,
          analyticsSupport: ['业务统计与下钻', '报表图表生成'],
        },
        aiConsumption: {
          nlQueryUnderstanding: `支持按 ${currentField.businessName} 筛选与智能问数`,
          generatableOutcome: '自动生成业务分析报告',
        },
      },
      currentAsset: {
        field: currentField.name,
        tableName: currentField.tableName,
        dataType: currentField.dataType,
        semanticType: currentField.currentSemantic,
        fieldRole: '核心属性',
        businessName: currentField.businessName,
        businessDefinition: currentField.description || '政务数据治理规范项。',
        badges: [
          currentField.status === 'confirmed' ? '语义已确认' : '待人工确认',
          '企业标准匹配',
        ],
      },
      historyVersions: [
        {
          version: 'V2',
          semantic: currentField.currentSemantic,
          source: 'AI推荐',
          timestamp: currentField.updatedAt,
          operator: 'Xino AI 引擎',
          note: 'AI 自动分析推断生成',
        },
      ],
      downstreamImpact: {
        objectImpact: {
          objectName: '主业务对象',
          newAttribute: currentField.businessName,
          description: '更新下游数据模型结构',
        },
        metricImpact: {
          metrics: [`${currentField.businessName}分布`, '业务总量', '关联合规率'],
        },
        aiConsumptionImpact: {
          nlQuerySupport: `支持精准问数过滤: 按 ${currentField.businessName}`,
          analyticsSupport: '支持全维度多维分析',
          reportSupport: '支持智能报告生成',
        },
      },
    };
  }, [fields, selectedFieldId]);

  // Actions
  const handleSelectField = (id: string) => {
    setSelectedFieldId(id);
  };

  const handleAdoptCandidate = (semantic: string, businessName: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? {
              ...f,
              currentSemantic: semantic,
              businessName: businessName,
              status: 'confirmed',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : f
      )
    );
    addToast('success', '已采纳候选语义', `已将 ${selectedFieldId} 采纳为「${semantic} (${businessName})」`);
  };

  const handleConfirmNext = () => {
    // Confirm current field
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? {
              ...f,
              status: 'confirmed',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : f
      )
    );

    addToast('success', '字段语义资产已沉淀', `已成功确认字段 [${selectedFieldId}]`);

    // Find next pending or conflict field
    const currentIndex = fields.findIndex((f) => f.id === selectedFieldId);
    const unconfirmedFields = fields.filter((f, idx) => idx > currentIndex && f.status !== 'confirmed');

    if (unconfirmedFields.length > 0) {
      setSelectedFieldId(unconfirmedFields[0].id);
      addToast('info', '自动跳转下一个待治理字段', `正在处理 [${unconfirmedFields[0].id}]`);
    } else {
      const anyUnconfirmed = fields.find((f) => f.status !== 'confirmed');
      if (anyUnconfirmed) {
        setSelectedFieldId(anyUnconfirmed.id);
      } else {
        addToast('success', '全表字段确认完成！', 'pop_service_hotline 所有字段已全部完成语义资产治理沉淀！');
      }
    }
  };

  const handleSaveDraft = () => {
    addToast('info', '草稿已保存', `已将 ${selectedFieldId} 的中间状态存为草稿`);
  };

  const handleMarkReview = () => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? {
              ...f,
              status: 'pending',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : f
      )
    );
    addToast('info', '已标记待复核', `字段 ${selectedFieldId} 已被移入待复核队列`);
  };

  const handleBatchConfirm = (selectedIds: string[]) => {
    setFields((prev) =>
      prev.map((f) =>
        selectedIds.includes(f.id)
          ? {
              ...f,
              status: 'confirmed',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : f
      )
    );
    addToast('success', '批量确认完成', `成功将 ${selectedIds.length} 个高可信字段沉淀为企业语义资产！`);
  };

  const handleReanalyze = () => {
    setIsReanalyzing(true);
    addToast('info', '正在重新执行 AI 语义推导', 'Xino AI 引擎正在重新分析表结构、命名模版与数据画像...');
    setTimeout(() => {
      setIsReanalyzing(false);
      addToast('success', 'AI 重新分析完成', '推理引擎更新完毕，已同步 17 个字段的最优语义推荐结果');
    }, 1200);
  };

  const handlePreviewPublish = () => {
    const confirmedCount = fields.filter((f) => f.status === 'confirmed').length;
    addToast('success', '准备发布语义目录', `当前共有 ${confirmedCount}/${fields.length} 个字段通过确认，已发布至统一知识网络`);
  };

  const batchCount = useMemo(() => {
    return fields.filter((f) => f.confidenceScore >= 80 && f.status !== 'confirmed').length;
  }, [fields]);

  const handleConfirmTable = () => {
    addToast('success', '表语义理解已确认', '数据表 pop_service_hotline 的记录模型与业务角色已成功沉淀为企业语义资产！');
  };

  const handleAdjustTable = () => {
    addToast('info', '微调表语义理解', '已将可选项载入编辑模式，请选择适合业务的最终记录形态');
  };

  const handleReanalyzeTable = () => {
    setIsReanalyzing(true);
    addToast('info', 'AI 引擎重新分析', '正在重新扫描表 Schema 约束、采样粒度与时间分布...');
    setTimeout(() => {
      setIsReanalyzing(false);
      addToast('success', '重新推导完成', '系统已更新证据链与置信度打分 (置信度: 91%)');
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Top Bar Header (64px) */}
      <Header
        onRefresh={() => addToast('info', '页面已刷新', '已从云端拉取最新的数据表元数据状态')}
        onReanalyze={handleReanalyzeTable}
        onBatchConfirm={() => setIsBatchModalOpen(true)}
        onPreviewPublish={handlePreviewPublish}
        onViewLineage={() => setIsLineageModalOpen(true)}
        onEnterModeling={() => setIsModelingModalOpen(true)}
        onOpenLauncher={() => setIsLauncherOpen(true)}
        onOpenProfile={() => setIsProfileOpen((prev) => !prev)}
        isProfileOpen={isProfileOpen}
        currentNav={currentNav}
        onSelectNav={(nav) => {
          setCurrentNav(nav);
          setViewTab(nav);
        }}
        batchCount={batchCount}
      />

      {/* Main Content View Switch */}
      {currentNav === 'access_review_detail' || viewTab === 'access_review_detail' ? (
        <AccessReviewDetailWorkspace
          addToast={addToast}
          onBackToQueue={() => {
            setCurrentNav('access_review');
            setViewTab('access_review');
            addToast('info', '访问审核队列', '已返回访问审核队列列表');
          }}
          onDecisionComplete={(decisionType, resourceName) => {
            setCurrentNav('access_review');
            setViewTab('access_review');
          }}
          onNavigateToAuthorizationRecords={() => {
            addToast('info', '授权记录', '查看企业历史已生效数据访问授权与到期台账');
          }}
          onNavigateToPolicyManagement={() => {
            addToast('info', '策略管理', '配置基于属性的安全合规与自动裁决策略规则 (ABAC)');
          }}
          onNavigateToAuditLogs={() => {
            addToast('info', '审计日志', '查看数据访问调用链与人工裁决不可篡改审计追踪');
          }}
        />
      ) : currentNav === 'access_review' || viewTab === 'access_review' ? (
        <AccessReviewWorkspace
          addToast={addToast}
          onOpenDetail={(reqId) => {
            setCurrentNav('access_review_detail');
            setViewTab('access_review_detail');
            addToast('info', '进入单项审核', '已进入「人口基本信息视图」人工访问决策工作台');
          }}
          onNavigateToDataMarket={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '数据服务超市', '已切换至数据服务超市 · 发现首页');
          }}
          onNavigateToBusinessSemantics={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '业务语义', '已切换至业务语义指标管理工作台');
          }}
          onNavigateToAiHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
        />
      ) : currentNav === 'agent_publish' || viewTab === 'agent_publish' ? (
        <AgentPublishWorkspace
          addToast={addToast}
          onBackToDefinition={() => {
            setCurrentNav('agent_definition');
            setViewTab('agent_definition');
            addToast('info', '企业知识伙伴', '已返回智能体定义工作区');
          }}
          onBackToRegistry={() => {
            setCurrentNav('agents');
            setViewTab('agents');
            addToast('info', '智能体中心', '已返回受管智能体注册表');
          }}
        />
      ) : currentNav === 'agent_definition' || currentNav === 'agent_detail' || viewTab === 'agent_definition' || viewTab === 'agent_detail' ? (
        <AgentDefinitionWorkspace
          addToast={addToast}
          onBackToRegistry={() => {
            setCurrentNav('agents');
            setViewTab('agents');
            addToast('info', '智能体中心', '已返回受管智能体注册表');
          }}
          onNavigateToPublish={() => {
            setCurrentNav('agent_publish');
            setViewTab('agent_publish');
            addToast('info', '测试与发布', '已进入「企业知识伙伴」发布前验证工作区');
          }}
        />
      ) : currentNav === 'agents' || currentNav === 'agent_center' || viewTab === 'agents' || viewTab === 'agent_center' ? (
        <AgentRegistryWorkspace
          addToast={addToast}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'Xino 智能伙伴', '已进入 Xino AI 协同工作台');
          }}
          onNavigateToGovernance={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '数据治理', '已切换至业务对象发现与建模视图');
          }}
          onNavigateToMetrics={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '指标注册表', '已进入 Metric Registry 统一指标管理视图');
          }}
          onNavigateToMarketplace={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '数据服务超市', '已进入数据服务超市 · 发现首页');
          }}
          onOpenAgentDefinition={(agent) => {
            setCurrentNav('agent_definition');
            setViewTab('agent_definition');
            addToast('info', agent.name, `已载入「${agent.name}」受管智能体定义工作区`);
          }}
        />
      ) : currentNav === 'my_requests' || viewTab === 'my_requests' ? (
        <MyAccessRequestsWorkspace
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '发现首页', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToResources={() => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '资源浏览', '已返回数据服务超市 · 资源列表');
          }}
          onNavigateToSolution={(solutionName) => {
            setResourceSearchQuery(solutionName || '分析各街镇老龄化情况');
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '返回数据方案', `已进入「${solutionName || '数据方案'}」配置与资源目录`);
          }}
          onResumeAnalysisTask={(taskName, mode) => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast(
              mode === 'degraded' ? 'info' : 'success',
              mode === 'degraded' ? '恢复受限分析' : '恢复分析任务',
              `已载入「${taskName}」工作流，数据访问环境就绪`
            );
          }}
          addToast={addToast}
        />
      ) : currentNav === 'multi_resource_request' || viewTab === 'multi_resource_request' ? (
        <MultiResourceAccessRequestWorkspace
          onBackToSolution={() => {
            setResourceSearchQuery('分析各街镇老龄化情况');
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '返回数据方案', '已返回街镇老龄化分析推荐数据方案');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '发现首页', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToResources={() => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '资源浏览', '已返回数据服务超市 · 资源列表');
          }}
          onNavigateToMyRequests={() => {
            setCurrentNav('my_requests');
            setViewTab('my_requests');
            addToast('info', '我的申请', '查看已申请的数据访问需求与任务就绪状态');
          }}
          onContinueAnalysis={(taskName) => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('success', '进入分析', `已就绪「${taskName}」所需的全部 4 项数据资源`);
          }}
          addToast={addToast}
        />
      ) : currentNav === 'marketplace_resources' || viewTab === 'marketplace_resources' ? (
        <ResourceExplorerWorkspace
          addToast={addToast}
          initialQuery={resourceSearchQuery}
          onNavigateToMultiResourceRequest={() => {
            setCurrentNav('multi_resource_request');
            setViewTab('multi_resource_request');
            addToast('info', '申请使用所需资源', '已进入多资源批量访问申请页面');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '数据服务超市', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToMyRequests={() => {
            setCurrentNav('my_requests');
            setViewTab('my_requests');
            addToast('info', '我的申请', '查看已申请的数据访问需求与任务就绪状态');
          }}
          onNavigateToMetrics={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '指标注册表', '已进入 Metric Registry 统一指标管理视图');
          }}
          onNavigateToBusinessObject={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '业务对象发现', '已切换至业务概念实体与建模视图');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToBusinessObjectDetail={(objectId, fromGoalSearch, goalQuery) => {
            setBusinessObjectDetailContext({ objectId: objectId || 'bo_person', fromGoalSearch, goalQuery });
            setCurrentNav('business_object_detail');
            setViewTab('business_object_detail');
            addToast('info', '业务对象详情', '已载入「自然人」正式业务对象详情');
          }}
          onNavigateToDataAssetDetail={(assetId, fromGoalSearch, goalQuery) => {
            setAssetDetailContext({ assetId, fromGoalSearch, goalQuery });
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '数据资产详情', '已载入「人口基本信息视图」正式资产详情');
          }}
          onNavigateToMetricDetail={(metricId, fromGoalSearch, goalQuery) => {
            setMetricDetailContext({ metricId, fromGoalSearch, goalQuery });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
            addToast('info', '指标详情', '已载入「老龄化率」企业正式指标详情');
          }}
        />
      ) : currentNav === 'business_object_detail' || viewTab === 'business_object_detail' ? (
        <BusinessObjectDetailWorkspace
          objectId={businessObjectDetailContext.objectId}
          fromGoalSearch={businessObjectDetailContext.fromGoalSearch}
          goalQuery={businessObjectDetailContext.goalQuery}
          onBackToResources={() => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '返回资源浏览', '已返回数据服务超市 · 资源列表');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '发现首页', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToMyRequests={() => {
            setCurrentNav('my_requests');
            setViewTab('my_requests');
            addToast('info', '我的申请', '查看已申请的数据访问需求与任务就绪状态');
          }}
          onNavigateToDataAssetDetail={(assetId) => {
            setAssetDetailContext({ assetId, fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '数据资产详情', '已载入「人口基本信息视图」正式资产详情');
          }}
          onNavigateToMetricDetail={(metricId) => {
            setMetricDetailContext({ metricId, fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
            addToast('info', '指标详情', '已载入「老龄化率」企业正式指标详情');
          }}
          onNavigateToApiDetail={(apiId) => {
            setResourceSearchQuery('人口统计查询 API');
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', 'API 资源', '已在资源超市中定位 API 服务');
          }}
          onNavigateToKnowledgeNetwork={(objectId) => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '知识网络', '已跳转至企业知识网络查看完整的自然人关系图谱与拓扑');
          }}
          onExploreResourcesForObject={(objectName, attrName) => {
            setResourceSearchQuery(attrName ? `${objectName} ${attrName}` : objectName);
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '相关资源', `已在资源超市中筛选与「${objectName}${attrName ? ` · ${attrName}` : ''}」相关的资源`);
          }}
          onFindDataWithObjectGoal={(objectName) => {
            setResourceSearchQuery(`围绕「${objectName}」业务对象进行老龄化与公共服务分析`);
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('success', '目标找数', `已载入以「${objectName}」为语义上下文的目标找数方案`);
          }}
          addToast={addToast}
        />
      ) : currentNav === 'metric_detail' || viewTab === 'metric_detail' ? (
        <MetricDetailWorkspace
          metricId={metricDetailContext.metricId}
          fromGoalSearch={metricDetailContext.fromGoalSearch}
          goalQuery={metricDetailContext.goalQuery}
          onBackToRegistry={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '指标列表', '已返回 Metric Registry 统一指标管理视图');
          }}
          onBackToResources={() => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '返回资源浏览', '已返回数据服务超市 · 资源列表');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '发现首页', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToMyRequests={() => {
            setCurrentNav('my_requests');
            setViewTab('my_requests');
            addToast('info', '我的申请', '查看已申请的数据访问需求与任务就绪状态');
          }}
          onNavigateToDataAssetDetail={(assetId) => {
            setAssetDetailContext({ assetId, fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '数据资产详情', '已载入底层数据资产详情');
          }}
          onNavigateToBusinessObject={(objectId) => {
            setBusinessObjectDetailContext({ objectId: objectId || 'bo_person', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('business_object_detail');
            setViewTab('business_object_detail');
            addToast('info', '业务对象详情', '已载入「自然人」正式业务对象详情');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToDataStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '数据标准', '已切换至数据标准与值域列表');
          }}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
          onNavigateToApiDetail={(apiId) => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', 'API 资源', '已在资源超市中定位 API 服务');
          }}
          onEnterAnalysis={(metricName) => {
            addToast('success', '进入分析', `已将「${metricName}」指标载入 AI 数据分析工作台`);
          }}
          onEnterChatQuery={(metricName) => {
            addToast('info', '用于问数', `已在 Xino 智能问数中绑定「${metricName}」指标口径`);
          }}
          onExploreRelatedData={(metricName) => {
            setResourceSearchQuery('人口');
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '围绕此指标找数据', `已在资源超市中筛选与「${metricName}」相关的指标与数据集`);
          }}
          onNavigateToModifyDraft={(metricId) => {
            const effId = metricId || metricDetailContext.metricId || 'met_001';
            setSelectedChangeMetricId(effId);
            const foundMetric = metricRegistryService.getMetricById(effId) || 
                                (effId === 'res-03' ? metricRegistryService.getMetricById('met_001') : null);
            const metricName = foundMetric ? foundMetric.name : '指标';
            setCurrentNav('metric_change_draft');
            setViewTab('metric_change_draft');
            addToast('info', '修改指标', `已进入「${metricName}」修改草稿（Change Mode）`);
          }}
          addToast={addToast}
        />
      ) : currentNav === 'metric_change_draft' || viewTab === 'metric_change_draft' ? (
        <MetricAuthoringWorkspace
          initialMode="change_draft"
          targetMetricId={selectedChangeMetricId}
          addToast={addToast}
          onNavigateToMetricDetail={(metricId) => {
            setMetricDetailContext({ metricId: metricId || selectedChangeMetricId, fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
          }}
          onBackToRegistry={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '返回指标注册表', '已返回 Metric Registry 统一指标管理视图');
          }}
          onNavigateToBusinessObject={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '业务对象工作台', '已切换至业务对象发现与建模视图');
          }}
          onNavigateToDataStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '数据标准目录', '已切换至数据标准与值域列表');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '数据语义工作台', '已切换至数据语义队列工作台');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToMarketplace={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '服务超市', '已进入数据服务超市 · 发现首页');
          }}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
        />
      ) : currentNav === 'marketplace' || viewTab === 'marketplace' ? (
        <DataServiceMarketplaceWorkspace
          addToast={addToast}
          onNavigateToResources={(query, typeFilter, semanticFilter) => {
            setResourceSearchQuery(query || (semanticFilter ? semanticFilter.name : ''));
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            if (query && query.trim()) {
              addToast('success', '资源浏览', `已载入检索结果「${query}」`);
            } else if (typeFilter) {
              addToast('info', '按类型筛选', `已进入资源浏览，筛选「${typeFilter === 'DATA_ASSET' ? '数据资产' : typeFilter === 'METRIC' ? '指标' : typeFilter === 'DATA_API' ? '数据 API' : '业务对象'}」`);
            } else if (semanticFilter) {
              addToast('info', '按业务语义筛选', `已进入资源浏览，筛选「${semanticFilter.name}」相关资源`);
            } else {
              addToast('info', '浏览全部资源', '已载入当前 Discover Scope 内所有可发现资源');
            }
          }}
          onNavigateToDataAssetDetail={(assetId) => {
            setAssetDetailContext({ assetId: assetId || 'res-02', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '数据资产详情', '已载入数据资产详情');
          }}
          onNavigateToMetricDetail={(metricId) => {
            setMetricDetailContext({ metricId: metricId || 'res-03', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
            addToast('info', '指标详情', '已载入企业正式指标详情');
          }}
          onNavigateToBusinessObjectDetail={(objectId) => {
            setBusinessObjectDetailContext({ objectId: objectId || 'bo_person', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('business_object_detail');
            setViewTab('business_object_detail');
            addToast('info', '业务对象详情', '已载入业务对象详情');
          }}
          onNavigateToMyRequests={() => {
            setCurrentNav('my_requests');
            setViewTab('my_requests');
            addToast('info', '我的申请', '查看已申请的数据访问需求与任务就绪状态');
          }}
          onNavigateToMetrics={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '指标注册表', '已进入 Metric Registry 统一指标管理视图');
          }}
          onNavigateToBusinessObject={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '业务对象发现', '已切换至业务概念实体与建模视图');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToDataStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '数据标准', '已切换至数据标准与值域列表');
          }}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
        />
      ) : currentNav === 'create_metric' || viewTab === 'create_metric' ? (
        <MetricAuthoringWorkspace
          initialMode={authoringMode}
          initialDraftData={authoringInitialDraft}
          addToast={addToast}
          onBackToRegistry={() => {
            setCurrentNav('metrics');
            setViewTab('metrics');
            addToast('info', '返回指标注册表', '已返回 Metric Registry 统一指标管理视图');
          }}
          onNavigateToBusinessObject={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '业务对象工作台', '已切换至业务对象发现与建模视图');
          }}
          onNavigateToDataStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '数据标准目录', '已切换至数据标准与值域列表');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '数据语义工作台', '已切换至数据语义队列工作台');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToMarketplace={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '服务超市', '已进入数据服务超市 · 发现首页');
          }}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
        />
      ) : currentNav === 'metrics' || viewTab === 'metrics' ? (
        <MetricRegistryWorkspace
          addToast={addToast}
          onNavigateToMetricDetail={(metricId) => {
            setMetricDetailContext({ metricId: metricId || 'res-03', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
            addToast('info', '指标详情', '已载入「老年人口数」正式指标事实详情页');
          }}
          onNavigateToCreateMetric={(mode, draftData, targetMetricId) => {
            if (mode === 'change_draft') {
              const effId = targetMetricId || 'met_001';
              setSelectedChangeMetricId(effId);
              const foundMetric = metricRegistryService.getMetricById(effId) || 
                                  (effId === 'res-03' ? metricRegistryService.getMetricById('met_001') : null);
              const metricName = foundMetric ? foundMetric.name : '指标';
              setCurrentNav('metric_change_draft');
              setViewTab('metric_change_draft');
              addToast('info', '修改指标', `已进入「${metricName}」修改草稿（Change Mode）`);
              return;
            }
            setAuthoringMode(mode || 'ai_prompt');
            setAuthoringInitialDraft(draftData);
            setCurrentNav('create_metric');
            setViewTab('create_metric');
            if (mode === 'imported_draft' && draftData) {
              addToast('info', '存量指标导入', `已载入「${draftData.metricName}」存量解析草稿空间`);
            } else {
              addToast('info', '创建指标', '已进入 AI 引导式指标创建工作台');
            }
          }}
          onNavigateToBusinessObject={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '业务对象工作台', '已切换至业务对象发现与建模视图');
          }}
          onNavigateToDataStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '数据标准目录', '已切换至数据标准与值域列表');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '数据语义工作台', '已切换至数据语义队列工作台');
          }}
          onNavigateToDataAssets={() => {
            setCurrentNav('assets');
            setViewTab('assets');
            addToast('info', '数据资产目录', '已切换至企业数据资产全景目录');
          }}
          onNavigateToHome={() => {
            setCurrentNav('home');
            setViewTab('home');
            addToast('info', 'AI 工作台', '已进入 Xino AI 协同工作台');
          }}
        />
      ) : currentNav === 'mapping_conflict_review' || viewTab === 'mapping_conflict_review' ? (
        <MappingConflictReviewWorkspace
          addToast={addToast}
          onBackToStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '返回标准列表', '已重定向至数据标准匹配中心');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'import_standards' || viewTab === 'import_standards' ? (
        <ImportStandardsWorkspace
          addToast={addToast}
          onBackToCatalog={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '返回标准库', '已重定向至数据标准列表目录');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'create_value_domain_standard' || viewTab === 'create_value_domain_standard' ? (
        <CreateValueDomainStandardWorkspace
          addToast={addToast}
          onBackToCatalog={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '返回标准库', '已重定向至数据标准列表目录');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'standard_proposal_review' || viewTab === 'standard_proposal_review' ? (
        <StandardProposalReviewWorkspace
          addToast={addToast}
          onNavigateBackToMatching={() => {
            setCurrentNav('standard_matching');
            setViewTab('standard_matching');
          }}
          onNavigateBackToStandards={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
          }}
        />
      ) : currentNav === 'create_data_element_standard' || viewTab === 'create_data_element_standard' ? (
        <CreateDataElementStandardWorkspace
          addToast={addToast}
          onBackToCatalog={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
            addToast('info', '返回标准库', '已重定向至数据标准列表目录');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'standard_matching' || viewTab === 'standard_matching' ? (
        <StandardMatchingWorkspace
          addToast={addToast}
          onNavigateToStandardProposalReview={() => {
            setCurrentNav('standard_proposal_review');
            setViewTab('standard_proposal_review');
          }}
          onNavigateToCatalogTab={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
          }}
          onNavigateToCheckTab={() => {
            setCurrentNav('standard_check');
            setViewTab('standard_check');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
          onNavigateToMappingConflictReview={() => {
            setCurrentNav('mapping_conflict_review');
            setViewTab('mapping_conflict_review');
          }}
        />
      ) : currentNav === 'standard_check_issue_detail' || viewTab === 'standard_check_issue_detail' ? (
        <StandardCheckIssueDetailWorkspace
          addToast={addToast}
          onNavigateBackToCheckList={() => {
            setCurrentNav('standard_check');
            setViewTab('standard_check');
          }}
          onNavigateToDataQuality={() => {
            addToast('info', '数据质量治理', '已切换至数据质量管理维度');
          }}
          onNavigateToStandardMatching={() => {
            setCurrentNav('standard_matching');
            setViewTab('standard_matching');
          }}
          onNavigateToStandardProposalReview={() => {
            setCurrentNav('standard_proposal_review');
            setViewTab('standard_proposal_review');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'standard_check' || viewTab === 'standard_check' ? (
        <StandardCheckWorkspace
          addToast={addToast}
          onNavigateToCatalogTab={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
          }}
          onNavigateToMatchingTab={() => {
            setCurrentNav('standard_matching');
            setViewTab('standard_matching');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
          onNavigateToIssueDetail={() => {
            setCurrentNav('standard_check_issue_detail');
            setViewTab('standard_check_issue_detail');
          }}
        />
      ) : currentNav === 'standard_detail' || viewTab === 'standard_detail' ? (
        <StandardDetailWorkspace
          addToast={addToast}
          onNavigateBackToCatalog={() => {
            setCurrentNav('data_standards');
            setViewTab('data_standards');
          }}
          onNavigateToMatchingTab={() => {
            setCurrentNav('standard_matching');
            setViewTab('standard_matching');
          }}
          onNavigateToCheckTab={() => {
            setCurrentNav('standard_check');
            setViewTab('standard_check');
          }}
          onNavigateToCheckIssueDetail={() => {
            setCurrentNav('standard_check_issue_detail');
            setViewTab('standard_check_issue_detail');
          }}
          onNavigateToProposalReview={() => {
            setCurrentNav('standard_proposal_review');
            setViewTab('standard_proposal_review');
          }}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
        />
      ) : currentNav === 'data_standards' || viewTab === 'data_standards' ? (
        <DataStandardsWorkspace
          addToast={addToast}
          onNavigateToDataSemantics={() => {
            setCurrentNav('semantics');
            setViewTab('semantics');
            addToast('info', '跳转至数据语义', '已切换至数据语义队列工作台');
          }}
          onNavigateToCreateDataElementStandard={() => {
            setCurrentNav('create_data_element_standard');
            setViewTab('create_data_element_standard');
          }}
          onNavigateToCreateValueDomainStandard={() => {
            setCurrentNav('create_value_domain_standard');
            setViewTab('create_value_domain_standard');
          }}
          onNavigateToImportStandards={() => {
            setCurrentNav('import_standards');
            setViewTab('import_standards');
          }}
          onNavigateToMappingConflictReview={() => {
            setCurrentNav('mapping_conflict_review');
            setViewTab('mapping_conflict_review');
          }}
          onNavigateToStandardDetail={() => {
            setCurrentNav('standard_detail');
            setViewTab('standard_detail');
          }}
        />
      ) : currentNav === 'asset_detail' || viewTab === 'asset_detail' ? (
        <DataAssetDetailWorkspace
          assetId={assetDetailContext.assetId}
          fromGoalSearch={assetDetailContext.fromGoalSearch}
          goalQuery={assetDetailContext.goalQuery}
          onBackToResources={() => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '返回资源浏览', '已返回数据服务超市 · 资源列表');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('marketplace');
            setViewTab('marketplace');
            addToast('info', '发现首页', '已返回数据服务超市 · 发现首页');
          }}
          onNavigateToMyRequests={() => {
            addToast('info', '我的申请', '查看已申请的数据访问权限与 API 调用授权记录');
          }}
          onNavigateToMetricDetail={(metricId) => {
            setMetricDetailContext({ metricId, fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('metric_detail');
            setViewTab('metric_detail');
            addToast('info', '指标详情', '已载入「老龄化率」企业正式指标详情');
          }}
          onNavigateToBusinessObject={(objectId) => {
            setBusinessObjectDetailContext({ objectId: objectId || 'bo_person', fromGoalSearch: false, goalQuery: '' });
            setCurrentNav('business_object_detail');
            setViewTab('business_object_detail');
            addToast('info', '业务对象详情', '已载入「自然人」正式业务对象详情');
          }}
          onNavigateToApiDetail={(apiId) => {
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', 'API 资源', '已在资源超市中定位 API 服务');
          }}
          onEnterAnalysis={(assetName) => {
            addToast('success', '进入分析', `已将「${assetName}」载入 AI 数据分析工作台`);
          }}
          onEnterChatQuery={(assetName) => {
            addToast('info', '用于问数', `已在 Xino 智能问数中绑定「${assetName}」上下文`);
          }}
          onExploreRelatedData={(assetName) => {
            setResourceSearchQuery('人口');
            setCurrentNav('marketplace_resources');
            setViewTab('marketplace_resources');
            addToast('info', '围绕此资源找数据', `已在资源超市中筛选与「${assetName}」相关的指标与数据集`);
          }}
          addToast={addToast}
        />
      ) : currentNav === 'semantics' && viewTab !== 'table_workspace' ? (
        <DataSemanticsQueueWorkspace
          onNavigateToTableUnderstanding={(tableName) => {
            setViewTab('table_workspace');
            addToast('info', '切换工作台', `已载入 ${tableName} 表语义理解与决策工作空间`);
          }}
          onNavigateToAssetDetail={() => {
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '查看 资产详情', '已载入数据资产元数据与依赖视图');
          }}
          addToast={addToast}
        />
      ) : viewTab === 'field_workspace' || viewTab === 'field' ? (
        <FieldSemanticWorkspace
          addToast={addToast}
          onNavigateToTableWorkspace={() => {
            setViewTab('table_workspace');
            addToast('info', '切换至 表语义', '已载入表语义理解与关系架构视图');
          }}
          onNavigateToAssetDetail={() => {
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '查看 资产详情', '已载入数据资产元数据与依赖视图');
          }}
        />
      ) : viewTab === 'table_workspace' ? (
        <TableSemanticWorkspace
          addToast={addToast}
          onNavigateToFields={() => {
            setViewTab('field_workspace');
            addToast('info', '切换至 字段语义', '已载入字段语义理解与实体映射视图');
          }}
          onNavigateToAssetDetail={() => {
            setCurrentNav('asset_detail');
            setViewTab('asset_detail');
            addToast('info', '返回 资产详情', '已载入公共服务热线工单记录表元数据与依赖视图');
          }}
        />
      ) : currentNav === 'assets' || viewTab === 'assets' ? (
        <DataAssetsCatalogWorkspace
          onNavigateToTableUnderstanding={() => {
            setCurrentNav('governance');
            setViewTab('table');
            addToast('info', '切换工作台', '已跳转至 pop_service_hotline 表语义理解');
          }}
          onNavigateToDiscovery={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
            addToast('info', '切换工作台', '已跳转至业务对象发现');
          }}
          onViewLineage={() => setIsLineageModalOpen(true)}
          addToast={addToast}
        />
      ) : currentNav === 'home' ? (
        <XinoHomeWorkspace
          onNavigateToGovernance={() => {
            setCurrentNav('governance');
            setViewTab('discovery');
          }}
          onOpenLauncher={() => setIsLauncherOpen(true)}
        />
      ) : (
        <>
          {/* Breadcrumb & Workflow Stage Status Bar */}
          <StageHeader
            tableName="pop_service_hotline"
            activeTab={viewTab}
            setActiveTab={setViewTab}
            onBatchConfirm={() => setIsBatchModalOpen(true)}
          />

          {/* Main Governance Content Area */}
          {viewTab === 'modeling' ? (
            <BusinessObjectModelingWorkspace
              onBackToDiscovery={() => setViewTab('discovery')}
              onProceedToAssets={() => {
                addToast('success', '建模草稿已确认', '系统已为您自动推导语义资产并进入阶段 ④ 语义资产完善');
                setViewTab('discovery');
              }}
            />
          ) : viewTab === 'discovery' ? (
            <BusinessObjectDiscoveryWorkspace
              onBackToSemantic={() => setViewTab('table')}
              onEnterModeling={() => setViewTab('modeling')}
              onViewLineage={() => setIsLineageModalOpen(true)}
              onReanalyze={handleReanalyzeTable}
            />
          ) : viewTab === 'table' ? (
            <>
              {/* Table Understanding Three Columns Workspace */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Left Column: Table Context (280px) */}
                <LeftTableContextPanel
                  tableName="pop_service_hotline"
                  businessName="公共服务热线工单记录表"
                />

                {/* Middle Column: AI Workspace (~820px / flex-1) */}
                <MiddleTableWorkspace
                  onOpenBatchConfirm={() => setIsBatchModalOpen(true)}
                  onOpenModeling={() => setIsModelingModalOpen(true)}
                  onOpenLineage={() => setIsLineageModalOpen(true)}
                />

                {/* Right Column: Table Semantic Profile (400px) */}
                <RightTableProfilePanel
                  onConfirmTable={handleConfirmTable}
                  onAdjustTable={handleAdjustTable}
                  onReanalyzeTable={handleReanalyzeTable}
                  isCollapsed={isRightPanelCollapsed}
                  setIsCollapsed={setIsRightPanelCollapsed}
                />
              </div>

              {/* Bottom Area: Analysis Structure & Agent Context (220px) */}
              <BottomTableContextPanel />
            </>
          ) : (
            <>
              {/* Field Understanding Workspace */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <LeftTaskQueue
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={handleSelectField}
                  onBatchConfirm={() => setIsBatchModalOpen(true)}
                />
                <MiddleWorkspace
                  data={currentGovernanceData}
                  onSelectCandidate={handleAdoptCandidate}
                  onViewHistory={() => {
                    setIsRightPanelCollapsed(false);
                    setActiveRightTab('history');
                  }}
                  onMarkReview={handleMarkReview}
                />
                <RightAssetPanel
                  data={currentGovernanceData}
                  activeRightTab={activeRightTab}
                  setActiveRightTab={setActiveRightTab}
                  onConfirmNext={handleConfirmNext}
                  onSaveDraft={handleSaveDraft}
                  onMarkReview={handleMarkReview}
                  isCollapsed={isRightPanelCollapsed}
                  setIsCollapsed={setIsRightPanelCollapsed}
                />
              </div>
              <BottomImpactAnalysis impact={currentGovernanceData.downstreamImpact} />
            </>
          )}
        </>
      )}

      {/* Modals */}
      <BatchConfirmModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        fields={fields}
        onConfirmBatch={handleBatchConfirm}
      />

      <LineageModal
        isOpen={isLineageModalOpen}
        onClose={() => setIsLineageModalOpen(false)}
        tableName="pop_service_hotline"
      />

      <ObjectModelingModal
        isOpen={isModelingModalOpen}
        onClose={() => setIsModelingModalOpen(false)}
        tableName="pop_service_hotline"
      />

      {/* Enterprise AI Launcher Panel */}
      <EnterpriseLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onSelectModule={handleSelectModule}
        currentModule={currentModule}
      />

      {/* Personal Center Overlay Panel */}
      <PersonalCenterPanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName="Admin User"
        userAccount="13800138000"
        roleName="平台超级管理员"
        onNavigateSettings={() => {
          setIsProfileOpen(false);
          addToast('info', '个人中心与设置', '已载入用户账号偏好与安全设置中心');
        }}
        onLogout={() => {
          setIsProfileOpen(false);
          addToast('info', '退出登录', '已安全退出系统会话');
        }}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
