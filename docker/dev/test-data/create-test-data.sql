-- Create demo database and namespace
CREATE NAMESPACE IF NOT EXISTS demo.retail;
CREATE NAMESPACE IF NOT EXISTS demo.analytics;
CREATE NAMESPACE IF NOT EXISTS demo.logs;

-- Create customers table
CREATE TABLE IF NOT EXISTS demo.retail.customers (
    customer_id BIGINT,
    first_name STRING,
    last_name STRING,
    email STRING,
    phone STRING,
    address STRING,
    city STRING,
    state STRING,
    zip_code STRING,
    registration_date DATE,
    last_login TIMESTAMP,
    customer_segment STRING,
    total_orders INT,
    lifetime_value DECIMAL(10,2)
) USING iceberg
PARTITIONED BY (customer_segment, registration_date);

-- Create products table
CREATE TABLE IF NOT EXISTS demo.retail.products (
    product_id BIGINT,
    product_name STRING,
    category STRING,
    subcategory STRING,
    brand STRING,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    weight_kg DECIMAL(8,3),
    dimensions STRING,
    color STRING,
    size STRING,
    in_stock BOOLEAN,
    stock_quantity INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) USING iceberg
PARTITIONED BY (category, created_at);

-- Create orders table
CREATE TABLE IF NOT EXISTS demo.retail.orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date TIMESTAMP,
    ship_date TIMESTAMP,
    delivery_date TIMESTAMP,
    order_status STRING,
    payment_method STRING,
    total_amount DECIMAL(12,2),
    tax_amount DECIMAL(10,2),
    shipping_cost DECIMAL(8,2),
    discount_amount DECIMAL(8,2),
    currency STRING,
    sales_channel STRING,
    promotion_code STRING
) USING iceberg
PARTITIONED BY (DATE(order_date), sales_channel);

-- Create order_items table
CREATE TABLE IF NOT EXISTS demo.retail.order_items (
    order_item_id BIGINT,
    order_id BIGINT,
    product_id BIGINT,
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    line_total DECIMAL(12,2),
    created_at TIMESTAMP
) USING iceberg
PARTITIONED BY (DATE(created_at));

-- Create web analytics table
CREATE TABLE IF NOT EXISTS demo.analytics.web_events (
    event_id STRING,
    session_id STRING,
    user_id BIGINT,
    event_type STRING,
    page_url STRING,
    referrer_url STRING,
    user_agent STRING,
    ip_address STRING,
    country STRING,
    city STRING,
    device_type STRING,
    browser STRING,
    event_timestamp TIMESTAMP,
    page_load_time_ms INT,
    custom_properties MAP<STRING, STRING>
) USING iceberg
PARTITIONED BY (DATE(event_timestamp), event_type);

-- Create application logs table
CREATE TABLE IF NOT EXISTS demo.logs.application_logs (
    log_id STRING,
    timestamp TIMESTAMP,
    level STRING,
    logger_name STRING,
    message STRING,
    exception_trace STRING,
    thread_name STRING,
    service_name STRING,
    service_version STRING,
    environment STRING,
    request_id STRING,
    user_id BIGINT,
    additional_fields MAP<STRING, STRING>
) USING iceberg
PARTITIONED BY (DATE(timestamp), level, service_name);

-- Insert sample customers data
INSERT INTO demo.retail.customers VALUES
(1, 'John', 'Doe', 'john.doe@email.com', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', DATE('2024-01-15'), TIMESTAMP('2024-12-01 14:30:00'), 'Premium', 25, 2500.50),
(2, 'Jane', 'Smith', 'jane.smith@email.com', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90210', DATE('2024-02-20'), TIMESTAMP('2024-12-02 09:15:00'), 'Standard', 12, 890.75),
(3, 'Mike', 'Johnson', 'mike.j@email.com', '+1-555-0103', '789 Pine St', 'Chicago', 'IL', '60601', DATE('2024-03-10'), TIMESTAMP('2024-12-01 16:45:00'), 'Premium', 18, 1750.25),
(4, 'Sarah', 'Wilson', 'sarah.w@email.com', '+1-555-0104', '321 Elm Dr', 'Houston', 'TX', '77001', DATE('2024-01-25'), TIMESTAMP('2024-11-30 11:20:00'), 'Standard', 8, 425.00),
(5, 'David', 'Brown', 'david.brown@email.com', '+1-555-0105', '654 Maple Ln', 'Phoenix', 'AZ', '85001', DATE('2024-04-05'), TIMESTAMP('2024-12-02 13:10:00'), 'VIP', 35, 4200.80);

-- Insert sample products data
INSERT INTO demo.retail.products VALUES
(101, 'Wireless Bluetooth Headphones', 'Electronics', 'Audio', 'TechBrand', 199.99, 89.50, 0.350, '20x18x8 cm', 'Black', 'One Size', true, 150, TIMESTAMP('2024-01-01 10:00:00'), TIMESTAMP('2024-12-01 15:30:00')),
(102, 'Organic Cotton T-Shirt', 'Clothing', 'Shirts', 'EcoWear', 29.99, 12.00, 0.200, 'M', 'Blue', 'Medium', true, 200, TIMESTAMP('2024-01-15 11:00:00'), TIMESTAMP('2024-11-20 14:15:00')),
(103, 'Ceramic Coffee Mug', 'Home', 'Kitchen', 'HomeStyle', 14.99, 6.50, 0.400, '12x9x12 cm', 'White', 'One Size', true, 75, TIMESTAMP('2024-02-01 09:30:00'), TIMESTAMP('2024-12-01 10:45:00')),
(104, 'Fitness Tracking Watch', 'Electronics', 'Wearables', 'FitTech', 299.99, 145.00, 0.080, '4.5x4x1.2 cm', 'Silver', 'One Size', true, 80, TIMESTAMP('2024-01-20 14:20:00'), TIMESTAMP('2024-11-28 16:00:00')),
(105, 'Leather Laptop Bag', 'Accessories', 'Bags', 'ProfessionalGear', 89.99, 35.00, 0.800, '40x30x10 cm', 'Brown', 'One Size', false, 0, TIMESTAMP('2024-03-01 12:15:00'), TIMESTAMP('2024-12-02 09:30:00'));

-- Insert sample orders data
INSERT INTO demo.retail.orders VALUES
(1001, 1, TIMESTAMP('2024-11-15 10:30:00'), TIMESTAMP('2024-11-16 14:00:00'), TIMESTAMP('2024-11-18 16:30:00'), 'Delivered', 'Credit Card', 229.98, 18.40, 9.99, 0.00, 'USD', 'Web', NULL),
(1002, 2, TIMESTAMP('2024-11-20 15:45:00'), TIMESTAMP('2024-11-21 09:00:00'), TIMESTAMP('2024-11-23 11:15:00'), 'Delivered', 'PayPal', 44.98, 3.60, 5.99, 15.00, 'USD', 'Mobile', 'SAVE15'),
(1003, 3, TIMESTAMP('2024-11-25 09:15:00'), TIMESTAMP('2024-11-26 13:30:00'), NULL, 'Shipped', 'Debit Card', 314.98, 25.20, 0.00, 0.00, 'USD', 'Web', NULL),
(1004, 4, TIMESTAMP('2024-12-01 14:20:00'), NULL, NULL, 'Processing', 'Credit Card', 89.99, 7.20, 12.99, 0.00, 'USD', 'Store', NULL),
(1005, 5, TIMESTAMP('2024-12-02 11:00:00'), NULL, NULL, 'Pending', 'Apple Pay', 59.97, 4.80, 7.99, 20.00, 'USD', 'Mobile', 'VIP20');

-- Insert sample order items data
INSERT INTO demo.retail.order_items VALUES
(10001, 1001, 101, 1, 199.99, 0.00, 199.99, TIMESTAMP('2024-11-15 10:30:00')),
(10002, 1001, 102, 1, 29.99, 0.00, 29.99, TIMESTAMP('2024-11-15 10:30:00')),
(10003, 1002, 102, 1, 29.99, 50.00, 14.99, TIMESTAMP('2024-11-20 15:45:00')),
(10004, 1002, 103, 2, 14.99, 0.00, 29.98, TIMESTAMP('2024-11-20 15:45:00')),
(10005, 1003, 104, 1, 299.99, 0.00, 299.99, TIMESTAMP('2024-11-25 09:15:00')),
(10006, 1003, 103, 1, 14.99, 0.00, 14.99, TIMESTAMP('2024-11-25 09:15:00')),
(10007, 1004, 105, 1, 89.99, 0.00, 89.99, TIMESTAMP('2024-12-01 14:20:00')),
(10008, 1005, 102, 2, 29.99, 0.00, 59.98, TIMESTAMP('2024-12-02 11:00:00'));

-- Insert sample web events data
INSERT INTO demo.analytics.web_events VALUES
('evt_001', 'sess_abc123', 1, 'page_view', '/home', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100', 'USA', 'New York', 'Desktop', 'Chrome', TIMESTAMP('2024-12-01 10:00:00'), 1200, MAP('page_title', 'Home Page', 'campaign', 'winter_sale')),
('evt_002', 'sess_abc123', 1, 'click', '/products/101', '/home', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100', 'USA', 'New York', 'Desktop', 'Chrome', TIMESTAMP('2024-12-01 10:02:30'), 800, MAP('element', 'product_card', 'product_id', '101')),
('evt_003', 'sess_def456', 2, 'page_view', '/products/102', 'https://facebook.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', '10.0.0.50', 'USA', 'Los Angeles', 'Mobile', 'Safari', TIMESTAMP('2024-12-01 14:15:00'), 2100, MAP('page_title', 'T-Shirt Product Page')),
('evt_004', 'sess_def456', 2, 'add_to_cart', '/cart', '/products/102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', '10.0.0.50', 'USA', 'Los Angeles', 'Mobile', 'Safari', TIMESTAMP('2024-12-01 14:18:45'), 500, MAP('product_id', '102', 'quantity', '1')),
('evt_005', 'sess_ghi789', 3, 'purchase', '/checkout/success', '/checkout', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '172.16.0.10', 'USA', 'Chicago', 'Desktop', 'Safari', TIMESTAMP('2024-12-01 16:30:00'), 1500, MAP('order_id', '1001', 'order_total', '229.98'));

-- Insert sample application logs data
INSERT INTO demo.logs.application_logs VALUES
('log_001', TIMESTAMP('2024-12-01 10:00:15'), 'INFO', 'com.nimtable.service.UserService', 'User login successful', NULL, 'http-nio-8080-exec-1', 'nimtable-backend', 'v1.2.3', 'production', 'req_abc123', 1, MAP('endpoint', '/api/auth/login', 'ip_address', '192.168.1.100')),
('log_002', TIMESTAMP('2024-12-01 10:05:30'), 'ERROR', 'com.nimtable.service.OrderService', 'Failed to process order payment', 'java.lang.RuntimeException: Payment gateway timeout\n\tat com.nimtable.payment.PaymentProcessor.process(PaymentProcessor.java:45)', 'order-processor-1', 'nimtable-backend', 'v1.2.3', 'production', 'req_def456', 2, MAP('order_id', '1002', 'payment_method', 'credit_card')),
('log_003', TIMESTAMP('2024-12-01 10:10:45'), 'WARN', 'com.nimtable.service.InventoryService', 'Low stock alert for product', NULL, 'inventory-checker', 'nimtable-backend', 'v1.2.3', 'production', 'req_ghi789', NULL, MAP('product_id', '105', 'current_stock', '2', 'threshold', '5')),
('log_004', TIMESTAMP('2024-12-01 10:15:00'), 'DEBUG', 'com.nimtable.controller.CatalogController', 'Fetching catalog metadata', NULL, 'http-nio-8080-exec-3', 'nimtable-backend', 'v1.2.3', 'development', 'req_jkl012', 3, MAP('catalog_name', 'production_catalog', 'namespace_count', '15')),
('log_005', TIMESTAMP('2024-12-01 10:20:30'), 'INFO', 'com.nimtable.scheduler.MaintenanceScheduler', 'Table optimization completed', NULL, 'maintenance-scheduler', 'nimtable-backend', 'v1.2.3', 'production', 'req_mno345', NULL, MAP('table_name', 'retail.orders', 'files_compacted', '23', 'duration_ms', '45000'));

-- Show table counts and sample data
SELECT 'Customers' as table_name, COUNT(*) as record_count FROM demo.retail.customers
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as record_count FROM demo.retail.products
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as record_count FROM demo.retail.orders
UNION ALL
SELECT 'Order Items' as table_name, COUNT(*) as record_count FROM demo.retail.order_items
UNION ALL
SELECT 'Web Events' as table_name, COUNT(*) as record_count FROM demo.analytics.web_events
UNION ALL
SELECT 'Application Logs' as table_name, COUNT(*) as record_count FROM demo.logs.application_logs;

-- Sample queries to verify data
SELECT 'Sample Customer Data:' as info;
SELECT customer_id, first_name, last_name, customer_segment, total_orders, lifetime_value 
FROM demo.retail.customers LIMIT 3;

SELECT 'Sample Order Data:' as info;
SELECT order_id, customer_id, order_date, order_status, total_amount, sales_channel 
FROM demo.retail.orders LIMIT 3;

SELECT 'Sample Web Events:' as info;
SELECT event_id, event_type, page_url, country, device_type 
FROM demo.analytics.web_events LIMIT 3; 