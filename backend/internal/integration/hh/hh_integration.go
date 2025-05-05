package hh

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/util"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type HHVacancyResponse struct {
	Items []HHVacancy `json:"items"`
	Page  int         `json:"page"`
	Pages int         `json:"pages"`
	Found int         `json:"found"`
}

type HHVacancy struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description struct {
		Text string `json:"text"`
	} `json:"description"`
	Snippet struct {
		Requirement string `json:"requirement"`
	} `json:"snippet"`
	PostedDate string `json:"published_at"` // ISO8601
	Employer   struct {
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

type HHVacancyDetail struct {
	Description string `json:"description"`
	Address     struct {
		City     string `json:"city"`
		Street   string `json:"street"`
		Building string `json:"building"`
		Raw      string `json:"raw"`
	} `json:"address"`
	KeySkills []struct {
		Name string `json:"name"`
	} `json:"key_skills"`
	Schedule struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"schedule"`
	Experience struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"experience"`
}

func FetchITVacancies(perPage, page int, logger *util.Logger) ([]HHVacancy, error) {
	url := fmt.Sprintf("https://api.hh.ru/vacancies?professional_role=156&professional_role=160&professional_role=10&professional_role=12&professional_role=150&professional_role=25&professional_role=165&professional_role=34&professional_role=36&professional_role=73&professional_role=155&professional_role=96&professional_role=164&professional_role=104&professional_role=157&professional_role=107&professional_role=112&professional_role=113&professional_role=148&professional_role=114&professional_role=116&professional_role=121&professional_role=124&professional_role=125&professional_role=126&area=40&only_with_salary=true&per_page=%d&page=%d", perPage, page)
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

func FetchVacancyDetail(vacancyID string, logger *util.Logger) (HHVacancyDetail, error) {
	url := fmt.Sprintf("https://api.hh.ru/vacancies/%s", vacancyID)
	logger.Info("Fetching vacancy detail from HH API: " + url)
	resp, err := http.Get(url)
	if err != nil {
		return HHVacancyDetail{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return HHVacancyDetail{}, fmt.Errorf("HH Detail API returned status: %d", resp.StatusCode)
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return HHVacancyDetail{}, err
	}
	var detail HHVacancyDetail
	if err := json.Unmarshal(body, &detail); err != nil {
		return HHVacancyDetail{}, err
	}
	return detail, nil
}

func MapHHVacancyToInternal(hhVac HHVacancy, logger *util.Logger) model.Vacancy {
	var vacancy model.Vacancy
	vacancy.Title = hhVac.Name

	if strings.TrimSpace(hhVac.Description.Text) == "" {
		detail, err := FetchVacancyDetail(hhVac.ID, logger)
		if err != nil {
			logger.Errorf("Failed to fetch detail for vacancy %s: %v", hhVac.ID, err)
		} else {
			vacancy.Description = detail.Description
			vacancy.Location = detail.Address.Raw
			vacancy.WorkSchedule = detail.Schedule.Name
			vacancy.Experience = detail.Experience.Name

			var skills []string
			for _, ks := range detail.KeySkills {
				skill := strings.TrimSpace(ks.Name)
				if skill != "" {
					skills = append(skills, skill)
				}
			}
			vacancy.Skills = skills
		}
	} else {
		vacancy.Description = hhVac.Description.Text
		detail, err := FetchVacancyDetail(hhVac.ID, logger)
		if err == nil {
			vacancy.Location = detail.Address.Raw
			vacancy.WorkSchedule = detail.Schedule.Name
			vacancy.Experience = detail.Experience.Name
			var skills []string
			for _, ks := range detail.KeySkills {
				skill := strings.TrimSpace(ks.Name)
				if skill != "" {
					skills = append(skills, skill)
				}
			}
			vacancy.Skills = skills
		} else {
			vacancy.Location = "Unknown"
		}
	}

	vacancy.Requirements = hhVac.Snippet.Requirement

	posted, err := time.Parse(time.RFC3339, hhVac.PostedDate)
	if err != nil {
		vacancy.PostedDate = time.Now()
	} else {
		vacancy.PostedDate = posted
	}

	empID, err := strconv.ParseUint(hhVac.Employer.ID, 10, 32)
	if err == nil {
		vacancy.EmployerID = uint(empID)
	}
	vacancy.CreatedAt = time.Now()

	if hhVac.Salary != nil {
		vacancy.SalaryFrom = hhVac.Salary.From
		vacancy.SalaryTo = hhVac.Salary.To
		vacancy.SalaryCurrency = hhVac.Salary.Currency
		vacancy.SalaryGross = hhVac.Salary.Gross
	}
	vacancy.VacancyURL = sql.NullString{
		String: hhVac.AlternateURL,
		Valid:  hhVac.AlternateURL != "",
	}
	return vacancy
}
