import { expect, test, type Page } from '@playwright/test';

/**
 * Business Object V2.2 最终收口边界 E2E（EDGE-1 … EDGE-9）
 *
 * 覆盖九个收口边界：
 * - EDGE-1 Change 通用化：任意对象（自然人）进入修改工作台，不串服务工单演示内容；
 * - EDGE-2 规范资产身份：数据语义入口与数据资产目录入口对同一张表归一到同一 dataAssetId，只登记一条实现；
 * - EDGE-3 Bottom-up 创建新对象：发布后自动对齐并按 returnRoute 返回数据侧原上下文（不留在对象详情）；
 * - EDGE-4 Bottom-up 复用：不创建新对象、不改正式定义、不静默加别名，任务完成并返回来源；
 * - EDGE-5 NEEDS_REVALIDATION 视为当前绑定：待复核主实现仍占 PRIMARY 唯一位，切主后自动降级且不产生双主；
 * - EDGE-6 NEEDS_REVALIDATION 下的资产冲突：待复核绑定仍占用资产，跨对象对齐被拦截（零写入）；
 * - EDGE-7 同一关系连续修正：同一 targetKey 至多一条 ACTIVE，上一条归档为 HISTORY；
 * - EDGE-8 同一份草稿：两次保存复用同一 draftId，发布同一份草稿，无 WORKING 孤儿；
 * - EDGE-9 消费面 / 治理面边界：Marketplace 不显示治理操作，Governance 不显示消费操作。
 *
 * 领域状态持久化在 localStorage（semovix_business_object_state_v1），
 * 每条用例在独立 Browser Context 中运行，默认从种子状态出发；
 * EDGE-5 / EDGE-6 通过直接编辑持久化状态模拟「数据语义修订触发复核」
 * （该触发来自语义模块，业务对象页面没有直接入口），再走真实 UI 验证行为。
 */

const STORE_KEY = 'semovix_business_object_state_v1';

interface PersistedState {
  version: number;
  objects: Record<string, { id: string; name: string; currentRevision: string; aliases: string[]; definition: string }>;
  implementations: Record<string, { id: string; businessObjectId: string; assetId: string; name: string }>;
  bindings: Record<string, { id: string; businessObjectId: string; implementationId: string; status: string; role: string; revision: string }>;
  groundingRevisions: Record<string, { type: string; targetId: string; targetKey: string; status: string }>;
  revisions: Record<string, { businessObjectId: string; revision: string; status: string }>;
  taskContexts: Record<string, {
    taskId: string;
    status: string;
    returnRoute: string;
    dataAsset?: { id: string; name: string };
    semanticSource?: { semanticId: string; semanticRevision: string };
  }>;
  dataSupportRevisions: Record<string, { businessObjectId: string; action: string; bindingId?: string }>;
  drafts: Record<string, { mode: string; objectId?: string; status: string; content: { definition: string } }>;
}

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

/** 读取持久化的领域 Store */
async function readStore(page: Page): Promise<PersistedState> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORE_KEY);
}

/**
 * 将某条绑定标记为 NEEDS_REVALIDATION 并重载（模拟数据语义修订触发复核）。
 * 要求 localStorage 已有持久化状态（先经过一次真实领域写入）。
 */
async function markBindingForRevalidation(page: Page, bindingId: string, sourceRevision: string) {
  const persisted = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY);
  expect(persisted).toBeTruthy();
  await page.evaluate(
    ({ key, bindingId, sourceRevision }) => {
      const state = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      const binding = state.bindings[bindingId];
      if (!binding) throw new Error(`binding ${bindingId} not found`);
      binding.status = 'NEEDS_REVALIDATION';
      binding.revalidation = {
        reason: `语义修订 ${sourceRevision}：业务口径调整，需复核该数据支撑`,
        sourceRevision,
        affectedTargets: ['办结时间']
      };
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORE_KEY, bindingId, sourceRevision }
  );
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 数据语义详情 →「形成业务对象」→ 对齐工作台（数据语义入口，携带任务上下文） */
async function enterResolutionFromSemantics(page: Page) {
  await page.getByText('业务语义', { exact: true }).first().click();
  await page.getByText('数据语义理解', { exact: true }).first().click();
  await page.getByRole('button', { name: /已确认/ }).click();
  await page.getByRole('button', { name: '查看语义' }).first().click();
  await expect(page.getByText('形成业务对象')).toBeVisible();
  await page.getByText('形成业务对象').click();
  await expect(page.getByRole('heading', { name: '业务对象对齐' })).toBeVisible();
}

/** 顶栏「数据治理」→ StageHeader「语义资产」→ 数据资产全景目录 */
async function openAssetsCatalog(page: Page) {
  await page.getByRole('button', { name: '数据治理' }).click();
  await page.getByText('语义资产', { exact: true }).first().click();
  await expect(page.getByText('公共服务热线工单记录表').first()).toBeVisible();
}

/** 目录行 → 热线表的治理面资产详情（§12：目录入口展示治理操作） */
async function openHotlineGovernanceAssetDetail(page: Page) {
  await openAssetsCatalog(page);
  await page.locator('span.font-bold.cursor-pointer', { hasText: '公共服务热线工单记录表' }).first().click();
  await expect(page.locator('#btn-align-business-object')).toBeVisible();
}

/** 服务工单详情 → 发现数据支撑 → 确认候选（真实领域写入，同时让全量状态落盘） */
async function confirmHotlineCandidate(page: Page) {
  await openDetail(page, 'bo_service_ticket');
  await page.getByText('发现更多数据支撑').first().click();
  await expect(page.getByRole('heading', { name: '发现数据支撑' })).toBeVisible();
  await page.locator('#btn-confirm-data-support').click();
  await expect(page.getByText('候选已确认生效').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '查看当前数据支撑' }).first().click();
  await expect(page.locator('#tab-data-support')).toBeVisible({ timeout: 15_000 });
}

test.describe('Business Object V2.2 边界 E2E', () => {
  test('EDGE-1: Change 通用化 —— 自然人修改定义发布，不串服务工单演示内容，各自草稿互不污染', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 自然人（非演示对象）→ 修改业务对象
    await openObjectsList(page);
    await page.locator('#bo-name-bo_person').click();
    await expect(page.getByRole('heading', { name: '自然人' })).toBeVisible();
    await page.locator('#btn-change-business-object').click();

    // 基线修订号来自领域 Store（自然人种子 currentRevision = R2，不是服务工单的 R1）
    await expect(page.getByText(/当前正式版本 R2 仍在生效/)).toBeVisible();

    // 修改依据只含自然人正式依据，不串服务工单演示草稿的文档依据
    await page.getByText('查看依据').first().click();
    await expect(page.getByText('修改依据明细')).toBeVisible();
    await expect(page.getByText(/热线运行管理办法/)).toHaveCount(0);
    await page.getByRole('button', { name: '关闭' }).last().click();

    // 修改定义与别名
    await page.locator('#input-business-definition').fill(
      '表示企业或政务业务中被稳定识别和关联的自然人主体，统一覆盖户籍与常住人口口径。'
    );
    await page.getByPlaceholder('+ 输入别名后回车').fill('常住人口');
    await page.getByPlaceholder('+ 输入别名后回车').press('Enter');

    // 保存草稿：创建自然人的 CHANGE 草稿（服务工单演示草稿不受影响）
    await page.locator('#btn-save-draft').click();
    await expect(page.getByText('草稿已保存')).toBeVisible();
    let store = await readStore(page);
    const personDrafts = Object.values(store.drafts).filter((draft) => draft.objectId === 'bo_person');
    expect(personDrafts).toHaveLength(1);
    expect(personDrafts[0].status).toBe('WORKING');
    expect(store.drafts['bodraft_st_change_demo'].status).toBe('WORKING');

    // 发布 → 自然人 R2 → R3，内容生效
    await page.locator('#btn-publish-change').click();
    await expect(page.getByText('确认发布业务对象修改')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();
    await expect(page.getByRole('heading', { name: '自然人' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('统一覆盖户籍与常住人口口径').first()).toBeVisible();
    await expect(page.getByText('常住人口').first()).toBeVisible();

    store = await readStore(page);
    expect(store.objects.bo_person.currentRevision).toBe('R3');
    expect(store.objects.bo_person.aliases).toContain('常住人口');
    const personRevisions = Object.values(store.revisions).filter((revision) => revision.businessObjectId === 'bo_person');
    expect(personRevisions.length).toBe(3);
    // 通用化隔离：服务工单完全不受影响（修订号 / 演示草稿）
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
    expect(store.drafts['bodraft_st_change_demo'].status).toBe('WORKING');
    // 自然人发布后无 WORKING 草稿残留（同一份草稿发布后置 PUBLISHED）
    expect(
      Object.values(store.drafts).filter((draft) => draft.status === 'WORKING' && draft.objectId === 'bo_person')
    ).toHaveLength(0);
  });

  test('EDGE-2: 规范资产身份 —— 语义入口与资产目录入口对同一张表归一 asset-1，只登记一条数据实现', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 入口一：数据语义（sem_hotline_ticket）→ 对齐服务工单
    await enterResolutionFromSemantics(page);
    await expect(page.getByText(/对齐任务 task_form_sem_hotline_ticket/).first()).toBeVisible();
    await page.locator('#bo-option-bo_service_ticket').click();
    await page.getByRole('button', { name: /确认对齐“服务工单”/ }).click();
    await expect(page.getByText(/已按对齐任务/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();

    let store = await readStore(page);
    // semanticId 只作证据：资产身份归一为 asset-1，复用种子热线实现，不重复登记
    const semanticsTask = store.taskContexts['task_form_sem_hotline_ticket'];
    expect(semanticsTask?.status).toBe('COMPLETED');
    expect(semanticsTask?.dataAsset?.id).toBe('asset-1');
    expect(semanticsTask?.semanticSource?.semanticId).toBe('sem_hotline_ticket');
    expect(Object.values(store.implementations).filter((impl) => impl.assetId === 'asset-1').map((impl) => impl.id)).toEqual([
      'impl_st_hotline'
    ]);

    // 入口二：数据资产目录（asset-1，治理面）→ 再次对齐服务工单
    await openHotlineGovernanceAssetDetail(page);
    await page.locator('#btn-align-business-object').click();
    await expect(page.getByRole('heading', { name: '业务对象对齐' })).toBeVisible();
    await expect(page.getByText(/对齐任务 task_align_asset-1/).first()).toBeVisible();
    // 资产身份显示目录规范 ID（不是语义 ID）
    await expect(page.getByText('asset-1', { exact: true }).first()).toBeVisible();
    await page.locator('#bo-option-bo_service_ticket').click();
    await page.getByRole('button', { name: /确认对齐“服务工单”/ }).click();
    // 幂等：同一资产已承载本对象，不重复建绑定，任务仍闭环
    await expect(page.getByText('数据支撑已存在')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#btn-align-business-object')).toBeVisible({ timeout: 15_000 });

    store = await readStore(page);
    expect(Object.values(store.implementations).filter((impl) => impl.assetId === 'asset-1').map((impl) => impl.id)).toEqual([
      'impl_st_hotline'
    ]);
    // 语义 ID / 旧资源 ID 绝不作为资产身份落库
    expect(Object.values(store.implementations).filter((impl) => impl.assetId === 'sem_hotline_ticket')).toHaveLength(0);
    expect(Object.values(store.implementations).filter((impl) => impl.assetId === 'res-02')).toHaveLength(0);
    const assetTask = store.taskContexts['task_align_asset-1'];
    expect(assetTask?.status).toBe('COMPLETED');
    expect(assetTask?.dataAsset?.id).toBe('asset-1');
    expect(assetTask?.semanticSource).toBeUndefined();
  });

  test('EDGE-3: Bottom-up 创建新对象 —— 发布后自动对齐并返回数据语义原上下文，不停留在对象详情', async ({ page }) => {
    test.setTimeout(150_000);
    await startFromSeed(page);

    // 数据语义入口 → 对齐工作台 → 创建新业务对象（携带任务上下文）
    await enterResolutionFromSemantics(page);
    await page.locator('#btn-create-new-object').click();
    await expect(page.locator('#bo-authoring-container')).toBeVisible();

    // 独立创建评估
    await page.locator('#input-bo-name').fill('热线坐席');
    await expect(page.locator('#existing-object-card')).toBeVisible();
    await page.locator('#btn-toggle-define-independent').click();
    await page.getByPlaceholder('请说明核心业务区别...').fill('限定语音热线专属排班技能体系，沉淀独立业务指标。');
    await page.getByRole('button', { name: '提交 Semovix 重新评估' }).click();
    await expect(page.getByText('Semovix 评估认可独立业务对象身份')).toBeVisible({ timeout: 10_000 });

    // 同一份草稿：保存 → 发布
    await page.locator('#btn-bo-save-draft').click();
    await expect(page.getByText('草稿保存成功')).toBeVisible();
    await page.locator('#btn-bo-publish').click();
    await expect(page.getByText('确认发布业务对象')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();

    // §6B：发布后按 returnRoute 返回数据语义详情（禁止停留在新对象详情）
    await expect(page.getByText('已对齐业务对象：热线坐席')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();

    const store = await readStore(page);
    const created = Object.values(store.objects).find((object) => object.name === '热线坐席');
    expect(created?.currentRevision).toBe('R1');
    // 任务在同一事务内闭环，来源资产身份保持规范 ID
    const task = store.taskContexts['task_form_sem_hotline_ticket'];
    expect(task?.status).toBe('COMPLETED');
    expect(task?.dataAsset?.id).toBe('asset-1');
    // 新对象获得 asset-1 的直接生效绑定（PRIMARY，不经过候选期）
    const createdImpls = Object.values(store.implementations).filter(
      (impl) => impl.businessObjectId === created?.id && impl.assetId === 'asset-1'
    );
    expect(createdImpls).toHaveLength(1);
    const binding = Object.values(store.bindings).find((item) => item.implementationId === createdImpls[0].id);
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('PRIMARY');
    const actions = Object.values(store.dataSupportRevisions)
      .filter((revision) => revision.businessObjectId === created?.id)
      .map((revision) => revision.action);
    expect(actions).toContain('BOTTOM_UP_ALIGN');
  });

  test('EDGE-4: Bottom-up 复用 —— 不建新对象、不改正式定义、不静默加别名，任务完成并返回来源', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 数据语义入口 → 对齐工作台 → 创建新业务对象（复用判断在创建工作台完成）
    await enterResolutionFromSemantics(page);
    await page.locator('#btn-create-new-object').click();
    await expect(page.locator('#bo-authoring-container')).toBeVisible();

    // 复用前快照：正式对象集合（复用 = 不修改定义，Inv09）
    const before = await readStore(page);

    // 选择复用「客服坐席」
    await page.locator('#btn-reuse-existing-bo').click();
    await page.getByRole('button', { name: '确认复用「客服坐席」' }).click();

    // §6C：复用闭环后返回来源上下文（不去被复用对象详情页）
    await expect(page.getByText('已对齐业务对象：客服坐席')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('形成业务对象')).toBeVisible();

    const after = await readStore(page);
    // 未创建新对象：正式对象集合与复用前完全一致
    expect(after.objects).toEqual(before.objects);
    expect(Object.values(after.objects).find((object) => object.name === '热线坐席')).toBeUndefined();
    // 不修改被复用对象的正式定义、不静默追加别名
    const agent = after.objects.bo_customer_agent;
    expect(agent.definition).toBe('表示承担客户咨询、受理和服务处理职责的业务主体。');
    expect(agent.aliases).toEqual(['客户服务坐席', '服务坐席']);
    expect(agent.aliases).not.toContain('热线坐席');
    expect(agent.currentRevision).toBe('R1');
    // 来源数据资产对齐到被复用对象，任务闭环
    const task = after.taskContexts['task_form_sem_hotline_ticket'];
    expect(task?.status).toBe('COMPLETED');
    const agentImpls = Object.values(after.implementations).filter(
      (impl) => impl.businessObjectId === 'bo_customer_agent' && impl.assetId === 'asset-1'
    );
    expect(agentImpls).toHaveLength(1);
    const binding = Object.values(after.bindings).find((item) => item.implementationId === agentImpls[0].id);
    expect(binding?.status).toBe('EFFECTIVE');
    expect(binding?.role).toBe('SECONDARY');
  });

  test('EDGE-5: NEEDS_REVALIDATION 视为当前绑定 —— 待复核主实现仍占 PRIMARY 唯一位，切主后降级不产生双主', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 先确认热线候选（真实写入落盘）：服务工单拥有 主实现 + 热线实现 两项当前支撑
    await confirmHotlineCandidate(page);

    // 模拟语义修订把主实现（客服工单当前视图）标记为待复核
    await markBindingForRevalidation(page, 'bind_st_curr_view', 'S6');

    // 待复核绑定仍是当前数据支撑（Inv05）：实现仍在支撑视图，且出现复核入口
    await openDetail(page, 'bo_service_ticket');
    await expect(page.getByText('1 项数据支撑待复核')).toBeVisible();
    await expect(page.getByRole('button', { name: '客服工单当前视图' })).toBeVisible();
    await expect(page.locator('#btn-handle-revalidation')).toBeVisible();

    // 待复核主实现不能被旁路产生双主：切到热线实现（侧栏「全部数据实现」入口）→ 设为主要数据实现
    await page.locator('div.cursor-pointer', { hasText: '公共服务热线工单记录表' }).click();
    await page.locator('button[title="更多操作"]').last().click();
    await page.getByText('设为主要数据实现', { exact: true }).click();
    await page.getByRole('button', { name: '确认设为主要数据实现' }).click();
    await expect(page.getByText('已更新主要数据实现')).toBeVisible({ timeout: 15_000 });

    let store = await readStore(page);
    expect(store.bindings.bind_st_hotline.role).toBe('PRIMARY');
    expect(store.bindings.bind_st_hotline.status).toBe('EFFECTIVE');
    // 原主实现自动降级为其他实现，但仍处于待复核的当前绑定（不因降级退出当前支撑）
    expect(store.bindings.bind_st_curr_view.role).toBe('SECONDARY');
    expect(store.bindings.bind_st_curr_view.status).toBe('NEEDS_REVALIDATION');
    // PRIMARY 唯一性（含 NEEDS_REVALIDATION）：当前绑定中恰有一条 PRIMARY
    const primaries = Object.values(store.bindings).filter(
      (binding) =>
        binding.businessObjectId === 'bo_service_ticket' &&
        (binding.status === 'EFFECTIVE' || binding.status === 'NEEDS_REVALIDATION') &&
        binding.role === 'PRIMARY'
    );
    expect(primaries.map((binding) => binding.id)).toEqual(['bind_st_hotline']);
    // 切主只写数据支撑修订，不产生业务对象修订
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
    const actions = Object.values(store.dataSupportRevisions)
      .filter((revision) => revision.businessObjectId === 'bo_service_ticket')
      .map((revision) => revision.action);
    expect(actions).toContain('SET_PRIMARY');

    // 待复核实现不能再被设为主要（避免绕过复核产生双主）
    await page.locator('div.cursor-pointer', { hasText: '客服工单当前视图' }).click();
    await page.locator('button[title="更多操作"]').last().click();
    await expect(page.getByText('待复核实现需先完成复核')).toBeVisible();

    // 完成复核：恢复生效，主要实现保持唯一
    await page.locator('#btn-handle-revalidation').click();
    await expect(page.getByText('1 项待复核')).toBeVisible();
    await page.getByRole('button', { name: /确认继续使用/ }).click();
    await expect(page.getByText('没有待复核的数据支撑', { exact: true })).toBeVisible();

    store = await readStore(page);
    expect(store.bindings.bind_st_curr_view.status).toBe('EFFECTIVE');
    expect(store.bindings.bind_st_curr_view.role).toBe('SECONDARY');
    expect(store.bindings.bind_st_hotline.role).toBe('PRIMARY');
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
  });

  test('EDGE-6: NEEDS_REVALIDATION 下的资产冲突 —— 待复核绑定仍占用资产，跨对象对齐被拦截且零写入', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 确认热线候选后，模拟语义修订把热线绑定标记为待复核（资产 asset-1 仍被服务工单占用）
    await confirmHotlineCandidate(page);
    await markBindingForRevalidation(page, 'bind_st_hotline', 'S7');

    // 从数据资产目录（治理面）对 asset-1 发起对齐 → 选择自然人
    await openHotlineGovernanceAssetDetail(page);
    await page.locator('#btn-align-business-object').click();
    await expect(page.getByRole('heading', { name: '业务对象对齐' })).toBeVisible();
    await page.locator('#bo-option-bo_person').click();
    await page.getByRole('button', { name: /确认对齐“自然人”/ }).click();

    // §7 冲突话术：待复核（NEEDS_REVALIDATION）同样视为占用，不允许跨对象改写
    await expect(page.getByText('对齐未生效')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/该数据当前已作为“服务工单”的数据实现/)).toBeVisible();
    // 冲突后停留在对齐工作台（不返回、不导航）
    await expect(page.getByRole('heading', { name: '业务对象对齐' })).toBeVisible();

    const store = await readStore(page);
    // 零写入：未给自然人登记 asset-1 实现，绑定未被改写，任务未闭环
    expect(
      Object.values(store.implementations).filter((impl) => impl.businessObjectId === 'bo_person' && impl.assetId === 'asset-1')
    ).toHaveLength(0);
    expect(store.bindings.bind_st_hotline.status).toBe('NEEDS_REVALIDATION');
    expect(store.bindings.bind_st_hotline.businessObjectId).toBe('bo_service_ticket');
    expect(store.taskContexts['task_align_asset-1'].status).toBe('OPEN');
    expect(Object.values(store.dataSupportRevisions).filter((revision) => revision.businessObjectId === 'bo_person')).toHaveLength(0);
  });

  test('EDGE-7: 同一关系连续修正 —— 同一 targetKey 至多一条 ACTIVE，上一条归档为 HISTORY', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);
    await openDetail(page, 'bo_service_ticket');

    // 第一次修正：申请人 → 自然人 落到 person_id
    await page.locator('#btn-correct-rel-0').click();
    const drawer = page.locator('#local-grounding-correction-drawer');
    await expect(drawer).toBeVisible();
    await page.getByText(/自然人在工单记录中的主体标识字段/).click();
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);
    await expect(page.getByText('客服工单当前视图 · person_id').first()).toBeVisible();

    let store = await readStore(page);
    let relRevisions = Object.values(store.groundingRevisions).filter((revision) => revision.type === 'RELATIONSHIP');
    expect(relRevisions).toHaveLength(1);
    expect(relRevisions[0].targetKey).toBe('RELATIONSHIP:rel_st_applicant');
    expect(relRevisions[0].targetId).toBe('rel_st_applicant');
    expect(relRevisions[0].status).toBe('ACTIVE');

    // 第二次修正（同一目标）：改回 applicant_id（候选语义取 .last()：预览卡与候选段落都含该文案）
    await page.locator('#btn-correct-rel-0').click();
    await expect(drawer).toBeVisible();
    await page.getByText(/指向自然人主体标识的工单申请人字段/).last().click();
    await page.locator('#btn-confirm-correction').click();
    await expect(page.locator('#local-grounding-correction-drawer')).toHaveCount(0);
    await expect(page.getByText('客服工单当前视图 · applicant_id').first()).toBeVisible();

    store = await readStore(page);
    relRevisions = Object.values(store.groundingRevisions).filter((revision) => revision.type === 'RELATIONSHIP');
    // 连续修正不堆积 ACTIVE：同 targetKey 两条修订，第一条 HISTORY、第二条 ACTIVE
    expect(relRevisions).toHaveLength(2);
    expect(relRevisions.every((revision) => revision.targetKey === 'RELATIONSHIP:rel_st_applicant')).toBe(true);
    expect(relRevisions.filter((revision) => revision.status === 'ACTIVE')).toHaveLength(1);
    expect(relRevisions.filter((revision) => revision.status === 'HISTORY')).toHaveLength(1);
    // Grounding 修正不触碰业务对象修订与数据支撑修订
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R1');
    const ticketRevisions = Object.values(store.revisions).filter((revision) => revision.businessObjectId === 'bo_service_ticket');
    expect(ticketRevisions).toHaveLength(1);
    expect(Object.keys(store.dataSupportRevisions)).toHaveLength(0);
  });

  test('EDGE-8: 同一份草稿 —— 两次保存复用同一 draftId，发布同一份草稿且无 WORKING 残留', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // 服务工单 → 修改工作台（恢复种子演示 CHANGE 草稿 bodraft_st_change_demo）
    await openObjectsList(page);
    await page.locator('#bo-name-bo_service_ticket').click();
    await expect(page.getByRole('heading', { name: '服务工单' })).toBeVisible();
    await page.locator('#btn-change-business-object').click();
    await expect(page.getByText(/当前正式版本 R1 仍在生效/)).toBeVisible();

    // 第一次编辑 → 保存草稿（种子 WORKING 草稿恢复后页面常驻「草稿已保存」状态条 + Toast，取 .first()）
    await page.locator('#input-business-definition').fill(
      '企业和政府部门面向公众受理、流转与办结服务诉求的正式业务记录，覆盖热线与线上全渠道。'
    );
    await page.locator('#btn-save-draft').click();
    await expect(page.getByText('草稿已保存').first()).toBeVisible();

    // 第二次编辑 → 再次保存（应复用同一 draftId，不产生第二份草稿）
    await page.locator('#input-business-definition').fill(
      '企业和政府部门面向公众受理、流转与办结服务诉求的正式业务记录，覆盖热线、线上与政务专线三渠道。'
    );
    await page.locator('#btn-save-draft').click();
    await expect(page.getByText('草稿已保存').first()).toBeVisible();

    let store = await readStore(page);
    // §10：同一对象 / 模式只有一份 WORKING 草稿 —— 保存两次仍是种子演示草稿本身
    expect(Object.keys(store.drafts)).toEqual(['bodraft_st_change_demo']);
    expect(store.drafts['bodraft_st_change_demo'].status).toBe('WORKING');
    expect(store.drafts['bodraft_st_change_demo'].content.definition).toContain('政务专线三渠道');

    // 发布：发布的是这份草稿（第二次编辑内容生效），不另建草稿
    await page.locator('#btn-publish-change').click();
    await expect(page.getByText('确认发布业务对象修改')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();
    await expect(page.getByRole('heading', { name: '服务工单' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('政务专线三渠道').first()).toBeVisible();

    store = await readStore(page);
    expect(Object.keys(store.drafts)).toEqual(['bodraft_st_change_demo']);
    expect(store.drafts['bodraft_st_change_demo'].status).toBe('PUBLISHED');
    expect(store.objects.bo_service_ticket.currentRevision).toBe('R2');
    expect(store.objects.bo_service_ticket.definition).toContain('政务专线三渠道');
  });

  test('EDGE-9: 消费面 / 治理面边界 —— Marketplace 无治理操作，Governance 无消费操作', async ({ page }) => {
    test.setTimeout(120_000);
    await startFromSeed(page);

    // —— 消费面（MARKETPLACE）：数据服务超市 → 资源卡片 → 资产详情
    await page.getByRole('button', { name: '数据服务超市' }).click();
    await expect(page.getByText('人口基本信息视图').first()).toBeVisible();
    await page.getByText('人口基本信息视图').first().click();
    await expect(page.locator('#btn-align-business-object')).toHaveCount(0);

    // 消费面显示「我的申请」入口
    await expect(page.getByText('我的申请', { exact: true }).first()).toBeVisible();
    // 消费面不显示治理操作（对齐业务对象 / 修正数据语义）
    await expect(page.getByText('对齐业务对象')).toHaveCount(0);
    await expect(page.getByText('修正数据语义')).toHaveCount(0);
    await expect(page.getByText('进入分析')).toHaveCount(0);
    await expect(page.getByText('用于问数')).toHaveCount(0);

    // —— 治理面（GOVERNANCE）：数据治理 → 语义资产目录 → 热线表资产详情
    await openHotlineGovernanceAssetDetail(page);

    // 治理面显示「对齐业务对象」，不显示消费面操作（我的申请 / 进入分析 / 用于问数）
    await expect(page.locator('#btn-align-business-object')).toBeVisible();
    await expect(page.getByText('我的申请')).toHaveCount(0);
    await expect(page.getByText('进入分析')).toHaveCount(0);
    await expect(page.getByText('用于问数')).toHaveCount(0);
  });
});
