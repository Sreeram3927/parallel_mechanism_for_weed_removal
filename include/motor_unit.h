#pragma once

#include <Arduino.h>
#include <FastAccelStepper.h>
#include <AS5600.h>
#include <angle_filter.h>

class MotorUnit {
  public:
    // Pass the specific hardware config for this arm
    MotorUnit(char id, int stepPin, int dirPin, int pwmPin, bool invertDir, float offset)
      : _id(id), _stepPin(stepPin), _dirPin(dirPin), _pwmPin(pwmPin), _invertDir(invertDir), OFFSET(offset) {};

    void init(FastAccelStepperEngine& engine) {
      _stepper = engine.stepperConnectToPin(_stepPin);
      if (_stepper) {
        
        _stepper->setDirectionPin(_dirPin, _invertDir);
        _stepper->setSpeedInHz(maxSpeedHz());
        _stepper->setAcceleration(MAX_ACCELERATION);

        Serial.println("Initialize Motor " + _id + " on step pin " + String(_stepPin));
      } else {
        Serial.println("Failed to initialize Motor " + _id + " on step pin " + String(_stepPin));
      }

      pinMode(_pwmPin, INPUT);
      Serial.println("Initialized encoder " + _id + " on PWM pin " + String(_pwmPin) + "\n");
    };
    
    // Commands in Degrees
    void moveAbsolute(float angle) {
      if (_stepper) {
        float targetAngle = fmod(angle + 360.0f, 360.0f); // Normalize to [0, 360)
        float currentAngle = getCurrentAngle();
        float deltaAngle = targetAngle - currentAngle;

        // Choose the shortest direction
        if (deltaAngle > 180.0f) {
          deltaAngle -= 360.0f;
        } else if (deltaAngle < -180.0f) {
          deltaAngle += 360.0f;
        }

        _stepper->move(lround(deltaAngle * stepsPerDegree())); // move() is relative
      }
    };

    void moveRelative(float deltaAngle) {
      if (_stepper) {
        _stepper->move(lround(deltaAngle * stepsPerDegree()));
      }
    };

    float getCurrentAngle() {
      float angle;

      unsigned long highTime = pulseIn(_pwmPin, HIGH, 30000UL);   // timeout 30 ms
      if (highTime == 0) {
        Serial.println("No PWM signal - check OUT connection / magnet / mode");
        delay(500);
        return -1.0;
      }

      unsigned long lowTime  = pulseIn(_pwmPin, LOW, 30000UL);
      unsigned long period   = highTime + lowTime;

      if (period < 5000 || period > 15000) {   // rough check for ~115 Hz (~8700 us)
        Serial.println("Strange period - possible noise or wrong freq");
      } else {
        float duty = (float)highTime / period * 100.0;              // %
        angle = (duty - 2.9) / (97.1 - 2.9) * 360.0;          // standard mapping

        angle = constrain(angle, 0.0, 360.0);
      }

      angle = fmod(angle - OFFSET + 360.0f, 360.0f); // Apply offset and normalize

      return _filter.update(angle);
    };

    void printAngle() {
      float angle = getCurrentAngle();
      if (angle >= 0) {
        Serial.print("Motor ");
        Serial.print(_id);
        Serial.print(" Angle: ");
        Serial.println(angle, 2);
      }
    };

    bool isMoving() {
      return _stepper ? _stepper->isRunning() : false;
    };

    // Emergency stop
    void stop () {if (_stepper) _stepper->stopMove();};

  private:
    String _id;
    int _stepPin, _dirPin, _pwmPin;
    bool _invertDir;

    static const int MOTOR_STEPS_PER_REV = 200;
    static const int MICROSTEPS = 8;
    static constexpr float GEAR_RATIO = 10.0f;
    static constexpr float MAX_RPM_OUTPUT = 25.0f;
    static constexpr float MAX_ACCELERATION = 1800.0f;

    static constexpr float stepsPerOutputRev() {
      return MOTOR_STEPS_PER_REV * MICROSTEPS * GEAR_RATIO;
    }
  
    static constexpr float stepsPerDegree() {
      return stepsPerOutputRev() / 360.0f;
    }
  
    static constexpr uint32_t maxSpeedHz() {
      return (uint32_t)((MAX_RPM_OUTPUT * stepsPerOutputRev()) / 60.0f);
    }

    float OFFSET = 0;
    
    FastAccelStepper* _stepper = nullptr;
    AS5600 _encoder;
    AngleFilter _filter;

    float degreesToSteps(float deg);
};