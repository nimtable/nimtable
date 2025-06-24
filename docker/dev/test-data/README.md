# Nimtable 测试数据生成器

这个目录包含了用于生成 Apache Iceberg 测试数据的 SQL 脚本和配置。

## 概述

测试数据包括以下表结构：

### 🛍️ 零售域 (demo.retail)
- **customers** - 客户信息表 (5条记录)
- **products** - 产品信息表 (5条记录)  
- **orders** - 订单表 (5条记录)
- **order_items** - 订单明细表 (8条记录)

### 📊 分析域 (demo.analytics)
- **web_events** - 网站行为分析表 (5条记录)

### 📝 日志域 (demo.logs) 
- **application_logs** - 应用程序日志表 (5条记录)

## 快速开始

### 1. 启动开发环境

```bash
cd docker/dev
docker-compose up -d
```

这将启动：
- Iceberg REST 目录服务 (端口 8181)
- MinIO S3 存储 (端口 9000/9001)
- Spark-Iceberg 引擎 (端口 8888/8080)
- Nimtable 后端和前端

### 2. 自动生成测试数据

当所有服务启动后，`prepare-iceberg-data` 服务会自动运行并执行以下操作：

1. 等待依赖服务就绪
2. 创建演示数据库和命名空间
3. 创建分区表结构
4. 插入示例数据
5. 运行验证查询

### 3. 验证数据

你可以通过以下方式验证数据是否成功创建：

#### 通过 Spark SQL Shell
```bash
docker exec -it spark-iceberg spark-sql \
  --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.4.2 \
  --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
  --conf spark.sql.catalog.demo=org.apache.iceberg.spark.SparkCatalog \
  --conf spark.sql.catalog.demo.type=rest \
  --conf spark.sql.catalog.demo.uri=http://rest:8181
```

然后运行查询：
```sql
-- 显示所有表
SHOW TABLES IN demo.retail;
SHOW TABLES IN demo.analytics;
SHOW TABLES IN demo.logs;

-- 查看数据样本
SELECT * FROM demo.retail.customers LIMIT 5;
SELECT * FROM demo.retail.orders LIMIT 5;
```

#### 通过 Nimtable Web UI
1. 访问 http://localhost:3000
2. 添加 REST 目录: `http://localhost:8181`
3. 浏览 `demo` 目录下的表

## 表结构详情

### customers 表
包含客户基本信息，按 `customer_segment` 和 `registration_date` 分区。

### products 表  
包含产品信息，按 `category` 和 `created_at` 分区。

### orders 表
包含订单信息，按 `order_date` 和 `sales_channel` 分区。

### web_events 表
包含网站行为数据，按 `event_timestamp` 和 `event_type` 分区。

### application_logs 表
包含应用日志，按 `timestamp`、`level` 和 `service_name` 分区。

## 自定义测试数据

### 添加更多数据
编辑 `create-test-data.sql` 文件，添加更多的 INSERT 语句。

### 手动执行脚本
```bash
docker exec -it spark-iceberg spark-sql \
  --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.4.2 \
  --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
  --conf spark.sql.catalog.demo=org.apache.iceberg.spark.SparkCatalog \
  --conf spark.sql.catalog.demo.type=rest \
  --conf spark.sql.catalog.demo.uri=http://rest:8181 \
  --conf spark.sql.catalog.demo.io-impl=org.apache.iceberg.aws.s3.S3FileIO \
  --conf spark.sql.catalog.demo.warehouse=s3://warehouse/ \
  --conf spark.sql.catalog.demo.s3.endpoint=http://minio:9000 \
  -f /home/iceberg/test-data/create-test-data.sql
```

## 清理数据

### 删除所有表
```sql
-- 在 Spark SQL 中执行
DROP TABLE IF EXISTS demo.retail.customers;
DROP TABLE IF EXISTS demo.retail.products;
DROP TABLE IF EXISTS demo.retail.orders;
DROP TABLE IF EXISTS demo.retail.order_items;
DROP TABLE IF EXISTS demo.analytics.web_events;
DROP TABLE IF EXISTS demo.logs.application_logs;

-- 删除命名空间
DROP NAMESPACE IF EXISTS demo.retail;
DROP NAMESPACE IF EXISTS demo.analytics;
DROP NAMESPACE IF EXISTS demo.logs;
```

### 重新生成数据
```bash
docker-compose restart prepare-iceberg-data
```

## 高级用法

### 生成大量测试数据
可以使用 Spark 的数据生成功能创建更大的数据集：

```sql
-- 生成100万条订单记录
INSERT INTO demo.retail.orders
SELECT 
  row_number() over (order by rand()) + 1000 as order_id,
  floor(rand() * 1000) + 1 as customer_id,
  date_add('2024-01-01', floor(rand() * 365)) as order_date,
  'Completed' as order_status,
  round(rand() * 1000, 2) as total_amount,
  case when rand() > 0.5 then 'Web' else 'Mobile' end as sales_channel
FROM range(1000000);
```

### 性能测试
使用生成的数据进行查询性能测试：

```sql
-- 测试分区裁剪
SELECT COUNT(*) FROM demo.retail.orders 
WHERE order_date >= '2024-06-01' AND order_date < '2024-07-01';

-- 测试连接查询
SELECT c.customer_segment, COUNT(*), SUM(o.total_amount)
FROM demo.retail.customers c
JOIN demo.retail.orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_segment;
```

## 故障排除

### 容器无法启动
检查端口冲突，确保 8181、9000、9001 端口没有被占用。

### 数据生成失败
查看容器日志：
```bash
docker logs prepare-iceberg-data
```

### 无法连接到 REST 目录
确保 `iceberg-rest` 容器正常运行：
```bash
curl http://localhost:8181/v1/config
``` 