FROM golang:1.19

WORKDIR /app

COPY go.mod ./
COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /logger

FROM alpine:latest

COPY --from=0 /logger /logger

CMD ["/logger"]