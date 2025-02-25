package util

import (
	"log"
	"os"
	"strings"
)

type Logger struct {
	level  string
	logger *log.Logger
}

func NewLogger(level string) *Logger {
	return &Logger{
		level:  strings.ToUpper(level),
		logger: log.New(os.Stdout, "", log.LstdFlags),
	}
}

func (l *Logger) Info(msg string) {
	if l.level == "DEBUG" || l.level == "INFO" {
		l.logger.Printf("[INFO] %s", msg)
	}
}

func (l *Logger) Infof(format string, args ...interface{}) {
	if l.level == "DEBUG" || l.level == "INFO" {
		l.logger.Printf("[INFO] "+format, args...)
	}
}

func (l *Logger) Debug(msg string) {
	if l.level == "DEBUG" {
		l.logger.Printf("[DEBUG] %s", msg)
	}
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	if l.level == "DEBUG" {
		l.logger.Printf("[DEBUG] "+format, args...)
	}
}

func (l *Logger) Warn(msg string) {
	l.logger.Printf("[WARN] %s", msg)
}

func (l *Logger) Warnf(format string, args ...interface{}) {
	l.logger.Printf("[WARN] "+format, args...)
}

func (l *Logger) Error(msg string) {
	l.logger.Printf("[ERROR] %s", msg)
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.logger.Printf("[ERROR] "+format, args...)
}

func (l *Logger) Fatal(msg string) {
	l.logger.Fatalf("[FATAL] %s", msg)
}

func (l *Logger) Fatalf(format string, args ...interface{}) {
	l.logger.Fatalf("[FATAL] "+format, args...)
}
