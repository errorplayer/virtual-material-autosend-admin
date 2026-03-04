import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img1.baidu.com',
        port: '',
        // pathname: '/it/u=*,*&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      }, 
      {
        protocol: 'https',
        hostname: 'gimg2.baidu.com',
        port: '',
        // pathname: '/it/u=*,*&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },
      {
        protocol: 'https',
        hostname: 'pic.rmb.bdstatic.com',
        port: '',
        // pathname: '/it/u=*,*&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },
      {
        protocol: 'https',
        hostname: 'zhengxin-pub.cdn.bcebos.com',
        port: '',
        // pathname: '/it/u=*,*&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },
      {
        protocol: 'https',
        hostname: 'p2.itc.cn',
        port: '',
        // pathname: '/it/u=*,*&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },]
  }
};


export default nextConfig;
