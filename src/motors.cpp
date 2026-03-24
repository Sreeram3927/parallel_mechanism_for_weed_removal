#include <motors.h>

#define A_STEP_PIN 13
#define A_DIR_PIN  14

#define B_STEP_PIN 25
#define B_DIR_PIN  26

#define C_STEP_PIN 27
#define C_DIR_PIN  32

MyMotors myMotors;

MyMotors::MyMotors() {
  stepperA = NULL;
  stepperB = NULL;
  stepperC = NULL;
}

void MyMotors::setup() {
  engine.init();

  // Connect Stepper A
  stepperA = engine.stepperConnectToPin(A_STEP_PIN);
  if (stepperA) {
    stepperA->setDirectionPin(A_DIR_PIN);
    stepperA->setSpeedInHz(maxSpeedHz());
    stepperA->setAcceleration(MAX_ACCELERATION);
  }

  // Connect Stepper B
  stepperB = engine.stepperConnectToPin(B_STEP_PIN);
  if (stepperB) {
    stepperB->setDirectionPin(B_DIR_PIN);
    stepperB->setSpeedInHz(maxSpeedHz());
    stepperB->setAcceleration(MAX_ACCELERATION);
  }

  // Connect Stepper C
  stepperC = engine.stepperConnectToPin(C_STEP_PIN);
  if (stepperC) {
    // The 'true' at the end inverts the direction pin, replacing your old setPinsInverted
    stepperC->setDirectionPin(C_DIR_PIN, true); 
    stepperC->setSpeedInHz(maxSpeedHz());
    stepperC->setAcceleration(MAX_ACCELERATION);
  }

  Serial.println("\n=== FastAccelStepper 3-Axis Control ===");
  Serial.println("Hardware Timers Engaged - Zero CPU Overhead");
  Serial.print("Jog amount: +/-");
  Serial.print(JOG_DEGREES);
  Serial.println(" deg");
  Serial.print("Output Speed: ");
  Serial.print(MAX_RPM_OUTPUT);
  Serial.print(" RPM (");
  Serial.print(maxSpeedHz());
  Serial.println(" steps/s)");
  Serial.println("=======================================\n");
}

void MyMotors::moveA(float angleA) {
  if (stepperA) stepperA->moveTo(lround(angleA * stepsPerDegree()));
}

void MyMotors::moveB(float angleB) {
  if (stepperB) stepperB->moveTo(lround(angleB * stepsPerDegree()));
}

void MyMotors::moveC(float angleC) {
  if (stepperC) stepperC->moveTo(lround(angleC * stepsPerDegree()));
}

void MyMotors::moveAll(float angleA, float angleB, float angleC) {
  // Because these commands are sent directly to the hardware peripherals,
  // calling them sequentially will start the motors virtually simultaneously.
  moveA(angleA);
  moveB(angleB);
  moveC(angleC);
}

bool MyMotors::isRunning() {
  bool running = false;
  if (stepperA && stepperA->isRunning()) running = true;
  if (stepperB && stepperB->isRunning()) running = true;
  if (stepperC && stepperC->isRunning()) running = true;
  return running;
}

void MyMotors::stopAll() {
  // stopMove() decelerates the motor gracefully. 
  // If you want an emergency stop, use forceStop() instead.
  if (stepperA) stepperA->stopMove();
  if (stepperB) stepperB->stopMove();
  if (stepperC) stepperC->stopMove();
}