# Homebridge Lutron Caséta

[![Build Status](https://travis-ci.com/smockle/homebridge-lutron-caseta.svg?branch=master)](https://travis-ci.com/smockle/homebridge-lutron-caseta)
[![codecov](https://codecov.io/gh/smockle/homebridge-lutron-caseta/branch/master/graph/badge.svg)](https://codecov.io/gh/smockle/homebridge-lutron-caseta)
[![Known Vulnerabilities](https://snyk.io/test/github/smockle/homebridge-lutron-caseta/badge.svg?targetFile=package.json)](https://snyk.io/test/github/smockle/homebridge-lutron-caseta?targetFile=package.json)
[![Greenkeeper badge](https://badges.greenkeeper.io/smockle/homebridge-lutron-caseta.svg)](https://greenkeeper.io/)

A fork of [jcoleman/homebridge-lutron-caseta](https://github.com/jcoleman/homebridge-lutron-caseta)

# tl;dr

A Homebridge plugin for integration with the Lutron Caséta SmartBridge Pro.

# Primary Motivation

Lutron doesn’t expose its versatile Pico remotes as HomeKit accessories, so it’s not possible to use them to control non-Lutron accessories.

However, the Smart Bridge Pro allows connections over telnet via the Lutron Integration Protocol. This connection allows direct control of accessories, and, more critically for our purposes, streams notifications of Pico button presses.
