package model

import "time"

type UserType string

const (
	UserTypeStudent  UserType = "STUDENT"
	UserTypeEmployer UserType = "EMPLOYER"
	UserTypeAdmin    UserType = "ADMIN"
)

type AdminAccessLevel string

const (
	AccessLevelSuperAdmin       AdminAccessLevel = "SUPER_ADMIN"
	AccessLevelContentModerator AdminAccessLevel = "CONTENT_MODERATOR"
)

type ApplicationStatus string

const (
	StatusPending   ApplicationStatus = "PENDING"
	StatusInterview ApplicationStatus = "INTERVIEW"
	StatusRejected  ApplicationStatus = "REJECTED"
	StatusAccepted  ApplicationStatus = "ACCEPTED"
)

type User struct {
	ID        uint      `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"password" db:"password"`
	UserType  UserType  `json:"userType" db:"user_type"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type StudentProfile struct {
	UserID    uint   `json:"userId" db:"user_id"`
	Name      string `json:"name" db:"name"`
	Education string `json:"education" db:"education"`
}

type EmployerProfile struct {
	UserID             uint   `json:"userId" db:"user_id"`
	CompanyName        string `json:"companyName" db:"company_name"`
	CompanyDescription string `json:"companyDescription" db:"company_description"`
	ContactInfo        string `json:"contactInfo" db:"contact_info"`
}

type AdminProfile struct {
	UserID      uint             `json:"userId" db:"user_id"`
	Permissions string           `json:"permissions" db:"permissions"`
	AccessLevel AdminAccessLevel `json:"accessLevel" db:"access_level"`
	LastAccess  time.Time        `json:"lastAccess" db:"last_access"`
}

type Vacancy struct {
	ID             uint      `json:"id" db:"id"`
	Title          string    `json:"title" db:"title"`
	Description    string    `json:"description" db:"description"`
	Requirements   string    `json:"requirements" db:"requirements"`
	Location       string    `json:"location" db:"location"`
	PostedDate     time.Time `json:"postedDate" db:"posted_date"`
	EmployerID     uint      `json:"employerId" db:"employer_id"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	SalaryFrom     float64   `json:"salary_from" db:"salary_from"`
	SalaryTo       float64   `json:"salary_to" db:"salary_to"`
	SalaryCurrency string    `json:"salary_currency" db:"salary_currency"`
	SalaryGross    bool      `json:"salary_gross" db:"salary_gross"`
	VacancyURL     string    `json:"vacancy_url" db:"vacancy_url"`
	WorkSchedule   string    `json:"work_schedule" db:"work_schedule"`
	Experience     string    `json:"experience" db:"experience"`
}

type Application struct {
	ID            uint              `json:"id" db:"id"`
	StudentID     uint              `json:"studentId" db:"student_id"`
	VacancyID     uint              `json:"vacancyId" db:"vacancy_id"`
	CoverLetter   string            `json:"coverLetter" db:"cover_letter"`
	SubmittedDate time.Time         `json:"submittedDate" db:"submitted_date"`
	Status        ApplicationStatus `json:"status" db:"status"`
	CreatedAt     time.Time         `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time         `json:"updatedAt" db:"updated_at"`
}

type Skill struct {
	ID        uint      `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type VacancySkill struct {
	VacancyID uint      `json:"vacancyId" db:"vacancy_id"`
	SkillID   uint      `json:"skillId" db:"skill_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type StudentSkill struct {
	StudentID uint      `json:"studentId" db:"student_id"`
	SkillID   uint      `json:"skillId" db:"skill_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type Resume struct {
	ID         uint      `json:"id" db:"id"`
	StudentID  uint      `json:"studentId" db:"student_id"`
	FileURL    string    `json:"fileURL" db:"file_url"`
	FileName   string    `json:"fileName" db:"file_name"`
	UploadedAt time.Time `json:"uploadedAt" db:"uploaded_at"`
}

type Hackathon struct {
	ID             uint      `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Organizer      string    `json:"organizer" db:"organizer"`
	StartDate      time.Time `json:"start_date" db:"start_date"`
	EndDate        time.Time `json:"end_date" db:"end_date"`
	Format         string    `json:"format" db:"format"`
	Location       string    `json:"location" db:"location"`
	Theme          string    `json:"theme" db:"theme"`
	Prizes         string    `json:"prizes" db:"prizes"`
	RequiredSkills string    `json:"required_skills" db:"required_skills"`
	Website        string    `json:"website" db:"website"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}
