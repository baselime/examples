# nodejs-api

This example illustrates a nodejs API built with API Gateway and AWS Lambda, and instrumented with OpenTelemetry.

## Synopsis

This is a simple API to manage blog posts with 2 end-points:

- `POST /`: Create a blog post. It expects as request body

```json #
{
  "title": "The blog post title",
  "content": "The content of the blog post"
}
```

- `GET /{id}`: Get a single blog post.

To illustrate how Baselime works, this app makes a few external calls:

- to `DyanmoDB` to save and retrieve blog posts.
- to `https://jsonplaceholder.typicode.com` to add illustration images to blog posts.

## Demo

This app illustrates how to:

- Add auto-instrumentation to a AWS Lambda app with OpenTelemetry
- Send telemetry data to Baselime
- Add custom attributes and events to spans
- Create new spans
- Capture exceptions

## Setup

Get your `BASELIME_API_KEY` and add it to your Lambda function env variables.

Deploy the app

Create blog post

```bash #
curl $LAMBDA_URL  \
    -d '
{
  "title": "Hello, World!",
  "content": "Just Do It!"
}
'
```

Retrieve a blog post

```bash #
curl $LAMBDA_URL 
```

## Result

Visit the Baselime Web UI to visualise your logs, metrics and traces.