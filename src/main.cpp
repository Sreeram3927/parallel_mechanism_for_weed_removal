#include <Arduino.h>
#include <motors.cpp>
#include <single_encoder.cpp>

bool moving = false;
float targetAngleA = 0.0f;

void setup() {
  Serial.begin(115200);
  delay(400);
  
  setupMotors();
  setupSingleEncoder();

  delay(300);
  Serial.println("A: jog +, D: jog -, G <angle>: go to absolute angle\n");
}

void loop() {
 
  // Check if motors are still running (non-blocking). If not, print current position.
  if (moving) {
    if (!stillRunning()) {
      moving = false;
      Serial.print("Reached target");
    }
  }

  if (!Serial.available()) return;

  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toUpperCase();
  if (line.length() == 0) return;

  char cmd = line.charAt(0);

  if (moving) {
    Serial.println("Busy, command ignored");
    return;
  }

  if (cmd == 'A' || cmd == 'D') {
    targetAngleA += (cmd == 'A') ? JOG_DEGREES : -JOG_DEGREES;
    Serial.print("Jog ");
    Serial.print((cmd == 'A') ? "+" : "-");
    Serial.print(JOG_DEGREES);
    Serial.println(" deg");
  } else {
    Serial.println("Unknown command. Use: A  D");
    return;
  }

  moveA(targetAngleA);
  moving = true;
}