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
    await expect(page.getByText('请确认本次分析使用的比较基准：')).toBeVisible();
    await page.getByRole('button', { name: /与全区加权平均比较/ }).click();
    await page.getByRole('button', { name: '继续' }).click();

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
  });
});
