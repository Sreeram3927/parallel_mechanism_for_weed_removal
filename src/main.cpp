#include <Arduino.h>
#include <motor_unit.h>
#include <FastAccelStepper.h>

bool moving = false;

FastAccelStepperEngine engine;
// MotorUnit(id, stepPin, dirPin, pwmPin, invertDir, offset)
MotorUnit armA('A', 13, 14, 19, false, 168.0f);
MotorUnit armB('B', 25, 26, 20, false, 168.0f);
MotorUnit armC('C', 27, 32, 21, false, 168.0f);


const int JOG_DEGREES = 20.0f;

const int GPO_PIN = 18;

void setup() {
  Serial.begin(115200);
  delay(500);

  engine.init();

  pinMode(GPO_PIN, OUTPUT);
  digitalWrite(GPO_PIN, HIGH);

  armA.init(engine);
  armB.init(engine);
  armC.init(engine);

  Serial.println("Controls:");
  Serial.println("  Q / A : Jog Axis A (+/-)");
  // Serial.println("  W / S : Jog Axis B (+/-)");
  // Serial.println("  E / D : Jog Axis C (+/-)");
  Serial.println("  X     : Stop All Motors");
  Serial.println("---------------------------------------");
}

void loop() {
  // 1. Check for Serial Commands (Jogging)
  if (Serial.available() > 0) {
    char cmd = toupper(Serial.read());

    switch (cmd) {
      case 'Q': 
        armA.moveRelative(JOG_DEGREES); Serial.println("Jogging A+"); 
        armB.moveRelative(JOG_DEGREES); Serial.println("Jogging B+"); 
        armC.moveRelative(JOG_DEGREES); Serial.println("Jogging C+"); 
        break;
      
      case 'A': 
        armA.moveRelative(-JOG_DEGREES); Serial.println("Jogging A-"); 
        armB.moveRelative(-JOG_DEGREES); Serial.println("Jogging B-"); 
        armC.moveRelative(-JOG_DEGREES); Serial.println("Jogging C-"); 

        break;
      
      // case 'W': myMotors.jogB("+"); Serial.println("Jogging B+"); break;
      // case 'S': myMotors.jogB("-"); Serial.println("Jogging B-"); break;
      
      // case 'E': myMotors.jogC("+"); Serial.println("Jogging C+"); break;
      // case 'D': myMotors.jogC("-"); Serial.println("Jogging C-"); break;

      case 'X': armA.stop(); Serial.println("EMERGENCY STOP"); break;
    }
  }

  
  armA.printAngle();

}