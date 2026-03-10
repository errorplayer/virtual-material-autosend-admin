import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type OrderRow = Tables<'orders'> & {
  order_items: Pick<Tables<'order_items'>, 'quantity' | 'product_name'>[]
}

function buildSummary(items: OrderRow['order_items']) {
  const kinds = items.length
  const totalQty = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0)
  const names = items
    .map(i => i.product_name)
    .filter(Boolean)
    .slice(0, 3)
    .join('、')

  return {
    kinds,
    totalQty,
    names,
  }
}

export default async function OrdersPage() {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_no,
      status,
      customer_contact,
      total_amount,
      created_at,
      order_items (
        quantity,
        product_name
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-600">加载失败</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">订单管理</h1>
        <a
          href="/orders/new"
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
        >
          新增订单
        </a>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full bg-white rounded-lg shadow-lg">
          <thead className="bg-gray-200 border-b border-gray-300">
            <tr>
              <th className="py-4 px-6 text-left text-gray-700">订单号</th>
              <th className="py-4 px-6 text-left text-gray-700">接收方</th>
              <th className="py-4 px-6 text-left text-gray-700">状态</th>
              <th className="py-4 px-6 text-left text-gray-700">金额</th>
              <th className="py-4 px-6 text-left text-gray-700">商品摘要</th>
              <th className="py-4 px-6 text-left text-gray-700">创建时间</th>
              <th className="py-4 px-6 text-left text-gray-700">操作</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 px-6 text-center text-gray-500">
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map(o => {
                const s = buildSummary(o.order_items ?? [])
                return (
                  <tr key={o.id} className="hover:bg-gray-100">
                    <td className="py-4 px-6 border-b">{o.order_no ?? '-'}</td>
                    <td className="py-4 px-6 border-b">{o.customer_contact ?? '-'}</td>
                    <td className="py-4 px-6 border-b">{o.status}</td>
                    <td className="py-4 px-6 border-b">¥{Number(o.total_amount ?? 0).toFixed(2)}</td>
                    <td className="py-4 px-6 border-b">
                      {s.kinds} 种 / 共 {s.totalQty} 件
                      {s.names ? <span className="text-gray-500">（{s.names}）</span> : null}
                    </td>
                    <td className="py-4 px-6 border-b">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 border-b">
                      <a
                        href={`/orders/${o.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        查看
                      </a>
                      <a
                        href={`/orders/${o.id}/delete`}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}