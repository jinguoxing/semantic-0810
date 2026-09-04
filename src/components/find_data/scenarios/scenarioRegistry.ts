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
