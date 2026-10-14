import { useState } from "react";
import axios from "axios";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:9999";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Chuẩn hóa email: bỏ khoảng trắng 2 đầu và chuyển về chữ thường
    const normalizedEmail = form.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Email không đúng định dạng (ví dụ: ten@gmail.com)");
      return;
    }
    if (form.username.trim() === "") {
      setError("Tên hiển thị không được để trống");
      return;
    }
    if (form.password.length < 3) {
      setError("Mật khẩu phải có ít nhất 3 ký tự");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      // Email không được trùng với tài khoản đã có
      const response = await axios.get(`${API_URL}/users`, {
        params: { email: normalizedEmail },
      });
      if (response.data.length > 0) {
        setError("Email đã được sử dụng");
        return;
      }

      // Tài khoản đăng ký mới luôn là Customer và đang hoạt động.
      // Không gửi id: json-server 1.0 luôn tự sinh id mới khi POST.
      await axios.post(`${API_URL}/users`, {
        email: normalizedEmail,
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: "Customer",
        phone: form.phone.trim(),
        address: form.address.trim(),
        avatar: "",
        isActive: true,
      });

      // Chuyển sang trang đăng nhập, gửi kèm email để điền sẵn
      navigate("/login", {
        state: {
          email: normalizedEmail,
          message: "Đăng ký thành công! Vui lòng đăng nhập.",
        },
      });
    } catch (err) {
      setError("Không kết nối được server. Hãy chạy json-server ở cổng 9999");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: 520 }}>
      <Card>
        <Card.Body>
          <h3 className="mb-4 text-center">Đăng ký tài khoản</h3>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tên hiển thị *</Form.Label>
              <Form.Control
                name="username"
                value={form.username}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Xác nhận mật khẩu *</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
