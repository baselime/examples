import boto3
import json
import os

kinesis = boto3.client('kinesis')
s3 = boto3.client('s3')
queue = boto3.client('sqs')
events = boto3.client('events')

BUS = os.environ.get("EVENTS")
BUCKET = os.environ.get("BUCKET")
QUEUE = os.environ.get("QUEUE")
STREAM = os.environ.get("STREAM")

def handler(event, context):
    print(event)

    events.put_events(
        Entries=[
            {
            'Source': 'your_source',
            'DetailType': 'your_detail_typeing',
            'Detail': json.dumps(event),
            'EventBusName': BUS,
            },
        ]
    )

    s3.put_object(
        Bucket=BUCKET,
        Key='your_key',
        Body=json.dumps(event),
    )

    queue.send_message(
        QueueUrl=QUEUE,
        MessageBody=json.dumps(event),
    )

    kinesis.put_record(
        StreamName=STREAM,
        Data=json.dumps(event),
        PartitionKey='your_partition_key',
    )
