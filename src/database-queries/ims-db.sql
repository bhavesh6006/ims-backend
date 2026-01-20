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
