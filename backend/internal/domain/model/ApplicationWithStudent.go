package model

type ApplicationWithStudent struct {
	Application  Application `json:"application"`
	StudentName  string      `json:"studentName"`
	Education    string      `json:"education"`
	City         string      `json:"city"`
	Phone        string      `json:"phone"`
	StudentEmail string      `json:"email"`
}
