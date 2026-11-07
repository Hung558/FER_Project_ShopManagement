import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:9999";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bộ lọc cho bảng sản phẩm sắp hết hàng
  const [lowStockSearch, setLowStockSearch] = useState("");
  const [lowStockCategory, setLowStockCategory] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, orderRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/orders`),
          axios.get(`${API_URL}/categories`),
        ]);
        setProducts(prodRes.data);
        setOrders(orderRes.data);
        setCategories(catRes.data);
      } catch (err) {
        setError("Không thể tải dữ liệu thống kê từ server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 1. Tổng số sản phẩm đang bán (isActive: true)
  const activeProducts = products.filter((p) => p.isActive === true);
  const totalActiveProducts = activeProducts.length;

  // 2. Sản phẩm đang bán nhưng sắp hết hàng (isActive: true và stock < 5)
  const lowStockProducts = activeProducts.filter((p) => p.stock < 5);
  const totalLowStockProducts = lowStockProducts.length;

  // 3. Tổng số đơn hàng phát sinh trong ngày (theo ngày local của createdAt)
  const todayStr = new Date().toLocaleDateString();
  const todayOrders = orders.filter((order) => {
    if (!order.createdAt) return false;
    const orderDateStr = new Date(order.createdAt).toLocaleDateString();
    return orderDateStr === todayStr;
  });
  const totalOrdersToday = todayOrders.length;

  // 4. Doanh thu: tổng tiền các đơn Paid, Delivering, Completed
  let totalRevenue = 0;
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (
      o.status === "Paid" ||
      o.status === "Delivering" ||
      o.status === "Completed"
    ) {
      totalRevenue += o.totalAmount || 0;
    }
  }

  // Lọc bảng sản phẩm sắp hết hàng
  const searchKeyword = lowStockSearch.trim().toLowerCase();
  const filteredLowStockProducts = lowStockProducts.filter((p) => {
    if (!p.name.toLowerCase().includes(searchKeyword)) {
      return false;
    }
    if (lowStockCategory && p.categoryId !== lowStockCategory) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <h3 className="mb-4">Báo cáo Thống kê (Dashboard)</h3>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <p>Đang tải dữ liệu thống kê...</p>}

      {/* 4 Card Thống Kê Tổng Quan */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="h-100 border-primary shadow-sm">
            <Card.Body>
              <div className="text-muted small">Sản phẩm đang bán</div>
              <div className="fs-3 fw-bold text-primary mt-1">
                {totalActiveProducts}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="h-100 border-warning shadow-sm">
            <Card.Body>
              <div className="text-muted small">Sản phẩm sắp hết hàng</div>
              <div className="fs-3 fw-bold text-warning mt-1">
                {totalLowStockProducts}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="h-100 border-info shadow-sm">
            <Card.Body>
              <div className="text-muted small">Đơn phát sinh trong ngày</div>
              <div className="fs-3 fw-bold text-info mt-1">
                {totalOrdersToday}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="h-100 border-success shadow-sm">
            <Card.Body>
              <div className="text-muted small">Tổng doanh thu thực tế</div>
              <div className="fs-4 fw-bold text-success mt-1">
                {totalRevenue.toLocaleString("vi-VN")} ₫
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bảng Danh sách sản phẩm sắp hết hàng */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light fw-bold fs-5">
          Danh sách sản phẩm đang bán sắp hết hàng (Tồn kho &lt; 5)
        </Card.Header>
        <Card.Body>
          <Row className="g-2 mb-3">
            <Col md={7}>
              <Form.Control
                type="text"
                placeholder="Tìm theo tên sản phẩm sắp hết hàng..."
                value={lowStockSearch}
                onChange={(e) => setLowStockSearch(e.target.value)}
              />
            </Col>
            <Col md={5}>
              <Form.Select
                value={lowStockCategory}
                onChange={(e) => setLowStockCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {filteredLowStockProducts.length === 0 ? (
            <Alert variant="success" className="mb-0">
              Không có sản phẩm nào sắp hết hàng theo tiêu chí lọc!
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th style={{ width: 120 }}>Tồn kho</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    </td>
                    <td className="fw-semibold">{p.name}</td>
                    <td>{p.subCategory}</td>
                    <td>{p.price.toLocaleString("vi-VN")} ₫</td>
                    <td>
                      {p.stock === 0 ? (
                        <Badge bg="danger">Hết hàng (0)</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">
                          Còn {p.stock}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Link
                        to="/admin/products"
                        className="btn btn-outline-dark btn-sm"
                      >
                        Quản lý kho
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

