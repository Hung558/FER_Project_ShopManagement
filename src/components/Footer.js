import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="gy-3">
          {/* Cột 1: Thông tin thương hiệu */}
          <Col md={4}>
            <h5 className="fw-bold text-white mb-2">Shop Quần Áo</h5>
            <p className="text-secondary small mb-2">
              Hệ thống bán lẻ và quản lý kho hàng thời trang uy tín. Cung cấp các mẫu trang phục hiện đại, chất lượng cao với giá thành hợp lý.
            </p>
            <div className="text-secondary small">
              © {new Date().getFullYear()} Shop Quần Áo. All rights reserved.
            </div>
          </Col>

          {/* Cột 2: Danh mục & Liên kết nhanh */}
          <Col md={4}>
            <h6 className="fw-bold text-white mb-2">Liên kết nhanh</h6>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-1">
                <Link to="/" className="text-decoration-none text-secondary">
                  Trang chủ & Sản phẩm
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/login" className="text-decoration-none text-secondary">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/register" className="text-decoration-none text-secondary">
                  Đăng ký thành viên
                </Link>
              </li>
              <li className="mb-1">
                <span className="text-secondary">Chính sách đổi trả trong 7 ngày</span>
              </li>
            </ul>
          </Col>

          {/* Cột 3: Thông tin liên hệ */}
          <Col md={4}>
            <h6 className="fw-bold text-white mb-2">Hỗ trợ & Liên hệ</h6>
            <div className="text-secondary small">
              <p className="mb-1">
                <strong>Địa chỉ:</strong> 123 Đường Lê Lợi, Quận 1, TP.HCM
              </p>
              <p className="mb-1">
                <strong>Hotline:</strong> 1900 1234 (8:00 - 21:30)
              </p>
              <p className="mb-1">
                <strong>Email:</strong> hotro@shopquanao.vn
              </p>
              <p className="mb-0">
                <strong>Giao hàng:</strong> Toàn quốc, thanh toán linh hoạt
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

