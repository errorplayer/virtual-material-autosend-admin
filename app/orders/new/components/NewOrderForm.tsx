'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useMemo, useState } from 'react'
import type { Tables } from '@/types/database'

type Product = Pick<Tables<'products'>, 'id' | 'name' | 'price' | 'stock' | 'resourceStorageUrl'>

type DraftItem = {
  product_id: string
  quantity: number
}

export default function NewOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [customer_contact, setCustomerContact] = useState('')
  const [customer_name, setCustomerName] = useState('')
  const [note, setNote] = useState('')

  const [items, setItems] = useState<DraftItem[]>([
    { product_id: '', quantity: 1 },
  ])

  const productById = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const totals = useMemo(() => {
    let subtotal = 0
    let totalQty = 0
    let kinds = 0

    for (const it of items) {
      if (!it.product_id) continue
      const p = productById.get(it.product_id)
      if (!p) continue
      kinds += 1
      totalQty += it.quantity
      subtotal += Number(p.price) * it.quantity
    }

    return { subtotal, totalQty, kinds }
  }, [items, productById])

  const addRow = () => setItems(prev => [...prev, { product_id: '', quantity: 1 }])
  const removeRow = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx))

  const updateRow = (idx: number, patch: Partial<DraftItem>) =>
    setItems(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    if (!customer_contact.trim()) {
      alert('请填写接收方（customer_contact）')
      return
    }

    const validItems = items.filter(i => i.product_id && i.quantity > 0)
    if (validItems.length === 0) {
      alert('请至少选择 1 个商品并填写数量')
      return
    }

    // 组装 order_items 插入数据（带快照）
    const itemRows = validItems.map(it => {
      const p = productById.get(it.product_id)
      if (!p) throw new Error('商品不存在或已下架')

      const unit_price = Number(p.price)
      const line_total = unit_price * it.quantity

      return {
        product_id: it.product_id,
        product_name: p.name,
        unit_price,
        quantity: it.quantity,
        line_total,
        resource_storage_url: p.resourceStorageUrl ?? null,
      }
    })

    const subtotal = itemRows.reduce((s, r) => s + r.line_total, 0)
    const discount_total = 0
    const total_amount = subtotal - discount_total

    // 生成一个简单可读的订单号（你也可以后续改成数据库生成）
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ts =
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      '-' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds())
    const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
    const order_no = `ORD-${ts}-${rand}`

    setSaving(true)
    try {
      // 1) 插入 orders
      const { data: orderInserted, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            order_no,
            status: 'pending',
            customer_contact: customer_contact.trim(),
            customer_name: customer_name.trim() ? customer_name.trim() : null,
            note: note.trim() ? note.trim() : null,
            currency: 'CNY',
            subtotal,
            discount_total,
            total_amount,
          },
        ])
        .select('id')
        .single()

      if (orderErr) {
        alert('创建订单失败：' + orderErr.message)
        return
      }

      // 2) 插入 order_items（带 order_id）
      const order_id = orderInserted.id
      const { error: itemsErr } = await supabase.from('order_items').insert(
        itemRows.map(r => ({
          order_id,
          ...r,
        }))
      )

      if (itemsErr) {
        alert('创建订单明细失败：' + itemsErr.message)
        return
      }

      // 成功：回到列表
      router.push('/orders')
      router.refresh()
    } catch (err: any) {
      alert(err?.message ? String(err.message) : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">接收方 *</label>
          <input
            value={customer_contact}
            onChange={e => setCustomerContact(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如邮箱/微信号/手机号"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">姓名（可选）</label>
          <input
            value={customer_name}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">备注（可选）</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">商品明细</h2>
          <button
            type="button"
            onClick={addRow}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
          >
            添加商品
          </button>
        </div>

        <div className="space-y-3">
          {items.map((row, idx) => {
            const p = row.product_id ? productById.get(row.product_id) : undefined
            const lineTotal = p ? Number(p.price) * row.quantity : 0

            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-end border border-gray-200 rounded-md p-3"
              >
                <div className="col-span-7">
                  <label className="block text-gray-700 mb-1">商品</label>
                  <select
                    value={row.product_id}
                    onChange={e => updateRow(idx, { product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">请选择商品</option>
                    {products.map(pp => (
                      <option key={pp.id} value={pp.id}>
                        {pp.name}（¥{Number(pp.price).toFixed(2)} / 库存 {pp.stock}）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={e => updateRow(idx, { quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-gray-500">小计</div>
                  <div className="font-semibold">¥{lineTotal.toFixed(2)}</div>
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={items.length === 1}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-300"
                    title={items.length === 1 ? '至少保留一行' : '删除该行'}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-gray-700">
            {totals.kinds} 种 / 共 {totals.totalQty} 件
          </div>
          <div className="text-lg font-bold">合计：¥{totals.subtotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/orders"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
        >
          返回
        </a>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {saving ? '创建中...' : '创建订单'}
        </button>
      </div>
    </form>
  )
}