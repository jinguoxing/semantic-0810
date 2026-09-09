import { expect, test, type Page } from '@playwright/test';

/**
 * Business Object V2.2 生命周期硬化 E2E（BO-1 … BO-10）
 *
 * 覆盖：统一入口导航 → Create 独立创建 → Change 正式修订 →
 * Top-down 候选确认（候选不进正式视图）→ Bottom-up 对齐闭环 → 稍后处理保留上下文 →
 * Revalidation 只写 DataSupportRevision → 属性 / 关系 Grounding 修正不触碰业务对象修订 →
 * 非法关系候选不可达。
 *
 * 已删除的历史错误断言（V2.2 硬化禁止项）：
 * - Candidate 出现在正式 Data Support 视图；
 * - 申请人 → 自然人 修正为 ticket_id；
 * - 点击 Logo 进入业务对象目录（Logo 现返回 Xino 首页）。
 *
 * 领域状态持久化在 localStorage（semovix_business_object_state_v1），
 * 每条用例在独立 Browser Context 中运行，默认从种子状态出发。
 */

const STORE_KEY = 'semovix_business_object_state_v1';

interface PersistedState {
  version: number;
  objects: Record<string, { id: string; name: string; currentRevision: string; aliases: string[]; definition: string }>;
  implementations: Record<string, { id: string; businessObjectId: string; assetId: string; name: string }>;
  bindings: Record<string, { id: string; businessObjectId: string; implementationId: string; status: string; role: string; revision: string }>;
  groundingRevisions: Record<string, { type: string; targetName: string; status: string; before: { field: string }; after: { field: string } }>;
  revisions: Record<string, { businessObjectId: string; revision: string; status: string }>;
  taskContexts: Record<string, { taskId: string; status: string; returnRoute: string; dataAsset?: { id: string; name: string } }>;
  dataSupportRevisions: Record<string, { businessObjectId: string; action: string }>;
}

/** 进入应用并确保领域 Store 从种子状态出发（含 reload 的用例借此隔离） */
async function startFromSeed(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.removeItem(key), STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 顶栏「业务语义」下拉 →「业务对象」→ 业务对象目录（统一入口，禁止 Logo 直达） */
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

/** 读取持久化的领域 Store */
async function readStore(page: Page): Promise<PersistedState> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORE_KEY);
}

test.describe('Business Object V2.2 E2E', () => {
  test('BO-1: 业务语义 → 业务对象目录 → 服务工单详情（统一入口，领域 Store 驱动）', async ({ page }) => {
    await startFromSeed(page);

    // Logo 返回 Xino 首页，不再直达业务对象目录
    await page.getByText('Semovix', { exact: true }).first().click();
    await expect(page.getByText('Xino智能伙伴').first()).toBeVisible();

    // 统一入口：业务语义下拉 → 业务对象
    await openObjectsList(page);
    await expect(page.locator('#bo-name-bo_service_ticket')).toBeVisible();

    // 目录行 → 服务工单详情（业务视角）
    await page.locator('#bo-name-bo_service_ticket').click();
    await expect(page.getByRole('heading', { name: '服务工单' })).toBeVisible();
    // 详情由领域 Store 驱动：对象标识 / 业务域 / 正式别名
    await expect(page.getByText('bo_service_ticket').first()).toBeVisible();
    await expect(page.getByText('主要业务域：公共服务').first()).toBeVisible();
    await expect(page.getByText('服务诉求单').first()).toBeVisible();
  });

  test('BO-2: Create 独立创建「热线坐席」→ 保存草稿 → 发布 → Registry 出现且 Detail 显示正式 R1，reload 后仍存在', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openObjectsList(page);

    // 新建业务对象 → 创建工作台
    await page.locator('#btn-create-business-object').click();
    await expect(page.locator('#bo-authoring-container')).toBeVisible();

    // 复用检查：与「客服坐席」高度相似 → 选择独立创建
    await page.locator('#input-bo-name').fill('热线坐席');
    await expect(page.locator('#existing-object-card')).toBeVisible();
    await page.locator('#btn-toggle-define-independent').click();
    await page.getByPlaceholder('请说明核心业务区别...').fill('限定语音热线专属排班技能体系，沉淀独立业务指标。');
    await page.getByRole('button', { name: '提交 Semovix 重新评估' }).click();
    await expect(page.getByText('Semovix 评估认可独立业务对象身份')).toBeVisible({ timeout: 10_000 });

    // 保存草稿（真实写入领域 Store，发布前不触碰正式对象）
    await page.locator('#btn-bo-save-draft').click();
    await expect(page.getByText('草稿保存成功')).toBeVisible();

    // 发布：共享确认弹窗 → 确认发布 → 进入新对象业务视角
    await page.locator('#btn-bo-publish').click();
    await expect(page.getByText('确认发布业务对象')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();
    await expect(page.getByRole('heading', { name: '热线坐席' })).toBeVisible({ timeout: 15_000 });

    // Detail 显示正式 R1（历史抽屉：当前正式版本）
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText('R1 · 首次发布「热线坐席」业务定义').first()).toBeVisible();
    await expect(page.getByText('当前正式版本').first()).toBeVisible();
    await page.getByRole('button', { name: '关闭' }).last().click();

    // Registry 出现「热线坐席」（真实领域写入，非页面私有状态）
    await openObjectsList(page);
    await expect(page.getByRole('heading', { name: '业务对象' })).toBeVisible();
    await expect(page.getByText('热线坐席').first()).toBeVisible();

    // reload 后仍存在：领域 Store 持久化
    await page.reload();
    await openObjectsList(page);
    await expect(page.getByText('热线坐席').first()).toBeVisible();
    const store = await readStore(page);
    const created = Object.values(store.objects).find((object) => object.name === '热线坐席');
    expect(created?.currentRevision).toBe('R1');
  });

  test('BO-3: Change 修改服务工单（定义 + 别名）→ 保存草稿 → 发布 → BusinessObjectRevision 增加，reload 后仍保持', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 打开服务工单详情 → 修改业务对象
    await openObjectsList(page);
    await page.locator('#bo-name-bo_service_ticket').click();
    await expect(page.getByRole('heading', { name: '服务工单' })).toBeVisible();
    await page.locator('#btn-change-business-object').click();

    // 修改工作台：基线修订号来自领域 Store（种子 R1）
    await expect(page.getByText(/当前正式版本 R1 仍在生效/)).toBeVisible();

    // 修改定义与别名
    await page.locator('#input-business-definition').fill(
      '企业和政府部门面向公众受理、流转与办结服务诉求的正式业务记录，覆盖热线与线上全渠道。'
    );
    await page.getByPlaceholder('+ 输入别名后回车').fill('政务诉求工单');
    await page.getByPlaceholder('+ 输入别名后回车').press('Enter');
    await expect(page.getByText('政务诉求工单').first()).toBeVisible();

    // 保存草稿 → 发布
    await page.locator('#btn-save-draft').click();
    await expect(page.getByText('草稿已保存')).toBeVisible();
    await page.locator('#btn-publish-change').click();
    await expect(page.getByText('确认发布业务对象修改')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();

    // 发布成功 → 进入新正式版本的业务视角，新内容生效
    await expect(page.getByRole('heading', { name: '服务工单' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('热线与线上全渠道').first()).toBeVisible();
    await expect(page.getByText('政务诉求工单').first()).toBeVisible();

    // BusinessObjectRevision 增加：R2 当前正式版本，R1 归档为历史版本
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText('R2 · ').first()).toBeVisible();
    await expect(page.getByText('R1 · ').first()).toBeVisible();
    await expect(page.getByText('历史版本').first()).toBeVisible();
    await page.getByRole('button', { name: '关闭' }).last().click();

    // reload 后仍保持
    await page.reload();
    await openObjectsList(page);
    await page.locator('#bo-name-bo_service_ticket').click();
    await expect(page.getByText('政务诉求工单').first()).toBeVisible();
    const store = await readStore(page);
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R2');
    const ticketRevisions = Object.values(store.revisions).filter((revision) => revision.businessObjectId === 'bo_service_ticket');
    expect(ticketRevisions.length).toBeGreaterThanOrEqual(2);
  });

  test('BO-4: Top-down 确认候选数据支撑：确认前不显示 Candidate，确认后 EFFECTIVE，reload 后保持', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 确认前：正式数据支撑视图不显示候选实现（Inv05）
    await expect(page.getByText('主要数据实现 · 已生效').first()).toBeVisible();
    await expect(page.getByText('公共服务热线工单记录表')).toHaveCount(0);

    // 发现更多数据支撑 → Top-down 工作区（携带当前对象上下文）
    await page.getByText('发现更多数据支撑').first().click();
    await expect(page.getByRole('heading', { name: '发现数据支撑' })).toBeVisible();
    await expect(page.getByText('公共服务热线工单记录表').first()).toBeVisible();
    await expect(page.getByText('需要你确认').first()).toBeVisible();

    // 确认当前候选（bind_st_hotline）→ 工作区呈现已确认生效的持久化状态
    await page.locator('#btn-confirm-data-support').click();
    await expect(page.getByText('候选已确认生效').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/已确认生效 · R2 · 刷新页面状态仍保持/).first()).toBeVisible();

    // 查看当前数据支撑 → 返回详情
    await page.getByRole('button', { name: '查看当前数据支撑' }).first().click();
    await expect(page.locator('#tab-data-support')).toBeVisible({ timeout: 15_000 });

    // 返回详情：该实现显示已生效（不再有候选状态）
    await page.getByRole('button', { name: '客服工单当前视图' }).click();
    await page.getByRole('button', { name: /公共服务热线工单记录表/ }).click();
    await expect(page.getByText('其他数据实现 · 已生效').first()).toBeVisible();
    // 主要数据实现不受影响：一次确认只影响一条绑定（主实现仍为 客服工单当前视图）
    await expect(page.getByText('主要数据实现：客服工单当前视图').first()).toBeVisible();

    // reload 后保持：领域 Store 持久化
    await page.reload();
    await openDetail(page, 'bo_service_ticket');
    await page.getByRole('button', { name: '客服工单当前视图' }).click();
    await page.getByRole('button', { name: /公共服务热线工单记录表/ }).click();
    await expect(page.getByText('其他数据实现 · 已生效').first()).toBeVisible();
    const store = await readStore(page);
    expect(store.bindings.bind_st_hotline.status).toBe('EFFECTIVE');
    expect(store.bindings.bind_st_curr_view.status).toBe('EFFECTIVE');
    expect(store.bindings.bind_st_curr_view.role).toBe('PRIMARY');
    // Top-down 确认只写 DataSupportRevision，不产生业务对象修订
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
  });

  test('BO-5: Bottom-up 从数据语义进入 → 主动选择服务工单 → EFFECTIVE Binding → 返回原上下文且任务 COMPLETED', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 数据语义队列（业务语义下拉）→ 已确认语义 → 查看语义详情
    await page.getByText('业务语义', { exact: true }).first().click();
    await page.getByText('数据语义理解').first().click();
    await page.getByRole('button', { name: /已确认/ }).click();
    await page.getByRole('button', { name: '查看语义' }).first().click();
    await expect(page.getByText('形成业务对象')).toBeVisible();

    // 形成业务对象 → 对齐工作区（含任务上下文，返回原上下文）
    await page.getByText('形成业务对象').click();
    await expect(page.getByText(/对齐任务 task_form_.*完成后返回原上下文/).first()).toBeVisible();

    // 用户主动选择目标业务对象（无预选）
    await expect(page.getByText('请先选择目标业务对象')).toBeVisible();
    await page.locator('#bo-option-bo_service_ticket').click();

    // 确认对齐 → 按返回路由回到数据语义详情（禁止退回业务对象列表）
    await page.getByRole('button', { name: /确认对齐“服务工单”/ }).click();
    await expect(page.getByText(/已按对齐任务/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();

    // 领域：EFFECTIVE 绑定 + BOTTOM_UP_ALIGN 修订 + 任务 COMPLETED + 业务对象修订不受影响
    const store = await readStore(page);
    const task = store.taskContexts['task_form_sem_hotline_ticket'];
    expect(task?.status).toBe('COMPLETED');
    // 规范资产身份：语义入口 semanticId 不作为资产 ID，统一归一到目录 asset-1
    expect(task?.dataAsset?.id).toBe('asset-1');
    // 同一规范资产只有一条数据实现（与种子热线实现合一，不重复登记）
    const sameAsset = Object.values(store.implementations).filter((impl) => impl.assetId === 'asset-1');
    expect(sameAsset.map((impl) => impl.id)).toEqual(['impl_st_hotline']);
    const binding = Object.values(store.bindings).find((item) => item.implementationId === 'impl_st_hotline');
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.businessObjectId).toBe('bo_service_ticket');
    const actions = Object.values(store.dataSupportRevisions)
      .filter((revision) => revision.businessObjectId === 'bo_service_ticket')
      .map((revision) => revision.action);
    expect(actions).toContain('BOTTOM_UP_ALIGN');
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
  });

  test('BO-6: Bottom-up 稍后处理 → 返回来源，Context.status = POSTPONED 且不被删除', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 同一入口：数据语义详情 → 形成业务对象
    await page.getByText('业务语义', { exact: true }).first().click();
    await page.getByText('数据语义理解').first().click();
    await page.getByRole('button', { name: /已确认/ }).click();
    await page.getByRole('button', { name: '查看语义' }).first().click();
    await page.getByText('形成业务对象').click();
    await expect(page.getByText(/对齐任务 task_form_.*完成后返回原上下文/).first()).toBeVisible();

    // 稍后处理：保留上下文并返回来源
    await page.locator('#btn-postpone-resolution').click();
    await expect(page.getByText(/已按对齐任务/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();

    // 领域：POSTPONED 且上下文保留（未被删除），无任何领域写入
    const store = await readStore(page);
    const task = store.taskContexts['task_form_sem_hotline_ticket'];
    expect(task?.status).toBe('POSTPONED');
    expect(task?.returnRoute).toBe('semantics_detail');
    expect(Object.keys(store.dataSupportRevisions)).toHaveLength(0);
  });

  test('BO-7: Revalidation 确认继续使用 → 回到 EFFECTIVE，只增加 DataSupportRevision，currentRevision 不变', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_person');

    // 种子场景：人口扩展信息绑定 NEEDS_REVALIDATION
    await expect(page.getByText('1 项数据支撑待复核')).toBeVisible();
    await page.locator('#btn-navigate-revalidation').click();

    // 复核工作区：复核原因 / 触发修订 来自领域种子
    await expect(page.getByText('1 项待复核')).toBeVisible();
    await expect(page.getByText(/常住状态.*业务口径/)).toBeVisible();

    // 确认继续使用 → 绑定恢复生效，复核队列清空
    await page.getByRole('button', { name: /确认继续使用/ }).click();
    await expect(page.getByText('没有待复核的数据支撑', { exact: true })).toBeVisible();

    // 重新进入自然人详情：待复核入口消失（确认结果已写入领域 Store）
    await openDetail(page, 'bo_person');
    await expect(page.getByText(/项数据支撑待复核/)).toHaveCount(0);

    // 领域：只增加 DataSupportRevision；BusinessObject.currentRevision 不变化
    const store = await readStore(page);
    expect(store.bindings.bind_person_ext.status).toBe('EFFECTIVE');
    const personActions = Object.values(store.dataSupportRevisions)
      .filter((revision) => revision.businessObjectId === 'bo_person')
      .map((revision) => revision.action);
    expect(personActions).toContain('REVALIDATION_KEEP');
    expect(store.objects.bo_person.currentRevision).toBe('R2');
    const personRevisions = Object.values(store.revisions).filter((revision) => revision.businessObjectId === 'bo_person');
    expect(personRevisions.length).toBe(2);
  });

  test('BO-8: 属性 Grounding 修正 finished_time → close_time：产生 GroundingRevision，currentRevision 不变', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 种子场景：办结时间（finished_time）需要修正
    await page.getByRole('button', { name: '修正属性对应' }).click();
    await expect(page.locator('#local-grounding-correction-drawer')).toBeVisible();
    await expect(page.getByRole('heading', { name: '修正属性对应' })).toBeVisible();

    // 确认默认候选（finished_time → close_time）
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);

    // 修订历史来自领域 Store（Grounding 修正分节，不混入业务定义版本）
    await page.getByText('查看完整历史').first().click();
    await expect(page.getByText('办结时间：finished_time → close_time')).toBeVisible();
    await expect(page.getByText('属性对应修正')).toBeVisible();
    await page.getByRole('button', { name: '关闭' }).last().click();

    // 领域：产生 ATTRIBUTE GroundingRevision；业务对象修订与 currentRevision 不变
    const store = await readStore(page);
    const attributeRevision = Object.values(store.groundingRevisions).find(
      (revision) => revision.type === 'ATTRIBUTE' && revision.targetName === '办结时间'
    );
    expect(attributeRevision?.status).toBe('ACTIVE');
    expect(attributeRevision?.before.field).toBe('finished_time');
    expect(attributeRevision?.after.field).toBe('close_time');
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
    const ticketRevisions = Object.values(store.revisions).filter((revision) => revision.businessObjectId === 'bo_service_ticket');
    expect(ticketRevisions.length).toBe(1);
  });

  test('BO-9: 关系 Grounding 申请人 → 自然人：候选仅 applicant_id / person_id，选择 person_id 成功且 reload 后保持', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 第一条核心关系：申请人 → 自然人
    await page.locator('#btn-correct-rel-0').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toBeVisible();
    await expect(page.getByRole('heading', { name: '修正关系落地' })).toBeVisible();

    // 候选只含与目标对象身份兼容的字段：申请人标识（applicant_id）/ 自然人标识（person_id）
    const drawer = page.locator('#local-grounding-correction-drawer');
    await expect(drawer.getByText('申请人标识').first()).toBeVisible();
    await expect(drawer.getByText('自然人标识').first()).toBeVisible();
    // 不能看到工单自身字段（Inv08）
    await expect(drawer.getByText('ticket_id')).toHaveCount(0);
    await expect(drawer.getByText('close_time')).toHaveCount(0);

    // 选择 person_id（自然人标识）并确认：选择状态在确认前真实生效
    await page.getByText(/自然人在工单记录中的主体标识字段/).click();
    await expect(drawer.locator('input[name="candidate_field"]').nth(1)).toBeChecked();
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);

    // 关系更新成功：落地字段替换为 实现名 · person_id，其余关系不受影响
    await expect(page.getByText('客服工单当前视图 · person_id').first()).toBeVisible();
    await expect(page.getByText('客服工单当前视图 · handle_dept_id').first()).toBeVisible();

    // 产生 RELATIONSHIP GroundingRevision；业务对象修订不受影响
    const store = await readStore(page);
    const relationshipRevision = Object.values(store.groundingRevisions).find((revision) => revision.type === 'RELATIONSHIP');
    expect(relationshipRevision?.targetName).toBe('申请人 → 自然人');
    expect(relationshipRevision?.status).toBe('ACTIVE');
    expect(relationshipRevision?.after.field).toBe('客服工单当前视图 · person_id');
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');

    // reload 后保持
    await page.reload();
    await openDetail(page, 'bo_service_ticket');
    await expect(page.getByText('客服工单当前视图 · person_id').first()).toBeVisible();
  });

  test('BO-10: 非法关系候选：ticket_id 不在候选集，无法映射，不产生修订且原关系保持不变', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    await page.locator('#btn-correct-rel-0').click();
    const drawer = page.locator('#local-grounding-correction-drawer');
    await expect(drawer).toBeVisible();

    // 领域侧拒绝在 UI 的投影：工单自身 / 其他关系目标的字段均不可选（CANDIDATE_NOT_ALLOWED）
    await expect(drawer.getByText('ticket_id')).toHaveCount(0);
    await expect(drawer.getByText('close_time')).toHaveCount(0);
    await expect(drawer.getByText('accept_time')).toHaveCount(0);
    await expect(drawer.getByText('承办部门标识')).toHaveCount(0);
    await expect(drawer.getByText('所属区域标识')).toHaveCount(0);

    // 取消修正：不产生任何 GroundingRevision，原关系保持不变
    await page.locator('#btn-cancel-correction').click();
    await expect(drawer).toHaveCount(0);
    await expect(page.getByText('客服工单当前视图 · applicant_id').first()).toBeVisible();

    // 全程零领域写入：无 mutate 即无持久化，localStorage 保持为空（比“无 GroundingRevision”更强的零写入证明）
    const store = await readStore(page);
    expect(Object.keys(store)).toHaveLength(0);
  });
});
