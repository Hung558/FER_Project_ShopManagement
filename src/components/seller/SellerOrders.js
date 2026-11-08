import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

const API_URL = "http://localhost:9999";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Đọc search & filter từ URL params (?search=...&status=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const filterStatus = searchParams.get("status") || "";

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/orders`);
      // Đơn mới nhất xếp đầu
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
  }, []);

  // Xác nhận xuất kho: chỉ áp dụng cho đơn Paid -> Delivering
  async function handleConfirmExport(order) {
    if (order.status !== "Paid") return;

    const confirmExport = window.confirm(
      `Xác nhận xuất kho cho đơn hàng ${order.id}? Đơn sẽ chuyển sang trạng thái "Đang giao hàng".`
    );
    if (!confirmExport) return;

    try {
      await axios.patch(`${API_URL}/orders/${order.id}`, {
        status: "Delivering",
        updatedAt: new Date().toISOString(),
      });
      fetchOrders();
    } catch (err) {
      alert("Có lỗi khi cập nhật trạng thái xuất kho!");
    }
  }

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

  // Tìm kiếm theo mã đơn hoặc tên khách, không phân biệt hoa thường
  const keyword = searchText.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (filterStatus && order.status !== filterStatus) {
      return false;
    }
    const matchId = order.id.toLowerCase().includes(keyword);
    const matchName =
      order.customerName && order.customerName.toLowerCase().includes(keyword);
    if (keyword && !matchId && !matchName) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <h3 className="mb-4">Quản lý Đơn hàng (Thủ kho)</h3>

      {/* Tìm kiếm & Lọc trạng thái */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách..."
            value={searchText}
            onChange={(e) => {
              if (e.target.value) {
                searchParams.set("search", e.target.value);
              } else {
                searchParams.delete("search");
              }
              setSearchParams(searchParams);
            }}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => {
              if (e.target.value) {
                searchParams.set("status", e.target.value);
              } else {
                searchParams.delete("status");
              }
              setSearchParams(searchParams);
            }}
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
      {loading && <p>Đang tải đơn hàng...</p>}

      {!loading && filteredOrders.length === 0 && (
        <Alert variant="info">Không tìm thấy đơn hàng nào.</Alert>
      )}

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
                <div><strong>Khách hàng:</strong> {order.customerName}</div>
                <div><strong>SĐT:</strong> {order.phone}</div>
                <div><strong>Địa chỉ giao:</strong> {order.shippingAddress}</div>
              </Col>
              <Col md={6} className="text-md-end mt-2 mt-md-0">
                <div>
                  <strong>Phương thức thanh toán: </strong>
                  {order.paymentMethod ? (
                    <Badge bg="light" text="dark" className="border">
                      {order.paymentMethod === "BankTransfer"
                        ? "Chuyển khoản"
                        : order.paymentMethod === "EWallet"
                        ? "Ví điện tử"
                        : "Thẻ"}
                    </Badge>
                  ) : (
                    <span className="text-muted">Chưa thanh toán</span>
                  )}
                </div>
                <div className="fs-5 mt-2">
                  <strong>Tổng tiền: </strong>
                  <span className="text-danger fw-bold">
                    {order.totalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </Col>
            </Row>

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
                    <td><Badge bg="dark">{it.size}</Badge></td>
                    <td>{it.quantity}</td>
                    <td>{it.price.toLocaleString("vi-VN")} ₫</td>
                    <td className="fw-semibold">
                      {(it.price * it.quantity).toLocaleString("vi-VN")} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Nút thao tác của Seller */}
            <div className="d-flex justify-content-end mt-3">
              {order.status === "Paid" ? (
                <Button
                  variant="primary"
                  onClick={() => handleConfirmExport(order)}
                >
                  Xác nhận xuất kho
                </Button>
              ) : (
                <span className="text-muted small">
                  {order.status === "PendingPayment"
                    ? "Chờ khách thanh toán"
                    : order.status === "Delivering"
                    ? "Đang giao cho khách"
                    : order.status === "Completed"
                    ? "Đơn đã hoàn thành"
                    : "Đơn đã bị hủy"}
                </span>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}

