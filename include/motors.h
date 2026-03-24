#pragma once

#include <Arduino.h>
#include <FastAccelStepper.h>

class MyMotors {
public:
  MyMotors();

  void setup();
  void moveA(float angleA);
  void moveB(float angleB);
  void moveC(float angleC);
  void moveAll(float angleA, float angleB, float angleC);
  
  // run() and iRun() are GONE! 
  // You no longer need to call anything in your main loop.
  // Use this function just to check if they are currently moving.
  bool isRunning(); 
  
  void stopAll();

  void jogA(String dir) {
    float delta = (dir == "+") ? JOG_DEGREES : -JOG_DEGREES;
    if (stepperA) stepperA->move(lround(delta * stepsPerDegree())); // move() is relative
  }
  void jogB(String dir) {
    float delta = (dir == "+") ? JOG_DEGREES : -JOG_DEGREES;
    if (stepperB) stepperB->move(lround(delta * stepsPerDegree()));
  }
  void jogC(String dir) {
    float delta = (dir == "+") ? JOG_DEGREES : -JOG_DEGREES;
    if (stepperC) stepperC->move(lround(delta * stepsPerDegree()));
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

  static constexpr uint32_t maxSpeedHz() {
    return (uint32_t)((MAX_RPM_OUTPUT * stepsPerOutputRev()) / 60.0f);
  }

  // FastAccelStepper Objects
  FastAccelStepperEngine engine;
  FastAccelStepper *stepperA;
  FastAccelStepper *stepperB;
  FastAccelStepper *stepperC;
};

extern MyMotors myMotors;