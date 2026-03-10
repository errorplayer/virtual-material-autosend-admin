import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function DeleteOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  async function deleteOrderAction() {
    'use server'
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) {
      // 简单处理：用 querystring 带回去也行；先直接抛错让 Next 显示
      throw new Error(error.message)
    }
    redirect('/orders')
  }

  return (
    <main className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">删除订单</h1>
      <p className="text-gray-700">确定要删除该订单吗？此操作不可恢复。</p>

      <div className="flex gap-3">
        <a
          href={`/orders/${id}`}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
        >
          取消
        </a>

        <form action={deleteOrderAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            确认删除
          </button>
        </form>
      </div>
    </main>
  )
}