#include <Arduino.h>
#include <dc_motor.h>

Motor motorLB(6, 7, false);
Motor motorLF(9, 8, false);
Motor motorRB(3, 2, true); 
Motor motorRF(5, 4, true);

int defaultSpeed = 150; 

void setup() {
  Serial.begin(115200);

  // Initialize all motors
  motorLB.begin();
  motorLF.begin();
  motorRB.begin();
  motorRF.begin();
  Serial.println("Robot Ready. Send 'f' for forward, 'b' for backward, 's' to stop.");
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    switch (command) {
      case 'f':
        moveRobot(defaultSpeed); // Positive speed = forward
        Serial.println("Action: Moving Forward");
        break;
      case 'b':
        moveRobot(-defaultSpeed); // Negative speed = backward
        Serial.println("Action: Moving Backward");
        break;
      case 's':
        stopRobot();
        Serial.println("Action: Stopped");
        break;
      case '\n':
      case '\r':
        break;
      default:
        Serial.println("Invalid command. Use f, b, or s.");
        break;
    }
  }
}

// --- Simplified Movement Functions ---

// Pass a positive number for forward, negative for backward
void moveRobot(int speed) {
  motorLB.drive(speed);
  motorLF.drive(speed);
  motorRB.drive(speed);
  motorRF.drive(speed);
}

void stopRobot() {
  motorLB.stop();
  motorLF.stop();
  motorRB.stop();
  motorRF.stop();
}