/**
 * @license
 * Copyright 2013 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Bird game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Bird');

goog.require('Bird.Blocks');
goog.require('Bird.soy');
goog.require('Blockly.Trashcan');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.Coordinate');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.style');
goog.require('Blockly.VerticalFlyout');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');

var Drone = Bird
BlocklyGames.NAME = 'drone';

/**
 * Milliseconds between each animation frame.
 */
Drone.stepSpeed;

Drone.BIRD_ICON_SIZE = 120;
Drone.NEST_ICON_SIZE = 100;
Drone.WORM_ICON_SIZE = 70;
Drone.MAP_SIZE = 400;
Drone.WALL_THICKNESS = 10;

/**
 * Object representing a line.
 * Copied from goog.math.Line
 * @param {number} x0 X coordinate of the start point.
 * @param {number} y0 Y coordinate of the start point.
 * @param {number} x1 X coordinate of the end point.
 * @param {number} y1 Y coordinate of the end point.
 * @struct
 * @final
 * @constructor
 */
Drone.Line = function(x0, y0, x1, y1) {
  /**
   * X coordinate of the first point.
   * @type {number}
   */
  this.x0 = x0;

  /**
   * Y coordinate of the first point.
   * @type {number}
   */
  this.y0 = y0;

  /**
   * X coordinate of the first control point.
   * @type {number}
   */
  this.x1 = x1;

  /**
   * Y coordinate of the first control point.
   * @type {number}
   */
  this.y1 = y1;
};

/**
 * Compute the distance between this line segment and the given coordinate.
 * @param {!Blockly.utils.Coordinate} xy Point to measure from.
 * @return {number} Distance from point to closest point on line segment.
 */
Drone.Line.prototype.distance = function(xy) {
  var a = xy.x - this.x0;
  var b = xy.y - this.y0;
  var c = this.x1 - this.x0;
  var d = this.y1 - this.y0;

  var dot = a * c + b * d;
  var lenSq = c * c + d * d;
  var param = lenSq ? dot / lenSq : -1;

  var closestPoint;
  if (param < 0) {
    closestPoint = new Blockly.utils.Coordinate(this.x0, this.y0);
  } else if (param > 1) {
    closestPoint = new Blockly.utils.Coordinate(this.x1, this.y1);
  } else {
    closestPoint =
        new Blockly.utils.Coordinate(this.x0 + param * c, this.y0 + param * d);
  }
  return Blockly.utils.Coordinate.distance(xy, closestPoint);
};

Drone.MAP = [
  // Level 0.
  undefined,
  // Level 1.
  {
    start: new Blockly.utils.Coordinate(20, 20),
    startAngle: 90,
    worm: new Blockly.utils.Coordinate(50, 50),
    nest: new Blockly.utils.Coordinate(80, 80),
    walls: []
  },
  // Level 2.
  {
    start: new Blockly.utils.Coordinate(20, 20),
    startAngle: 0,
    worm: new Blockly.utils.Coordinate(80, 20),
    nest: new Blockly.utils.Coordinate(80, 80),
    walls: [new Drone.Line(0, 50, 60, 50)]
  },
  // Level 3.
  {
    start: new Blockly.utils.Coordinate(20, 70),
    startAngle: 270,
    worm: new Blockly.utils.Coordinate(50, 20),
    nest: new Blockly.utils.Coordinate(80, 70),
    walls: [new Drone.Line(50, 50, 50, 100)]
  },
  // Level 4.
  {
    start: new Blockly.utils.Coordinate(20, 80),
    startAngle: 0,
    worm: null,
    nest: new Blockly.utils.Coordinate(80, 20),
    walls: [new Drone.Line(0, 0, 65, 65)]
  },
  // Level 5.
  {
    start: new Blockly.utils.Coordinate(80, 80),
    startAngle: 270,
    worm: null,
    nest: new Blockly.utils.Coordinate(20, 20),
    walls: [new Drone.Line(0, 100, 65, 35)]
  },
  // Level 6.
  {
    start: new Blockly.utils.Coordinate(20, 40),
    startAngle: 0,
    worm: new Blockly.utils.Coordinate(80, 20),
    nest: new Blockly.utils.Coordinate(20, 80),
    walls: [new Drone.Line(0, 59, 50, 59)]
  },
  // Level 7.
  {
    start: new Blockly.utils.Coordinate(80, 80),
    startAngle: 180,
    worm: new Blockly.utils.Coordinate(80, 20),
    nest: new Blockly.utils.Coordinate(20, 20),
    walls: [
      new Drone.Line(0, 70, 40, 70),
      new Drone.Line(70, 50, 100, 50)
    ]
  },
  // Level 8.
  {
    start: new Blockly.utils.Coordinate(20, 25),
    startAngle: 90,
    worm: new Blockly.utils.Coordinate(80, 25),
    nest: new Blockly.utils.Coordinate(80, 75),
    walls: [
      new Drone.Line(50, 0, 50, 25),
      new Drone.Line(75, 50, 100, 50),
      new Drone.Line(50, 100, 50, 75),
      new Drone.Line(0, 50, 25, 50)
    ]
  },
  // Level 9.
  {
    start: new Blockly.utils.Coordinate(80, 70),
    startAngle: 180,
    worm: new Blockly.utils.Coordinate(20, 20),
    nest: new Blockly.utils.Coordinate(80, 20),
    walls: [
      new Drone.Line(0, 69, 31, 100),
      new Drone.Line(40, 50, 71, 0),
      new Drone.Line(80, 50, 100, 50)
    ]
  },
  // Level 10.
  {
    start: new Blockly.utils.Coordinate(20, 20),
    startAngle: 90,
    worm: new Blockly.utils.Coordinate(80, 50),
    nest: new Blockly.utils.Coordinate(20, 20),
    walls: [
      new Drone.Line(40, 60, 60, 60),
      new Drone.Line(40, 60, 60, 30),
      new Drone.Line(60, 30, 100, 30)
    ]
  }
][BlocklyGames.LEVEL];

/**
 * PIDs of animation tasks currently executing.
 */
Drone.pidList = [];

/**
 * Behaviour for the Drone.
 * @enum {number}
 */
Drone.Pose = {
  SOAR: 1,
  FLAP: 2,
  SIT: 3
};

/**
 * Create and layout all the nodes for the walls, nest, worm, and Drone.
 */
Drone.drawMap = function() {
  var svg = document.getElementById('svgBird');

  // Add four surrounding walls.
  var edge0 = -Drone.WALL_THICKNESS / 2;
  var edge1 = 100 + Drone.WALL_THICKNESS / 2;
  Drone.MAP.walls.push(
      new Drone.Line(edge0, edge0, edge0, edge1),
      new Drone.Line(edge0, edge1, edge1, edge1),
      new Drone.Line(edge1, edge1, edge1, edge0),
      new Drone.Line(edge1, edge0, edge0, edge0));

  // Draw the walls.
  for (var i = 0, wall; (wall = Drone.MAP.walls[i]); i++) {
    Blockly.utils.dom.createSvgElement('line', {
        'x1': wall.x0 / 100 * Drone.MAP_SIZE,
        'y1': (1 - wall.y0 / 100) * Drone.MAP_SIZE,
        'x2': wall.x1 / 100 * Drone.MAP_SIZE,
        'y2': (1 - wall.y1 / 100) * Drone.MAP_SIZE,
        'stroke': '#CCB',
        'stroke-width': Drone.WALL_THICKNESS,
        'stroke-linecap': 'round'
      }, svg);
  }

  // Add nest.
  var nestImage = Blockly.utils.dom.createSvgElement('image', {
      'id': 'nest',
      'height': Drone.NEST_ICON_SIZE,
      'width': Drone.NEST_ICON_SIZE
    }, svg);
  nestImage.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
      'bird/nest.png');

  // Add worm.
  if (Drone.MAP.worm) {
    var wormImage = Blockly.utils.dom.createSvgElement('image', {
        'id': 'worm',
        'height': Drone.WORM_ICON_SIZE,
        'width': Drone.WORM_ICON_SIZE
      }, svg);
    wormImage.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        'bird/package.png');
  }

  // Bird's clipPath element, whose (x, y) is reset by Drone.displayBird
  var birdClip = Blockly.utils.dom.createSvgElement('clipPath', {
      'id': 'birdClipPath'
    }, svg);
  Blockly.utils.dom.createSvgElement('rect', {
      'id': 'clipRect',
      'height': Drone.BIRD_ICON_SIZE,
      'width': Drone.BIRD_ICON_SIZE
    }, birdClip);

  // Add Drone.
  var droneIcon = Blockly.utils.dom.createSvgElement('image', {
      'id': 'bird',
      'height': Drone.BIRD_ICON_SIZE,
      'width': Drone.BIRD_ICON_SIZE,
      'clip-path': 'url(#birdClipPath)'
    }, svg);
  droneIcon.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
      'bird/transparentdrone.png');

  // Draw the outer square.
  Blockly.utils.dom.createSvgElement('rect', {
      'class': 'edges',
      'height': Drone.MAP_SIZE,
      'width': Drone.MAP_SIZE
    }, svg);

  var xAxis = BlocklyGames.LEVEL > 3;
  var yAxis = BlocklyGames.LEVEL > 4;

  var TICK_LENGTH = 9;
  var major = 1;
  for (var i = 0.1; i < 0.9; i += 0.1) {
    if (xAxis) {
      // Bottom edge.
      Blockly.utils.dom.createSvgElement('line', {
          'class': 'edges',
          'x1': i * Drone.MAP_SIZE,
          'y1': Drone.MAP_SIZE,
          'x2': i * Drone.MAP_SIZE,
          'y2': Drone.MAP_SIZE - TICK_LENGTH * major
        }, svg);
    }
    if (yAxis) {
      // Left edge.
      Blockly.utils.dom.createSvgElement('line', {
          'class': 'edges',
          'x1': 0,
          'y1': i * Drone.MAP_SIZE,
          'x2': i * TICK_LENGTH * major,
          'y2': i * Drone.MAP_SIZE
        }, svg);
    }
    if (major == 2) {
      if (xAxis) {
        // X axis.
        var number = Blockly.utils.dom.createSvgElement('text', {
            'class': 'edgeX',
            'x': i * Drone.MAP_SIZE + 2,
            'y': Drone.MAP_SIZE - 4
          }, svg);
        number.appendChild(document.createTextNode(Math.round(i * 100)));
      }
      if (yAxis) {
        // Y axis.
        var number = Blockly.utils.dom.createSvgElement('text', {
            'class': 'edgeY',
            'x': 3,
            'y': i * Drone.MAP_SIZE - 2
          }, svg);
        number.appendChild(document.createTextNode(Math.round(100 - i * 100)));
      }
    }
    major = major == 1 ? 2 : 1;
  }
};

/**
 * Initialize Blockly and the Drone.  Called on page load.
 */
Drone.init = function() {
  // Render the Soy template.
  document.body.innerHTML = Drone.soy.start({}, null,
      {lang: BlocklyGames.LANG,
       level: BlocklyGames.LEVEL,
       maxLevel: BlocklyGames.MAX_LEVEL,
       html: BlocklyGames.IS_HTML});

  BlocklyInterface.init();

  var rtl = BlocklyGames.isRtl();
  var blocklyDiv = document.getElementById('blockly');
  var visualization = document.getElementById('visualization');
  var onresize = function(_e) {
    var top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
  };
  window.addEventListener('scroll', function() {
    onresize(null);
    Blockly.svgResize(BlocklyInterface.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  BlocklyInterface.injectBlockly(
      {'rtl': rtl,
       'trashcan': true});
  BlocklyInterface.workspace.getAudioManager().load(
      ['bird/quack.ogg', 'bird/quack.mp3'], 'quack');
  BlocklyInterface.workspace.getAudioManager().load(
      ['bird/whack.mp3', 'bird/whack.ogg'], 'whack');
  BlocklyInterface.workspace.getAudioManager().load(
      ['bird/worm.mp3', 'bird/worm.ogg'], 'worm');
  if (BlocklyGames.LEVEL > 1) {
    BlocklyInterface.workspace.addChangeListener(Blockly.Events.disableOrphans);
  }
  // Not really needed, there are no user-defined functions or variables.
  Blockly.JavaScript.addReservedWords('noWorm,heading,getX,getY');

  Drone.drawMap();

  var defaultXml;
  if (BlocklyGames.LEVEL == 1) {
    defaultXml = '<xml><block type="bird_heading" x="70" y="70"></block></xml>';
  } else if (BlocklyGames.LEVEL < 5) {
    defaultXml = '<xml><block type="bird_ifElse" x="70" y="70"></block></xml>';
  } else {
    defaultXml = '<xml><block type="controls_if" x="70" y="70"></block></xml>';
  }
  BlocklyInterface.loadBlocks(defaultXml, false);

  Drone.reset(true);

  BlocklyGames.bindClick('runButton', Drone.runButtonClick);
  BlocklyGames.bindClick('resetButton', Drone.resetButtonClick);

  // Open interactive help.  But wait 5 seconds for the
  // user to think a bit before they are told what to do.
  setTimeout(function() {
    BlocklyInterface.workspace.addChangeListener(function() {Drone.levelHelp();});
    Drone.levelHelp();
  }, 5000);
  if (BlocklyGames.LEVEL > 8) {
    setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
  }

  // Lazy-load the JavaScript interpreter.
  BlocklyInterface.importInterpreter();
  // Lazy-load the syntax-highlighting.
  BlocklyInterface.importPrettify();
};

window.addEventListener('load', Drone.init);

/**
 * PID of task to poll the mutator's state in level 5.
 * @private
 */
Drone.mutatorHelpPid_ = 0;

/**
 * When the workspace changes, update the help as needed.
 */
Drone.levelHelp = function() {
  if (BlocklyInterface.workspace.isDragging()) {
    // Don't change helps during drags.
    return;
  } else if (BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                               BlocklyGames.LEVEL)) {
    // The user has already won.  They are just playing around.
    return;
  }
  var rtl = BlocklyGames.isRtl();
  var userBlocks = Blockly.Xml.domToText(
      Blockly.Xml.workspaceToDom(BlocklyInterface.workspace));
  var toolbar = BlocklyInterface.workspace.flyout_.workspace_.getTopBlocks(true);
  var content = document.getElementById('dialogHelp');
  var origin = null;
  var style = null;
  if (BlocklyGames.LEVEL == 1) {
    if ((userBlocks.indexOf('>90<') != -1 ||
        userBlocks.indexOf('bird_heading') == -1) &&
        !Blockly.WidgetDiv.isVisible()) {
      // style = {'width': '370px', 'top': '140px'};
      // style[rtl ? 'right' : 'left'] = '215px';
      var blocks = BlocklyInterface.workspace.getTopBlocks(true);
      if (blocks.length) {
        origin = blocks[0].getSvgRoot();
      } else {
        origin = toolbar[0].getSvgRoot();
      }
    }
  } else if (BlocklyGames.LEVEL == 2) {
    if (userBlocks.indexOf('bird_noWorm') == -1) {
      // style = {'width': '350px', 'top': '170px'};
      // style[rtl ? 'right' : 'left'] = '180px';
      origin = toolbar[1].getSvgRoot();
    }
  } else if (BlocklyGames.LEVEL == 4) {
    if (userBlocks.indexOf('bird_compare') == -1) {
      // style = {'width': '350px', 'top': '230px'};
      // style[rtl ? 'right' : 'left'] = '180px';
      origin = toolbar[2].getSvgRoot();
    }
  } else if (BlocklyGames.LEVEL == 5) {
    if (!Drone.mutatorHelpPid_) {
      // Keep polling the mutator's state.
      Drone.mutatorHelpPid_ = setInterval(Drone.levelHelp, 100);
    }
    if (userBlocks.indexOf('mutation else') == -1) {
      var blocks = BlocklyInterface.workspace.getTopBlocks(false);
      for (var i = 0, block; (block = blocks[i]); i++) {
        if (block.type == 'controls_if') {
          break;
        }
      }
      if (!block.mutator.isVisible()) {
        var xy = Blockly.utils.style.getPageOffset(block.getSvgRoot());
        // style = {'width': '340px', 'top': (xy.y + 100) + 'px'};
        // style.left = (xy.x - (rtl ? 280 : 0)) + 'px';
        origin = block.getSvgRoot();
      } else {
        content = document.getElementById('dialogMutatorHelp');
        // Second help box should be below the 'else' block in the mutator.
        // Really fragile code.  There is no public API for this.
        origin = block.mutator.workspace_.flyout_.mats_[1];
        var xy = Blockly.utils.style.getPageOffset(origin);
        // style = {'width': '340px', 'top': (xy.y + 60) + 'px'};
        // style.left = (xy.x - (rtl ? 310 : 0)) + 'px';
      }
    }
  } else if (BlocklyGames.LEVEL == 6) {
    if (userBlocks.indexOf('mutation') == -1) {
      var blocks = BlocklyInterface.workspace.getTopBlocks(false);
      for (var i = 0, block; (block = blocks[i]); i++) {
        if (block.type == 'controls_if') {
          break;
        }
      }
      var xy = Blockly.utils.style.getPageOffset(block.getSvgRoot());
      // style = {'width': '350px', 'top': (xy.y + 220) + 'px'};
      // style.left = (xy.x - (rtl ? 350 : 0)) + 'px';
      origin = block.getSvgRoot();
    }
  } else if (BlocklyGames.LEVEL == 8) {
    if (userBlocks.indexOf('bird_and') == -1) {
      // style = {'width': '350px', 'top': '360px'};
      // style[rtl ? 'right' : 'left'] = '450px';
      origin = toolbar[4].getSvgRoot();
    }
  }
  if (style) {
    if (content.parentNode != document.getElementById('dialog')) {
      BlocklyDialogs.showDialog(content, origin, true, false, style, null);
    }
  } else {
    BlocklyDialogs.hideDialog(false);
  }
};

/**
 * Reset the bird to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Drone.reset = function(first) {
  // Kill all tasks.
  for (var i = 0; i < Drone.pidList.length; i++) {
    clearTimeout(Drone.pidList[i]);
  }
  Drone.pidList = [];

  // Move Bird into position.
  Drone.pos = new Blockly.utils.Coordinate(Drone.MAP.start.x, Drone.MAP.start.y);
  Drone.angle = Drone.MAP.startAngle;
  Drone.currentAngle = Drone.angle;
  Drone.hasWorm = !Drone.MAP.worm;
  if (first) {
    // Opening animation.
    Drone.displayBird(Drone.Pose.SIT);
    Drone.pidList.push(setTimeout(function() {
      Drone.displayBird(Drone.Pose.FLAP);
      Drone.pidList.push(setTimeout(function() {
        Drone.displayBird(Drone.Pose.SOAR);
      }, 400));
    }, 400));
  } else {
    Drone.displayBird(Drone.Pose.SOAR);
  }


  // Move the worm into position.
  var image = document.getElementById('worm');
  if (image) {
    image.setAttribute('x',
        Drone.MAP.worm.x / 100 * Drone.MAP_SIZE - Drone.WORM_ICON_SIZE / 2);
    image.setAttribute('y',
        (1 - Drone.MAP.worm.y / 100) * Drone.MAP_SIZE - Drone.WORM_ICON_SIZE / 2);
    image.style.visibility = 'visible';
  }
  // Move the nest into position.
  var image = document.getElementById('nest');
  image.setAttribute('x',
      Drone.MAP.nest.x / 100 * Drone.MAP_SIZE - Drone.NEST_ICON_SIZE / 2);
  image.setAttribute('y',
      (1 - Drone.MAP.nest.y / 100) * Drone.MAP_SIZE - Drone.NEST_ICON_SIZE / 2);
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Drone.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  Drone.reset(false);
  Drone.execute();
};

/**
 * Click the reset button.  Reset the Drone.
 * @param {!Event} e Mouse or touch event.
 */
Drone.resetButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  BlocklyInterface.workspace.highlightBlock(null);
  Drone.reset(false);
};

/**
 * Outcomes of running the user program.
 */
Drone.ResultType = {
  UNSET: 0,
  SUCCESS: 1,
  FAILURE: -1,
  TIMEOUT: 2,
  ERROR: -2
};

/**
 * Inject the Bird API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS Interpreter.
 * @param {!Interpreter.Object} scope Global scope.
 */
Drone.initInterpreter = function(interpreter, scope) {
  // API
  var wrapper;
  wrapper = function(angle, id) {
    Drone.heading(angle, id);
  };
  interpreter.setProperty(scope, 'heading',
      interpreter.createNativeFunction(wrapper));
  wrapper = function() {
    return !Drone.hasWorm;
  };
  interpreter.setProperty(scope, 'noWorm',
      interpreter.createNativeFunction(wrapper));
  wrapper = function() {
    return Drone.pos.x;
  };
  interpreter.setProperty(scope, 'getX',
      interpreter.createNativeFunction(wrapper));
  wrapper = function() {
    return Drone.pos.y;
  };
  interpreter.setProperty(scope, 'getY',
      interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Drone.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(Drone.execute, 250);
    return;
  }

  Drone.log = [];
  Blockly.selected && Blockly.selected.unselect();
  var code = BlocklyInterface.getJsCode();
  var start = code.indexOf('if (');
  var end = code.indexOf('}\n');
  if (start != -1 && end != -1) {
    // Ugly hack: if there is an 'if' statement, ignore isolated heading blocks.
    code = code.substring(start, end + 2);
  }
  code = 'while(true) {\n' +
      code +
      '}';
  var result = Drone.ResultType.UNSET;
  var interpreter = new Interpreter(code, Drone.initInterpreter);

  // Try running the user's code.  There are four possible outcomes:
  // 1. If bird reaches the finish [SUCCESS], true is thrown.
  // 2. If the program is terminated due to running too long [TIMEOUT],
  //    false is thrown.
  // 3. If another error occurs [ERROR], that error is thrown.
  // 4. If the program ended normally but without finishing [FAILURE],
  //    no error or exception is thrown.
  try {
    var ticks = 100000;  // 100k ticks runs Bird for about 3 minutes.
    while (interpreter.step()) {
      if (ticks-- <= 0) {
        throw Infinity;
      }
    }
    result = Drone.ResultType.FAILURE;
  } catch (e) {
    // A boolean is thrown for normal termination.
    // Abnormal termination is a user error.
    if (e === Infinity) {
      result = Drone.ResultType.TIMEOUT;
    } else if (e === true) {
      result = Drone.ResultType.SUCCESS;
    } else if (e === false) {
      result = Drone.ResultType.ERROR;
    } else {
      // Syntax error, can't happen.
      result = Drone.ResultType.ERROR;
      window.alert(e);
    }
  }

  // Fast animation if execution is successful.  Slow otherwise.
  Drone.stepSpeed = (result == Drone.ResultType.SUCCESS) ? 10 : 15;

  // Drone.log now contains a transcript of all the user's actions.
  // Reset the bird and animate the transcript.
  Drone.reset(false);
  Drone.pidList.push(setTimeout(Drone.animate, 1));
};

/**
 * Iterate through the recorded path and animate the bird's actions.
 */
Drone.animate = function() {
  // All tasks should be complete now.  Clean up the PID list.
  Drone.pidList = [];

  var action = Drone.log.shift();
  if (!action) {
    BlocklyInterface.highlight(null);
    return;
  }
  BlocklyInterface.highlight(action.pop());

  if (action[0] == 'move' || action[0] == 'goto') {
    Drone.pos.x = action[1];
    Drone.pos.y = action[2];
    Drone.angle = action[3];
    Drone.displayBird(action[0] == 'move' ? Drone.Pose.FLAP : Drone.Pose.SOAR);
  } else if (action[0] == 'worm') {
    var worm = document.getElementById('worm');
    worm.style.visibility = 'hidden';
  } else if (action[0] == 'finish') {
    Drone.displayBird(Drone.Pose.SIT);
    BlocklyInterface.saveToLocalStorage();
    BlocklyDialogs.congratulations();
  } else if (action[0] == 'play') {
    BlocklyInterface.workspace.getAudioManager().play(action[1], 0.5);
  }

  Drone.pidList.push(setTimeout(Drone.animate, Drone.stepSpeed * 5));
};

/**
 * Display bird at the current location, facing the current angle.
 * @param {!Drone.Pose} pose Set new pose.
 */
Drone.displayBird = function(pose) {
  var diff = BlocklyGames.normalizeAngle(Drone.currentAngle + Drone.angle);
  if (diff > 180) {
    diff -= 360;
  }
  // var step = 10;
  // if (Math.abs(diff) <= step) {
  //   Drone.currentAngle = Drone.angle;
  // } else {
  //   Drone.currentAngle = BlocklyGames.normalizeAngle(Drone.currentAngle +
  //       (diff < 0 ? step : -step));
  // }
  // // Divide into 12 quads.
  // var quad = (14 - Math.round(Drone.currentAngle / 360 * 12)) % 12;
  // var quadAngle = 360 / 12;  // 30.
  // var remainder =  % quadAngle;
  // if (remainder >= quadAngle / 2) {
  //   remainder -= quadAngle;
  // }
  // remainder *= -1;

  // var row;
  // if (pose == Drone.Pose.SOAR) {
  //   row = 0;
  // } else if (pose == Drone.Pose.SIT) {
  //   row = 3;
  // } else if (pose == Drone.Pose.FLAP) {
  //   row = Math.round(Date.now() / Drone.FLAP_SPEED) % 3;
  // } else {
  //   throw Error('Unknown pose.');
  // }
  // row = 0;
  // quad = 0;
  var x = Drone.pos.x / 100 * Drone.MAP_SIZE - Drone.BIRD_ICON_SIZE / 2;
  var y = (1 - Drone.pos.y / 100) * Drone.MAP_SIZE - Drone.BIRD_ICON_SIZE / 2;
  var droneIcon = document.getElementById('bird');
  droneIcon.setAttribute('x', x);
  droneIcon.setAttribute('y', y);
  droneIcon.setAttribute('transform', 'rotate(' + diff + ', ' +
      (x + Drone.BIRD_ICON_SIZE / 2) + ', ' +
      (y + Drone.BIRD_ICON_SIZE / 2) + ')');

  var clipRect = document.getElementById('clipRect');
  clipRect.setAttribute('x', x);
  clipRect.setAttribute('y', y);
};

/**
 * Has the bird intersected the nest?
 * @return {boolean} True if the bird found the nest, false otherwise.
 */
Drone.intersectNest = function() {
  var accuracy = 0.5 * Drone.BIRD_ICON_SIZE / Drone.MAP_SIZE * 100;
  return Blockly.utils.Coordinate.distance(Drone.pos, Drone.MAP.nest) < accuracy;
};

/**
 * Has the bird intersected the worm?
 * @return {boolean} True if the bird found the worm, false otherwise.
 */
Drone.intersectWorm = function() {
  if (Drone.MAP.worm) {
    var accuracy = 0.5 * Drone.BIRD_ICON_SIZE / Drone.MAP_SIZE * 100;
    return Blockly.utils.Coordinate.distance(Drone.pos, Drone.MAP.worm) < accuracy;
  }
  return false;
};

/**
 * Has the bird intersected a wall?
 * @return {boolean} True if the bird hit a wall, false otherwise.
 */
Drone.intersectWall = function() {
  var accuracy = 0.2 * Drone.BIRD_ICON_SIZE / Drone.MAP_SIZE * 100;
  for (var i = 0, wall; (wall = Drone.MAP.walls[i]); i++) {
    if (wall.distance(Drone.pos) < accuracy) {
      return true;
    }
  }
  return false;
};

/**
 * Move the bird to the given point.
 * @param {!Blockly.utils.Coordinate} p Coordinate of point.
 */
Drone.gotoPoint = function(p) {
  var steps = Math.round(Blockly.utils.Coordinate.distance(Drone.pos, p));
  var angleDegrees = Drone.pointsToAngle(Drone.pos.x, Drone.pos.y, p.x, p.y);
  var angleRadians = Blockly.utils.math.toRadians(angleDegrees);
  for (var i = 0; i < steps; i++) {
    Drone.pos.x += Math.cos(angleRadians);
    Drone.pos.y += Math.sin(angleRadians);
    Drone.log.push(['goto', Drone.pos.x, Drone.pos.y, angleDegrees, null]);
  }
};

/**
 * Computes the angle between two points (x1,y1) and (x2,y2).
 * Angle zero points in the +X direction, 90 degrees points in the +Y
 * direction (down) and from there we grow clockwise towards 360 degrees.
 * Copied from Closure's goog.math.angle.
 * @param {number} x1 x of first point.
 * @param {number} y1 y of first point.
 * @param {number} x2 x of second point.
 * @param {number} y2 y of second point.
 * @return {number} Standardized angle in degrees of the vector from
 *     x1,y1 to x2,y2.
 */
Drone.pointsToAngle = function(x1, y1, x2, y2) {
  var angle = Blockly.utils.math.toDegrees(Math.atan2(y2 - y1, x2 - x1));
  return BlocklyGames.normalizeAngle(angle);
};

/**
 * Attempt to move the bird in the specified direction.
 * @param {number} angle Direction to move (0 = east, 90 = north).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the nest is reached.
 * @throws {false} If the bird collides with a wall.
 */
Drone.heading = function(angle, id) {
  var angleRadians = Blockly.utils.math.toRadians(angle);
  Drone.pos.x += Math.cos(angleRadians);
  Drone.pos.y += Math.sin(angleRadians);
  Drone.angle = angle;
  Drone.log.push(['move', Drone.pos.x, Drone.pos.y, Drone.angle, id]);
  if (Drone.hasWorm && Drone.intersectNest()) {
    // Finished.  Terminate the user's program.
    Drone.log.push(['play', 'quack', null]);
    Drone.gotoPoint(Drone.MAP.nest);
    Drone.log.push(['finish', null]);
    throw true;
  }
  if (!Drone.hasWorm && Drone.intersectWorm()) {
    Drone.gotoPoint(Drone.MAP.worm);
    Drone.log.push(['worm', null]);
    Drone.log.push(['play', 'worm', null]);
    Drone.hasWorm = true;
  }
  if (Drone.intersectWall()) {
    Drone.log.push(['play', 'whack', null]);
    throw false;
  }
};
