/*
 * jQuery auto-color plugin 3.20
 *
 * Copyright (c) 2018-2024 Michael Daum http://michaeldaumconsulting.com
 *
 * Licensed under the GPL license http://www.gnu.org/licenses/gpl.html
 *
 */

"use strict";
(function($) {


  // Create the defaults once
  var defaults = {
        text: undefined,
        source: undefined,
        sourceContext: undefined,
        target: undefined,
        property: undefined, 
        saturation: [50,65,80],
        lightness:  [35,50,65,80],
        hueFrom: 0,
        hueTo: 359,
        light: '#fff',
        dark: '#222',
        seed: '0',
        shiftColor: [-10, -10, -20]
      };

  // The actual plugin constructor 
  function AutoColor(elem, opts) { 
    var self = this;

    self.elem = $(elem); 

    // gather opts by merging global defaults, plugin defaults and element defaults
    self.opts = $.extend({}, defaults, self.elem.data(), opts); 

    if (typeof(self.opts.text) === 'undefined' || self.opts.text === "") {
      if (typeof(self.opts.source) === 'undefined') {
        self.sourceElem = self.elem;
      } else {
        if (typeof(self.opts.sourceContext) === 'undefined') {
          self.sourceElem = $(self.opts.source);
        } else {
          if (self.opts.sourceContext === 'this') {
            self.sourceElem = self.elem.find(self.opts.source);
          } else {
            self.sourceElem = $(self.opts.sourceContext).find(self.opts.source);
          }
        }
      }
      self.sourceElem.on("input", function() {
        self.init();
      });
    }

    self.init(); 
  } 

  AutoColor.prototype.config = function(opts) {
    var self = this;

    $.extend(self.opts, opts);
    self.init();
  };

  AutoColor.prototype.init = function () {
    var self = this, text, hsl;

    if (typeof(self.opts.text) === 'string' && self.opts.text !== "") {
      text = self.opts.text;

    } else {
      text = $.map(self.sourceElem, function(elem) { 
        var $elem = $(elem), text;
        if ($elem.is("input")) {
          text = $elem.val(); 
        } else {
          text = $elem.text(); 
        }
        text = text.trim()
        if (text !== '') {
          return text;
        }
      }).join(" ");
    }

    if (typeof(self.opts.target) !== 'undefiend') {
      self.target = self.elem.find(self.opts.target);
    } 

    if (typeof(self.target) === 'undefined' || self.target.length == 0) {
      self.target = self.elem;
    }

    text = text.replace(/^\s*|\s*$/g, "");

    if (!text.length) {
      console.warn("no text found to auto-color");
      return;
    }

    hsl = self.getHSL(text);

    //console.log("text=",text,"hash=",self.getHash(text),"hue=",self.getHue(self.getHash(text)));

    if (self.opts.property && self.opts.property !== 'background') {
      if (self.opts.property === 'radial-gradient') {
        self.target
          .css("background-image", "radial-gradient(circle farthest-side at 33%,$color1 0,$color2 100%)"
                .replace("$color1", self.formatHSL(hsl))
                .replace("$color2", self.formatHSL(self.shiftColor(hsl)))
              )
          .css("color", self.getMatchingForeground(hsl));
      } else {
        self.target.css(self.opts.property, self.formatHSL(hsl));
      }
    } else {
      self.target
        .css("background", self.formatHSL(hsl))
        .css("color", self.getMatchingForeground(hsl));
    }
  }; 

  AutoColor.prototype.getHash = function(text) {
    var self = this, hash = 2, i, len;

    text += self.opts.seed;
    len = text.length;

    for (i = 0; i < len; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return Math.abs(hash);
  };


  AutoColor.prototype.getHue = function(hash) {
    var self = this,
        hue = self.opts.hueFrom + hash % Math.abs(self.opts.hueTo - self.opts.hueFrom);

    //console.log("hash=",hash,"from=",self.opts.hueFrom,"to=",self.opts.hueTo,"hue=",hue);

    return hue;
  };

  AutoColor.prototype.getSaturation = function(hash) {
    var self = this;

    if (typeof(self.opts.saturation) === 'object') {
      return self.opts.saturation[hash % self.opts.saturation.length];
    } 

    return self.opts.saturation;
  };

  AutoColor.prototype.getLightness = function(hash) {
    var self = this;

    if (typeof(self.opts.lightness) === 'object') {
      return self.opts.lightness[hash % self.opts.lightness.length];
    } 

    return self.opts.lightness;
  };

  AutoColor.prototype.getHSL = function(text) {
    var self = this,
        hash = self.getHash(text);

    return [self.getHue(hash), self.getSaturation(hash), self.getLightness(hash)];
  };

  AutoColor.prototype.shiftColor = function(hsl, offset) {
    var self = this, 
        hsl2 = [];

    offset = offset || self.opts.shiftColor;

    //console.log("offset=",offset);

    hsl2[0] = hsl[0] + offset[0];
    hsl2[1] = hsl[1] + offset[1];
    hsl2[2] = hsl[2] + offset[2];
  
    return hsl2;
  };

  AutoColor.prototype.formatHSL = function(hsl) {
    return "hsl("+hsl[0]+","+hsl[1]+"%,"+hsl[2]+"%)";
  };

  AutoColor.prototype.getMatchingForeground = function(hsl) {
    var self = this,
        rgb;

    if (typeof(hsl) === 'undefined') {
      rgb = self.target.css("background-color");
      rgb = rgb.match(/\d+/g);
    } else {
      if (typeof(hsl) !== 'object') {
        hsl = rgb.match(/\d+/g);
      }
      rgb = self.hslToRgb(hsl);
    }

    return self.isLight(rgb) ? self.opts.dark: self.opts.light;
  };

  AutoColor.prototype.isLight = function (rgb) {
    // YIQ equation from http://24ways.org/2010/calculating-color-contrast
    var yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) /1000;

    return yiq > 128;
  };

  AutoColor.prototype.hslToRgb = function(hsl) {
    var self = this,
        t1, t2, 
        r, g, b, 
        hue, sat, light;

    hue = hsl[0] / 60;;
    sat = hsl[1] > 1 ? hsl[1] / 100 : hsl[1];
    light = hsl[2] > 1 ? hsl[2] / 100 : hsl[2];

    if ( light <= 0.5 ) {
      t2 = light * (sat + 1);
    } else {
      t2 = light + sat - (light * sat);
    }

    t1 = light * 2 - t2;
    r = self.hueToRgb(t1, t2, hue + 2) * 255;
    g = self.hueToRgb(t1, t2, hue) * 255;
    b = self.hueToRgb(t1, t2, hue - 2) * 255;

    return [r, g, b];
  };

  AutoColor.prototype.hueToRgb = function(t1, t2, hue) {
    self = this;

    if (hue < 0) {
      hue += 6;
    }

    if (hue >= 6) {
      hue -= 6;
    }
    
    if (hue < 1) {
      return (t2 - t1) * hue + t1;
    }

    if (hue < 3) {
      return t2;
    }

    if (hue < 4) {
      return (t2 - t1) * (4 - hue) + t1;
    }
     
    return t1;
  };

  // A plugin wrapper around the constructor, 
  // preventing against multiple instantiations 
  $.fn.autoColor = function (opts) { 
    return this.each(function () { 
      var $this = $(this),
          autoColor =  $this.data("autoColor");
      if (autoColor) { 
        autoColor.config(opts);
      } else {
        $this.data("autoColor", new AutoColor(this, opts)); 
      } 
    }); 
  };

  // Enable declarative widget instanziation 
  $(".jqAutoColor").livequery(function() {
    $(this).autoColor();
  });

})(jQuery);
