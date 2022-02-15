#ifndef __LAMP_H__
#define __LAMP_H__
#include <EEPROM.h>
#include <FastLED.h>
template <uint8_t ORGIN_PIN, uint8_t PIN_NAME, uint8_t LED_NUM, uint8_t BEGIN_ADDR>
class Lamp {
   private:
    static constexpr uint8_t brightnessAddr = BEGIN_ADDR;
    static constexpr uint8_t stateAddr = brightnessAddr + 1;
    static constexpr uint8_t colorAddr = stateAddr + 1;
    CRGB leds[LED_NUM];
    uint8_t brightness = 0x00;
    uint8_t state = 0x00;

   public:
    static constexpr uint8_t addrLen = 3 * LED_NUM + 2;
    static constexpr uint8_t endAddr = BEGIN_ADDR + addrLen;
    void readParams() {
        brightness = EEPROM.read(brightnessAddr);
        state = EEPROM.read(stateAddr);
        int addr = colorAddr;
        for (int i = 0; i != LED_NUM; ++i) {
            uint8_t r = EEPROM.read(addr++);
            uint8_t g = EEPROM.read(addr++);
            uint8_t b = EEPROM.read(addr++);
            leds[i] = CRGB(r, g, b);
        }
    }
    void init() {
        readParams();
        // led初始化
        FastLED.addLeds<WS2812, PIN_NAME, GRB>(leds, LED_NUM);
        pinMode(ORGIN_PIN, OUTPUT);
        setState(state, false);
    }
    void reset() {
        readParams();
        setState(state, false);
    }
    bool setLed(uint8_t begin, uint8_t end, CRGB value, bool refresh = true) {
        if (begin > end || end > LED_NUM) {
            return false;
        }
        for (int i = begin; i != end; ++i) {
            leds[i] = value;
        }
        if (refresh && state&(0x01<<1)) {
            FastLED.show();
        }
        return true;
    }
    void saveLed() const {
        for(int i = 0; i != LED_NUM; ++i) {
            for (int j = 0; j != 3; ++j) {
                EEPROM.write(colorAddr + 3 * i + j, leds[i][j]);
            }
        }
    }
    void setBrightness(uint8_t value, bool memery = true) {
        brightness = value;
        if(memery) {
            EEPROM.write(brightnessAddr, value);
        }
        if (state&(0x01<<1)) {
            FastLED.setBrightness(value);
            FastLED.show();
        }
    }
    uint8_t length() const { return LED_NUM; }
    CRGB* getLeds() const { return leds; }
    uint8_t getState() const { return EEPROM.read(stateAddr); }
    uint8_t getBrightness() const { return EEPROM.read(brightnessAddr); }
    bool closeAll() {
        if (state == 0x00) {
            return false;
        }
        state = 0x00;
        digitalWrite(ORGIN_PIN, LOW);
        FastLED.setBrightness(0);
        FastLED.show();
        return true;
    }
    bool openAll() {
        if (state == 0x03) {
            return false;
        }
        state = 0x03;
        digitalWrite(ORGIN_PIN, HIGH);
        FastLED.setBrightness(brightness);
        FastLED.show();
        return true;
    }
    void setState(uint8_t _state, bool memery = true) {
        state = _state;
        if (memery) {
            EEPROM.write(stateAddr, state);
        }
        if(state&(0x01<<0)) {
            digitalWrite(ORGIN_PIN, HIGH);
        } else {
            digitalWrite(ORGIN_PIN, LOW);
        }
        if(state&(0x01<<1)) {
            FastLED.setBrightness(brightness);
        } else {
            FastLED.setBrightness(0);
        }
        FastLED.show();
    }
};

#endif  // __LAMP_H__