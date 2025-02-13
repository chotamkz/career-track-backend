CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       name TEXT NOT NULL,
                       email TEXT UNIQUE NOT NULL,
                       password TEXT NOT NULL,
                       user_type TEXT NOT NULL CHECK (user_type IN ('STUDENT', 'EMPLOYER', 'ADMIN')),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
                                  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                  education TEXT
);

CREATE TABLE employer_profiles (
                                   user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                   company_name TEXT NOT NULL,
                                   company_description TEXT,
                                   contact_info TEXT
);

CREATE TABLE admin_profiles (
                                user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                permissions JSON NOT NULL,
                                access_level TEXT NOT NULL CHECK (access_level IN ('SUPER_ADMIN', 'CONTENT_MODERATOR')),
                                last_access TIMESTAMP
);

CREATE TABLE vacancies (
                           id SERIAL PRIMARY KEY,
                           title TEXT NOT NULL,
                           description TEXT,
                           requirements TEXT,
                           conditions TEXT,
                           location TEXT NOT NULL,
                           posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
                              id SERIAL PRIMARY KEY,
                              student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              vacancy_id INT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
                              cover_letter TEXT,
                              submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              status TEXT NOT NULL CHECK (status IN ('PENDING', 'INTERVIEW', 'REJECTED', 'ACCEPTED')),
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
                        id SERIAL PRIMARY KEY,
                        name TEXT UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vacancy_skills (
                                vacancy_id INT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
                                skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                PRIMARY KEY (vacancy_id, skill_id)
);

CREATE TABLE student_skills (
                                student_id INT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
                                skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE resumes (
                         id SERIAL PRIMARY KEY,
                         student_id INT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
                         file_url TEXT NOT NULL,
                         file_name TEXT NOT NULL,
                         uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
