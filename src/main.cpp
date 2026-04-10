#include <Arduino.h>
#include <motor_unit.h>
#include <FastAccelStepper.h>

bool moving = false;
unsigned long lastPrintTime = 0; 
const unsigned long printInterval = 500;

FastAccelStepperEngine engine;
// MotorUnit(id, stepPin, dirPin, pwmPin, invertDir, offset)
MotorUnit armA('A', 13, 14, 0, false, 47.5f);
MotorUnit armB('B', 27, 26, 1, false, 168.0f);
MotorUnit armC('C', 25, 32, 2, false, 168.0f);


const int JOG_DEGREES = 5.0f;

const int GPO_PIN = 18;

// Add this global variable at the top of your code (outside of loop):
bool isJoggingA = false;

void setup() {
  Serial.begin(115200);
  delay(500);
  Wire.begin(21, 22); // SDA, SCL
  Wire.setClock(150000); // 400kHz for faster encoder reads

  engine.init();

  pinMode(GPO_PIN, OUTPUT);
  digitalWrite(GPO_PIN, HIGH);

  armA.init(engine);
  armB.init(engine);
  armC.init(engine);

  Serial.println("Controls:");
  Serial.println("  Q / A : Jog Axis (+/-)");
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
      case 'Q': 
        armA.moveRelative(JOG_DEGREES); Serial.println("Jogging A+"); 
        break;
      
      case 'A': 
        armA.moveRelative(-JOG_DEGREES); Serial.println("Jogging A-"); 
        break;
      
      case 'W':
        armB.moveRelative(JOG_DEGREES); Serial.println("Jogging B+");
        break;
      case 'S':
        armB.moveRelative(-JOG_DEGREES); Serial.println("Jogging B-");
        break;
      
      case 'E':
        armC.moveRelative(JOG_DEGREES); Serial.println("Jogging C+");
        break;
      case 'D':
        armC.moveRelative(-JOG_DEGREES); Serial.println("Jogging C-");
        break;

      case 'X':
        armA.stop(); 
        armB.stop();
        armC.stop();
        Serial.println("EMERGENCY STOP"); 
        break;

      case 'P':
        armA.printAngle();
        armB.printAngle();
        armC.printAngle();
        Serial.println("---------------------------------------");
      break;
    }
  }

  armA.updateAngle();
  armB.updateAngle(); 
  armC.updateAngle(); 

  // 2. Check if 500ms have passed since the last time we printed
  // if (millis() - lastPrintTime >= printInterval) {
  //   // Save the current time for the next cycle
  //   lastPrintTime = millis(); 

  //   // Print the values
  //   armA.printAngle();
  //   // armB.printAngle();
  //   // armC.printAngle();
  //   // Serial.println("---------------------------------------");
  // }

  // if (isJoggingA == true && armA.isMoving() == false) {
  //   Serial.print("--- AFTER JOG A --- Angle: ");
  //   armA.printAngle();  // Print the final resting angle
  //   Serial.println("---------------------------");
    
  //   isJoggingA = false; // Reset the flag so it only prints once
  // }

}