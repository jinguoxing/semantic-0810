import { FindDataResource } from '../../model/FindDataTask';

export const deniedResourceFixture: FindDataResource = {
  id: 'denied_test_resource',
  name: '仅用于安全边界测试的资源',
  type: '数据资产',
  granularity: '测试粒度',
  timeCoverage: '测试时间',
  desc: '该负样本不得进入生产 Fixture。',
  availabilityByAction: {
    discover: 'DENIED',
    viewMetadata: 'DENIED',
    preview: 'DENIED',
    query: 'DENIED',
    export: 'DENIED'
  }
};
