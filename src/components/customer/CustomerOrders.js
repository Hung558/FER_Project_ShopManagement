import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PaymentModal from "./PaymentModal";

const API_URL = "http://localhost:9999";

export default function CustomerOrders() {
  const { currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal thanh toán
  const [selectedOrderToPay, setSelectedOrderToPay] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Lấy danh sách đơn hàng của khách hiện tại
  async function fetchOrders() {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders`, {
        params: { customerId: currentUser.id },
      });
      // Sắp xếp đơn mới nhất xếp đầu
      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Hủy đơn hàng (chỉ áp dụng cho PendingPayment)
  async function handleCancelOrder(order) {
    if (order.status !== "PendingPayment") return;
    const confirmCancel = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng ${order.id} không?`
    );
    if (!confirmCancel) return;

    try {
      await axios.patch(`${API_URL}/orders/${order.id}`, {
        status: "Cancelled",
        updatedAt: new Date().toISOString(),
      });
      // Tải lại danh sách đơn
      fetchOrders();
    } catch (err) {
      alert("Có lỗi khi hủy đơn hàng!");
    }
  }

  // Khách bấm "Đã nhận được hàng" (chỉ áp dụng cho Delivering -> Completed)
  async function handleReceiveOrder(order) {
    if (order.status !== "Delivering") return;
    const confirmReceive = window.confirm(
      `Xác nhận bạn đã nhận được hàng cho đơn ${order.id}?`
    );
    if (!confirmReceive) return;

    try {
      await axios.patch(`${API_URL}/orders/${order.id}`, {
        status: "Completed",
        updatedAt: new Date().toISOString(),
      });
      fetchOrders();
    } catch (err) {
      alert("Có lỗi khi cập nhật trạng thái đơn!");
    }
  }

  // Mở modal thanh toán
  function handleOpenPaymentModal(order) {
    setSelectedOrderToPay(order);
    setShowPaymentModal(true);
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    setSelectedOrderToPay(null);
    fetchOrders();
  }

  // Helper hiển thị badge trạng thái
  function renderStatusBadge(status) {
    switch (status) {
      case "PendingPayment":
        return <Badge bg="warning" text="dark">Chờ thanh toán</Badge>;
      case "Paid":
        return <Badge bg="info">Đã thanh toán</Badge>;
      case "Delivering":
        return <Badge bg="primary">Đang giao hàng</Badge>;
      case "Completed":
        return <Badge bg="success">Hoàn thành</Badge>;
      case "Cancelled":
        return <Badge bg="secondary">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  }

  // Lọc và tìm kiếm theo mã đơn
  const searchKeyword = searchCode.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (filterStatus && order.status !== filterStatus) {
      return false;
    }
    if (searchKeyword && !order.id.toLowerCase().includes(searchKeyword)) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <h3 className="mb-4">Đơn hàng của tôi</h3>

      {/* Bộ lọc và ô tìm kiếm */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Tìm theo mã đơn hàng..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PendingPayment">Chờ thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Delivering">Đang giao hàng</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <p>Đang tải danh sách đơn hàng...</p>}

      {!loading && filteredOrders.length === 0 && (
        <Alert variant="info">
          Không có đơn hàng nào phù hợp. <Link to="/">Mua sắm ngay</Link>!
        </Alert>
      )}

      {/* Danh sách các đơn hàng */}
      {filteredOrders.map((order) => (
        <Card key={order.id} className="mb-4 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <strong>Mã đơn:</strong> <span className="text-primary">{order.id}</span>
              <span className="ms-3 text-muted">
                Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div>{renderStatusBadge(order.status)}</div>
          </Card.Header>

          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <div><strong>Người nhận:</strong> {order.customerName}</div>
                <div><strong>Số điện thoại:</strong> {order.phone}</div>
                <div><strong>Địa chỉ:</strong> {order.shippingAddress}</div>
              </Col>
              <Col md={6} className="text-md-end mt-2 mt-md-0">
                {order.paymentMethod && (
                  <div>
                    <strong>Phương thức thanh toán: </strong>
                    <Badge bg="light" text="dark" className="border">
                      {order.paymentMethod === "BankTransfer"
                        ? "Chuyển khoản"
                        : order.paymentMethod === "EWallet"
                        ? "Ví điện tử"
                        : "Thẻ"}
                    </Badge>
                  </div>
                )}
                <div className="fs-5 mt-2">
                  <strong>Tổng tiền: </strong>
                  <span className="text-danger fw-bold">
                    {order.totalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </Col>
            </Row>

            {/* Chi tiết sản phẩm trong đơn */}
            <Table responsive size="sm" bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th style={{ width: 80 }}>Size</th>
                  <th style={{ width: 100 }}>Số lượng</th>
                  <th style={{ width: 130 }}>Đơn giá</th>
                  <th style={{ width: 140 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.productName}</td>
                    <td>
                      <Badge bg="dark">{it.size}</Badge>
                    </td>
                    <td>{it.quantity}</td>
                    <td>{it.price.toLocaleString("vi-VN")} ₫</td>
                    <td className="fw-semibold">
                      {(it.price * it.quantity).toLocaleString("vi-VN")} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Nút thao tác theo trạng thái */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              {order.status === "PendingPayment" && (
                <>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleCancelOrder(order)}
                  >
                    Hủy đơn
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleOpenPaymentModal(order)}
                  >
                    Thanh toán ngay
                  </Button>
                </>
              )}

              {order.status === "Delivering" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReceiveOrder(order)}
                >
                  Đã nhận được hàng
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}

      {/* Modal thanh toán khi bấm Thanh toán ngay */}
      {selectedOrderToPay && (
        <PaymentModal
          show={showPaymentModal}
          order={selectedOrderToPay}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrderToPay(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Container>
  );
}

