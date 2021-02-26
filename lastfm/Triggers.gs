/****************************************************************************************************************************************
*
* Check the trigger to see if it needs to be changed
*
* @params scriptProperties {Object} Current properties of script, persists per session until overwritten
* @params wait {String} How long are we waiting, a minute or a day?
*
****************************************************************************************************************************************/

function checkTrigger(scriptProperties, wait) {

  // Declare variables
  var howLong = scriptProperties.getProperty("wait");

  // if prop doesn't exist, set equal to current prop and do nothing else
  if ((howLong == null)) {    
    console.log("Prop does not exist, updating to " + wait);
  } else if (howLong == wait) {
    // If they match, do nothing
    console.log("Wait prop " + wait + " matches");
  } else {
    console.log("Prop value " + howLong + " does not match with wait request for " + wait);
    // Determine what to do based on newest wait request
    deleteTriggers();
    if (wait == "minute") {      
      // If API limit has not been reached, run script every minute
      ScriptApp.newTrigger('primaryFunction').timeBased().everyMinutes(1).create();
    } else if (wait == "day") {
      //    Create trigger to run after 24 hours to allow API limit time to refresh
      ScriptApp.newTrigger('primaryFunction').timeBased().everyDays(1).create();
    }
    console.log("Set wait prop to " + wait);
  }

// Update prop
  scriptProperties.setProperty("wait", wait);  
}

/****************************************************************************************************************************************
*
* Deletes all triggers in the current project so we don't repeat trigger
*
****************************************************************************************************************************************/
function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  console.log("Deleted trigger(s)");
}
