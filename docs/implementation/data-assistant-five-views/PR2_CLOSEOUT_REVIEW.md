# PR-2 Final Closeout Review

- 审阅基线：`56ca49cf9082aeff9fff866645d14dbbdee18b3c`
- 审阅范围：该基线之上的未提交 Final Closeout Patch；未纳入既有未跟踪的 PR-1 文档、输入材料、截图目录与测试运行目录。
- 结论：**通过，可 Freeze 并提交。** 未发现阻断问题或范围漂移。

## 实际修改文件

- 入口与身份：`src/App.tsx`、`src/data/marketplaceMetricReferences.ts`、`src/data/metricRegistryData.ts`、`src/components/{DataServiceMarketplaceWorkspace,MetricDetailWorkspace,MetricAuthoringChangeMode,DataAssetDetailWorkspace}.tsx`。
- 直查结果与 HTTP：`src/components/find_data/model/{FindDataTask,findDataReducer}.ts`、`src/components/find_data/policy/surfacePolicy.ts`、`src/components/find_data/services/HttpFindDataService.ts`、`src/components/DataAssistantFindDataWorkspace.tsx`。
- 回归：`detailEntryCallbacks`、`httpFindDataService`、`metricQueryDesignDemoService`、`metricResultViews`、`surfacePolicy` 测试文件。

## FC-01～FC-15

| 编号 | 结果 |
| --- | --- |
| FC-01 | `res-03 → met_001` 由 `marketplaceMetricReferences.ts` 明确维护，资源与指标 ID 不再混用。 |
| FC-02 | Marketplace 卡片传递 canonical metric ID；App 仅集中处理已登记的 resource reference。 |
| FC-03 | MetricDetail 对未知非空 ID 显示失败页，不替换为其他 Metric。 |
| FC-04 | MetricDetail 链路不按名称模糊匹配 canonical ID。 |
| FC-05 | 直查结果接收校验 taskId、requestId、requirementRevision、metricId。 |
| FC-06 | 紧凑结果展开与 Surface Policy 共用四元 identity helper。 |
| FC-07 | same request / wrong metric 的 reducer、紧凑展开和 Surface Policy 回归已覆盖。 |
| FC-08 | HTTP `createTask` 要求回传 target 的 kind 与 ID 完全匹配。 |
| FC-09 | 请求版本存在时，HTTP 回传版本不一致即失败并停止自动查询。 |
| FC-10 | 未新增 HTTP URL；HTTP 继续拒绝 `MOCK_FIXTURE` direct result。 |
| FC-11 | 用户可见“数据助手 · 找数据”统一为“数据助手”。 |
| FC-12 | 空态可覆盖查指标、找数据与分析；入口对象在同一上下文栏显示。 |
| FC-13 | 内部 FindData、Task、Event、服务命名未重命名。 |
| FC-14 | 资产入口的 id、label、initialText 与 Toast 均来自同一 resolved asset identity；未知资产显示自身 ID。 |
| FC-15 | AskPlan 与直查校验仍分离；原 Core/relation/permission/version 门禁、PR-1 结构化结果、Clarification 生命周期与各模式隔离均保留。 |

## 双轴审阅

### Standards

未发现仓库适用的编码规范文件；按代码气味基线审阅无硬性违规、无阻断气味。资源→指标引用、直查 identity 比较和资产 identity 均已收敛为单点小函数，未引入新 URL、泛化服务或重复分支。

### Spec

未发现缺项、错误实现或范围漂移。唯一非阻断观察：资产页关联指标卡将 `res-03` 作为资源引用交给 App 的集中映射，再得到 `met_001`；该行为保持 ID 空间边界，未来若需更强类型约束再调整回调参数，本轮不阻塞 Freeze。

## 实际验证

| 命令 | 结果 |
| --- | --- |
| `bun run lint` | 通过。 |
| PR-2 定向 Vitest（6 文件） | 通过，55 项。 |
| `bun run test` | 通过，15 文件、194 项。 |
| `VITE_FIND_DATA_MODE=mock bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=disconnected bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=http VITE_FIND_DATA_API_BASE=/api/find-data bun run build` | 通过。 |
| `VITE_FIND_DATA_MODE=design-demo bun run build` | 通过。 |
| `bun run test:smoke` | 通过：Mock 2 项、HTTP 1 项。 |
| `git diff --check` | 通过。 |

构建仅有既有 chunk 大小警告，无失败。

## 生产服务依赖

客户端已能拒绝缺失/错配对象或版本的 HTTP Task，且不回退 Mock；但正式直查服务仍需提供并验证对象归属、定义版本、条件/权限、幂等、无记录/超时与不可变结果引用的服务端合同。本轮未将隔离设计数据接入 HTTP 或 Disconnected。

## 提交

Closeout 审阅发生在提交前；最终 Commit SHA 见本次交付结果。PR-2 Freeze 后停止，不进入 PR-3。
