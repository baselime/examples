# OTEL with Golang

This example demonstrates how to instrument a simple Golang serverless API with OpenTelemetry.

#### Environment variables

| Name                     | Value                          
|--------------------------|--------------------------------|
| `BASELIME_OTEL_ENDPOINT` | `otel-ingest.baselime.io:4318` |
| `BASELIME_API_KEY`       | get from console.baselime.io   |
| `MODE`                   | `http` or `grpc`               |              