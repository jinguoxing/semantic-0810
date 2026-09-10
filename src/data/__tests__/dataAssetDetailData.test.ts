import { describe, expect, it } from 'vitest';
import { DATA_ASSET_DETAIL_BY_ID, getDataAssetDetail } from '../dataAssetDetailData';

describe('getDataAssetDetail（BO-FZ-01 数据驱动资产详情）', () => {
  it('asset-1 返回公共服务热线工单记录表：目录身份 + 热线工单字段 + bo_service_ticket 承载关系', () => {
    const result = getDataAssetDetail('asset-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { asset } = result;
    // 身份区全部来自统一目录（MOCK_DATA_ASSETS），不由页面二次维护
    expect(asset.name).toBe('公共服务热线工单记录表');
    expect(asset.technicalName).toBe('pop_service_hotline');
    expect(asset.qualifiedName).toBe('hotline_db.service.pop_service_hotline');
    expect(asset.businessDomain).toBe('公共服务');
    expect(asset.subDomain).toBe('热线服务');
    // 承载的正式业务对象由目录 businessObjectId 驱动（禁止按名称猜 ID）
    expect(asset.businessObject).toEqual({ id: 'bo_service_ticket', name: '服务工单' });
    // 补充区：主体 / 粒度 / 身份标识
    expect(asset.subject).toBe('服务工单');
    expect(asset.grain).toBe('一行一张服务工单');
    expect(asset.identity).toBe('ticket_id（工单编号）');

    // 字段清单 = 热线工单事实（ticket_id / status / close_time 等），不含人口字段
    const fieldNames = asset.fields.map((field) => field.name);
    ['ticket_id', 'status', 'created_time', 'accepted_time', 'close_time', 'applicant_id', 'handler_department_id', 'region_code'].forEach(
      (name) => expect(fieldNames).toContain(name)
    );
    ['person_id', 'birth_date', 'resident_status'].forEach((name) => expect(fieldNames).not.toContain(name));
    const ticketId = asset.fields.find((field) => field.name === 'ticket_id');
    expect(ticketId?.businessName).toBe('工单编号');
    expect(ticketId?.isIdentifier).toBe(true);
    // 相关指标 / API 由补充数据提供
    expect(asset.relatedMetrics?.map((metric) => metric.name)).toContain('热线工单按期办结率');
    expect(asset.relatedApis?.map((api) => api.name)).toContain('热线工单办理进度查询 API');
  });

  it('asset-2 返回人口基本信息（自然人）字段，与 asset-1 页面内容完全不同', () => {
    const result = getDataAssetDetail('asset-2');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { asset } = result;
    expect(asset.name).toBe('人口基本信息');
    expect(asset.businessObject).toEqual({ id: 'bo_person', name: '自然人' });
    const fieldNames = asset.fields.map((field) => field.name);
    ['person_id', 'person_name', 'birth_date', 'age', 'gender_code', 'resident_status', 'region_code'].forEach(
      (name) => expect(fieldNames).toContain(name)
    );
    ['ticket_id', 'status', 'close_time'].forEach((name) => expect(fieldNames).not.toContain(name));
  });

  it('未知资产 ID / 空值一律 ASSET_NOT_FOUND，绝不回退演示资产', () => {
    expect(getDataAssetDetail('asset_unknown_42')).toEqual({ ok: false, error: 'ASSET_NOT_FOUND' });
    expect(getDataAssetDetail('res-99')).toEqual({ ok: false, error: 'ASSET_NOT_FOUND' });
    expect(getDataAssetDetail('   ')).toEqual({ ok: false, error: 'ASSET_NOT_FOUND' });
    expect(getDataAssetDetail(undefined)).toEqual({ ok: false, error: 'ASSET_NOT_FOUND' });
    // 按名称猜测也不得命中（身份只认目录 ID）
    expect(getDataAssetDetail('人口基本信息')).toEqual({ ok: false, error: 'ASSET_NOT_FOUND' });
  });

  it('补充数据绝不覆盖目录身份：asset-1 的身份字段与目录一致且未维护第二套身份', () => {
    const result = getDataAssetDetail('asset-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // DATA_ASSET_DETAIL_BY_ID 只允许补充 fields/subject/grain/identity/scope/freshness/related*
    const supplement = DATA_ASSET_DETAIL_BY_ID['asset-1'];
    expect(supplement).toBeDefined();
    expect(Object.keys(supplement!).sort()).toEqual(
      ['fields', 'freshness', 'grain', 'identity', 'relatedApis', 'relatedMetrics', 'scope', 'subject'].sort()
    );
  });
});
