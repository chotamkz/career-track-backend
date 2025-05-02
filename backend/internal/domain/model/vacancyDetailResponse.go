package model

type VacancyDetailResponse struct {
	Vacancy
	CompanyName       string             `json:"companyName"`
	ApplicationStatus *ApplicationStatus `json:"applicationStatus,omitempty"`
}
