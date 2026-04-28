#include <Arduino.h>
#include <dc_motor.h>

Motor motorLB(6, 7, false);
Motor motorLF(9, 8, false);
Motor motorRB(3, 2, true); 
Motor motorRF(5, 4, true);

int defaultSpeed = 50; 

unsigned long lastCommandTime = 0;
const unsigned long WATCHDOG_TIMEOUT = 300; // Stop if no command for 300ms
bool eStopActive = false;

void moveRobot(int speed);
void stopRobot();

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
  // 1. Safety Watchdog: Check if we haven't received a command recently
  if (!eStopActive && (millis() - lastCommandTime > WATCHDOG_TIMEOUT)) {
    // We only call stopRobot() if it's not already stopped to prevent serial spam
    stopRobot(); 
    // We don't print "Stopped" here constantly, otherwise it floods the Jetson
  }

  // 2. Process incoming commands
  if (Serial.available() > 0) {
    char command = Serial.read();

    // Ignore newlines
    if (command == '\n' || command == '\r') return; 

    // Update the watchdog timer for ANY valid command received
    lastCommandTime = millis();

    // --- E-STOP LOGIC ---
    if (command == 'E') {
      eStopActive = true;
      stopRobot();
      Serial.println("🚨 E-STOP ENGAGED 🚨 Motors Locked.");
      return;
    }
    
    if (command == 'R') {
      eStopActive = false;
      Serial.println("✅ E-STOP RESET. Motors Unlocked.");
      return;
    }

    // --- MOVEMENT LOGIC ---
    if (eStopActive) {
      Serial.println("⚠️ Cannot move. E-STOP is active! Send 'R' to reset.");
      return; // Ignore all movement commands
    }

    switch (command) {
      case 'f':
        moveRobot(defaultSpeed);
        break;
      case 'b':
        moveRobot(-defaultSpeed);
        break;
      case 's':
        stopRobot();
        break;
    }
  }
}

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