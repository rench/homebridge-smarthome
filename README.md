# homebridge plugin and webapp for smarthome
[![npm package](https://nodei.co/npm/homebridge-smarthome.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/homebridge-smarthome/)

[![npm](https://img.shields.io/npm/dt/homebridge-smarthome.svg)](https://www.npmjs.com/package/homebridge-smarthome) 
[![npm](https://img.shields.io/npm/v/homebridge-smarthome.svg)](https://www.npmjs.com/package/homebridge-smarthome)
[![Dependency Status](https://img.shields.io/versioneye/d/nodejs/homebridge-smarthome.svg)](https://www.versioneye.com/nodejs/homebridge-smarthome/)


## mijia & broadlink & more...

Thanks for 
1. [snOOrz](https://github.com/snOOrz)(the author of [homebridge-aqara](https://github.com/snOOrz/homebridge-aqara))
2. [YinHangCode](https://github.com/YinHangCode/homebridge-mi-aqara)(the author of [homebridge-mi-aqara](https://github.com/YinHangCode/homebridge-mi-aqara))
3. [aholstenson](https://github.com/aholstenson/miio)(the author of [miio](https://github.com/aholstenson/miio))
4. all other developer and testers.   

**Note: I have only a part of these devices, some devices do not have been tested. If you find bugs, please submit them to [issues](https://github.com/rench/homebridge-smarthome/issues).**

## Mijia Accessory for homebridge.   

### Zigbee
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

### Wifi
![](http://7fv93h.com1.z0.glb.clouddn.com/AirPurifier.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/MiCamera.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/MiRobotVacuum.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/Yeelight.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/Yeelight2.png)
![](http://7fv93h.com1.z0.glb.clouddn.com/Yeelight3.png)

### Supported Devices
1. Gateway(LightSensor/Lightbulb[hue])
2. ContactSensor(ContactSensor)
3. TemperatureAndHumiditySensor(HumiditySensor/TemperatureSensor)
4. MotionSensor(MonitorSensor)
5. Switch(StatelessProgrammableSwitch)
6. Plug(Outlet)
7. CtrlNeutral1/CtrlNeutral2(Switch)
8. CtrlLN1/CtrlLN2(Switch)
9. 86SW1/86SW2(StatelessProgrammableSwitch)
10. 86Plug(Outlet)
11. Smoke(SmokeSensor)
12. Natgas(SmokeSensor)
13. Curtain(WindowCovering)
14. AirPurifier(AirPurifier/AirQualitySensor/TemperatureSensor/HumiditySensor/Lightbulb)
15. Vacuum(Fan)
16. PowerPlug(Outlet)
17. PowerStrip(Outlet)
18. Yeelight(Lightbulb[hue])

## Broadlink Accessory for homebridge.
![](http://7fv93h.com1.z0.glb.clouddn.com/Broadlink_MP1.jpg)
![](http://7fv93h.com1.z0.glb.clouddn.com/Broadlink_MP2.jpg)

### Supported Devices
1. MP1(Outlet)
2. MP2(Outlet)


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
3. How to get device ip and token? see [miio](https://github.com/aholstenson/miio/blob/master/docs/protocol.md).
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
      "platform": "smarthome-mijia",
      "web": {
        "port": 8888
      },
      "mijia": {
        "sids": [
          "34ce0088faed"
        ],
        "passwords": [
          "75ED5A235C4A44D4"
        ],
        "devices": [
          {
            "sid": "Air Purifier 001",
            "name": "Air Purifier",
            "type": "wifi",
            "model": "air-purifier"
          },
          {
            "sid": "Power Plug 001",
            "name": "Power Plug",
            "type": "wifi",
            "model": "power-plug"
          },
          {
            "sid": "Power Strip 001",
            "name": "Power Strip",
            "type": "wifi",
            "model": "power-strip"
          },
          {
            "sid": "Yeelight 001",
            "name": "Yeelight",
            "type": "wifi",
            "model": "light"
          },
          {
            "sid": "Vacuum Cleaner 001",
            "name": "Vacuum Cleaner",
            "ip": "192.168.2.200",
            "token": "4ac2cd21f3e9272ab21a5c1fd4053ed9",
            "type": "wifi",
            "model": "vacuum"
          }
        ]
      }
    },
    {
      "platform": "smarthome-broadlink",
      "broadlink": {
        "devices": [
          {
            "name": "MP2",
            "type": "MP2",
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

### 1.0.4
1. `mijia` yeelight accessory.
2. `mijia` fix wifi device bug.

### 1.0.3
1. `mijia` vacuum accessory.
2. `mijia` powerplug accessory.
3. `mijia` powerstrip accessory.

### 1.0.2
1. `mijia` magnet sensor accessory.
2. `mijia` ctrln1/ctrln2 switch accessory.
3. `mijia` ctrlneutral1/ctrlneutral2 switch accessory.
4. `mijia` motion sensor accessory.
5. `mijia` plug/86plug plug accessory.
6. `mijia` 86sw1/86sw2 switch accessory.
7. `mijia` switch accessory.
8. `mijia` smoke sensor accessory.
9. `mijia` natgas sensor accessory.
10. `mijia` air-purifier accessory.
11. `broadlink` mp1/mp2 plug accessory.
### 1.0.1
1. `mijia` gateway sensor accessory.
2. `mijia` door and window sensor accessory.
3. `mijia` temperature and humidity sensor accessory.