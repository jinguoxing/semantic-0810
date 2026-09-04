import { ConversationBlock, FindDataTaskState, TaskAction } from '../model/FindDataTask';
import { buildFieldSummary, buildGapSummary, buildRecommendationExplanation } from '../presenters/conversationPresenters';
import { FindDataScenario, createScenarioId, emptyScenarioResult } from './FindDataScenario';

function textBlock(content: string): ConversationBlock {
  return { type: 'TEXT', id: createScenarioId('text'), content };
}

export class GenericFindDataScenario implements FindDataScenario {
  key = 'generic';

  matchesInitialTurn(): boolean {
    return true;
  }

  async handleTurn(task: FindDataTaskState, text: string) {
    let content: string;
    if (text.includes('字段')) content = buildFieldSummary(task);
    else if (text.includes('为什么推荐') || text.includes('适合')) content = buildRecommendationExplanation(task);
    else if (text.includes('缺什么') || text.includes('局限') || text.includes('不足')) content = buildGapSummary(task);
    else content = `已记录您的需求「${text}」。请继续补充区域、时间范围或目标指标，以便开始检索。`;
    const blocks = [textBlock(content)];
    return {
      ...emptyScenarioResult(task.taskId),
      events: [{
        type: 'ASSISTANT_TURN_RECEIVED' as const,
        payload: { turnId: createScenarioId('assistant'), blocks, nextStatus: 'NEEDS_CLARIFICATION' as const }
      }],
      assistantBlocks: blocks
    };
  }

  async handleAction(task: FindDataTaskState, _action: TaskAction) {
    return emptyScenarioResult(task.taskId);
  }
}
