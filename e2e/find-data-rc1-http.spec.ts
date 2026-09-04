import { expect, test } from '@playwright/test';

test.describe('Find Data RC1 HTTP smoke', () => {
  test('restores an HTTP-owned task without relying on local browser task data', async ({ page }) => {
    await page.route('**/api/find-data/tasks/http_rc1', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          taskId: 'http_rc1', title: 'HTTP 恢复任务', status: 'READY', scenarioKey: 'generic', goal: '恢复验证',
          requirementHypothesis: { dimensions: [], analysisFocus: [], assumptions: [], unresolvedQuestions: [] },
          searchScope: { domains: [], includeCrossDepartment: true }, turns: [{ turnId: 'restored', sender: 'ASSISTANT', createdAt: '2026-09-04T00:00:00.000Z', blocks: [{ type: 'TEXT', id: 'restored_text', content: '来自服务端的任务状态' }] }],
          resources: {}, dataSolution: { state: 'EMPTY', basedOnRequirementRevision: 0, basedOnSearchRevision: 0, items: [], gaps: [], relationshipEvidence: [], coverageSummary: [], limitationSummary: [], updatedAt: '2026-09-04T00:00:00.000Z' },
          searchResult: { query: '', totalMatches: 0, candidateIds: [], candidateSnapshot: [], returnedCount: 0 }, permissionRequests: {}, activeSurface: { type: 'CLOSED' }, requirementRevision: 0, searchRevision: 0, createdAt: '2026-09-04T00:00:00.000Z', updatedAt: '2026-09-04T00:00:00.000Z'
        })
      });
    });
    await page.goto('/?findTaskId=http_rc1');
    await expect(page.getByText('来自服务端的任务状态')).toBeVisible();
    await expect(page).toHaveURL(/findTaskId=http_rc1/);
  });
});
