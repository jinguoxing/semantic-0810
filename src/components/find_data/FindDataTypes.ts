export type ActiveWorkspaceType = 
  | 'CLOSED' 
  | 'COMPARE' 
  | 'FIELDS' 
  | 'SOLUTION' 
  | 'ACCESS' 
  | 'CATALOG' 
  | 'ASK_PLAN';

export interface TestResource {
  id: string;
  name: string;
  type: '正式指标' | '数据资产';
  granularity: string;
  timeCoverage: string;
  status: '可直接问数' | '可直接使用' | '需申请' | '可发现';
  role: string;
  desc?: string;
  coverageNote?: string;
  gapNote?: string;
  permissions: {
    metadata: '允许' | '不可用';
    query: '可使用' | '可申请' | '不可用';
    samplePreview: '允许' | '可申请' | '不可用';
    export: '不可用' | '允许';
  };
}

export interface FieldItemData {
  name: string;
  businessName: string;
  type: string;
  group: '主体标识与时间' | '空间区划与归属' | '人员与老龄属性' | '治理与有效周期';
  role: string;
  goalRelation: string;
  isKey: boolean;
}

export interface DialogueMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  briefType?: 'none' | 'candidate_summary' | 'partial_match' | 'access_brief' | 'clarify_choice' | 'benchmark_choice' | 'single_metric';
  briefData?: any;
  actionButtons?: {
    primary?: { label: string; actionKey: string };
    secondary?: { label: string; actionKey: string };
    weak?: { label: string; actionKey: string };
  };
  turnIndex: number; // 1 to 14 internally, never rendered to user
}

export type ScenarioMilestoneKey =
  | 'clarification'
  | 'direct_metric'
  | 'candidate_summary'
  | 'workspace_compare'
  | 'workspace_fields'
  | 'partial_match_gap'
  | 'workspace_solution'
  | 'workspace_access'
  | 'workspace_catalog'
  | 'workspace_ask_plan';
