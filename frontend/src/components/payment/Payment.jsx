import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '../../api/payment';
import useAuthStore from '../../store/authStore';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';

// Make sure to add your Stripe publishable key to your .env file
// VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const ensureValidToken = useAuthStore((state) => state.ensureValidToken);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hasHydrated) {
      return; // Wait for rehydration
    }

    const redirectToCheckout = async () => {
      // Check if user is authenticated
      if (!accessToken || !user) {
        setError('You must be logged in to make a payment. Please log in and try again.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        console.log('=== Payment Debug Info ===');
        console.log('Plan ID:', planId);
        console.log('User:', user);
        console.log('Access Token exists:', !!accessToken);

        // Ensure token is valid before making payment request
        console.log('Checking token validity...');
        const tokenValid = await ensureValidToken();
        
        if (!tokenValid) {
          setError('Your session has expired. Please log in again to continue with payment.');
          return;
        }

        // Get the current (possibly refreshed) token
        const currentToken = useAuthStore.getState().accessToken;
        console.log('Using token for payment:', currentToken ? `${currentToken.substring(0, 20)}...` : 'NO TOKEN');

        const res = await createCheckoutSession(planId, currentToken);
        console.log('Checkout session created:', res.data);
        const { sessionId } = res.data;
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          setError(`Stripe error: ${error.message}`);
        }
      } catch (err) {
        console.error('Payment error:', err);
        
        // Handle authentication errors specifically
        if (err.response?.status === 401) {
          const errorData = err.response?.data;
          if (errorData?.code === 'token_not_valid' || errorData?.detail?.includes('token')) {
            console.log('Token is invalid, logging out user');
            logout(); // Clear invalid token
            setError('Your session has expired. Please log in again to continue with payment.');
          } else {
            setError('Authentication failed. Please log in again.');
          }
        } else if (err.response?.status === 404) {
          setError('The selected plan was not found. Please try selecting a different plan.');
        } else if (err.response?.data?.error) {
          setError(`Payment error: ${err.response.data.error}`);
        } else {
          setError('Failed to create checkout session. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    redirectToCheckout();
  }, [planId, accessToken, user, hasHydrated, logout, ensureValidToken]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (error) {
    const isAuthError = error.includes('logged in') || error.includes('session has expired') || error.includes('Authentication failed');
    
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Payment Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end gap-2">
            {isAuthError ? (
              <Button variant="primary" onClick={handleLogin}>
                Go to Login
              </Button>
            ) : (
              <Button variant="outline-danger" onClick={handleRetry}>
                Try Again
              </Button>
            )}
          </div>
        </Alert>
      </Container>
    );
  }

  if (isProcessing) {
    return (
      <Container className="text-center mt-5">
        <h2>Redirecting to payment...</h2>
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="text-muted">Please wait while we prepare your payment session...</p>
      </Container>
    );
  }

  return (
    <Container className="text-center mt-5">
      <h2>Initializing payment...</h2>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </Container>
  );
};

export default Payment;
