#pragma once

#include <Arduino.h>
#include <FastAccelStepper.h>
#include <Wire.h>
#include <AS5600.h>
#include <angle_filter.h>

// Global helper to switch the I2C multiplexer channel
// (Keep this outside the class so it's easily accessible)
inline void tcaselect(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(0x70); // TCA9548A address
  Wire.write(1 << channel);
  Wire.endTransmission();
}

class MotorUnit {
  public:
    MotorUnit(char id, int stepPin, int dirPin, short tcaChannel, bool invertDir, float offset)
      : _id(id), _stepPin(stepPin), _dirPin(dirPin), _tcaChannel(tcaChannel), _invertDir(invertDir), OFFSET(offset) {};

    void init(FastAccelStepperEngine& engine) {
      _stepper = engine.stepperConnectToPin(_stepPin);
      if (_stepper) {
        _stepper->setDirectionPin(_dirPin, _invertDir);
        _stepper->setSpeedInHz(maxSpeedHz());
        _stepper->setAcceleration(MAX_ACCELERATION);
        Serial.println("Initialized Motor " + String(_id) + " on step pin " + String(_stepPin));
      } else {
        Serial.println("Failed to initialize Motor " + String(_id) + " on step pin " + String(_stepPin));
      }

      // Initialize the specific encoder by switching the MUX first
      tcaselect(_tcaChannel);
      
      // If your AS5600 library requires an init/begin call, do it here:
      // _encoder.begin(); 
      
      Serial.println("Initialized encoder " + String(_id) + " on TCA channel " + String(_tcaChannel) + "\n");
    };
    
    // Commands in Degrees
    void moveAbsolute(float angle) {
      if (_stepper) {
        float targetAngle = fmod(angle + 360.0f, 360.0f); // Normalize to [0, 360)
        float currentAngle = updateAngle();
        float deltaAngle = targetAngle - currentAngle;

        // Choose the shortest direction
        if (deltaAngle > 180.0f) {
          deltaAngle -= 360.0f;
        } else if (deltaAngle < -180.0f) {
          deltaAngle += 360.0f;
        }

        _stepper->move(lround(deltaAngle * stepsPerDegree())); 
      }
    };

    void moveRelative(float deltaAngle) {
      if (_stepper) {
        _stepper->move(lround(deltaAngle * stepsPerDegree()));
      }
    };

    float updateAngle() {
      // 1. Switch the multiplexer to this motor's channel
      tcaselect(_tcaChannel);

      // 2. Read the raw angle from the AS5600 library
      // (Assuming your AS5600.h library uses getRawAngle() or similar)
      // Note: If your library uses a different method name, update it here.
      uint16_t rawAngle = _encoder.rawAngle(); 
      
      // 3. Convert 12-bit raw value (0-4095) to degrees (0-360)
      float angle = (rawAngle / 4096.0f) * 360.0f;

      // 4. Apply offset and normalize
      angle = fmod(angle - OFFSET + 360.0f, 360.0f); 

      return _filter.update(angle);
      // return angle;
    };

    void printAngle() {
      float angle = updateAngle();
      Serial.print("Motor ");
      Serial.print(_id);
      Serial.print(" (Ch ");
      Serial.print(_tcaChannel);
      Serial.print(") Angle: ");
      Serial.println(angle, 2);
    };

    bool isMoving() {
      return _stepper ? _stepper->isRunning() : false;
    };

    void stop () {if (_stepper) _stepper->stopMove();};

  private:
    char _id;
    int _stepPin, _dirPin;
    short _tcaChannel; // Stores the multiplexer channel for this specific motor
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
};