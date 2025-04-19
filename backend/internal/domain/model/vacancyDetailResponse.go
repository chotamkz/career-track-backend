package model

type VacancyDetailResponse struct {
	Vacancy
	ApplicationStatus *ApplicationStatus `json:"applicationStatus,omitempty"`
}
