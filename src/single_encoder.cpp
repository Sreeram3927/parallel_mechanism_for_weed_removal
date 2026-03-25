#include <AS5600.h>
#include <Wire.h>

float getShaftAngleFromPWM();
// ─── Moving Average Filter ──────────────────────────────

class AngleFilter {
  private:
    static const int BUFFER_SIZE = 15;  // Total history to keep
    static const int TRIM_COUNT = 3;    // Number of highest AND lowest outliers to drop (e.g., drop top 3 and bottom 3)
    
    float buffer[BUFFER_SIZE];
    int index = 0;
    bool filled = false;
  
  public:
    AngleFilter() {
      for (int i = 0; i < BUFFER_SIZE; i++) {
        buffer[i] = 0.0f;
      }
    }
  
    float update(float rawAngle) {
      // 1. Store the new value in the chronological circular buffer
      buffer[index] = rawAngle;
      index = (index + 1) % BUFFER_SIZE;
      if (index == 0) filled = true;
  
      // Determine how many valid readings we actually have (important for startup)
      int count = filled ? BUFFER_SIZE : (index == 0 ? 1 : index);
  
      // 2. Copy data to a temporary array so we can sort it without ruining the timeline
      float temp[BUFFER_SIZE];
      for (int i = 0; i < count; i++) {
        temp[i] = buffer[i];
      }
  
      // 3. Sort the temporary array (Insertion sort is extremely fast for small arrays like 15)
      for (int i = 1; i < count; i++) {
        float key = temp[i];
        int j = i - 1;
        while (j >= 0 && temp[j] > key) {
          temp[j + 1] = temp[j];
          j = j - 1;
        }
        temp[j + 1] = key;
      }
  
      // 4. If buffer isn't full enough to trim yet, just do a normal average
      if (count <= TRIM_COUNT * 2) {
        float sum = 0.0f;
        for (int i = 0; i < count; i++) sum += temp[i];
        return sum / count;
      }
  
      // 5. Trimmed Mean: Ignore the lowest extremes and highest extremes
      float sum = 0.0f;
      int validCount = 0;
      
      for (int i = TRIM_COUNT; i < count - TRIM_COUNT; i++) {
        sum += temp[i];
        validCount++;
      }
      
      return sum / validCount;
    }
  };
// Create filter instance
AngleFilter angleFilter;

// Filtered version of your existing function
float getShaftAngleFromPWM_Filtered() {
  float rawAngle = getShaftAngleFromPWM();
  if (rawAngle >= 0) {
    return angleFilter.update(rawAngle);
  }
  return -1.0;  // Return error state without filtering
}

// ─── Pin Definitions ─────────────────────────────────────
#define PWM_PIN     19
#define GPO_PIN     18

// ─── Objects ─────────────────────────────────────────────
AS5600 encoder;

#define TARE 168.0f  // Optional: adjust this based on your magnet's position to get 0° at your desired reference point

void setupSingleEncoder() {

  Serial.println("AS5600 PWM Test - Temporary Mode (no burn)");

  // Wire.begin(21, 22);
  // encoder.begin();           // 4 = fast mode, but default is fine too

  // if (!encoder.isConnected()) {
  //   Serial.println("ERROR: AS5600 not detected on I2C (0x36)!");
  //   while (1);
  // }

  // Serial.print("Chip status: ");
  // Serial.println(encoder.readStatus(), BIN);   // check magnet (bit 3-5)

  // // Optional: choose low frequency for easier/more accurate pulseIn reading
  // encoder.setPWMFrequency(AS5600_PWM_115);    // 115 Hz (slowest, best for testing)
  // // Other options: AS5600_PWM_115, AS5600_PWM_230, _460, _920 (faster but pulseIn less precise)

  // // Switch to PWM mode (OUT pin now outputs PWM instead of analog)
  // bool success = encoder.setOutputMode(AS5600_OUTMODE_PWM);
  // if (success) {
  //   Serial.println("PWM mode activated successfully!");
  // } else {
  //   Serial.println("Failed to set PWM mode - check wiring/magnet");
  // }

  // delay(200);  // small settle time

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

float adjustTare(float angle) {
  float adjusted = angle - TARE;
  if (adjusted < 0) adjusted += 360.0f;
  return adjusted;
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

  return adjustTare(angle);
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
    return adjustTare((float) raw * (360.0f / 4096.0f));
  }
  return -1.0;
}
