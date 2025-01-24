"use client";

import { useEffect, useState } from "react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Image from "next/image";
import Input from "@/components/input";
import { Wallpaper } from "@/types/wallpaper";
import Wallpapers from "@/components/wallpapers";

export default function Home() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);

  const fetchWallpapers = async function () {
    const result = await fetch("/api/get-wallpapers");
    const { data } = await result.json();

    if (data) {
      setWallpapers(data);
    }
  };

  //这是一个事件
  useEffect(() => {
    fetchWallpapers();
  }, []);

  //这是客户端渲染的方式，就是一上来不会拿数据。而是走到return拿页面，加载完之后会触发useEffect事件，那就会调fetchWallpapers方法获取数据。
  //获取data之后，会通过useState方法，将数据设置到全局的变量 wallpapers中，然后通过wallpapers渲染到页面中。
  //所以体感就是页面先出来，数据晚一点再出来。有异步的感觉 体验会好一点。但是seo就不友好，而且每次渲染都会请求一次接口。
  return (
    <div className="w-screen h-screen">
      <Header />
      <Hero />
      <Input setWallpapers={setWallpapers} />
      <Wallpapers wallpapers={wallpapers} />
      <Footer />
    </div>
  );
}
