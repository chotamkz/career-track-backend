package hh

import (
	"encoding/json"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/util"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"
)

type HHVacancyResponse struct {
	Items   []HHVacancy `json:"items"`
	Page    int         `json:"page"`
	Pages   int         `json:"pages"`
	PerPage int         `json:"per_page"`
	Found   int         `json:"found"`
}

type HHVacancy struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Area struct {
		Name string `json:"name"`
	} `json:"area"`
	Description struct {
		Text string `json:"text"`
	} `json:"description"`
	Snippet struct {
		Requirement    string `json:"requirement"`
		Responsibility string `json:"responsibility"`
	} `json:"snippet"`
	PublishedAt string `json:"published_at"`
	Employer    struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"employer"`
	Salary *struct {
		From     float64 `json:"from"`
		To       float64 `json:"to"`
		Currency string  `json:"currency"`
		Gross    bool    `json:"gross"`
	} `json:"salary"`
	AlternateURL string `json:"alternate_url"`
}

func FetchITVacancies(perPage, page int, logger *util.Logger) ([]HHVacancy, error) {
	url := fmt.Sprintf("https://api.hh.ru/vacancies?professional_role=156&professional_role=160&professional_role=10&professional_role=12&professional_role=150&professional_role=25&professional_role=165&professional_role=34&professional_role=36&professional_role=73&professional_role=155&professional_role=96&professional_role=164&professional_role=104&professional_role=157&professional_role=107&professional_role=112&professional_role=113&professional_role=148&professional_role=114&professional_role=116&professional_role=121&professional_role=124&professional_role=125&professional_role=126&per_page=%d&page=%d", perPage, page)
	logger.Info("Fetching vacancies from HH API: " + url)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HH API returned status: %d", resp.StatusCode)
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var hhResp HHVacancyResponse
	if err := json.Unmarshal(body, &hhResp); err != nil {
		return nil, err
	}
	return hhResp.Items, nil
}

func MapHHVacancyToInternal(vac HHVacancy) model.Vacancy {
	published, err := time.Parse(time.RFC3339, vac.PublishedAt)
	if err != nil {
		published = time.Now()
	}
	location := vac.Area.Name
	var salaryFrom, salaryTo float64
	var salaryCurrency string
	var salaryGross bool
	if vac.Salary != nil {
		salaryFrom = vac.Salary.From
		salaryTo = vac.Salary.To
		salaryCurrency = vac.Salary.Currency
		salaryGross = vac.Salary.Gross
	}
	empID, _ := strconv.ParseUint(vac.Employer.ID, 10, 32)
	return model.Vacancy{
		Title:          vac.Name,
		Description:    vac.Description.Text,
		Requirements:   vac.Snippet.Requirement,
		Conditions:     vac.Snippet.Responsibility,
		Location:       location,
		PostedDate:     published,
		EmployerID:     uint(empID),
		CreatedAt:      time.Now(),
		SalaryFrom:     salaryFrom,
		SalaryTo:       salaryTo,
		SalaryCurrency: salaryCurrency,
		SalaryGross:    salaryGross,
		VacancyURL:     vac.AlternateURL,
	}
}
