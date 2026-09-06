import { expect, test } from '@playwright/test';

const goal = '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。';

async function captureQaState(page: import('@playwright/test').Page, name: string) {
  if (process.env.CAPTURE_FIND_DATA_QA !== '1') return;
  await page.screenshot({ path: `docs/find-data/qa/${name}.png`, fullPage: false });
}

async function startGoal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '找数据' }).click();
  const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
  await homeInput.fill(goal);
  await homeInput.press('Enter');
  await expect(page.getByText('已形成 2 项核心资源').last()).toBeVisible();
  return page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
}

test.describe('Find Data inline mock smoke', () => {
  test('E2E-A: selects a population detail candidate, confirms an analysis, and receives a result in conversation', async ({ page }) => {
    test.setTimeout(90_000);
    const taskInput = await startGoal(page);

    await taskInput.fill('我还想看人口明细');
    await taskInput.press('Enter');
    await expect(page.getByText('人口明细候选')).toBeVisible();
    await expect(page.getByRole('heading', { name: '资源选型对比' })).toHaveCount(0);
    const monthlySnapshot = page.getByRole('radio', { name: '常住人口月度快照' });
    await monthlySnapshot.check();
    await captureQaState(page, 'inline-candidate-selection');
    await page.getByRole('button', { name: '将所选资源加入方案' }).click();
    await expect(page.getByText(/已将「常住人口月度快照」加入方案/)).toBeVisible();
    await expect(page.getByText(/「人口基本信息视图」仍保留在候选中/)).toBeVisible();

    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await expect(page.getByRole('button', { name: '校验执行权限' })).toBeVisible();
    await expect(page.getByText(/当前演示实际仅返回/)).toBeVisible();
    await captureQaState(page, 'inline-analysis-confirmation');
    await page.getByRole('button', { name: '校验执行权限' }).click();
    await expect(page.getByRole('button', { name: '确认并开始计算' })).toBeVisible();
    await page.getByRole('button', { name: '确认并开始计算' }).click();
    await expect(page.getByText('分析已完成，关键结果如下。')).toBeVisible();
    await captureQaState(page, 'inline-analysis-result');
    await expect(page.getByText('演示数据')).toBeVisible();
    await expect(page.getByText('浦锦街道')).toBeVisible();
    await expect(page.getByText('实际范围：上海市闵行区，2026-08，月度')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ask Data 分析计划' })).toHaveCount(0);
    const completedConfirmation = page.getByLabel('已完成的本次计算确认');
    await expect(completedConfirmation).toBeVisible();
    await expect(completedConfirmation.getByRole('button', { name: /校验执行权限|确认并开始计算/ })).toHaveCount(0);
    await completedConfirmation.getByText('查看当时确认内容').click();
    await expect(completedConfirmation.getByText(/当前演示实际仅返回/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ask Data 分析计划' })).toHaveCount(0);
    await completedConfirmation.getByText('查看当时确认内容').click();
    await completedConfirmation.scrollIntoViewIfNeeded();
    await captureQaState(page, 'completed-confirmation-and-result');
  });

  test('E2E-B: preserves the confirmed choice and historical result across a second bed-definition analysis', async ({ page }) => {
    test.setTimeout(90_000);
    const taskInput = await startGoal(page);

    await taskInput.fill('我还想看人口明细');
    await taskInput.press('Enter');
    const realtimeView = page.getByRole('radio', { name: '人口基本信息视图' });
    await realtimeView.check();
    await page.getByRole('button', { name: '详细比较' }).click();
    await expect(page.getByRole('heading', { name: '资源选型对比' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '选择 人口基本信息视图' })).toBeChecked();
    await page.getByRole('button', { name: '查看常住人口月度快照字段' }).last().click();
    await expect(page.getByRole('heading', { name: /字段检视 · 常住人口月度快照/ })).toBeVisible();
    await page.getByRole('button', { name: '返回资源比较' }).click();
    await expect(page.getByRole('radio', { name: '选择 人口基本信息视图' })).toBeChecked();
    await page.getByRole('button', { name: '将所选资源加入方案' }).last().click();
    await expect(page.getByRole('button', { name: '已加入方案' })).toBeVisible();
    await expect(realtimeView).toBeChecked();
    await expect(page.getByRole('radio', { name: '常住人口月度快照' })).not.toBeChecked();
    await captureQaState(page, 'right-confirmed-non-default-selection');
    await page.getByRole('button', { name: '详细比较' }).click();
    await expect(page.getByRole('radio', { name: '选择 人口基本信息视图' })).toBeChecked();

    await page.getByRole('button', { name: '关闭资源比较' }).click();
    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: '校验执行权限' }).click();
    await page.getByRole('button', { name: '确认并开始计算' }).click();
    const firstResult = page.getByLabel('分析结果').first();
    await expect(firstResult.getByText('24.8 张 / 千人', { exact: true })).toBeVisible();
    await expect(firstResult.getByText('浦锦街道')).toBeVisible();
    await expect(firstResult.getByText('分子口径：在营可用养老床位数（正式指标）')).toBeVisible();

    await firstResult.getByRole('button', { name: '查看完整结果' }).click();
    await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '图表' })).toBeVisible();
    await page.getByRole('tab', { name: '数据' }).click();
    await expect(page.getByRole('tab', { name: '数据', selected: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '查看本次计算依据' }).last()).toBeVisible();
    await page.getByRole('button', { name: '关闭分析计划' }).click();

    await page.getByRole('button', { name: '查看口径上下文' }).click();
    const bedDefinitionInput = page.locator('label:has-text("养老床位供给口径定义")').locator('..').locator('input');
    await bedDefinitionInput.fill('养老床位核定数');
    await page.getByRole('button', { name: '保存并更新口径' }).click();
    await expect(page.getByText('正在按新口径重新评估')).toHaveCount(0);
    await expect(page.getByText(/养老床位核定数/).last()).toBeVisible();
    await expect(page.getByText('24.8 张 / 千人', { exact: true })).toBeVisible();
    await expect(page.getByLabel('已完成的本次计算确认').first().getByRole('button', { name: /校验执行权限|确认并开始计算/ })).toHaveCount(0);

    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: '校验执行权限' }).last().click();
    await page.getByRole('button', { name: '确认并开始计算' }).last().click();
    const results = page.getByLabel('分析结果');
    await expect(results).toHaveCount(2);
    await expect(results.first().getByText('24.8 张 / 千人', { exact: true })).toBeVisible();
    await expect(results.first().getByText('分子口径：在营可用养老床位数（正式指标）')).toBeVisible();
    await expect(results.last().getByText('31.4 张 / 千人', { exact: true })).toBeVisible();
    await expect(results.last().getByText('分子口径：养老床位核定数（正式指标）')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ask Data 分析计划' })).toHaveCount(0);
  });
});
