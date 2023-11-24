import json
import boto3
import os

def handler(event, context):
    # Your JSON object
    json_object = {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
    }
    
    # Convert JSON object to a string
    message = json.dumps(json_object)
    
    # Initialize SNS client
    sns = boto3.client('sns')
    
    # Publish JSON object to SNS topic
    sns.publish(
        TopicArn=os.environ.get("TOPIC"),  # Replace with your SNS topic ARN
        Message=message
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('JSON object sent to SNS topic')
    }