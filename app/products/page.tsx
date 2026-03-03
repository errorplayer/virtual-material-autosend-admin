import { supabase } from '@/lib/supabase';
import ProductList from './components/ProductList';
import { Product } from '@/types/product';

// 服务器端获取商品数据
export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-600">加载失败</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">商品管理系统</h1>
      <ProductList initialProducts={products as Product[]} />
    </main>
  );
}