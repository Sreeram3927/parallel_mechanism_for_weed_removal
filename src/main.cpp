#include <Arduino.h>
#include <dc_motor.h>

Motor motorLF(3, 2, true); 
Motor motorLB(5, 4, true);
Motor motorRF(9, 8, false);
Motor motorRB(6, 7, false);

// --- LASER SETUP ---
const int laserPin = 11; 

int defaultSpeed = 50; 

unsigned long lastCommandTime = 0;
const unsigned long WATCHDOG_TIMEOUT = 300; // Stop if no command for 300ms
bool eStopActive = false;
bool isStopped = true; // Flag to prevent spamming stop commands

void moveRobot(int speed);
void moveLeft(int speed);
void moveRight(int speed);
void stopRobot();
void setLaser(int powerPercent); // New laser function

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(10); // Very fast timeout so reading strings doesn't block the loop

  // Initialize laser
  pinMode(laserPin, OUTPUT);
  analogWrite(laserPin, 0); // Ensure laser is OFF

  // Initialize all motors
  motorLB.begin();
  motorLF.begin();
  motorRB.begin();
  motorRF.begin();
  
  Serial.println("Robot & Laser Ready. Send commands ending with newline (\\n).");
}

void loop() {
  // 1. Safety Watchdog: Check if we haven't received a command recently
  if (!eStopActive && (millis() - lastCommandTime > WATCHDOG_TIMEOUT)) {
    if (!isStopped) {
      stopRobot(); 
      setLaser(0); // SAFETY: Turn off laser if communication is lost
      isStopped = true;
    }
  }

  // 2. Process incoming commands
  if (Serial.available() > 0) {
    // Read the whole incoming string until a newline
    String commandStr = Serial.readStringUntil('\n');
    commandStr.trim(); // Remove whitespace/carriage returns

    if (commandStr.length() == 0) return; // Ignore empty lines

    // Update the watchdog timer for ANY valid command received
    lastCommandTime = millis();

    // Get the first character to determine the command type
    char cmd = commandStr.charAt(0);

    // --- E-STOP LOGIC ---
    if (cmd == 'E') {
      eStopActive = true;
      stopRobot();
      setLaser(0); // SAFETY: Immediately kill laser power
      isStopped = true;
      Serial.println("🚨 E-STOP ENGAGED 🚨 Motors & Laser Locked.");
      return;
    }
    
    if (cmd == 'R') {
      eStopActive = false;
      Serial.println("✅ E-STOP RESET. Motors & Laser Unlocked.");
      return;
    }

    // --- MOVEMENT & LASER LOGIC ---
    if (eStopActive) {
      Serial.println("⚠️ Cannot execute. E-STOP is active! Send 'R' to reset.");
      return; 
    }

    isStopped = false; // We are actively processing a command

    switch (cmd) {
      case 'f': moveRobot(defaultSpeed); break;
      case 'b': moveRobot(-defaultSpeed); break;
      case 'l': moveLeft(100); break;
      case 'r': moveRight(100); break;
      case 's': 
        stopRobot(); 
        isStopped = true; 
        break;
      case 'L':
        // Extract the number after 'L' (e.g., "L75" becomes 75)
        int power = commandStr.substring(1).toInt();
        setLaser(power);
        break;
    }
  }
}

void moveRobot(int speed) {
  motorLB.drive(speed);
  motorLF.drive(speed);
  motorRB.drive(speed);
  motorRF.drive(speed);
}

void moveLeft(int speed) {
  motorLB.drive(-speed);
  motorLF.drive(-speed);
  motorRB.drive(speed);
  motorRF.drive(speed);
}

void moveRight(int speed) {
  motorLB.drive(speed);
  motorLF.drive(speed);
  motorRB.drive(-speed);
  motorRF.drive(-speed);
}

void stopRobot() {
  motorLB.stop();
  motorLF.stop();
  motorRB.stop();
  motorRF.stop();
}

// --- LASER CONTROL FUNCTION ---
void setLaser(int powerPercent) {
  powerPercent = constrain(powerPercent, 0, 100); // Keep it safe
  int pwmValue = map(powerPercent, 0, 100, 0, 255);
  analogWrite(laserPin, pwmValue);
  
  Serial.print("Laser Power set to: ");
  Serial.print(powerPercent);
  Serial.println("%");
}