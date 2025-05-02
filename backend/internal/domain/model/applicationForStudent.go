package model

import "time"

type ApplicationForStudent struct {
	ID            uint              `json:"id"`
	VacancyID     uint              `json:"vacancyId"`
	VacancyTitle  string            `json:"vacancyTitle"`
	CompanyName   string            `json:"companyName"`
	CoverLetter   string            `json:"coverLetter,omitempty"`
	SubmittedDate time.Time         `json:"submittedDate"`
	Status        ApplicationStatus `json:"status"`
	UpdatedDate   time.Time         `json:"updatedDate"`
}
