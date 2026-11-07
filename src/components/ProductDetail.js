import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:9999";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await axios.get(`${API_URL}/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError("Không tìm thấy thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  async function handleAddToCart() {
    setError("");
    setSuccessMessage("");

    // Nếu chưa đăng nhập thì chuyển sang trang login
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Kiểm tra đã chọn size chưa
    if (!selectedSize) {
      setError("Vui lòng chọn size trước khi thêm vào giỏ");
      return;
    }

    if (quantity < 1) {
      setError("Số lượng tối thiểu là 1");
      return;
    }

    try {
      // 1. Lấy giỏ hàng của user hiện tại
      const cartResponse = await axios.get(`${API_URL}/carts`, {
        params: { userId: currentUser.id },
      });
      const carts = cartResponse.data;
      let userCart = carts.length > 0 ? carts[0] : null;
      let currentItems = userCart ? [...userCart.items] : [];

      // 2. Tính tổng số lượng của sản phẩm này hiện có trong giỏ (mọi size)
      let currentTotalInCart = 0;
      for (let i = 0; i < currentItems.length; i++) {
        if (currentItems[i].productId === product.id) {
          currentTotalInCart += currentItems[i].quantity;
        }
      }

      // Kiểm tra không được vượt quá tồn kho
      if (currentTotalInCart + quantity > product.stock) {
        setError(
          `Trong giỏ đã có ${currentTotalInCart} sản phẩm này. Bạn chỉ có thể thêm tối đa ${
            product.stock - currentTotalInCart
          } sản phẩm nữa (tồn kho: ${product.stock}).`
        );
        return;
      }

      // 3. Nếu đã có dòng cùng productId và cùng size thì cộng dồn số lượng
      let foundIndex = -1;
      for (let i = 0; i < currentItems.length; i++) {
        if (
          currentItems[i].productId === product.id &&
          currentItems[i].size === selectedSize
        ) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex >= 0) {
        currentItems[foundIndex].quantity += quantity;
      } else {
        // Chưa có dòng cùng size: thêm dòng mới
        currentItems.push({
          productId: product.id,
          productName: product.name,
          imageUrl: product.imageUrl,
          size: selectedSize,
          quantity: quantity,
          price: product.price,
        });
      }

      // 4. Lưu giỏ hàng vào database.json
      if (userCart) {
        // Đã có giỏ hàng: dùng PUT để cập nhật toàn bộ giỏ
        await axios.put(`${API_URL}/carts/${userCart.id}`, {
          ...userCart,
          items: currentItems,
        });
      } else {
        // Chưa có giỏ: dùng POST để tạo mới (không gửi id để json-server tự sinh)
        await axios.post(`${API_URL}/carts`, {
          userId: currentUser.id,
          items: currentItems,
        });
      }

      setSuccessMessage("Đã thêm sản phẩm vào giỏ hàng thành công!");
    } catch (err) {
      setError("Có lỗi khi thêm vào giỏ hàng. Vui lòng thử lại!");
    }
  }

  if (loading) {
    return (
      <Container className="py-5">
        <p>Đang tải chi tiết sản phẩm...</p>
      </Container>
    );
  }

  if (error && !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/" className="btn btn-secondary">
          Quay lại danh sách sản phẩm
        </Link>
      </Container>
    );
  }

  const isInactive = product.isActive === false;
  const isOutOfStock = product.stock === 0;

  return (
    <Container className="py-4">
      <Link to="/" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Quay lại danh sách sản phẩm
      </Link>

      {/* Thông báo nếu sản phẩm đã ngừng kinh doanh */}
      {isInactive && (
        <Alert variant="warning" className="fw-bold">
          Sản phẩm đã ngừng kinh doanh
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="g-4">
        {/* Ảnh sản phẩm */}
        <Col md={5}>
          <Card>
            <Card.Img
              variant="top"
              src={product.imageUrl}
              alt={product.name}
              style={{ maxHeight: 500, objectFit: "cover" }}
            />
          </Card>
        </Col>

        {/* Thông tin chi tiết */}
        <Col md={7}>
          <h2 className="mb-2">{product.name}</h2>
          <div className="text-muted mb-2">
            Danh mục: <strong>{product.subCategory}</strong>
          </div>

          <h3 className="text-danger fw-bold mb-3">
            {product.price.toLocaleString("vi-VN")} ₫
          </h3>

          <div className="mb-3">
            <span className="me-2">Trạng thái:</span>
            {isInactive ? (
              <Badge bg="secondary">Ngừng bán</Badge>
            ) : product.stock > 0 ? (
              <Badge bg="success">Còn hàng ({product.stock})</Badge>
            ) : (
              <Badge bg="secondary">Hết hàng</Badge>
            )}
          </div>

          {product.material && (
            <p className="mb-2">
              <strong>Chất liệu:</strong> {product.material}
            </p>
          )}

          {product.description && (
            <p className="mb-3">
              <strong>Mô tả:</strong> {product.description}
            </p>
          )}

          <hr />

          {/* Chọn Size */}
          <div className="mb-3">
            <Form.Label className="fw-bold">Chọn Size *</Form.Label>
            <div className="d-flex gap-2">
              {product.sizes &&
                product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "dark" : "outline-dark"}
                    onClick={() => setSelectedSize(size)}
                    disabled={isInactive || isOutOfStock}
                  >
                    {size}
                  </Button>
                ))}
            </div>
          </div>

          {/* Chọn số lượng */}
          <div className="mb-3" style={{ maxWidth: 160 }}>
            <Form.Label className="fw-bold">Số lượng</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isInactive || isOutOfStock}
            />
          </div>

          {/* Nút Thêm vào giỏ hàng: Seller và Admin bị ẩn */}
          {(!currentUser || currentUser.role === "Customer") && (
            <Button
              variant="primary"
              size="lg"
              className="mt-2 w-100"
              onClick={handleAddToCart}
              disabled={isInactive || isOutOfStock}
            >
              {isInactive
                ? "Sản phẩm đã ngừng kinh doanh"
                : isOutOfStock
                ? "Hết hàng"
                : "Thêm vào giỏ hàng"}
            </Button>
          )}

          {currentUser && currentUser.role !== "Customer" && (
            <Alert variant="info" className="mt-3">
              Tài khoản {currentUser.role} không thể mua hàng.
            </Alert>
          )}

          <hr className="my-4" />

          {/* Bảng hướng dẫn chọn size */}
          <h5>Bảng hướng dẫn chọn size</h5>
          <Table bordered striped size="sm" className="mt-2 text-center">
            <thead>
              <tr className="table-secondary">
                <th>Size</th>
                <th>Chiều cao</th>
                <th>Cân nặng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>S</strong></td>
                <td>1m50 - 1m60</td>
                <td>40 - 50 kg</td>
              </tr>
              <tr>
                <td><strong>M</strong></td>
                <td>1m60 - 1m70</td>
                <td>50 - 60 kg</td>
              </tr>
              <tr>
                <td><strong>L</strong></td>
                <td>1m68 - 1m75</td>
                <td>60 - 70 kg</td>
              </tr>
              <tr>
                <td><strong>XL</strong></td>
                <td>1m75 - 1m85</td>
                <td>70 - 80 kg</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

