#pragma once

#include <Arduino.h>
#include <AccelStepper.h>
#include <MultiStepper.h>

class MyMotors {
public:
  MyMotors();

  void setup();
  void moveA(float angleA);
  void moveB(float angleB);
  void moveC(float angleC);
  void moveAll(float angleA, float angleB, float angleC);
  bool run();
  bool iRun(); // Use iRun() when not using MultiStepper, to run each stepper independently (non-blocking)
  void stopAll();
  float jogDegrees() const;

  void jogA(String dir) {
    float delta = (dir == "+") ? jogDegrees() : -jogDegrees();
    moveA(delta);
  }
  void jogB(String dir) {
    float delta = (dir == "+") ? jogDegrees() : -jogDegrees();
    moveB(delta);
  }
  void jogC(String dir) {
    float delta = (dir == "+") ? jogDegrees() : -jogDegrees();
    moveC(delta);
  }

private:
  static const int MOTOR_STEPS_PER_REV = 200;
  static const int MICROSTEPS = 8;
  static constexpr float GEAR_RATIO = 10.0f;
  static constexpr float MAX_RPM_OUTPUT = 25.0f;
  static constexpr float MAX_ACCELERATION = 1800.0f;
  static constexpr float JOG_DEGREES = 40.0f;

  static constexpr float stepsPerOutputRev() {
    return MOTOR_STEPS_PER_REV * MICROSTEPS * GEAR_RATIO;
  }

  static constexpr float stepsPerDegree() {
    return stepsPerOutputRev() / 360.0f;
  }

  static constexpr float maxSpeed() {
    return (MAX_RPM_OUTPUT * stepsPerOutputRev()) / 60.0f;
  }

  AccelStepper stepperA;
  AccelStepper stepperB;
  AccelStepper stepperC;
  MultiStepper steppers;
};

extern MyMotors myMotors;
