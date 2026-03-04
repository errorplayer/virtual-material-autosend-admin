'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';  // 添加 supabase 导入
import { Product, ProductFormData } from '@/types/product';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const BUCKET_NAME = 'product-resources';  // 你的 bucket 名称

interface ProductFormProps {
  initialData?: Product;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
}

export default function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    coverImagePath: '',
    resourceStorageUrl: '',
  });

   // 新增：文件上传相关的 state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  // 初始化编辑数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price,
        stock: initialData.stock,
        description: initialData.description || '',
        coverImagePath: initialData.coverImagePath || '',
        resourceStorageUrl: initialData.resourceStorageUrl || '',
      });

      // 设置已存在的文件名
      if (initialData.resourceStorageUrl) {
        const urlParts = initialData.resourceStorageUrl.split('/');
        setFileName(urlParts[urlParts.length - 1] || '');
      }
    }
  }, [initialData]);

  // 新增：处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.zip')) {
      alert('只能上传 .zip 格式的文件');
      return;
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      alert('文件大小不能超过 3MB');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
  };

  // 新增：上传文件到 Supabase Storage
   const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) {
      // 如果没有新选择的文件，但有已存在的资源链接，返回现有链接
      // 如果没有（已删除或本来就是空的），返回空字符串
      if (formData.resourceStorageUrl) {
        return formData.resourceStorageUrl;
      }
      return '';  // 明确返回空字符串而不是 null
    }


    setUploading(true);
    try {
      // 生成唯一文件名：时间戳 + 原文件名
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name}`;
      const filePath = `temp_public/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        alert('文件上传失败：' + error.message);
        return null;
      }

      // 获取文件的 public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      setUploading(false);
      return urlData.publicUrl;
    } catch (error) {
      setUploading(false);
      alert('上传过程中出现错误');
      return null;
    }
  };

  // 新增：删除 Storage 中的文件
  const deleteFile = async (fileUrl: string) => {
    if (!fileUrl) return;
    

    // 从 URL 中提取文件路径
    const urlParts = fileUrl.split('/storage/v1/object/public/product-resources/');
    const filePath = urlParts[1];

    if (!filePath) {
      alert('无法解析文件路径');
      return;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      alert('删除文件失败：' + error.message);
    } else {
      setFormData(prev => ({ ...prev, resourceStorageUrl: '' }));
      setFileName('');
      setSelectedFile(null);
    }
  };




  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    // 简单验证
    if (!formData.name.trim()) {
      alert('请输入商品名称');
      return;
    }
    if (formData.price < 0 || formData.stock < 0) {
      alert('价格和库存不能为负数');
      return;
    }

    // 如果选择了新文件，先上传
    const uploadedUrl = await uploadFile();
    if (uploadedUrl === null) {
      return; // 上传失败，取消保存
    }

    // 更新 formData 中的资源路径
    const finalData = {
      ...formData,
      resourceStorageUrl: uploadedUrl,
    };

    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 mb-1" htmlFor="name">
          商品名称 *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1" htmlFor="price">
          价格（元）*
        </label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1" htmlFor="stock">
          库存数量 *
        </label>
        <input
          type="number"
          id="stock"
          name="stock"
          min="0"
          value={formData.stock}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1" htmlFor="description">
          商品描述
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1" htmlFor="coverImagePath">
          封面图地址
        </label>
        <textarea
          id="coverImagePath"
          name="coverImagePath"
          value={formData.coverImagePath}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

   

      {/* 新增：资源文件上传 */}
      <div>
        <label className="block text-gray-700 mb-1">
          资源文件（仅支持 .zip，最大 3MB）
        </label>
        
        {/* 已上传文件显示 */}
        {fileName && !selectedFile && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md mb-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={() => deleteFile(formData.resourceStorageUrl)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              删除
            </button>
          </div>
        )}

        {/* 新选择文件显示 */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md mb-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-blue-700">{selectedFile.name}</span>
              <span className="text-xs text-blue-500 ml-2">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setFileName(formData.resourceStorageUrl ? fileName : '');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              取消
            </button>
          </div>
        )}

        {/* 文件选择输入 */}
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={uploading}
        />
        
        {uploading && (
          <p className="text-sm text-blue-600 mt-1">文件上传中...</p>
        )}
      </div>


      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
        >
          取消
        </button>
                <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {uploading ? '上传中...' : '保存'}
        </button>

      </div>
    </form>
  );
}