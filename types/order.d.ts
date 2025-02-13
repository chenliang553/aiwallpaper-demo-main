export interface Order {
  order_no: string;
  created_at: string;
  user_email: string; //用户的唯一标识，这里用邮箱号
  amount: number;
  plan: string; //付费策略：月付，还是一次付费。
  expired_at: string; //过期时间。 你会员到期了就不能用了。
  order_status: number; //订单状态，肯定要的。刚下单是已下单，付款完成是已完成状态。
  paied_at?: string; //付款时间
  stripe_session_id?: string; //stripe的一个凭证，每支付成功一笔就有一个这个id
  credits: number; //每次买多少积分
}
