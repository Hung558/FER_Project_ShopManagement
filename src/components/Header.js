import { useContext } from "react";
import { Button, Container, Nav, Navbar } from "react-bootstrap";
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
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Shop Quần Áo
        </Navbar.Brand>

        <Nav className="ms-auto align-items-center">
          {currentUser ? (
            <>
              <Navbar.Text className="me-3">
                Xin chào, {currentUser.username}
              </Navbar.Text>
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
      </Container>
    </Navbar>
  );
}
