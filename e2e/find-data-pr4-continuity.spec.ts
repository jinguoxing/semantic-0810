import { expect, test, type Page } from '@playwright/test';

const TASK_TITLE = '浦锦、七宝养老服务供给比较';
const GOAL = '我想比较浦锦街道和七宝镇 2026 年 8 月的养老服务供给情况，先帮我看看需要哪些数据。';
const POPULATION_QUERY = '先查询 2026 年 8 月浦锦街道的 60 岁及以上常住人口数。';
const BED_QUERY = '查询 2026 年 8 月七宝镇的养老床位数。';
const PLAN_A_QUERY = '用当前数据方案中的老年人口和在营可用床位数据，比较浦锦街道和七宝镇每千名老人床位数。先让我确认计算方案，不判断是否充足。';
const PLAN_B_QUERY = '再用核定床位按同样方式计算一份，保留上一份结果。';

async function sendTurn(page: Page, text: string) {
  const input = page.getByPlaceholder('发送找数据意图、提出追问或输入口径调整要求…');
  await input.fill(text);
  await input.press('Enter');
}

function findTaskId(page: Page): string {
  const taskId = new URL(page.url()).searchParams.get('findTaskId');
  if (!taskId) throw new Error(`Expected findTaskId in URL, received ${page.url()}`);
  return taskId;
}

async function expectSameTask(page: Page, taskId: string) {
  await expect(page.locator('main').getByRole('heading', { name: TASK_TITLE })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('findTaskId')).toBe(taskId);
}

async function expectNoFindCandidateSurface(page: Page) {
  await expect(page.getByRole('heading', { name: '资源选型对比' })).toHaveCount(0);
  await expect(page.getByText(/进入 Ask Data|转入分析计划/)).toHaveCount(0);
}

async function expectVisibleExactText(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}

test.describe('PR-4 Find → Ask continuity final freeze', () => {
  test('runs the canonical single-task Design Demo journey from Find through historical Result A', async ({ page }) => {
    test.setTimeout(120_000);

    await test.step('01 · enter Data Assistant and form the Data Solution', async () => {
      await page.goto('/');
      await page.getByRole('button', { name: '找数据 数据助手' }).click();
      const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
      await homeInput.fill(GOAL);
      await homeInput.press('Enter');

      await expect(page.locator('main').getByRole('heading', { name: TASK_TITLE })).toBeVisible();
      await expect(page.getByRole('heading', { name: '数据方案已就绪' })).toBeVisible();
      await expect(page.getByText('当前数据方案 · 2 个核心数据')).toBeVisible();
      await expectSameTask(page, findTaskId(page));
      await expectNoFindCandidateSurface(page);
    });

    const taskId = findTaskId(page);

    await test.step('02 · reuse the current solution for the population Direct Metric Result', async () => {
      await sendTurn(page, POPULATION_QUERY);

      await expect(page.getByText('20,000 人', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: '数据方案已就绪' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: '查看完整结果' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '查看指标口径' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '解读这份结果' }).first()).toBeVisible();
      await expectSameTask(page, taskId);
      await expectNoFindCandidateSurface(page);
    });

    await test.step('03 · clarify the already-present bed definition without searching again', async () => {
      await sendTurn(page, BED_QUERY);

      const availableBed = page.getByRole('radio', { name: '在营可用养老床位数' });
      const approvedBed = page.getByRole('radio', { name: '养老床位核定数' });
      const submit = page.getByRole('button', { name: '使用此口径继续查询' });
      await expect(page.getByRole('heading', { name: '数据方案已就绪' })).toHaveCount(0);
      await expect(availableBed).not.toBeChecked();
      await expect(approvedBed).not.toBeChecked();
      await expect(submit).toBeDisabled();

      await availableBed.check();
      await expect(page.getByText('800 张', { exact: true })).toHaveCount(0);
      await submit.click();

      await expect(page.getByText('800 张', { exact: true })).toBeVisible();
      await expect(page.getByText('已确认：在营可用养老床位数')).toBeVisible();
      await expectSameTask(page, taskId);
      await expectNoFindCandidateSurface(page);
    });

    await test.step('04 · prepare and run Plan A in the visible right workspace', async () => {
      await sendTurn(page, PLAN_A_QUERY);

      await expect(page.getByRole('heading', { name: '本次计算' })).toBeVisible();
      await expect(page.getByText('每千名老人在营可用养老床位数')).toBeVisible();
      await expect(page.getByText('来自当前数据方案', { exact: false }).first()).toBeVisible();
      await expect(page.getByText('60 岁以上常住人口数', { exact: true }).last()).toBeVisible();
      await expect(page.getByText('在营可用养老床位数', { exact: true }).last()).toBeVisible();
      await expect(page.getByText('2026-08 至 2026-08')).toBeVisible();
      await expect(page.getByText('在营可用养老床位数 ÷ 同期 60 岁及以上常住人口数 × 1000')).toBeVisible();
      await expect(page.getByText('约束边界：仅比较当前口径下的相对水平，不判断是否充足、不代表真实需求，也不生成政策目标或建设建议。')).toBeVisible();
      await expect(page.getByRole('button', { name: '按此方案计算' })).toBeVisible();
      await expectSameTask(page, taskId);

      await page.getByRole('button', { name: '按此方案计算' }).click();

      await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '本次计算' })).toHaveCount(0);
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await expectVisibleExactText(page, '5.0 张 / 千人');
      for (const prohibited of ['床位不足', '供需失衡', '需要新增床位', '政策目标差距']) {
        await expect(page.getByText(prohibited, { exact: false })).toHaveCount(0);
      }
      await expectSameTask(page, taskId);
    });

    await test.step('05 · switch Chart/Data without re-executing or changing Result A', async () => {
      const resultCount = await page.getByLabel('分析结果').count();
      await page.getByRole('tab', { name: '数据' }).click();
      await expect(page.getByRole('tab', { name: '数据', selected: true })).toBeVisible();
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await page.getByRole('tab', { name: '图表' }).click();
      await expect(page.getByRole('tab', { name: '图表', selected: true })).toBeVisible();
      await expect(page.getByLabel('分析结果')).toHaveCount(resultCount);
      await expect(page.getByText(/正在执行 Ask Data 分析计划/)).toHaveCount(0);
      await expectSameTask(page, taskId);
    });

    await test.step('06 · prepare and run Plan B while preserving Result A', async () => {
      await sendTurn(page, PLAN_B_QUERY);

      await expect(page.getByRole('heading', { name: '本次计算' })).toBeVisible();
      await expect(page.getByText('每千名老人核定养老床位数')).toBeVisible();
      await expect(page.getByText('养老床位核定数', { exact: true }).last()).toBeVisible();
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await expectVisibleExactText(page, '5.0 张 / 千人');
      await expectNoFindCandidateSurface(page);
      await expectSameTask(page, taskId);

      await page.getByRole('button', { name: '按此方案计算' }).click();
      await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
      await expectVisibleExactText(page, '22.5 张 / 千人');
      await expectVisibleExactText(page, '25.0 张 / 千人');
      await expectVisibleExactText(page, '2.5 张 / 千人');
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await expectVisibleExactText(page, '5.0 张 / 千人');
      await expectSameTask(page, taskId);
    });

    await test.step('07 · resolve and interpret historical Result A exactly', async () => {
      await sendTurn(page, '回到在营可用床位的比较结果，解释一下这个差异。');

      await expect(page.getByRole('heading', { name: '历史结果' })).toBeVisible();
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await expectVisibleExactText(page, '5.0 张 / 千人');
      await expect(page.getByRole('heading', { name: '每千名老人在营可用养老床位数' }).last()).toBeVisible();
      await expect(page.getByRole('heading', { name: '指标查询结果' })).toHaveCount(0);
      await expect(page.getByText('七宝镇为 20.0 张 / 千人，浦锦街道为 15.0 张 / 千人，相差 5.0 张 / 千人。')).toBeVisible();
      await expect(page.getByText(/不能据此判断差异原因/).first()).toBeVisible();
      for (const prohibited of ['因为七宝投入更多', '浦锦建设不足', '建议增加']) {
        await expect(page.getByText(prohibited, { exact: false })).toHaveCount(0);
      }
      await expectSameTask(page, taskId);
    });

    await test.step('08 · keep Result A/B aliases exact in the same task', async () => {
      await sendTurn(page, '解释结果 B');
      await expect(page.getByText('七宝镇为 25.0 张 / 千人，浦锦街道为 22.5 张 / 千人，相差 2.5 张 / 千人。').last()).toBeVisible();

      await page.getByRole('button', { name: '查看完整结果' }).last().click();
      await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
      await expectVisibleExactText(page, '25.0 张 / 千人');
      await sendTurn(page, '解释结果 A');
      await expect(page.getByText('七宝镇为 20.0 张 / 千人，浦锦街道为 15.0 张 / 千人，相差 5.0 张 / 千人。').last()).toBeVisible();
      await expectSameTask(page, taskId);
    });
  });
});
