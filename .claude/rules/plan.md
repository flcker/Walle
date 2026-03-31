# 计划文档规范

## 文件管理

- 所有计划文档统一放在 `.claude/plans/` 目录下
- 新建文件时使用**功能名 + 日期**的方式命名，格式：`YYYYMMDD-<功能名>-Plan.md`（例：`20260324-TagsAndCategories-Plan.md`）
- **禁止**覆盖 `.claude/plans/` 目录下已有文件，每次新建独立文件

## Plan 模式执行规范

1. **Phase 4（Final Plan）结束前**，必须在 `.claude/plans/` 下创建对应的项目计划文档（上述命名格式），再调用 `ExitPlanMode`
2. **批准后执行阶段**，必须将各独立子任务拆分给多个并发 subagent 执行，不能主线程单线程顺序完成所有任务
