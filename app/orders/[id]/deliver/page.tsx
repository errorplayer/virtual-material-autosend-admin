import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import CopyButton from './components/CopyButton'

export default async function DeliverOrderPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    // 先拉订单与明细
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, order_no, customer_contact')
        .eq('id', id)
        .single()

    if (orderErr || !order) {
        return (
            <main className="p-8 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-red-600">加载失败</h1>
                <p>{orderErr?.message ?? '订单不存在'}</p>
                <a className="text-blue-600 hover:text-blue-800" href={`/orders/${id}`}>
                    返回
                </a>
            </main>
        )
    }

    const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('product_name, quantity, resource_storage_url')
        .eq('order_id', id)
        .order('created_at', { ascending: true })

    if (itemsErr) {
        return (
            <main className="p-8 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-red-600">加载失败</h1>
                <p>{itemsErr.message}</p>
                <a className="text-blue-600 hover:text-blue-800" href={`/orders/${id}`}>
                    返回
                </a>
            </main>
        )
    }

    const links = (items ?? [])
        .map(i => i.resource_storage_url)
        .filter(Boolean) as string[]

    const lines = (items ?? []).map(i => {
        const name = i.product_name ?? '商品'
        return `- ${name} x ${i.quantity}`
    })

    const message = [
        `订单号：${order.order_no ?? order.id}`,
        `接收方：${order.customer_contact ?? '-'}`,
        '',
        '商品明细：',
        ...lines,
        '',
        '资源链接：',
        ...(links.length ? links.map(u => `- ${u}`) : ['- （无）']),
    ].join('\n')

    async function recordDeliveryAction(formData: FormData) {
        'use server'
        const channel = String(formData.get('channel') ?? 'manual')
        const target = String(formData.get('target') ?? '') || null

        const payload = {
            orderId: id,
            orderNo: order.order_no,
            message,
            links,
            itemCount: (items ?? []).length,
        }

        const { error } = await supabase.from('order_deliveries').insert([
            {
                order_id: id,
                channel,
                target,
                status: 'sent',
                payload,
                sent_at: new Date().toISOString(),
            },
        ])

        if (error) {
            // 写一条失败记录（可选：你也可以直接 throw）
            await supabase.from('order_deliveries').insert([
                {
                    order_id: id,
                    channel,
                    target,
                    status: 'failed',
                    payload,
                    error_message: error.message,
                },
            ])
            throw new Error(error.message)
        }

        redirect(`/orders/${id}?delivered=1`)
    }

    return (
        <main className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">发送资源链接（手动）</h1>
                <a className="text-blue-600 hover:text-blue-800" href={`/orders/${id}`}>
                    返回
                </a>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <div>
                    <div className="text-sm text-gray-500 mb-1">将发送/复制的内容</div>
                    <pre className="whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-md p-4 text-sm">
                        {message}
                    </pre>
                </div>
                <div className="flex gap-3">
                    <CopyButton text={message} />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-800">记录一次“已发送”</h2>

                <form action={recordDeliveryAction} className="space-y-3">
                    <div>
                        <label className="block text-gray-700 mb-1">渠道</label>
                        <select
                            name="channel"
                            defaultValue="manual"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="manual">manual（人工）</option>
                            <option value="wechat">wechat</option>
                            <option value="email">email</option>
                            <option value="telegram">telegram</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">发送目标（可选）</label>
                        <input
                            name="target"
                            defaultValue={order.customer_contact ?? ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="例如邮箱/微信号"
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        记录为已发送
                    </button>
                </form>
            </div>
        </main>
    )
}