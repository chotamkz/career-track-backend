package util

import (
	"log"
	"strings"
)

type Logger struct {
	level string
}

func NewLogger(level string) *Logger {
	return &Logger{level: strings.ToUpper(level)}
}

func (l *Logger) Info(msg string) {
	if l.level == "INFO" || l.level == "DEBUG" {
		log.Printf("[INFO] %s", msg)
	}
}

func (l *Logger) Error(msg string) {
	log.Printf("[ERROR] %s", msg)
}

func (l *Logger) Fatalf(format string, args ...interface{}) {
	log.Fatalf("[FATAL] "+format, args...)
}
