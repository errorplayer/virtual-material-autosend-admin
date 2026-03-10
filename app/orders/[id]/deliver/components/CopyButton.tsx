'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-black transition"
    >
      {copied ? '已复制' : '复制到剪贴板'}
    </button>
  )
}