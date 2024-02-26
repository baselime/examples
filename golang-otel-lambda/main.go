package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/lambda"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/metric"
	metricSdk "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesSdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
	"log"
	"math/rand"
	"os"
	"time"
)

var (
	meter      = otel.Meter("http-handler")
	reqCounter metric.Int64Counter
)

var tracer trace.Tracer

func main() {
	lambda.Start(func(ctx context.Context, event interface{}) error {
		envs := loadEnvs()
		meterProvider, err := initMeterProvider(ctx, envs)
		if err != nil {
			log.Fatalf("failed to initialize meter provider: %v", err)
			return err
		}
		traceProvider, err := newTraceProvider(ctx, envs)
		if err != nil {
			log.Fatalf("failed to initialize trace provider: %v", err)
			return err
		}
		rolldice(ctx)
		traceProvider.Shutdown(ctx)
		meterProvider.Shutdown(ctx)
		return nil
	})
}

func newTraceProvider(ctx context.Context, envs *Envs) (*tracesSdk.TracerProvider, error) {
	var tracesExporter tracesSdk.SpanExporter
	var err error
	switch envs.mode {
	case "http":
		log.Println("Using http traces exporter")
		tracesExporter, err = newTracesExporterHttp(ctx, envs)
	case "grpc":
		log.Println("Using grpc traces exporter")
		tracesExporter, err = newTracesExporterGRPC(ctx, envs)
	}
	if err != nil {
		log.Fatalf("failed to initialize exporter: %v", err)
	}
	if tracesExporter == nil {
		return nil, err
	}

	traceProvider := tracesSdk.NewTracerProvider(
		tracesSdk.WithBatcher(tracesExporter),
		tracesSdk.WithResource(getResources(envs)),
	)
	tracer = traceProvider.Tracer("ExampleService")
	otel.SetTracerProvider(traceProvider)
	return traceProvider, nil
}

type Envs struct {
	endpoint string
	apiKey   string
	mode     string
	insecure string
}

func loadEnvs() *Envs {
	endpoint, ok := os.LookupEnv("BASELIME_OTEL_ENDPOINT")
	if !ok {
		panic("Missing BASELIME_OTEL_ENDPOINT")
	}
	apiKey, ok := os.LookupEnv("BASELIME_API_KEY")
	if !ok {
		panic("Missing BASELIME_API_KEY")
	}
	mode, ok := os.LookupEnv("MODE")
	if !ok {
		panic("Missing MODE")
	} else {
		if mode != "http" && mode != "grpc" {
			panic("MODE must be either http or grpc")
		}
	}
	insecure := os.Getenv("INSECURE")
	log.Printf("Using endpoint %s\n", endpoint)
	return &Envs{
		endpoint: endpoint,
		apiKey:   apiKey,
		mode:     mode,
		insecure: insecure,
	}
}

func getResources(envs *Envs) *resource.Resource {
	ns := attribute.Key("io.baselime.namespace")
	proto := attribute.Key("io.baselime.protocol")
	r, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("ExampleService"),
			ns.String("some-namespace"),
			proto.String(envs.mode),
		),
	)

	if err != nil {
		panic(err)
	}
	return r
}

func newTracesExporterHttp(ctx context.Context, envs *Envs) (*otlptrace.Exporter, error) {
	exporter, err := otlptrace.New(
		ctx,
		otlptracehttp.NewClient(
			otlptracehttp.WithCompression(otlptracehttp.GzipCompression),
			otlptracehttp.WithEndpoint(envs.endpoint),
			otlptracehttp.WithTimeout(time.Second),
			otlptracehttp.WithURLPath("/v1/traces"),
			otlptracehttp.WithHeaders(map[string]string{
				"x-api-key": envs.apiKey,
			}),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create exporter: %w", err)
	}
	return exporter, nil
}

func newTracesExporterGRPC(ctx context.Context, envs *Envs) (*otlptrace.Exporter, error) {
	return otlptracegrpc.New(
		ctx,
		otlptracegrpc.WithEndpoint(envs.endpoint),
		otlptracegrpc.WithTimeout(time.Second),
		otlptracegrpc.WithCompressor("gzip"),
		otlptracegrpc.WithHeaders(map[string]string{
			"api-key": envs.apiKey,
		}),
	)
}

func rolldice(ctx context.Context) {
	reqCounter.Add(ctx, 1, metric.WithAttributes(attribute.String("request.path", "this_is_some_path")))
	log.Println("Rolling dice")
	ctx, span := tracer.Start(context.Background(), "roll")
	defer span.End()

	span.AddEvent("About to roll")

	roll := 1 + rand.Intn(6)

	// Add the custom attribute to the span and counter.
	rollValueAttr := attribute.Int("roll.value", roll)
	span.SetAttributes(rollValueAttr)
	mockDbCall(ctx)
}

func mockDbCall(ctx context.Context) {
	ctx, span := tracer.Start(ctx, "dbCall")
	defer span.End()
	time.Sleep(100 * time.Millisecond)
}

func initMeterProvider(ctx context.Context, envs *Envs) (*metricSdk.MeterProvider, error) {
	var err error
	reqCounter, err = meter.Int64Counter("http.request",
		metric.WithDescription("Number of HTTP requests received"),
	)
	if err != nil {
		return nil, err
	}
	var metricExporter metricSdk.Exporter
	if envs.mode == "http" {
		metricExporter, err = otlpmetrichttp.New(
			ctx,
			otlpmetrichttp.WithEndpoint("otel-ingest.baselime.cc:4317"),
			otlpmetrichttp.WithHeaders(map[string]string{
				"api-key": envs.apiKey,
			}),
		)
	} else {
		log.Println("Using gprc metrics exporter")
		metricExporter, err = otlpmetricgrpc.New(
			ctx,
			otlpmetricgrpc.WithEndpoint("otel-ingest.baselime.cc:4317"),
			otlpmetricgrpc.WithHeaders(map[string]string{
				"api-key": envs.apiKey,
			}),
			otlpmetricgrpc.WithCompressor("gzip"),
		)
	}

	if err != nil {
		return nil, err
	}

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("SERVICE_NAME_FOO"),
			semconv.ServiceVersion("SERVICE_VERSION_FOO"),
		),
	)
	if err != nil {
		return nil, err
	}

	meterProvider := metricSdk.NewMeterProvider(
		metricSdk.WithResource(res),
		metricSdk.WithReader(
			metricSdk.NewPeriodicReader(
				metricExporter,
				metricSdk.WithInterval(10*time.Second),
			),
		),
	)
	otel.SetMeterProvider(meterProvider)
	return meterProvider, nil
}
