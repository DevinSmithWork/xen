//=============================
// GLOBAL VARS
//=============================

    // HTML input fields
    var rootMIDI;
    var rootFreq;
    var octDivs;
    var octMult;

    // Note & freq arrays
    var xenScaleArray = [];
    var xenFreqArray = [];


//=============================
// Scale calcs, dom, etc
//=============================

        //---------------------------
        function initPage() {
            loadVars();

            makeXenArrays2();

            makeMidiTable();
            makeScalaTable();
            makeKeyMapTable();

            let kContainer = document.getElementById("key-container");
            let kCenter = document.getElementById("keyboardCenter");
            scrollParentToChild(kContainer,kCenter);
        }

        //---------------------------
        // Calls refresh functions
        function refreshPage() {
            loadVars();

            makeXenArrays2();
            updateXenKeyboard();

            makeMidiTable();
            makeScalaTable();
            makeKeyMapTable();
        }




        //---------------------------
        // updates vars from input
        function loadVars() {
            rootMIDI = Number(document.getElementById("rootMIDI").value);
            rootFreq = Number(document.getElementById("rootFreq").value);
            octDivs = Number(document.getElementById("octDivs").value);
            octMult = Number(document.getElementById("octMult").value);
        }




        // new version of makeMIDIFreqList
        //--------------------------
        function makeXenArrays2() {
            // Init xen scale and freq arrays
            xenScaleArray = new Array(126);
            xenFreqArray = new Array(126);
            let midiIndex = rootMIDI;

            //--------
            // Loop through positive values first
            let stepCounter = 0;
            while (midiIndex < 128) {
                xenScaleArray[midiIndex] = stepCounter;

                // If this is the last step, reset stepCounter
                if (stepCounter == octDivs-1) {
                    stepCounter = 0;
                } else {
                    stepCounter++;
                }

                midiIndex++;
            }

            //--------
            // Negative vals
            midiIndex = rootMIDI-1;
            stepCounter = octDivs-1;
            while (midiIndex > -1) {
                xenScaleArray[midiIndex] = stepCounter;

                if (stepCounter == 0) {
                    stepCounter = octDivs-1;
                } else {
                    stepCounter--;
                }

                midiIndex--;
            }

            for (var i=0;i<127;i++) {
                // TK: multiple algos for calcing cFreq
                xenFreqArray[i] = getXenFrequency(i);
            }

        }


        //----------------------------
        // calc note frequency
        // fn  =  (2^(n/12))*440Hz where n = distance from 440.
        // fn = 440 * (2^(1/12))^n
        function getXenFrequency(n) {
            let noteOffset = n - rootMIDI;
            //let scaleStep = Math.pow(2,(1/12));
            let scaleStep = Math.pow(octMult,(1/octDivs));
            let f = rootFreq * Math.pow(scaleStep, noteOffset);
            return(f);
        }




















        // new version of makeMIDIFreqList
        //--------------------------
        function makeXenArrays() {
            // Init xen scale and freq arrays
            xenScaleArray = new Array(126);
            xenFreqArray = new Array(126);
            let midiIndex = rootMIDI;

            //--------
            // Loop through positive values first
            let startFreq = rootFreq;
            let endFreq = rootFreq * octMult;
            let stepCounter = 0;

            while (midiIndex < 128) {
                xenScaleArray[midiIndex] = stepCounter;

                // TK: multiple algos for calcing cFreq
                let cFreq = startFreq + (((endFreq - startFreq)/(octDivs)) * stepCounter);
                xenFreqArray[midiIndex] = cFreq;

                // If this is the last step, reset stepCounter
                if (stepCounter == octDivs-1) {
                    startFreq = endFreq;
                    endFreq = startFreq * octMult;
                    stepCounter = 0;
                } else {
                    stepCounter++;
                }

                midiIndex++;
            }

            //--------
            // Negative vals
            midiIndex = rootMIDI-1;
            startFreq = rootFreq;
            endFreq = rootFreq / octMult;
            stepCounter = octDivs-1;

            while (midiIndex > -1) {
                xenScaleArray[midiIndex] = stepCounter;

                var cFreq = endFreq + (((startFreq - endFreq)/(octDivs)) * stepCounter);
                xenFreqArray[midiIndex] = cFreq;

                if (stepCounter == 0) {
                    startFreq = endFreq;
                    endFreq = startFreq / octMult;
                    stepCounter = octDivs-1;
                } else {
                    stepCounter--;
                }

                midiIndex--;
            }

        }












        //---------------------------
        // New version of build KeyTables
        function updateXenKeyboard() {

            let keyTable = document.getElementById("key-table");

            keyTable.deleteRow(0);
            var xenOctaveRow = keyTable.insertRow(0);
            xenOctaveRow.setAttribute("id", "xenOctaveRow", 0);

            keyTable.deleteRow(1);
            var xenScaleRow = keyTable.insertRow(1);
            xenScaleRow.setAttribute("id", "xenScaleRow", 0);
            
            let octCounter = 0;
            let xenCounter = 0;

            for (var i=0;i<xenFreqArray.length;i++) {

                // If we're at the start of a new xen octave, add an octave cell
                if (xenScaleArray[i] == (octDivs-1)) {
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

                // Add the octave cell for the last note
                if ((i==xenFreqArray.length-1) && (xenScaleArray[i] != (octDivs-1))) {
                    var c0 = xenOctaveRow.insertCell(xenCounter);
                    c0.setAttribute('colspan', xenScaleArray[i]+1);
                    c0.innerHTML = "xn. " + (xenCounter + 1);
                }

                // Insert xen scale degree cell
                var c1 = xenScaleRow.insertCell(i);
                c1.innerHTML = (xenScaleArray[i]+1);
            }

            // Switch root note button
            let oldRootArray = document.getElementsByClassName("rootButton");
            oldRootArray[0].classList.remove("rootButton");

            let newRoot = document.getElementById("k" + rootMIDI);
            newRoot.classList.add("rootButton");

            // Scroll to keep root MIDI note in view
            let kContainer = document.getElementById("key-container");
            let kCenter = document.getElementById("keyboardCenter");
            scrollParentToChild(kContainer,kCenter);
        }






















        //==============================
        // Tables
        //==============================

        // MIDI table
        function makeMidiTable() {
            var table = document.createElement("TABLE");
            table.setAttribute("class","midiTable",0);

            for (var i=0;i<xenFreqArray.length;i++) {

                var row = table.insertRow(i);

                // b/w key color
                if (!getBlackKey(i%12)) {
                    row.classList.add("wKey");
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
                cell3.innerHTML = xenFreqArray[i].toFixed(5);

                // Xen scale degree
                var cell4 = row.insertCell(4);
                cell4.innerHTML = xenScaleArray[i]+1;

                // Freq. 8va
                var cell5 = row.insertCell(5);
                if (xenScaleArray[i]==0) cell5.innerHTML = "•";
            }

            // delete old list
            if (document.getElementById("MIDI-list").firstChild != null) {
                document.getElementById("MIDI-list").firstChild.remove();
            }

            document.getElementById("MIDI-list").append(table);
        }


        //----------------------------
        // Scala tables
        function makeScalaTable() {
            var s = "! " + document.getElementById("scaleName").value + ".scl";
            s += br();
            s += document.getElementById("scaleDescription").value;
            s += br();
            s += "127"
            s += br() + "!" + br();


            for (var i=0;i<xenFreqArray.length;i++) {
                s+=xenFreqArray[i].toFixed(5) + br();
            }

            document.getElementById("scala").innerHTML = s;
        }


        //----------------------------
        // Keymap table
        function makeKeyMapTable() {
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
            // s += document.getElementById("rootMIDI").value + br();
            s += "0" + br();

            // Refrence freq
            // s += document.getElementById("rootFreq").value + br();
            s += xenFreqArray[0].toFixed(5) + br();

            for (var i=0;i<xenFreqArray.length;i++) {
                s+=i + br();
            }

            document.getElementById("key-map").innerHTML = s;
        }



















        //=========================
        // Misc. Utilities
        //=========================



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


        // Adds line break
        function br() {
            return("<br>");
        }


        // Padding for numbers
        function pad(num, size) {
            var s = num+"";
            while (s.length < size) s = "0" + s;
            return s;
        }

        // Syncs slider and numerical values
        function syncInputs(x, y, z) {
            var slider = document.getElementById(x);
            var input = document.getElementById(y);
            if (z) {
                input.value = slider.value;
            } else {
                slider.value = input.value;
            }
            makeScalaTable();
            makeKeyMapTable();
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


