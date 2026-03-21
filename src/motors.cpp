#include <AccelStepper.h>
#include <MultiStepper.h>

// ─── Pin Definitions ─────────────────────────────────────
#define A_STEP_PIN    2
#define A_DIR_PIN     5

#define B_STEP_PIN    3
#define B_DIR_PIN     6

#define C_STEP_PIN    4
#define C_DIR_PIN     7


// ─── Motor & Gearbox Math ────────────────────────────────s
const int   MOTOR_STEPS_PER_REV = 200;
const int   MICROSTEPS          = 8;
const float GEAR_RATIO          = 10.0;     
const float STEPS_PER_OUTPUT_REV = MOTOR_STEPS_PER_REV * MICROSTEPS * GEAR_RATIO;
const float STEPS_PER_DEGREE     = STEPS_PER_OUTPUT_REV / 360.0;

// Jogging parameters
const float JOG_DEGREES   = 40.0;
const long  JOG_STEPS     = round(JOG_DEGREES * STEPS_PER_DEGREE);

// Speed — increased a bit for responsiveness
const float MAX_RPM_OUTPUT = 25.0;                  // ← tune this (was 7)
const float MAX_SPEED      = (MAX_RPM_OUTPUT * STEPS_PER_OUTPUT_REV) / 60.0;

// ─── Objects ─────────────────────────────────────────────
AccelStepper stepperA(AccelStepper::DRIVER, A_STEP_PIN, A_DIR_PIN);
AccelStepper stepperB(AccelStepper::DRIVER, B_STEP_PIN, B_DIR_PIN);
AccelStepper stepperC(AccelStepper::DRIVER, C_STEP_PIN, C_DIR_PIN);

MultiStepper steppers;

void setupMotors() {

  // Critical for some drivers like TB6600
  stepperA.setMinPulseWidth(20);
  stepperB.setMinPulseWidth(20);
  stepperC.setMinPulseWidth(20);

  // Apply maximum speeds
  stepperA.setMaxSpeed(MAX_SPEED);
  stepperB.setMaxSpeed(MAX_SPEED);
  stepperC.setMaxSpeed(MAX_SPEED);

  // Optional: invert direction if a specific motor is spinning the wrong way
  stepperC.setPinsInverted(true, false, false); 

  steppers.addStepper(stepperA);
  steppers.addStepper(stepperB);
  steppers.addStepper(stepperC);

  Serial.println("\n=== 3-Axis Coordinated Control ===");
  Serial.print("Jog amount: ±"); Serial.print(JOG_DEGREES); Serial.println(" deg");
  Serial.print("Output Speed: "); Serial.print(MAX_RPM_OUTPUT); Serial.print(" RPM (");
  Serial.print(MAX_SPEED, 0); Serial.println(" steps/s)");
  Serial.println("Type 'A' to move forward, 'D' to move backward");
  Serial.println("==================================\n");
}

void moveA(float angleA) {
  long stepsA = round(angleA * STEPS_PER_DEGREE);
  stepperA.moveTo(stepsA);
}

void moveB(float angleB) {
  long stepsB = round(angleB * STEPS_PER_DEGREE);
  stepperB.moveTo(stepsB);
}

void moveC(float angleC) {
  long stepsC = round(angleC * STEPS_PER_DEGREE);
  stepperC.moveTo(stepsC);
}

void moveAll(float angleA, float angleB, float angleC) {
  long stepsA = round(angleA * STEPS_PER_DEGREE);
  long stepsB = round(angleB * STEPS_PER_DEGREE);
  long stepsC = round(angleC * STEPS_PER_DEGREE);

  long targets[3] = { stepsA, stepsB, stepsC };
  steppers.moveTo(targets);
}

bool stillRunning() {
  // Keep motors stepping. Returns true as long as ANY motor is moving.
  return steppers.run();
}

void stopAll() {
  stepperA.stop();
  stepperB.stop();
  stepperC.stop();
}