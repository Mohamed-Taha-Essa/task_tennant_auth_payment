import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getUserProfile, getUserSubscription } from '../api/user';
import { 
  Container, Card, Button, Row, Col, Alert, Spinner, 
  Badge, ListGroup, ProgressBar 
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
  const auth = useAuthStore((state) => state);
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.user) return;

      try {
        setLoading(true);
        setError('');

        // Fetch user profile and subscription data in parallel
        const [profileResponse, subscriptionResponse] = await Promise.all([
          getUserProfile(),
          getUserSubscription()
        ]);

        setUserProfile(profileResponse.data);
        
        // Handle subscription data
        if (subscriptionResponse.data.has_subscription === false) {
          setSubscription(null);
        } else {
          setSubscription(subscriptionResponse.data);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.response?.status === 401) {
          auth.logout();
          navigate('/login');
        } else {
          setError('Failed to load user data. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.user, auth.logout, navigate]);

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  // Loading state
  if (!auth.user || loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { variant: 'secondary', text: 'No Active Plan' };
    if (subscription.status === 'active') return { variant: 'success', text: 'Active' };
    if (subscription.canceled_at) return { variant: 'warning', text: 'Canceled' };
    return { variant: 'info', text: subscription.status || 'Unknown' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <Container className="mt-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Welcome back, {auth.user.first_name || auth.user.username || 'User'}!</h2>
              <p className="text-muted mb-0">Here's an overview of your account</p>
            </div>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        {/* User Profile Card */}
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-user me-2"></i>
                Profile Information
              </h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0">
                  <strong>Name:</strong> 
                  <span className="ms-2">
                    {userProfile ? 
                      `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Not provided'
                      : auth.user.username || 'Not provided'
                    }
                  </span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <strong>Email:</strong> 
                  <span className="ms-2">{auth.user.email}</span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <strong>Member Since:</strong> 
                  <span className="ms-2">
                    {userProfile?.date_joined ? 
                      formatDate(userProfile.date_joined) : 
                      'N/A'
                    }
                  </span>
                </ListGroup.Item>
              </ListGroup>
              <div className="mt-3">
                <Button variant="outline-primary" size="sm" as={Link} to="/profile/edit">
                  Edit Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Subscription Card */}
        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-credit-card me-2"></i>
                  Subscription Details
                </h5>
                <Badge bg={subscriptionStatus.variant}>
                  {subscriptionStatus.text}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {subscription ? (
                <>
                  <Row>
                    <Col md={6}>
                      <h6 className="text-primary">Current Plan</h6>
                      <div className="mb-3">
                        <h4 className="mb-1">{subscription.plan?.name || 'Unknown Plan'}</h4>
                        <p className="text-muted mb-2">
                          <strong>${subscription.plan?.price || 0}/month</strong>
                        </p>
                        <p className="small text-muted">
                          Max Users: {subscription.plan?.max_users || 'Unlimited'}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-primary">Subscription Info</h6>
                      <ListGroup variant="flush" className="small">
                        <ListGroup.Item className="px-0 py-1">
                          <strong>Started:</strong> {formatDate(subscription.started_at)}
                        </ListGroup.Item>
                        <ListGroup.Item className="px-0 py-1">
                          <strong>Status:</strong> {subscription.status || 'Active'}
                        </ListGroup.Item>
                        {subscription.ended_at && (
                          <ListGroup.Item className="px-0 py-1">
                            <strong>Ends:</strong> {formatDate(subscription.ended_at)}
                          </ListGroup.Item>
                        )}
                        {subscription.source_id && (
                          <ListGroup.Item className="px-0 py-1">
                            <strong>Payment ID:</strong> 
                            <code className="ms-1">{subscription.source_id}</code>
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Col>
                  </Row>
                  
                  <hr />
                  
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" as={Link} to="/plans">
                      Change Plan
                    </Button>
                    <Button variant="outline-info" size="sm">
                      Billing History
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="fas fa-shopping-cart fa-3x text-muted"></i>
                  </div>
                  <h5>No Active Subscription</h5>
                  <p className="text-muted">You don't have an active subscription plan.</p>
                  <Button variant="success" as={Link} to="/plans">
                    Browse Plans
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-2">
                  <Button variant="outline-primary" className="w-100" as={Link} to="/plans">
                    <i className="fas fa-list me-2"></i>
                    View Plans
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="outline-success" className="w-100">
                    <i className="fas fa-download me-2"></i>
                    Download Invoice
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="outline-info" className="w-100">
                    <i className="fas fa-question-circle me-2"></i>
                    Get Support
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button variant="outline-secondary" className="w-100">
                    <i className="fas fa-cog me-2"></i>
                    Settings
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
