//=============================
// Audio
//=============================
let context = new (window.AudioContext || window.webkitAudioContext);
let masterGainNode = null;

var voiceArray = new Array(8);
var voiceStatusArray = new Array(8);


//----------------------------
function audioSetup() {
    masterGainNode = context.createGain();
    masterGainNode.connect(context.destination);
    masterGainNode.gain.setValueAtTime(0.2,context.currentTime);

    for (var i=0;i<voiceStatusArray.length;i++) {
      voiceStatusArray[i] = new voiceStatus();
    }

    updateOscGui();
}




//----------------------------
function noteOn(note) {
    noteOn(note, 127);
}




//----------------------------
function noteOn(noteNum, velocity) {
    let found = false;
    let counter = 0;

    while ((found == false) && (counter < 8)) {
      if (voiceStatusArray[counter].status == 0) {
            let voice = new SynthVoice(noteNum);
            voiceArray[counter] = voice;
            voiceStatusArray[counter].setNoteOnStatus(noteNum, velocity);
            found = true;
      } else {
        counter++;
      }
    }

    // TK: if all 8 voices in use, see if any are in release
    // if (found==false) {
    //   let candidateArray = [];
    //   for (var i=0;i<8;i++) {
    //     if (voiceStatusArray[i].status==2) {
    //       candidateArray.push(voiceArray[i]);
    //       found=true;
    //     }
    //   }
    //   if (found) {
    //     let randomKillVoice = candidateArray[Math.floor(Math.random() * candidateArray.length)];
    //     let voice = new SynthVoice(noteNum);
    //     voiceArray[randomKillVoice] = voice;
    //     voiceStatusArray[randomKillVoice].setNoteOnStatus(noteNum, velocity);
    //     found = true;
    //   }
    // }

}





//----------------------------
function noteOff(note) {

    let found = false;
    let counter = 0;

    while ((found == false) && (counter < 8)) {
        if (voiceArray[counter] != undefined) {
            if (voiceArray[counter].name == note) {
                voiceStatusArray[counter].setNoteOffStatus(voiceArray[counter].ampEnv.r);
                voiceArray[counter].beginRelease();
                voiceArray[counter]=undefined
                found = true;
            }
        }
        counter++;
    }

}


















//--------------------------------
// SynthVoice object
function SynthVoice(noteNum) {
    // time = now
    let now = context.currentTime;

    this.name = noteNum;
    this.startTime = now;

    this.osc = context.createOscillator();
    this.gainEnv = context.createGain();
    this.filter = context.createBiquadFilter();

    // Waveform
    this.osc.type = document.getElementById("wave").value;

    // Xen freq.
    this.osc.frequency.value = Number(xenFreqArray[noteNum]);
    this.osc.frequency.setValueAtTime(xenFreqArray[noteNum], now);

    //-------------------------
    // Amp
    this.ampEnv = {
      a:getLog("ampAttack"),
      d:getLog("ampDecay"),
      s:getLog("ampSustain"),
      r:getLog("ampRelease")
    }
    // Amp scheduling
    this.gainEnv.gain.setValueAtTime(0, now);
    this.gainEnv.gain.linearRampToValueAtTime(1, now + this.ampEnv.a);
    this.gainEnv.gain.linearRampToValueAtTime(this.ampEnv.s, now + this.ampEnv.a + this.ampEnv.d); 


    //-------------
    // Filter
    this.filter.type="lowpass";
    this.filter.Q.value=getLog("filterRes");
    this.filterCutoff=getLog("filterCutoff");

    this.filterEnv = {
        a:getLog("filterAttack"),
        d:getLog("filterDecay"),
        s:getLog("filterSustain"),
        r:getLog("filterRelease")
    }
    this.filter.frequency.setValueAtTime(0, now);
    this.filter.frequency.linearRampToValueAtTime(this.filterCutoff, now + this.filterEnv.a);
    this.filter.frequency.linearRampToValueAtTime(this.filterCutoff * this.filterEnv.s, now + this.filterEnv.a + this.filterEnv.d); 

    // Connections
    this.osc.connect(this.filter);
    this.filter.connect(this.gainEnv);
    this.gainEnv.connect(masterGainNode);

    // start osc
    this.osc.start();

    // release phase
    this.beginRelease = function() {
        let now = context.currentTime;
        this.startTime = now;

        // Amp release
        this.gainEnv.gain.cancelScheduledValues(now);
        this.gainEnv.gain.setValueAtTime(this.gainEnv.gain.value, now);
        this.gainEnv.gain.linearRampToValueAtTime(0, now + this.ampEnv.r);

        // Filter release
        this.filter.frequency.cancelScheduledValues(now);
        this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
        this.filter.frequency.linearRampToValueAtTime(20, now + this.filterEnv.r);

        // Schedule Osc stop
        this.osc.stop(now + this.ampEnv.r + 1);
    };

    // kill function
    this.killVoice = function() {
      console.log('kill');

      let now = context.currentTime;
      this.filter.frequency.cancelScheduledValues(now);
      this.gainEnv.gain.cancelScheduledValues(now);

      this.filter.frequency.setValueAtTime(0, now +1);
      this.gainEnv.gain.setValueAtTime(0, now +1);
      this.osc.stop(now + 2);
    }

    return(this);
}







//------------
function voiceStatus() {
  this.guiText = "--- | --- : ------- | --";
  //0: available, 1: in use, 2:in release
  this.status = 0;

  this.setNoteOnStatus = function(noteNum,velo) {
    this.status = 1;
    this.guiText = "";
    this.guiText += pad(noteNum,3);
    this.guiText += " | ";
    this.guiText += pad(xenScaleArray[noteNum],3);
    this.guiText += " : ";
    this.guiText += pad(xenFreqArray[noteNum].toFixed(2),7);
    this.guiText += " | ON";
    updateOscGui();
  }

  this.setNoteOffStatus = function(timeoutDelay) {
    timeoutDelay = (timeoutDelay * 1000) + 1;
    this.status = 2;
    this.guiText = this.guiText.slice(0,22) + "RL";
    updateOscGui();
    setTimeout(this.resetStatus.bind(this), timeoutDelay);
  }

  this.resetStatus = function() {
    this.guiText = "--- | --- : ------- | --";
    this.status = 0;
    updateOscGui();
  }

  this.resetStatusKill = function() {
    this.guiText = "--- | --- : ------- | --";
    this.status = 0;
  }

}










//----------------------------
function killAll() {
  console.log("kill all");
    for (var i=0;i<voiceArray.length;i++) {
        if (voiceStatusArray[i].status != 0) {
          console.log("i: " + i + " -- " + voiceArray[i]);
            // voiceArray[i].stop();
            voiceArray[i].killVoice();
            voiceArray[i] = undefined;
        }
        voiceStatusArray[i].resetStatusKill();
    }
    updateOscGui();
}














//----------------------------
function updateOscGui() {
  for (var i=0;i<voiceStatusArray.length;i++) {
    var d = document.getElementById("osc"+i);
    d.innerHTML = voiceStatusArray[i].guiText;
  }
}




//---------------------
// Master gain
// TK placeholder math
function chVolume(x) {
    let g = (-1 -x)/4;
    masterGainNode.gain.setValueAtTime(g,context.currentTime);
}






//----------------
function getLog(x) {

    let element = document.getElementById(x);
    let value = Number(element.value);

    let max = Number(element.max);
    let min = Number(element.min);
    if (min == 0) min = 0.0001;

    let minLog = Math.log(min);
    let maxLog = Math.log(max);

    let scale = (maxLog-minLog) / (max-min);
    let logVal = Math.exp(minLog + scale*(value-min));

    return(logVal);
}





















//=============================
// WEB MIDI 
// incl. https://github.com/cwilso/WebMIDIAPIShim/tree/gh-pages/build
//=============================
function webMIDISetup() {

}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

if (navigator.requestMIDIAccess) {
    console.log('This browser supports WebMIDI!');
} else {
    console.log('WebMIDI is not supported in this browser.');
    // let webMIDIp = document.getElementById("webMIDIStatus");
    // webMIDIp.innerHTML="No WebMIDI available on this browser :(";
}

function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
}

function onMIDISuccess(midiAccess) {
    for (var input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
}

function getMIDIMessage(message) {
    var command = message.data[0];
    var note = message.data[1];
    var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    switch (command) {
        case 144: // noteOn
            if (velocity > 0) {
                noteOn(note, velocity);
            } else {
                noteOff(note);
            }
            break;
        case 128: // noteOff
            noteOff(note);
            break;
        // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
    }
}