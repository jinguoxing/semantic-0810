import { expect, test, type Page } from '@playwright/test';

/**
 * Business Object V2.2 Final Freeze Blockers E2E（FF-01 … FF-11）
 *
 * BO-FZ-01 数据资产详情数据驱动 + Surface 分离：
 * - FF-01 / FF-02 两份资产详情内容完全由目录身份 + 补充数据驱动（工单事实 vs 人口事实，页面完全不同）；
 * - FF-03 / FF-04 操作面矩阵：GOVERNANCE 只有治理操作，MARKETPLACE 只有消费操作；
 * - FF-05 资源浏览（超市资源 ID 命名空间）→ 资产详情 = MARKETPLACE 且呈 asset-2 人口内容；
 * - FF-06 业务对象详情 · 数据支撑 → 资产详情 = GOVERNANCE；
 * - FF-07 / FF-08 无效 assetId / businessObjectId 如实 Not Found，绝不回退演示对象。
 *
 * BO-FZ-02 统一 Bottom-up Continuation Result：
 * - FF-09 Create 冲突：对象已发布但来源数据 BINDING_CONFLICT → 无成功回调、任务保持 OPEN、部分成功面板；
 * - FF-10 Reuse 冲突：立即停止，不复用、不回调、不改正式定义；
 * - FF-11 成功：绑定 EFFECTIVE + 任务 COMPLETED 才触发 onResolutionCompleted 并按原路径返回。
 *
 * 领域状态持久化在 localStorage（semovix_business_object_state_v1），
 * 每条用例在独立 Browser Context 中运行，默认从种子状态出发；
 * 冲突场景通过真实 UI 先落一条 EFFECTIVE 承载关系（确认热线候选）再发起对齐，不直接改写 localStorage。
 */

const STORE_KEY = 'semovix_business_object_state_v1';

interface PersistedState {
  version: number;
  objects: Record<string, { id: string; name: string; currentRevision: string; aliases: string[]; definition: string }>;
  implementations: Record<string, { id: string; businessObjectId: string; assetId: string; name: string }>;
  bindings: Record<string, { id: string; businessObjectId: string; implementationId: string; status: string; role: string; revision: string }>;
  taskContexts: Record<string, {
    taskId: string;
    status: string;
    returnRoute: string;
    dataAsset?: { id: string; name: string };
  }>;
}

/** 进入应用并确保领域 Store 从种子状态出发 */
async function startFromSeed(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.removeItem(key), STORE_KEY);
  await page.reload();
  await expect(page.getByText('Semovix', { exact: true }).first()).toBeVisible();
}

/** 读取持久化的领域 Store */
async function readStore(page: Page): Promise<PersistedState> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORE_KEY);
}

/** 顶栏「数据治理」→ StageHeader「语义资产」→ 数据资产全景目录 */
async function openAssetsCatalog(page: Page) {
  await page.getByRole('button', { name: '数据治理' }).click();
  await page.getByText('语义资产', { exact: true }).first().click();
  await expect(page.getByText('公共服务热线工单记录表').first()).toBeVisible();
}

/** 目录行 → 指定资产的治理面详情（§12：目录入口展示治理操作） */
async function openGovernanceAssetDetailByName(page: Page, assetName: string) {
  await openAssetsCatalog(page);
  await page.locator('span.font-bold.cursor-pointer', { hasText: assetName }).first().click();
  await expect(page.locator('#btn-align-business-object')).toBeVisible();
}

/** 服务工单详情 → 发现数据支撑 → 确认候选（真实领域写入：asset-1 生效承载 bo_service_ticket） */
async function confirmHotlineCandidate(page: Page) {
  await page.getByText('业务语义', { exact: true }).first().click();
  await page.getByText('业务对象', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: '新建业务对象' })).toBeVisible();
  await page.locator('#bo-data-support-bo_service_ticket').click();
  await expect(page.locator('#tab-data-support')).toBeVisible();
  await page.getByText('发现更多数据支撑').first().click();
  await expect(page.getByRole('heading', { name: '发现数据支撑' })).toBeVisible();
  await page.locator('#btn-confirm-data-support').click();
  await expect(page.getByText('候选已确认生效').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '查看当前数据支撑' }).first().click();
  await expect(page.locator('#tab-data-support')).toBeVisible({ timeout: 15_000 });
}

/** 治理面资产详情 → 对齐业务对象 → 对齐工作台 → 创建新对象（携带 Bottom-up 任务上下文） */
async function enterAuthoringFromAssetDetail(page: Page, assetName: string, expectedTaskAssetId: string) {
  await openGovernanceAssetDetailByName(page, assetName);
  await page.locator('#btn-align-business-object').click();
  await expect(page.getByRole('heading', { name: '业务对象对齐' })).toBeVisible();
  await page.locator('#btn-create-new-object').click();
  await expect(page.locator('#bo-authoring-container')).toBeVisible();
  const store = await readStore(page);
  const task = store.taskContexts[`task_align_${expectedTaskAssetId}`];
  expect(task?.status).toBe('OPEN');
  expect(task?.dataAsset?.id).toBe(expectedTaskAssetId);
  return `task_align_${expectedTaskAssetId}`;
}

test.describe('BO-FZ-01 数据资产详情数据驱动 + Surface 分离', () => {
  test('FF-01: asset-1 治理面详情 = 热线工单事实（目录身份 + 工单字段 + 服务工单承载），无人口字段', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    await openGovernanceAssetDetailByName(page, '公共服务热线工单记录表');

    // 身份区全部来自统一目录：名称 / 技术名 / 技术全名 / 业务域
    await expect(page.getByRole('heading', { name: '公共服务热线工单记录表' }).first()).toBeVisible();
    await expect(page.getByText('pop_service_hotline').first()).toBeVisible();
    await expect(page.getByText('hotline_db.service.pop_service_hotline').first()).toBeVisible();
    await expect(page.getByText('公共服务 · 热线服务').first()).toBeVisible();

    // 承载的正式业务对象由目录 businessObjectId 驱动：服务工单 / bo_service_ticket
    await expect(page.getByText('当前业务对象状态')).toBeVisible();
    await expect(page.getByText('服务工单', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('bo_service_ticket').first()).toBeVisible();

    // 主体 / 粒度 / 身份标识（补充数据）
    await expect(page.getByText('一行一张服务工单').first()).toBeVisible();
    await expect(page.getByText('ticket_id（工单编号）').first()).toBeVisible();

    // 字段清单 = 热线工单事实：进入全部字段视图断言完整清单
    await page.getByRole('button', { name: /查看全部字段/ }).click();
    for (const fieldName of ['ticket_id', 'status', 'created_time', 'accepted_time', 'close_time', 'applicant_id', 'handler_department_id', 'region_code']) {
      await expect(page.getByText(fieldName, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('工单编号', { exact: true }).first()).toBeVisible();
    // 绝不出现人口字段（两份资产页面内容必须完全不同）
    for (const personField of ['person_id', 'person_name', 'birth_date', 'resident_status']) {
      await expect(page.getByText(personField, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText('人口基本信息')).toHaveCount(0);
  });

  test('FF-02: asset-2 治理面详情 = 人口事实（自然人承载），无任何工单字段，与 FF-01 页面完全不同', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    await openGovernanceAssetDetailByName(page, '人口基本信息');

    // 目录身份：人口库 / population.core.person_basic_info / 人口服务 · 人口基础
    await expect(page.getByRole('heading', { name: '人口基本信息' }).first()).toBeVisible();
    await expect(page.getByText('person_basic_info').first()).toBeVisible();
    await expect(page.getByText('population.core.person_basic_info').first()).toBeVisible();
    await expect(page.getByText('人口服务 · 人口基础').first()).toBeVisible();

    // 承载的正式业务对象：自然人 / bo_person
    await expect(page.getByText('当前业务对象状态')).toBeVisible();
    await expect(page.getByText('自然人', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('bo_person').first()).toBeVisible();

    // 字段清单 = 人口事实
    await page.getByRole('button', { name: /查看全部字段/ }).click();
    for (const fieldName of ['person_id', 'person_name', 'birth_date', 'age', 'gender_code', 'resident_status', 'region_code']) {
      await expect(page.getByText(fieldName, { exact: true }).first()).toBeVisible();
    }
    // 绝不出现工单字段
    for (const ticketField of ['ticket_id', 'accepted_time', 'close_time', 'handler_department_id']) {
      await expect(page.getByText(ticketField, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText('工单编号', { exact: true })).toHaveCount(0);
    await expect(page.getByText('公共服务热线工单记录表')).toHaveCount(0);
  });

  test('FF-03: GOVERNANCE 操作矩阵 —— 只有治理操作，无任何消费动作', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    await openGovernanceAssetDetailByName(page, '公共服务热线工单记录表');

    // 治理面专属：数据治理面包屑 / 返回数据资产目录 / 对齐业务对象 / 查看语义依据 / 正式身份 / 治理状态四卡 / 当前业务对象状态
    await expect(page.getByText('数据治理', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('返回数据资产目录')).toBeVisible();
    await expect(page.locator('#btn-align-business-object')).toBeVisible();
    await expect(page.getByRole('button', { name: /查看语义依据/ })).toBeVisible();
    await expect(page.getByText('正式身份')).toBeVisible();
    await expect(page.getByText('Data Semantics')).toBeVisible();
    await expect(page.getByText('Profile', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Quality', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Lineage', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('当前业务对象状态')).toBeVisible();

    // 禁止消费操作（数据服务超市动作 / 我的申请 / 申请使用 / 进入分析 / 用于问数 / 查看相关资源 / 围绕此资源找数据）
    await expect(page.getByText('我的申请')).toHaveCount(0);
    await expect(page.getByText('申请使用')).toHaveCount(0);
    await expect(page.getByText('进入分析')).toHaveCount(0);
    await expect(page.getByText('用于问数')).toHaveCount(0);
    await expect(page.getByText('查看相关资源')).toHaveCount(0);
    await expect(page.getByText(/围绕此资源找数据/)).toHaveCount(0);
    await expect(page.getByText('需申请', { exact: true })).toHaveCount(0);
    await expect(page.getByText('返回资源')).toHaveCount(0);
  });

  test('FF-04: MARKETPLACE 操作矩阵 —— 只有消费操作，无任何治理动作（超市 res-02 → asset-2 人口内容）', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    // 数据服务超市 → 人口基本信息视图（超市资源 res-02）→ 资产详情 = 消费面
    await page.getByRole('button', { name: '数据服务超市' }).click();
    await expect(page.getByText('人口基本信息视图').first()).toBeVisible();
    await page.getByText('人口基本信息视图').first().click();

    // 消费面内容 = asset-2 人口基本信息（资源命名空间换算 res-02 → asset-2，绝不串热线工单内容）
    await expect(page.getByRole('heading', { name: '人口基本信息' }).first()).toBeVisible();
    await expect(page.getByText('公共服务热线工单记录表')).toHaveCount(0);

    // 消费面专属：资源可用状态 / 我的申请 / 申请使用 / 查看相关资源 / 围绕此资源找数据
    await expect(page.getByText('需申请', { exact: true })).toBeVisible();
    await expect(page.getByText('我的申请', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '申请使用', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '查看相关资源', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /围绕此资源找数据/ })).toBeVisible();

    // 禁止治理操作（对齐业务对象 / 查看语义依据 / 正式身份 / 当前业务对象状态 / 返回数据资产目录 / 治理动作文案）
    await expect(page.locator('#btn-align-business-object')).toHaveCount(0);
    await expect(page.getByText('对齐业务对象')).toHaveCount(0);
    await expect(page.getByText('查看语义依据')).toHaveCount(0);
    await expect(page.getByText('正式身份')).toHaveCount(0);
    await expect(page.getByText('当前业务对象状态')).toHaveCount(0);
    await expect(page.getByText('返回数据资产目录')).toHaveCount(0);
    await expect(page.getByText('修改数据语义')).toHaveCount(0);
    await expect(page.getByText(/Grounding/)).toHaveCount(0);
    await expect(page.getByText('治理任务')).toHaveCount(0);
  });

  test('FF-05: 资源浏览（ResourceExplorer）→ 查看资产详情 = MARKETPLACE 消费面', async ({ page }) => {
    test.setTimeout(90_000);
    await startFromSeed(page);

    // 数据服务超市 → 浏览全部资源（ResourceExplorer）→ 人口基本信息视图资源 → 预览 → 查看资产详情
    await page.getByRole('button', { name: '数据服务超市' }).click();
    await page.getByRole('button', { name: /浏览全部资源/ }).click();
    await expect(page.getByText('人口基本信息视图').first()).toBeVisible();
    await page.getByText('人口基本信息视图').first().click();
    await expect(page.getByRole('button', { name: '查看资产详情' })).toBeVisible();
    await page.getByRole('button', { name: '查看资产详情' }).click();

    // 消费面：资源可用状态 + 我的申请；内容为 asset-2 人口基本信息
    await expect(page.getByText('需申请', { exact: true })).toBeVisible();
    await expect(page.getByText('我的申请', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '人口基本信息' }).first()).toBeVisible();

    // 绝不出现治理操作
    await expect(page.locator('#btn-align-business-object')).toHaveCount(0);
    await expect(page.getByText('对齐业务对象')).toHaveCount(0);
    await expect(page.getByText('返回数据资产目录')).toHaveCount(0);
  });

  test('FF-06: 业务对象详情 · 数据支撑 → 查看数据资产 = GOVERNANCE 治理面（热线表实现 → asset-1）', async ({ page }) => {
    test.setTimeout(150_000);
    await startFromSeed(page);

    // 先确认热线候选（真实领域写入）：公共服务热线工单记录表进入服务工单的当前数据支撑
    await confirmHotlineCandidate(page);

    // Context Strip 实现切换器 → 公共服务热线工单记录表
    await page.locator('button', { hasText: '客服工单当前视图' }).first().click();
    await expect(page.getByText('切换查看的数据实现')).toBeVisible();
    await page.locator('div.w-80 button', { hasText: '公共服务热线工单记录表' }).first().click();
    await expect(page.getByText('已切换至「公共服务热线工单记录表」数据实现')).toBeVisible({ timeout: 10_000 });

    // 查看数据资产 → asset-1 治理面详情
    await page.getByRole('button', { name: '查看数据资产' }).click();
    await expect(page.locator('#btn-align-business-object')).toBeVisible();
    await expect(page.getByRole('heading', { name: '公共服务热线工单记录表' }).first()).toBeVisible();
    await expect(page.getByText('返回数据资产目录')).toBeVisible();
    await expect(page.getByText('当前业务对象状态')).toBeVisible();

    // 治理面不显示任何消费操作
    await expect(page.getByText('我的申请')).toHaveCount(0);
    await expect(page.getByText('进入分析')).toHaveCount(0);
    await expect(page.getByText('用于问数')).toHaveCount(0);
    await expect(page.getByText('需申请', { exact: true })).toHaveCount(0);
  });

  test('FF-07: 未知 assetId 深链 → 数据资产 Not Found，绝不回退演示资产', async ({ page }) => {
    test.setTimeout(60_000);
    await startFromSeed(page);

    await page.goto('/?asset=asset_unknown_42&surface=GOVERNANCE');

    await expect(page.getByText('数据资产不存在或已不可用')).toBeVisible();
    await expect(page.getByText(/资产标识：asset_unknown_42/)).toBeVisible();
    await expect(page.locator('#btn-back-asset-catalog')).toBeVisible();
    await expect(page.locator('#btn-back-from-asset-not-found')).toBeVisible();

    // 禁止回退任何演示资产内容
    await expect(page.getByText('人口基本信息')).toHaveCount(0);
    await expect(page.getByText('公共服务热线工单记录表')).toHaveCount(0);
    await expect(page.locator('#btn-align-business-object')).toHaveCount(0);
  });

  test('FF-08: 未知 businessObjectId 深链 → 业务对象 Not Found，绝不静默展示服务工单', async ({ page }) => {
    test.setTimeout(60_000);
    await startFromSeed(page);

    await page.goto('/?bo=bo_unknown_42');

    await expect(page.getByText('未找到业务对象')).toBeVisible();
    await expect(page.getByText(/对象标识：bo_unknown_42/)).toBeVisible();
    await expect(page.locator('#btn-back-objects-not-found')).toBeVisible();

    // 禁止静默回退演示「服务工单」内容
    await expect(page.getByText('服务工单')).toHaveCount(0);
    await expect(page.getByText('主体标识：工单编号')).toHaveCount(0);
  });
});

test.describe('BO-FZ-02 统一 Bottom-up Continuation Result', () => {
  test('FF-09: Create 冲突 —— 对象已发布但来源数据 BINDING_CONFLICT → 无成功回调，任务保持 OPEN，部分成功面板', async ({ page }) => {
    test.setTimeout(180_000);
    await startFromSeed(page);

    // 冲突构造（真实 UI 写入）：确认热线候选后 asset-1 已 EFFECTIVE 承载「服务工单」
    await confirmHotlineCandidate(page);

    // 治理面资产详情 → 对齐业务对象 → 创建新对象（task_align_asset-1，OPEN）
    const taskId = await enterAuthoringFromAssetDetail(page, '公共服务热线工单记录表', 'asset-1');

    // 独立创建评估 → 保存 → 发布
    await page.locator('#input-bo-name').fill('热线坐席');
    await expect(page.locator('#existing-object-card')).toBeVisible();
    await page.locator('#btn-toggle-define-independent').click();
    await page.getByPlaceholder('请说明核心业务区别...').fill('限定语音热线专属排班技能体系，沉淀独立业务指标。');
    await page.getByRole('button', { name: '提交 Semovix 重新评估' }).click();
    await expect(page.getByText('Semovix 评估认可独立业务对象身份')).toBeVisible({ timeout: 10_000 });
    await page.locator('#btn-bo-save-draft').click();
    await expect(page.getByText('草稿保存成功')).toBeVisible();
    await page.locator('#btn-bo-publish').click();
    await expect(page.getByText('确认发布业务对象')).toBeVisible();
    await page.locator('#btn-confirm-publish').click();

    // 部分成功面板：对象已发布 + 对齐失败原因（冲突对象 = 服务工单）+ Task 保持未完成 + 已发布事实不回滚
    const panel = page.locator('#bo-continuation-failure-panel');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText('业务对象已发布，但来源数据尚未完成对齐')).toBeVisible();
    await expect(panel.getByText(/已发布对象：/)).toBeVisible();
    await expect(panel.getByText('热线坐席')).toBeVisible();
    await expect(panel.getByText(/对齐失败原因：/)).toBeVisible();
    await expect(panel.getByText(/数据已承载其他对象：.*「服务工单」/)).toBeVisible();
    await expect(panel.getByText(new RegExp(`任务 ${taskId} 保持未完成`))).toBeVisible();
    await expect(panel.getByText(/已发布事实不会回滚/)).toBeVisible();

    // 后续动作：重试数据对齐 / 返回对齐任务 / 查看已发布对象（不重新发布）
    await expect(page.locator('#btn-retry-continuation')).toBeVisible();
    await expect(page.locator('#btn-back-to-resolution-task')).toBeVisible();
    await expect(page.locator('#btn-view-published-object')).toBeVisible();

    // 禁止成功闭环：无成功 Toast、未按原路径返回资产详情
    await expect(page.getByText('已对齐业务对象', { exact: false })).toHaveCount(0);
    await expect(page.getByText('业务对象已发布，来源数据已完成对齐')).toHaveCount(0);
    await expect(page.locator('#btn-align-business-object')).toHaveCount(0);

    // 领域事实：新对象已发布不回滚（R1）；任务保持 OPEN；冲突零写入（asset-1 实现仍全部归属服务工单）
    const store = await readStore(page);
    const created = Object.values(store.objects).find((object) => object.name === '热线坐席');
    expect(created?.currentRevision).toBe('R1');
    expect(store.taskContexts[taskId]?.status).toBe('OPEN');
    const asset1Impls = Object.values(store.implementations).filter((impl) => impl.assetId === 'asset-1');
    expect(asset1Impls.length).toBeGreaterThan(0);
    expect(asset1Impls.every((impl) => impl.businessObjectId === 'bo_service_ticket')).toBe(true);
  });

  test('FF-10: Reuse 冲突 —— 立即停止：不复用、不回调、不改「客服坐席」定义，留在判断上下文', async ({ page }) => {
    test.setTimeout(180_000);
    await startFromSeed(page);

    // 冲突构造（真实 UI 写入）：确认热线候选后 asset-1 已 EFFECTIVE 承载「服务工单」
    await confirmHotlineCandidate(page);

    // 治理面资产详情 → 对齐 → 创建工作台（复用判断在创建工作台完成）
    const taskId = await enterAuthoringFromAssetDetail(page, '公共服务热线工单记录表', 'asset-1');
    const before = await readStore(page);

    // 选择复用「客服坐席」→ 来源数据与「服务工单」冲突 → 立即失败
    await page.locator('#btn-reuse-existing-bo').click();
    await page.getByRole('button', { name: '确认复用「客服坐席」' }).click();

    // 失败提示：已选择复用对象，但来源数据未完成对齐；任务保持未完成
    const callout = page.locator('#bo-reuse-continuation-failure');
    await expect(callout).toBeVisible({ timeout: 15_000 });
    await expect(callout.getByText('已选择复用对象，但来源数据未完成对齐')).toBeVisible();
    await expect(callout.getByText(/未完成对象复用/)).toBeVisible();
    await expect(callout.getByText(new RegExp(`任务 ${taskId} 保持未完成`))).toBeVisible();

    // 留在判断上下文：复用判断卡片仍在，可重新发起；未跳转被复用对象详情 / 来源资产
    await expect(page.locator('#existing-object-card')).toBeVisible();
    await expect(page.getByText('已确认复用正式对象「客服坐席」')).toHaveCount(0);

    // 禁止成功闭环：无成功 Toast（不复用 / 不对齐）
    await expect(page.getByText(/已复用现有业务对象/)).toHaveCount(0);
    await expect(page.getByText(/来源数据已对齐到已有对象/)).toHaveCount(0);
    await expect(page.getByText(/已对齐业务对象/)).toHaveCount(0);

    // 领域事实：正式对象集合零改动（定义 / 别名不被改写），任务保持 OPEN，冲突零写入
    const after = await readStore(page);
    expect(after.objects).toEqual(before.objects);
    expect(after.objects.bo_customer_agent.definition).toBe('表示承担客户咨询、受理和服务处理职责的业务主体。');
    expect(after.objects.bo_customer_agent.aliases).toEqual(['客户服务坐席', '服务坐席']);
    expect(after.objects.bo_customer_agent.aliases).not.toContain('热线坐席');
    expect(after.taskContexts[taskId]?.status).toBe('OPEN');
    const reuseImpls = Object.values(after.implementations).filter(
      (impl) => impl.businessObjectId === 'bo_customer_agent' && impl.assetId === 'asset-1'
    );
    expect(reuseImpls).toHaveLength(0);
  });

  test('FF-11: Reuse 成功 —— 绑定 EFFECTIVE + 任务 COMPLETED 才回调，并按原路径返回资产治理面详情', async ({ page }) => {
    test.setTimeout(150_000);
    await startFromSeed(page);

    // 人口基本信息（asset-2，种子中无任何 EFFECTIVE 承载）→ 对齐 → 创建工作台 → 复用「客服坐席」
    const taskId = await enterAuthoringFromAssetDetail(page, '人口基本信息', 'asset-2');
    const objectsBefore = (await readStore(page)).objects;

    await page.locator('#btn-reuse-existing-bo').click();
    await page.getByRole('button', { name: '确认复用「客服坐席」' }).click();

    // 唯一成功出口：任务 COMPLETED → 成功 Toast → 按 returnRoute 返回资产治理面详情
    await expect(page.getByText('已对齐业务对象：客服坐席')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#btn-align-business-object')).toBeVisible();
    await expect(page.getByRole('heading', { name: '人口基本信息' }).first()).toBeVisible();
    await expect(page.getByText('返回数据资产目录')).toBeVisible();

    // 领域事实：任务闭环 + 绑定生效 + 不建新对象、不改正式定义
    const store = await readStore(page);
    expect(store.taskContexts[taskId]?.status).toBe('COMPLETED');
    expect(store.taskContexts[taskId]?.returnRoute).toBe('asset_detail');
    expect(Object.keys(store.objects).length).toBe(Object.keys(objectsBefore).length);
    expect(store.objects.bo_customer_agent.definition).toBe('表示承担客户咨询、受理和服务处理职责的业务主体。');
    const reuseImpls = Object.values(store.implementations).filter(
      (impl) => impl.businessObjectId === 'bo_customer_agent' && impl.assetId === 'asset-2'
    );
    expect(reuseImpls).toHaveLength(1);
    const binding = Object.values(store.bindings).find((item) => item.implementationId === reuseImpls[0].id);
    expect(binding?.status).toBe('EFFECTIVE');
    // 客服坐席已有生效主实现（客服坐席全量）→ 新数据支撑按规则落为「其他数据实现」
    expect(binding?.role).toBe('SECONDARY');
  });
});
