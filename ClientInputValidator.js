var TechnicalConfig = require('./config/Technical.js');
var GameplayConfig = require('./config/Gameplay');
var vMath = require('./VectorMath.js');

module.exports.validateInput = function (key, old_value, new_value, delta)
{
  if(key == "id")
    return false;
  if(key == "pos")
  {
    //Collision detection

    //Speed detection
    if(vMath.len(vMath.sub(new_value, old_value)) > GameplayConfig.movementSpeed * delta * 1.3)
      return false;
  }

  //Todo: More Restrictions

  //No one complais -> good
  return true;
}