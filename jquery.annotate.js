/*
 * jQuery Annotate
  *
 * A simple way to add Google Document style annotations to any DOM element
 * version 0.7
 * 
 * Author: Nate Hunzaker
 * Copyright (c) 2011 Nate Hunzaker
 *
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

(function($) {

    $.fn.annotate = function(method) {

        var methods = {

            init : function(options) {

                this.annotate.settings = $.extend({}, this.annotate.defaults, options);
                
                var fn = this;

                return this.each(function() {
                    
                    var $element = $(this), // reference to the jQuery version of the current DOM element
                         element = this;      // reference to the actual DOM element
                    
                    //-- Add menu DOM element
                    var menu = "";
                    menu += '<menu class="annotation"><ul>'
                    
                    $.each(fn.annotate.settings.menuItems, function(i, d) {
                        menu += '<li data-type="' + i +'" class="create' + i + '">' + d + '</li>';
                    });

                    $("body").append(menu);

                    //-- Popups on cite click
                    $("mark cite").live('click', function() {
                        var $comment = $(this).parent();
                        
                        if ($comment.hasClass("selected")) {
                            $comment.removeClass("selected");   
                        } else {
                            $comment.addClass("selected");  
                        }
                    });

                    //-- Show menu
                    $(".annotation").mouseup(function(e) {

                        //-- e.which indicates the part of the mouse clicked
                        //-- 3 represents a right click
                        if (e.which === 3) {
                            $("menu.annotation").fadeIn(100).css({ top: e.pageY, left: e.pageX });
                        }
                    });

                    //-- Prevent deselect of text
                    $("menu.annotation").mousedown(function(e) {
                        e.preventDefault();
                    });

                    //-- Hide menu on body click
                    $("body").click(function() {
                        $("menu.annotation").fadeOut(0);
                    });

                    // Inline comment generator
                    $("menu.annotation li").click(function() {

                            var selection = window.getSelection(),
                                node = selection.anchorNode,
                                range = Math.abs(selection.focusOffset - selection.anchorOffset),

                                text = selection.anchorNode.textContent,
                                locale = "",
                                data = {},

                                type = $(this).attr('data-type') || "",
                            
                                // Check direction
                                direction = (selection.anchorOffset < selection.focusOffset) ? "ltr" : "rtl";

                            // Prevent selections with no range from doing anything
                            if (range == 0) {
                                return false;
                            }
                            
                            // Take appropriate action
                            if (direction === 'ltr') {
                                    
                                locale = text.substr(selection.anchorOffset, range);
                                
                                data = ({
                                    index   : $("mark").length + 1,
                                    start   : selection.anchorOffset,
                                    end     : selection.focusOffset,
                                    ref     : locale,
                                    comment : ""
                                });

                            } else if (direction === 'rtl') {

                                locale = text.substr(selection.focusOffset, range);
                                
                                data = ({
                                    index   : $("mark").length + 1,
                                    start   : selection.focusOffset,
                                    end     : selection.anchorOffset,
                                    ref     : locale,
                                    comment : "",
                                });

                            };
                            
                            // Set the pretext:
                            node.textContent = text.substr(0, data.start);
                            
                            // Insert the marker:           
                            var mark = document.createElement('mark');
                            mark.setAttribute('class', type);
                            mark.innerHTML = "<cite>" + data.index + "</cite>" + data.ref + '<div class="comment-popup"><p contenteditable="true">' + fn.annotate.settings.defaultComment + '</p></div>';
                            
                            // Set the posttext:
                            var end = document.createTextNode( text.substr(data.end, text.length) );

                            // Render remaining elements
                            $(node).after(mark);
                            $(mark).after(end);
                        });
                    });

            },

            // a public method. for demonstration purposes only - remove it!
            foo_public_method: function() {
                // code goes here
            }

        }

        var helpers = {
            foo_private_method: function() {
                // code goes here
            }
        }

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method "' +  method + '" does not exist in pluginName plugin!');
        }

    }

    $.fn.annotate.defaults = {
        defaultComment : 'Please enter a comment',
        menuItems: {
            comment: 'Comment',
            issue: 'Issue',
            notice: 'Notice'
        }
    }

    $.fn.annotate.settings = {}

})(jQuery);