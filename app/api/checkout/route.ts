import { insertOrder, updateOrderSession } from "@/models/order";

import { Order } from "@/types/order";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs";

export async function POST(req: Request) {
  // 0. 获取当前登录用户的标识
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return Response.json("not login");
  }
  const user_email = user.emailAddresses[0].emailAddress;
  console.log("user_email", user_email);

  // 1. 获取下单参数
  const params = await req.json();
  console.log("params", params);

  const currentDate = new Date();
  const oneMonthLater = new Date(currentDate);
  oneMonthLater.setMonth(currentDate.getMonth() + 1); //过期时间是当前时间再加一个月。下单的时间+一个月就可以。 更精确点可以做到付款之后（回调的时候）再加一个月。一般多数时候这两个时间差不多的。

  const created_at = currentDate.toISOString();
  const expired_at = oneMonthLater.toISOString();
  const order_no = new Date().getMilliseconds(); //订单号要保证唯一性，一般是雪花id或者时间戳，这里时间戳（当前的毫秒数）

  // 2. 创建订单
  const order: Order = {
    order_no: order_no.toString(),
    created_at: created_at,
    user_email: user_email,
    amount: params.amount,
    plan: params.plan,
    expired_at: expired_at,
    order_status: 1,
    credits: params.credits,
  };
  console.log("order", order);
  // 把订单保存到 db
  await insertOrder(order);

  // 3. 调 stripe 下单
  //3.1、创建 stripe 对象，把私钥传进去
  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
  //3.2 调create方法下单、这些参数怎么传 看stripe文档即可。
  const session = await stripe.checkout.sessions.create({
    customer_email: user_email,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "aiwallpaper.demo credits plan",
          },
          unit_amount: params.amount,
          recurring:
            params.plan === "monthly"
              ? {
                  interval: "month",
                }
              : undefined,
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: false, //是否允许促销码，这里先不允许
    metadata: {
      //这是自定义的参数
      project: "aiwallpaper-demo", //项目名
      pay_scene: "buy-credits", //描述是干嘛的，这里就是买积分的。
      order_no: order_no.toString(), //订单号
      user_email: user_email,
      credits: params.credits,
    },
    mode: params.plan === "monthly" ? "subscription" : "payment", //这里就是选择是订阅模式（subscription）还是一次性模式（payment）的。
    success_url: `${process.env.WEB_BASE_URI}/pay-success/{CHECKOUT_SESSION_ID}`, //成功支付跳转的页面 。CHECKOUT_SESSION_ID从哪里获取？这个是 stripe 给的，在文档里面有。
    cancel_url: `${process.env.WEB_BASE_URI}/pricing`, //取消支付跳转的页面
  });

  console.log("pay result", session);

  // 4. 更新支付标识
  const stripe_session_id = session.id;
  console.log("stripe session id", stripe_session_id);
  await updateOrderSession(order_no.toString(), stripe_session_id);

  return Response.json({
    code: 0,
    message: "ok",
    data: {
      public_key: process.env.STRIPE_PUBLIC_KEY,
      order_no: order_no.toString(),
      session_id: stripe_session_id,
    },
  });
}
