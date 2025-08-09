import { Container, Alert } from 'react-bootstrap';

const Success = () => {
  return (
    <Container className="mt-5">
      <Alert variant="success">
        <Alert.Heading>Payment Successful!</Alert.Heading>
        <p>
          Your subscription has been activated. Thank you for your purchase!
        </p>
      </Alert>
    </Container>
  );
};

export default Success;
