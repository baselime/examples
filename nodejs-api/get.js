'use strict';

const axios = require("axios");
const AWS = require("aws-sdk");
const logger = require("logger");
const otel = require("@opentelemetry/api");

module.exports.handler = async (event) => {
  logger.info("The event", event);

  // Get the current active span
  const activeSpan = otel.trace.getSpan(otel.context.active());

  try {
    const { id } = event.pathParameters;
    const post = await getFromDb(id);
    // Add the post to the active span
    activeSpan.setAttribute("post.id", post.id);

    if (!post) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: 'Not found' }),
      };
    }

    // Get a random index to request an image to enrich the post
    const index = getRandomIndex();
    const image = (await axios(`https://jsonplaceholder.typicode.com/photos/${index}`)).data;
    // Add info about the fetched image to the active span
    activeSpan.setAttributes({ "image.url": image.url, "image.thumbnail": image.thumbnailUrl });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          message: 'Post found',
          post: {
            ...post,
            image: {
              url: image.url,
              thumbnail: image.thumbnailUrl,
            },
          },
        },
      ),
    };

  } catch (error) {
    logger.info("There was an error handling a request", { event, error });
    activeSpan.recordException(error);
    // Set the active span status to error
    activeSpan.setStatus({ code: otel.SpanStatusCode.ERROR });
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Fatal Error" }),
    }
  }
};

function getRandomIndex(max = 5000) {
  // Create a new span for a very expensive computation
  const tracer = otel.trace.getTracer("get-random-index");
  const span = tracer.startSpan("expensive-computation");
  // Expensive computation
  const index = Math.floor(Math.random() * max);
  span.setAttribute(index, index);
  // End the span after the expensive computation
  span.end();

  return index;
}

async function getFromDb(id) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });
  const tableName = process.env.PROJECTION_TABLE;

  const params = {
    TableName: tableName,
    Key: {
      partitionKey: `post#${id}`,
    },
  };

  try {
    const res = await dynamoDb.get(params).promise();
    if (!res.Item) {
      return undefined;
    }
    return res.Item.data;
  } catch (err) {
    logger.info("There was an error reading from the database", { id, error });
    throw err;
  }
}
