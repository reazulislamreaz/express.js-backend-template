import { env } from '@/config/env.js';

const errorExample = {
  success: false,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [{ path: 'email', message: 'Invalid email address' }],
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: `${env.APP_NAME} API`,
    version: '1.0.0',
    description:
      'Production-ready Express API template with authentication, user management, health checks, and optional CSRF protection.',
    contact: {
      name: 'API Support',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: env.API_PREFIX,
      description: 'Current API prefix',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health and readiness checks.' },
    { name: 'Auth', description: 'Registration, login, refresh, logout, and current user.' },
    { name: 'Users', description: 'Authenticated user profile and admin user management.' },
    { name: 'Security', description: 'CSRF token support for cookie-based clients.' },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness check',
        description:
          'Returns basic process health. This endpoint does not check database connectivity.',
        security: [],
        responses: {
          '200': {
            description: 'Service is running.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
                example: {
                  success: true,
                  data: {
                    status: 'ok',
                    timestamp: '2026-07-07T05:30:00.000Z',
                    uptime: 123.45,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness check',
        description: 'Checks required database connectivity before reporting the service as ready.',
        security: [],
        responses: {
          '200': {
            description: 'All configured dependencies are ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadinessResponse' },
                example: {
                  success: true,
                  data: {
                    status: 'ready',
                    checks: { postgres: 'ok', mongodb: 'ok' },
                    timestamp: '2026-07-07T05:30:00.000Z',
                  },
                },
              },
            },
          },
          '503': {
            description: 'One or more dependencies are not ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadinessResponse' },
                example: {
                  success: false,
                  data: {
                    status: 'degraded',
                    checks: { postgres: 'ok', mongodb: 'error' },
                    timestamp: '2026-07-07T05:30:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        description: 'Creates a new active user and returns access and refresh tokens.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              example: {
                email: 'jane@example.com',
                password: 'StrongPass123',
                firstName: 'Jane',
                lastName: 'Doe',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                example: {
                  success: true,
                  data: {
                    user: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'jane@example.com',
                      firstName: 'Jane',
                      lastName: 'Doe',
                      role: 'USER',
                      isActive: true,
                      createdAt: '2026-07-07T05:30:00.000Z',
                    },
                    tokens: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
                      refreshToken: 'b4f2c07b0b6d4d4f9a2d...',
                      expiresIn: '7d',
                    },
                  },
                },
              },
            },
          },
          '409': { $ref: '#/components/responses/ConflictError' },
          '422': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/AuthRateLimitError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Authenticates an active user and returns a new access/refresh token pair.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: { email: 'jane@example.com', password: 'StrongPass123' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login succeeded.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                example: {
                  success: true,
                  data: {
                    user: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'jane@example.com',
                      firstName: 'Jane',
                      lastName: 'Doe',
                      role: 'USER',
                      isActive: true,
                      createdAt: '2026-07-07T05:30:00.000Z',
                    },
                    tokens: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example',
                      refreshToken: 'b4f2c07b0b6d4d4f9a2d...',
                      expiresIn: '7d',
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '422': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/AuthRateLimitError' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        description: 'Rotates a refresh token and returns a new access/refresh token pair.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              example: { refreshToken: 'b4f2c07b0b6d4d4f9a2d...' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Refresh token rotated successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                example: {
                  success: true,
                  data: {
                    user: {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'jane@example.com',
                      firstName: 'Jane',
                      lastName: 'Doe',
                      role: 'USER',
                      isActive: true,
                      createdAt: '2026-07-07T05:30:00.000Z',
                    },
                    tokens: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new',
                      refreshToken: 'f9d4d4f9a2db4f2c07b0b6...',
                      expiresIn: '7d',
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        description:
          'Revokes a refresh token. The endpoint is idempotent for already-revoked tokens.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              example: { refreshToken: 'b4f2c07b0b6d4d4f9a2d...' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout completed.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { success: true, data: { message: 'Logged out successfully' } },
              },
            },
          },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Returns the authenticated user profile from the current access token.',
        responses: {
          '200': {
            description: 'Current user profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    email: 'jane@example.com',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    role: 'USER',
                    isActive: true,
                    createdAt: '2026-07-07T05:30:00.000Z',
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Lists users with pagination. Requires an admin access token.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number, starting at 1.',
            schema: { type: 'integer', minimum: 1, default: 1 },
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of users per page.',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            example: 20,
          },
        ],
        responses: {
          '200': {
            description: 'Paginated users.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserListResponse' },
                example: {
                  success: true,
                  data: [
                    {
                      id: '550e8400-e29b-41d4-a716-446655440000',
                      email: 'jane@example.com',
                      firstName: 'Jane',
                      lastName: 'Doe',
                      role: 'USER',
                      isActive: true,
                      createdAt: '2026-07-07T05:30:00.000Z',
                      updatedAt: '2026-07-07T05:30:00.000Z',
                    },
                  ],
                  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Admins can view any profile. Normal users can only view their own profile.',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          '200': {
            description: 'User profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    email: 'jane@example.com',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    role: 'USER',
                    isActive: true,
                    createdAt: '2026-07-07T05:30:00.000Z',
                    updatedAt: '2026-07-07T05:30:00.000Z',
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user profile',
        description:
          'Admins can update any profile. Normal users can only update their own profile.',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
              example: { firstName: 'Janet', lastName: 'Doe' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    email: 'jane@example.com',
                    firstName: 'Janet',
                    lastName: 'Doe',
                    role: 'USER',
                    isActive: true,
                    createdAt: '2026-07-07T05:30:00.000Z',
                    updatedAt: '2026-07-07T05:35:00.000Z',
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/users/{id}/activity': {
      get: {
        tags: ['Users'],
        summary: 'Get user activity',
        description:
          'Returns recent MongoDB-backed activity events. Admins can view any user activity; normal users can only view their own.',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          '200': {
            description: 'Recent user activity events.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserActivityResponse' },
                example: {
                  success: true,
                  data: [
                    {
                      _id: '668b2f9db3a2f996a5d90f12',
                      userId: '550e8400-e29b-41d4-a716-446655440000',
                      action: 'profile_updated',
                      metadata: { fields: ['firstName'] },
                      createdAt: '2026-07-07T05:35:00.000Z',
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/csrf-token': {
      get: {
        tags: ['Security'],
        summary: 'Get CSRF token',
        description:
          'Returns a CSRF token when CSRF protection is enabled. Browser clients should send it as X-CSRF-Token for unsafe methods.',
        security: [],
        responses: {
          '200': {
            description: 'CSRF token generated.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CsrfTokenResponse' },
                example: { success: true, data: { csrfToken: 'csrf-token-value' } },
              },
            },
          },
          '404': {
            description: 'CSRF is disabled.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: { message: 'CSRF protection is disabled', code: 'CSRF_DISABLED' },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use the access token returned from register, login, or refresh.',
      },
    },
    parameters: {
      UserId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'User UUID.',
        schema: { type: 'string', format: 'uuid' },
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
    responses: {
      ValidationError: {
        description: 'Request validation failed.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: errorExample,
          },
        },
      },
      UnauthorizedError: {
        description: 'Authentication failed or token is missing/expired.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Authenticated user does not have permission.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource was not found.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: { message: 'User not found', code: 'NOT_FOUND' },
            },
          },
        },
      },
      ConflictError: {
        description: 'Resource conflict.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: { message: 'Email already registered', code: 'CONFLICT' },
            },
          },
        },
      },
      AuthRateLimitError: {
        description: 'Too many authentication attempts.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: {
                message: 'Too many authentication attempts, please try again later',
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          meta: { type: 'object', additionalProperties: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'Must contain uppercase, lowercase, and a number.',
          },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 1 },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'role', 'isActive', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'expiresIn'],
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'string', example: '7d' },
        },
      },
      AuthPayload: {
        type: 'object',
        required: ['user', 'tokens'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
          tokens: { $ref: '#/components/schemas/AuthTokens' },
        },
      },
      AuthSuccessResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AuthPayload' },
            },
          },
        ],
      },
      UserResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/User' },
            },
          },
        ],
      },
      UserListResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              meta: { $ref: '#/components/schemas/PaginationMeta' },
            },
          },
        ],
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 1 },
        },
      },
      HealthResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  timestamp: { type: 'string', format: 'date-time' },
                  uptime: { type: 'number', example: 123.45 },
                },
              },
            },
          },
        ],
      },
      ReadinessResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            required: ['status', 'checks', 'timestamp'],
            properties: {
              status: { type: 'string', enum: ['ready', 'degraded'] },
              checks: {
                type: 'object',
                additionalProperties: { type: 'string', enum: ['ok', 'error'] },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      UserActivity: {
        type: 'object',
        required: ['userId', 'action', 'createdAt'],
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          action: { type: 'string', example: 'profile_updated' },
          metadata: { type: 'object', additionalProperties: true },
          ip: { type: 'string' },
          userAgent: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserActivityResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/UserActivity' } },
            },
          },
        ],
      },
      CsrfTokenResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['csrfToken'],
                properties: { csrfToken: { type: 'string' } },
              },
            },
          },
        ],
      },
      MessageResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccess' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['message'],
                properties: { message: { type: 'string' } },
              },
            },
          },
        ],
      },
    },
  },
} as const;
