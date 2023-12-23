from mangum import Mangum
import os
from opentelemetry import trace
import boto3
import logging
import requests
import json
# from aws_lambda_powertools import Logger
# from aws_lambda_powertools.utilities.typing import LambdaContext

# logger = Logger()


logger = logging.getLogger()
tracer = trace.get_tracer("custom-spans", "1.0.0")

dynamodb = boto3.client('dynamodb')

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute

class UserModel(Model):
    """
    A DynamoDB User
    """
    class Meta:
        table_name = os.environ.get("TABLE")
        region = 'eu-west-2'
    email = UnicodeAttribute(null=True)
    userId = UnicodeAttribute(range_key=True)
    noteId = UnicodeAttribute(hash_key=True)

async def app(scope, receive, send):
    with tracer.start_as_current_span("app"):
        logger.info("Hello World this is default python", {"extra": {"prop1": "value1", "prop2": "value2"}})
        logger.warning("This is a warning this is default python")
        logger.error("This is an error this is default python")

        user = UserModel("John", "Denver")
        user.email = "djohn@company.org"
        user.save()
        for user in UserModel.query("Denver", UserModel.userId.startswith("J")):
            print(user.userId)

        x = requests.post('https://cy4sl4ea9a.execute-api.eu-west-2.amazonaws.com/subscription', json={"email": "demo@baselime.io"})
        
        print(x.status_code)
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [[b"content-type", b"application/json; charset=utf-8"]],
        })
        await send({"type": "http.response.body", "body": json.dumps({"message": "Hello World"}).encode()})
 
def handler(event, context):
    return Mangum(app, lifespan="off")(event, context)