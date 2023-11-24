from mangum import Mangum
import os
from opentelemetry import trace
import boto3
from random import randint
import requests
import json
tracer = trace.get_tracer("custom-spans", "1.0.0")

dynamodb = boto3.client('dynamodb')

async def app(scope, receive, send):
    with tracer.start_as_current_span("app"):
        
        dynamodb.put_item(TableName=os.environ.get("TABLE"), Item={'userId':{'S':'Banana'},'noteId':{'S':'value2'}})
        dynamodb.get_item(TableName=os.environ.get("TABLE"), Key={'userId':{'S':'Banana'},'noteId':{'S':'value2'}})

        x = requests.post('https://9zcl1p2bil.execute-api.eu-west-1.amazonaws.com/subscription', json={"email": "demo@baselime.io"})
        
        print(x.status_code)
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [[b"content-type", b"application/json; charset=utf-8"]],
        })
        await send({"type": "http.response.body", "body": json.dumps({"message": "Hello World"}).encode()})
 


handler = Mangum(app, lifespan="off")