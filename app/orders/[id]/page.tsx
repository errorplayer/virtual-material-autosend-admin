import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type OrderWithItems = Tables<'orders'> & {
  order_items: Tables<'order_items'>[]
  order_deliveries: Tables<'order_deliveries'>[]
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        line_total,
        resource_storage_url,
        created_at
      ),
      order_deliveries (
    id,
    status,
    channel,
    target,
    error_message,
    sent_at,
    created_at
  )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-red-600">加载失败</h1>
        <p>{error?.message ?? '订单不存在'}</p>
        <a className="text-blue-600 hover:text-blue-800" href="/orders">
          返回订单列表
        </a>
      </div>
    )
  }

  const order = data as unknown as OrderWithItems
  const items = order.order_items ?? []

  const kinds = items.length
  const totalQty = items.reduce((s, it) => s + (it.quantity ?? 0), 0)

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">订单详情</h1>
        <a
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
          href={`/orders/${order.id}/deliver`}
        >
          发送资源链接
        </a>
        <a className="text-blue-600 hover:text-blue-800" href="/orders">
          返回
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-2">
        <div className="text-gray-700">
          <span className="font-semibold">订单号：</span>
          {order.order_no ?? '-'}
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">接收方：</span>
          {order.customer_contact ?? '-'}
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">状态：</span>
          {order.status}
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">商品：</span>
          {kinds} 种 / 共 {totalQty} 件
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">金额：</span>¥
          {Number(order.total_amount ?? 0).toFixed(2)}
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">创建时间：</span>
          {new Date(order.created_at).toLocaleString()}
        </div>
        {order.note ? (
          <div className="text-gray-700">
            <span className="font-semibold">备注：</span>
            {order.note}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">订单明细</h2>

        <div className="overflow-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-gray-700">商品</th>
                <th className="py-3 px-4 text-left text-gray-700">单价</th>
                <th className="py-3 px-4 text-left text-gray-700">数量</th>
                <th className="py-3 px-4 text-left text-gray-700">小计</th>
                <th className="py-3 px-4 text-left text-gray-700">资源链接</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b">
                  <td className="py-3 px-4">{it.product_name ?? it.product_id}</td>
                  <td className="py-3 px-4">
                    ¥{Number(it.unit_price ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">{it.quantity}</td>
                  <td className="py-3 px-4">
                    ¥{Number(it.line_total ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {it.resource_storage_url ? (
                      <a
                        className="text-blue-600 hover:text-blue-800"
                        href={it.resource_storage_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        打开
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
                    无明细
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-gray-800">发送记录</h2>
    <a
      className="text-blue-600 hover:text-blue-800"
      href={`/orders/${order.id}/deliver`}
    >
      去发送/记录
    </a>
  </div>

  <div className="overflow-auto">
    <table className="min-w-full bg-white rounded-lg">
      <thead className="bg-gray-200 border-b border-gray-300">
        <tr>
          <th className="py-3 px-4 text-left text-gray-700">状态</th>
          <th className="py-3 px-4 text-left text-gray-700">渠道</th>
          <th className="py-3 px-4 text-left text-gray-700">目标</th>
          <th className="py-3 px-4 text-left text-gray-700">时间</th>
          <th className="py-3 px-4 text-left text-gray-700">错误</th>
        </tr>
      </thead>

      <tbody>
        {(order.order_deliveries ?? []).length === 0 ? (
          <tr>
            <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
              暂无发送记录
            </td>
          </tr>
        ) : (
          (order.order_deliveries ?? [])
            .slice()
            .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
            .slice(0, 5)
            .map(d => (
              <tr key={d.id} className="border-b">
                <td className="py-3 px-4">{d.status}</td>
                <td className="py-3 px-4">{d.channel}</td>
                <td className="py-3 px-4">{d.target ?? '-'}</td>
                <td className="py-3 px-4">
                  {new Date(d.sent_at ?? d.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-red-600">
                  {d.error_message ?? '-'}
                </td>
              </tr>
            ))
        )}
      </tbody>
    </table>
  </div>
</div>
    </main>
  )
}