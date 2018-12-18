# Homebridge Lutron Caséta

[![Build Status](https://travis-ci.com/smockle/homebridge-lutron-caseta.svg?branch=master)](https://travis-ci.com/smockle/homebridge-lutron-caseta)
[![codecov](https://codecov.io/gh/smockle/homebridge-lutron-caseta/branch/master/graph/badge.svg)](https://codecov.io/gh/smockle/homebridge-lutron-caseta)
[![Known Vulnerabilities](https://snyk.io/test/github/smockle/homebridge-lutron-caseta/badge.svg?targetFile=package.json)](https://snyk.io/test/github/smockle/homebridge-lutron-caseta?targetFile=package.json)
[![Greenkeeper badge](https://badges.greenkeeper.io/smockle/homebridge-lutron-caseta.svg)](https://greenkeeper.io/)

A fork of [jcoleman/homebridge-lutron-caseta](https://github.com/jcoleman/homebridge-lutron-caseta)

# tl;dr

A Homebridge plugin for integration with the Lutron Caséta Smart Bridge Pro.

# Primary Motivation

Lutron doesn’t expose its versatile Pico remotes as HomeKit accessories, so it’s not possible to use them to control non-Lutron accessories.

However, the Smart Bridge Pro allows connections over telnet via the Lutron Integration Protocol. This connection allows direct control of accessories, and, more critically for our purposes, streams notifications of Pico button presses.

# Setup

1. Connect your Lutron Caséta Smart Bridge Pro to power and ethernet

2. Login and add devices (e.g. Pico remotes) using [the Lutron iOS app](https://itunes.apple.com/us/app/lutron-caséta-ra2-select-app/id886753021)

3. In the Lutron app, press the gear in the top-left, then “Advanced” > “Integration”
  - Enable “Telnet Support”
  - Send the “Integration Report” to yourself via email
  - Note the IP address assigned to your bridge in “Network Settings”

4. Assign a static IP address to your bridge, matching the current IP address (noted in step 3).

# Configuration

```JSON
{
  "bridge": {
    "name": "Lutron Bridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "SmartHome with Homebridge",
  "accessories": [],
  "platforms": [{
    "platform": "LutronCasetaPlatform",
    "bridgeConnection": "192.168.1.2"
  }]
}
```