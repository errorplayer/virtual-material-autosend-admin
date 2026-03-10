# Virtual Material Autosend Admin - Wiki

> 虚拟商品/订单管理后台：管理商品、订单，并在触发条件下发送虚拟资源链接（当前为手动发送 + 记录）。

- 项目 Wiki：见 本文   
- 版本迭代：见 `docs/CHANGELOG.md`


## 目录
- [1. 项目简介](#1-项目简介)
- [2. 目标与范围](#2-目标与范围)
- [3. 技术栈](#3-技术栈)
- [4. 快速开始](#4-快速开始)
  - [4.1 环境变量](#41-环境变量)
  - [4.2 安装与运行](#42-安装与运行)
  - [4.3 常用命令](#43-常用命令)
- [5. 功能与页面](#5-功能与页面)
  - [5.1 商品管理](#51-商品管理)
  - [5.2 订单管理](#52-订单管理)
  - [5.3 新增订单](#53-新增订单)
  - [5.4 订单详情](#54-订单详情)
  - [5.5 发送资源链接（手动）](#55-发送资源链接手动)
- [6. 数据库设计（Supabase）](#6-数据库设计supabase)
  - [6.1 products](#61-products)
  - [6.2 orders](#62-orders)
  - [6.3 order_items](#63-order_items)
  - [6.4 order_deliveries](#64-order_deliveries)
  - [6.5 order_events](#65-order_events)
- [7. 代码结构与关键文件](#7-代码结构与关键文件)
- [8. 关键约束与实现细节](#8-关键约束与实现细节)
- [9. FAQ / 排错](#9-faq--排错)
- [10. 路线图（建议）](#10-路线图建议)

---

## 1. 项目简介

`virtual-material-autosend-admin` 是一个基于 **Next.js(App Router) + Supabase** 的后台管理系统，用于：

- **商品管理**：维护虚拟商品信息、封面图、资源包链接等
- **订单管理**：创建订单（支持一单多商品、多数量）、查看订单详情、删除订单
- **资源交付**：生成“资源链接发送内容”，支持复制到剪贴板，并在数据库记录发送日志（`order_deliveries`）

---

## 2. 目标与范围

### 当前阶段（已实现）
- 商品 CRUD
- 订单列表 / 新增 / 详情 / 删除
- 手动发送：复制发送内容 + 记录发送日志

### 未来阶段（规划）
- 支付接入（paid/refunded 等）
- 自动触发发送（边缘函数/定时任务/触发器）
- 权限体系（RLS、管理员角色、操作审计）
- 重试/补发机制与失败告警

---

## 3. 技术栈

- **Next.js**: 16.1.6（App Router）
- **React**: 19.x
- **TypeScript**
- **TailwindCSS**
- **Supabase**: Postgres + Storage
- **SDK**: `@supabase/supabase-js`

---

## 4. 快速开始

### 4.1 环境变量

在项目根目录创建 `.env.local`（或在部署平台配置环境变量）：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

项目中 `lib/supabase.ts` 会在缺少变量时抛错，防止空配置运行。

### 4.2 安装与运行

```bash
npm install
npm run dev    
```
 

## 5. 功能与页面

### 5.1 商品管理

- **路径**：`/products`
- **能力**：
  - 商品列表展示
  - 新增/编辑/删除
  - 上传资源包 `.zip`（最大 3MB）到 Supabase Storage（bucket: `product-resources`）
  - 保存资源链接到 `products.resourceStorageUrl`

### 5.2 订单管理

- **路径**：`/orders`
- **展示字段**：
  - 订单号、接收方、状态、金额、商品摘要、创建时间
- **商品摘要**：
  - 种类数：`order_items.length`
  - 总件数：`sum(order_items.quantity)`
  - 商品名：最多 3 个 `product_name` 拼接展示

### 5.3 新增订单

- **路径**：`/orders/new`
- **能力**：
  - 输入 `customer_contact`（接收方字符串）、可选 `customer_name/note`
  - 动态添加多行商品（商品 + 数量）
  - 自动计算合计金额（写入 `orders.subtotal/total_amount`）
  - 写入两张表：`orders` + `order_items`
  - 自动生成 `order_no`（前端生成）

### 5.4 订单详情

- **路径**：`/orders/[id]`
- **能力**：
  - 展示订单基础信息与明细
  - 展示资源链接（从 `order_items.resource_storage_url` 快照读取）
  - 展示最近发送记录（`order_deliveries`）

### 5.5 发送资源链接（手动）

- **路径**：`/orders/[id]/deliver`
- **能力**：
  - 根据 `order_items` 生成可发送文本（含商品明细与资源链接）
  - 复制到剪贴板
  - 记录一次发送日志到 `order_deliveries`      




  ## 6. 数据库设计（Supabase）

> 以 `types/database.ts` 为准。当前存在命名风格混用：  
> - `products` 为 camelCase（如 `resourceStorageUrl`）  
> - 新增订单相关表为 snake_case（如 `order_no`、`resource_storage_url`）

### 6.1 products

关键字段：

- **id**: `uuid`
- **name**: `text`
- **price**: `numeric`
- **stock**: `integer`
- **description**: `text | null`
- **coverImagePath**: `text | null`
- **resourceStorageUrl**: `text | null`
- **created_at**: `timestamptz | null`
- **updated_at**: `timestamptz | null`

### 6.2 orders

关键字段：

- **id**: `uuid`
- **order_no**: `text | null`
- **status**: `text`（默认 `pending`）
- **customer_contact**: `text | null`
- **customer_name**: `text | null`
- **currency**: `text`
- **subtotal**: `numeric`
- **discount_total**: `numeric`
- **total_amount**: `numeric`
- **note**: `text | null`
- **metadata**: `jsonb`
- **created_at**: `timestamptz`
- **updated_at**: `timestamptz`

### 6.3 order_items

关键字段：

- **id**: `uuid`
- **order_id**: `uuid` → `orders.id`（`on delete cascade`）
- **product_id**: `uuid` → `products.id`
- **product_name**: `text | null`（商品名快照）
- **unit_price**: `numeric`（单价快照）
- **quantity**: `int`
- **line_total**: `numeric`（小计 = 单价 × 数量）
- **resource_storage_url**: `text | null`（资源链接快照）
- **created_at**: `timestamptz`

### 6.4 order_deliveries

关键字段：

- **id**: `uuid`
- **order_id**: `uuid` → `orders.id`
- **channel**: `text`（manual/email/wechat 等）
- **target**: `text | null`（接收方标识：邮箱/微信号等）
- **status**: `text`（sent/failed/pending…）
- **payload**: `jsonb`（发送内容摘要、链接列表等）
- **error_message**: `text | null`
- **sent_at**: `timestamptz | null`
- **created_at**: `timestamptz`

### 6.5 order_events

关键字段：

- **id**: `uuid`
- **order_id**: `uuid` → `orders.id`
- **type**: `text`（created/status_changed/delivery_sent 等）
- **data**: `jsonb`
- **created_at**: `timestamptz`

---

## 7. 代码结构与关键文件

- **`lib/supabase.ts`**
  - 基于 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 创建 Supabase 客户端。
- **`types/database.ts`**
  - 由 Supabase 生成的数据库类型定义，用于 `Tables<'orders'>` 等类型安全操作。
- **`types/product.ts` / `types/order.ts`**
  - 项目内对商品、订单的补充类型封装（方便组件使用）。
- **`app/products/page.tsx`**
  - 服务器端拉取 `products`，渲染商品列表，并交给客户端组件做交互。
- **`app/orders/page.tsx`**
  - 服务器端拉取 `orders` + `order_items`，展示订单列表与商品摘要。
- **`app/orders/new/page.tsx` + `app/orders/new/components/NewOrderForm.tsx`**
  - `page.tsx` 服务端获取商品列表。
  - `NewOrderForm` 为客户端组件，支持：
    - 动态增删商品行
    - 自动计算合计金额
    - 创建 `orders` 与 `order_items`。
- **`app/orders/[id]/page.tsx`**
  - 服务器端拉取单个订单 + 明细 + 发送记录。
  - 展示订单详情，并提供“发送资源链接”入口。
- **`app/orders/[id]/deliver/page.tsx`**
  - 服务器端聚合订单明细，生成发送文本；提供表单记录一次发送。
- **`app/orders/[id]/deliver/components/CopyButton.tsx`**
  - Client Component，用于复制发送内容到剪贴板。
- **`app/orders/[id]/delete/page.tsx`**
  - 删除确认页，使用 server action 删除订单（明细级联删除）。

---

## 8. 关键约束与实现细节

### 8.1 Server / Client Component 边界

- `app/.../page.tsx` 默认是 **Server Component**。
- Server Component **不能**直接使用事件处理器（如 `onClick`）。
- 需要交互时，需把相关 UI 抽到 `use client` 组件中（例如 `CopyButton`、新增订单表单）。

### 8.2 命名风格

- 历史原因：`products` 表字段使用 camelCase，新增订单相关表使用 snake_case。
- 在写 Supabase 查询与插入时，必须使用 **真实数据库字段名**，注意区分：

  - 示例：
    - `products.resourceStorageUrl`
    - `order_items.resource_storage_url`

### 8.3 订单状态（当前约定）

- 创建订单时写入：`status = 'pending'`。
- 暂未实现：
  - 发送成功后自动更新 `status = 'fulfilled'`；
  - 基于状态变化写入 `order_events`。
- 后续可以根据业务需求增加状态枚举（`paid/refunded/cancelled` 等）。

---

## 9. FAQ / 排错

### 9.1 Server 组件中使用 onClick 报错

**现象：**

- 报错信息类似：  
  `Event handlers cannot be passed to Client Component props...`

**原因：**

- 在 Server Component 中直接使用了 `onClick` 等事件处理。

**解决：**

- 把有事件的部分提取到单独文件，并在文件顶部加上：

  ```ts
  'use client'
  ```


## 10. 路线图（建议）

以下为后续可以考虑的迭代方向：

- **订单状态流转**
  - 在发送成功后自动更新订单状态：`pending → fulfilled`。
  - 同时写入 `order_events`，记录触发来源与结果（如手动触发 / 自动触发 / 重发）。

- **重发与失败重试**
  - 在订单详情的“发送记录”表格中提供“重发”操作。
  - 对 `status = 'failed'` 的记录支持重试，并保留失败原因与重试次数。
  - 可选：给失败记录增加告警机制（邮件/IM 通知运维或管理员）。

- **自动发送**
  - 使用 Supabase Edge Functions / Cron Jobs / Database Triggers：
    - 当订单满足条件（如支付成功、状态变更为某个值）时自动：
      - 汇总资源链接与商品明细
      - 创建/更新 `order_deliveries`（status = 'pending' → 'sent'）
      - 调用外部邮件/IM API 完成发送
  - 为自动发送增加防重机制（同一订单在一定时间内只自动发送一次）。

- **支付集成**
  - 新增 `payments` 表，存储支付渠道、交易号、金额与状态。
  - 对接微信/支付宝/Stripe 等支付网关及其回调。
  - 将订单状态与支付状态打通：如 `pending → paid → fulfilled / refunded`。

- **权限与审计**
  - 使用 Supabase Auth + RLS，区分后台管理员/操作员。
  - 为关键操作（删除订单、修改状态、重发资源等）记录审计日志。
  - 在 UI 中展示操作人、操作时间，便于排查问题。