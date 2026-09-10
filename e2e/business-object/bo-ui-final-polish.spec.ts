import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path/posix';

/**
 * Business Object V2.2 统一页面骨架与卡片收敛 —— 最终收口 E2E（CASE-1 … CASE-7）
 *
 * - CASE-1 打开「订单」已停用对象：不存在「修改业务对象」/「发现数据支撑」，仍可查看业务视角和历史；
 * - CASE-2 业务视角：Main Surface 数量 1、Inspector 数量 1，不存在多个 Section Card；
 * - CASE-3 服务事项数据支撑：存在 Context Strip，当前实现名称完整重复不超过两处（表内来源列数据不计），
 *       Main Surface 1，Inspector 不存在「当前查看」重复区；
 * - CASE-4 事项材料清单（一行一项材料）：分到相关数据，不计入正式 Data Implementation 数量；
 * - CASE-5 无候选 Top-down：两栏，不存在「数据实现条件」/「本次将建立」/「稍后处理」/「一致」等通过状态，
 *       只有一个返回数据支撑操作；
 * - CASE-6 有候选 Top-down：三栏，选择候选前不显示已通过条件，选择后显示真实条件与确认操作；
 * - CASE-7 已确认：显示「数据支撑已确认」，不继续显示候选确认按钮。
 *
 * 同时产出 §19 要求的 8 张 1920×1080 状态截图（e2e/business-object/screenshots/），
 * 并在 1440×900 下检查：主内容不横向溢出 / Inspector 不挤压主区 /
 * 表格列不出现无意义换行 / Header 操作不覆盖对象定义。
 *
 * 领域状态持久化在 localStorage（semovix_business_object_state_v1），仅在真实领域写入后落盘；
 * CASE-6 的「多候选未预选」与截图 4 的「已发布空数据支撑」通过编辑持久化状态构造
 * （种子只有一个候选会自动选中，不满足未选态；种子没有已发布且无生效绑定的对象）。
 */

const STORE_KEY = 'semovix_business_object_state_v1';
const SCREENSHOT_DIR = join('e2e', 'business-object', 'screenshots');

mkdirSync(SCREENSHOT_DIR, { recursive: true });

// §19：八张截图统一 1920×1080
test.use({ viewport: { width: 1920, height: 1080 } });

/** 进入应用并确保领域 Store 从种子状态出发 */
async function startFromSeed(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.removeItem(key), STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 顶栏「业务语义」下拉 →「业务对象」→ 业务对象目录 */
async function openObjectsList(page: Page) {
  await page.getByText('业务语义', { exact: true }).first().click();
  await page.getByText('业务对象', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: '新建业务对象' })).toBeVisible();
}

/** 目录行 → 指定对象的「数据支撑」视角详情 */
async function openDetail(page: Page, objectId: string) {
  await openObjectsList(page);
  await page.locator(`#bo-data-support-${objectId}`).click();
  await expect(page.locator('#tab-data-support')).toBeVisible();
}

/** 详情 → 发现数据支撑（Top-down 工作台，必须携带对象上下文） */
async function openResolveWorkspace(page: Page, objectId: string) {
  await openDetail(page, objectId);
  await page.locator('#btn-discover-more-data-support').click();
  await expect(page.getByRole('heading', { name: '发现数据支撑' })).toBeVisible();
}

/** 目录行「对象名称」→ 指定对象的「业务视角」详情（无生效绑定的已停用对象走此入口） */
async function openDetailByName(page: Page, objectId: string) {
  await openObjectsList(page);
  await page.locator(`#bo-name-${objectId}`).click();
  await expect(page.locator('#tab-business-view[aria-selected="true"]')).toBeVisible();
}

/**
 * 真实领域写入一次（自然人复核「确认继续使用」），让全量种子状态落盘到 localStorage，
 * 供后续直接编辑持久化状态构造特殊场景（不影响服务工单的候选绑定）。
 */
async function persistSeedViaRealWrite(page: Page) {
  await openDetail(page, 'bo_person');
  await expect(page.getByText('1 项数据支撑待复核')).toBeVisible();
  await page.locator('#btn-navigate-revalidation').click();
  await expect(page.getByText('1 项待复核', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '确认继续使用' }).click();
  await expect(page.getByText('没有待复核的数据支撑', { exact: true })).toBeVisible();
  const persisted = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY);
  expect(persisted).toBeTruthy();
}

/** 克隆热线候选（新实现 + 新绑定，均 CANDIDATE）→ 服务工单出现两个候选且互不预选 */
async function injectSecondHotlineCandidate(page: Page) {
  await page.evaluate((key) => {
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    const impl = JSON.parse(JSON.stringify(state.implementations.impl_st_hotline));
    impl.id = 'impl_st_hotline_view_b';
    impl.name = '热线工单月度归档视图';
    impl.techName = 'hotline_db.service.ticket_view_b';
    impl.warehouseTable = 'dim_hotline_ticket_b_df';
    impl.assetId = 'res-hotline-view-b';
    if (impl.extension) {
      impl.extension = { ...impl.extension, parentImplementation: impl.name };
    }
    state.implementations[impl.id] = impl;

    const bind = JSON.parse(JSON.stringify(state.bindings.bind_st_hotline));
    bind.id = 'bind_st_hotline_b';
    bind.implementationId = impl.id;
    bind.status = 'CANDIDATE';
    bind.role = 'SECONDARY';
    state.bindings[bind.id] = bind;

    window.localStorage.setItem(key, JSON.stringify(state));
  }, STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 将自然人的全部绑定置为 RETIRED → 已发布对象进入「无生效绑定」空态 */
async function retirePersonBindings(page: Page) {
  await page.evaluate((key) => {
    const state = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    Object.values<{ businessObjectId?: string; status?: string }>(state.bindings).forEach(
      (binding) => {
        if (binding.businessObjectId === 'bo_person') binding.status = 'RETIRED';
      }
    );
    window.localStorage.setItem(key, JSON.stringify(state));
  }, STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 等待瞬态 Toast 消退（4s 自动消失）：截图前调用，避免把一次性提示拍进状态截图 */
async function expectNoTransientToasts(page: Page) {
  await expect(page.locator('div.fixed.bottom-5.right-5 > div')).toHaveCount(0, {
    timeout: 8000
  });
}

/** 页面级横向溢出检查（主内容不横向溢出） */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Inspector 不挤压主区：主表面保持可用阅读宽度 */
async function expectMainSurfaceNotSqueezed(page: Page) {
  const box = await page.locator('[data-bo-surface="main"]').first().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(560);
}

/** Header 操作不覆盖对象定义：定义段落在动作行之下且不重叠 */
async function expectHeaderActionsDoNotCoverDefinition(page: Page) {
  const actions = await page.locator('#btn-view-knowledge-network').boundingBox();
  const definition = await page.locator('header p.max-w-4xl').boundingBox();
  expect(actions).not.toBeNull();
  expect(definition).not.toBeNull();
  expect(definition!.y).toBeGreaterThanOrEqual(actions!.y + actions!.height - 1);
}

/** 表格列不出现无意义换行：行高受限且表格未被容器裁切 */
async function expectTableColumnsNotWrapped(page: Page) {
  const rows = page.locator('[data-bo-surface="main"] table').first().locator('tbody tr');
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const box = await rows.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(90);
  }
  const clip = await page.evaluate(() => {
    const table = document.querySelector('[data-bo-surface="main"] table');
    if (!table || !table.parentElement) return 0;
    return table.scrollWidth - table.parentElement.clientWidth;
  });
  expect(clip).toBeLessThanOrEqual(1);
}

// ----------------------------------------------------------------------------
// CASE-1：已停用对象只读归档视图（隐藏改写型动作，而非禁用）
// ----------------------------------------------------------------------------
test('CASE-1 已停用对象隐藏修改与发现动作，业务视角与历史仍可查看', async ({ page }) => {
  await startFromSeed(page);
  // 已停用对象无生效绑定，目录「数据支撑」列为空提示 → 从对象名称进入业务视角
  await openDetailByName(page, 'bo_order');

  await expect(page.getByText('已停用', { exact: true }).first()).toBeVisible();

  // 不存在「修改业务对象」（隐藏而非禁用）
  await expect(page.locator('#btn-change-business-object')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '修改业务对象' })).toHaveCount(0);

  // 仍可查看业务视角
  await expect(page.getByText('对象身份', { exact: true })).toBeVisible();
  await expect(page.getByText('关键属性', { exact: true })).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-business-perspective-retired.png') });

  // 数据支撑视角为归档空态，不存在「发现数据支撑」入口
  await page.locator('#tab-data-support').click();
  await expect(page.getByText('当前暂无数据实现')).toBeVisible();
  await expect(page.getByRole('button', { name: '发现数据支撑', exact: true })).toHaveCount(0);
  await expect(page.getByText('该业务对象已停用，数据支撑以历史记录形式保留')).toBeVisible();

  // 仍可查看历史（更多操作菜单保留查看入口，停用动作隐藏）
  await page.locator('#btn-more-actions').click();
  await expect(page.getByText('查看完整历史')).toBeVisible();
  await expect(page.getByText('停用业务对象')).toHaveCount(0);
  await page.getByText('查看完整历史').click();
  await expect(page.getByText('变更历史 · 订单').first()).toBeVisible();
});

// ----------------------------------------------------------------------------
// CASE-2：业务视角单一连续 Main Surface + 单一 Inspector
// ----------------------------------------------------------------------------
test('CASE-2 业务视角单一主表面分节呈现而非多张 Section Card', async ({ page }) => {
  await startFromSeed(page);
  await openDetail(page, 'bo_service_ticket');
  await page.locator('#tab-business-view').click();

  await expect(page.locator('#tab-business-view[aria-selected="true"]')).toBeVisible();

  // Main Surface 数量 1，Inspector 数量 1
  await expect(page.locator('[data-bo-surface="main"]')).toHaveCount(1);
  await expect(page.locator('[data-bo-surface="inspector"]')).toHaveCount(1);

  // 单一主表面内以 Section + Divider 分节（4 节），而不是 4 张卡片
  await expect(page.locator('[data-bo-surface="main"] section')).toHaveCount(4);
  await expect(page.getByText('对象身份', { exact: true })).toBeVisible();
  await expect(page.getByText('核心业务关系', { exact: true })).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '01-business-perspective-published.png') });
});

// ----------------------------------------------------------------------------
// CASE-3 + CASE-4：服务事项数据支撑视角（Context Strip / 名称去重 / 资源角色分类）
// ----------------------------------------------------------------------------
test('CASE-3/4 服务事项 Context Strip 去重与材料清单资源角色分类', async ({ page }) => {
  await startFromSeed(page);
  await openDetail(page, 'bo_service_item');

  // 存在 Context Strip；Main Surface 1 + Inspector 1
  await expect(page.locator('[data-bo-strip="implementation"]')).toBeVisible();
  await expect(page.locator('[data-bo-surface="main"]')).toHaveCount(1);
  await expect(page.locator('[data-bo-surface="inspector"]')).toHaveCount(1);

  // Inspector 不存在「当前查看」重复区
  await expect(page.getByText('当前查看', { exact: true })).toHaveCount(0);

  // 当前实现名称（服务事项主数据表）完整重复不超过两处：
  // Context Strip 选择器 + Inspector 选中项；表内「当前来源」列的单元格数据不计
  const nameAll = await page.getByText('服务事项主数据表', { exact: true }).count();
  const nameInTables = await page
    .locator('table')
    .getByText('服务事项主数据表', { exact: true })
    .count();
  expect(nameAll - nameInTables).toBeLessThanOrEqual(2);

  // CASE-4：事项材料清单（一行一项材料）→ 相关数据，不计入正式 Data Implementation 数量
  await expect(
    page.locator('[data-bo-surface="main"] h3', { hasText: '相关数据' })
  ).toBeVisible();
  await expect(
    page.locator('[data-bo-surface="main"]').getByText('事项材料清单表', { exact: true }).first()
  ).toBeVisible();
  await expect(page.getByText('1 套实现', { exact: true })).toBeVisible();
  await expect(page.getByText('1 套数据实现', { exact: true })).toBeVisible();
  await expect(page.getByText('3 套实现', { exact: true })).toHaveCount(0);

  // 事项办理指南（一行一个事项指南）→ 属性扩展
  await expect(
    page.locator('[data-bo-surface="main"]').getByText('事项办理指南表', { exact: true }).first()
  ).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-data-support-current-binding.png') });
});

// ----------------------------------------------------------------------------
// CASE-5：无候选 Top-down → 两栏空态（无决策区、无任何「通过」状态）
// ----------------------------------------------------------------------------
test('CASE-5 无候选 Top-down 两栏空态且不出现条件通过', async ({ page }) => {
  await startFromSeed(page);
  await openResolveWorkspace(page, 'bo_person');

  // 两栏
  await expect(page.locator('[data-bo-decision-columns="2"]')).toBeVisible();
  await expect(page.locator('[data-bo-decision-columns="3"]')).toHaveCount(0);

  // 单一空状态
  await expect(page.getByText('当前没有新的候选数据支撑')).toBeVisible();

  // 不存在决策区元素
  await expect(page.getByText('数据实现条件', { exact: true })).toHaveCount(0);
  await expect(page.getByText('本次将建立', { exact: true })).toHaveCount(0);
  await expect(page.locator('#btn-handle-later')).toHaveCount(0);
  await expect(page.locator('#btn-confirm-data-support')).toHaveCount(0);

  // 不存在任何提前「通过」状态
  await expect(page.getByText('一致', { exact: true })).toHaveCount(0);
  await expect(page.getByText('已核验', { exact: true })).toHaveCount(0);
  await expect(page.getByText('已明确', { exact: true })).toHaveCount(0);

  // 只有一个返回数据支撑操作
  await expect(
    page.getByRole('button', { name: '返回业务对象详情', exact: true })
  ).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '06-topdown-no-candidate.png') });
});

// ----------------------------------------------------------------------------
// CASE-6 + CASE-7：有候选 Top-down 三栏（未选 → 已选 → 确认结果态）
// ----------------------------------------------------------------------------
test('CASE-6/7 有候选三栏决策：未选无通过结论，选中显真实条件，确认后为结果态', async ({ page }) => {
  await startFromSeed(page);
  // 先真实写入一次让种子落盘，再克隆第二条热线候选（两个候选互不预选）
  await persistSeedViaRealWrite(page);
  await injectSecondHotlineCandidate(page);
  await openResolveWorkspace(page, 'bo_service_ticket');

  // 三栏
  await expect(page.locator('[data-bo-decision-columns="3"]')).toBeVisible();

  // 选择候选前：中栏候选清单 + Inspector 提示选择，不显示已通过条件与确认操作
  await expect(page.getByText('请选择一个候选数据支撑')).toBeVisible();
  await expect(page.getByText('数据实现条件', { exact: true })).toHaveCount(0);
  await expect(page.getByText('本次将建立', { exact: true })).toHaveCount(0);
  await expect(page.locator('#btn-confirm-data-support')).toHaveCount(0);
  await expect(page.getByText('已核验', { exact: true })).toHaveCount(0);
  await expect(page.getByText('主体一致', { exact: true })).toHaveCount(0);

  // 选择候选后：呈现真实条件与确认操作
  await page.locator('#candidate-bind_st_hotline_b').click();
  await expect(
    page.getByRole('heading', { name: /是否将「热线工单月度归档视图」/ })
  ).toBeVisible();
  await expect(page.getByText('数据实现条件', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('本次将建立', { exact: true })).toBeVisible();
  await expect(page.locator('#btn-confirm-data-support')).toBeVisible();
  await expect(page.locator('#btn-dismiss-candidate')).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '05-topdown-candidate-selected.png') });

  // CASE-7：确认后进入结果态，不继续显示候选确认按钮
  await page.locator('#btn-confirm-data-support').click();
  await expect(page.getByText('数据支撑已确认').first()).toBeVisible();
  await expect(page.getByText('候选已确认生效')).toBeVisible();
  await expect(page.locator('#confirm-state-effective')).toBeVisible();
  await expect(page.locator('#btn-confirm-data-support')).toHaveCount(0);
  await expect(page.locator('#btn-handle-later')).toHaveCount(0);
});

// ----------------------------------------------------------------------------
// 截图 4：已发布对象的空数据支撑（无生效绑定 → 空态 + 发现入口）
// ----------------------------------------------------------------------------
test('截图 4：已发布对象无生效绑定的空数据支撑状态', async ({ page }) => {
  await startFromSeed(page);
  await persistSeedViaRealWrite(page);
  await retirePersonBindings(page);
  // 全部绑定退休后目录「数据支撑」列为空提示 → 从对象名称进入再切数据支撑视角
  await openDetailByName(page, 'bo_person');
  await page.locator('#tab-data-support').click();

  await expect(page.getByText('当前暂无数据实现')).toBeVisible();
  await expect(page.locator('#btn-discover-data-support')).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '04-data-support-empty.png') });
});

// ----------------------------------------------------------------------------
// 截图 7/8：数据支撑复核（待复核 → 复核完成后空态）
// ----------------------------------------------------------------------------
test('截图 7/8：数据支撑复核待复核与空态', async ({ page }) => {
  await startFromSeed(page);
  await openDetail(page, 'bo_person');

  await expect(page.getByText('1 项数据支撑待复核')).toBeVisible();
  await page.locator('#btn-navigate-revalidation').click();
  await expect(page.getByText('1 项待复核', { exact: true })).toBeVisible();

  // 种子复核上下文：R2 修订 + 受影响目标（常住状态 / 户籍类型）
  await expect(page.getByText('常住状态', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('户籍类型', { exact: true }).first()).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '07-revalidation-pending.png') });

  await page.getByRole('button', { name: '确认继续使用' }).click();
  await expect(page.getByText('没有待复核的数据支撑', { exact: true })).toBeVisible();

  await expectNoTransientToasts(page);
  await page.screenshot({ path: join(SCREENSHOT_DIR, '08-revalidation-empty.png') });
});

// ----------------------------------------------------------------------------
// §19 追加检查：1440×900 不横向溢出 / Inspector 不挤压主区 / 表格不无意义换行 /
// Header 操作不覆盖对象定义
// ----------------------------------------------------------------------------
test('1440×900 布局收口：无横向溢出、主区不被挤压、表格不换行、Header 不覆盖定义', async ({ page }) => {
  await startFromSeed(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // 业务视角
  await openDetail(page, 'bo_service_ticket');
  await page.locator('#tab-business-view').click();
  await expectNoHorizontalOverflow(page);
  await expectMainSurfaceNotSqueezed(page);
  await expectHeaderActionsDoNotCoverDefinition(page);

  // 数据支撑视角（含落地表格）
  await page.locator('#tab-data-support').click();
  await expectNoHorizontalOverflow(page);
  await expectMainSurfaceNotSqueezed(page);
  await expectHeaderActionsDoNotCoverDefinition(page);
  await expectTableColumnsNotWrapped(page);

  // Top-down 有候选（种子单候选自动选中 → 三栏决策态）
  await openResolveWorkspace(page, 'bo_service_ticket');
  await expectNoHorizontalOverflow(page);
  await expectMainSurfaceNotSqueezed(page);

  // 数据支撑复核
  await openDetail(page, 'bo_person');
  await page.locator('#btn-navigate-revalidation').click();
  await expect(page.getByText('1 项待复核', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
