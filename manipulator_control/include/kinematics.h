#ifndef DELTA_KINEMATICS_H
#define DELTA_KINEMATICS_H

#include <Arduino.h>

class DeltaKinematics {
  private:
    static constexpr float SQRT3 = 1.73205081f; 

    static float getTheta_1(float x, float y, float z) {
      float u1 = 2 * ACTIVE_LINK * (y + a);
      float v1 = 2 * ACTIVE_LINK * z;  
      float w1 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(a, 2) + pow(ACTIVE_LINK, 2)+ (2 * y * a) - pow(PASSIVE_LINK, 2);
      float t1 = (-v1 - sqrt(pow(u1, 2) + pow(v1, 2) - pow(w1, 2))) / (w1 - u1);
      return (2 * degrees(atan(t1)));
    }

    static float getTheta_2(float x, float y, float z) {
      float u2 = -ACTIVE_LINK * (sqrt(3) * (x + b) + y + c);
      float v2 = 2 * ACTIVE_LINK * z;
      float w2 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(b, 2) + pow(c, 2) + pow(ACTIVE_LINK, 2) + (2 * x * b) + (2 * y * c) - pow(PASSIVE_LINK, 2);
      float t2 = (-v2 - sqrt(pow(u2, 2) + pow(v2, 2) - pow(w2, 2))) / (w2 - u2);
      return (2 * degrees(atan(t2)));
    }

    static float getTheta_3(float x, float y, float z) {
      float u3 = ACTIVE_LINK * (sqrt(3) * (x - b) - y - c);
      float v3 = 2 * ACTIVE_LINK * z;
      float w3 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(b, 2) + pow(c, 2) + pow(ACTIVE_LINK, 2) - (2 * x * b) + (2 * y * c) - pow(PASSIVE_LINK, 2);
      float t3 = (-v3 - sqrt(pow(u3, 2) + pow(v3, 2) - pow(w3, 2))) / (w3 - u3);
      return (2 * degrees(atan(t3)));
    }

  public:
    static constexpr float ACTIVE_LINK = 150.0f;
    static constexpr float PASSIVE_LINK = 315.0f;
    static constexpr float BASE_RADIUS = 100.78f;
    static constexpr float END_EFFECTOR_RADIUS = 65.0f;
    static constexpr float OFFSET = 0.0f;

    static constexpr float a = BASE_RADIUS - END_EFFECTOR_RADIUS;
    static constexpr float b = (112.58f / 2) - ((SQRT3 / 2) * BASE_RADIUS);
    static constexpr float c = 32.5f - ((0.5f) * BASE_RADIUS);

    // --- NEW DAMPER CONSTRAINTS ---
    // Replace these values with the actual physical lengths of your damper in millimeters
    static constexpr float SAFE_BOUNDARY = 7.0f;
    static constexpr float DAMPER_MIN_LENGTH = 345.0f - SAFE_BOUNDARY; 
    static constexpr float DAMPER_MAX_LENGTH = 445.0f - SAFE_BOUNDARY; 

    // Changed to return bool. Returns true if within workspace, false if blocked by damper.
    static bool inverseKinematics(float x, float y, float z, float &angleA, float &angleB, float &angleC) {
      
      // Calculate squared distance to avoid a costly sqrt() calculation
      float distanceSq = (x * x) + (y * y) + (z * z);
      float minLengthSq = DAMPER_MIN_LENGTH * DAMPER_MIN_LENGTH;
      float maxLengthSq = DAMPER_MAX_LENGTH * DAMPER_MAX_LENGTH;

      // 1. Check if the point violates the damper limits
      if (distanceSq < minLengthSq || distanceSq > maxLengthSq) {
        ESP_LOGW("Kinematics", "Point (%.2f, %.2f, %.2f) is outside damper limits!", x, y, z);
        return false; // The point is physically unreachable!
      }

      // 2. If it is reachable, calculate the angles
      angleA = getTheta_1(x, y, z);
      angleB = getTheta_2(x, y, z);
      angleC = getTheta_3(x, y, z);

      if (isnan(angleA) || isnan(angleB) || isnan(angleC)) {
        ESP_LOGW("Kinematics", "Inverse kinematics returned NaN for point (%.2f, %.2f, %.2f)!", x, y, z);
        return false; // Invalid angles, treat as unreachable
      }

      return true;
    }
};

#endif