/**
 * this app.js is web server to manage your mijia's accessory
 */
const express = require('express');
const winston = require('winston');

class MiApp {
  constructor() {
    console.log('miapp start')
  }
  init() {
    this.bind();
    this.start();
  }
  bind() {
    
  }
  start() {

  }
}


module.exports = () => {
  const app = new MiApp();
  app.init();
}