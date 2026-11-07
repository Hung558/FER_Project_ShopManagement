import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PaymentModal from "./PaymentModal";

const API_URL = "http://localhost:9999";

export default function Cart() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [productsMap, setProductsMap] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Điền sẵn thông tin giao hàng từ currentUser
  useEffect(() => {
    if (currentUser) {
      setShippingInfo({
        fullName: currentUser.fullName || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      });
    }
  }, [currentUser]);

  // Tải dữ liệu giỏ hàng và danh sách sản phẩm
  async function fetchCartData() {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [cartRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/carts`, { params: { userId: currentUser.id } }),
        axios.get(`${API_URL}/products`),
      ]);

      const pMap = {};
      prodRes.data.forEach((p) => {
        pMap[p.id] = p;
      });
      setProductsMap(pMap);

      if (cartRes.data.length > 0) {
        const userCart = cartRes.data[0];
        setCart(userCart);

        // Mặc định chọn tất cả các dòng còn bán (isActive !== false)
        const activeKeys = [];
        (userCart.items || []).forEach((item) => {
          const prod = pMap[item.productId];
          const isInactive = prod && prod.isActive === false;
          if (!isInactive) {
            activeKeys.push(`${item.productId}_${item.size}`);
          }
        });
        setSelectedKeys(activeKeys);
      } else {
        setCart({ userId: currentUser.id, items: [] });
        setSelectedKeys([]);
      }
    } catch (err) {
      setError("Không thể tải thông tin giỏ hàng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Xử lý thay đổi số lượng
  async function handleUpdateQuantity(item, delta) {
    if (!cart) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    const prod = productsMap[item.productId];
    if (prod && newQty > prod.stock) {
      alert(`Số lượng vượt quá tồn kho (tồn kho: ${prod.stock})`);
      return;
    }

    const updatedItems = cart.items.map((it) => {
      if (it.productId === item.productId && it.size === item.size) {
        return { ...it, quantity: newQty };
      }
      return it;
    });

    try {
      await axios.put(`${API_URL}/carts/${cart.id}`, {
        ...cart,
        items: updatedItems,
      });
      setCart({ ...cart, items: updatedItems });
    } catch (err) {
      alert("Không cập nhật được số lượng!");
    }
  }

  // Xóa một dòng khỏi giỏ
  async function handleRemoveItem(item) {
    if (!cart) return;
    const updatedItems = cart.items.filter(
      (it) => !(it.productId === item.productId && it.size === item.size)
    );

    try {
      await axios.put(`${API_URL}/carts/${cart.id}`, {
        ...cart,
        items: updatedItems,
      });
      setCart({ ...cart, items: updatedItems });

      const itemKey = `${item.productId}_${item.size}`;
      setSelectedKeys(selectedKeys.filter((k) => k !== itemKey));
    } catch (err) {
      alert("Không xóa được sản phẩm khỏi giỏ!");
    }
  }

  // Chọn / bỏ chọn 1 dòng
  function handleToggleSelect(item) {
    const itemKey = `${item.productId}_${item.size}`;
    if (selectedKeys.includes(itemKey)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== itemKey));
    } else {
      setSelectedKeys([...selectedKeys, itemKey]);
    }
  }

  // Lọc các sản phẩm đang được chọn
  const cartItems = cart?.items || [];
  const selectedItems = cartItems.filter((item) => {
    const key = `${item.productId}_${item.size}`;
    const prod = productsMap[item.productId];
    const isInactive = prod && prod.isActive === false;
    return !isInactive && selectedKeys.includes(key);
  });

  // Tính tổng tiền các dòng được chọn
  let totalSelectedAmount = 0;
  for (let i = 0; i < selectedItems.length; i++) {
    totalSelectedAmount += selectedItems[i].price * selectedItems[i].quantity;
  }

  // Xử lý bấm Thanh toán
  async function handleCheckout() {
    setError("");

    if (selectedItems.length === 0) {
      setError("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
      return;
    }
    if (!shippingInfo.phone.trim()) {
      setError("Vui lòng nhập số điện thoại nhận hàng");
      return;
    }
    if (!shippingInfo.address.trim()) {
      setError("Vui lòng nhập địa chỉ nhận hàng");
      return;
    }

    try {
      // 1. Lấy lại thông tin sản phẩm mới nhất từ server để kiểm tra stock & isActive
      const freshProductsRes = await axios.get(`${API_URL}/products`);
      const freshMap = {};
      freshProductsRes.data.forEach((p) => {
        freshMap[p.id] = p;
      });

      // Kiểm tra xem có sản phẩm nào ngừng bán hoặc vượt tồn kho không
      const qtyByProduct = {};
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const freshProd = freshMap[item.productId];

        if (!freshProd || freshProd.isActive === false) {
          setError(
            `Sản phẩm "${item.productName}" đã ngừng kinh doanh. Vui lòng bỏ chọn khỏi đơn hàng.`
          );
          return;
        }

        qtyByProduct[item.productId] =
          (qtyByProduct[item.productId] || 0) + item.quantity;
      }

      for (const prodId in qtyByProduct) {
        const freshProd = freshMap[prodId];
        if (freshProd && qtyByProduct[prodId] > freshProd.stock) {
          setError(
            `Sản phẩm "${freshProd.name}" chỉ còn ${freshProd.stock} cái trong kho (bạn đang chọn ${qtyByProduct[prodId]}). Vui lòng điều chỉnh lại số lượng.`
          );
          return;
        }
      }

      // 2. Tạo đơn hàng mới trạng thái PendingPayment (không gửi id để json-server tự sinh)
      const newOrder = {
        customerId: currentUser.id,
        customerName: shippingInfo.fullName.trim() || currentUser.username,
        phone: shippingInfo.phone.trim(),
        shippingAddress: shippingInfo.address.trim(),
        items: selectedItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          size: it.size,
          quantity: it.quantity,
          price: it.price,
        })),
        totalAmount: totalSelectedAmount,
        paymentMethod: null,
        status: "PendingPayment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const orderResponse = await axios.post(`${API_URL}/orders`, newOrder);
      const created = orderResponse.data;

      // 3. Xóa các dòng vừa đặt khỏi giỏ hàng
      const remainingItems = cartItems.filter((it) => {
        const key = `${it.productId}_${it.size}`;
        return !selectedKeys.includes(key);
      });

      await axios.put(`${API_URL}/carts/${cart.id}`, {
        ...cart,
        items: remainingItems,
      });

      // Cập nhật lại giỏ hàng hiển thị
      setCart({ ...cart, items: remainingItems });
      setSelectedKeys([]);

      // 4. Mở modal thanh toán giả lập ngay lập tức
      setCreatedOrder(created);
      setShowPaymentModal(true);
    } catch (err) {
      setError("Có lỗi khi tạo đơn hàng. Vui lòng thử lại!");
    }
  }

  // Khi modal thanh toán thành công
  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    navigate("/customer/orders");
  }

  if (loading) {
    return (
      <Container className="py-5">
        <p>Đang tải giỏ hàng...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h3 className="mb-4">Giỏ hàng của bạn</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      {cartItems.length === 0 ? (
        <Alert variant="info">
          Giỏ hàng của bạn đang trống. <Link to="/">Mua sắm ngay</Link>!
        </Alert>
      ) : (
        <Row className="g-4">
          <Col lg={8}>
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}>Chọn</th>
                  <th>Sản phẩm</th>
                  <th>Size</th>
                  <th>Đơn giá</th>
                  <th style={{ width: 140 }}>Số lượng</th>
                  <th>Thành tiền</th>
                  <th style={{ width: 80 }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const key = `${item.productId}_${item.size}`;
                  const prod = productsMap[item.productId];
                  const isInactive = prod && prod.isActive === false;
                  const isChecked = !isInactive && selectedKeys.includes(key);

                  return (
                    <tr
                      key={key}
                      className={isInactive ? "table-secondary text-muted" : ""}
                    >
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={isChecked}
                          disabled={isInactive}
                          onChange={() => handleToggleSelect(item)}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              marginRight: 10,
                              borderRadius: 4,
                            }}
                          />
                          <div>
                            <div className="fw-semibold">{item.productName}</div>
                            {isInactive && (
                              <span className="badge bg-danger mt-1">
                                Sản phẩm đã ngừng kinh doanh
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-dark">{item.size}</span>
                      </td>
                      <td>{item.price.toLocaleString("vi-VN")} ₫</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            disabled={isInactive || item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="px-2 fw-bold">{item.quantity}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            disabled={isInactive}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="fw-bold text-danger">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(item)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Col>

          {/* Cột thông tin nhận hàng và thanh toán */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-dark text-white fw-bold">
                Thông tin nhận hàng
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Họ và tên người nhận</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingInfo.fullName}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingInfo.phone}
                    onChange={(e) =>
                      setShippingInfo({ ...shippingInfo, phone: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ giao hàng *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={shippingInfo.address}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        address: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span>Số món đã chọn:</span>
                  <span className="fw-bold">{selectedItems.length}</span>
                </div>

                <div className="d-flex justify-content-between mb-3 fs-5">
                  <span className="fw-bold">Tổng thanh toán:</span>
                  <span className="fw-bold text-danger">
                    {totalSelectedAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <Button
                  variant="success"
                  size="lg"
                  className="w-100"
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                >
                  Thanh toán
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal thanh toán */}
      {createdOrder && (
        <PaymentModal
          show={showPaymentModal}
          order={createdOrder}
          onClose={() => {
            setShowPaymentModal(false);
            navigate("/customer/orders");
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Container>
  );
}

