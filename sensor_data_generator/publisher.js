const awsIot = require('aws-iot-device-sdk-v2');
const mqtt = awsIot.mqtt;
const iot = awsIot.iot;
const io = awsIot.io;

// ------------------ CONFIG ------------------
const endpoint = "a24dj683s013de-ats.iot.us-east-1.amazonaws.com";
const cert = "./authfiles/certificate1.pem.crt";
const key = "./authfiles/private1.pem.key";
const ca = "./authfiles/AmazonRootCA11.pem";
const clientId = "siloNewThing";
// --------------------------------------------

const configBuilder =
    iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(cert, key);

configBuilder.with_certificate_authority_from_path(undefined, ca);
configBuilder.with_clean_session(false);
configBuilder.with_client_id(clientId);
configBuilder.with_endpoint(endpoint);

const config = configBuilder.build();

const clientBootstrap = new io.ClientBootstrap();
const mqttClient = new mqtt.MqttClient(clientBootstrap);
const connection = mqttClient.new_connection(config);

// helper delay function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    try {
        await connection.connect();
        console.log("Connected to AWS IoT Core");
 
        setInterval(async () => {

            const time = Date.now();

            const message = {
                temperature: (25 + Math.random() * 15).toFixed(2), // 25-40°C
                humidity: (50 + Math.random() * 30).toFixed(2),    // 50-80%
                co2: Math.floor(400 + Math.random() * 1100),      // 400-1500 ppm
                vibration: (Math.random() * 1.5).toFixed(2),      // 0-1.5 g
                grain_level: Math.floor(50 + Math.random() * 50), // 50-100 %
                timestamp: time
            };

            console.log("Data Generated:", message);
            // SEND TO AWS
            await connection.publish(
                "silo/sensors",
                JSON.stringify(message),
                mqtt.QoS.AtLeastOnce
            );

            console.log(message);

        }, 5000);

    } catch (err) {
        console.log("Connection Error");
        console.error(err);
    }
}

start();