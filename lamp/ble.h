#ifndef __BLE_H__
#define __BLE_H__

namespace ble_space {
    void (*connectedCallback)(void)=nullptr;
    void (*disConnectedCallback)(void)=nullptr;
};
template <uint8_t STAT_PIN, uint8_t PWRC_PIN>
class BLE {
   public:
    static void init() {
        Serial.begin(115200);
        Serial.setTimeout(100);
        pinMode(STAT_PIN, INPUT);
        pinMode(PWRC_PIN, OUTPUT);
        digitalWrite(PWRC_PIN, HIGH);
    }
    static void onConnected(void (*userFunc)(void)) {
        static_assert(digitalPinToInterrupt(STAT_PIN) != NOT_AN_INTERRUPT,
                      "STAT_PIN必须为可中断的引脚");
        ble_space::connectedCallback = userFunc;
        attachInterrupt(digitalPinToInterrupt(STAT_PIN), interruptCallback,
                        FALLING);
    }
    static void onDisConnected(void (*userFunc)(void)) {
        static_assert(digitalPinToInterrupt(STAT_PIN) != NOT_AN_INTERRUPT,
                      "STAT_PIN必须为可中断的引脚");
        ble_space::disConnectedCallback = userFunc;
        attachInterrupt(digitalPinToInterrupt(STAT_PIN), interruptCallback,
                        FALLING);
    }
    static void interruptCallback() {
        if (digitalRead(STAT_PIN)) {
            if(ble_space::connectedCallback!=nullptr) {
                ble_space::connectedCallback();
                if(ble_space::disConnectedCallback!=nullptr) {
                    attachInterrupt(digitalPinToInterrupt(STAT_PIN), interruptCallback,
                        RISING);
                }
            }
        } else {
            if(ble_space::disConnectedCallback!=nullptr) {
                ble_space::disConnectedCallback();
                if(ble_space::connectedCallback!=nullptr) {
                    attachInterrupt(digitalPinToInterrupt(STAT_PIN), interruptCallback,
                        FALLING);
                }
            }
        }
    }
    static void writeCmd(String cmd) {
        digitalWrite(PWRC_PIN, LOW);
        Serial.print("AT+"+cmd+"\r\n");
        delay(100);
        while(Serial.available()) {
            Serial.read();
        }
        digitalWrite(PWRC_PIN, HIGH);
    }
};
#endif  // __BLE_H__