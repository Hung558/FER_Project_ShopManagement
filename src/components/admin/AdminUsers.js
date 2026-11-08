import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

const API_URL = "http://localhost:9999";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Đọc search & bộ lọc từ URL params (?search=...&role=...&status=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const filterRole = searchParams.get("role") || "";
  const filterStatus = searchParams.get("status") || ""; // "" | "active" | "locked"

  // Modal Thêm tài khoản
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Customer",
    fullName: "",
    phone: "",
    address: "",
  });
  const [addError, setAddError] = useState("");

  // Modal Đổi Role
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("Customer");

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
    } catch (err) {
      setError("Không thể tải danh sách tài khoản từ server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý Thêm tài khoản mới
  async function handleAddUser(e) {
    e.preventDefault();
    setAddError("");

    const normalizedEmail = addForm.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setAddError("Email không đúng định dạng (ví dụ: ten@gmail.com)");
      return;
    }
    if (!addForm.username.trim()) {
      setAddError("Tên hiển thị không được để trống");
      return;
    }
    if (addForm.password.length < 3) {
      setAddError("Mật khẩu phải có ít nhất 3 ký tự");
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setAddError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      // Kiểm tra trùng email
      const checkRes = await axios.get(`${API_URL}/users`, {
        params: { email: normalizedEmail },
      });
      if (checkRes.data.length > 0) {
        setAddError("Email này đã được sử dụng");
        return;
      }

      // Tạo tài khoản mới, isActive luôn là true, không gửi id
      await axios.post(`${API_URL}/users`, {
        email: normalizedEmail,
        username: addForm.username.trim(),
        password: addForm.password,
        role: addForm.role,
        fullName: addForm.fullName.trim(),
        phone: addForm.phone.trim(),
        address: addForm.address.trim(),
        avatar: "",
        isActive: true,
      });

      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setAddError("Có lỗi khi tạo tài khoản. Vui lòng thử lại!");
    }
  }

  // Xử lý Reset Mật khẩu về '123'
  async function handleResetPassword(user) {
    if (user.role === "Admin") return;

    const confirmReset = window.confirm(
      `Bạn có chắc chắn muốn đặt lại mật khẩu của người dùng "${user.username}" về mặc định "123"?`
    );
    if (!confirmReset) return;

    try {
      await axios.patch(`${API_URL}/users/${user.id}`, {
        password: "123",
      });
      alert(`Đã đặt lại mật khẩu cho tài khoản "${user.email}" thành công: 123`);
      fetchUsers();
    } catch (err) {
      alert("Có lỗi khi đặt lại mật khẩu!");
    }
  }

  // Mở modal Đổi Role
  function handleOpenChangeRole(user) {
    if (user.role === "Admin") return;
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  }

  // Xác nhận Đổi Role
  async function handleConfirmRole() {
    if (!selectedUserForRole) return;
    const confirmChange = window.confirm(
      `Xác nhận đổi vai trò của "${selectedUserForRole.username}" từ ${selectedUserForRole.role} sang ${newRole}?`
    );
    if (!confirmChange) return;

    try {
      await axios.patch(`${API_URL}/users/${selectedUserForRole.id}`, {
        role: newRole,
      });
      setShowRoleModal(false);
      setSelectedUserForRole(null);
      fetchUsers();
    } catch (err) {
      alert("Có lỗi khi thay đổi vai trò người dùng!");
    }
  }

  // Khóa / Mở khóa tài khoản
  async function handleToggleStatus(user) {
    if (user.role === "Admin") return;

    const actionText = user.isActive ? "khóa" : "mở khóa";
    const confirmAction = window.confirm(
      `Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}" (${user.email})?`
    );
    if (!confirmAction) return;

    try {
      await axios.patch(`${API_URL}/users/${user.id}`, {
        isActive: !user.isActive,
      });
      fetchUsers();
    } catch (err) {
      alert("Có lỗi khi đổi trạng thái tài khoản!");
    }
  }

  // Lọc tìm kiếm
  const keyword = searchText.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchEmail = u.email && u.email.toLowerCase().includes(keyword);
    const matchUsername = u.username && u.username.toLowerCase().includes(keyword);
    const matchFullName = u.fullName && u.fullName.toLowerCase().includes(keyword);
    if (keyword && !matchEmail && !matchUsername && !matchFullName) {
      return false;
    }
    if (filterRole && u.role !== filterRole) {
      return false;
    }
    if (filterStatus === "active" && u.isActive !== true) {
      return false;
    }
    if (filterStatus === "locked" && u.isActive !== false) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Quản lý Người dùng (Admin)</h3>
        <Button
          variant="success"
          onClick={() => {
            setAddError("");
            setAddForm({
              email: "",
              username: "",
              password: "",
              confirmPassword: "",
              role: "Customer",
              fullName: "",
              phone: "",
              address: "",
            });
            setShowAddModal(true);
          }}
        >
          + Thêm tài khoản mới
        </Button>
      </div>

      {/* Tìm kiếm và Lọc */}
      <Row className="g-2 mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Tìm theo email, tên hiển thị hoặc họ tên..."
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
        <Col md={3}>
          <Form.Select
            value={filterRole}
            onChange={(e) => {
              if (e.target.value) {
                searchParams.set("role", e.target.value);
              } else {
                searchParams.delete("role");
              }
              setSearchParams(searchParams);
            }}
          >
            <option value="">Tất cả vai trò (Role)</option>
            <option value="Admin">Admin</option>
            <option value="Seller">Seller</option>
            <option value="Customer">Customer</option>
          </Form.Select>
        </Col>
        <Col md={3}>
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
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <p>Đang tải danh sách người dùng...</p>}

      {!loading && filteredUsers.length === 0 && (
        <Alert variant="info">Không tìm thấy người dùng nào phù hợp.</Alert>
      )}

      {/* Bảng người dùng */}
      <Table responsive bordered hover className="align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: 60 }}>Avatar</th>
            <th>Email</th>
            <th>Tên hiển thị</th>
            <th>Họ tên</th>
            <th>SĐT</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th style={{ width: 280 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => {
            const isAdmin = u.role === "Admin";

            return (
              <tr
                key={u.id}
                className={u.isActive === false ? "table-secondary text-muted" : ""}
              >
                <td>
                  <img
                    src={
                      u.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                    }
                    alt="avatar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </td>
                <td className="fw-semibold">{u.email}</td>
                <td>{u.username}</td>
                <td>{u.fullName || "-"}</td>
                <td>{u.phone || "-"}</td>
                <td>
                  <Badge
                    bg={
                      u.role === "Admin"
                        ? "danger"
                        : u.role === "Seller"
                        ? "primary"
                        : "secondary"
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td>
                  {u.isActive === false ? (
                    <Badge bg="secondary">Đã khóa</Badge>
                  ) : (
                    <Badge bg="success">Đang hoạt động</Badge>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <span className="text-muted small">
                      Không thể thao tác với tài khoản Admin
                    </span>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleResetPassword(u)}
                        title="Đặt lại mật khẩu về 123"
                      >
                        Reset MK
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenChangeRole(u)}
                      >
                        Đổi role
                      </Button>
                      {u.isActive === false ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                        >
                          Mở khóa
                        </Button>
                      ) : (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                        >
                          Khóa
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Modal Thêm Tài Khoản */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm tài khoản người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}

          <Form onSubmit={handleAddUser}>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                required
                value={addForm.email}
                onChange={(e) =>
                  setAddForm({ ...addForm, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tên hiển thị (username) *</Form.Label>
              <Form.Control
                type="text"
                required
                value={addForm.username}
                onChange={(e) =>
                  setAddForm({ ...addForm, username: e.target.value })
                }
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mật khẩu *</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Xác nhận MK *</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    value={addForm.confirmPassword}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Vai trò (Role) *</Form.Label>
              <Form.Select
                value={addForm.role}
                onChange={(e) =>
                  setAddForm({ ...addForm, role: e.target.value })
                }
              >
                <option value="Customer">Customer</option>
                <option value="Seller">Seller</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text"
                value={addForm.fullName}
                onChange={(e) =>
                  setAddForm({ ...addForm, fullName: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm({ ...addForm, phone: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                value={addForm.address}
                onChange={(e) =>
                  setAddForm({ ...addForm, address: e.target.value })
                }
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </Button>
              <Button variant="success" type="submit">
                Tạo tài khoản
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Đổi Role */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Đổi vai trò người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUserForRole && (
            <p>
              Đổi vai trò cho tài khoản: <strong>{selectedUserForRole.email}</strong> (
              {selectedUserForRole.username})
            </p>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Chọn vai trò mới</Form.Label>
            <Form.Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="Customer">Customer</option>
              <option value="Seller">Seller</option>
              <option value="Admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmRole}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

