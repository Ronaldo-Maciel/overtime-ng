import { Component } from '@angular/core';

import { Settings } from './settings';
import { SettingsDataService } from './settings-data.service';
import { Clock } from './clock';
import { ClockService } from './clock.service';

import * as moment from 'moment';

declare var $: any;
declare var chrome;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [SettingsDataService, ClockService]
})
export class AppComponent {
  showSettings: boolean = false;
  settings: Settings = new Settings();
  clock: Clock = new Clock();
  arrivedTime: string = '';
  lastUpdateTime: string = '';
  remainingClockOut: any = {};

  normalClockOut: string = '--:--';
  minimumClockOut: string = '--:--';
  maximumClockOut: string = '--:--';
  maximumExtraTime: string = '--:--';

  hasToleranceTime: boolean = false;
  hasSaturdayHoliday: boolean = false;

  constructor(private settingsDataService: SettingsDataService, private clockService: ClockService) {
    this.settings = this.settingsDataService.getSettings();
    this.clock = this.clockService.getClock();
    this.loadSettings();
  }

  loadSettings() {
    moment.locale('pt-br');
    if(this.settings.arrivedTime) {
      this.arrivedTime = moment(this.settings.arrivedTime).format('HH:mm');
      this.lastUpdateTime = moment(this.settings.lastUpdate).fromNow();
      this.loadClock();
    } else {
      this.showSettings = true;
    }
  }

  toggleSettings(event) {
    this.showSettings = !this.showSettings;
    if(!this.showSettings) {
      this.saveSettings();
    }
  }

  saveArrivedTime() {
    this.settings.arrivedTime = moment(this.arrivedTime,'HH:mm').valueOf();
    this.saveSettings();
  }

  resetSettings() {
    this.settings = new Settings();
    this.saveSettings();
  }

  saveSettings() {
    this.settings.lastUpdate = moment().valueOf();
    this.settingsDataService.saveSettings(this.settings);
    this.loadClock();
  }

  loadClock() {
    this.clock = this.clockService.calculateClockInOut(this.settings);
    this.normalClockOut = moment(this.clock.normalClockOut).format('HH:mm');
    this.minimumClockOut = moment(this.clock.minimumClockOut).format('HH:mm');
    this.maximumClockOut = moment(this.clock.maximumClockOut).format('HH:mm');
    this.maximumExtraTime = moment(this.clock.maximumExtraTime).format('HH:mm');
    this.remainingClockOut = this.clockService.getRemainingClockOut();
    this.hasToleranceTime = parseInt(this.settings.toleranceTime) > 0;
    this.startClockChrome();
  }

  startClockChrome() {
    if(chrome && chrome.extension) {
      console.log("chrome.extension");
      console.log(this.remainingClockOut);
      chrome.extension.getBackgroundPage().clearTimers();
    } else if(chrome) {
      console.log("chrome.web");
      console.log(this.remainingClockOut);
      Notification.requestPermission().then(function(result) {
        console.log(result);
      });
      let notificationResetTimeOptions = {
        tag: 'overtimeAlertResetTime',
        icon: 'assets/images/overtime.png',
        title: 'Horário de entrada apagado',
        body: 'ATÉ AMANHÃ!'
      }
      new Notification(notificationResetTimeOptions.title, notificationResetTimeOptions);
    }
  }
}
