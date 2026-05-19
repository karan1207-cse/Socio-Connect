create table users(
id int auto_increment primary key,
name varchar(100),
email varchar(100) unique,
password varchar(255),
area varchar(100),
age varchar(20),
created_at timestamp default current_timestamp);
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    location VARCHAR(200),
    activity_time DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    UNIQUE(user_id, activity_id)
);
