require('dotenv').config();
const db = require('./src/models');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Test connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    await db.sequelize.sync({ force: process.argv.includes('--force') });
    console.log('✅ Database models synchronized');

    // Seed sample data if --seed flag is provided
    if (process.argv.includes('--seed')) {
      await seedSampleData();
    }

    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function seedSampleData() {
  console.log('🌱 Seeding sample data...');

  // Create sample store locations
  await db.StoreLocation.bulkCreate([
    {
      store_location_id: 'LOC-001',
      store_name: 'Main Warehouse',
      factory_name: 'Factory A',
      plant_building_name: 'Plant 1',
      location_hierarchy: 'Factory A > Plant 1 > Main Warehouse',
      total_area: 5000,
      status: 'active'
    },
    {
      store_location_id: 'LOC-002',
      store_name: 'Assembly Store',
      factory_name: 'Factory A',
      plant_building_name: 'Plant 1',
      location_hierarchy: 'Factory A > Plant 1 > Assembly Store',
      total_area: 2000,
      status: 'active'
    }
  ]);
  console.log('✅ Store locations created');

  // Create sample materials
  await db.Material.bulkCreate([
    {
      material_id: 'MAT-001',
      material_name: 'Door Panel Left',
      material_type: 'metal',
      category: 'Door',
      allowed_positions: ['left', 'left_upper', 'left_lower'],
      sfg_fg_classification: 'fg',
      status: 'active'
    },
    {
      material_id: 'MAT-002',
      material_name: 'Door Panel Right',
      material_type: 'metal',
      category: 'Door',
      allowed_positions: ['right', 'right_upper', 'right_lower'],
      sfg_fg_classification: 'fg',
      status: 'active'
    }
  ]);
  console.log('✅ Materials created');

  // Create sample trollies
  await db.Trolly.bulkCreate([
    {
      trolly_id: 'TROLLY-001',
      trolly_type: 'rack',
      rfid_tag: 'E280117000000201234567890',
      barcode: 'BC-TROLLY-001',
      status: 'active'
    },
    {
      trolly_id: 'TROLLY-002',
      trolly_type: 'bin',
      rfid_tag: 'E280117000000201234567891',
      barcode: 'BC-TROLLY-002',
      status: 'active'
    }
  ]);
  console.log('✅ Trollies created');

  // Create trolly-material mappings
  await db.TrollyMaterialMapping.bulkCreate([
    {
      trolly_type: 'rack',
      material_type: 'metal',
      max_capacity: 20,
      position_wise_capacity: {
        left: 5,
        right: 5,
        left_upper: 5,
        right_upper: 5
      },
      status: 'active'
    },
    {
      trolly_type: 'bin',
      material_type: 'metal',
      max_capacity: 10,
      position_wise_capacity: {
        left: 5,
        right: 5
      },
      status: 'active'
    }
  ]);
  console.log('✅ Trolly-Material mappings created');

  console.log('🌱 Sample data seeded successfully!');
}

// Run initialization
initializeDatabase();
