const awsIot = require('aws-iot-device-sdk-v2');
const mqtt = awsIot.mqtt;
const iot = awsIot.iot;
const io = awsIot.io;

// ------------------ CONFIG ------------------
const endpoint = "a1qj8hpf44mgss-ats.iot.us-east-1.amazonaws.com";
const cert = "./authfiles/certificate.pem.crt";
const key = "./authfiles/private.pem.key";
const ca = "./authfiles/AmazonRootCA1.pem";
const clientId = "SiloSensorNode";
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
        console.log("✅ Connected to AWS IoT Core");

        // generate data every 10 seconds
        setInterval(async () => {

            // 1️⃣ DATA GENERATED
            const time = Date.now();

            const message = {
                temperature: (25 + Math.random() * 15).toFixed(2), // 25-40°C
                humidity: (50 + Math.random() * 30).toFixed(2),    // 50-80%
                co2: Math.floor(400 + Math.random() * 1100),      // 400-1500 ppm
                vibration: (Math.random() * 1.5).toFixed(2),      // 0-1.5 g
                grain_level: Math.floor(50 + Math.random() * 50), // 50-100 %
                timestamp: time
            };

            console.log("🧠 Data Generated:", message);

            // 2️⃣ WAIT 5 seconds before sending
            // await sleep(5000);

            // 3️⃣ SEND TO AWS
            await connection.publish(
                "silo/sensors",
                JSON.stringify(message),
                mqtt.QoS.AtLeastOnce
            );

            console.log("📤 Sent after 5 sec:", message);

        }, 5000); // generate every 10 seconds

    } catch (err) {
        console.log("❌ Connection Error");
        console.error(err);
    }
}

start();