CREATE TABLE wallpapers (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    img_description TEXT,
    img_size VARCHAR(255),
    img_url TEXT,
    llm_name VARCHAR(100), -- 存储调用的模型名称，现在是dell-e
    llm_params JSON, -- 大模型的参数
    created_at timestamptz
);

#用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at timestamptz
);

#管理订单的
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at timestamptz,
    user_email VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    plan VARCHAR(50),
    expired_at timestamptz,
    order_status SMALLINT NOT NULL,
    paied_at timestamptz,
    stripe_session_id VARCHAR(255),
    credits INT NOT NULL
);