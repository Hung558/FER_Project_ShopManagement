import { useContext, useState } from "react";
import axios from "axios";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:9999";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  // Nếu vừa đăng ký xong, trang Register gửi sang email và lời thông báo
  let registeredEmail = "";
  let successMessage = "";
  if (location.state) {
    registeredEmail = location.state.email;
    successMessage = location.state.message;
  }

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Chuẩn hóa email: bỏ khoảng trắng 2 đầu và chuyển về chữ thường
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "" || password === "") {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      // Chỉ lọc theo email rồi tự so mật khẩu,
      // vì json-server 1.0 không lọc đúng được ?password=123 (nó đổi "123" thành số)
      const response = await axios.get(`${API_URL}/users`, {
        params: { email: normalizedEmail },
      });
      const users = response.data;

      if (users.length === 0 || users[0].password !== password) {
        setError("Email hoặc mật khẩu không đúng");
        return;
      }

      const user = users[0];

      // Kiểm tra quyền: tài khoản bị khóa thì không cho đăng nhập
      if (user.isActive === false) {
        setError("Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
        return;
      }

      login(user);

      // Điều hướng theo role
      if (user.role === "Admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "Seller") {
        navigate("/seller/orders");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Không kết nối được server. Hãy chạy json-server ở cổng 9999");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: 420 }}>
      <Card>
        <Card.Body>
          <h3 className="mb-4 text-center">Đăng nhập</h3>

          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
