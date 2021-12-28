'use strict';

const uuid = require("uuid");
const AWS = require("aws-sdk");
const logger = require("logger");
const otel = require("@opentelemetry/api");


module.exports.handler = async (event) => {
  logger.info("The event", event);

  // Get the current active span
  const activeSpan = otel.trace.getSpan(otel.context.active());
  try {
    const body = JSON.parse(event.body);

    const post = {
      id: uuid.v4(),
      title: body.title,
      content: body.content,
      created: (new Date()).toISOString(),
    };
    // Add the post to the active span
    activeSpan.setAttribute("post.id", post.id);

    await writeToDb(post);
    // Add an event to the span, signaling a post was created
    activeSpan.addEvent("POST_CREATED", { "post.id": post.id });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: 'Post created', post }),
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

async function writeToDb(post) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });
  const tableName = process.env.PROJECTION_TABLE;

  const params = {
    TableName: tableName,
    Item: {
      partitionKey: `post#${post.id}`,
      data: post,
      type: "post",
    },
    ConditionExpression: 'attribute_not_exists(partitionKey)'
  };

  try {
    await dynamoDb.put(params).promise();
  } catch (err) {
    logger.error("There was an error writing to the database", { post, error });
    throw err;
  }
}
