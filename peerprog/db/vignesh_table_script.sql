CREATE DATABASE egadilearning;

-- set extention
-- create extenstion if not exists "uuid-ossp"
CREATE TABLE users(
  user_id uuid PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  additional_info JSON
);

-- insert fake users
INSERT INTO users (user_name, user_email, user_password,additional_info) VALUES
('henry','henry@gmail.com','iamhenry','{"isAdmin":"true"}');