import { Container, Alert } from 'react-bootstrap';

const Cancel = () => {
  return (
    <Container className="mt-5">
      <Alert variant="danger">
        <Alert.Heading>Payment Canceled</Alert.Heading>
        <p>
          Your payment was not processed. You can try again from the plans page.
        </p>
      </Alert>
    </Container>
  );
};

export default Cancel;
