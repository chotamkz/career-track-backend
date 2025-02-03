package main

import (
    "fmt"
    "log"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello from Golang backend!")
}

func main() {
    http.HandleFunc("/", handler)
    log.Println("Backend running on port 8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
