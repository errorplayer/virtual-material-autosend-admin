'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types/product';
import ProductForm from './ProductForm';
import { Inter } from 'next/font/google';
import Image from 'next/image';


// 引入字体
const inter = Inter({ subsets: ['latin'] });

interface ProductListProps {
  initialProducts: Product[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 打开新增表单
  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // 打开编辑表单
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // 删除商品
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该商品吗？')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('删除失败：' + error.message);
      return;
    }
    setProducts(products.filter(p => p.id !== id));
  };

  // 保存商品（新增/编辑）
  const handleSave = async (data: ProductFormData) => {
    if (editingProduct) {
      // 编辑现有商品
      const { data: updated, error } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id)
        .select();

      if (error) {
        alert('更新失败：' + error.message);
        return;
      }
      if (!updated || updated.length === 0) {
        alert('更新失败：返回数据为空');
        return;
      }
      setProducts(products.map(p => p.id === editingProduct.id ? updated[0] : p));
    } else {
      // 新增商品
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([data])
        .select();

      if (error) {
        alert('新增失败：' + error.message);
        return;
      }
      if (!newProduct || newProduct.length === 0) {
        alert('新增失败：返回数据为空');
        return;
      }
      setProducts([...products, newProduct[0]]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className={`${inter.className} flex flex-col h-full bg-gray-100 p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">商品列表</h2>
        <button
          onClick={handleAdd}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
        >
          新增商品
        </button>
      </div>

      {/* 商品表格 */}
      <div className="overflow-auto flex-1">
        <table className="min-w-full bg-white rounded-lg shadow-lg">
          <thead className="bg-gray-200 border-b border-gray-300">
            <tr>
              <th className="py-4 px-6 text-left text-gray-700">封面图片</th>
              <th className="py-4 px-6 text-left text-gray-700">商品名称</th>
              <th className="py-4 px-6 text-left text-gray-700">价格</th>
              <th className="py-4 px-6 text-left text-gray-700">库存</th>
              <th className="py-4 px-6 text-left text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0? (
              <tr>
                <td colSpan={4} className="py-6 px-6 text-center text-gray-500">
                  暂无商品数据
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-100">
                  <td className="py-4 px-6 border-b">
                            <Image
                                src={product.coverImagePath}
                                alt={product.name}
                                width={100}
                                height={100}
                            />
                        </td>
                  <td className="py-4 px-6 border-b">{product.name}</td>
                  <td className="py-4 px-6 border-b">¥{product.price.toFixed(2)}</td>
                  <td className="py-4 px-6 border-b">{product.stock}</td>
                  <td className="py-4 px-6 border-b">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑表单弹窗 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct? '编辑商品' : '新增商品'}
            </h3>
            <ProductForm
              initialData={editingProduct}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}