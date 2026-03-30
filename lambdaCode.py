# SiloFogLambda
import json
import boto3

sqs = boto3.client('sqs')
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/603644466761/silosqs.fifo"

# Thresholds
TEMP_THRESHOLD = 30
HUM_THRESHOLD = 60
CO2_THRESHOLD = 1000
VIB_THRESHOLD = 0.5
GRAIN_MIN_THRESHOLD = 70   # example: low grain level

def to_float(value):
    try:
        return float(value)
    except:
        return 0.0

def to_int(value):
    try:
        return int(value)
    except:
        return 0

def lambda_handler(event, context):
    print("Received event:", event)

    temperature = to_float(event.get('temperature'))
    humidity = to_float(event.get('humidity'))
    co2 = to_int(event.get('co2'))
    vibration = to_float(event.get('vibration'))
    grain_level = to_int(event.get('grain_level'))

    # 🚀 Check if ANY threshold is violated
    if (
        temperature > TEMP_THRESHOLD or
        humidity > HUM_THRESHOLD or
        co2 > CO2_THRESHOLD or
        vibration > VIB_THRESHOLD or
        grain_level < GRAIN_MIN_THRESHOLD
    ):
        # ✅ Send FULL original event
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(event),
            MessageGroupId="sensor-group",  # required for FIFO
            MessageDeduplicationId=str(event.get("timestamp"))  # unique
        )

        print("⚠️ Sent FULL event to SQS:", event)

    else:
        print("✅ No issue, not sending")

    return {
        'statusCode': 200,
        'body': json.dumps('Processed successfully')
    }


# SiloFogLambda2
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

        print("✅ Saved to DynamoDB:", item)

    # 🔥 Call only once AFTER loop
    lambda_client.invoke(
        FunctionName='SendToWebSocketLambda',
        InvocationType='Event'
    )

    return {
        'statusCode': 200,
        'body': json.dumps('Data saved successfully')
    }


# connect
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('connections')

def lambda_handler(event, context):
    connectionId = event['requestContext']['connectionId']
    table.put_item(Item={'connectionId': connectionId})
    return {'statusCode': 200}


# disconnect
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('connections')

def lambda_handler(event, context):
    connectionId = event['requestContext']['connectionId']
    table.delete_item(Key={'connectionId': connectionId})
    return {'statusCode': 200}


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
    # 1️⃣ Get data from DynamoDB
    response = sensor_table.scan()
    items = response.get('Items', [])

    # sort latest first
    items.sort(key=lambda x: int(x.get("timestamp", 0)), reverse=True)

    items = convert_decimal(items)

    # 2️⃣ Get all connections
    connections = conn_table.scan().get('Items', [])

    # 3️⃣ Send to all clients
    for conn in connections:
        try:
            apigw.post_to_connection(
                ConnectionId=conn['connectionId'],
                Data=json.dumps(items)
            )
        except Exception as e:
            print("Error:", e)

    return {"statusCode": 200}

