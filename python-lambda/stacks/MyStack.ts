import { StackContext, Api, EventBus, Table, Topic, KinesisStream, Queue, Bucket } from "sst/constructs";

export function API({ stack }: StackContext) {
 
  const kinesis = new KinesisStream(stack, "Kinesis")
  const queue = new Queue(stack, "Queue");
  const events = new EventBus(stack, "Bus");
  const bucket = new Bucket(stack, "Bucket");
  const table = new Table(stack, "Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "noteId", sortKey: "userId" },
  });

  const topic = new Topic(stack, "Topic", {
    defaults: {
      function: {
        environment: {
          STREAM: kinesis.streamName,
          QUEUE: queue.queueUrl,
          EVENTS: events.eventBusName,
          BUCKET: bucket.bucketName,
        }
      }
    },
    subscribers: {
      notify: "src/notify.handler"
    }
  });

  topic.attachPermissions([kinesis, queue, events, bucket]);
  const api = new Api(stack, "api", {
      defaults: {
        function: {
          environment: {
            TABLE: table.tableName,
            TOPIC: topic.topicArn,
          }
        }
    },
    routes: {
      "GET /": "src/app.handler",
      "POST /subscription": "src/subscribe.handler",
    },
  });

  api.attachPermissions([table, topic]);

  

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
