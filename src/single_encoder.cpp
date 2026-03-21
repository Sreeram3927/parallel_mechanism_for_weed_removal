#include <AS5600.h>
#include <Wire.h>

// ─── Pin Definitions ─────────────────────────────────────
#define PWM_PIN     9
#define GPO_PIN     8

// ─── Objects ─────────────────────────────────────────────
AS5600 encoder;

void setupSingleEncoder() {

  Serial.println("AS5600 PWM Test - Temporary Mode (no burn)");

  Wire.begin();
  encoder.begin(4);           // 4 = fast mode, but default is fine too

  if (!encoder.isConnected()) {
    Serial.println("ERROR: AS5600 not detected on I2C (0x36)!");
    while (1);
  }

  Serial.print("Chip status: ");
  Serial.println(encoder.readStatus(), BIN);   // check magnet (bit 3-5)

  // Optional: choose low frequency for easier/more accurate pulseIn reading
  encoder.setPWMFrequency(AS5600_PWM_115);    // 115 Hz (slowest, best for testing)
  // Other options: AS5600_PWM_115, AS5600_PWM_230, _460, _920 (faster but pulseIn less precise)

  // Switch to PWM mode (OUT pin now outputs PWM instead of analog)
  bool success = encoder.setOutputMode(AS5600_OUTMODE_PWM);
  if (success) {
    Serial.println("PWM mode activated successfully!");
  } else {
    Serial.println("Failed to set PWM mode - check wiring/magnet");
  }

  delay(200);  // small settle time

  Serial.println("Duty cycle ~3% at 0°, ~97% at 360°");
  pinMode(PWM_PIN, INPUT);

  pinMode(GPO_PIN, OUTPUT);
  digitalWrite(GPO_PIN, HIGH);

  // // Add these lines after encoder.begin() and mode setting
  // uint8_t status = encoder.readStatus();  // or encoder.getStatus()
  // Serial.print("STATUS register: 0b");
  // Serial.println(status, BIN);           // Important! Share this value

  // if (encoder.detectMagnet()) {
  //   Serial.println("Magnet DETECTED ✓");
  //   Serial.print("AGC value (should be ~50-200, ideally ~128 for 3.3V / ~255 for 5V): ");
  //   Serial.println(encoder.readAGC());
  //   Serial.print("Magnitude (higher = stronger field, aim 100-3000): ");
  //   Serial.println(encoder.readMagnitude());
  // } else {
  //   Serial.println("NO MAGNET detected! PWM/analog won't work.");
  //   Serial.println("Check: magnet polarity (diametric), distance (1-3mm ideal), alignment (centered over chip).");
  // }

  // if (encoder.magnetTooStrong()) Serial.println("Magnet TOO STRONG → move farther or weaker magnet");
  // if (encoder.magnetTooWeak())   Serial.println("Magnet TOO WEAK → move closer or stronger magnet");
  
}

float getShaftAngleFromPWM() {
  float angle;

  unsigned long highTime = pulseIn(PWM_PIN, HIGH, 30000UL);   // timeout 30 ms
  if (highTime == 0) {
    Serial.println("No PWM signal - check OUT connection / magnet / mode");
    delay(500);
    return -1.0;
  }

  unsigned long lowTime  = pulseIn(PWM_PIN, LOW, 30000UL);
  unsigned long period   = highTime + lowTime;

  if (period < 5000 || period > 15000) {   // rough check for ~115 Hz (~8700 us)
    Serial.println("Strange period - possible noise or wrong freq");
  } else {
    float duty = (float)highTime / period * 100.0;              // %
    angle = (duty - 2.9) / (97.1 - 2.9) * 360.0;          // standard mapping

    angle = constrain(angle, 0.0, 360.0);
  }

  return angle;
}

float getShaftAngleFromI2C() {
  Wire.beginTransmission(0x36);
  Wire.write(0x0E);           // raw angle high byte register
  Wire.endTransmission();
  Wire.requestFrom(0x36, 2);
  if (Wire.available() >= 2) {
    uint16_t high = Wire.read();
    uint16_t low  = Wire.read();
    uint16_t raw  = (high << 8) | low;
    raw &= 0x0FFF;            // 12-bit
    return (float) raw * (360.0f / 4096.0f);
  }
  return -1.0;
}