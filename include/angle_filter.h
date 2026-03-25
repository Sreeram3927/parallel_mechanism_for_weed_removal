#pragma once

#include <Arduino.h>

class AngleFilter {
  private:
    static const int FILTER_SIZE = 10; // Adjust for more smoothness (higher latency) or less smoothness (lower latency)
    float buffer[FILTER_SIZE];
    int index;
    float lastRawAngle;
    float continuousAngle;
  
  public:
    AngleFilter() {
      
    };
    
    void reset(float initialAngle) {
      lastRawAngle = initialAngle;
      continuousAngle = initialAngle;
      for (int i = 0; i < FILTER_SIZE; i++) buffer[i] = initialAngle;
    };

    float update(float newAngle) {
      // 1. Unwrap the angle to prevent 359/1 degree averaging errors
      float diff = newAngle - lastRawAngle;
      
      // If the jump is larger than half a rotation, we crossed the 0/360 boundary
      if (diff > 180.0f) diff -= 360.0f;
      else if (diff < -180.0f) diff += 360.0f;
    
      continuousAngle += diff;
      lastRawAngle = newAngle;
    
      // 2. Insert into circular buffer
      buffer[index] = continuousAngle;
      index = (index + 1) % FILTER_SIZE;
    
      return getAverage();
    };

    float getAverage() const {
      float sum = 0;
      for (int i = 0; i < FILTER_SIZE; i++) {
        sum += buffer[i];
      }
      float avg = sum / FILTER_SIZE;
      
      // Wrap the final averaged result back to a clean 0-360 range
      avg = fmod(avg, 360.0f);
      if (avg < 0) avg += 360.0f;
      
      return avg;
    };

};