import { loadTossPayments } from "@tosspayments/payment-sdk";

// 환경 변수에서 가져오기
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || '';

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
  if (!TOSS_CLIENT_KEY) {
    throw new Error('Toss Payments 클라이언트 키가 설정되지 않았습니다. VITE_TOSS_CLIENT_KEY 환경 변수를 설정해주세요.');
  }
  
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
