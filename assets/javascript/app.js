/* eslint-disable radix */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
/* eslint-disable func-names */

//////////// Polyfill code for report validity for not compatible browsers///////
if (!HTMLFormElement.prototype.reportValidity) {
    HTMLFormElement.prototype.reportValidity = function() {
        if (this.checkValidity()) return true;
        var btn = document.createElement('button');
        this.appendChild(btn);
        btn.click();
        this.removeChild(btn);
        return false;
    };
}
///////////////////////////// Polyfill code ends///////////////////////////////

////////////////////////////////// Fade in effect//////////////////////////////
$(document).ready(function($) {
    window.setTimeout(function() {
        $("#cardbox").fadeIn(2000);
    }, 300); // 3 seconds
});
////////////////////////////////// end of Fade in effect///////////////////////////


/////////////////////////// scroll btn code starts here ////////////////////////////

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("topBtn").style.display = "block";
    } else {
        document.getElementById("topBtn").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
/////////////////////////////end of scroll btn////////////////////////////////////

let stations;

//////////////////////////////// weather code starts here/////////////////////////
// Wait for the page to load before running js
$(document).ready(() => {
    console.log("Document is Ready!");

    // Setup Variables
    // *********************************************
    let reportTime = "";
    let reportTimeFromNow = "";
    let fieldElev = "";
    let tempC = "";
    let tempF = "";
    let dewpointC = "";
    let dewpointF = "";
    let dewPointSpread = "";
    let baro = "";
    let windSpeed = "";
    let windDir = "";
    let windGust = "";
    let visibility = "";
    let description = "";
    let clouds = [];
    let cloudBase = "";
    let cloudAmount = "";

    // State variable - will limit weather info to TX
    let state = "TX";

    // Constructing a queryURL variable for the "All Stations in TX" api call
    let queryURL = "https://api.weather.gov/stations?state=" + state;

    // Functions
    // ***********************************************

    // Function to convert Meters to Feet
    function convertMetersToFeet(meters) {
        if (meters < 0) {
            return "input cannot be less than zero";
        } else {
            return meters / 0.3048;
        }
    } // End convert meters to feet

    // Function to convert celsius to fahrenheit
    function convertToF(celsius) {
        let fahrenheit;
        fahrenheit = (celsius * 9) / 5 + 32;
        return fahrenheit;
    } // End convert to Farenheit

    // Function to convert Pa to mmHg
    function convertToInHg(pascal) {
        inHg = pascal * 0.0002953;
        return inHg;
    } // End convert to mmHg

    // Convert meters/sec to mph
    function convertToMph(mps) {
        mph = mps * 2.23694;
        return mph;
    } // End convert to mph

    // Convert Meters to Miles
    function convertToMiles(meters) {
        miles = meters / 1609.344;
        return miles;
    }

    // Calculate Flight Categories
    //
    // Low Instrument Flight Rules (LIFR):
    // Ceilings are less than 500 feet above ground level and/or visibility is less than 1 mile.
    // LIFR = <500′ and/or <1 mile - Magenta
    //
    // Instrument Flight Rules (IFR): Ceilings 500 to less than 1,000 feet and/or visibility 1 to less than 3 miles.
    // IFR = 500-1000′ and/or 1-3 miles - Red
    //
    // Marginal VFR (MVFR): Ceilings 1,000 to 3,000 feet and/or visibility is 3-5 miles inclusive.
    // MVFR = 1000-3000′ and/or 3-5 miles - Blue
    //
    // VFR: Ceiling greater than 3000 feet and visibility greater than 5 miles (includes sky clear).
    // VFR = >3000′ and >5 miles - Green
    function calculateCat(visibility, cloudAmount, cloudBase, description) {
        console.log("Vis: " + visibility + ", Amount: " + cloudAmount + ", Ceiling: " + cloudBase +
            ", Description: " + description);

        //console.log(typeof cloudBase);

        // Check for LIFR using visibility
        // Is Rounding affecting*************************
        if (visibility != "Not Reported" && visibility < 1) {
            console.log("LIFR-vis");
            return "LIFR";
        }
        // Check for LIFR using ceiling
        if (cloudBase != 'null' && cloudBase < 500) {
            console.log("LIFR-ceil");
            return "LIFR";
        }

        // Check for IFR using visibility
        if (visibility != "Not Reported" && visibility >= 1 && visibility < 3) {
            console.log("IFR-vis");
            return "IFR";
        }
        // Check for IFR using ceiling
        if (cloudBase != 'null' && cloudBase >= 500 && cloudBase < 1000) {
            console.log("IFR-ceil");
            return "IFR";
        }

        // Check for MVFR using visibility
        if (visibility != "Not Reported" && visibility >= 3 && visibility <= 5) {
            console.log("MVFR-vis");
            return "MVFR";
        }
        // Check for MVFR using ceiling
        if (cloudBase != 'null' && cloudBase >= 1000 && cloudBase <= 3000) {
            console.log("MVFR-ceil");
            return "MVFR";
        }

        // Check for VFR
        if (visibility != "Not Reported" && visibility > 5 && cloudBase > 3000) {
            console.log("VFR - Have Vis and Ceil");
            return "VFR";
        }

        if (visibility != "Not Reported" && visibility > 5 && cloudBase === 'null') {
            console.log("VFR - Have Vis, but No Ceil");
            return "VFR";
        }

        if (visibility === "Not Reported" && cloudBase === 'null' && description === "Clear") {
            console.log("VFR - No Vis or Ceil, only have Description of Clear");
            return "VFR";
        }
    } // End calculate weather categories

    //Function to calculate Density Altitude
    function calcDensityAlt(baro, fieldElev, temp) {
        console.log("Baro: " + baro + " - Elev: " + fieldElev + " - Temp: " + temp);



        // Need to calculate density altitude
        // Pressure altitude = (29.92 - current altimeter) x 1,000 + field elevation in feet
        // Let’s say our current altimeter setting is 29.45 and the field elevation is 5,000 feet.
        // That means Pressure Altitude = (29.92 - 29.45) x 1,000 + 5,000 = 5,470 feet.
        // OAT is degrees Celsius read off our thermometer (let’s say it’s a balmy 35 °C today) and ISA Temp is always 15 °C at sea level
        // Density altitude = pressure altitude + [120 x (OAT in Celsius - ISA Temp in deg celsius)]
        // Calculate ISA Temp:
        // The first step is to check what the standard (ISA) temperature is for your chosen altitude.
        // Remember that according to ISA, the temperature will decrease by 1.98°C per 1000ft from mean sea level (MSL).
        // For practical, and exam purposes, we can safely use a 2°C decrease per 1000ft that we climb.

        //Now, before your eyes glaze over, here’s how simple this density formula is: 
        //We already have the value for pressure altitude from our last calculation; 
        //OAT is degrees Celsius read off our thermometer (let’s say it’s a balmy 35 °C today) and 
        //ISA Temp is always 15 °C at sea level. 
        //To find ISA standard temperature for a given altitude, here’s a rule of thumb: 
        //double the altitude, subtract 15 and place a - sign in front of it. 
        //(For example, to find ISA Temp at 10,000 feet, 
        //we multiply the altitude by 2 to get 20; 
        //we then subtract 15 to get 5; finally, we add a - sign to get -5.)

        // Density altitude = 5,470 + [120 x (35 - 5)] = 9070

        //The first step is to check what the standard (ISA) temperature is for your chosen altitude. 
        //Remember that according to ISA, the temperature will decrease by 1.98°C per 1000ft from mean sea level (MSL). 
        //For practical, and exam purposes, we can safely use a 2°C decrease per 1000ft that we climb. 
        //So, as an example, if the chosen altitude is 8000ft then we calculate it like this:
        //8 x -2 = -16 now add +15 (which is the ISA temperature at MSL) = -1°C


        //Calc Pressure Altitude
        pressAlt = Math.round((29.92 - baro) * 1000 + fieldElev);
        console.log("Press. Alt.: " + pressAlt);

        //Get the elevation and check if it is at least 1000
        if (fieldElev >= 1000) {
            //Convert to String and get the 1st Character
            let strElev = fieldElev.toString()[0];
            //Convert back to number
            let intElev = parseInt(strElev);
            console.log(strElev);
            intElev = 2 * intElev;

            isaTemp = (intElev * -2) + 15;
        } else {
            //MSL ISA Temp
            isaTemp = 15;
        }

        densityAlt = pressAlt + (120 * (temp - isaTemp));

        return densityAlt;

    }


    function getIcon(description) {

        // weather icons variables

        let sunShower = $('<div class="icon sun-shower"><div class="cloud"></div><div class="sun"><div class="rays"></div></div><div class="rain"></div></div>')

        let thunder = $('<div class="icon thunder-storm"><div class="cloud"></div><div class="lightning"><div class="bolt"></div><div class="bolt"></div></div></div>')

        let cloudy = '<div class="icon cloudy"><div class="cloud"></div><div class="cloud"></div></div>';

        let snowy = $('<div class="icon flurries"><div class="cloud"></div><div class="snow"><div class="flake"></div><div class="flake"></div></div></div>')

        let sunny = '<div class="icon sunny"><div class="sun"><div class="rays"></div></div></div>';

        let mostlyClear = '<div class="icon mostlyClear"><div class="sun"><div class="rays"></div></div><div class="cloud"></div></div>';

        let rainy = $('<div class="icon rainy"><div class="cloud"></div><div class="rain"></div></div>')

        let partCloudy = $('<div class="icon partCloudy"><div class="cloud"></div><div class="sun"><div class="rays"></div></div></div>')

        // end of weather icon variables

        //Update the page

        // Match weather description to weather icons
        let icon;

        if (/partly\s*cloudy/i.test(description)) {
            icon = partCloudy;
        } else if (/cloudy/i.test(description)) {
            icon = cloudy;
        } else if (/mostly\s*clear/i.test(description)) {
            icon = mostlyClear;
        } else if (/clear/i.test(description)) {
            icon = sunny;
        } else if (/rain/i.test(description)) {
            icon = rainy;
        } else if (/snow/i.test(description)) {
            icon = snowy;
        } else if (/thunder/i.test(description)) {
            icon = thunder;
        } else if (/sunShower/i.test(description)) {
            icon = sunShower;
        } else {
            console.log("Unknown weather condition", description);
        }

        // End of Match weather description to weather icons
        return icon;
    }

    function doWeatherLookup(station, letter) {
        let resultsSelector = "#point" + letter + "result";
        if (station) {
            // Constructing a queryURL variable for the "Latest Observation" api call
            let queryURL =
                "https://api.weather.gov/stations/" + station.station + "/observations/latest";

            // Get the selected airport's latest weather
            $.ajax({
                url: queryURL,
                method: "GET"
            }).then(function(response) {
                // console.log(response);
                console.log(response.properties);

                // Get all the variables and do the calculations
                // Timestamp
                reportTime = moment(response.properties.timestamp).format("LLLL");
                reportTimeFromNow = moment(response.properties.timestamp).fromNow();
                // .toLocalString puts in the comma
                fieldElev = Math.round(convertMetersToFeet(response.properties.elevation.value))
                    .toLocaleString();
                // For Farenheit - &#8457; , Celsius - &#8451;, For Degrees - &deg;

                // Check if the temp has been reported
                if (response.properties.temperature.value != null) {
                    tempC = Math.round(response.properties.temperature.value);
                    tempF = Math.round(convertToF(response.properties.temperature.value));
                } else {
                    tempC = "Not Reported";
                    tempF = "Not Reported";
                } // End check if temp reported

                // Check if the dewpoint has been reported
                if (response.properties.dewpoint.value != null) {
                    dewpointC = Math.round(response.properties.dewpoint.value);
                    dewpointF = Math.round(convertToF(response.properties.dewpoint.value));
                    dewPointSpread = tempF - dewpointF;
                } else {
                    dewpointC = "Not Reported";
                    dewpointF = "Not Reported";
                    dewPointSpread = "Not Reported";
                } // End check if dewpoint reported

                // Check if the Barometric pressure has been reported
                if (response.properties.barometricPressure.value != null) {
                    baro = convertToInHg(response.properties.barometricPressure.value).toFixed(2);
                } else {
                    baro = "Not Reported";
                } // End check if baro reported

                // Check if the Wind Speed has been reported
                if (response.properties.windSpeed.value != null) {
                    windSpeed = Math.round(convertToMph(response.properties.windSpeed.value));
                } else {
                    windSpeed = "Not Reported";
                } // End check if wind speed reported

                // Check if the Wind Direction has been reported
                if (response.properties.windDirection.value != null) {
                    windDir = Math.round(response.properties.windDirection.value);
                } else {
                    windDir = "Not Reported"
                } // End check if wind direction reported

                // Check if the Wind Gust has been reported
                if (response.properties.windGust.value != null) {
                    windGust = Math.round(convertToMph(response.properties.windGust.value));
                } else {
                    windGust = "Not Reported";
                } // End check if wind gust reported

                //Check if the Visibility has been reported
                if (response.properties.visibility.value != null) {
                    visibility = Math.round(convertToMiles(response.properties.visibility.value));
                    Math.round(convertToMiles(response.properties.visibility.value));
                } else {
                    visibility = "Not Reported";
                } //End check if visibility has been reported

                //Set the clouds array variable
                clouds = response.properties.cloudLayers;
                //Check if there is a cloud array returned, then assign the cloudBase variable to send to calculateCat function
                //Get the 1st "BKN" or "OVC" layer
                if (clouds.length > 0) {
                    //Loop through cloud array
                    for (let i = 0; i < clouds.length; i++) {
                        //Set the amount variable, CLR, SCT, BKN, OVC
                        cloudAmount = clouds[i].amount;
                        //Check for a Broken or Overcast layer
                        if (cloudAmount === "BKN" || cloudAmount === "OVC") {
                            //Set the Ceiling
                            cloudBase = Math.round(convertMetersToFeet(clouds[i].base.value));
                            //Break out of the loop if get a BKN or OVC layer
                            break;
                        } else {
                            cloudBase = "null";
                        } //End check if BKN or OVC
                    } //End loop over clouds
                } else {
                    cloudBase = "null";
                } //End check if there is a cloud array

                //Get the text description of the current weather
                description = response.properties.textDescription;


                //Calculate the weather category, VFR, MVFR
                let flightCat = calculateCat(visibility, cloudAmount, cloudBase, description);
                console.log(flightCat);

                //Calculate Density Altitude
                let densityAlt = calcDensityAlt(baro, convertMetersToFeet(response.properties.elevation.value), tempC);
                console.log(densityAlt);

                if (isNaN(densityAlt)) {
                    densityAlt = "Not Reported";
                } else {
                    densityAlt = densityAlt.toLocaleString();
                }
                console.log("Density Altitude: " + densityAlt);

                let icon = getIcon(description);
                console.log(icon);

                $(resultsSelector + " .weatherIcon").html(icon);
                $(resultsSelector + " .weatherDesc").html(description.toUpperCase());
                $(resultsSelector + " .airportCode").html(station.station);
                $(resultsSelector + " .airportFullName").html(station.name);
                $(resultsSelector + " .timeStamp").html("Reported: " + reportTimeFromNow);
                $(resultsSelector + " .flightCat").html("<button class='" + flightCat + "'>" + flightCat + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + "</button>");
                $(resultsSelector + " .tempC").html(tempC + " &#8451;");
                $(resultsSelector + " .tempF").html(tempF + " &#8457;");
                $(resultsSelector + " .staticWindDir").html(windDir);
                $(resultsSelector + " .staticWindSpeed").html(windSpeed + " mph");
                $(resultsSelector + " .visibility").html("Visibility: " + visibility + " sm");
                $(resultsSelector + " .cloudLayer").html("Cloud layers here");
                $(resultsSelector + " .gMaps").html("Tom's maps here");


                // Create the Point A Compass
                const compass = new RadialGauge({
                    renderTo: 'compass' + letter,
                    width: 150,
                    height: 150,
                    units: 'degrees',
                    title: 'Wind Direction',
                    value: 0,
                    minValue: 0,
                    maxValue: 360,
                    majorTicks: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'],
                    minorTicks: 11,
                    ticksAngle: 360,
                    startAngle: 180,
                    strokeTicks: false,
                    colorPlate: '#fff',
                    colorMajorTicks: '#f5f5f5',
                    colorMinorTicks: '#ddd',
                    colorNumbers: '#ccc',
                    colorCircleInner: '#fff',
                    colorTitle: '#8f8f8f',
                    colorUnits: '#8f8f8f',
                    highlights: false,
                    needleType: 'arrow',
                    colorNeedle: 'rgba(240, 128, 128, 1)',
                    colorNeedleEnd: 'rgba(255, 160, 122, .9)',
                    colorNeedeShadowDown: '#222',
                    colorNeedleCircleOuter: '#ccc',
                    needleCircleSize: 15,
                    needleCircleOuter: false,
                    valueBox: true,
                    valueTextShadow: 'true',
                    valueInt: 3,
                    valueDec: 0,
                    borders: true,
                    borderInnerWidth: 0,
                    borderMiddleWidth: 0,
                    bordeRouterWidth: 10,
                    colorBordeRouter: '#ccc',
                    colorBordeRouterEnd: '#ccc',
                    borderShadowWidth: 0,

                    animationRule: 'bounce',
                    // animationRule: 'linear',
                    // animationDuration: 500,
                    animationDuration: 1500,
                });

                // Draw the compass in the compass canvas element
                compass.draw();

                // Create the Wind Speed Gauge
                const wind = new RadialGauge({
                    renderTo: 'wind' + letter,
                    width: 150,
                    height: 150,
                    units: 'mph',
                    title: 'Wind Speed',
                    value: 0,
                    minValue: 0,
                    maxValue: 50,
                    majorTicks: ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
                    minorTicks: 5,
                    ticksAngle: 180,
                    startAngle: 90,
                    strokeTicks: true,
                    colorPlate: '#fff',
                    highlights: [
                        { from: 20, to: 50, color: 'rgba(233,130,129, 0.8)' },
                    ],
                    needleType: 'arrow',
                    needleCircleSize: 7,
                    needleCircleOuter: true,
                    needleCircleInner: false,
                    needleWidth: 2,
                    valueBox: true,
                    valueTextShadow: 'true',
                    valueInt: 2,
                    valueDec: 0,
                    borders: false,
                    borderShadowWidth: 0,
                    animationRule: 'linear',
                    animationDuration: 1500,
                });

                // Draw the wind speed in the wind canvas element
                wind.draw();

                // Set the Wind Direction value
                compass.value = windDir;

                // Set the Wind Speed value
                wind.value = windSpeed;


                //     "<button class='" + flightCat + "'>" + flightCat + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" + "</button>",
                //     // " (VFR-Green, MVFR-Blue, IFR-Red, LIFR-Magenta)",
                //     "<span>Reported:</span> ",
                //     // reportTime,
                //     // " - ",
                //     reportTimeFromNow,
                //     "<br>",
                //     "<span>Density Altitude:</span> ",
                //     densityAlt, " ft",
                //     "<br>",
                //     "<span>Coordinates:</span> ",
                //     station.coordinates,
                //     "<br>",
                //     "<span>Field Elevation:</span> ",
                //     fieldElev,
                //     " ft",
                //     "<br>",
                //     "<span>Temperature:</span> ",
                //     tempC,
                //     " &#8451;",
                //     " - ",
                //     tempF,
                //     " &#8457;",
                //     "<br>",
                //     "<span>Dew Point:</span> ",
                //     dewpointC,
                //     " &#8451;",
                //     " - ",
                //     dewpointF,
                //     " &#8451;",
                //     "<br>",
                //     "<span>Dew Point Spread:</span> ",
                //     dewPointSpread,
                //     " &#8457;",
                //     "<br>",
                //     "<span>Barometric Pressure:</span> ",
                //     baro,
                //     " inHg",
                //     "<br>",
                //     "<span>Wind Speed:</span> ",
                //     windSpeed,
                //     " mph",
                //     "<br>",
                //     "<span>Wind Direction:</span> ",
                //     windDir,
                //     " &deg;",
                //     "<br>",
                //     "<span>Wind Gust:</span> ",
                //     windGust,
                //     " mph",
                // );

                //Check if clouds array has anything in it
                //     if (clouds.length > 0) {
                //         //Cloud Layers returns an array, can have multiple cloud layers
                //         $(resultsSelector).append(
                //             "<span>Cloud Layers: ",
                //         );
                //         for (let i = 0; i < clouds.length; i++) {
                //             $(resultsSelector).append(
                //                 clouds[i].amount,
                //                 " - ",
                //                 Math.round(convertMetersToFeet(clouds[i].base.value)).toLocaleString(),
                //                 " ft",
                //                 " , ",
                //             );
                //         } //End loop through cloud layers

                //         //No Clouds reported
                //     } else {
                //         $(resultsSelector).append(
                //             "<span>Cloud Layers: ",
                //             "Clear Below 12,000 ft",
                //         );
                //     } //End Check if cloud array is populated
            }); //End Get the selected weather info
        } else {
            $(resultsSelector + " .weatherIcon").html("");
            $(resultsSelector + " .weatherDesc").html("");
            $(resultsSelector + " .airportCode").html("");
            $(resultsSelector + " .airportFullName").html("");
            $(resultsSelector + " .timeStamp").html("");
            $(resultsSelector + " .flightCat").html("");
            $(resultsSelector + " .tempC").html("");
            $(resultsSelector + " .tempF").html("");
            $(resultsSelector + " .visibility").html("");
            $(resultsSelector + " .cloudLayer").html("");
            $(resultsSelector + " .gMaps").html("");

            function clearCanvas(canvas) {
                const context = canvas.getContext('2d');
                // Store the current transformation matrix
                context.save();

                // Use the identity matrix while clearing the canvas
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Restore the transform
                context.restore();
            }
            clearCanvas($("#compass" + letter)[0]);
            clearCanvas($("#wind" + letter)[0]);
        }
    }

    function bindChangeHandler(inputSelector, queryParameterName) {
        $(inputSelector).change(function() {
            // When the aiports select changes
            console.log("Airport was Selected.");

            // Get the value of the selected airport and its coordinates
            let station = $(this).val();
            let url = new URL(window.location.href);
            url.searchParams.set(queryParameterName, station);
            // Updates the url parameters in the address bar
            history.pushState({}, "", url.toString());
        });
    }
    bindChangeHandler('#pointAinput', "departure");
    bindChangeHandler('#pointBinput', "arrival");

    $("#submitbtn").on("click", function(event) {
        event.preventDefault();
        const form = document.querySelector('form');
        let departureSelect = $("#pointAinput").val();
        let arrivalSelect = $("#pointBinput").val();

        if (!departureSelect && !arrivalSelect) {
            M.Modal.init(document.querySelector('#validationError'), {}).open(); //Initializing Modal
            return;
        }
        let departureStation = stations[departureSelect];
        let arrivalStation = stations[arrivalSelect];
        if ((departureSelect && !departureStation) || (arrivalSelect && !arrivalStation)) {
            M.Modal.init(document.querySelector('#validationError'), {}).open(); //Initializing Modal
            return;
        }

        doWeatherLookup(departureStation, "A");
        doWeatherLookup(arrivalStation, "B");
        $("#popup").show();

    });


    $(".closeBtn").on("click", function(event) {
        $("#popup").hide();
    });
    // Main Processes
    // *******************************************************



    //Get All the TX airports from the api
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        //console.log(response);
        //console.log(response.features);

        //Get just the features from the response
        let featuresArray = response.features;

        //Create a new sorted array variable
        let sortedStations = [];

        //Push the values to the new array
        for (let i = 0; i < featuresArray.length; i++) {
            // console.log(featuresArray[i].properties.stationIdentifier + " - " + featuresArray[i].properties.name +
            //   " - " + featuresArray[i].geometry.coordinates);
            sortedStations.push({
                station: featuresArray[i].properties.stationIdentifier,
                name: featuresArray[i].properties.name,
                coordinates: featuresArray[i].geometry.coordinates
            });
        } //End create new array from api result

        //Sort the new array by the name of the town
        sortedStations.sort(function(a, b) {
            let a1 = a.name,
                b1 = b.name;
            if (a1 == b1) return 0;
            return a1 > b1 ? 1 : -1;
        }); //End sort airport array



        // Create an object to hold the stations for the autocomplete
        const icao = {};
        stations = {};

        // Loop through sorted array of airports and display airport identifier, name, and coordinates
        for (let i = 0; i < sortedStations.length; i++) {
            // Create the string to put into the autocomplete objectg
            const strStation = `${sortedStations[i].station} - ${sortedStations[i].name}`;

            // Add the stations to the autocomplete object
            icao[strStation] = null;

            stations[strStation] = sortedStations[i];

            //   console.log(
            //     `${sortedStations[i].station} - ${sortedStations[i].name} : ${
            //       sortedStations[i].coordinates
            //     }`,
            // );
        } // End loop through sorted airports

        console.log(icao);

        // const test = {
        //   Apple: null,
        //   Microsoft: 'VS Code',
        //   Google: 'https://placehold.it/250x250',
        // };

        $('input.autocomplete').autocomplete({
            data: icao,
            minLength: 0
                //   Apple: null,
                //   Microsoft: 'VS Code',
                //   Google: 'https://placehold.it/250x250',
        });

        //Loop through sorted array of airports and display airport identifier, name, and coordinates
        for (let i = 0; i < sortedStations.length; i++) {
            console.log(
                sortedStations[i].station +
                " - " +
                sortedStations[i].name +
                " : " +
                sortedStations[i].coordinates
            );
        } //End loop through sorted airports

        // Check departure and arrival URL parameters and prefill the form
        let url = new URL(window.location.href);
        let departure = url.searchParams.get('departure');
        if (departure) {
            $('#pointAinput').val(departure);
        }
        let arrival = url.searchParams.get('arrival');
        if (arrival) {
            $('#pointBinput').val(arrival);
        }
        M.updateTextFields();
        // If either or both departure and arrival were specified, then simulate click on submit button
        if (departure || arrival) {
            $('#submitbtn').click();
        }
    });

    // Pseudocode
    // 1. Get all the airports in TX with there station identifier, name, and coordinates
    // 2. Put those airports in a select
    // 3. Choose an airport from the select element, get that value, send to the api to get the latest weather observation
    // 4. Display info on the page

    // ToDos
    // Need to convert units
    // Need to calculate density altitude
    // Pressure altitude = (29.92 - current altimeter) x 1,000 + field elevation in feet
    // Let’s say our current altimeter setting is 29.45 and the field elevation is 5,000 feet.
    // That means Pressure Altitude = (29.92 - 29.45) x 1,000 + 5,000 = 5,470 feet.
    // OAT is degrees Celsius read off our thermometer (let’s say it’s a balmy 35 °C today) and ISA Temp is always 15 °C at sea level
    // Density altitude = pressure altitude + [120 x (OAT in Celsius - ISA Temp in deg celsius)]
    // Calculate ISA Temp:
    // The first step is to check what the standard (ISA) temperature is for your chosen altitude.
    // Remember that according to ISA, the temperature will decrease by 1.98°C per 1000ft from mean sea level (MSL).
    // For practical, and exam purposes, we can safely use a 2°C decrease per 1000ft that we climb.
    // So, as an example, if the chosen altitude is 8000ft then we calculate it like this:
    // 5 x -2 = -10 now add +15 (15 is the ISA temperature at MSL) = 5°C
    // Density altitude = 5,470 + [120 x (35 - 5)] = 9070
}); // End Document Ready

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, {});
});