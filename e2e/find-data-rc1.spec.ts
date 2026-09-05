import { expect, test } from '@playwright/test';

const goal = '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。';

test.describe('Find Data RC1 mock smoke', () => {
  test('creates a solution, prepares Ask Data, runs it, then recomposes r04 to r05 after a definition revision', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await page.getByRole('button', { name: '找数据' }).click();
    const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
    await homeInput.fill(goal);
    await homeInput.press('Enter');

    await expect(page.getByText('已形成 2 项核心资源').last()).toBeVisible();
    await expect(page.getByText('两项资源均按街镇和月份组织，可用于后续供给水平分析。')).toBeVisible();
    await page.getByRole('button', { name: '查看完整方案' }).click();
    await expect(page.getByRole('heading', { name: '数据方案' })).toBeVisible();

    const taskInput = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
    await taskInput.fill('再加入养老服务实际使用');
    await taskInput.press('Enter');
    await expect(page.getByText('新增居家养老服务订单等部分匹配资源，完整服务使用缺口仍保留。')).toBeVisible();
    await expect(page.getByText('60 岁以上常住人口数').last()).toBeVisible();
    await expect(page.getByText('在营可用养老床位数').last()).toBeVisible();
    await expect(page.getByText('居家养老服务订单').last()).toBeVisible();
    await expect(page.getByText('部分覆盖').last()).toBeVisible();

    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();

    await page.getByRole('button', { name: '分析计划 · 待确认' }).click();
    await page.getByRole('button', { name: '执行权限重校验' }).click();
    await expect(page.getByText('可以执行')).toBeVisible();
    await page.getByRole('button', { name: '确认并开始计算' }).click();
    await expect(page.getByText(/分析已完成/)).toBeVisible();

    await page.getByRole('button', { name: '收起右侧工作区' }).click();
    await page.getByRole('button', { name: '查看口径上下文' }).click();
    const inputs = page.locator('.fixed input');
    await inputs.nth(5).fill('养老床位核定数');
    await page.getByRole('button', { name: '保存并更新口径' }).click();
    await expect(page.getByText('已按新条件完成重评：养老床位口径已更新。')).toBeVisible();
    await expect(page.getByText('床位核心指标由在营可用养老床位数替换为养老床位核定数。')).toBeVisible();
    await expect(page.getByText('后续分析反映核定容量，不代表实际可用容量。')).toBeVisible();
    await expect(page.getByText('历史结果，尚未按新需求重新计算。')).toBeVisible();
    await expect(page.getByText('全区加权平均供给水平为 24.8 张 / 千人。')).toBeVisible();
    await page.getByRole('button', { name: '查看最新方案' }).last().click();
    await expect(page.getByRole('heading', { name: '数据方案' })).toBeVisible();
    await expect(page.getByText('养老床位核定数', { exact: true })).toBeVisible();

    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: '分析计划 · 待确认' }).click();
    await expect(page.getByText('每千名 60 岁以上常住人口核定养老床位数')).toBeVisible();
    await expect(page.getByText(/养老床位核定数（正式指标）/)).toBeVisible();
    await expect(page.getByText(/\( 养老床位核定数 ÷ 60 岁以上常住人口数 \) × 1000/)).toBeVisible();
    await expect(page.getByText('核定床位数反映审批或设计容量，包含可能尚未投用、停用或不具备即时接收能力的床位；分析结果不得直接表述为实际可用养老资源供给水平。')).toBeVisible();
    await expect(page.getByRole('complementary').last().getByText(/在营可用养老床位数/)).toHaveCount(0);
    await page.getByRole('button', { name: '执行权限重校验' }).click();
    await expect(page.getByText('可以执行')).toBeVisible();
    await page.getByRole('button', { name: '确认并开始计算' }).click();
    await expect(page.getByText('核定床位口径 · 演示数据')).toBeVisible();
    await expect(page.getByText('本次结果范围内未发现低于当前比较基准的街镇')).toBeVisible();
    await expect(page.getByText('识别出 2 个供给水平相对全区加权平均偏低的街镇')).toHaveCount(0);
  });

  test('broad goal clarifies before creating a solution', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '找数据' }).click();
    const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
    await homeInput.fill('帮我看看闵行区老人养老情况');
    await homeInput.press('Enter');

    await expect(page.getByText('你这次主要想先看养老资源供给，还是实际服务使用？')).toBeVisible();
    await expect(page.getByRole('button', { name: '查看当前方案' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /分析计划/ })).toHaveCount(0);

    await page.getByRole('radio', { name: '人口规模与养老床位供给' }).check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: /方案 · 2 项核心资源/ }).click();
    await expect(page.getByText('60 岁以上常住人口数').last()).toBeVisible();
    await expect(page.getByText('在营可用养老床位数').last()).toBeVisible();
    await expect(page.getByRole('button', { name: /分析计划/ })).toHaveCount(0);
  });

  test('keeps candidate and selection decisions readable in the conversation without opening a workspace', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '找数据' }).click();
    const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
    await homeInput.fill(goal);
    await homeInput.press('Enter');

    const taskInput = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
    await taskInput.fill('我还想看人口明细');
    await taskInput.press('Enter');
    await expect(page.getByText('本轮新增 2 项候选资源，尚未自动纳入当前方案。')).toBeVisible();
    await expect(page.getByText(/月度快照保留相应的月度切片，因此更适合作为明细下钻候选/)).toBeVisible();
    await page.getByRole('button', { name: '使用月度快照' }).click();
    await expect(page.getByText(/已将「常住人口月度快照」加入方案/)).toBeVisible();
    await expect(page.getByText(/「人口基本信息视图」仍保留在候选中，未加入正式方案/)).toBeVisible();
  });

  test('returns from candidate fields to the same comparison draft before confirming the selection', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '找数据' }).click();
    const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
    await homeInput.fill(goal);
    await homeInput.press('Enter');

    const taskInput = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
    await taskInput.fill('我还想看人口明细');
    await taskInput.press('Enter');
    await page.getByRole('button', { name: '比较 2 项资源' }).last().click();
    await expect(page.getByRole('heading', { name: '资源选型对比' })).toBeVisible();

    await page.getByRole('radio', { name: '选择 常住人口月度快照' }).click();
    await page.getByRole('button', { name: '查看常住人口月度快照字段' }).click();
    await expect(page.getByRole('heading', { name: /字段检视 · 常住人口月度快照/ })).toBeVisible();
    await page.getByRole('button', { name: '返回资源比较' }).click();
    await expect(page.getByRole('heading', { name: '资源选型对比' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '选择 常住人口月度快照' })).toBeChecked();
    await page.getByRole('button', { name: '将所选资源加入方案' }).click();
    await expect(page.getByText(/已将「常住人口月度快照」加入方案/)).toBeVisible();
  });

  test('keeps Ask Plan result and calculation targets in the same scrollable workspace', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '找数据' }).click();
    const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
    await homeInput.fill(goal);
    await homeInput.press('Enter');

    const taskInput = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: '分析计划 · 待确认' }).click();
    await page.getByRole('button', { name: '执行权限重校验' }).click();
    await expect(page.getByText('可以执行')).toBeVisible();
    await page.getByRole('button', { name: '确认并开始计算' }).click();

    const resultHeading = page.getByText('分析执行结论与基线核查');
    await expect(resultHeading).toBeInViewport();
    await page.getByRole('button', { name: '查看计算依据' }).click();
    await expect(page.getByText('计算公式：')).toBeInViewport();
    await page.getByRole('button', { name: '查看完整结果和计算依据' }).last().click();
    await expect(resultHeading).toBeInViewport();
  });
});
