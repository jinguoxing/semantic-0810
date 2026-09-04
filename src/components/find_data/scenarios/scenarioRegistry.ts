import { FindDataTaskState } from '../model/FindDataTask';
import { FindDataScenario } from './FindDataScenario';
import { GenericFindDataScenario } from './GenericFindDataScenario';
import { MinhangBedSupplyScenario } from './MinhangBedSupplyScenario';

class ScenarioRegistry {
  private scenarios: FindDataScenario[] = [new MinhangBedSupplyScenario(), new GenericFindDataScenario()];

  classify(text: string): FindDataScenario {
    return this.scenarios.find((scenario) => scenario.key !== 'generic' && scenario.matchesInitialTurn(text))
      ?? this.get('generic');
  }

  get(key: string): FindDataScenario {
    return this.scenarios.find((scenario) => scenario.key === key) ?? this.scenarios[this.scenarios.length - 1];
  }
}

export const scenarioRegistry = new ScenarioRegistry();

export function canUpgradeGenericScenario(task: FindDataTaskState): boolean {
  return task.scenarioKey === 'generic' &&
    ['NEEDS_CLARIFICATION', 'WAITING_USER', 'IDLE'].includes(task.status) &&
    task.dataSolution.items.length === 0 &&
    !task.askPlan;
}

export function buildScenarioClassificationContext(task: FindDataTaskState, currentText: string): string {
  const recentUserTurns = task.turns
    .filter((turn) => turn.sender === 'USER')
    .slice(-3)
    .flatMap((turn) => turn.blocks)
    .filter((block) => block.type === 'TEXT')
    .map((block) => block.content);
  const hypothesis = task.requirementHypothesis;
  const confirmed = [
    hypothesis.region,
    hypothesis.timeRange ? `${hypothesis.timeRange.start} 至 ${hypothesis.timeRange.end}` : undefined,
    ...hypothesis.analysisFocus
  ].filter((value): value is string => !!value);
  return [task.goal, ...recentUserTurns, ...confirmed, currentText].filter(Boolean).join('；');
}
