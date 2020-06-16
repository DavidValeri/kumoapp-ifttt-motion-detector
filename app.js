/**
 * Copyright 2018 David Valeri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * v1.1.0
 * 
 * https://github.com/DavidValeri/kumoapp-ifttt-motion-detector
 * 
 * Sends type "100" when motion is first detected and type "101" when motion
 * is no longer detected and any timeouts have elapsed.
 */

var tags = <#Motion sensing tags used as triggers_[12|13|21|26|52|72]_N#>;
var timeout=<%Delay, in minutes, after last detected open/close/motion event before triggering timeout.  PIR tags control their own timeouts and are not affected by this setting_N%>*60*1000;
var on = false;
var timers = {};
var pirTagMotionState = {};
var hold = 0;

function onPirTagMotion(tag) {
  KumoApp.Log("Motion on [" + tag.name + "].");
  if (isPirTagInMotion(tag)) {
    KumoApp.Log("Tag [" + tag.name + "] sent unpaired motion event, ignoring.");
  }
  else {
    pirTagMotionState[tag.uuid] = true;
    incrementHold();   
  }
}

function onPirTagTimeout(tag) {
  KumoApp.Log("Timeout elapsed for [" + tag.name + "].");
  if (!isPirTagInMotion(tag)) {
    KumoApp.Log("Tag [" + tag.name + "] sent unpaired timeout event, ignoring.");
  }
  else {
    pirTagMotionState[tag.uuid] = false;
    decrementHold();   
  }
}

function isPirTagInMotion(tag) {
    return !!pirTagMotionState[(tag.uuid)];
}

function onTagMotion(tag) {
  KumoApp.Log("Motion on [" + tag.name + "].");
  if (!isTimerSet(tag)) {
    incrementHold();
  }
  startOrResetTimer(tag);
  maybeTurnOn();
}

function onTagMotionTimeout(tag) {
  KumoApp.Log("Timeout elapsed for [" + tag.name + "].");
  clearTimer(tag);
  decrementHold();
}

function incrementHold() {
  maybeTurnOn();
  hold++;
  KumoApp.Log("Hold [" + hold + "].");
}

function decrementHold() {
  hold--;
  maybeTurnOff();
  KumoApp.Log("Hold [" + hold + "].");
}

function isTimerSet(tag) {
    return !!timers[(tag.uuid)];
}

function startOrResetTimer(tag) {
  var timer = timers[tag.uuid];
  var timeoutFunction = function() { onTagMotionTimeout(tag) };

  if (timer) {
    stopAndClearTimer(tag);
    timer = KumoApp.setTimeout(timeoutFunction, timeout);
    timers[tag.uuid] = timer;
    KumoApp.Log("Reset timer for [" + tag.name + "].");
  }
  else {
    timer = KumoApp.setTimeout(timeoutFunction, timeout);
    timers[tag.uuid] = timer;
    KumoApp.Log("Set timer for [" + tag.name + "].");
  }
}

function clearTimer(tag) {
  timers[tag.uuid] = undefined;
}

function stopAndClearTimer(tag) {
  var timer = timers[tag.uuid];
  if (timer) {
    KumoApp.stopTimer(timer);
    clearTimer(tag);
  }
}

function maybeTurnOn() {
  if (!on) {
    KumoApp.Log("Turned on.", 100);
    on = true;
  }
}

function maybeTurnOff() {
  if (on && hold === 0) {
    KumoApp.Log("Turned off.", 101);
    on = false;
  }
}

tags.forEach(
    function(tag) {
      tag.moved = onTagMotion;
      tag.opened = onTagMotion;
      tag.closed = onTagMotion;
      tag.detected = onPirTagMotion;
      tag.timedOut = onPirTagTimeout
    });
