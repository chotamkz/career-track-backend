FROM golang:1.23 AS builder

WORKDIR /app
COPY go.mod go.sum ./

# Verify the module files are copied correctly
RUN ls -la

RUN go mod tidy -v

COPY . .

RUN go build -o /app/backend .
