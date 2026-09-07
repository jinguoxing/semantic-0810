# 发给 Cursor 的第一轮：只核对并形成 PR-1 计划

使用 Plan Mode。先在上下文中选中规则和文档，再粘贴下面指令。此文件仅在用户本轮调用时执行。

```text
@semovix-data-assistant
@docs/implementation/data-assistant-five-views/README.md
@docs/implementation/data-assistant-five-views/inputs/01_code-implementation.md
@docs/implementation/data-assistant-five-views/inputs/02_five-view-checklist.md

请在当前打开的 jinguoxing/semantic-0810 仓库准备 PR-1：结果合同与共用视图。
本轮只读核对代码并输出计划，不修改业务代码、不提交、不推送。

一、先确认安全基线
读取适用的 AGENTS.md、现有 Cursor Rules、package.json、锁文件。
确认仓库根、当前分支、HEAD、remote 与未提交/未跟踪改动。允许在授权的终端执行 git fetch origin 并记录 origin/v2026.9.4；不能把本地旧远端引用当成最新。
文档审阅点 31f9c6c0ff13fd964c4b1f94623f81534d249010 只作历史参考，不回退或覆盖更晚实现。
不得 stash/reset/clean/rebase、强制切换分支或触碰用户变更。交接包本身的新文档可登记为材料文件，不当成未知业务改动。
若当前业务改动未提交，或分支关系影响安全施工，先记录并提出一个必要问题；不要擅自整理工作区。

二、范围已经确定，不重做产品规划
只做：结果数值/形态/引用的兼容扩展；AskResultContent 紧凑/完整视图；图表/数据切换；原右侧宿主的计划/结果/依据主体整理；同一计划主执行操作的位置去重。
现有依据有什么就显示什么；不可读的来源不能补造。
不做 PR-2 指标入口、PR-3 完整历史读取与解读，不另做 A 批次滚动/建议、不重写找数内核。

三、定向核对代码
定位 DataAssistantFindDataWorkspace、FindDataTask、conversationPresenters、AskResultContent、RightWorkspaceAskPlan、InlineAskReady，以及必要的 event/reducer、服务适配与就近测试。
已有实现就复用。不要为了“统一”批量重命名目录或复制五个页面。
阅读 inputs/01 第 04—06、10—13 节；inputs/02 的图片纠偏、呈现与验收；有争议再看 inputs/03/04 的相关节。
查看 images/03_calculation-plan.png 和 images/04_result-workspace.png 的实际像素；附件无法读取就报告，不能声称已对齐。
图片中的错误文字、重复完整表、虚构数据按 inputs/02 纠偏。图片是布局参考，不是服务或授权事实。

四、输出一份简短可审查的 PR1_PLAN.md
包含：
1. 实际 HEAD / 远端 SHA / 计划工作分支 / 未提交改动清单；明确本轮起点如何记录。
2. 已有能力与真正缺项，附本地文件位置。
3. 拟修改文件、理由和测试；避免宽泛重构。
4. 数值和结果身份怎样兼容旧 townResults/历史任务；没有数值时如何降级。
5. 本 PR 可以真实接通什么、只演示什么、哪些服务缺口要保留。
6. 有限任务清单、图 03/04 验收、实际测试命令和停止条件。

可以保存计划到 docs/implementation/data-assistant-five-views/PR1_PLAN.md；如果现有规则不允许写文件，先在回复中输出并等待保存。
原输入文档保持不变。完成计划后等待我确认，不开始 PR-2/3，也不生成另一份全量 PRD。
```
