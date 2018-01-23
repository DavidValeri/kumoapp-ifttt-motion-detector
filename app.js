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
 * v1.0.0
 * 
 * https://github.com/DavidValeri/kumoapp-ifttt-motion-detector
 * 
 * Sends type "100" when motion is first detected and type "101" when motion
 * is no longer detected and any timeouts have elapsed.
 */

var tags = <#Motion sensing tags used as triggers_[12|13|21|26|52|72]_N#>;
var timeout=<%Delay, in minutes, after last detected open/close/motion event before triggering timeout.  PIR tags control their own timeouts and are not affected by this setting_N%>*60*1000;
var on = false;
var timer;
var hold = 0;

function onMotion(tag) {
  if (timer) {
    KumoApp.Log("Motion detected, renewing timeout.");
    KumoApp.stopTimer(timer);
    timer = KumoApp.setTimeout(onTimeout, timeout);
  }
  else {
    maybeTurnOn();
    timer = KumoApp.setTimeout(onTimeout, timeout);
  }
}

function incrementHold(tag) {
  maybeTurnOn();
  hold++;
}

function decrementHold(decrementHold) {
  hold--;
  if (hold === 0 && !timer)
  {
    onTimeout();
  }
}

function maybeTurnOn() {
  if (!on) {
    KumoApp.Log("Initial motion detected.", 100);
    on = true;
  }
}

function onTimeout() {
  if (hold === 0) {
    KumoApp.Log("Motion timed out.", 101);
    on = false;
  }
}

tags.forEach(
    function(tag) {
      tag.moved = onMotion;
      tag.opened = onMotion;
      tag.closed = onMotion;
      tag.detected = incrementHold;
      tag.timedOut = decrementHold
    });



