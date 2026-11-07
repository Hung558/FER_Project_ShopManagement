import { useContext, useState } from "react";
import axios from "axios";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:9999";

export default function Profile() {
  const { currentUser, updateUser } = useContext(AuthContext);

  // Form thông tin cá nhân
  const [username, setUsername] = useState(currentUser?.username || "");
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");

  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Form đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Xử lý chọn file ảnh -> đổi sang Base64
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Cập nhật thông tin cá nhân
  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");

    if (!username.trim()) {
      setProfileError("Tên hiển thị không được để trống");
      return;
    }

    try {
      setProfileLoading(true);
      const updateData = {
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatar.trim(),
      };

      const res = await axios.patch(
        `${API_URL}/users/${currentUser.id}`,
        updateData
      );

      // Cập nhật lại session context
      updateUser(res.data);
      setProfileMsg("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      setProfileError("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setProfileLoading(false);
    }
  }

  // Đổi mật khẩu
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");

    if (!oldPassword) {
      setPwError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 3) {
      setPwError("Mật khẩu mới phải có tối thiểu 3 ký tự");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setPwLoading(true);
      // Lấy thông tin mới nhất của user để kiểm tra mật khẩu cũ
      const userRes = await axios.get(`${API_URL}/users/${currentUser.id}`);
      const latestUser = userRes.data;

      if (latestUser.password !== oldPassword) {
        setPwError("Mật khẩu cũ không chính xác");
        return;
      }

      // Cập nhật mật khẩu mới
      const res = await axios.patch(`${API_URL}/users/${currentUser.id}`, {
        password: newPassword,
      });

      updateUser(res.data);
      setPwMsg("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPwError("Có lỗi xảy ra khi đổi mật khẩu!");
    } finally {
      setPwLoading(false);
    }
  }

  if (!currentUser) return null;

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h3 className="mb-4">Thông tin cá nhân</h3>

      <Row className="g-4">
        {/* Phần Cập nhật Profile */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light fw-bold">
              Cập nhật thông tin
            </Card.Header>
            <Card.Body>
              {profileMsg && <Alert variant="success">{profileMsg}</Alert>}
              {profileError && <Alert variant="danger">{profileError}</Alert>}

              <Form onSubmit={handleUpdateProfile}>
                <Form.Group className="mb-3">
                  <Form.Label>Email đăng nhập (Chỉ đọc)</Form.Label>
                  <Form.Control type="email" value={currentUser.email} disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tên hiển thị (username) *</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ giao hàng</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ảnh đại diện (Nhập link URL)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Hoặc chọn ảnh từ máy tính (Base64)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={profileLoading}
                >
                  {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Cột Xem trước Avatar & Đổi mật khẩu */}
        <Col md={5}>
          {/* Card xem trước Avatar */}
          <Card className="shadow-sm mb-4 text-center">
            <Card.Header className="bg-light fw-bold">
              Ảnh đại diện
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-center my-2">
                <img
                  src={
                    avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                  }
                  alt="Avatar preview"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              </div>
              <div className="text-muted small mt-2">
                Xem trước ảnh đại diện
              </div>
            </Card.Body>
          </Card>

          {/* Card Đổi mật khẩu */}
          <Card className="shadow-sm">
            <Card.Header className="bg-light fw-bold">
              Đổi mật khẩu
            </Card.Header>
            <Card.Body>
              {pwMsg && <Alert variant="success">{pwMsg}</Alert>}
              {pwError && <Alert variant="danger">{pwError}</Alert>}

              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-2">
                  <Form.Label>Mật khẩu cũ *</Form.Label>
                  <Form.Control
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Mật khẩu mới *</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Xác nhận mật khẩu mới *</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </Form.Group>

                <Button
                  variant="warning"
                  type="submit"
                  className="w-100"
                  disabled={pwLoading}
                >
                  {pwLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

