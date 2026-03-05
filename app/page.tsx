// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center p-8">
//       {/* 测试Tailwind样式：红色文字、2倍字体、居中 */}
//       <h1 className="text-2xl font-bold text-red-500">Tailwind测试</h1>
//       <p className="mt-4 text-blue-400">如果文字是红色/蓝色，说明Tailwind生效了</p>
//     </main>
//   );
// }
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  // const [message, setMessage] = useState('加载中...');

  // useEffect(() => {
  //   async function testConnection() {
  //     const { data, error } = await supabase.from('messages').select('*');

  //     if (error) {
  //       setMessage('连接成功！但还没有 messages 表：' + error.message);
  //     } else {
  //       setMessage('✅ Next.js + Supabase 今天是2026年3月2日！数据：' + JSON.stringify(data));
  //     }
  //   }

  //   testConnection();
  // }, []);

  return (
    <main >
      <div>
        <h1>商品管理系统</h1>
        <h2>loading...</h2>

      </div>

    </main>
  );
}