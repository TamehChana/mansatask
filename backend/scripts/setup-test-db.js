/**
 * Test Database Setup Script
 * 
 * This script helps set up the test database for E2E tests.
 * Run this before running E2E tests: node scripts/setup-test-db.js
 * 
 * Requirements:
 * - PostgreSQL must be running (via docker-compose or locally)
 * - DATABASE_URL must be set in environment or .env file
 */

const { execSync } = require('child_process');

async function setupTestDatabase() {
  console.log('🔧 Setting up test database for E2E tests...\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL or TEST_DATABASE_URL must be set');
    console.error('   Set it in your .env file or environment variables');
    console.error('   Example: DATABASE_URL=postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public');
    process.exit(1);
  }

  console.log(`📋 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  try {
    // Run Prisma migrations to set up the database schema
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: __dirname + '/..',
    });
    console.log('\n✅ Migrations applied successfully');

    // Generate Prisma Client to ensure it's up to date
    console.log('\n🔄 Generating Prisma Client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: __dirname + '/..',
    });
    console.log('✅ Prisma Client generated');

    console.log('\n✅ Test database setup complete!');
    console.log('   You can now run E2E tests: npm run test:e2e\n');
  } catch (error) {
    console.error('\n❌ ERROR setting up test database:');
    console.error(error.message);
    
    if (error.message.includes('does not exist') || error.message.includes('P1003')) {
      console.error('\n💡 The database does not exist. Please create it first:');
      console.error('   1. Make sure PostgreSQL is running: docker-compose up -d postgres');
      console.error('   2. Connect to PostgreSQL and create the database:');
      console.error('      psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE payment_link_db;"');
      console.error('   3. Or use docker exec:');
      console.error('      docker exec -it payment-link-postgres psql -U postgres -c "CREATE DATABASE payment_link_db;"');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
      console.error('\n💡 Cannot connect to PostgreSQL. Make sure it\'s running:');
      console.error('   docker-compose up -d postgres');
    } else {
      console.error('\n💡 Check that:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. DATABASE_URL is correct');
      console.error('   3. Database exists and is accessible');
    }
    
    process.exit(1);
  }
}

setupTestDatabase();

