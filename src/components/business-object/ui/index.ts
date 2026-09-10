/**
 * 业务对象统一页面骨架共享 UI（V2.2 §11）。
 * 只提供版式与表面层级，不承载业务逻辑；业务内容一律由页面组合。
 */
export { BusinessObjectPageShell } from './BusinessObjectPageShell';
export type { BusinessObjectPageShellProps } from './BusinessObjectPageShell';
export { BusinessObjectReadLayout } from './BusinessObjectReadLayout';
export type { BusinessObjectReadLayoutProps } from './BusinessObjectReadLayout';
export { BusinessObjectDecisionLayout } from './BusinessObjectDecisionLayout';
export type {
  BusinessObjectDecisionLayoutProps,
  BusinessObjectDecisionLayoutVariant
} from './BusinessObjectDecisionLayout';
export { BusinessObjectSurface } from './BusinessObjectSurface';
export type {
  BusinessObjectSurfaceProps,
  BusinessObjectSurfaceVariant,
  BusinessObjectCalloutTone
} from './BusinessObjectSurface';
export { BusinessObjectSection } from './BusinessObjectSection';
export type { BusinessObjectSectionProps } from './BusinessObjectSection';
export { BusinessObjectContextStrip } from './BusinessObjectContextStrip';
export type { BusinessObjectContextStripProps } from './BusinessObjectContextStrip';
export { BusinessObjectEmptyState } from './BusinessObjectEmptyState';
export type { BusinessObjectEmptyStateProps } from './BusinessObjectEmptyState';
export { BusinessObjectFactGrid } from './BusinessObjectFactGrid';
export type { BusinessObjectFactGridProps, BusinessObjectFactItem } from './BusinessObjectFactGrid';
export { cx } from './cx';
export {
  RESOURCE_ROLE_LABELS,
  buildSupportResourceGroups,
  deriveImplementationRole,
  deriveRelatedDataRole,
  isFormalImplementationRole,
  isRelatedDataRole
} from './resourceRole';
export type {
  ResourceRole,
  CurrentSupportEntry,
  SupportResourceViewModel,
  ClassifiedSupportResources
} from './resourceRole';
