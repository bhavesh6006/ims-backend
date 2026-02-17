-- 1. Common Enums
CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE antenna_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE antenna_type_enum AS ENUM ('RFID', 'BLE');
CREATE TYPE trolley_load_type AS ENUM ('FULL', 'PARTIAL');
CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT');


-- 2. Trolley / Container Types
CREATE TABLE trolly_type (
    trolly_type_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolly_type         VARCHAR(100),
    created_at          TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New: Trolley Condition Master
CREATE TABLE trolley_condition (
    trolley_condition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(100) NOT NULL,
    description          TEXT
);

-- 3. Material Master supporting tables
CREATE TABLE material_type (
    material_type_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_type     VARCHAR(100),
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subtool (
    subtool_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100),
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users & Roles (LDAP Integrated)
CREATE TABLE app_role (
    role_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name         VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE app_user (
    user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ldap_username     VARCHAR(100) UNIQUE NOT NULL,
    display_name      VARCHAR(150),
    email             VARCHAR(150),
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE user_role_map (
    user_id           UUID REFERENCES app_user(user_id),
    role_id           UUID REFERENCES app_role(role_id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_activity_log (
    log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES app_user(user_id),
    activity_type     VARCHAR(100),
    activity_time     TIMESTAMP DEFAULT now(),
    details           JSONB
);

-- 5. Trolley / Container Master (depends on trolly_type)
CREATE TABLE trolley (
    trolley_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_code      VARCHAR(50) UNIQUE NOT NULL,
    trolly_type_id    UUID REFERENCES trolly_type(trolly_type_id),
    trolley_condition_id UUID REFERENCES trolly_condition(trolley_condition_id),
    trolley_image     TEXT,
    barcode           VARCHAR(100),
    qr_code           VARCHAR(100),
    length_mm         NUMERIC(10,2),
    width_mm          NUMERIC(10,2),
    height_mm         NUMERIC(10,2),
    volume_mm3        NUMERIC(15,2),
    notes             TEXT,
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    ownership         VARCHAR(100),
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT now()
);

-- Add unique constraint for barcode
CREATE UNIQUE INDEX unique_trolley_barcode 
ON trolley (barcode) 
WHERE barcode IS NOT NULL AND barcode <> '';

CREATE UNIQUE INDEX unique_trolley_qr_code 
ON trolley (qr_code) 
WHERE qr_code IS NOT NULL AND qr_code <> '';

-- 6. Material Master (depends on material_type, subtool)
CREATE TABLE material (
    material_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code       VARCHAR(50) UNIQUE NOT NULL,
    material_name       VARCHAR(100) NOT NULL,
    material_type_id    UUID REFERENCES material_type(material_type_id),
    subtool_id          UUID REFERENCES subtool(subtool_id),
    length_mm           NUMERIC(10,2),
    width_mm            NUMERIC(10,2),
    height_mm           NUMERIC(10,2),
    weight_kg           NUMERIC(10,3),
    status              status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT now()
);

-- 7. Trolley–Material Mapping (Capacity Rules) depends on trolly_type, material, app_user
CREATE TABLE trolley_material_mapping (
    mapping_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_type_id     UUID NOT NULL REFERENCES trolly_type(trolly_type_id),
    material_id         UUID NOT NULL REFERENCES material(material_id),
    max_quantity        INTEGER NOT NULL CHECK (max_quantity > 0),
    effective_from      DATE,
    effective_to        DATE,
    notes               TEXT,
    status              status_enum NOT NULL DEFAULT 'ACTIVE',
    version_no          INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT now(),
    created_by          UUID REFERENCES app_user(user_id),
    updated_by          UUID REFERENCES app_user(user_id),
    UNIQUE (trolley_type_id, material_id, version_no)
);

-- Create indexes for faster lookups
CREATE INDEX idx_trolley_material_mapping_trolley_type ON trolley_material_mapping(trolley_type_id);
CREATE INDEX idx_trolley_material_mapping_material ON trolley_material_mapping(material_id);
CREATE INDEX idx_trolley_material_mapping_status ON trolley_material_mapping(status);
CREATE INDEX idx_trolley_material_mapping_version ON trolley_material_mapping(version_no);

-- Trigger to update updated_at timestamp for mapping
CREATE OR REPLACE FUNCTION update_trolley_material_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trolley_material_mapping_updated_at_trigger
    BEFORE UPDATE ON trolley_material_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_trolley_material_mapping_updated_at();

-- Comments for documentation
COMMENT ON TABLE trolley_material_mapping IS 'Maps trolley types to materials with capacity rules';
COMMENT ON COLUMN trolley_material_mapping.trolley_type_id IS 'Reference to trolly_type table';
COMMENT ON COLUMN trolley_material_mapping.material_id IS 'Reference to material table';
COMMENT ON COLUMN trolley_material_mapping.max_quantity IS 'Maximum quantity of material allowed in this trolley type';
COMMENT ON COLUMN trolley_material_mapping.version_no IS 'Version number for tracking mapping history';
COMMENT ON COLUMN trolley_material_mapping.status IS 'ACTIVE or INACTIVE status';

-- Device Master Table
-- Purpose: Store all static and dynamic details of the FX9600 reader device

CREATE TABLE device_master (
    device_id SERIAL PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    department VARCHAR(50),
    ip_address INET UNIQUE NOT NULL,
    mac_address VARCHAR(50),
    hostname VARCHAR(50),
    serial_no VARCHAR(50),
    manufacturer VARCHAR(50) DEFAULT 'Zebra',
    model VARCHAR(50) DEFAULT 'FX9600',
    firmware_version VARCHAR(50),
    os_description TEXT,
    total_antennas INT,
    active_antennas INT,
    last_llrp_sync TIMESTAMP,
    uptime_sec BIGINT,
    cpu_usage NUMERIC(5,2),
    temperature NUMERIC(5,2),
    memory_free_mb NUMERIC(10,2),
    last_snmp_sync TIMESTAMP,
    status VARCHAR(20) DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')),
    last_seen_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    installed_on DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_device_ip_address ON device_master(ip_address);
CREATE INDEX idx_device_status ON device_master(status);
CREATE INDEX idx_device_is_active ON device_master(is_active);

-- Antenna Master Table
-- Purpose: Store configuration and placement of each antenna attached to a device

CREATE TABLE antenna_master (
    antenna_id SERIAL PRIMARY KEY,
    device_id INT NOT NULL REFERENCES device_master(device_id) ON DELETE CASCADE,
    antenna_no INT NOT NULL,
    antenna_name VARCHAR(50),
    location_name VARCHAR(100),
    zone_id INT,
    antenna_type VARCHAR(50),
    polarization VARCHAR(20),
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    tx_power_dbm NUMERIC(5,2),
    rx_sensitivity NUMERIC(5,2),
    orientation VARCHAR(20),
    mounting_height_m NUMERIC(5,2),
    facing_angle_deg NUMERIC(5,2),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_connected BOOLEAN DEFAULT FALSE,
    last_seen_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(device_id, antenna_no)
);

-- Create indexes for faster lookups
CREATE INDEX idx_antenna_device_id ON antenna_master(device_id);
CREATE INDEX idx_antenna_zone_id ON antenna_master(zone_id);
CREATE INDEX idx_antenna_is_enabled ON antenna_master(is_enabled);
CREATE INDEX idx_antenna_is_connected ON antenna_master(is_connected);

-- 9. Store Location Master
CREATE TABLE store_location (
    store_location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code        VARCHAR(50) UNIQUE NOT NULL,
    store_name        VARCHAR(100),
    factory_name      VARCHAR(100),
    plant_name        VARCHAR(100),
    hierarchy_level   VARCHAR(100),
    total_area        NUMERIC(12,2),
    area_unit         VARCHAR(10),
    status            status_enum NOT NULL DEFAULT 'ACTIVE',
    remarks           TEXT,
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping table: store_location_antenna supports multiple antennas and movement types per store location
CREATE TABLE store_location_antenna (
    mapping_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_location_id  UUID NOT NULL REFERENCES store_location(store_location_id),
    antenna_id         INT NOT NULL REFERENCES antenna_master(antenna_id),
    movement_type      movement_type_enum NOT NULL,
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at         TIMESTAMP DEFAULT now(),
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mapping table
CREATE INDEX idx_store_location_antenna_store ON store_location_antenna(store_location_id);
CREATE INDEX idx_store_location_antenna_antenna ON store_location_antenna(antenna_id);
CREATE INDEX idx_store_location_antenna_status ON store_location_antenna(status);

-- Trigger to update updated_at for mapping table
CREATE OR REPLACE FUNCTION update_store_location_antenna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_location_antenna_updated_at_trigger
    BEFORE UPDATE ON store_location_antenna
    FOR EACH ROW
    EXECUTE FUNCTION update_store_location_antenna_updated_at();

-- Create index for store_location status
CREATE INDEX idx_store_location_status ON store_location(status);

-- Trigger to update updated_at timestamp for store_location
CREATE OR REPLACE FUNCTION update_store_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_location_updated_at_trigger
    BEFORE UPDATE ON store_location
    FOR EACH ROW
    EXECUTE FUNCTION update_store_location_updated_at();

--10. Work Order Table Schema
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    sr_no INTEGER NOT NULL,
    date DATE NOT NULL,
    tool VARCHAR(100) NOT NULL,
    sub_tool VARCHAR(100) NOT NULL, -- Material Code
    door_colour VARCHAR(50),
    handle VARCHAR(50),
    micom VARCHAR(50),
    lock1 VARCHAR(50),
    disp_type VARCHAR(50),
    input_plan INTEGER NOT NULL,
    output_plan INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create indexes for better query performance
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_date ON work_orders(date);
CREATE INDEX idx_work_orders_sub_tool ON work_orders(sub_tool);
CREATE INDEX idx_work_orders_work_order_number ON work_orders(work_order_number);

-- Trigger to update updated_at timestamp for work_orders
CREATE OR REPLACE FUNCTION update_work_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_orders_updated_at_trigger
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_orders_updated_at();

-- 11. Material Stock Table Schema (depends on work_orders)
CREATE TABLE material_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code VARCHAR(100) NOT NULL,
    trolley_code VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    location VARCHAR(200), -- For future RFID antenna integration
    work_order_id UUID REFERENCES work_orders(id),
    work_order_number VARCHAR(50),
    loading_type VARCHAR(20) CHECK (loading_type IN ('FULL', 'PARTIAL')),
    loaded_by VARCHAR(100),
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'IN_TRANSIT', 'CONSUMED')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for material stock
CREATE INDEX idx_material_stock_material_code ON material_stock(material_code);
CREATE INDEX idx_material_stock_trolley_code ON material_stock(trolley_code);
CREATE INDEX idx_material_stock_work_order_id ON material_stock(work_order_id);
CREATE INDEX idx_material_stock_status ON material_stock(status);
CREATE INDEX idx_material_stock_location ON material_stock(location);

-- Create composite index for material-trolley lookup
CREATE INDEX idx_material_trolley_lookup ON material_stock(material_code, trolley_code);

-- Trigger to update updated_at timestamp for material_stock
CREATE OR REPLACE FUNCTION update_material_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER material_stock_updated_at_trigger
    BEFORE UPDATE ON material_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_updated_at();

-- 12. Operator Loading / Trolley Transactions (depends on trolley and app_user)
CREATE TABLE trolley_transaction (
    transaction_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_id        UUID REFERENCES trolley(trolley_id),
    work_order_no     VARCHAR(50),
    load_type         trolley_load_type NOT NULL,
    full_quantity     INTEGER,
    loaded_quantity   INTEGER,
    sfg_fg_type       VARCHAR(10),
    created_by        UUID REFERENCES app_user(user_id),
    created_at        TIMESTAMP DEFAULT now(),
    CHECK (
        (load_type = 'FULL' AND loaded_quantity IS NULL)
        OR
        (load_type = 'PARTIAL' AND loaded_quantity IS NOT NULL)
    )
);

-- Sample data insert for work_orders
INSERT INTO work_orders (sr_no, work_order_number, date, tool, sub_tool, door_colour, handle, micom, lock1, disp_type, input_plan, output_plan, status)
VALUES 
    (1, 'WO-2026-001', '2026-02-01', 'Tool A', 'MT-A-001', 'White', 'Handle-X', 'MC-100', 'Lock-A1', 'Type-1', 100, 0, 'PENDING'),
    (2, 'WO-2026-002', '2026-02-02', 'Tool B', 'MT-B-002', 'Black', 'Handle-Y', 'MC-200', 'Lock-B2', 'Type-2', 150, 50, 'IN_PROGRESS'),
    (3, 'WO-2026-003', '2026-02-02', 'Tool C', 'MT-C-003', 'Silver', 'Handle-Z', 'MC-300', 'Lock-C3', 'Type-1', 80, 0, 'PENDING'),
    (4, 'WO-2026-004', '2026-02-03', 'Tool A', 'MT-A-004', 'Grey', 'Handle-X', 'MC-400', 'Lock-A4', 'Type-3', 120, 120, 'CLOSED'),
    (5, 'WO-2026-005', '2026-02-03', 'Tool D', 'MT-D-005', 'Brown', 'Handle-W', 'MC-500', 'Lock-D5', 'Type-2', 90, 88, 'IN_PROGRESS');

-- Comments for documentation
COMMENT ON TABLE work_orders IS 'Stores all work orders with planning and execution details';
COMMENT ON COLUMN work_orders.work_order_number IS 'Unique work order identifier';
COMMENT ON COLUMN work_orders.sub_tool IS 'Material code - links to material master';
COMMENT ON COLUMN work_orders.input_plan IS 'Planned input quantity';
COMMENT ON COLUMN work_orders.output_plan IS 'Actual output quantity loaded';
COMMENT ON COLUMN work_orders.status IS 'Work order status: PENDING (output_plan = 0), IN_PROGRESS (0 < output_plan < input_plan), CLOSED (output_plan >= input_plan)';

COMMENT ON TABLE material_stock IS 'Tracks material stock loaded on trolleys with location information';
COMMENT ON COLUMN material_stock.material_code IS 'Material code from work order (sub_tool)';
COMMENT ON COLUMN material_stock.trolley_code IS 'Trolley ID where material is loaded';
COMMENT ON COLUMN material_stock.location IS 'Physical location tracked via RFID antenna (future integration)';
COMMENT ON COLUMN material_stock.work_order_id IS 'Reference to source work order';
