#include <Arduino.h>
#include <motor_unit.h>
#include <FastAccelStepper.h>
#include <jetson_comm.h>
#include <protocol.h>

FastAccelStepperEngine engine;
// MotorUnit(id, stepPin, dirPin, pwmPin, invertDir, offset)
MotorUnit armA('A', 13, 14, 0, false, 47.5f);
MotorUnit armB('B', 27, 26, 1, false, 168.0f);
MotorUnit armC('C', 25, 32, 2, false, 168.0f);

static bool ACTIVE = false;

static int JOG_DEGREES = 5.0f;

unsigned long lastTelemetryTime = 0;
const int TELEMETRY_INTERVAL = 20; // 20ms = 50Hz update rate

CommandPacket cmd;

void setup() {
  
  Serial.begin(115200);
  delay(500);
  ESP_LOGI("General", "Communication with Jetson Initialized at 115200 baud");

  Wire.begin(21, 22); // SDA, SCL
  ESP_LOGI("General", "I2C Initialized");

  engine.init();
  ESP_LOGI("General", "Stepper Engine Initialized");

  armA.init(engine);
  armB.init(engine);
  armC.init(engine);
}

void loop() {
  
  if (Serial.available() >= sizeof(CommandPacket)) {
    Serial.readBytes((char*)&cmd, sizeof(CommandPacket));
    executeCommand(cmd, armA, armB, armC);
  }

  // Send telementry at regular interval
  unsigned long currentTime = millis();
  if (currentTime - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentTime;
    sendTelemetryToJetson(armA, armB, armC);
  }

  // Do always update angles to keep telemetry fresh, even if no new commands are received
  armA.updateAngle();
  armB.updateAngle(); 
  armC.updateAngle(); 

}