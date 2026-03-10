import { supabase } from '@/lib/supabase'
import NewOrderForm from './components/NewOrderForm'
import type { Tables } from '@/types/database'

export default async function NewOrderPage() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,price,stock,resourceStorageUrl')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-600">加载失败</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">新增订单</h1>
      <NewOrderForm products={(data ?? []) as Tables<'products'>[]} />
    </main>
  )
}