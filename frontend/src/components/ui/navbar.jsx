import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

function AppNavbar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't render auth buttons until store is hydrated
  const renderAuthButton = () => {
    if (!hasHydrated) {
      return null; // Or a loading spinner
    }

    if (user) {
      // User is logged in - show user dropdown with logout
      return (
        <NavDropdown title={`Hello, ${user.username || user.email}`} id="user-dropdown">
          <NavDropdown.Item as={Link} to="/dashboard">
            Dashboard
          </NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout}>
            Logout
          </NavDropdown.Item>
        </NavDropdown>
      );
    } else {
      // User is not logged in - show login and signup buttons
      return (
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" as={Link} to="/login" className="text-decoration-none">
            Login
          </Button>
          <Button variant="success" size="sm" as={Link} to="/signup" className="text-decoration-none">
            Sign Up
          </Button>
        </div>
      );
    }
  };

  // Render navigation links based on authentication status
  const renderNavLinks = () => {
    if (!hasHydrated) {
      return null;
    }

    if (user) {
      // Authenticated user navigation
      return (
        <>
          <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/plans">Plans</Nav.Link>
        </>
      );
    } else {
      // Public navigation
      return (
        <>
          <Nav.Link as={Link} to="/plans">Plans</Nav.Link>
        </>
      );
    }
  };

  return (
    <Navbar expand="lg" className="bg-light shadow-sm">
      <Container> 
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          Eshtrak
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {renderNavLinks()}
          </Nav>
          <Nav className="ms-auto d-flex align-items-center">
            {renderAuthButton()}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;