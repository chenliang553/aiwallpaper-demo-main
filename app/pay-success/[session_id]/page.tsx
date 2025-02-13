import Stripe from "stripe";
import { redirect } from "next/navigation";
import { updateOrderStatus } from "@/models/order";

export default async function ({ params }: { params: { session_id: string } }) {
  console.log("pay callback id", params.session_id);

  //回调的时候要验证订单的有效性。
  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
  try {
    //用retrieve方法拿到session信息，
    const session = await stripe.checkout.sessions.retrieve(params.session_id);
    console.log("order session: ", session);

    console.log("metadata", session.metadata);
    //这里拿订单号校验，如果拿不到订单号 也可以说明这个订单有问题。
    if (!session || !session.metadata || !session.metadata.order_no) {
      console.log("invalid session", params.session_id);
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paied_at = new Date().toISOString();
    //这里如果做严谨一点，过期时间在这里更新一下就更精确。但其实一般来说，区别不大，前面下单的时候也说了。
    updateOrderStatus(order_no, 2, paied_at);
    console.log("update success order status: ", order_no, paied_at);

    redirect("/");
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}
