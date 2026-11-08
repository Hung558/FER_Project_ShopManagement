import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

const API_URL = "http://localhost:9999";
const AVAILABLE_SIZES = ["S", "M", "L", "XL"];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Đọc search & bộ lọc từ URL params (?search=...&category=...&subCategory=...&status=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get("search") || "";
  const selectedCatId = searchParams.get("category") || "";
  const selectedSubCat = searchParams.get("subCategory") || "";
  const selectedStatus = searchParams.get("status") || ""; // "" | "active" | "inactive"

  // Modal Thêm / Sửa sản phẩm
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    subCategory: "",
    price: "",
    stock: "",
    sizes: [],
    material: "",
    description: "",
    imageUrl: "",
  });

  async function fetchData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/categories`),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError("Không thể tải dữ liệu từ server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý đổi danh mục chính ở bộ lọc -> cập nhật param và reset param danh mục phụ
  function handleFilterCatChange(e) {
    const val = e.target.value;
    if (val) {
      searchParams.set("category", val);
    } else {
      searchParams.delete("category");
    }
    searchParams.delete("subCategory");
    setSearchParams(searchParams);
  }

  // Danh mục phụ ở bộ lọc
  const filterCatObj = categories.find((c) => c.id === selectedCatId);
  const filterSubCats = filterCatObj ? filterCatObj.subCategories : [];

  // Mở modal thêm mới
  function handleOpenAdd() {
    setIsEditing(false);
    setCurrentProductId(null);
    setFormError("");
    setForm({
      name: "",
      categoryId: "",
      subCategory: "",
      price: "",
      stock: "",
      sizes: ["S", "M", "L"],
      material: "",
      description: "",
      imageUrl: "",
    });
    setShowModal(true);
  }

  // Mở modal sửa sản phẩm
  function handleOpenEdit(product) {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setFormError("");
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      subCategory: product.subCategory,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes || [],
      material: product.material || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
    setShowModal(true);
  }

  // Chọn / bỏ chọn size trong form
  function handleSizeToggle(size) {
    if (form.sizes.includes(size)) {
      setForm({ ...form, sizes: form.sizes.filter((s) => s !== size) });
    } else {
      setForm({ ...form, sizes: [...form.sizes, size] });
    }
  }

  // Đổi danh mục chính trong form -> reset danh mục phụ
  function handleFormCategoryChange(e) {
    setForm({
      ...form,
      categoryId: e.target.value,
      subCategory: "",
    });
  }

  // Lưu form Thêm hoặc Sửa
  async function handleSaveProduct(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Tên sản phẩm không được để trống");
      return;
    }
    if (!form.categoryId) {
      setFormError("Vui lòng chọn danh mục chính");
      return;
    }
    if (!form.subCategory) {
      setFormError("Vui lòng chọn danh mục phụ");
      return;
    }
    const numPrice = Number(form.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError("Giá sản phẩm phải là số lớn hơn 0");
      return;
    }
    const numStock = Number(form.stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      setFormError("Số lượng tồn kho phải là số nguyên lớn hơn hoặc bằng 0");
      return;
    }
    if (form.sizes.length === 0) {
      setFormError("Vui lòng chọn ít nhất 1 size (S, M, L, XL)");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        subCategory: form.subCategory,
        price: numPrice,
        stock: numStock,
        sizes: form.sizes,
        material: form.material.trim(),
        description: form.description.trim(),
        imageUrl:
          form.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500",
      };

      if (isEditing) {
        // Sửa sản phẩm: dùng PATCH để cập nhật thông tin
        await axios.patch(`${API_URL}/products/${currentProductId}`, payload);
      } else {
        // Thêm sản phẩm mới: isActive luôn là true, không gửi id
        await axios.post(`${API_URL}/products`, {
          ...payload,
          isActive: true,
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError("Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại!");
    }
  }

  // Đổi trạng thái Ngừng bán / Bán lại
  async function handleToggleStatus(product) {
    const actionText = product.isActive ? "ngừng bán" : "mở bán lại";
    const confirmAction = window.confirm(
      `Bạn có chắc chắn muốn ${actionText} sản phẩm "${product.name}"?`
    );
    if (!confirmAction) return;

    try {
      await axios.patch(`${API_URL}/products/${product.id}`, {
        isActive: !product.isActive,
      });
      fetchData();
    } catch (err) {
      alert("Có lỗi khi thay đổi trạng thái sản phẩm!");
    }
  }

  // Danh mục phụ cho Form
  const formCatObj = categories.find((c) => c.id === form.categoryId);
  const formSubCats = formCatObj ? formCatObj.subCategories : [];

  // Lọc sản phẩm
  const keyword = searchText.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (!p.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (selectedCatId && p.categoryId !== selectedCatId) {
      return false;
    }
    if (selectedSubCat && p.subCategory !== selectedSubCat) {
      return false;
    }
    if (selectedStatus === "active" && p.isActive !== true) {
      return false;
    }
    if (selectedStatus === "inactive" && p.isActive !== false) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Quản lý Sản phẩm (Admin)</h3>
        <Button variant="success" onClick={handleOpenAdd}>
          + Thêm sản phẩm mới
        </Button>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <Row className="g-2 mb-4">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
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
          <Form.Select value={selectedCatId} onChange={handleFilterCatChange}>
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedSubCat}
            onChange={(e) => {
              if (e.target.value) {
                searchParams.set("subCategory", e.target.value);
              } else {
                searchParams.delete("subCategory");
              }
              setSearchParams(searchParams);
            }}
            disabled={!selectedCatId}
          >
            <option value="">Tất cả danh mục phụ</option>
            {filterSubCats.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={selectedStatus}
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
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <p>Đang tải danh sách sản phẩm...</p>}

      {!loading && filteredProducts.length === 0 && (
        <Alert variant="info">Không tìm thấy sản phẩm nào phù hợp.</Alert>
      )}

      {/* Bảng sản phẩm */}
      <Table responsive bordered hover className="align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: 60 }}>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục phụ</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Sizes</th>
            <th>Trạng thái</th>
            <th style={{ width: 190 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr
              key={p.id}
              className={p.isActive === false ? "table-secondary text-muted" : ""}
            >
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
                ) : p.stock < 5 ? (
                  <Badge bg="warning" text="dark">Còn {p.stock}</Badge>
                ) : (
                  <span>{p.stock}</span>
                )}
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {(p.sizes || []).map((s) => (
                    <Badge key={s} bg="dark">
                      {s}
                    </Badge>
                  ))}
                </div>
              </td>
              <td>
                {p.isActive === false ? (
                  <Badge bg="secondary">Ngừng bán</Badge>
                ) : (
                  <Badge bg="success">Đang bán</Badge>
                )}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleOpenEdit(p)}
                  >
                    Sửa
                  </Button>
                  {p.isActive === false ? (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleToggleStatus(p)}
                    >
                      Bán lại
                    </Button>
                  ) : (
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleToggleStatus(p)}
                    >
                      Ngừng bán
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal Thêm / Sửa Sản Phẩm */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form onSubmit={handleSaveProduct}>
            <Form.Group className="mb-3">
              <Form.Label>Tên sản phẩm *</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục chính *</Form.Label>
                  <Form.Select
                    value={form.categoryId}
                    onChange={handleFormCategoryChange}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục phụ *</Form.Label>
                  <Form.Select
                    value={form.subCategory}
                    onChange={(e) =>
                      setForm({ ...form, subCategory: e.target.value })
                    }
                    disabled={!form.categoryId}
                  >
                    <option value="">-- Chọn danh mục phụ --</option>
                    {formSubCats.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Giá bán (VND) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tồn kho (Stock) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="d-block">Kích thước (Sizes) *</Form.Label>
              <div className="d-flex gap-3">
                {AVAILABLE_SIZES.map((sz) => (
                  <Form.Check
                    inline
                    key={sz}
                    type="checkbox"
                    id={`modal-size-${sz}`}
                    label={sz}
                    checked={form.sizes.includes(sz)}
                    onChange={() => handleSizeToggle(sz)}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Chất liệu</Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: 100% Cotton Lạnh"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả chi tiết</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Link hình ảnh (URL)</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit">
                {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

