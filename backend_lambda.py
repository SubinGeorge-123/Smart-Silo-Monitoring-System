import json
import boto3
import uuid
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')
table = dynamodb.Table('SensorData')

def lambda_handler(event, context):
    print("Received SQS event:", event)

    for record in event['Records']:
        body = record['body']
        data = json.loads(body)

        item_id = str(uuid.uuid4())

        item = {
            "id": item_id,
            "temperature": Decimal(str(data.get('temperature', 0))),
            "humidity": Decimal(str(data.get('humidity', 0))),
            "co2": int(data.get('co2', 0)),
            "vibration": Decimal(str(data.get('vibration', 0))),
            "grain_level": int(data.get('grain_level', 0)),
            "timestamp": str(data.get('timestamp'))
        }

        table.put_item(Item=item)

        print("Saved to DynamoDB:", item)

    lambda_client.invoke(
        FunctionName='SendToWebSocketLambda',
        InvocationType='Event'
    )

    return {
        'statusCode': 200,
        'body': json.dumps('Data saved successfully')
    }
