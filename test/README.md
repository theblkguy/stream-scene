# Test Configuration Guide

This directory contains all tests for the StreamScene application.

## Setup

### 1. Configure Test Database

Create a `.env.test` file in the root directory with your test database credentials:

```env
DB_HOST=localhost
DB_NAME=streamscene_test
DB_USER=your_test_user
DB_PASS=your_test_password
```

### 2. Initialize Test Database

Run the database setup script to create test database tables:

```bash
npm run test:setup init
```

Or manually create the test database:

```sql
CREATE DATABASE IF NOT EXISTS streamscene_test;
```

Then run the setup script.

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Structure

```
test/
├── api/              # API endpoint tests
├── models/           # Model/ORM tests
├── services/         # Service layer tests
├── integration/      # End-to-end integration tests
├── helpers/          # Test helper utilities
├── mocks/            # Mock objects (S3, Socket.io, etc.)
├── fixtures/         # Sample test data
├── config/           # Test configuration
└── setup.ts          # Test setup and initialization
```

## Test Files

- `test/api/profile.test.ts` - Profile API endpoint tests (22 tests)
- `test/api/messaging.test.ts` - Messaging API endpoint tests (31 tests)
- `test/models/user.test.ts` - User model tests (27 tests)
- `test/models/conversation.test.ts` - Conversation model tests (9 tests)
- `test/models/message.test.ts` - Message model tests (9 tests)
- `test/integration/profile-flow.test.ts` - Profile integration tests (6 tests)
- `test/integration/messaging-flow.test.ts` - Messaging integration tests (4 tests)
- `test/services/websocket-messaging.test.ts` - WebSocket tests (18 tests)

**Total: ~126 test cases**

## Test Helpers

### Database Helpers
- `createTestUser()` - Create a test user
- `createTestConversation()` - Create a test conversation
- `createTestMessage()` - Create a test message
- `cleanupTestData()` - Clean up all test data
- `resetTestDatabase()` - Reset test database

### Authentication Helpers
- `createAuthenticatedRequest()` - Create authenticated supertest agent
- `setAuthOnRequest()` - Manually set authentication on request

### Mock Helpers
- `mockS3Upload()` - Mock S3 upload operations
- `createMockSocketIOServer()` - Create mock Socket.io server

## Running Specific Tests

```bash
# Run only profile tests
NODE_ENV=test NODE_OPTIONS='--import tsx/esm' mocha test/api/profile.test.ts

# Run only model tests
NODE_ENV=test NODE_OPTIONS='--import tsx/esm' mocha test/models/*.test.ts
```

## Troubleshooting

### Database Connection Errors

If tests fail with database connection errors:

1. Check that `.env.test` exists and has correct credentials
2. Ensure test database exists: `CREATE DATABASE streamscene_test;`
3. Verify database user has permissions
4. Run `npm run test:setup init` to initialize tables

### Tests Timing Out

Increase timeout in `.mocharc.json`:
```json
{
  "timeout": 60000
}
```

### Clean Database State

To reset test database:

```bash
npm run test:setup drop
npm run test:setup init
```

## Best Practices

1. **Test Isolation**: Each test should clean up after itself
2. **Database State**: Use `beforeEach` to reset test data
3. **Mocking**: Mock external services (S3, external APIs)
4. **Assertions**: Use descriptive test names and assertions
5. **Coverage**: Aim for 80%+ code coverage

## Notes

- Tests use a separate test database to avoid affecting development data
- All tests run with `NODE_ENV=test`
- External services are mocked in test environment
- WebSocket tests require proper Socket.io server setup

