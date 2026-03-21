#include <motors.h>

#define A_STEP_PIN 2
#define A_DIR_PIN 5

#define B_STEP_PIN 3
#define B_DIR_PIN 6

#define C_STEP_PIN 4
#define C_DIR_PIN 7

MyMotors myMotors;

MyMotors::MyMotors()
    : stepperA(AccelStepper::DRIVER, A_STEP_PIN, A_DIR_PIN),
      stepperB(AccelStepper::DRIVER, B_STEP_PIN, B_DIR_PIN),
      stepperC(AccelStepper::DRIVER, C_STEP_PIN, C_DIR_PIN) {}

void MyMotors::setup() {
  stepperA.setMinPulseWidth(20);
  stepperB.setMinPulseWidth(20);
  stepperC.setMinPulseWidth(20);

  stepperA.setMaxSpeed(maxSpeed());
  stepperB.setMaxSpeed(maxSpeed());
  stepperC.setMaxSpeed(maxSpeed());

  stepperC.setPinsInverted(true, false, false);
  

  steppers.addStepper(stepperA);
  steppers.addStepper(stepperB);
  steppers.addStepper(stepperC);

  Serial.println("\n=== 3-Axis Coordinated Control ===");
  Serial.print("Jog amount: +/-");
  Serial.print(JOG_DEGREES);
  Serial.println(" deg");
  Serial.print("Output Speed: ");
  Serial.print(MAX_RPM_OUTPUT);
  Serial.print(" RPM (");
  Serial.print(maxSpeed(), 0);
  Serial.println(" steps/s)");
  Serial.println("Type 'A' to move forward, 'D' to move backward");
  Serial.println("==================================\n");
}

void MyMotors::moveA(float angleA) {
  const long stepsA = lround(angleA * stepsPerDegree());
  stepperA.moveTo(stepsA);
}

void MyMotors::moveB(float angleB) {
  const long stepsB = lround(angleB * stepsPerDegree());
  stepperB.moveTo(stepsB);
}

void MyMotors::moveC(float angleC) {
  const long stepsC = lround(angleC * stepsPerDegree());
  stepperC.moveTo(stepsC);
}

void MyMotors::moveAll(float angleA, float angleB, float angleC) {
  const long stepsA = lround(angleA * stepsPerDegree());
  const long stepsB = lround(angleB * stepsPerDegree());
  const long stepsC = lround(angleC * stepsPerDegree());

  long targets[3] = {stepsA, stepsB, stepsC};
  steppers.moveTo(targets);
}

bool MyMotors::run() {
  return steppers.run();
}

void MyMotors::stopAll() {
  stepperA.stop();
  stepperB.stop();
  stepperC.stop();
}

float MyMotors::jogDegrees() const {
  return JOG_DEGREES;
}