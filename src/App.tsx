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
import { ToastContainer, ToastMessage } from './components/Toast';
import { INITIAL_FIELDS_QUEUE, GOVERNANCE_DATA_MAP } from './data/mockData';
import { FieldItem, CompleteFieldGovernanceData } from './types';

export default function App() {
  const [currentNav, setCurrentNav] = useState<'home' | 'governance'>('governance');
  const [viewTab, setViewTab] = useState<'field' | 'table' | 'discovery' | 'modeling'>('modeling');
  const [fields, setFields] = useState<FieldItem[]>(INITIAL_FIELDS_QUEUE);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('close_time');
  const [activeRightTab, setActiveRightTab] = useState<'result' | 'adjust' | 'history'>('result');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isLineageModalOpen, setIsLineageModalOpen] = useState<boolean>(false);
  const [isModelingModalOpen, setIsModelingModalOpen] = useState<boolean>(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(true);
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
      setCurrentNav('governance');
      setViewTab('field');
      addToast('success', '已切换至 业务语义', '已载入字段语义理解与实体映射视图');
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
        onSelectNav={setCurrentNav}
        batchCount={batchCount}
      />

      {/* Main Content View Switch */}
      {currentNav === 'home' ? (
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
