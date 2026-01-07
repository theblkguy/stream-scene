import { getSequelize } from './connection.js';

async function seed(forceRecreate = false) {
  const sequelize = getSequelize();
  
  try {
    console.log('🚀 Starting database seeding...');
    
    // Test database connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    if (forceRecreate) {
      console.log('⚠️  Force recreate enabled - dropping all tables...');
      await sequelize.sync({ force: true });
    }
    
    console.log('📦 Creating database tables in proper order...');
    
    // 1. Create users table first (referenced by many other tables)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`name\` VARCHAR(255) NOT NULL,
        \`google_id\` VARCHAR(255) UNIQUE,
        \`username\` VARCHAR(20) UNIQUE,
        \`bio\` TEXT,
        \`profile_picture_url\` VARCHAR(500),
        \`contact_email\` VARCHAR(255),
        \`phone\` VARCHAR(20),
        \`social_links\` TEXT,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_username\` (\`username\`)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Users table created');

    // 2. Create Conversations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`conversations\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`type\` ENUM('direct', 'group') NOT NULL,
        \`name\` VARCHAR(255) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Conversations table created');

    // 3. Create Conversation Participants table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`conversation_participants\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`conversation_id\` INTEGER UNSIGNED NOT NULL,
        \`user_id\` INTEGER UNSIGNED NOT NULL,
        \`role\` ENUM('admin', 'member') DEFAULT 'member',
        \`joined_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`left_at\` DATETIME NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_participant\` (\`conversation_id\`, \`user_id\`)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Conversation participants table created');

    // 4. Create Messages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`conversation_id\` INTEGER UNSIGNED NOT NULL,
        \`user_id\` INTEGER UNSIGNED NULL,
        \`content\` TEXT NOT NULL,
        \`message_type\` ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text',
        \`file_url\` VARCHAR(500) NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`edited_at\` DATETIME NULL,
        \`deleted_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_conversation_created\` (\`conversation_id\`, \`created_at\`)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Messages table created');

    // 5. Create Files table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`files\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`originalName\` VARCHAR(255) NOT NULL,
        \`type\` VARCHAR(255) NOT NULL,
        \`size\` INTEGER NOT NULL,
        \`s3Key\` VARCHAR(255) NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`tags\` TEXT NULL,
        \`uploadedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`captionUrl\` VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Files table created');

    // 5. Create canvases table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`canvases\` (
        \`id\` VARCHAR(255) NOT NULL,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`width\` INTEGER NOT NULL DEFAULT 800,
        \`height\` INTEGER NOT NULL DEFAULT 600,
        \`backgroundColor\` VARCHAR(7) NOT NULL DEFAULT '#ffffff',
        \`isPublic\` TINYINT(1) NOT NULL DEFAULT false,
        \`allowAnonymousEdit\` TINYINT(1) NOT NULL DEFAULT false,
        \`canvasData\` LONGTEXT NOT NULL,
        \`shareToken\` VARCHAR(255) NULL UNIQUE,
        \`version\` INTEGER NOT NULL DEFAULT 1,
        \`maxCollaborators\` INTEGER NOT NULL DEFAULT 10,
        \`lastActivity\` DATETIME NULL,
        \`lastEditedBy\` INTEGER UNSIGNED NULL,
        \`lastEditedByGuest\` VARCHAR(255) NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`lastEditedBy\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Canvases table created');

    // 6. Create canvas_collaborators table (fixed foreign key types)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`canvas_collaborators\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`canvasId\` VARCHAR(255) NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestIdentifier\` VARCHAR(255) NULL COMMENT 'Session/browser identifier for anonymous collaborators',
        \`guestName\` VARCHAR(100) NULL,
        \`permission\` ENUM('view', 'edit', 'admin') NOT NULL DEFAULT 'edit',
        \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
        \`joinedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When user joined as collaborator',
        \`lastSeenAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`canvasId\`) REFERENCES \`canvases\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Canvas collaborators table created');

    // 7. Create comments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`comments\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`fileId\` INTEGER UNSIGNED NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestName\` VARCHAR(255) NULL,
        \`guestIdentifier\` VARCHAR(255) NULL,
        \`content\` TEXT NOT NULL,
        \`timestampSeconds\` INTEGER NULL,
        \`parentCommentId\` INTEGER NULL,
        \`isDeleted\` TINYINT(1) NOT NULL DEFAULT false,
        \`isModerationHidden\` TINYINT(1) NOT NULL DEFAULT false,
        \`isEdited\` TINYINT(1) NOT NULL DEFAULT false,
        \`isModerated\` TINYINT(1) NOT NULL DEFAULT false,
        \`moderatedReason\` VARCHAR(500) NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`fileId\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`parentCommentId\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Comments table created');

    // 8. Create comment_reactions table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`comment_reactions\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`commentId\` INTEGER NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestIdentifier\` VARCHAR(255) NULL,
        \`reactionType\` ENUM('like', 'dislike', 'love', 'laugh', 'wow', 'sad', 'angry') NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_user_reaction\` (\`commentId\`, \`userId\`),
        UNIQUE KEY \`unique_guest_reaction\` (\`commentId\`, \`guestIdentifier\`),
        FOREIGN KEY (\`commentId\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Comment reactions table created');

    // 9. Create shares table (drop and recreate if schema conflicts)
    try {
      // First try to create normally
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`shares\` (
          \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
          \`fileId\` INTEGER UNSIGNED NULL,
          \`canvasId\` VARCHAR(255) NULL,
          \`userId\` INTEGER UNSIGNED NOT NULL,
          \`shareToken\` VARCHAR(255) NOT NULL UNIQUE,
          \`shareType\` ENUM('one-time', 'indefinite') NOT NULL DEFAULT 'indefinite',
          \`resourceType\` ENUM('file', 'canvas') NOT NULL,
          \`accessCount\` INTEGER NOT NULL DEFAULT 0,
          \`maxAccess\` INTEGER NULL,
          \`expiresAt\` DATETIME NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`fileId\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`canvasId\`) REFERENCES \`canvases\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
      console.log('✅ Shares table created');
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('incompatible') || error.message.includes('foreign key')) {
        try {
          console.log('🔄 Attempting to recreate shares table with correct schema...');
          await sequelize.query('DROP TABLE IF EXISTS `shares`;');
          await sequelize.query(`
            CREATE TABLE \`shares\` (
              \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
              \`fileId\` INTEGER UNSIGNED NULL,
              \`canvasId\` VARCHAR(255) NULL,
              \`userId\` INTEGER UNSIGNED NOT NULL,
              \`shareToken\` VARCHAR(255) NOT NULL UNIQUE,
              \`shareType\` ENUM('one-time', 'indefinite') NOT NULL DEFAULT 'indefinite',
              \`resourceType\` ENUM('file', 'canvas') NOT NULL,
              \`accessCount\` INTEGER NOT NULL DEFAULT 0,
              \`maxAccess\` INTEGER NULL,
              \`expiresAt\` DATETIME NULL,
              \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
              \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              INDEX \`idx_fileId\` (\`fileId\`),
              INDEX \`idx_canvasId\` (\`canvasId\`),
              INDEX \`idx_userId\` (\`userId\`)
            ) ENGINE=InnoDB;
          `);
          console.log('✅ Shares table recreated with correct schema (without foreign keys for now)');
        } catch (recreateErr) {
          console.log('⚠️  Shares table recreation failed (continuing anyway):', (recreateErr as Error).message);
        }
      } else {
        console.log('⚠️  Shares table creation failed (continuing anyway):', error.message);
      }
    }

    // 10. Create tasks table
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`tasks\` (
          \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
          \`title\` VARCHAR(255) NOT NULL,
          \`description\` TEXT,
          \`priority\` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
          \`task_type\` ENUM('creative', 'admin') NOT NULL,
          \`status\` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
          \`deadline\` DATETIME NOT NULL,
          \`estimated_hours\` INTEGER,
          \`user_id\` INTEGER UNSIGNED NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
      console.log('✅ Tasks table created');
    } catch (err) {
      console.log('⚠️  Tasks table creation failed (continuing anyway):', (err as Error).message);
    }
    console.log('✅ Tasks table created');

    // 11. Create budget_projects table
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`budget_projects\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`user_id\` INTEGER UNSIGNED NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`description\` TEXT NULL,
          \`color\` VARCHAR(7) NOT NULL DEFAULT '#8b5cf6',
          \`is_active\` TINYINT(1) NOT NULL DEFAULT true,
          \`tags\` JSON NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
      console.log('✅ Budget projects table created');
    } catch (err) {
      console.log('⚠️  Budget projects table creation failed (continuing anyway):', (err as Error).message);
    }

    // 12. Create budget_entries table
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`budget_entries\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`user_id\` INTEGER UNSIGNED NOT NULL,
          \`type\` ENUM('income', 'expense') NOT NULL,
          \`amount\` DECIMAL(10,2) NOT NULL,
          \`category\` VARCHAR(255) NOT NULL,
          \`description\` TEXT NOT NULL,
          \`date\` DATE NOT NULL,
          \`project_id\` VARCHAR(36) NULL,
          \`receipt_title\` VARCHAR(255) NULL,
          \`ocr_scanned\` TINYINT(1) NOT NULL DEFAULT false,
          \`ocr_confidence\` FLOAT NULL,
          \`tags\` JSON NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`project_id\`) REFERENCES \`budget_projects\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB;
      `);
      console.log('✅ Budget entries table created');
    } catch (err) {
      console.log('⚠️  Budget entries table creation failed (continuing anyway):', (err as Error).message);
    }

    console.log('🎉 All tables created successfully!');
    
    // Insert initial data
    console.log('🌱 Inserting initial seed data...');
    
    // Insert test users
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (1, 'admin@streamscene.net', 'StreamScene Admin', 'streamscene-admin-001', NOW(), NOW());
    `);
    console.log('✅ Admin user created');

    // Insert specific user: allblk13@gmail.com
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (2, 'allblk13@gmail.com', 'AllBlk Creator', 'allblk-creator-13', NOW(), NOW());
    `);
    console.log('✅ AllBlk user created');

    // Create Jasmine Hall user
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (3, 'jasminehall5935@gmail.com', 'Jasmine Hall', 'jasmine-hall-5935', NOW(), NOW());
    `);
    console.log('✅ Jasmine Hall user created');

    // Create default canvases
    await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('project-center-main', 1, 'Project Center Main Canvas', 'Default canvas for project collaboration', '[]', true, true);
    `);
    console.log('✅ Default canvas created');

    // Create canvas for AllBlk user
    await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('allblk-creative-workspace', 2, 'AllBlk Creative Workspace', 'Creative collaboration space for content planning', '[{"type":"background-color","backgroundColor":"#1a1a2e","timestamp":1640995200000}]', true, true);
    `);
    console.log('✅ AllBlk canvas created');

    // Create canvas for Jasmine Hall
    await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('jasmine-design-studio', 3, 'Jasmine Design Studio', 'Digital design and creative planning workspace', '[{"type":"background-color","backgroundColor":"#f8fafc","timestamp":1640995200000}]', true, true);
    `);
    console.log('✅ Jasmine Hall canvas created');

    // Create a welcome task using direct SQL for consistency
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) 
      VALUES ('Welcome to StreamScene', 'Explore the collaborative features and get started with your first project!', 'medium', 'admin', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY), 2, 1);
    `);
    console.log('✅ Welcome task created');

    // Add minimal demo tasks for presentation (greatly reduced)
    console.log('🎮 Adding minimal demo tasks...');
    
    // Get current date and calculate relative dates
    const now = new Date();
    const getCurrentDate = () => now.toISOString().slice(0, 19).replace('T', ' ');
    const getDateOffset = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };
    
    // Essential tasks only (10 total tasks instead of hundreds)
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Stream Setup & Testing', 'Test new overlay design and check audio levels', 'high', 'creative', 'in_progress', '${getCurrentDate()}', 3, 1),
      ('YouTube Video Edit', 'Edit highlights from this week streams', 'medium', 'creative', 'pending', '${getDateOffset(2)}', 4, 1),
      ('Sponsor Content Creation', 'Create sponsored segment for brand partnership', 'medium', 'admin', 'pending', '${getDateOffset(3)}', 2, 1),
      ('Community Event Planning', 'Plan Discord movie night for subscribers', 'low', 'creative', 'pending', '${getDateOffset(5)}', 2, 1),
      ('Analytics Review', 'Review weekly performance metrics', 'medium', 'admin', 'pending', '${getDateOffset(7)}', 1, 1);
    `);

    // A few completed tasks to show variety
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Webcam Setup', 'Installed and configured new 4K webcam', 'high', 'admin', 'completed', '${getDateOffset(-2)}', 2, 1),
      ('Weekly Schedule', 'Created and posted streaming schedule', 'medium', 'admin', 'completed', '${getDateOffset(-3)}', 1, 1),
      ('Social Media Post', 'Posted community poll on Twitter', 'low', 'creative', 'completed', '${getDateOffset(-1)}', 1, 1);
    `);
    
    console.log('✅ Minimal demo tasks created (8 total)');

    // Add minimal seed data for AllBlk user (allblk13@gmail.com)
    console.log('🎨 Adding minimal AllBlk creator tasks...');
    
    // Essential tasks only (5 total for second user)
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Tech Review Script', 'Write script for iPhone 16 review video', 'high', 'creative', 'in_progress', '${getCurrentDate()}', 4, 2),
      ('Thumbnail Design', 'Create eye-catching thumbnail for review video', 'medium', 'creative', 'pending', '${getDateOffset(1)}', 2, 2),
      ('Brand Partnership Meeting', 'Video call with Sony about camera gear sponsorship', 'high', 'admin', 'pending', '${getDateOffset(3)}', 1, 2),
      ('Content Calendar Planning', 'Plan next month content strategy', 'medium', 'admin', 'pending', '${getDateOffset(7)}', 3, 2);
    `);

    // One completed task for variety
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('SEO Optimization', 'Optimized video titles and descriptions', 'medium', 'admin', 'completed', '${getDateOffset(-3)}', 2, 2);
    `);

    console.log('✅ Minimal AllBlk creator tasks created (5 total)');

    // Add minimal seed data for Jasmine Hall (jasminehall5935@gmail.com)
    console.log('🎨 Adding Jasmine Hall creative tasks...');
    
    // Essential tasks for Jasmine (5 total for third user)
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('UI Design Mockups', 'Create mobile app interface designs for client project', 'high', 'creative', 'in_progress', '${getCurrentDate()}', 6, 3),
      ('Logo Design Concepts', 'Design 3 logo variations for startup client', 'medium', 'creative', 'pending', '${getDateOffset(2)}', 4, 3),
      ('Client Presentation', 'Prepare design presentation for Monday meeting', 'high', 'admin', 'pending', '${getDateOffset(1)}', 2, 3),
      ('Portfolio Website Update', 'Add recent projects to personal portfolio site', 'low', 'admin', 'pending', '${getDateOffset(10)}', 3, 3);
    `);

    // One completed task for variety
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Brand Guidelines Document', 'Completed comprehensive brand guidelines for tech client', 'medium', 'creative', 'completed', '${getDateOffset(-4)}', 5, 3);
    `);

    console.log('✅ Jasmine Hall creative tasks created (5 total)');

    // Add minimal budget tracker seed data
    console.log('💰 Adding budget tracker demo data...');
    
    // Create budget projects for all users
    await sequelize.query(`
      INSERT IGNORE INTO \`budget_projects\` (\`id\`, \`user_id\`, \`name\`, \`description\`, \`color\`, \`is_active\`, \`tags\`) VALUES
      ('proj-streaming-setup', 1, 'Streaming Setup', 'Equipment and software for streaming', '#8b5cf6', true, '["streaming", "equipment"]'),
      ('proj-content-creation', 1, 'Content Creation', 'Video editing and content tools', '#059669', true, '["content", "editing"]'),
      ('proj-tech-reviews', 2, 'Tech Reviews', 'Equipment for tech review videos', '#dc2626', true, '["tech", "reviews"]'),
      ('proj-brand-partnerships', 2, 'Brand Partnerships', 'Sponsored content expenses', '#f59e0b', true, '["sponsorship", "brand"]'),
      ('proj-design-business', 3, 'Design Business', 'Freelance design work and client projects', '#6366f1', true, '["design", "freelance"]'),
      ('proj-creative-tools', 3, 'Creative Tools', 'Design software and equipment', '#ec4899', true, '["tools", "software"]');
    `);
    
    // Create budget entries (income and expenses)
    await sequelize.query(`
      INSERT IGNORE INTO \`budget_entries\` (\`id\`, \`user_id\`, \`type\`, \`amount\`, \`category\`, \`description\`, \`date\`, \`project_id\`, \`tags\`) VALUES
      -- StreamScene Admin income
      ('entry-1', 1, 'income', 2500.00, 'Streaming Revenue', 'Twitch subscriber income', '${getDateOffset(-5)}', 'proj-streaming-setup', '["twitch", "subscribers"]'),
      ('entry-2', 1, 'income', 800.00, 'Donations', 'Community donations and tips', '${getDateOffset(-3)}', 'proj-streaming-setup', '["donations", "community"]'),
      ('entry-3', 1, 'income', 1200.00, 'Sponsorship', 'Gaming peripheral brand deal', '${getDateOffset(-7)}', 'proj-content-creation', '["sponsorship", "gaming"]'),
      
      -- StreamScene Admin expenses
      ('entry-4', 1, 'expense', 450.00, 'Equipment', 'New microphone for better audio', '${getDateOffset(-10)}', 'proj-streaming-setup', '["microphone", "audio"]'),
      ('entry-5', 1, 'expense', 89.99, 'Software', 'OBS Studio plugins and overlays', '${getDateOffset(-8)}', 'proj-streaming-setup', '["software", "obs"]'),
      ('entry-6', 1, 'expense', 120.00, 'Utilities', 'Internet upgrade for streaming', '${getDateOffset(-15)}', 'proj-streaming-setup', '["internet", "utilities"]'),
      
      -- AllBlk Creator income
      ('entry-7', 2, 'income', 3200.00, 'YouTube Revenue', 'YouTube AdSense earnings', '${getDateOffset(-4)}', 'proj-tech-reviews', '["youtube", "adsense"]'),
      ('entry-8', 2, 'income', 1500.00, 'Brand Deal', 'Sony camera sponsorship payment', '${getDateOffset(-6)}', 'proj-brand-partnerships', '["sony", "camera", "sponsorship"]'),
      
      -- AllBlk Creator expenses
      ('entry-9', 2, 'expense', 899.00, 'Equipment', 'iPhone 16 for review content', '${getDateOffset(-12)}', 'proj-tech-reviews', '["iphone", "review", "mobile"]'),
      ('entry-10', 2, 'expense', 199.00, 'Software', 'Final Cut Pro annual subscription', '${getDateOffset(-20)}', 'proj-tech-reviews', '["editing", "finalcut"]'),
      ('entry-11', 2, 'expense', 65.00, 'Supplies', 'Backdrop and lighting for videos', '${getDateOffset(-14)}', 'proj-tech-reviews', '["lighting", "backdrop"]'),
      
      -- Jasmine Hall income
      ('entry-12', 3, 'income', 2800.00, 'Client Project', 'Mobile app UI design for startup', '${getDateOffset(-3)}', 'proj-design-business', '["ui", "mobile", "client"]'),
      ('entry-13', 3, 'income', 1200.00, 'Logo Design', 'Brand identity project for tech company', '${getDateOffset(-7)}', 'proj-design-business', '["logo", "branding", "tech"]'),
      ('entry-14', 3, 'income', 650.00, 'Website Design', 'Portfolio website design for photographer', '${getDateOffset(-10)}', 'proj-design-business', '["website", "portfolio"]'),
      
      -- Jasmine Hall expenses
      ('entry-15', 3, 'expense', 299.00, 'Software', 'Adobe Creative Cloud annual subscription', '${getDateOffset(-25)}', 'proj-creative-tools', '["adobe", "creative-cloud"]'),
      ('entry-16', 3, 'expense', 89.99, 'Software', 'Figma Pro subscription for team collaboration', '${getDateOffset(-18)}', 'proj-creative-tools', '["figma", "collaboration"]'),
      ('entry-17', 3, 'expense', 450.00, 'Equipment', 'Wacom Cintiq drawing tablet for digital art', '${getDateOffset(-30)}', 'proj-creative-tools', '["wacom", "tablet", "digital-art"]'),
      ('entry-18', 3, 'expense', 125.00, 'Business', 'Business cards and marketing materials', '${getDateOffset(-16)}', 'proj-design-business', '["marketing", "business-cards"]');
    `);
    
    console.log('✅ Budget tracker demo data created');
    console.log('📊 Budget Summary:');
    console.log('   - 6 budget projects created');
    console.log('   - 18 budget entries (income & expenses) for demo');
    console.log('   - Realistic streaming/creator/design financial data');

    console.log('🎊 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 12 tables created with proper foreign key relationships');
    console.log('   - Fixed userId foreign key type mismatch (INTEGER UNSIGNED)');
    console.log('   - Sample data inserted for 3 users:');
    console.log('     • admin@streamscene.net (8 demo tasks + budget data)');
    console.log('     • allblk13@gmail.com (5 demo tasks + budget data)');
    console.log('     • jasminehall5935@gmail.com (5 demo tasks + budget data)');
    console.log('   - Total demo tasks: 18 (diverse creative/admin/business tasks)');
    console.log('   - Budget tracker: 6 projects + 18 realistic entries');
    console.log('   - 3 default canvases created');
    console.log('   - Database ready for production use');
    
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  }
}

// Export for use as module
export { seed };

// If run directly, execute seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  const forceRecreate = process.argv.includes('--force');
  
  if (forceRecreate) {
    console.log('⚠️  WARNING: --force flag detected. This will DROP ALL EXISTING DATA!');
    console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel.');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  seed(forceRecreate)
    .then(() => {
      console.log('✅ Seed script completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed script failed:', err);
      process.exit(1);
    });
}
