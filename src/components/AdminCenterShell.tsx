import React from 'react';
import { Clock, FileCheck, Lock, ShieldCheck, Users } from 'lucide-react';

export type AdminCenterItem = 'users' | 'access-review' | 'authorization-records' | 'policies' | 'audit-logs';

interface AdminCenterShellProps {
  activeItem: AdminCenterItem;
  onNavigate?: (item: AdminCenterItem) => void;
  children: React.ReactNode;
}

const items: Array<{ id: AdminCenterItem; label: string; Icon: typeof Users; group: string }> = [
  { id: 'users', label: '组织与用户', Icon: Users, group: '组织与架构' },
  { id: 'access-review', label: '访问审核', Icon: ShieldCheck, group: '权限管理' },
  { id: 'authorization-records', label: '授权记录', Icon: FileCheck, group: '权限管理' },
  { id: 'policies', label: '策略管理', Icon: Lock, group: '权限管理' },
  { id: 'audit-logs', label: '审计日志', Icon: Clock, group: '安全合规' },
];

export const AdminCenterShell: React.FC<AdminCenterShellProps> = ({ activeItem, onNavigate, children }) => <div className="flex flex-1 overflow-hidden bg-[#F7F9FC] text-[#172033]">
  <aside className="flex w-[210px] shrink-0 flex-col border-r border-[#E6EAF0] bg-white">
    <div className="border-b border-[#E6EAF0] p-4"><div className="flex items-center gap-2"><div className="grid h-6 w-6 place-items-center rounded bg-[#4F46E5] text-xs font-bold text-white">M</div><div><h2 className="text-xs font-bold">管理中心</h2><p className="text-[10px] text-[#667085]">Admin & Governance</p></div></div></div>
    <nav className="flex-1 space-y-4 overflow-y-auto p-2.5">{['组织与架构', '权限管理', '安全合规'].map((group) => <div key={group} className="space-y-1"><div className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#98A2B3]">{group}</div>{items.filter((item) => item.group === group).map(({ id, label, Icon }) => <button key={id} onClick={() => onNavigate?.(id)} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs ${activeItem === id ? 'bg-[#EFF6FF] font-bold text-[#2563EB]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>)}</nav>
  </aside>
  {children}
</div>;
