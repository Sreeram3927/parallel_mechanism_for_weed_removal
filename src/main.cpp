#include <Arduino.h>
#include <motors.h>

bool moving = false;
float targetAngleA = 0.0f;

void setup() {
  Serial.begin(115200);
  delay(500);

  myMotors.setup();

  Serial.println("Controls:");
  Serial.println("  Q / A : Jog Axis A (+/-)");
  Serial.println("  W / S : Jog Axis B (+/-)");
  Serial.println("  E / D : Jog Axis C (+/-)");
  Serial.println("  X     : Stop All Motors");
  Serial.println("---------------------------------------");
}

void loop() {
  // 1. Check for Serial Commands (Jogging)
  if (Serial.available() > 0) {
    char cmd = toupper(Serial.read());

    switch (cmd) {
      case 'Q': myMotors.jogA("+"); Serial.println("Jogging A+"); break;
      case 'A': myMotors.jogA("-"); Serial.println("Jogging A-"); break;
      
      case 'W': myMotors.jogB("+"); Serial.println("Jogging B+"); break;
      case 'S': myMotors.jogB("-"); Serial.println("Jogging B-"); break;
      
      case 'E': myMotors.jogC("+"); Serial.println("Jogging C+"); break;
      case 'D': myMotors.jogC("-"); Serial.println("Jogging C-"); break;

      case 'X': myMotors.stopAll(); Serial.println("EMERGENCY STOP"); break;
    }
  }
}