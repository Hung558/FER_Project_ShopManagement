import { useState } from "react";
import axios from "axios";
import { Alert, Button, Form, Modal } from "react-bootstrap";

const API_URL = "http://localhost:9999";

export default function PaymentModal({ show, order, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!order) return null;

  async function handleConfirmPayment() {
    setError("");
    setLoading(true);

    try {
      // 1. Gom số lượng các sản phẩm theo productId (phòng trường hợp cùng sản phẩm nhiều size)
      const quantityByProduct = {};
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        if (!quantityByProduct[item.productId]) {
          quantityByProduct[item.productId] = 0;
        }
        quantityByProduct[item.productId] += item.quantity;
      }

      // 2. Lấy thông tin tồn kho mới nhất của từng sản phẩm
      const productIds = Object.keys(quantityByProduct);
      const productDataList = [];

      for (let i = 0; i < productIds.length; i++) {
        const prodId = productIds[i];
        const res = await axios.get(`${API_URL}/products/${prodId}`);
        const currentProd = res.data;
        const requiredQty = quantityByProduct[prodId];

        // Kiểm tra tồn kho
        if (currentProd.stock < requiredQty) {
          setError(
            `Sản phẩm "${currentProd.name}" không đủ hàng trong kho (tồn kho: ${currentProd.stock}, cần mua: ${requiredQty}). Đơn hàng giữ nguyên trạng thái chờ thanh toán.`
          );
          setLoading(false);
          return;
        }

        productDataList.push({
          product: currentProd,
          requiredQty: requiredQty,
        });
      }

      // 3. Đủ hàng: Trừ tồn kho từng sản phẩm trong database
      for (let i = 0; i < productDataList.length; i++) {
        const { product, requiredQty } = productDataList[i];
        const newStock = product.stock - requiredQty;
        await axios.patch(`${API_URL}/products/${product.id}`, {
          stock: newStock,
        });
      }

      // 4. Cập nhật đơn hàng sang trạng thái "Paid"
      const orderRes = await axios.patch(`${API_URL}/orders/${order.id}`, {
        status: "Paid",
        paymentMethod: paymentMethod,
        updatedAt: new Date().toISOString(),
      });

      // Thành công: thông báo và đóng modal
      onSuccess(orderRes.data);
    } catch (err) {
      setError("Có lỗi trong quá trình thanh toán. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Thanh toán đơn hàng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <p className="mb-2">
          <strong>Mã đơn hàng:</strong> {order.id}
        </p>
        <p className="mb-3">
          <strong>Tổng tiền thanh toán: </strong>
          <span className="text-danger fs-5 fw-bold">
            {order.totalAmount ? order.totalAmount.toLocaleString("vi-VN") : 0} ₫
          </span>
        </p>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Chọn phương thức thanh toán</Form.Label>
          <div className="d-flex flex-column gap-2 mt-2">
            <Form.Check
              type="radio"
              id="bank-transfer"
              label="Chuyển khoản ngân hàng (QR Code / Internet Banking)"
              name="paymentMethod"
              value="BankTransfer"
              checked={paymentMethod === "BankTransfer"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="e-wallet"
              label="Ví điện tử (Momo / ZaloPay / VNPay)"
              name="paymentMethod"
              value="EWallet"
              checked={paymentMethod === "EWallet"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="card"
              label="Thẻ thanh toán quốc tế / Nội địa"
              name="paymentMethod"
              value="Card"
              checked={paymentMethod === "Card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        </Form.Group>

        <Alert variant="secondary" className="mb-0 py-2 small">
          * Đây là thanh toán giả lập để demo luồng đặt hàng và trừ tồn kho.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={loading}>
          Đóng (Thanh toán sau)
        </Button>
        <Button variant="success" onClick={handleConfirmPayment} disabled={loading}>
          {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

