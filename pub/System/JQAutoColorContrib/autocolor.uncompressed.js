/*
 * jQuery auto-color plugin 1.01
 *
 * Copyright (c) 2018-2019 Michael Daum http://michaeldaumconsulting.com
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
        target: undefined,
        property: undefined, 
        saturation: [50,65,80],
        lightness:  [35,50,65,80],
        hueFrom: 0,
        hueTo: 359,
        light: '#fff',
        dark: '#222',
        seed: '0'
      };

  // The actual plugin constructor 
  function AutoColor(elem, opts) { 
    var self = this;

    self.elem = $(elem); 

    // gather opts by merging global defaults, plugin defaults and element defaults
    self.opts = $.extend({}, defaults, self.elem.data(), opts); 
    self.init(); 
  } 

  AutoColor.prototype.config = function(opts) {
    var self = this;

    $.extend(self.opts, opts);
    self.init();
  };

  AutoColor.prototype.init = function () { 
    var self = this, text, hsl;

    if (typeof(self.opts.text) !== 'undefined') {
      text = self.opts.text;
    } else if (typeof(self.opts.source) !== 'undefined') {
      text = $.map(self.elem.find(self.opts.source), function(elem) { 
        return $(elem).text(); 
      }).join(" ");
    } else {
      text = self.elem.text();
    }

    if (typeof(self.opts.target) !== 'undefiend') {
      self.target = self.elem.find(self.opts.target);
    } 

    if (typeof(self.target) === 'undefined' || self.target.length == 0) {
      self.target = self.elem;
    }

    text = text.replace(/^\s*|\s*$/g, "");

    if (!text.length) {
      return;
    }

    hsl = self.formatHSL(self.getHSL(text));

    //console.log("text=",text,"hash=",self.getHash(text),"hue=",self.getHue(self.getHash(text)));

    if (self.opts.property) {
      self.target.css(self.opts.property, hsl);
    } else {
      self.target
	.addClass("jqAutoColor")
        .css("background", hsl)
        .css("color", self.getMatchingForeground());
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

  AutoColor.prototype.formatHSL = function(hsl) {
    return "hsl("+hsl[0]+","+hsl[1]+"%,"+hsl[2]+"%)";
  };

  AutoColor.prototype.getMatchingForeground = function() {
   var self = this,
       bg = self.target.css("background-color"),
       rgb = bg.match(/\d+/g),
       o = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) /1000);

    return o > 125 ? self.opts.dark: self.opts.light;
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
