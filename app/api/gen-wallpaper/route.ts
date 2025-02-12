import { auth, currentUser } from "@clerk/nextjs";

import { ImageGenerateParams } from "openai/resources/images.mjs";
import { User } from "@/types/user";
import { Wallpaper } from "@/types/wallpaper";
import { downloadAndUploadImage } from "@/lib/s3";
import { getOpenAIClient } from "@/service/openai";
import { getUserCredits } from "@/service/order";
import { insertUser } from "@/models/user";
import { insertWallpaper } from "@/models/wallpaper";

export async function POST(req: Request) {
  const { description } = await req.json();

  //生成壁纸前鉴权，如果登陆了且积分够，才可以生成。否则不行。

  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return Response.json({
      code: -2,
      message: "user not login",
    });
  }

  const user_email = user.emailAddresses[0].emailAddress;
  const credits = await getUserCredits(user_email);
  console.log("credits", credits);
  //积分只是拿来判断，不用入库。
  if (credits.left_credits < 0) {
    //为了测试暂时去掉积分验证
    //if (credits.left_credits < 150) {
    return Response.json({
      code: -1,
      message: "credits is not enough",
    });
  }

  const nickname = user.firstName;
  const avatarUrl = user.imageUrl;
  const userInfo: User = {
    email: user_email,
    nickname: nickname || "",
    avatar_url: avatarUrl,
  };
  //这里还得改下，如果邮箱不存在就查入，存在就更新。 这个简单业务逻辑直接让cursor生成就可以。
  //await insertUser(userInfo); 调试用，user先不入库

  console.log("description is ", description);

  const client = getOpenAIClient();

  const img_size = "1792x1024";
  const llm_name = "dall-e-3";
  const llm_params: ImageGenerateParams = {
    prompt: `generate a desktop wallpaper about: ${description}`,
    model: llm_name,
    n: 1,
    quality: "hd",
    response_format: "url",
    size: img_size,
    style: "natural",
  };
  //const result = await client.images.generate(llm_params);

  //console.log("generate wallpaper result: ", result);

  //const raw_img_url = result.data[0].url; // openai dall-e img url
  const raw_img_url =
    "http://oss.launcher.tcloudfamily.com/beidou/99ef8358fef54473a244e7087f7a5e36.png?md5=a60437fb43edd000a6b050032609180e"; //这个用于测试 暂时写死。
  if (!raw_img_url) {
    return Response.json({
      code: -1,
      message: "generate wallpaper failed",
    });
  }

  const img_name = encodeURIComponent(description); //图片名字就把desc编码一下作为图片名字
  const s3_img = await downloadAndUploadImage(
    raw_img_url,
    process.env.AWS_BUCKET || "aiwallpaper-demo",
    `wallpapers/${img_name}.png`
  );
  const img_url = s3_img.Location; //这个location就是新的图片地址
  //const img_url = raw_img_url;

  const created_at = new Date().toISOString();

  const wallpaper: Wallpaper = {
    user_email: user_email,
    img_description: description,
    img_size: img_size,
    img_url: img_url,
    llm_name: llm_name,
    llm_params: JSON.stringify(llm_params),
    created_at: created_at,
  };
  await insertWallpaper(wallpaper);

  return Response.json({
    code: 0,
    message: "ok",
    data: wallpaper, //直接返回最新的对象。
  });
}
