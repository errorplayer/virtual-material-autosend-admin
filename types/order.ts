import type { Tables } from './database'

export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>

export type OrderItemDraft = {
  product_id: string
  quantity: number
}

export type CreateOrderDraft = {
  customer_contact: string
  customer_name?: string
  note?: string
  items: OrderItemDraft[]
}