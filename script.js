        var rootMIDI;
        var rootFreq;
        var octDivs;
        var octMult;

        var octaveArray = [];
        var noteArray = [];
        var freqArray = [];
        var xenScaleDegreeArray = [];
        var midiFreqArray = [];







        //=============================
        // WEB MIDI 
        //=============================
        if (navigator.requestMIDIAccess) {
            console.log('This browser supports WebMIDI!');
        } else {
            console.log('WebMIDI is not supported in this browser.');
        }

        navigator.requestMIDIAccess()
            .then(onMIDISuccess, onMIDIFailure);

        function onMIDIFailure() {
            console.log('Could not access your MIDI devices.');
        }

        function onMIDISuccess(midiAccess) {
            for (var input of midiAccess.inputs.values())
            input.onmidimessage = getMIDIMessage;
        }

        function getMIDIMessage(message) {
            //console.log(message);
            var command = message.data[0];
            var note = message.data[1];
            var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

            console.log(command + "." + note +"." + velocity);


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












        //=============================
        // Audio
        //=============================
        let audioContext = new (window.AudioContext || window.webkitAudioContext);
        let oscList = [];
        let masterGainNode = null;

        let noteFreq = null;
        let customWaveform = null;
        let sineTerms = null;
        let cosineTerms = null;

        var oscArray = new Array(8);

        //----------------------------
        function audioSetup() {
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);

            //masterGainNode.gain.value = 0.20;
            masterGainNode.gain.setValueAtTime(0.2,audioContext.currentTime);

            sineTerms = new Float32Array([0, 0, 1, 0, 1]);
            cosineTerms = new Float32Array(sineTerms.length);
            customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);

            updateOscGui();
        }


        //----------------------------
        function noteOn(note) {
            noteOn(note, 127);
        }

        //----------------------------
        function noteOn(note, velocity) {
            let found = false;
            let counter = 0;
            while ((found == false) && (counter < 8)) {
                if (oscArray[counter] == undefined) {
                    let osc = audioContext.createOscillator();
                    osc.connect(masterGainNode);
                    let type = 'sine';
                    osc.type = type;

                    osc.name = note;
                    console.log(midiFreqArray[note]);
                    osc.frequency.value = Number(midiFreqArray[note]);
                    osc.frequency.setValueAtTime(midiFreqArray[note], audioContext.currentTime);

                    oscArray[counter] = osc;
                    oscArray[counter].start();

                    //osc.start();
                    found = true;
                } else {
                    counter++;
                }
            }
            updateOscGui();
        }


        //----------------------------
        function noteOff(note) {

            let found = false;
            let counter = 0;

            while ((found == false) && (counter < 8)) {
                console.log("oA["+ counter+"]: " + oscArray[counter]);

                if (oscArray[counter] != undefined) {
                    if (oscArray[counter].name == note) {
                        oscArray[counter].stop();
                        oscArray[counter] = undefined;
                        found = true;
                    }
                }
                counter++;
            }
            updateOscGui();
        }

        //----------------------------
        function killAll() {
            console.log(oscArray);
            for (var i=0;i<oscArray.length;i++) {
                if (oscArray[i] != undefined) {
                    oscArray[i].stop();
                    oscArray[i] = undefined;
                }
            }
            updateOscGui();
        }


        //----------------------------
        function updateOscGui() {
            for (var i=0;i<oscArray.length;i++) {
                var d = document.getElementById("osc"+i);
                if (oscArray[i] == undefined) {
                    d.innerHTML = "- -";
                } else {
                    var s = "";
                    s += oscArray[i].name;
                    s += " : ";
                    s += oscArray[i].frequency.value.toFixed(5);
                    d.innerHTML = s;
                }
            }
        }


        function chVolume(x) {
            masterGainNode.gain.setValueAtTime(x,audioContext.currentTime);
        }










        //=============================
        // Scale calcs, dom, etc
        //=============================

        //---------------------------
        // Calls refresh functions
        function refreshPage() {
                loadVars();
                makeMIDIFreqList();
                makeScalaOutput2();
                makeKeyMapOutput2();
        }


        //---------------------------
        // updates vars from input
        function loadVars() {
            rootMIDI = Number(document.getElementById("rootMIDI").value);

            rootFreq = Number(document.getElementById("rootFreq").value);

            octDivs = Number(document.getElementById("octDivs").value);

            octMult = Number(document.getElementById("octMult").value);
        }


        //---------------------------
        // Updates MIDI Freqs
        function makeMIDIFreqList() {
            midiFreqArray = new Array(126);
            var midiIndex = rootMIDI;

            var oArray = new Array(126);
            oArray[midiIndex] = true;

            xenScaleDegreeArray = new Array(126);

            // Positive vals
            var startFreq = rootFreq;
            var endFreq = rootFreq * octMult;
            var stepCounter = 0;

            while (midiIndex < 128) {
                xenScaleDegreeArray[midiIndex] = stepCounter;

                var cFreq = startFreq + (((endFreq - startFreq)/(octDivs)) * stepCounter);
                midiFreqArray[midiIndex] = cFreq;

                // If you're on the last step, reset
                if (stepCounter == octDivs-1) {
                    startFreq = endFreq;
                    endFreq = startFreq * octMult;
                    stepCounter = 0;
                    oArray[midiIndex+1] = true;
                } else {
                    stepCounter++;
                }

                midiIndex++;
            }

            // Negative vals
            midiIndex = rootMIDI-1;
            var startFreq = rootFreq;
            var endFreq = rootFreq / octMult;
            var stepCounter = octDivs-1;

            while (midiIndex > -1) {
                xenScaleDegreeArray[midiIndex] = stepCounter;

                var cFreq = endFreq + (((startFreq - endFreq)/(octDivs)) * stepCounter);
                midiFreqArray[midiIndex] = cFreq;

                if (stepCounter == 0) {
                    startFreq = endFreq;
                    endFreq = startFreq / octMult;
                    stepCounter = octDivs-1;
                    oArray[midiIndex] = true;
                } else {
                    stepCounter--;
                }

                midiIndex--;
            }


            // Only need to build the MIDI stuff once.

            // Builds the keyboard table
            var keyTable = document.createElement("TABLE");
            keyTable.setAttribute("id","key-table",0);

            var xenOctaveRow = keyTable.insertRow(0);
            xenOctaveRow.setAttribute("id", "xenOctaveRow", 0);

            var xenScaleRow = keyTable.insertRow(1);
            xenScaleRow.setAttribute("id", "xenScaleRow", 0);
            
            var keyRow = keyTable.insertRow(2);
            keyRow.setAttribute("id", "keyRow", 0);
            
            var noteRow = keyTable.insertRow(3);
            noteRow.setAttribute("id", "noteRow", 0);

            var octRow = keyTable.insertRow(4);
            octRow.setAttribute("id", "octRow", 0);
            
            let octCounter = 0;
            let xenCounter = 0;
            for (var i=0;i<midiFreqArray.length;i++) {

                if (xenScaleDegreeArray[i] == (octDivs-1)) {
                    var c0 = xenOctaveRow.insertCell(xenCounter);
                    if ((i - octDivs) == (rootMIDI-1)) c0.setAttribute('id', "keyboardCenter");
                    if (xenCounter == 0) {
                        c0.setAttribute('colspan', i+1);
                    } else {
                        c0.setAttribute('colspan', octDivs);
                    }
                    c0.innerHTML = "xn. " + (xenCounter + 1);
                    xenCounter++;
                }

                var c1 = xenScaleRow.insertCell(i);
                c1.innerHTML = (xenScaleDegreeArray[i]+1);

                var c2 = keyRow.insertCell(i);
                var keyButton = document.createElement("BUTTON");
                keyButton.setAttribute("id", "k"+i, 0);
                if (getBlackKey(i%12)) {
                    keyButton.setAttribute("class", "kk bk", 0);
                } else {
                    keyButton.setAttribute("class", "kk wk", 0);
                }
                if (i==rootMIDI) keyButton.classList.add("rootButton");
                c2.append(keyButton);

                var c3 = noteRow.insertCell(i);
                c3.innerHTML = getNoteName(i%12);

                if (i%12==0) {
                    var c4 = octRow.insertCell(octCounter);
                    c4.setAttribute('colspan', 12);
                    c4.innerHTML = (octCounter -1);
                    octCounter++;
                }



            }

            if (document.getElementById("key-div").firstChild != null) {
                document.getElementById("key-div").firstChild.remove();
            }

            document.getElementById("key-div").append(keyTable);

            // Scroll to keep root MIDI note in view
            let kContainer = document.getElementById("key-container");
            let kCenter = document.getElementById("keyboardCenter");
            scrollParentToChild(kContainer,kCenter);


            // Build the MIDI table
            var table = document.createElement("TABLE");
            table.setAttribute("class","midiTable",0);

            let tableArray = [];
            let centerTable;

            for (var i=0;i<midiFreqArray.length;i++) {
            // for (var i=(midiFreqArray.length-1);i==0;i--) {

                if (i==rootMIDI) {
                    centerTable = tableArray.length+1;
                }

                if (oArray[i]) {
                    //document.getElementById("MIDI-list").append(table);
                    // tableArray.push(table);
                    // table = document.createElement("TABLE");
                    // table.setAttribute("class","midiTable",0);
                }

                var row = table.insertRow(0);
                //row.setAttribute("id", i, 0);
                if (getBlackKey(i%12)) {
                    row.classList.add("bKey");
                }

                if (oArray[i]) {
                    row.classList.add("freqKey");
                }

                // key icon
                var cell0 = row.insertCell(0);
                cell0.innerHTML = getPianoKey(i%12, (i==rootMIDI));

                // note name
                var cell1 = row.insertCell(1);
                cell1.innerHTML = getNoteName(i%12);

                // MIDI #
                var cell2 = row.insertCell(2);
                cell2.innerHTML = pad(i,3);

                // Note freq
                var cell3 = row.insertCell(3);
                cell3.innerHTML = midiFreqArray[i].toFixed(5);

                // Freq. 8va
                var cell4 = row.insertCell(4);
                if (oArray[i]) cell4.innerHTML = "•";
            }

            // tableArray.push(table);

            // document.getElementById("MIDI-list").innerHTML = "";

            // for (var i=centerTable;i<tableArray.length;i++) {
            //     document.getElementById("MIDI-list").append(tableArray[i]);
            // }

            // document.getElementById("MIDI-list").append(document.createElement("BR"));

            // for (var i=centerTable-1;i>-1;i--) {
            //     document.getElementById("MIDI-list").append(tableArray[i]);
            // }

            if (document.getElementById("MIDI-list").firstChild != null) {
                document.getElementById("MIDI-list").firstChild.remove();
            }

            document.getElementById("MIDI-list").append(table);

        }






        //-----------------------
        // scroll parent to child
        // https://stackoverflow.com/questions/45408920/plain-javascript-scrollintoview-inside-div
        function scrollParentToChild(parent, child) {
          // Where is the parent on page
          var parentRect = parent.getBoundingClientRect();
          // What can you see?
          var parentViewableArea = {
            height: parent.clientHeight,
            width: parent.clientWidth
          };

          // Where is the child
          var childRect = child.getBoundingClientRect();
          // Is the child viewable?
          var isViewable = (childRect.left >= parentRect.left) && (childRect.left <= parentRect.left + parentViewableArea.width);

          // if you can't see the child try to scroll parent
          if (!isViewable) {
            // scroll by offset relative to parent
            parent.scrollLeft = (childRect.left + parent.scrollLeft) - parentRect.left - (parentViewableArea.width / 2)
          }
        }



        //---------------
        // returns note name
        function getNoteName(x) {
            var s="";
            switch(x) {
                case(0):
                    s="C";
                break;
                case(1):
                    s="C#";
                break;
                case(2):
                    s="D";
                break;
                case(3):
                    s="D#";
                break;
                case(4):
                    s="E";
                break;
                case(5):
                    s="F";
                break;
                case(6):
                    s="F#";
                break;
                case(7):
                    s="G";
                break;
                case(8):
                    s="G#";
                break;
                case(9):
                    s="A";
                break;
                case(10):
                    s="A#";
                break;
                case(11):
                    s="B";
                break;
            }
            return(s);
        }

        //---------------
        // returns piano key grahpic
        function getPianoKey(x, rootM) {
            var s="";
            if (rootM) {
               return("✭");
            } else {
                switch(x) {
                    case(0):
                        return("▵");
                    break;
                    case(1):
                    case(3):
                    case(6):
                    case(8):
                    case(10):
                        return("◼︎");
                    break;
                    default:
                        return("◻︎");
                    break;
                }
            }
        }




        //------------------------
        // Returns boolean
        function getBlackKey(x) {
            switch(x) {
                case(1):
                case(3):
                case(6):
                case(8):
                case(10):
                    return(true);
                    break;
                default:
                    return(false);
                    break;
            }
        }


        //--------------------
        function makeScalaOutput() {
            var s = "! " + document.getElementById("scaleName").value + ".scl";
            s += br();
            s += document.getElementById("scaleDescription").value;
            s += br();
            s += document.getElementById("octDivs").value;
            s += br() + "!" + br();

            //create the frequency divisions
            var octDivs = Number(document.getElementById("octDivs").value);

            var rootFreq = Number(document.getElementById("rootFreq").value);

            var octEnd = rootFreq * 2;

            var equalFreqStep = (octEnd - rootFreq) / (octDivs-1);

            freqArray = [];
            for (var i=0;i<octDivs;i++) {
                var freq = (rootFreq + (equalFreqStep * i)).toFixed(5);
                freqArray.push(freq);
                s += freq;
                s += br();
            }

            document.getElementById("scala").innerHTML = s;
        }



        function makeKeyMapOutput() {
            var s = "! " + document.getElementById("scaleName").value + ".kbm";
            s += "<br>!<br>";
            // Pattern repeats
            s += document.getElementById("octDivs").value + br();
            // First MIDI note remap
            s += "0" + br();
            // last MIDI note remap
            s += "126" + br();

            // Middle note
            s += document.getElementById("rootMIDI").value + br();

            // Refrence note
            s += document.getElementById("rootMIDI").value + br();

            // Refrence freq
            s += document.getElementById("rootFreq").value + br();

            var octDivs = Number(document.getElementById("octDivs").value);


            for (var i=0;i<octDivs;i++) {
                s+=i + br();
            }
            

            document.getElementById("key-map").innerHTML = s;
        }
        




        function makeScalaOutput2() {
            var s = "! " + document.getElementById("scaleName").value + ".scl";
            s += br();
            s += document.getElementById("scaleDescription").value;
            s += br();
            s += "127"
            s += br() + "!" + br();


            for (var i=0;i<midiFreqArray.length;i++) {
                s+=midiFreqArray[i].toFixed(5) + br();
            }

            document.getElementById("scala").innerHTML = s;
        }


        function makeKeyMapOutput2() {
            var s = "! " + document.getElementById("scaleName").value + ".kbm";
            s += "<br>!<br>";
            // Pattern repeats
            s += "127"
            // First MIDI note remap
            s += "0" + br();
            // last MIDI note remap
            s += "127" + br();

            // Middle note
            s += document.getElementById("rootMIDI").value + br();

            // Refrence note
            s += document.getElementById("rootMIDI").value + br();

            // Refrence freq
            s += document.getElementById("rootFreq").value + br();

            for (var i=0;i<midiFreqArray.length;i++) {
                s+=i + br();
            }

            document.getElementById("key-map").innerHTML = s;
        }












        function br() {
            return("<br>");
        }



        function pad(num, size) {
            var s = num+"";
            while (s.length < size) s = "0" + s;
            return s;
        }


        function padSpace(num, size) {
            var s = num+"";
            while (s.length < size) s = "\xa0" + s;
            return s;
        }




        function syncInputs(x, y, z) {
            var slider = document.getElementById(x);
            var input = document.getElementById(y);
            if (z) {
                input.value = slider.value;
            } else {
                slider.value = input.value;
            }
            makeScalaOutput();
            makeKeyMapOutput();
        }
