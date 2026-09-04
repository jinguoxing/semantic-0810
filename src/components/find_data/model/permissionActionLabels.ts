import { PermissionRequestRef } from './FindDataTask';

export function getPermissionActionLabel(actionType: PermissionRequestRef['actionType']): string {
  switch (actionType) {
    case 'query':
      return '查询权限';
    case 'preview':
      return '样本预览权限';
    case 'export':
      return '导出权限';
    case 'viewMetadata':
      return '元数据查看权限';
  }
}
