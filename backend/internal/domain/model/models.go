package model

import "time"

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	UserType  string    `json:"userType"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type StudentProfile struct {
	UserID    int    `json:"userId"`
	Education string `json:"education"`
	ResumeURL string `json:"resumeUrl"`
}

type EmployerProfile struct {
	UserID             int    `json:"userId"`
	CompanyName        string `json:"companyName"`
	CompanyDescription string `json:"companyDescription"`
	ContactInfo        string `json:"contactInfo"`
}

type Vacancy struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Requirements string    `json:"requirements"`
	Conditions   string    `json:"conditions"`
	Location     string    `json:"location"`
	PostedDate   time.Time `json:"postedDate"`
	EmployerID   int       `json:"employerId"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Application struct {
	ID            int       `json:"id"`
	StudentID     int       `json:"studentId"`
	VacancyID     int       `json:"vacancyId"`
	CoverLetter   string    `json:"coverLetter"`
	SubmittedDate time.Time `json:"submittedDate"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Skill struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
