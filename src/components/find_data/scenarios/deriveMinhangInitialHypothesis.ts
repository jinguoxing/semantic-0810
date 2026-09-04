import { ClarificationQuestion, RequirementHypothesis } from '../model/FindDataTask';

const DEFAULT_TIME_RANGE = { start: '2025-09', end: '2026-08' };

export const minhangBedDefinitionQuestion: ClarificationQuestion = {
  id: 'q_minhang_bed_definition',
  question: '本次养老床位希望使用哪一种口径？',
  type: 'SINGLE',
  options: [
    { id: 'bed_available', label: '在营可用养老床位', recommended: true },
    { id: 'bed_approved', label: '养老床位核定数' }
  ],
  resolution: { status: 'OPEN', selectedOptionIds: [] }
};

export type InitialHypothesisResolution =
  | { status: 'READY'; hypothesis: RequirementHypothesis }
  | { status: 'NEEDS_CLARIFICATION'; question: ClarificationQuestion; partialHypothesis: RequirementHypothesis };

function padMonth(month: string): string {
  return month.padStart(2, '0');
}

function parseTimeRange(text: string): { start: string; end: string } | undefined {
  if (/(过去\s*12\s*个月|过去一年)/.test(text)) return DEFAULT_TIME_RANGE;

  const sameYear = text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(?:至|到|[-—–~])\s*(\d{1,2})\s*月/);
  if (sameYear) {
    return { start: `${sameYear[1]}-${padMonth(sameYear[2])}`, end: `${sameYear[1]}-${padMonth(sameYear[3])}` };
  }

  const monthRange = text.match(/(20\d{2})[.\/-](\d{1,2})\s*(?:至|到|[-—–~])\s*(20\d{2})?[.\/-]?(\d{1,2})/);
  if (monthRange) {
    return {
      start: `${monthRange[1]}-${padMonth(monthRange[2])}`,
      end: `${monthRange[3] ?? monthRange[1]}-${padMonth(monthRange[4])}`
    };
  }
  return undefined;
}

function parseBedDefinition(text: string): RequirementHypothesis['bedDefinition'] | undefined {
  if (/(在营|可用|实际可接收|在营床位|可用床位)/.test(text)) return '民政核定且在营可用养老床位数';
  if (/(核定床位|床位核定数|审批核定床位|设计床位)/.test(text)) return '养老床位核定数';
  return undefined;
}

function buildHypothesis(text: string, bedDefinition?: string): RequirementHypothesis {
  const parsedRange = parseTimeRange(text);
  const populationDefinition = /(60\s*岁以上|60\s*岁及以上)\s*常住人口/.test(text)
    ? '60 岁及以上常住人口'
    : undefined;
  const timeRange = parsedRange ?? DEFAULT_TIME_RANGE;
  return {
    region: '上海市闵行区',
    timeRange,
    populationDefinition,
    bedDefinition,
    dimensions: ['时间（月度）', '空间（街镇）'],
    analysisFocus: ['老年人口规模与分布', '养老床位供给'],
    assumptions: parsedRange ? [] : ['当前按核心资源共同覆盖的最近 12 个完整月进行分析。'],
    unresolvedQuestions: []
  };
}

/**
 * Resolves only the fixed Minhang demonstration vocabulary. It deliberately is
 * not a general-purpose language or date parser.
 */
export function deriveMinhangInitialHypothesis(text: string): InitialHypothesisResolution {
  const bedDefinition = parseBedDefinition(text);
  if (!bedDefinition) {
    const question = { ...minhangBedDefinitionQuestion, options: minhangBedDefinitionQuestion.options.map((option) => ({ ...option })) };
    return {
      status: 'NEEDS_CLARIFICATION',
      question,
      partialHypothesis: { ...buildHypothesis(text), unresolvedQuestions: [question] }
    };
  }
  return { status: 'READY', hypothesis: buildHypothesis(text, bedDefinition) };
}
