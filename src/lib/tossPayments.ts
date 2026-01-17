import { loadTossPayments } from "@tosspayments/payment-sdk";

const TOSS_CLIENT_KEY = "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";

type TossPaymentParams = {
  amount: number;
  orderName: string;
  customerName?: string;
  orderId?: string;
};

export const requestTossPayment = async ({
  amount,
  orderName,
  customerName = "구매자",
  orderId = `order-${Date.now()}`,
}: TossPaymentParams) => {
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  const successParams = new URLSearchParams({
    payment: "success",
    orderId,
    amount: String(amount),
    orderName,
  });
  const failParams = new URLSearchParams({
    payment: "fail",
  });
  return tossPayments.requestPayment("CARD", {
    amount,
    orderId,
    orderName,
    customerName,
    successUrl: `${window.location.origin}/my-page?${successParams.toString()}`,
    failUrl: `${window.location.origin}/my-page?${failParams.toString()}`,
  });
};
