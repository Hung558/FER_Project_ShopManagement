import { useContext } from "react";
import { Badge, Button, Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Shop Quần Áo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />

        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {/* Menu chung hoặc cho Customer/Guest */}
            {(!currentUser || currentUser.role === "Customer") && (
              <Nav.Link as={Link} to="/">
                Sản phẩm
              </Nav.Link>
            )}

            {/* Menu chỉ dành cho Customer */}
            {currentUser && currentUser.role === "Customer" && (
              <>
                <Nav.Link as={Link} to="/cart">
                  Giỏ hàng
                </Nav.Link>
                <Nav.Link as={Link} to="/customer/orders">
                  Đơn hàng của tôi
                </Nav.Link>
              </>
            )}

            {/* Menu chỉ dành cho Seller */}
            {currentUser && currentUser.role === "Seller" && (
              <Nav.Link as={Link} to="/seller/orders">
                Quản lý đơn hàng
              </Nav.Link>
            )}

            {/* Menu chỉ dành cho Admin */}
            {currentUser && currentUser.role === "Admin" && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/products">
                  Quản lý sản phẩm
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/users">
                  Quản lý người dùng
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto align-items-center">
            {currentUser ? (
              <>
                <Nav.Link as={Link} to="/profile" className="d-flex align-items-center me-3">
                  {currentUser.avatar && (
                    <img
                      src={currentUser.avatar}
                      alt="avatar"
                      style={{ width: 28, height: 28, borderRadius: "50%", marginRight: 8, objectFit: "cover" }}
                    />
                  )}
                  <span>Xin chào, {currentUser.username}</span>
                  <Badge bg="secondary" className="ms-2">
                    {currentUser.role}
                  </Badge>
                </Nav.Link>

                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Đăng nhập
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Đăng ký
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
