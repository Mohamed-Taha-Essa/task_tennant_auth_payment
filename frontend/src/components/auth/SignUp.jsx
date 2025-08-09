import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '../../api/auth';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';

const schema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  password2: z.string()
}).refine(data => data.password === data.password2, {
  message: "Passwords don't match",
  path: ["password2"],
});

function SignUp() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      const response = await signUp(data);
      console.log('Sign up successful:', response.data);
    } catch (error) {
      console.error('Sign up failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
    
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Sign Up</h2>
              <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3" controlId="first_name">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('first_name')}
                    isInvalid={!!errors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.first_name?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="last_name">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('last_name')}
                    isInvalid={!!errors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.last_name?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    {...register('email')}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    {...register('password')}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="password2">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    {...register('password2')}
                    isInvalid={!!errors.password2}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password2?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    Sign Up
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
     
      </Row>
    </Container>
  );
}

export default SignUp;



