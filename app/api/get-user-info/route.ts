import { currentUser } from "@clerk/nextjs";
import { getUserCredits } from "@/service/order";

//这个方法主要就是获取用户的 所有有效积分
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return Response.json("not login");
  }
  const user_email = user.emailAddresses[0].emailAddress;

  const user_credis = await getUserCredits(user_email);
  console.log("user_credis", user_credis);

  return Response.json({
    code: 0,
    message: "ok",
    data: {
      credits: user_credis,
    },
  });
}
