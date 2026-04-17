

# SendToWebSocketLambda

import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sensor_table = dynamodb.Table('SensorData')
conn_table = dynamodb.Table('connections')

apigw = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url="https://q7662enf50.execute-api.us-east-1.amazonaws.com/production"
)

def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj

def lambda_handler(event, context):
    # Get data from DynamoDB
    response = sensor_table.scan()
    items = response.get('Items', [])

    # sort latest first
    items.sort(key=lambda x: int(x.get("timestamp", 0)), reverse=True)

    items = convert_decimal(items)

    # Get all connections
    connections = conn_table.scan().get('Items', [])

    # Send to all clients
    for conn in connections:
        try:
            apigw.post_to_connection(
                ConnectionId=conn['connectionId'],
                Data=json.dumps(items)
            )
        except Exception as e:
            print("Error:", e)

    return {"statusCode": 200}




# connect Lambda
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('connections')

def lambda_handler(event, context):
    connectionId = event['requestContext']['connectionId']
    table.put_item(Item={'connectionId': connectionId})
    return {'statusCode': 200}


# disconnect Lambda
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('connections')

def lambda_handler(event, context):
    connectionId = event['requestContext']['connectionId']
    table.delete_item(Key={'connectionId': connectionId})
    return {'statusCode': 200}

