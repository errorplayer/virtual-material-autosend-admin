export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  created_at: string;
  updated_at: string;
  coverImagePath: string;
  resourceStorageUrl: string;  // 新增：资源文件路径
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  description: string;
  coverImagePath: string;
  resourceStorageUrl: string;
}