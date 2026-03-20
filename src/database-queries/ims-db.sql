-- ===================================================================
-- IMS Database Schema
-- ===================================================================
-- This script creates the complete database schema for the IMS system.
-- All tables are ordered according to their dependencies and can be
-- executed sequentially without errors.
-- ===================================================================

-- 1. Common Enums
CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE antenna_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE antenna_type_enum AS ENUM ('RFID', 'BLE');
CREATE TYPE trolley_load_type AS ENUM ('FULL', 'PARTIAL');
CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT', 'CONSUMED');


-- Create app_user table
CREATE TABLE app_user (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150),
    email VARCHAR(150),
    role VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create indexes for app_user
CREATE INDEX idx_user_username ON app_user(username);
CREATE INDEX idx_user_email ON app_user(email);
CREATE INDEX idx_user_role ON app_user(role);
CREATE INDEX idx_user_is_active ON app_user(is_active);

-- Create audit_log table
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    status VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE SET NULL
);
-- Table to store last work order refresh date/time
CREATE TABLE work_order_refresh (
    id SERIAL PRIMARY KEY,
    last_refresh TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    failed_reason TEXT
);

-- Add CHECK constraint for role column
ALTER TABLE app_user 
ADD CONSTRAINT check_user_role 
CHECK (role IN ('Admin', 'Store Manager', 'Operator'));

-- Create indexes for audit_log
CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_username ON audit_log(username);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_status ON audit_log(status);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
-- Initial default USER before LDAP server
INSERT INTO app_user (username, display_name, email, role, is_active) VALUES
('john.doe', 'John Doe', 'john.doe@example.com', 'Admin', true);


-- 2. Trolley / Container Types
CREATE TABLE trolly_type (
    trolly_type_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolly_type         VARCHAR(100),
    created_at          TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

UPDATE trolly_type SET trolly_type = UPPER(TRIM(trolly_type));
ALTER TABLE trolly_type ADD CONSTRAINT uq_trolly_type UNIQUE (trolly_type);

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


-- 5. Trolley / Container Master (depends on trolly_type)
CREATE TABLE trolley (
    trolley_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_code      VARCHAR(50) UNIQUE NOT NULL,
    trolly_type_id    UUID REFERENCES trolly_type(trolly_type_id),
    trolley_condition_id UUID REFERENCES trolley_condition(trolley_condition_id),
    trolley_image     TEXT,
    barcode           VARCHAR(100),
    qr_code           VARCHAR(100),
    length_mm         NUMERIC(10,2),
    width_mm          NUMERIC(10,2),
    height_mm         NUMERIC(10,2),
    dimension_unit    VARCHAR(10) DEFAULT 'mm',
    volume_mm3        NUMERIC(15,2),
    volume_unit       VARCHAR(10) DEFAULT 'mm³',
    notes             TEXT,
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    ownership         VARCHAR(100),
    is_occupied          BOOLEAN DEFAULT FALSE NOT NULL,
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
    dimension_unit      VARCHAR(10) DEFAULT 'mm',
    weight_kg           NUMERIC(10,3),
    weight_unit         VARCHAR(10) DEFAULT 'kg',
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

-- 8. Device Master Table
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

-- 9. Location Type Master
CREATE TABLE location_type (
    location_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(100) NOT NULL,
    description          TEXT
);

-- 10. Store Location Master (depends on location_type)
CREATE TABLE store_location (
    store_location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_type_id   UUID NOT NULL REFERENCES location_type(location_type_id),
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

-- 11. Antenna Master Table (depends on device_master and store_location)
-- Purpose: Store configuration and placement of each antenna attached to a device

CREATE TABLE antenna_master (
	antenna_id serial4 NOT NULL PRIMARY KEY,
	device_id INT NOT NULL REFERENCES device_master(device_id) ON DELETE CASCADE,
	antenna_no int4 NOT NULL,
	antenna_name varchar(50) NULL,
	location_name varchar(100) NULL,
	zone_id int4 NULL,
	antenna_type varchar(50) NULL,
	polarization varchar(20) NULL,
	manufacturer varchar(50) NULL,
	model varchar(50) NULL,
	tx_power_dbm numeric(5, 2) NULL,
	rx_sensitivity numeric(5, 2) NULL,
	orientation varchar(20) NULL,
	mounting_height_m numeric(5, 2) NULL,
	facing_angle_deg numeric(5, 2) NULL,
	is_enabled bool NULL,
	is_connected bool NULL,
	last_seen_time timestamp NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	store_location_id UUID REFERENCES store_location(store_location_id),
	inventory_enabled bool NOT NULL,
	gen2_session int2 NOT NULL,
	gen2_target bpchar(1) NULL,
	min_rssi_threshold int2 NOT NULL,
	duplicate_suppression_sec int4 NOT NULL,
	resend_interval_min int4 NOT NULL
);

ALTER TABLE antenna_master
ADD CONSTRAINT chk_gen2_session
CHECK (gen2_session BETWEEN 0 AND 3),
ADD CONSTRAINT chk_gen2_target
CHECK (gen2_target IN ('A','B')),
ADD CONSTRAINT chk_rssi_range
CHECK (min_rssi_threshold BETWEEN -120 AND 0),
ADD CONSTRAINT chk_duplicate_suppression_sec
CHECK (duplicate_suppression_sec >= 0),
ADD CONSTRAINT chk_resend_interval_min
CHECK (resend_interval_min > 0);

-- Create indexes for faster lookups
CREATE INDEX idx_antenna_device_id ON antenna_master(device_id);
CREATE INDEX idx_antenna_zone_id ON antenna_master(zone_id);
CREATE INDEX idx_antenna_is_enabled ON antenna_master(is_enabled);
CREATE INDEX idx_antenna_is_connected ON antenna_master(is_connected);

-- 12. Store Location Antenna Mapping (depends on store_location and antenna_master)
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

-- 13. Work Order Table Schema
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
    consumed_quantity INTEGER DEFAULT 0,
    balance_quantity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Function to auto-calculate balance_quantity
CREATE OR REPLACE FUNCTION update_balance_quantity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_quantity = NEW.input_plan - NEW.output_plan;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT and UPDATE
CREATE TRIGGER work_orders_balance_quantity_trigger
    BEFORE INSERT OR UPDATE OF input_plan, output_plan
    ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_quantity();

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

-- 14. Material Stock Table Schema (depends on work_orders)
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

-- 15. Operator Loading / Trolley Transactions (depends on trolley and app_user)
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

-- 16. Sample data insert for work_orders
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


-- Convert TIMESTAMP columns to TIMESTAMP WITH TIME ZONE

-- app_user table
ALTER TABLE app_user ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE app_user ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- audit_log table
ALTER TABLE audit_log ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- work_order_refresh table
ALTER TABLE work_order_refresh ALTER COLUMN last_refresh TYPE TIMESTAMP WITH TIME ZONE;

-- trolly_type table
ALTER TABLE trolly_type ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE trolly_type ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- material_type table
ALTER TABLE material_type ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE material_type ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- subtool table
ALTER TABLE subtool ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE subtool ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- trolley table
ALTER TABLE trolley ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE trolley ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- material table
ALTER TABLE material ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE material ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- trolley_material_mapping table
ALTER TABLE trolley_material_mapping ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE trolley_material_mapping ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- device_master table
ALTER TABLE device_master ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE device_master ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE device_master ALTER COLUMN last_llrp_sync TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE device_master ALTER COLUMN last_snmp_sync TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE device_master ALTER COLUMN last_seen_time TYPE TIMESTAMP WITH TIME ZONE;

-- store_location table
ALTER TABLE store_location ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE store_location ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- store_location_antenna table
ALTER TABLE store_location_antenna ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE store_location_antenna ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- work_orders table
ALTER TABLE work_orders ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE work_orders ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- material_stock table
ALTER TABLE material_stock ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE material_stock ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE material_stock ALTER COLUMN loaded_at TYPE TIMESTAMP WITH TIME ZONE;

-- trolley_transaction table
ALTER TABLE trolley_transaction ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;


-- trolley column qr_code update for unique constraint
ALTER TABLE trolley
ADD CONSTRAINT unique_qr_code UNIQUE (qr_code);

-- added defaults for antenna_master
ALTER TABLE antenna_master
ALTER COLUMN inventory_enabled SET DEFAULT false;

ALTER TABLE antenna_master
ALTER COLUMN gen2_session SET DEFAULT 0;

ALTER TABLE antenna_master
ALTER COLUMN min_rssi_threshold SET DEFAULT 0;

ALTER TABLE antenna_master
ALTER COLUMN duplicate_suppression_sec SET DEFAULT 0;

ALTER TABLE antenna_master
ALTER COLUMN resend_interval_min SET DEFAULT 1;


--trolley code function
CREATE OR REPLACE FUNCTION update_material_stock_trolley_code()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE material_stock
    SET trolley_code = NEW.trolley_code
    WHERE trolley_code = OLD.trolley_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trolley_code_update_trigger
AFTER UPDATE OF trolley_code ON trolley
FOR EACH ROW
EXECUTE FUNCTION update_material_stock_trolley_code();

-- ===================================================================
-- GROUP MAPPING ENHANCEMENT
-- ===================================================================

-- Add group mapping columns to trolley_material_mapping
ALTER TABLE trolley_material_mapping 
ADD COLUMN IF NOT EXISTS mapping_group_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS group_total_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_group_mapping BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for group lookups
CREATE INDEX IF NOT EXISTS idx_trolley_material_mapping_group 
ON trolley_material_mapping(mapping_group_id) WHERE mapping_group_id IS NOT NULL;

-- Add loading_status to trolley table (EMPTY, PARTIAL_LOADED, FULL_LOADED)
ALTER TABLE trolley ADD COLUMN IF NOT EXISTS loading_status VARCHAR(20) DEFAULT 'EMPTY' 
CHECK (loading_status IN ('EMPTY', 'PARTIAL_LOADED', 'FULL_LOADED'));

-- Add mapping_group_id to material_stock to track group loading
ALTER TABLE material_stock 
ADD COLUMN IF NOT EXISTS mapping_group_id UUID DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_material_stock_mapping_group 
ON material_stock(mapping_group_id) WHERE mapping_group_id IS NOT NULL;

COMMENT ON COLUMN trolley_material_mapping.mapping_group_id IS 'UUID to identify a group of materials mapped together. All materials in same group share this ID.';
COMMENT ON COLUMN trolley_material_mapping.group_total_quantity IS 'Total quantity for the entire group, divided equally among group members.';
COMMENT ON COLUMN trolley_material_mapping.is_group_mapping IS 'TRUE if this mapping is part of a group, FALSE for individual mapping.';
COMMENT ON COLUMN trolley.loading_status IS 'EMPTY=no material loaded, PARTIAL_LOADED=some group materials loaded, FULL_LOADED=all materials loaded';
COMMENT ON COLUMN material_stock.mapping_group_id IS 'References the mapping group this stock entry belongs to, for tracking partial/full group loading';

-- Cleanup: Remove old INACTIVE mapping records (one-time migration)
DELETE FROM trolley_material_mapping WHERE status = 'INACTIVE';

-- Add the CHECK constraint
ALTER TABLE location_type
ADD CONSTRAINT chk_location_type_name
CHECK (name IN ('CONSUMED', 'IN_TRANSIT', 'IN_STOCK'));

-- Added Manual Consumption location
INSERT INTO public.store_location
(
    store_location_id,
    location_type_id,
    store_code,
    store_name,
    factory_name,
    plant_name,
    hierarchy_level,
    total_area,
    area_unit,
    status,
    remarks
)
VALUES
(
    '3290aa81-5b10-42cf-b5cc-de2b50aec0c8'::uuid,
    
    (SELECT location_type_id 
     FROM public.location_type 
     WHERE name = 'CONSUMED' 
     LIMIT 1),
     
    'Manual',
    'Manual',
    '',
    '',
    '',
    0.00,
    '',
    'ACTIVE'::public."status_enum",
    'Location for manual consumption'
);
