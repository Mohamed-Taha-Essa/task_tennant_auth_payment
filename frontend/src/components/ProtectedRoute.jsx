import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Container, Spinner } from 'react-bootstrap';

function ProtectedRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const location = useLocation();

  // Wait for the store to hydrate before making auth decisions
  if (!hasHydrated) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading...</p>
      </Container>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute; 