#include <Arduino.h>

// --- Motor Class Definition ---
class Motor {
  private:
    uint8_t _pwmPin;
    uint8_t _dirPin;
    bool _invertDir;

  public:
    // Constructor to initialize the motor object
    Motor(uint8_t pwmPin, uint8_t dirPin, bool invertDir = false) {
      _pwmPin = pwmPin;
      _dirPin = dirPin;
      _invertDir = invertDir;
    }

    // Initialize the pins (call this in setup())
    void begin() {
      pinMode(_pwmPin, OUTPUT);
      pinMode(_dirPin, OUTPUT);
      stop();
    }

    // Drive the motor. Speed range: -255 to 255. 
    // Positive is forward, negative is backward.
    void drive(int speed) {
      if (speed == 0) {
        stop();
        return;
      }

      // Determine forward or backward based on speed sign
      bool isForward = (speed > 0);
      
      // Apply the hardware inversion flag
      if (_invertDir) {
        isForward = !isForward;
      }

      // Set direction pin (Change HIGH/LOW logic if your driver expects the opposite)
      digitalWrite(_dirPin, isForward ? HIGH : LOW);
      
      // Output the PWM signal using absolute value of speed
      analogWrite(_pwmPin, abs(speed));
    }

    // Stop the motor
    void stop() {
      analogWrite(_pwmPin, 0);
    }
};