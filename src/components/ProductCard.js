import { Badge, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Card className="h-100">
      <Card.Img
        variant="top"
        src={product.imageUrl}
        alt={product.name}
        style={{ height: 240, objectFit: "cover" }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6">{product.name}</Card.Title>
        <div className="fw-bold text-danger mb-2">
          {product.price.toLocaleString("vi-VN")} ₫
        </div>

        <div className="mb-3">
          {product.stock > 0 ? (
            <Badge bg="success">Còn hàng ({product.stock})</Badge>
          ) : (
            <Badge bg="secondary">Hết hàng</Badge>
          )}
        </div>

        <Button
          as={Link}
          to={`/products/${product.id}`}
          variant="outline-dark"
          size="sm"
          className="mt-auto"
        >
          Xem chi tiết
        </Button>
      </Card.Body>
    </Card>
  );
}
