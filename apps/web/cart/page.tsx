"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { createOrder, processPayment } from "@/lib/api";

function formatPrice(val: number) {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
}

type PromotionRule = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
};

export default function CartAndCheckoutPage() {
  const router = useRouter();
  const { items, updateQty, removeFromCart, clearCart, totalQty, totalPrice } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CARD" | "VNPAY">("WALLET");
  const [simulateStockError, setSimulateStockError] = useState(false);
  const [simulatePaymentError, setSimulatePaymentError] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromotionRule | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<"NONE" | "STOCK_ERROR" | "PAYMENT_ERROR" | "GENERAL">("NONE");
  const [errorMsg, setErrorMsg] = useState("");

  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  // Hoisting function lên trên để useEffect bên dưới gọi được (Sửa lỗi no-use-before-define)
  function handleRemoveCoupon() {
    setCouponInput("");
    setAppliedPromo(null);
  }

  // Chuyển State thành Derived State (Bản chất: Không cần dùng useEffect để tính tiền giảm)
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    let discount = appliedPromo.type === "PERCENT"
      ? Math.round((totalPrice * appliedPromo.value) / 100)
      : appliedPromo.value;
      
    if (appliedPromo.maxDiscount && discount > appliedPromo.maxDiscount) {
      discount = appliedPromo.maxDiscount;
    }
    return discount;
  }, [totalPrice, appliedPromo]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentOrderId(null), 0);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    if (appliedPromo && totalPrice < appliedPromo.minOrderAmount) {
      const timer = setTimeout(() => {
        setErrorType("GENERAL");
        setErrorMsg(`Đơn hàng chưa đạt mức tối thiểu ${formatPrice(appliedPromo.minOrderAmount)} để duy trì mã ${appliedPromo.code}.`);
        handleRemoveCoupon();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [totalPrice, appliedPromo]);

  useEffect(() => {
    if (items.length === 0) {
      const timer = setTimeout(() => handleRemoveCoupon(), 0);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  const handleApplyCoupon = async () => {
    const rawCode = couponInput.trim().toUpperCase();
    if (!rawCode) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/promotions/${rawCode}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Lỗi truy xuất mã "${rawCode}".`);
      }

      const promo = await res.json();

      if (totalPrice < promo.minOrderAmount) {
        throw new Error(`Mã ${promo.code} chỉ áp dụng cho đơn hàng từ ${formatPrice(promo.minOrderAmount)} trở lên.`);
      }

      setAppliedPromo(promo);
      setErrorType("NONE");
      setErrorMsg("");
    } catch (err: unknown) {
      setErrorType("GENERAL");
      setErrorMsg(err instanceof Error ? err.message : "Lỗi không xác định khi áp dụng mã.");
      handleRemoveCoupon();
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    clearCart();
    handleRemoveCoupon();
    setErrorType("NONE");
    setErrorMsg("");
    setCurrentOrderId(null);
  };

  const finalTotal = Math.max(0, totalPrice - discountAmount);
  const loyaltyPoints = Math.floor(finalTotal / 10000);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setErrorMsg("");
    setErrorType("NONE");

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (simulateStockError) {
        throw new Error("STOCK_ERROR|⚠️ Lỗi tồn kho (Task 10.3): Sản phẩm hiện không đủ số lượng để khóa tồn kho.");
      }

      let orderIdToPay = currentOrderId;
      let isNewOrder = false;

      if (!orderIdToPay) {
        const orderPayload = items.map((it) => ({
          productId: it.productId,
          qty: it.qty,
          size: it.size,
          toppings: it.toppings,
        }));

        try {
          const newOrder = await createOrder(orderPayload, appliedPromo ? appliedPromo.code : undefined);
          orderIdToPay = newOrder.id;
          setCurrentOrderId(newOrder.id);
          isNewOrder = true;
        } catch (orderErr: unknown) {
          const msg = orderErr instanceof Error ? orderErr.message : "Lỗi tạo đơn";
          if (msg.toLowerCase().includes("stock") || msg.toLowerCase().includes("kho")) {
            throw new Error(`STOCK_ERROR|⚠️ Cảnh báo kho (Task 10.3): ${msg}`);
          }
          throw new Error(`GENERAL|${msg}`);
        }
      }

      if (!orderIdToPay) {
        throw new Error("GENERAL|Không thể khởi tạo mã đơn hàng hợp lệ.");
      }

      if (simulatePaymentError) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/orders/${orderIdToPay}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "PAYMENT_FAILED" }),
          });
        } catch {
          // Xóa bỏ biến e không sử dụng để vượt qua ESLint
        }
        throw new Error(`PAYMENT_ERROR|⏱ Thanh toán thất bại (Task 8): Cổng giao dịch ${paymentMethod} từ chối đơn hàng #${orderIdToPay}.`);
      }

      if (orderIdToPay && !isNewOrder) {
        const resetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/orders/${orderIdToPay}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "PENDING" }),
        });

        if (!resetRes.ok) {
           const errData = await resetRes.json();
           throw new Error(`STOCK_ERROR|${errData.message || "Không thể giữ lại nguyên liệu để thanh toán. Kho có thể đã hết."}`);
        }
      }

      if (paymentMethod === 'VNPAY') {
        const vnpayRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/vnpay/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({ orderId: orderIdToPay }),
        });

        if (!vnpayRes.ok) {
          const errData = await vnpayRes.json();
          throw new Error(`PAYMENT_ERROR|${errData.message || 'Không thể tạo cổng thanh toán VNPay'}`);
        }

        const data = await vnpayRes.json();
        const paymentUrl = typeof data === 'string' ? data : (data.paymentUrl || data.url);

        if (!paymentUrl) {
          throw new Error('PAYMENT_ERROR|Backend không trả về link thanh toán VNPay hợp lệ');
        }

        window.location.href = paymentUrl;
        return;
      }

      await processPayment(orderIdToPay, paymentMethod);
      router.push(`/order-confirmation?orderId=${orderIdToPay}`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      if (msg.startsWith("STOCK_ERROR|")) {
        setErrorType("STOCK_ERROR");
        setErrorMsg(msg.split("|")[1]);
      } else if (msg.startsWith("PAYMENT_ERROR|")) {
        setErrorType("PAYMENT_ERROR");
        setErrorMsg(msg.split("|")[1]);
      } else if (msg.startsWith("GENERAL|")) {
        setErrorType("GENERAL");
        setErrorMsg(msg.split("|")[1]);
      } else {
        setErrorType("GENERAL");
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#35251f]">
      <header className="border-b border-[#e9dfd4] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            BREW<span className="text-[#a16b4b]">LITE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/orders" className="rounded-full border border-[#e5d8ca] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[#a16b4b]">
              Lịch sử đơn
            </Link>
            <Link href="/" className="rounded-full bg-[#35251f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#634536]">
              ← Tiếp tục chọn món
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: "Georgia, serif" }}>Giỏ hàng & Thanh toán</h1>
        <p className="mt-2 text-sm text-[#8b796b]">Kiểm tra danh sách thức uống, áp dụng ưu đãi và thanh toán</p>

        {errorType === "STOCK_ERROR" && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 border border-amber-300 text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h4 className="font-bold text-sm">Sự cố tồn kho (Task 10.3 - Stock Lock)</h4>
                <p className="mt-1 text-xs">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorType === "PAYMENT_ERROR" && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 border border-red-300 text-red-800 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="font-bold text-sm">Giao dịch bị từ chối (Task 8 - PAYMENT_FAILED)</h4>
                <p className="mt-1 text-xs">{errorMsg}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatePaymentError(false);
                      handleCheckout();
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Thử lại thanh toán ngay
                  </button>
                  <span className="text-xs text-red-600">
                    Hoặc chọn đổi phương thức sang {paymentMethod === "WALLET" ? "CARD" : "WALLET"} bên dưới.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorType === "GENERAL" && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700">
            ⚠ {errorMsg}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#ddcbbb] bg-white p-16 text-center">
            <div className="text-4xl">☕</div>
            <h2 className="mt-4 text-xl font-black">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-2 text-sm text-[#8b796b]">Hãy khám phá menu để chọn những món yêu thích nhé.</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-[#35251f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#634536]">
              Xem thực đơn ngay
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-[#eee3d7] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8b796b]">Món đã chọn ({totalQty} món)</span>
                <button type="button" onClick={handleClearAll} className="text-xs font-semibold text-red-600 hover:underline">Xóa tất cả</button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#eee3d7] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Image 
                      src={item.image || "/images/latte.jpg"} 
                      alt={item.name} 
                      width={56} 
                      height={56} 
                      className="rounded-xl object-cover bg-[#f3e8db]" 
                    />
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-xs text-[#8b796b]">Size: {item.size} {item.toppings && item.toppings.length > 0 && `· ${item.toppings.join(", ")}`}</p>
                      <p className="text-xs font-bold text-[#a16b4b]">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-xl border border-[#e5d8ca] bg-[#faf7f2]">
                      <button type="button" onClick={() => updateQty(item.id, -1)} className="px-2.5 py-1 text-sm font-bold text-[#634536] hover:bg-[#eee3d7] rounded-l-xl">-</button>
                      <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)} className="px-2.5 py-1 text-sm font-bold text-[#634536] hover:bg-[#eee3d7] rounded-r-xl">+</button>
                    </div>
                    <p className="min-w-20 text-right font-black text-[#a16b4b]">{formatPrice(item.price * item.qty)}</p>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-stone-400 hover:text-red-500 text-lg font-bold">×</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-3xl border border-[#eee3d7] bg-white p-6 shadow-md">
                <h2 className="text-lg font-black" style={{ fontFamily: "Georgia, serif" }}>Phương thức thanh toán</h2>
                <div className="mt-4 space-y-3">
                  <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${paymentMethod === "WALLET" ? "border-[#a16b4b] bg-[#faf7f2]" : "border-[#e5d8ca]"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" value="WALLET" checked={paymentMethod === "WALLET"} onChange={() => setPaymentMethod("WALLET")} className="accent-[#a16b4b]" />
                      <div>
                        <p className="text-sm font-bold">WALLET (Ví điện tử BrewPay)</p>
                        <p className="text-xs text-[#8b796b]">Thanh toán qua số dư ví số</p>
                      </div>
                    </div>
                    <span className="text-xl">💳</span>
                  </label>

                  <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${paymentMethod === "CARD" ? "border-[#a16b4b] bg-[#faf7f2]" : "border-[#e5d8ca]"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" value="CARD" checked={paymentMethod === "CARD"} onChange={() => setPaymentMethod("CARD")} className="accent-[#a16b4b]" />
                      <div>
                        <p className="text-sm font-bold">CARD (Thẻ Ngân hàng / ATM)</p>
                        <p className="text-xs text-[#8b796b]">Cổng thanh toán thẻ nội địa</p>
                      </div>
                    </div>
                    <span className="text-xl">🦁</span>
                  </label>

                  <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${paymentMethod === "VNPAY" ? "border-blue-500 bg-blue-50" : "border-[#e5d8ca]"}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="VNPAY"
                        checked={paymentMethod === "VNPAY"}
                        onChange={() => setPaymentMethod("VNPAY")}
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          CỔNG VNPAY
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                            QR / ATM
                          </span>
                        </p>
                        <p className="text-xs text-blue-700">Quét mã QR qua App hoặc thẻ nội địa</p>
                      </div>
                    </div>
                    <span className="text-xl">🇻🇳</span>
                  </label>
                </div>

                <div className="mt-5 border-t border-[#eee3d7] pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#8b796b]">Mã ưu đãi (Task 10.4) Ví dụ: WELCOME5</label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi..."
                      value={appliedPromo ? appliedPromo.code : couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={!!appliedPromo}
                      className="w-full uppercase rounded-xl border border-[#e5d8ca] px-3 py-2 text-xs outline-none transition focus:border-[#a16b4b] disabled:bg-stone-100 font-semibold"
                    />
                    {appliedPromo ? (
                      <button type="button" onClick={handleRemoveCoupon} className="shrink-0 rounded-xl bg-red-100 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-200 transition">Gỡ mã</button>
                    ) : (
                      <button type="button" onClick={handleApplyCoupon} className="shrink-0 rounded-xl bg-[#35251f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#634536]">Áp dụng</button>
                    )}
                  </div>
                  {appliedPromo && <p className="mt-1.5 text-xs font-semibold text-green-600">✓ Đã áp dụng mã <strong>{appliedPromo.code}</strong>: Giảm {appliedPromo.value}% (Tiết kiệm {formatPrice(discountAmount)})</p>}
                </div>

                <div className="mt-5 rounded-2xl border border-stone-200 bg-[#faf7f2] p-3.5 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#8b796b]">Công cụ giả lập kiểm thử DOD</p>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-900">
                    <input type="checkbox" checked={simulateStockError} onChange={(e) => { setSimulateStockError(e.target.checked); if (e.target.checked) setSimulatePaymentError(false); }} className="accent-amber-600" />
                    <span>Mô phỏng hết hàng trong kho (Task 10.3 Stock Lock)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-red-900">
                    <input type="checkbox" checked={simulatePaymentError} onChange={(e) => { setSimulatePaymentError(e.target.checked); if (e.target.checked) setSimulateStockError(false); }} className="accent-red-600" />
                    <span>Mô phỏng lỗi thanh toán (Task 8 PAYMENT_FAILED)</span>
                  </label>
                </div>

                <div className="mt-5 border-t border-[#eee3d7] pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-[#8b796b]"><span>Tạm tính</span><span>{formatPrice(totalPrice)}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-sm font-semibold text-green-600"><span>Giảm giá khuyến mãi ({appliedPromo?.code})</span><span>-{formatPrice(discountAmount)}</span></div>}
                  <div className="flex justify-between border-t border-[#eee3d7] pt-3 text-lg font-black text-[#35251f]">
                    <span>Tổng thanh toán ({paymentMethod})</span>
                    <span className="text-[#a16b4b]">{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="mt-2 rounded-xl bg-amber-50/80 p-2.5 text-center text-xs text-amber-900 border border-amber-200">
                    ⭐ Đơn hàng tích lũy <strong className="text-[#a16b4b]">+{loyaltyPoints} điểm</strong> thành viên (Task 10.4)
                  </div>
                </div>

                <button type="button" disabled={loading} onClick={handleCheckout} className="mt-6 w-full rounded-2xl bg-[#35251f] py-4 text-sm font-bold text-white transition hover:bg-[#634536] disabled:opacity-50">
                  {loading ? "Đang xử lý giao dịch..." : `Xác nhận & Thanh toán (${paymentMethod}) · ${formatPrice(finalTotal)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}