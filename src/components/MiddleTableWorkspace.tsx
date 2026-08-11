import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Layers, 
  Clock, 
  GitBranch, 
  BarChart2, 
  Brain,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';

interface MiddleTableWorkspaceProps {
  onOpenBatchConfirm?: () => void;
  onOpenModeling?: () => void;
  onOpenLineage?: () => void;
}

export const MiddleTableWorkspace: React.FC<MiddleTableWorkspaceProps> = ({
  onOpenBatchConfirm,
  onOpenModeling,
  onOpenLineage,
}) => {
  const [isCandidatesExpanded, setIsCandidatesExpanded] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('工单过程记录');

  return (
    <main className="flex-1 bg-[#F8FAFC] p-3.5 lg:p-4 overflow-y-auto space-y-3.5">
      {/* Table Header Bar */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-[#EEF2FF] border border-[#4F46E5]/20 flex items-center justify-center text-[#4F46E5]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#64748B]">当前分析数据表：</span>
              <h1 className="text-sm font-bold font-mono text-[#1E293B]">
                pop_service_hotline
              </h1>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                <span>AI理解完成</span>
              </span>
            </div>
            <div className="text-xs text-[#64748B] mt-0.5 flex items-center space-x-2 font-medium">
              <span>业务名称: <span className="text-[#312E81] font-bold">公共服务热线工单记录表</span></span>
              <span>•</span>
              <span>数据源: <span className="font-mono text-[#1E293B]">population_mysql.service</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenLineage}
            className="px-2.5 py-1 text-xs font-medium text-[#475569] hover:text-[#1E293B] bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded transition-colors flex items-center space-x-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#64748B]" />
            <span>查看血缘</span>
          </button>
          <button
            onClick={onOpenModeling}
            className="px-2.5 py-1 text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#4F46E5]/30 rounded transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>进入对象建模</span>
          </button>
        </div>
      </div>

      {/* Module 1: AI理解结果 */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
            <h2 className="text-xs font-bold text-[#1E293B]">AI 理解结果</h2>
            <span className="text-[10px] text-[#64748B] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#4F46E5]/20 font-medium">
              AI 智能理解
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#64748B]">可信等级:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
              高可信
            </span>
            <span className="font-mono text-[11px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#4F46E5]/20">
              置信度: 89%
            </span>
          </div>
        </div>

        {/* Highlighted Result Grid */}
        <div className="bg-[#EEF2FF]/60 border border-[#4F46E5]/20 rounded-md p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">业务记录类型</div>
              <div className="font-bold text-[#312E81] text-sm flex items-center space-x-1">
                <span>工单过程记录</span>
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">分析角色</div>
              <div className="font-bold text-[#1E293B] text-sm">事实类</div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">可信等级</div>
              <div className="font-semibold text-[#059669] text-sm">高 (High)</div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B] mb-0.5">推导置信度</div>
              <div className="font-mono font-bold text-[#4F46E5] text-sm">89%</div>
            </div>
          </div>

          <div className="text-xs text-[#334155] bg-white/80 p-2.5 rounded border border-[#4F46E5]/10 leading-relaxed font-sans">
            <span className="font-bold text-[#312E81]">AI 语义摘要: </span>
            该表记录公共服务热线从受理、处理到办结的业务过程。每行代表一条工单处理记录。
          </div>
        </div>
      </div>

      {/* Module 2: AI判断依据 Evidence (证据链结构) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>为什么这样判断？（AI 判断依据 Evidence）</span>
          </h2>
          <span className="text-[10px] text-[#64748B]">多维凭证支撑</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Card 1: 字段组成证据 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#4F46E5]/30 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">① 字段组成证据</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
                  强支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">发现字段:</div>
                <div className="text-[#312E81] font-bold truncate">ticket_id, person_id, status, created_time, close_time</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                字段集合同时具备标识符、关系关联、状态及起始完成时间戳，符合业务过程记录特征。
              </p>
            </div>
          </div>

          {/* Card 2: 数据粒度证据 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#4F46E5]/30 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">② 数据粒度证据</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
                  强支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">粒度主键: <span className="text-[#1E293B] font-bold">ticket_id</span></div>
                <div className="text-[#312E81] font-bold">主键唯一率: 99.9%</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                每行数据的粒度确定为一条独立的工单处理过程记录。
              </p>
            </div>
          </div>

          {/* Card 3: 时间模型证据 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#4F46E5]/30 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">③ 时间模型证据</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/30">
                  强支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">发现依据: <span className="text-[#312E81] font-bold">created_time + close_time</span></div>
                <div className="text-[#4F46E5] font-bold">生命周期跨度: 存在闭环</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                包含完整创建与办结时间戳，体现明确的业务生命周期过程。
              </p>
            </div>
          </div>

          {/* Card 4: 关系证据 */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#4F46E5]/30 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">④ 关系证据</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/30">
                  中支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">关联外键: person_id</div>
                <div className="text-[#D97706] font-bold">关联候选: 自然人 (待确认)</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                通过 person_id 关联诉求自然人主体，支持下游关系图谱联络。
              </p>
            </div>
          </div>

          {/* Card 5: 使用证据 (分析适用性推断) */}
          <div className="bg-white p-3 rounded-md border border-[#E2E8F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#4F46E5]/30 transition-colors md:col-span-2 lg:col-span-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">⑤ 使用证据（分析适用性推断）</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                  辅助支持
                </span>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] text-[10px] font-mono space-y-0.5">
                <div className="text-[#64748B]">分析建模支持:</div>
                <div className="text-[#312E81] font-bold flex items-center space-x-2">
                  <span className="bg-[#EEF2FF] px-1.5 py-0.2 rounded border border-[#4F46E5]/20">工单趋势分析</span>
                  <span className="bg-[#EEF2FF] px-1.5 py-0.2 rounded border border-[#4F46E5]/20">办理时效分析</span>
                </div>
              </div>
              <p className="text-[11px] text-[#475569] leading-tight">
                结构与时序字段匹配政务工单监控、办理时效统计与趋势预测建模。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: 其他可能解释 (Collapsible Candidates) */}
      <div className="bg-white rounded-md border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#1E293B]">
              其他可能解释（2）
            </span>
            <span className="text-[11px] text-[#64748B]">可解释性决策模型</span>
          </div>
          <button
            onClick={() => setIsCandidatesExpanded(!isCandidatesExpanded)}
            className="text-xs text-[#4F46E5] font-semibold hover:underline flex items-center space-x-1"
          >
            <span>{isCandidatesExpanded ? '收起差异比较' : '查看差异'}</span>
            {isCandidatesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isCandidatesExpanded && (
          <div className="p-3.5 space-y-2.5 text-xs">
            {/* Candidate 1 */}
            <div 
              onClick={() => setSelectedCandidate('工单过程记录')}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                selectedCandidate === '工单过程记录'
                  ? 'border-[#4F46E5] bg-[#EEF2FF]/60 text-[#312E81]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-[#1E293B]">1. 工单过程记录</span>
                  <span className="bg-[#4F46E5] text-white text-[10px] font-bold px-2 py-0.2 rounded">
                    AI 首选推荐
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-[#4F46E5]">89%</span>
                </div>
              </div>
              <p className="text-[#475569] text-[11px] mt-1">
                <span className="font-semibold text-[#1E293B]">推荐依据: </span>
                包含完整的 ticket_id 唯一粒度以及 created_time 和 close_time 闭环生命周期时间戳。
              </p>
            </div>

            {/* Candidate 2 */}
            <div 
              onClick={() => setSelectedCandidate('事件明细记录')}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                selectedCandidate === '事件明细记录'
                  ? 'border-[#4F46E5] bg-[#EEF2FF]/60 text-[#312E81]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-[#1E293B]">2. 事件明细记录</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-2 py-0.2 rounded">
                    备选候选
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-sm text-[#64748B]">72%</span>
                </div>
              </div>
              <p className="text-[#475569] text-[11px] mt-1">
                <span className="font-semibold text-[#1E293B]">差异说明: </span>
                代表多次离散事件，但缺少单独事件动作状态迁移关联。
              </p>
            </div>

            {/* Candidate 3 */}
            <div 
              onClick={() => setSelectedCandidate('业务快照表')}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                selectedCandidate === '业务快照表'
                  ? 'border-[#4F46E5] bg-[#EEF2FF]/60 text-[#312E81]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-[#1E293B]">3. 业务快照表</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-2 py-0.2 rounded">
                    低相关
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-sm text-[#94A3B8]">48%</span>
                </div>
              </div>
              <p className="text-[#475569] text-[11px] mt-1">
                <span className="font-semibold text-[#1E293B]">差异说明: </span>
                按特定周期快照保存，但本表包含闭环时间轴而非周期性快照。
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
