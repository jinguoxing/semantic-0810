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

    await expect(page.getByText('已形成 2 项核心资源的最小数据方案')).toBeVisible();
    await page.getByRole('button', { name: '查看当前方案' }).click();
    await expect(page.getByRole('heading', { name: '数据方案' })).toBeVisible();

    const taskInput = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
    await page.getByRole('button', { name: /与全区加权平均比较/ }).last().click();
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
    await expect(page.getByText('正在按新口径重新评估')).toBeVisible();
    await page.getByRole('button', { name: /方案 · 2 项核心资源/ }).click();
    await expect(page.getByText('养老床位核定数', { exact: true })).toBeVisible();

    await taskInput.fill('按当前方案分析');
    await taskInput.press('Enter');
    await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
    await page.getByRole('button', { name: /与全区加权平均比较/ }).last().click();
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

    await page.getByRole('button', { name: '人口规模与养老床位供给' }).click();
    await page.getByRole('button', { name: '继续' }).last().click();
    await page.getByRole('button', { name: /方案 · 2 项核心资源/ }).click();
    await expect(page.getByText('60 岁以上常住人口数').last()).toBeVisible();
    await expect(page.getByText('在营可用养老床位数').last()).toBeVisible();
    await expect(page.getByRole('button', { name: /分析计划/ })).toHaveCount(0);
  });
});
