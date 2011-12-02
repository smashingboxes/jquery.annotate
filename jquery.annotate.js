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

    "use strict";
    
    $.fn.annotate = function(method) {

        var helpers = {
            
            get_menu : function() {
                return $("#" + $.fn.annotate.settings.menuID);
            },

            show_menu: function(x, y, duration) {
                helpers.get_menu().fadeIn(duration||100).css({ top: y, left: x  });
            },
            
            hide_menu: function(duration) {
                helpers.get_menu().fadeOut(duration||25);
            }
            
        };

        var methods = {

            init : function(options) {
                
                this.annotate.settings = $.extend({}, this.annotate.defaults, options);
                
                var fn = this;

                return this.each(function() {
                    
                    var $element = $(this), // reference to the jQuery version of the current DOM element
                    element = this;      // reference to the actual DOM element

                    // Store the menu ID value
                    var menuID = fn.annotate.settings.menuID;

                    // ---------------------------------------------------------------------------------------------------- //
                    // Citation Behaviors
                    // ---------------------------------------------------------------------------------------------------- //

                    //-- Popups on cite click
                    $("mark cite").live('click', function() {

                        var $comment = $(this).parent();
                        
                        if ($comment.hasClass("selected")) {
                            $comment.removeClass("selected");   
                        } else {
                            $comment.addClass("selected");  
                        }
                    });


                    // ---------------------------------------------------------------------------------------------------- //
                    // Context Menu Behaviors
                    // ---------------------------------------------------------------------------------------------------- //
                    
                    //-- Disable the default context menu for the chosen element
                    $element.attr("oncontextmenu", "return false;");              
                    
                    //-- Show menu
                    $(".annotation").mouseup(function(e) {

                        //-- e.which indicates the part of the mouse clicked
                        //-- 3 represents a right click
                        if (e.which === 3) {
                            helpers.show_menu(e.pageX, e.pageY);
                        }
                    });

                    //-- Hide menu on body click
                    $element.click(function() {
                        helpers.hide_menu();
                    });
                    
                    //-- Add menu DOM element
                    var menu = $("<menu><ul></ul></menu>");
                    
                    $(menu).attr("id", menuID);
                    
                    $.each(fn.annotate.settings.menuItems, function(i, d) {
                        var item = $("<li></li>").attr({ 
                            'data-type':  i,
                            'class': 'create' + i
                        }).html(d);
                        
                        $(menu).children("ul").append(item);
                    });                    
                    
                    menu.appendTo($element);

                    
                    // ---------------------------------------------------------------------------------------------------- //
                    // Generate Comments
                    // ---------------------------------------------------------------------------------------------------- //
                    
                    //-- Inline comment generator
                    $("#" + menuID).find("li").mousedown(function(e) {
                        
                        e.preventDefault();

                        var selection = window.getSelection(),
                        node = selection.anchorNode,
                        range = Math.abs(selection.focusOffset - selection.anchorOffset),

                        text = selection.anchorNode.textContent,
                        locale = "",
                        data = {},

                        type = $(this).attr('data-type') || "",
                        
                        //-- Check direction
                        direction = (selection.anchorOffset < selection.focusOffset) ? "ltr" : "rtl",

                        //-- Check if the selection is within the same node
                        multiSelect = (selection.anchorNode !== selection.focusNode) ? selection : false;

                        //-- Prevent selections with no range from doing anything
                        //-- Prevent the context menu from accidently being selected
                        if (range === 0 || node === $(this)) {
                            return false;
                        }
                        
                        //-- Take appropriate action
                        if (direction === 'ltr') {

                            data = {
                                index   : $("mark").length + 1,
                                start   : selection.anchorOffset,
                                end     : selection.focusOffset,
                                ref     : text.substr(selection.anchorOffset, range),
                                comment : ""
                            };

                        } else if (direction === 'rtl') {

                            data = {
                                index   : $("mark").length + 1,
                                start   : selection.focusOffset,
                                end     : selection.anchorOffset,
                                ref     : text.substr(selection.focusOffset, range),
                                comment : ""
                            };

                        }
                        
                        
                        // If the selection contains differences, highlight both, but associate the popup comment with both
                        if (multiSelect) {

                            var startNode = (direction === "rtl") ? multiSelect.anchorNode : multiSelect.focusNode,
                                   endNode = (direction === "rtl") ? multiSelect.focusNode : multiSelect.anchorNode,

                                   startBase = startNode.textContent.toString(),
                                   endBase = endNode.textContent.toString(),
                                  
                                   startNodeText = {},
                                   endNodeText = {};

                            if (direction === "rtl") {

                                // Starter text 
                                startNodeText = {
                                    pre     : startBase.substr(0, multiSelect.anchorOffset),
                                    mark : startBase.substr(multiSelect.anchorOffset, startBase.length),
                                    post  : ""
                                };

                                // End text 
                                endNodeText = {
                                    pre     : "",
                                    mark  : endBase.substr(0, multiSelect.focusOffset),
                                    post   : endBase.substr(multiSelect.focusOffset, endBase.length)
                                };

                            } else {

                                // Starter text 
                                startNodeText = {
                                    pre     : startBase.substr(0, multiSelect.focusOffset),
                                    mark  : startBase.substr(multiSelect.focusOffset, startBase.length),
                                    post   : ""
                                };                                

                                // End text 
                                endNodeText = {
                                    pre     : "",
                                    mark    : endBase.substr(0, multiSelect.anchorOffset),
                                    post   : endBase.substr(multiSelect.anchorOffset, endBase.length)
                                };

                            }
                            
                            // Rerender the start node
                            startNode.textContent = startNodeText.pre;

                            // Insert the start node marker:           
                            var startMark = document.createElement('mark');
                            startMark.setAttribute('class', type);
                            startMark.innerHTML = "<cite>" + data.index + "</cite>" + startNodeText.mark + '<div class="comment-popup"><p contenteditable="true">' + fn.annotate.settings.defaultComment + '</p></div>';
                            $(startNode).after(startMark);

                            // Add any possible text afterward:
                            $(startMark).after( document.createTextNode( startNodeText.post ));
                            

                            // Rerender the end node
                            endNode.textContent = endNodeText.pre;

                            // Rerender the end node
                            // Insert the marker at the beginning of the document:           
                            var endMark = document.createElement('mark');
                            endMark.setAttribute('class', type);
                            endMark.innerHTML = endNodeText.mark;
                            
                            // Add the marker
                            $(endNode).before(endMark);
                            
                            // Replace the text after the marker:
                            $(endMark).after(document.createTextNode( endNodeText.post ));

                        } else {
                            
                            // Replace the text before the marker appears:
                            node.textContent = text.substr(0, data.start);
                            
                            // Insert the marker:           
                            var mark = document.createElement('mark');
                            mark.setAttribute('class', type);
                            mark.innerHTML = "<cite>" + data.index + "</cite>" + data.ref + '<div class="comment-popup"><p contenteditable="true">' + fn.annotate.settings.defaultComment + '</p></div>';

                            // Add the marker
                            $(node).after(mark);

                            // Replace the text after the marker:
                            $(mark).after( document.createTextNode( text.substr(data.end, text.length) ) );
                            
                        }
                        
                        // Now that everything is done, hide the menu
                        helpers.hide_menu();
                                                             
                    });

                });

            }

        };

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method "' +  method + '" does not exist in pluginName plugin!');
        }

    };

    $.fn.annotate.defaults = {

        menuID: "context-menu",
        
        defaultComment : 'Please enter a comment',

        menuItems: {
            comment: 'Comment',
            issue: 'Issue',
            notice: 'Notice'
        }
    };

    $.fn.annotate.settings = {};

})(jQuery);
