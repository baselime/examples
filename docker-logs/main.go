package main

import (
	"encoding/json"
	"time"
)

func main() {
	for {
		printJson("Hello world!")
		time.Sleep(time.Second * 5)
	}
}

func printJson(msg string) {
	type Msg struct {
		Message string `json:"message"`
	}
	b, _ := json.Marshal(&Msg{
		Message: msg,
	})
	println(string(b))
}
