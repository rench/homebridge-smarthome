# homebridge plugin and webapp for smarthome(mijia、broadlink)
[![npm version](https://badge.fury.io/js/homebridge-smarthome.svg)](https://badge.fury.io/js/homebridge-smarthome)

homebridge plugin and webapp for smarthome(mijia、broadlink).  
Thanks for [snOOrz](https://github.com/snOOrz)(the author of [homebridge-aqara](https://github.com/snOOrz/homebridge-aqara)),[YinHangCode](https://github.com/YinHangCode/homebridge-mi-aqara)(the author of [homebridge-mi-aqara](https://github.com/YinHangCode/homebridge-mi-aqara)), all other developer and testers.   

**Note: I have only a part of these devices, so some devices don't have tested. If you find bugs, please submit them to [issues](https://github.com/rench/homebridge-smarthome/issues).**

## Mijia Accessory for homebridge.   

![](http://7fv93h.com1.z0.glb.clouddn.com/Gateway.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/ContactSensor.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/MotionSensor.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/Button.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/TemperatureAndHumiditySensor.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/SingleSwitch.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/DuplexSwitch.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/SingleSwitchLN.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/DuplexSwitchLN.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/SingleButton86.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/DuplexButton86.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/PlugBase.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/PlugBase86.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/MagicSquare.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/SmokeDetector.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/NatgasDetector.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/ElectricCurtain.jpg)

### Supported Devices
1. Gateway(LightSensor/Lightbulb)
2. ContactSensor(ContactSensor)
3. TemperatureAndHumiditySensor(HumiditySensor/TemperatureSensor)

## Broadlink Accessory for homebridge.
![](http://7fv93h.com1.z0.glb.clouddn.com/Broadlink_MP1.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/Broadlink_MP2.jpg)

### Supported Devices
1. MP1
2. MP2


## Pre-Requirements
1. Make sure you have V2 of the gateway. V1 has limited space so can't support this feature.  
2. Update gateway firmware to 1.4.1_141.0141 or later. You can contact [@babymoney666](https://github.com/babymoney666) if your firmware is not up to date.  

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).  
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).  
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.  
3. Download homebridge-smarthome to your local folder or `npm i homebridge-smarthome`.  

## Configuration
1. Open Aqara gateway's settings, enable [local network protocol](https://github.com/louisZL/lumi-gateway-local-api).  
Please follow the steps in this thread: http://bbs.xiaomi.cn/t-13198850. It's in Chinese so you might need a translator to read it.  
2. To control the devices, put gateway's MAC address (lower case without colon) and password to ~/.homebridge/config.json.  
```
{
  "bridge": {
    "name": "SmartHome",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "platforms": [
    {
      "platform": "smarthome",
      "web": {
        "port": 8888
      },
      "mijia": {
        "sids": [
          "34660088faed"
        ],
        "passwords": [
          "75ED5A23114A44D4"
        ],
        "devices": [
          {
            "sid": "VacuumCleanerSID01",
            "name": "Vacuum Cleaner",
            "ip": "IP_ADDRESS_OF_THE_ROBOT",
            "token": "TOKEN_DISCOVERED_FROM_STEP_7",
            "type": "wifi"
          }
        ]
      },
      "broadlink": {
        "devices": [
          {
            "name": "MP2",
            "type": "MP",
            "mac": "34:EA:34:D9:FE:B3"
          }
        ]
      }
    }
  ]
}
```
    
## Run it
homebridge -D  

## Version Logs 
### 1.0.1
1. mijia gateway sensor accessory.
2. mijia door and window sensor accessory.
3. mijia temperature and humidity sensor accessory.