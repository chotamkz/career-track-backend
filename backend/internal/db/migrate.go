package db

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"strings"
)

func Migrate(db *sql.DB, migrationFile string) error {
	content, err := ioutil.ReadFile(migrationFile)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}

	queries := strings.Split(string(content), ";")
	for _, query := range queries {
		trimmedQuery := strings.TrimSpace(query)
		if trimmedQuery == "" {
			continue
		}
		_, err := db.Exec(trimmedQuery)
		if err != nil {
			log.Printf("failed executing query:\n%s\nerror: %v\n", trimmedQuery, err)
			return err
		}
	}

	log.Println("Database migration completed successfully.")
	return nil
}
