# 发给 Cursor 的第三轮：只读评审 PR-1

推荐新开一个评审会话；避免另一个 Agent 同时写同一批文件。
手动引用规则、计划、报告和实际改动。不以 Review 默认的 main 分支作为当然基线。

```text
@semovix-data-assistant
@docs/implementation/data-assistant-five-views/PR1_PLAN.md
@docs/implementation/data-assistant-five-views/PR1_REPORT.md
@docs/implementation/data-assistant-five-views/inputs/01_code-implementation.md
@docs/implementation/data-assistant-five-views/inputs/02_five-view-checklist.md

请只读评审本次 PR-1，不修改代码、不 commit、不推送。
从计划/报告读取真实 PR1_START_SHA，检查它到当前工作状态的完整差异，包含已提交、暂存、未暂存与本 PR 新增文件。
先核对基线和预先存在的用户变更，不将整个仓库与 main 的所有差异算进本 PR。

仅检查批准的 PR-1 规则及受影响路径：
1. 是否复用唯一执行页与结果组件，没有平行的结果数据源。
2. 新结构是否兼容旧结果和旧任务恢复；没有数值时是否伪造、parseFloat 猜数或倒推缺失明细。
3. 紧凑/完整、图表/数据是否引用相同结果与口径；只读切换不发起运行。
4. 计划的主要操作去重是否保留原授权、版本、幂等和失效保护。
5. 迟到结果是否抢回用户已关闭/切换的面板；HTTP/Disconnected 是否出现演示成功 fallback。
6. 测试是否真测错误行为，是否删弱断言、混改 Fixture；失败归因是否有证据。
7. 03/04 是否为实际实现截图，文案、范围、状态是否按纠偏执行。

每个问题给出：文件/行号、触发条件、对应合同规则、用户影响和最小修正。
区分“本 PR 阻断”“非阻断建议”“PR-2/3 待做”“环境未验证”。
没有相关证据不要泛泛称架构不佳，也不要为了凑问题增加功能。
不能把未做指标入口、历史服务、分享、周期任务等当成 PR-1 未完成。
输出通过/有条件通过/不通过及明确原因。规则文件存在、截图相似、测试全绿都不能单独替代全部验收。
```

若评审发现明确阻断项，只授权修复这些项并重跑受影响测试；不要让“继续优化”扩展为新一轮全库重构。
