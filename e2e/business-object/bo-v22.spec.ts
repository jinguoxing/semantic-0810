import { expect, test, type Page } from '@playwright/test';

/**
 * Business Object V2.2 E2E（PR-9）
 *
 * 7 条用例覆盖：统一入口 → Detail 领域驱动不串数据 → Top-down 确认持久化 →
 * Bottom-up 返回原上下文 → Binding Revalidation → 属性/关系 Grounding 修正。
 * 领域状态持久化在 localStorage（semovix_business_object_state_v1），
 * 每条用例在独立 Browser Context 中运行，默认从种子状态出发。
 */

const STORE_KEY = 'semovix_business_object_state_v1';

/** 进入应用并确保领域 Store 从种子状态出发（BO-3 中的 reload 会保留状态） */
async function startFromSeed(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.removeItem(key), STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 通过顶栏 Semovix 标识进入统一入口：业务对象目录 */
async function openObjectsList(page: Page) {
  await page.getByText('Semovix', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: '新建业务对象' })).toBeVisible();
}

/** 目录行 → 指定对象的「数据支撑」视角详情 */
async function openDetail(page: Page, objectId: string) {
  await openObjectsList(page);
  await page.locator(`#bo-data-support-${objectId}`).click();
  await expect(page.locator('#tab-data-support')).toBeVisible();
}

test.describe('Business Object V2.2 E2E', () => {
  test('BO-1: 统一入口业务对象目录 → 服务工单数据支撑由领域 Store 驱动', async ({ page }) => {
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 默认展示主要数据实现：客服工单当前视图（EFFECTIVE · PRIMARY）
    await expect(page.getByText('主要数据实现 · 已生效').first()).toBeVisible();

    // 通过实现切换器查看第二套实现：公共服务热线工单记录表（CANDIDATE · SECONDARY）
    await page.getByRole('button', { name: '客服工单当前视图' }).click();
    await page.getByRole('button', { name: /公共服务热线工单记录表/ }).click();
    await expect(page.getByText('其他数据实现 · 候选待确认').first()).toBeVisible();
  });

  test('BO-2: 自然人数据支撑不串数据：人口基本信息表 / 人口扩展信息', async ({ page }) => {
    await startFromSeed(page);
    await openDetail(page, 'bo_person');

    await expect(page.getByText('人口基本信息表').first()).toBeVisible();
    await expect(page.getByText('人口扩展信息').first()).toBeVisible();
    // 不能串入其他对象的实现
    await expect(page.getByText('公共服务热线工单记录表')).toHaveCount(0);
    await expect(page.getByText('客服工单当前视图')).toHaveCount(0);
  });

  test('BO-3: Top-down 确认数据支撑 → 绑定生效并产生修订，刷新页面状态仍保持', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 发现更多数据 → 进入 Top-down 数据支撑发现工作区
    await page.getByText('发现更多数据').first().click();
    await expect(page.getByText('发现数据支撑').first()).toBeVisible();

    // 确认：公共服务热线工单记录表由候选转正式生效，随后自动返回详情
    await page.locator('#btn-confirm-data-support').click();
    await expect(page.locator('#tab-data-support')).toBeVisible({ timeout: 15_000 });

    // 切换至公共服务热线工单记录表：绑定已生效（候选状态消失）
    await page.getByRole('button', { name: '客服工单当前视图' }).click();
    await page.getByRole('button', { name: /公共服务热线工单记录表/ }).click();
    await expect(page.getByText('其他数据实现 · 已生效').first()).toBeVisible();

    // 刷新页面：状态仍保持（领域 Store 持久化）
    await page.reload();
    await openDetail(page, 'bo_service_ticket');
    await page.getByRole('button', { name: '客服工单当前视图' }).click();
    await page.getByRole('button', { name: /公共服务热线工单记录表/ }).click();
    await expect(page.getByText('其他数据实现 · 已生效').first()).toBeVisible();
  });

  test('BO-4: Bottom-up 业务对象对齐：登记任务上下文并按原上下文返回', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    // 数据语义队列（业务语义下拉）→ 已确认语义 → 查看语义详情
    await page.getByText('业务语义', { exact: true }).first().click();
    await page.getByText('数据语义理解').first().click();
    await page.getByRole('button', { name: /已确认/ }).click();
    await page.getByRole('button', { name: '查看语义' }).first().click();
    await expect(page.getByText('形成业务对象')).toBeVisible();

    // 形成业务对象 → 业务对象对齐工作区（含任务上下文）
    await page.getByText('形成业务对象').click();
    await expect(page.getByText(/对齐任务 task_form_.*完成后返回原上下文/).first()).toBeVisible();

    // 确认对齐服务工单 → 按 returnRoute 返回数据语义详情（禁止退回业务对象列表）
    await page.getByRole('button', { name: /确认对齐“服务工单”/ }).click();
    await expect(page.getByText(/已按对齐任务/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();
  });

  test('BO-5: Binding Revalidation：语义修订触发的待复核绑定可确认继续使用', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_person');

    // 种子场景：人口扩展信息绑定 NEEDS_REVALIDATION
    await expect(page.getByText('1 项数据支撑待复核')).toBeVisible();
    await page.locator('#btn-navigate-revalidation').click();

    // 复核工作区：复核原因 / 触发修订 来自领域种子
    await expect(page.getByText('1 项待复核')).toBeVisible();
    await expect(page.getByText(/常住状态.*业务口径/)).toBeVisible();
    await expect(page.getByText('R2').first()).toBeVisible();

    // 确认继续使用 → 绑定恢复生效，复核队列清空
    await page.getByRole('button', { name: /确认继续使用/ }).click();
    await expect(page.getByText('没有待复核的数据支撑')).toBeVisible();

    // 重新进入自然人详情：待复核横幅消失（确认结果已写入领域 Store）
    await openDetail(page, 'bo_person');
    await expect(page.getByText(/项数据支撑待复核/)).toHaveCount(0);
  });

  test('BO-6: Local Grounding 属性修正：产生 Revision 且刷新后落地字段保持', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 种子场景：办结时间（finished_time）需要修正
    await page.getByRole('button', { name: '修正属性对应' }).click();
    await expect(page.locator('#local-grounding-correction-drawer')).toBeVisible();
    await expect(page.getByRole('heading', { name: '修正属性对应' })).toBeVisible();

    // 确认默认候选（finished_time → close_time）
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);

    // 修订历史来自 Revision Store
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText(/落地修正：办结时间 finished_time → close_time/)).toBeVisible();
    await page.getByRole('button', { name: '关闭' }).last().click();

    // 刷新页面：落地字段与修订历史仍保持
    await page.reload();
    await openDetail(page, 'bo_service_ticket');
    await expect(page.getByText('close_time').first()).toBeVisible();
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText(/落地修正：办结时间 finished_time → close_time/)).toBeVisible();
  });

  test('BO-7: Local Grounding 关系修正：申请人关系落地字段替换并记录关系修订', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 第一条核心关系：申请人 → 自然人，修正其落地字段
    await page.locator('#btn-correct-rel-0').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toBeVisible();
    await expect(page.getByRole('heading', { name: '修正关系落地' })).toBeVisible();
    await expect(page.getByText('申请人 → 自然人').first()).toBeVisible();
    await expect(page.getByText('applicant_id').first()).toBeVisible();

    // 确认默认候选（当前实现首个落地字段 ticket_id）
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);

    // 关系行来源字段替换为 实现名 · ticket_id，其余关系不受影响
    await expect(page.getByText('客服工单当前视图 · ticket_id').first()).toBeVisible();
    await expect(page.getByText('客服工单当前视图 · handle_dept_id').first()).toBeVisible();

    // 修订历史记录关系落地修正
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText(/落地修正：申请人 → 自然人 applicant_id → ticket_id/)).toBeVisible();
    await expect(page.getByText(/关系落地/).first()).toBeVisible();
  });
});
