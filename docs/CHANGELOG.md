

## v0.2.0 - 2026-03-10

### 新增
- **订单管理**
  - 新增订单列表页：`/orders`
    - 展示：订单号、接收方、状态、金额、商品摘要、创建时间
    - 操作：查看、删除
  - 新增订单创建页：`/orders/new`
    - 支持一单多商品、多数量
    - 自动计算金额（合计）
    - 写入 `orders` 与 `order_items`
    - 前端生成 `order_no`
  - 新增订单详情页：`/orders/[id]`
    - 展示订单基础信息与订单明细（含资源链接）
    - 展示最近发送记录（`order_deliveries`）
  - 新增订单删除确认页：`/orders/[id]/delete`
    - 删除 `orders`，并级联删除 `order_items`

- **资源交付（手动版）**
  - 新增发送页面：`/orders/[id]/deliver`
    - 生成可发送文本（含商品明细与资源链接）
    - 复制到剪贴板（`CopyButton` Client Component）
    - 记录发送日志到 `order_deliveries`（sent/failed）

- **数据库与类型**
  - 新增表：`orders`、`order_items`、`order_deliveries`、`order_events`
  - 更新 `types/database.ts` 与 Supabase schema 同步

### 变更
- 开发端口固定为 **8585**（`npm run dev`）

### 已知问题 / 限制
- 订单状态目前创建默认为 `pending`，暂未实现自动状态流转（如发送后改为 `fulfilled`）。
- 表字段命名存在混用：`products` 为 camelCase，新订单相关表为 snake_case，开发时需留意字段名匹配。

### 下一步建议（Backlog）
- 发送成功后更新订单状态（`pending → fulfilled`）并写入 `order_events`
- 支持“重发/失败重试”与更完善的发送记录展示
- 接入真实发送渠道（Email/IM）与支付模块雏形