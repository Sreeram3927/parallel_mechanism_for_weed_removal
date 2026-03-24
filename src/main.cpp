#include <Arduino.h>

void setupSingleEncoder();
float getShaftAngleFromPWM();

bool moving = false;
float targetAngleA = 0.0f;

void setup() {
  Serial.begin(115200);
  delay(400);
  
  setupSingleEncoder();
}

void loop() {
 
  Serial.print("Current angle: ");
  float angle = getShaftAngleFromPWM();
  if (angle < 0) {
    Serial.println("Error reading angle");
  } else {
    Serial.print(angle, 1);
    Serial.println(" deg");
  }
  delay(500);
}