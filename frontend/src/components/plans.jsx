import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

const Plans = () => {
    const navigate = useNavigate();
  const { accessToken } = useAuthStore((state) => state);

  const handleSubscribe = (planId) => {
    if (accessToken) {
      navigate(`/payment/${planId}`);
    } else {
      navigate('/login', { state: { from: 'plans', planId: planId } });
    }
  };

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Ensure your Django backend is running and accessible at this URL
        const response = await axios.get('http://127.0.0.1:8000/subscriptions/api/plans/');
        setPlans(response.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Error fetching plans: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h1 className="mb-4 text-center">Choose Your Plan</h1>
      <Row>
        {plans.map((plan) => (
          <Col key={plan.id} md={4} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Header as="h5">{plan.name}</Card.Header>
              <Card.Body>
                <Card.Title className="display-4">${plan.price}</Card.Title>
                <Card.Text>/month</Card.Text>
                <ul className="list-unstyled mt-3 mb-4">
                  <li>{plan.max_users} user(s) included</li>
                </ul>
                <Button onClick={() => handleSubscribe(plan.id)} variant="primary" size="lg">Subscribe</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Plans;