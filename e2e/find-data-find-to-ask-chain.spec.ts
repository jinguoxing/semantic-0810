import { expect, test, type Page } from '@playwright/test';

const FIND_GOAL = '分析过去 12 个月闵行区各街镇 60 岁以上常住人口与在营养老床位供给。';
const BRIDGE_QUERY = '就用当前数据方案继续问数';
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
  expect(new URL(page.url()).searchParams.get('findTaskId')).toBe(taskId);
}

async function expectVisibleExactText(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}

test.describe('Find → Ask chained journey (design demo)', () => {
  test('runs the find pipeline, then bridges the composed solution into the ask-data figures in one task', async ({ page }) => {
    test.setTimeout(150_000);

    await test.step('01 · compose the find-data solution from a district-wide goal', async () => {
      await page.goto('/');
      await page.getByRole('button', { name: '找数据' }).click();
      const homeInput = page.getByPlaceholder(/描述你要查找的数据或分析目标/);
      await homeInput.fill(FIND_GOAL);
      await homeInput.press('Enter');
      await expect(page.getByText('已形成 2 项核心资源').last()).toBeVisible();
    });

    const taskId = findTaskId(page);

    await test.step('02 · explore candidates through the find pipeline', async () => {
      await sendTurn(page, '我还想看人口明细');
      await expect(page.getByText('人口明细候选')).toBeVisible();
      await page.getByRole('radio', { name: '常住人口月度快照' }).check();
      await page.getByRole('button', { name: '将所选资源加入方案' }).click();
      await expect(page.getByText(/已将「常住人口月度快照」加入方案/)).toBeVisible();
      await expectSameTask(page, taskId);
    });

    await test.step('03 · run the find-data benchmark analysis', async () => {
      await sendTurn(page, '按当前方案分析');
      await expect(page.getByText('请确认本次分析使用的比较基准：').last()).toBeVisible();
      await page.getByRole('radio', { name: /与全区加权平均比较/ }).last().check({ force: true });
      await page.getByRole('button', { name: '继续' }).last().click();
      await page.getByRole('button', { name: '校验执行权限' }).click();
      await expect(page.getByRole('button', { name: '确认并开始计算' })).toBeVisible();
      await page.getByRole('button', { name: '确认并开始计算' }).click();
      await expect(page.getByText('分析已完成，关键结果如下。')).toBeVisible();
      await expect(page.getByText('实际范围：上海市闵行区，2026-08，月度')).toBeVisible();
      await expectSameTask(page, taskId);
    });

    await test.step('04 · bridge the composed solution into the ask-data figures', async () => {
      await sendTurn(page, BRIDGE_QUERY);
      await expectVisibleExactText(page, '已承接当前数据方案继续问数');
      await expectVisibleExactText(page, '浦锦街道、七宝镇 2026 年 8 月');
      await expectVisibleExactText(page, '只读历史');
      await expect(page.getByRole('heading', { name: '数据方案已就绪' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '资源选型对比' })).toHaveCount(0);
      await expectSameTask(page, taskId);
    });

    await test.step('05 · reuse the bridged solution for a direct population query', async () => {
      await sendTurn(page, POPULATION_QUERY);
      await expect(page.getByText('20,000 人', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '查看完整结果' }).first()).toBeVisible();
      await expectSameTask(page, taskId);
    });

    await test.step('06 · clarify the bed definition on the bridged solution', async () => {
      await sendTurn(page, BED_QUERY);
      const availableBed = page.getByRole('radio', { name: '在营可用养老床位数' });
      await availableBed.check();
      await page.getByRole('button', { name: '使用此口径继续查询' }).click();
      await expect(page.getByText('800 张', { exact: true })).toBeVisible();
      await expect(page.getByText('已确认：在营可用养老床位数')).toBeVisible();
      await expectSameTask(page, taskId);
    });

    await test.step('07 · run the comparison plan while the find-data result stays as history', async () => {
      await sendTurn(page, PLAN_A_QUERY);
      await expect(page.getByRole('heading', { name: '本次计算', exact: true })).toBeVisible();
      await page.getByRole('button', { name: '按此方案计算' }).click();
      await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectVisibleExactText(page, '20.0 张 / 千人');
      await expectVisibleExactText(page, '5.0 张 / 千人');
      await expect(page.getByText('实际范围：上海市闵行区，2026-08，月度').first()).toBeVisible();
      await expectSameTask(page, taskId);
    });

    await test.step('08 · run the approved-bed plan while preserving both prior results', async () => {
      await sendTurn(page, PLAN_B_QUERY);
      await expect(page.getByRole('heading', { name: '本次计算', exact: true })).toBeVisible();
      await page.getByRole('button', { name: '按此方案计算' }).click();
      await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible();
      await expectVisibleExactText(page, '22.5 张 / 千人');
      await expectVisibleExactText(page, '25.0 张 / 千人');
      await expectVisibleExactText(page, '15.0 张 / 千人');
      await expectSameTask(page, taskId);
    });

    await test.step('09 · interpret the historical available-bed result exactly', async () => {
      await sendTurn(page, '回到在营可用床位的比较结果，解释一下这个差异。');
      await expect(page.getByRole('heading', { name: '历史结果' })).toBeVisible();
      await expect(page.getByText('七宝镇为 20.0 张 / 千人，浦锦街道为 15.0 张 / 千人，相差 5.0 张 / 千人。').last()).toBeVisible();
      await expect(page.getByText(/不能据此判断差异原因/).first()).toBeVisible();
      await expectSameTask(page, taskId);
    });
  });
});
