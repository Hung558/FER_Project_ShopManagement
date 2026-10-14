import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import ProductCard from "./ProductCard";

const API_URL = "http://localhost:9999";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Chỉ lấy sản phẩm đang bán, sản phẩm ngừng bán bị ẩn khỏi khách
        const productResponse = await axios.get(`${API_URL}/products`, {
          params: { isActive: true },
        });
        const categoryResponse = await axios.get(`${API_URL}/categories`);
        setProducts(productResponse.data);
        setCategories(categoryResponse.data);
      } catch (err) {
        setError("Không kết nối được server. Hãy chạy json-server ở cổng 9999");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Đổi danh mục chính thì reset danh mục phụ
  function handleCategoryChange(event) {
    setSelectedCategoryId(event.target.value);
    setSelectedSubCategory("");
  }

  // Danh mục phụ chỉ gồm các mục thuộc danh mục chính đang chọn
  let subCategories = [];
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );
  if (selectedCategory) {
    subCategories = selectedCategory.subCategories;
  }

  // Lọc theo tên (không phân biệt hoa thường) và theo danh mục
  const keyword = searchText.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!product.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (selectedCategoryId !== "" && product.categoryId !== selectedCategoryId) {
      return false;
    }
    if (selectedSubCategory !== "" && product.subCategory !== selectedSubCategory) {
      return false;
    }
    return true;
  });

  return (
    <Container className="py-4">
      <h3 className="mb-4">Sản phẩm</h3>

      <Row className="g-2 mb-4">
        <Col md={6}>
          <Form.Control
            placeholder="Tìm theo tên sản phẩm..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={selectedCategoryId} onChange={handleCategoryChange}>
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedSubCategory}
            onChange={(event) => setSelectedSubCategory(event.target.value)}
            disabled={selectedCategoryId === ""}
          >
            <option value="">Tất cả danh mục phụ</option>
            {subCategories.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading && <p>Đang tải sản phẩm...</p>}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && filteredProducts.length === 0 && (
        <Alert variant="info">Không tìm thấy sản phẩm nào.</Alert>
      )}

      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {filteredProducts.map((product) => (
          <Col key={product.id}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
