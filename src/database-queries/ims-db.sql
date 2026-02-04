-- 1. Common Enums
CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE antenna_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE antenna_type_enum AS ENUM ('RFID', 'BLE');
CREATE TYPE trolley_load_type AS ENUM ('FULL', 'PARTIAL');


-- 2. Trolley / Container Master
CREATE TABLE trolley (
    trolley_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_code      VARCHAR(50) UNIQUE NOT NULL,
    trolley_type      VARCHAR(50) NOT NULL,
    trolley_image     TEXT,
    barcode           VARCHAR(100),
    qr_code            VARCHAR(100),
    length_mm         NUMERIC(10,2),
    width_mm          NUMERIC(10,2),
    height_mm         NUMERIC(10,2),
    volume_mm3        NUMERIC(15,2),
    notes             TEXT,
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT now()
);

-- 3. Material Master
CREATE TABLE material (
    material_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code     VARCHAR(50) UNIQUE NOT NULL,
    material_name     VARCHAR(100) NOT NULL,
    material_type     VARCHAR(50) NOT NULL,
    length_mm         NUMERIC(10,2),
    width_mm          NUMERIC(10,2),
    height_mm         NUMERIC(10,2),
    weight_kg         NUMERIC(10,3),
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT now()
);
-- Allowed Positions per Material
CREATE TABLE material_position (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id       UUID REFERENCES material(material_id),
    position_code     VARCHAR(30) NOT NULL,
    UNIQUE(material_id, position_code)
);

-- 4. Trolley–Material Mapping (Capacity Rules)
CREATE TABLE trolley_material_mapping (
    mapping_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_type      VARCHAR(50) NOT NULL,
    material_type     VARCHAR(50) NOT NULL,
    material_code     VARCHAR(50) NOT NULL,
    trolley_code      VARCHAR(50) NOT NULL,
    max_quantity      INTEGER NOT NULL CHECK (max_quantity > 0),
    effective_from    DATE NOT NULL,
    effective_to      DATE,
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    version_no        INTEGER NOT NULL DEFAULT 1,
    created_at        TIMESTAMP DEFAULT now(),
    UNIQUE (trolley_type, material_type, version_no)
);
-- Optional Position-wise Capacity
CREATE TABLE trolley_material_position_capacity (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_id        UUID REFERENCES trolley_material_mapping(mapping_id),
    position_code     VARCHAR(30),
    max_quantity      INTEGER NOT NULL
);

-- 5. Users & Roles (LDAP Integrated)
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
-- User Activity Audit
CREATE TABLE user_activity_log (
    log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES app_user(user_id),
    activity_type     VARCHAR(100),
    activity_time     TIMESTAMP DEFAULT now(),
    details           JSONB
);


-- 6. Store Location Master
CREATE TABLE store_location (
    store_location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code        VARCHAR(50) UNIQUE NOT NULL,
    store_name        VARCHAR(100),
    factory_name      VARCHAR(100),
    plant_name        VARCHAR(100),
    hierarchy_level   INTEGER,
    total_area        NUMERIC(12,2),
    area_unit         VARCHAR(10),
    status             status_enum NOT NULL DEFAULT 'ACTIVE',
    remarks           TEXT,
    created_at        TIMESTAMP DEFAULT now()
);

-- 7. RFID / BLE Antenna Master
CREATE TABLE antenna (
    antenna_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    antenna_code      VARCHAR(50) UNIQUE NOT NULL,
    antenna_name      VARCHAR(100),
    antenna_type      antenna_type_enum NOT NULL,
    frequency_range   VARCHAR(50),
    gain_dbi          NUMERIC(5,2),
    reader_id         VARCHAR(50),
    reader_port       INTEGER,
    antenna_role      VARCHAR(50),
    orientation       VARCHAR(50),
    mounting_type     VARCHAR(50),
    tx_power_dbm      NUMERIC(5,2),
    coverage_desc     TEXT,
    status             antenna_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMP DEFAULT now()
);
-- Antenna–Store Mapping
CREATE TABLE store_antenna_map (
    store_location_id UUID REFERENCES store_location(store_location_id),
    antenna_id        UUID REFERENCES antenna(antenna_id),
    association_status status_enum NOT NULL DEFAULT 'ACTIVE',
    PRIMARY KEY (store_location_id, antenna_id)
);

-- 8. Operator Loading / Trolley Transactions
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

--9. Work Order Table Schema
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

-- 10. Material Stock Table Schema
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
