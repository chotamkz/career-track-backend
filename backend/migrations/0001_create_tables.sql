CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('STUDENT', 'EMPLOYER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    education TEXT
);

CREATE TABLE IF NOT EXISTS employer_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_description TEXT,
    contact_info TEXT
);

CREATE TABLE IF NOT EXISTS admin_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions JSON NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('SUPER_ADMIN', 'CONTENT_MODERATOR')),
    last_access TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    location TEXT NOT NULL,
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    salary_from NUMERIC,
    salary_to NUMERIC,
    salary_currency TEXT,
    salary_gross BOOLEAN,
    vacancy_url TEXT,
    work_schedule TEXT,
    experience TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vacancy_url ON vacancies(vacancy_url);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vacancy_id INT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    cover_letter TEXT,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'INTERVIEW', 'REJECTED', 'ACCEPTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacancy_skills (
    vacancy_id INT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vacancy_id, skill_id)
);

CREATE TABLE IF NOT EXISTS student_skills (
    student_id INT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profiles(user_id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hackathons (
                                          id SERIAL PRIMARY KEY,
                                          name TEXT NOT NULL,
                                          organizer TEXT NOT NULL,
                                          start_date TIMESTAMP NOT NULL,
                                          end_date TIMESTAMP NOT NULL,
                                          format TEXT NOT NULL,
                                          location TEXT NOT NULL,
                                          theme TEXT,
                                          prizes TEXT,
                                          required_skills TEXT,
                                          website TEXT,
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
