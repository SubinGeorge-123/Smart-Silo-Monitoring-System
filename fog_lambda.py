import json
import boto3

sqs = boto3.client('sqs')
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/262439760574/silosqs.fifo"

# Thresholds
TEMP_THRESHOLD = 30
HUM_THRESHOLD = 60
CO2_THRESHOLD = 1000
VIB_THRESHOLD = 0.5
GRAIN_MIN_THRESHOLD = 70  

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

    if (
        temperature > TEMP_THRESHOLD or
        humidity > HUM_THRESHOLD or
        co2 > CO2_THRESHOLD or
        vibration > VIB_THRESHOLD or
        grain_level < GRAIN_MIN_THRESHOLD
    ):
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(event),
            MessageGroupId="sensor-group",
            MessageDeduplicationId=str(event.get("timestamp")) 
        )

        print("Sent FULL event to SQS:", event)

    else:
        print("No issue, not sending")

    return {
        'statusCode': 200,
        'body': json.dumps('Processed successfully')
    }
