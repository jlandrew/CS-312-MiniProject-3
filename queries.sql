create table if not exists users (
	user_id varchar(225) not null, 
	password varchar(225) not null, 
	name varchar(225),
	primary key (user_id)
);

create table if not exists blogs (
	blog_id serial not null, 
	creator_name varchar(225) not null, 
	creator_user_id varchar(255) not null,
	title varchar(225) not null, 
	body text, 
	date_created timestamp,
	primary key (blog_id),
	foreign key (creator_user_id) references users(user_id)
);
